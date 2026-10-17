import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HttpGatewayOtpProvider } from "../../src/auth/otp-provider.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import { provisionAndVerifyStagingAccounts } from "./staging-dress-rehearsal-auth-step.js";
import { runStagingBackupTamperAndRestoreDrill } from "./staging-dress-rehearsal-backup-step.js";
import { runStagingBlindFaultInjectionStep } from "./staging-dress-rehearsal-blind-step.js";
import { runStagingLiveDossierKpiStep } from "./staging-dress-rehearsal-live-step.js";

export async function runSingleSiteStagingDressRehearsalScenario(): Promise<void> {
  const stagingRoot = mkdtempSync(join(tmpdir(), "durios-single-site-staging-"));
  mkdirSync(join(stagingRoot, "site-a"), { recursive: true });
  const siteADb = join(stagingRoot, "site-a", "durios.db");
  const siteAUploads = join(stagingRoot, "site-a", "uploads");
  const backupDir = join(stagingRoot, "backups", "snap-01");
  const tamperedBackupDir = join(stagingRoot, "backups", "snap-tampered");
  const restoredDb = join(stagingRoot, "site-restored", "durios.db");
  const restoredUploads = join(stagingRoot, "site-restored", "uploads");

  let lastDispatchedOtp = "";
  const localGatewayOtp = new HttpGatewayOtpProvider({
    providerName: "ESMS",
    apiUrl: "http://127.0.0.1:39999/mock-otp",
    apiKey: "STAGING_API_KEY",
    secretKey: "STAGING_SECRET_KEY",
    zaloOaId: "OA-CAILAY-STAGING",
    zaloTemplateId: "TPL-OTP-STAGING",
    smsBrandname: "DURIOS_STAGING",
    fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
      const parsed = JSON.parse(String(init?.body ?? "{}")) as {
        otpCode?: string;
        challengeId?: string;
      };
      lastDispatchedOtp = String(parsed.otpCode ?? "");
      return new Response(
        JSON.stringify({
          CodeResult: "100",
          SMSID: `STAGING-OTP-${parsed.challengeId}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch,
  });

  const siteA = createWorkspaceApp({
    dbPath: siteADb,
    dataDir: siteAUploads,
    otpProvider: localGatewayOtp,
  });

  try {
    const authCtx = await provisionAndVerifyStagingAccounts(siteA, () => lastDispatchedOtp);
    await runStagingBlindFaultInjectionStep(siteA, authCtx.clerkOtpCookie, authCtx.mgrCookie);
    const liveDossierId = await runStagingLiveDossierKpiStep(
      siteA,
      authCtx.clerkOtpCookie,
      authCtx.mgrCookie,
      authCtx.futureIso
    );
    await runStagingBackupTamperAndRestoreDrill({
      siteA,
      siteADb,
      siteAUploads,
      backupDir,
      tamperedBackupDir,
      restoredDb,
      restoredUploads,
      localGatewayOtp,
      liveDossierId,
      mgrCookie: authCtx.mgrCookie,
      buyerRawToken: authCtx.buyerRawToken,
    });
  } finally {
    try {
      siteA.sqliteClient.close();
    } catch {
      // Ignore if already closed
    }
    rmSync(stagingRoot, { recursive: true, force: true });
  }
}
