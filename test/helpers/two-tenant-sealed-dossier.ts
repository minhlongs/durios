import { expect } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../../src/server/server.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../../src/server/http-router.js";
import type { SharePurpose } from "../../src/domain/pilot-types.js";
import { seedTestPilotActor, type ProvisionedTestActor } from "./auth-test-helper.js";

export const OWNER_TENANT = "TENANT-ISO-A";
export const GRANTEE_TENANT = "TENANT-ISO-B";
export const ISO_CONTAINER = "MSKU1234565";

export interface TwoTenantSealedDossier {
  readonly ws: ContainerDossierWorkspace;
  readonly dossierId: string;
  readonly owner: ProvisionedTestActor;
  readonly grantee: ProvisionedTestActor;
  readonly get: (path: string, actor: ProvisionedTestActor) => Promise<Response>;
  readonly post: (path: string, actor: ProvisionedTestActor, body?: unknown) => Promise<Response>;
}

const syntheticPdf = (name: string): string => Buffer.from(`%PDF-1.5 synthetic ${name}`).toString("base64");

// Each fixture gets its own throwaway SQLite database and blob directory: the sealed
// manifest is only retrievable through the persistent repository, and no test may write
// into the operational ./data directory.
const activeDirs: string[] = [];

/** Removes every throwaway workspace a fixture created. Call from afterEach. */
export function disposeSealedDossierFixtures(): void {
  for (const dir of activeDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
}

const DOCUMENTS = [
  { type: "PACKING_LIST", name: "PackingList.pdf", fields: { container_number: { raw: ISO_CONTAINER }, seal_number: { raw: "SEAL-ISO-1" }, box_count: { raw: "960" }, net_weight_kg: { raw: "18240" }, invoice_value: { raw: "USD 92000" }, unit_price: { raw: "4.85" } } },
  { type: "LAB_TEST_REPORT", name: "LabTestReport.pdf", fields: { cadmium_mg_kg: { raw: "0.010" }, sample_code: { raw: "EF-2026-VN-9082" }, sampling_date: { raw: "2026-10-06" } } },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoCert.pdf", fields: { container_number: { raw: ISO_CONTAINER }, seal_number: { raw: "SEAL-ISO-1" }, phyto_cert_number: { raw: "KDTV-2026-VN-09929" } } },
];

type Versioned = { data: { version: number } };

/**
 * One sealed dossier owned by TENANT-ISO-A and shared READ_ONLY with TENANT-ISO-B,
 * driven entirely over the real HTTP routes.
 *
 * Regression fixture for the two cross-tenant defects: the sealed manifest served to a
 * grantee without redaction, and a shared dossier counted in the grantee tenant's pilot
 * KPI and launch gates. Every value a grantee must not see is present in the source data,
 * so a leak surfaces as a value rather than as a fixture that never had one.
 */
export async function buildTwoTenantSealedDossier(
  purpose: SharePurpose = "BUYER_VERIFICATION"
): Promise<TwoTenantSealedDossier> {
  const dir = mkdtempSync(join(tmpdir(), "durios-tenant-iso-"));
  activeDirs.push(dir);
  const ws = createWorkspaceApp({ dbPath: join(dir, "durios.db"), dataDir: join(dir, "uploads") }).workspace;
  const owner = seedTestPilotActor(ws.authService, { tenantId: OWNER_TENANT, role: "MANAGER" });
  const grantee = seedTestPilotActor(ws.authService, { tenantId: GRANTEE_TENANT, role: "VIEWER", persona: "BUYER_VIEWER", tenantType: "BUYER_IMPORTER" });
  const get = (path: string, actor: ProvisionedTestActor): Promise<Response> => routeHttpRequest(ws, new Request(`http://127.0.0.1${path}`, { headers: { Cookie: actor.sessionCookie } }));
  const post = (path: string, actor: ProvisionedTestActor, body?: unknown): Promise<Response> => routeHttpRequest(ws, new Request(`http://127.0.0.1${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: actor.sessionCookie }, body: JSON.stringify(body ?? {}) }));

  const created = await post("/api/dossiers", owner, {
    dossierCode: "DOS-ISO-001", containerNumber: ISO_CONTAINER, sealNumber: "SEAL-ISO-1", targetMarket: "CN",
    borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18240, declaredBoxCount: 960,
  });
  expect(created.status).toBe(201);
  const createdBody = (await created.json()) as { data: { id: string; version: number } };
  const dossierId = createdBody.data.id;
  let version = createdBody.data.version;

  for (const doc of DOCUMENTS) {
    const up = await post(`/api/dossiers/${dossierId}/documents`, owner, { fileName: doc.name, documentType: doc.type, version, base64Content: syntheticPdf(doc.name), fixtureFields: doc.fields });
    expect(up.status).toBe(201);
    version = ((await up.json()) as Versioned).data.version;
  }

  const detail = (await (await get(`/api/dossiers/${dossierId}`, owner)).json()) as { data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> } };
  for (const doc of detail.data.documents) {
    for (const field of doc.extractedFields) {
      const verified = await post(`/api/dossiers/${dossierId}/documents/${doc.id}/fields/${field.id}/verify`, owner, { confirmedValue: field.rawValue, version });
      expect(verified.status).toBe(200);
      version = ((await verified.json()) as Versioned).data.version;
    }
  }

  const validation = (await (await post(`/api/dossiers/${dossierId}/validate`, owner, { version })).json()) as { data: { status: string; version: number } };
  expect(validation.data.status).toBe("PASSED");
  version = validation.data.version;
  version = ((await (await post(`/api/dossiers/${dossierId}/approve`, owner, { version })).json()) as Versioned).data.version;
  expect((await post(`/api/dossiers/${dossierId}/export`, owner, { version })).status).toBe(200);

  const share = await post(`/api/dossiers/${dossierId}/shares`, owner, {
    granteeTenantId: GRANTEE_TENANT, purpose, scope: "READ_ONLY", expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  expect(share.status).toBe(201);
  return { ws, dossierId, owner, grantee, get, post };
}
