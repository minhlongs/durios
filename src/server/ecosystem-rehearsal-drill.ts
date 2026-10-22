import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createSiteBackup } from "../auth/site-backup-manager.js";
import type { VerifyLaunchGatesOptions } from "../auth/pilot-launch-gate-verifier.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";

export interface FullGatesRehearsalOptions extends VerifyLaunchGatesOptions {
  readonly rehearsalMode: true;
}

export function setupFullGatesRehearsalOptions(
  workspace: ContainerDossierWorkspace
): FullGatesRehearsalOptions {
  const rootDir = mkdtempSync(join(tmpdir(), "durios-full-rehearsal-"));
  const dbPath = join(rootDir, "durios.db");
  const dataDir = workspace.fileStorage?.getStorageRoot() ?? join(rootDir, "uploads");
  const backupDir = join(rootDir, "backup");
  const consentPath = join(rootDir, "rehearsal-pdpl-consent-cailay.pdf");

  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    consentPath,
    "DuriOS Cai Lay Stage-Zero Rehearsal PDPL Consent - Law 91/2025/QH15 - Signed by Packhouse Owner"
  );

  workspace.sqliteClient.db.run(`VACUUM INTO '${dbPath.replace(/'/g, "''")}'`);
  createSiteBackup(dbPath, dataDir, backupDir);

  const rehearsalEnv: Record<string, string | undefined> = {
    ...process.env,
    DURIOS_OTP_PROVIDER: "REHEARSAL_GATE02_PROBE",
    DURIOS_OTP_API_URL: "https://zns.cailay-rehearsal.vn/otp",
    DURIOS_OTP_API_KEY: "rehearsal-probe-staging-key-01",
    DURIOS_HOST: "127.0.0.1",
  };

  return {
    dbPath,
    dataDir,
    backupDir,
    // This is a synthetic rehearsal on an unauthenticated route, so it must not
    // attest consent: a boolean any anonymous caller can trigger is exactly the
    // false green GATE-01 exists to prevent. The rehearsal therefore runs 4 of 5.
    consentSignedFilePath: consentPath,
    env: rehearsalEnv,
    rehearsalMode: true,
  };
}
