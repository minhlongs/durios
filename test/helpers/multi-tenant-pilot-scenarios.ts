import { expect } from "bun:test";
import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../../src/server/http-router.js";
import type { AuthenticatedActor } from "../../src/domain/types.js";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";
import { seedTestPilotActor } from "./auth-test-helper.js";

interface GrantCreatedPayload { grant: { id: string; granteeTenantId: string } }
interface OrganicCreatedPayload { evidence: { issuerClaimedStatus: string; duriosRecordStatus: string; regulatoryDisclaimer: string } }
interface OrganicListPayload { evidence: unknown[] }

export function makeMultiTenantActor(
  tenantId: string,
  role: "CLERK" | "MANAGER" | "ADMIN" | "AUDITOR" | "VIEWER",
  name = "Test User"
): AuthenticatedActor {
  const persona =
    role === "MANAGER" || role === "ADMIN" ? "PACKHOUSE_MANAGER"
    : role === "AUDITOR" ? "SYSTEM_AUDITOR"
    : role === "VIEWER" ? "BUYER_VIEWER" : "PACKHOUSE_CLERK";
  const tenantType =
    role === "AUDITOR" ? "INSPECTION_AUDITOR"
    : role === "VIEWER" ? "BUYER_IMPORTER" : "PACKHOUSE_EXPORTER";
  return { id: `ACTOR-${tenantId}-${role}`, name, tenantId, tenantType, role, persona };
}

export function runOrganicEvidenceWorkspaceScenario(): void {
  const ws = new ContainerDossierWorkspace();
  const manager = makeMultiTenantActor("TENANT-A", "MANAGER");

  const dossier = ws.createDossier(
    {
      dossierCode: "DOS-ORG-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-005",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    manager
  );

  const evidence = ws.organicEvidenceManager.recordEvidence(
    dossier,
    {
      certifierName: "Demo Bio-Inspect Vietnam (Synthetic)", certifierAccreditationNumber: "DEMO-ACC-998",
      certificateNumber: "DEMO-ORG-892147-2026", standardCode: "USDA_NOP_EQUIVALENT",
      standardDescription: "USDA National Organic Program Equivalent", certifiedScope: "Fresh Organic Durian Ri6 & Monthong",
      validFrom: "2026-03-01T00:00:00.000Z", validTo: "2027-02-28T23:59:59.000Z",
      issuingDate: "2026-03-01", issuerClaimedStatus: "CERTIFIED",
    },
    manager,
    ws.auditLedger
  );

  expect(evidence.id.startsWith("ORG-")).toBe(true);
  expect(evidence.issuerClaimedStatus).toBe("CERTIFIED");
  expect(evidence.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(evidence.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);

  const evidenceList = ws.organicEvidenceManager.listEvidenceForDossier(dossier.id, true);
  expect(evidenceList.length).toBe(1);
  expect(evidenceList[0]?.certificateNumber).toBe("DEMO-ORG-892147-2026");

  const events = ws.auditLedger.getEventsForDossier(dossier.id, "TENANT-A");
  expect(events.some((e) => e.eventType === "ORGANIC_EVIDENCE_RECORDED")).toBe(true);
}

export async function runMultiTenantHttpRouterScenario(): Promise<void> {
  const ws = new ContainerDossierWorkspace();
  const admin = makeMultiTenantActor("TENANT-A", "ADMIN");
  const adminSeeded = seedTestPilotActor(ws.authService, { id: admin.id, actorName: admin.name, tenantId: "TENANT-A", role: "ADMIN" });
  const managerSeeded = seedTestPilotActor(ws.authService, { tenantId: "TENANT-A", role: "MANAGER" });
  const viewerSeeded = seedTestPilotActor(ws.authService, { tenantId: "TENANT-A", role: "VIEWER" });

  const dossier = ws.createDossier(
    {
      dossierCode: "DOS-HTTP-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-006",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    admin
  );

  const grantRes = await routeHttpRequest(
    ws,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}/shares`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminSeeded.sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({
        granteeTenantId: "TENANT-CUSTOMS", purpose: "CUSTOMS_INSPECTION",
        scope: "READ_ONLY", expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    })
  );
  expect(grantRes.status).toBe(201);
  const grantData = (await grantRes.json()) as GrantCreatedPayload;
  expect(grantData.grant.granteeTenantId).toBe("TENANT-CUSTOMS");

  expect(
    (await routeHttpRequest(ws, new Request(`http://localhost:3000/api/dossiers/${dossier.id}/shares`, { headers: { Authorization: `Bearer ${adminSeeded.sessionToken}` } }))).status
  ).toBe(200);

  const revokeRes = await routeHttpRequest(
    ws,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}/shares/${grantData.grant.id}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminSeeded.sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "Inspection concluded" }),
    })
  );
  expect(revokeRes.status).toBe(200);

  const organicRes = await routeHttpRequest(
    ws,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}/organic-evidence`, {
      method: "POST",
      headers: { Authorization: `Bearer ${managerSeeded.sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({
        certifierName: "Demo Bio-Inspect Agency (Synthetic)", certificateNumber: "DEMO-ORG-9999",
        standardCode: "EU_ORGANIC_2018_848", standardDescription: "EU Regulation 2018/848",
        certifiedScope: "Export Durian", validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2027-12-31T23:59:59.000Z", issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
      }),
    })
  );
  expect(organicRes.status).toBe(201);
  const orgData = (await organicRes.json()) as OrganicCreatedPayload;
  expect(orgData.evidence.issuerClaimedStatus).toBe("CERTIFIED");
  expect(orgData.evidence.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(orgData.evidence.regulatoryDisclaimer).toBeDefined();

  const getOrgRes = await routeHttpRequest(
    ws,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}/organic-evidence`, {
      headers: { Authorization: `Bearer ${viewerSeeded.sessionToken}` },
    })
  );
  expect(getOrgRes.status).toBe(200);
  expect(((await getOrgRes.json()) as OrganicListPayload).evidence.length).toBe(1);
}
