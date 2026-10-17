import { expect } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../../src/server/server.js";
import type { WorkspaceAppInstance } from "./sqlite-sharing-5a3-v4-upgrade.js";

export function runAtomicRollbackAndScopingScenario(): void {
  const tempDir = mkdtempSync(join(tmpdir(), "durios-5a3-tx-"));
  const txDbPath = join(tempDir, "tx-test.db");
  const txUploads = join(tempDir, "uploads");
  let app: WorkspaceAppInstance | null = null;

  try {
    app = createWorkspaceApp({ dbPath: txDbPath, dataDir: txUploads });
    const ownerMgr = {
      id: "ACT-TX-MGR",
      name: "Manager A",
      tenantId: "TEN-A",
      tenantType: "PACKHOUSE_EXPORTER" as const,
      role: "MANAGER" as const,
      persona: "PACKHOUSE_MANAGER" as const,
    };

    const dossier = app.workspace.createDossier(
      {
        dossierCode: "DOS-TX-5A3",
        containerNumber: "MSKU1234565",
        sealNumber: "SEAL-TX",
        targetMarket: "CN",
        borderGate: "Huu Nghi",
        targetTemperatureC: 14.0,
        declaredNetWeightKg: 18000,
        declaredBoxCount: 900,
      },
      ownerMgr
    );

    const failingAuditLedger = {
      recordEvent: () => {
        throw new Error("Simulated mid-transaction audit ledger failure");
      },
      getEventsForDossier: () => [],
      getAllEvents: () => [],
      verifyIntegrity: () => true,
    };

    // 1. grantAccess failure mid-transaction rolls back INSERT INTO share_grants
    expect(() =>
      app!.workspace.shareManager.grantAccess(
        dossier,
        "TEN-B",
        "CUSTOMS_INSPECTION",
        "READ_ONLY",
        new Date(Date.now() + 3600_000).toISOString(),
        ownerMgr,
        failingAuditLedger
      )
    ).toThrow("Simulated mid-transaction audit ledger failure");

    const grantCountAfterFail = app.sqliteClient.db
      .query<{ c: number }, [string]>("SELECT COUNT(*) as c FROM share_grants WHERE dossier_id = ?")
      .get(dossier.id)!.c;
    expect(grantCountAfterFail).toBe(0);

    // 2. Valid grant succeeds, then revokeAccess failure mid-transaction rolls back UPDATE share_grants
    const validGrant = app.workspace.shareManager.grantAccess(
      dossier,
      "TEN-B",
      "CUSTOMS_INSPECTION",
      "READ_ONLY",
      new Date(Date.now() + 3600_000).toISOString(),
      ownerMgr,
      app.workspace.auditLedger
    );
    expect(validGrant.isRevoked).toBe(false);

    expect(() =>
      app!.workspace.shareManager.revokeAccess(
        validGrant.id,
        dossier,
        "Should rollback",
        ownerMgr,
        failingAuditLedger
      )
    ).toThrow("Simulated mid-transaction audit ledger failure");

    const grantRowAfterRevokeFail = app.sqliteClient.db
      .query<{ is_revoked: number; revoked_at: string | null }, [string]>(
        "SELECT is_revoked, revoked_at FROM share_grants WHERE id = ?"
      )
      .get(validGrant.id)!;
    expect(grantRowAfterRevokeFail.is_revoked).toBe(0);
    expect(grantRowAfterRevokeFail.revoked_at).toBeNull();

    // 3. recordEvidence failure mid-transaction rolls back INSERT INTO organic_evidence
    const validEvidenceInput = {
      certifierName: "Demo Bio-Inspect Agency (Synthetic)",
      certificateNumber: "DEMO-ORG-TX-01",
      standardCode: "TCVN_11041" as const,
      standardDescription: "TCVN 11041",
      certifiedScope: "Durian Lot TX",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      issuingDate: "2026-01-01",
      issuerClaimedStatus: "CERTIFIED" as const,
    };

    expect(() =>
      app!.workspace.organicEvidenceManager.recordEvidence(
        dossier,
        validEvidenceInput,
        ownerMgr,
        failingAuditLedger
      )
    ).toThrow("Simulated mid-transaction audit ledger failure");

    const evidenceCountAfterFail = app.sqliteClient.db
      .query<{ c: number }, [string]>("SELECT COUNT(*) as c FROM organic_evidence WHERE dossier_id = ?")
      .get(dossier.id)!.c;
    expect(evidenceCountAfterFail).toBe(0);

    // 4. Record valid evidence, restart SQLite, and verify getEvidence with tenant scoping
    const recorded = app.workspace.organicEvidenceManager.recordEvidence(
      dossier,
      validEvidenceInput,
      ownerMgr,
      app.workspace.auditLedger
    );

    app.sqliteClient.close();
    app = createWorkspaceApp({ dbPath: txDbPath, dataDir: txUploads });

    expect(app.workspace.organicEvidenceManager.getEvidence(recorded.id, false)?.id).toBeUndefined();
    expect(app.workspace.organicEvidenceManager.getEvidence(recorded.id, true, "TEN-OTHER")).toBeUndefined();
    const fetched = app.workspace.organicEvidenceManager.getEvidence(recorded.id, true, "TEN-A");
    expect(fetched?.id).toBe(recorded.id);
    expect(fetched?.certificateNumber).toBe("DEMO-ORG-TX-01");
  } finally {
    app?.sqliteClient.close();
    app = null;
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  }
}
