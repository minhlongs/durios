import { existsSync, mkdirSync, rmSync } from "node:fs";
import { describe, expect, it } from "bun:test";
import { createWorkspaceApp } from "../src/server/server.js";
import { handleExportWorkspacePortability } from "../src/server/open-core-portability-handler.js";
import { handleSeedAuthenticatedRehearsal } from "../src/server/ecosystem-rehearsal-handler.js";
import { handleGetExportManifest } from "../src/server/export-manifest-handler.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../src/domain/types.js";
import type { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";

const TEST_DB_DIR = "./data/test-http-handler-security";

function resetDir(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const TENANT_A_CLERK: AuthenticatedActor = {
  id: "ACC-PROD-CLERK-A", name: "Clerk Tenant A", tenantId: "TENANT-ALPHA-01",
  tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
};

const TENANT_B_BUYER: AuthenticatedActor = {
  id: "ACC-PROD-BUYER-B", name: "Buyer Tenant B", tenantId: "TENANT-BETA-02",
  tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER",
};

describe("HTTP Handler Security Hardening (Portability, Rehearsal Seeder & Manifest Fail-Closed)", () => {
  it("excludes cross-tenant shared dossiers when exporting workspace portability bundle", async () => {
    resetDir(TEST_DB_DIR);
    try {
      const app = createWorkspaceApp({ dbPath: `${TEST_DB_DIR}/portability.db`, dataDir: `${TEST_DB_DIR}/uploads` });
      const created = app.workspace.createDossier({
        dossierCode: "DOS-ALPHA-OWN-01", containerNumber: "CSQU3054383", sealNumber: "VN-SEAL-1001",
        targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14, declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }, TENANT_A_CLERK);
      app.workspace.shareManager.grantAccess(
        created, TENANT_B_BUYER.tenantId, "BUYER_VERIFICATION", "READ_ONLY",
        new Date(Date.now() + 86400000).toISOString(),
        { ...TENANT_A_CLERK, role: "MANAGER", persona: "PACKHOUSE_MANAGER" }, app.workspace.auditLedger
      );
      expect(app.workspace.listDossiers(TENANT_B_BUYER).length).toBe(1);
      const resp = handleExportWorkspacePortability(app.workspace, TENANT_B_BUYER);
      expect(resp.status).toBe(200);
      const json = (await resp.json()) as { data: { bundle: { payload: { totalDossiersCount: number } } } };
      expect(json.data.bundle.payload.totalDossiersCount).toBe(0);
      app.sqliteClient.close();
    } finally {
      if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  it("blocks handleSeedAuthenticatedRehearsal when DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP is disabled", () => {
    resetDir(TEST_DB_DIR);
    try {
      const app = createWorkspaceApp({ dbPath: `${TEST_DB_DIR}/rehearsal-guard.db`, dataDir: `${TEST_DB_DIR}/uploads` });
      const resp = handleSeedAuthenticatedRehearsal(app.workspace, TENANT_A_CLERK, {
        DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP: "false",
      });
      expect(resp.status).toBe(403);
      expect(app.workspace.listDossiers(TENANT_A_CLERK).length).toBe(0);
      app.sqliteClient.close();
    } finally {
      if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  it("fails closed with 404 in handleGetExportManifest when getDossier returns undefined", () => {
    const fakeManifest = { dossierId: "DOS-GHOST", tenantId: "TENANT-ALPHA-01" } as unknown as DossierExportManifest;
    const stubWorkspace = {
      getExportManifest: (): DossierExportManifest => fakeManifest,
      getDossier: (): ContainerDossier | undefined => undefined,
    } as unknown as ContainerDossierWorkspace;
    const resp = handleGetExportManifest(stubWorkspace, TENANT_B_BUYER, "DOS-GHOST");
    expect(resp.status).toBe(404);
  });
});
