import { expect } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { OtpProviderAdapter } from "../../src/auth/otp-provider.js";
import { runPilotOpsCliArgs } from "../../src/auth/pilot-ops-cli.js";
import {
  createSiteBackup, restoreSiteBackup, verifySiteBackup,
} from "../../src/auth/site-backup-manager.js";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import type {
  StagingDossierView, WorkspaceAppInstance,
} from "./staging-dress-rehearsal-auth-step.js";

interface StagingBackupManifestResult { auditChainValid: boolean; dossierCount: number; documentCount: number; blobs: Array<{ relativePath: string }> }
interface StagingBackupVerificationResult { valid: boolean; errors: string[] }

export interface StagingBackupDrillParams {
  siteA: WorkspaceAppInstance; siteADb: string; siteAUploads: string;
  backupDir: string; tamperedBackupDir: string; restoredDb: string; restoredUploads: string;
  localGatewayOtp: OtpProviderAdapter; liveDossierId: string; mgrCookie: string; buyerRawToken: string;
}

export async function runStagingBackupTamperAndRestoreDrill(
  params: StagingBackupDrillParams
): Promise<void> {
  const {
    siteA, siteADb, siteAUploads, backupDir, tamperedBackupDir,
    restoredDb, restoredUploads, localGatewayOtp, liveDossierId, mgrCookie, buyerRawToken,
  } = params;

  const backupManifest = runPilotOpsCliArgs(
    ["backup-site", "--db", siteADb, "--data-dir", siteAUploads, "--backup-dir", backupDir],
    siteA.authService
  ) as unknown as StagingBackupManifestResult;
  expect(backupManifest.auditChainValid).toBe(true);
  expect(backupManifest.dossierCount).toBe(2);
  expect(backupManifest.documentCount).toBe(7);
  expect(backupManifest.blobs.length).toBe(7);

  const verifyGood = runPilotOpsCliArgs(
    ["verify-backup", "--backup-dir", backupDir], siteA.authService
  ) as unknown as StagingBackupVerificationResult;
  expect(verifyGood.valid).toBe(true);
  expect(verifyGood.errors).toEqual([]);

  createSiteBackup(siteADb, siteAUploads, tamperedBackupDir);
  writeFileSync(join(tamperedBackupDir, "uploads", backupManifest.blobs[0]!.relativePath), "TAMPERED-BLOB-BYTES");

  const verifyTampered = verifySiteBackup(tamperedBackupDir);
  expect(verifyTampered.valid).toBe(false);
  expect(verifyTampered.errors.length).toBeGreaterThan(0);
  expect(() => restoreSiteBackup(tamperedBackupDir, restoredDb, restoredUploads)).toThrow(
    /Refusing to restore invalid or corrupted backup/
  );

  siteA.sqliteClient.close();

  const restoreResult = runPilotOpsCliArgs(
    ["restore-site", "--backup-dir", backupDir, "--target-db", restoredDb, "--target-data-dir", restoredUploads],
    siteA.authService
  ) as unknown as StagingBackupVerificationResult;
  expect(restoreResult.valid).toBe(true);

  const restoredApp = createWorkspaceApp({
    dbPath: restoredDb, dataDir: restoredUploads, otpProvider: localGatewayOtp,
  });

  try {
    const mgrDossierRes = await restoredApp.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}`, { headers: { Cookie: mgrCookie } })
    );
    expect(mgrDossierRes.status).toBe(200);
    const restoredDossier = ((await mgrDossierRes.json()) as { data: StagingDossierView }).data;
    expect(restoredDossier.lifecycleState).toBe("EXPORTED");
    expect(restoredDossier.isImmutable).toBe(true);
    expect(restoredDossier.documents.length).toBe(4);

    const buyerDossierRes = await restoredApp.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}`, {
        headers: { Authorization: `Bearer ${buyerRawToken}` },
      })
    );
    expect(buyerDossierRes.status).toBe(200);
    const buyerView = ((await buyerDossierRes.json()) as { data: StagingDossierView }).data;
    for (const doc of buyerView.documents) {
      expect(doc.storagePath).toBeUndefined();
      for (const f of doc.extractedFields) {
        expect(f.fieldKey).not.toBe("buyer_name");
        expect(f.fieldKey).not.toBe("invoice_value");
      }
    }

    const buyerOrgRes = await restoredApp.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/organic-evidence`, {
        headers: { Authorization: `Bearer ${buyerRawToken}` },
      })
    );
    expect(buyerOrgRes.status).toBe(200);
    const buyerOrgData = (await buyerOrgRes.json()) as {
      evidence: Array<{ duriosRecordStatus: string; regulatoryDisclaimer: string }>;
    };
    expect(buyerOrgData.evidence[0]?.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
    expect(buyerOrgData.evidence[0]?.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);

    const buyerAuditRes = await restoredApp.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/audit`, {
        headers: { Authorization: `Bearer ${buyerRawToken}` },
      })
    );
    expect(buyerAuditRes.status).toBe(403);

    const mutateRestoredRes = await restoredApp.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/validate`, {
        method: "POST", headers: { Cookie: mgrCookie },
      })
    );
    expect(mutateRestoredRes.status).toBe(409);
    expect(((await mutateRestoredRes.json()) as { errorCode: string }).errorCode).toBe("DOSSIER_IMMUTABLE");
  } finally {
    restoredApp.sqliteClient.close();
  }
}
