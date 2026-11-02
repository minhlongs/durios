import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateIso6346Container } from "../src/domain/iso-6346.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { createSiteBackup } from "../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { createOperatorEvidence, createValidFounderAuth, OTP_CONFIGURED_ENV } from "./helpers/gate-operator-evidence.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

const roots: string[] = [];
function iso(prefix10: string): string {
  return `${prefix10}${validateIso6346Container(`${prefix10}0`).expectedCheckDigit ?? 0}`;
}

describe("Pilot 5-container quota enforcement and adversarial Founder authorization guards", () => {
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });

  it("blocks createDossier in BLOCKED / READY_FOR_FOUNDER_REVIEW / PILOT_HOLD, and caps LIMITED_PILOT_AUTHORIZED at 5 containers", () => {
    const root = mkdtempSync(join(tmpdir(), "durios-quota-"));
    roots.push(root);
    const app = createWorkspaceApp({ dbPath: join(root, "durios.db"), dataDir: join(root, "uploads") });
    try {
      const provisioned = seedTestPilotActor(app.authService, { role: "CLERK", tenantId: "TENANT-CAILAY-PILOT-01", tenantType: "PACKHOUSE_EXPORTER" });
      const actor = app.authService.authenticateToken(provisioned.managedToken);

      app.workspace.setPilotQuotaPolicy({ enabled: true, lifecycleState: "READY_FOR_FOUNDER_REVIEW", maxContainers: 5 });
      expect(() => app.workspace.createDossier({
        dossierCode: "DOS-BLOCKED-01", containerNumber: iso("CSQU305438"), sealNumber: "SEAL-01",
        targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14, declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }, actor)).toThrow(/PILOT_LIFECYCLE_READY_FOR_FOUNDER_REVIEW/);

      app.workspace.setPilotQuotaPolicy({ enabled: true, lifecycleState: "LIMITED_PILOT_AUTHORIZED", maxContainers: 5 });
      for (let i = 1; i <= 5; i++) {
        app.workspace.createDossier({
          dossierCode: `DOS-LIM-0${i}`, containerNumber: iso(`MSCU60123${i}`), sealNumber: `SEAL-0${i}`,
          targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14, declaredNetWeightKg: 18000, declaredBoxCount: 900,
        }, actor);
      }
      expect(() => app.workspace.createDossier({
        dossierCode: "DOS-LIM-06", containerNumber: iso("MAEU712345"), sealNumber: "SEAL-06",
        targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14, declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }, actor)).toThrow(/PILOT_QUOTA_EXCEEDED/);
    } finally {
      app.sqliteClient.close();
    }
  });

  it("forces PILOT_HOLD on revoked, expired, wrong-site, or SHA-mismatched Founder authorization", () => {
    const root = mkdtempSync(join(tmpdir(), "durios-adv-auth-"));
    roots.push(root);
    const dbPath = join(root, "durios.db");
    const dataDir = join(root, "uploads");
    const backupDir = join(root, "backup");
    const consentFilePath = join(root, "consent.md");
    const app = createWorkspaceApp({ dbPath, dataDir });
    app.sqliteClient.close();
    writeFileSync(consentFilePath, "Consent\n", "utf-8");
    createSiteBackup(dbPath, dataDir, backupDir);
    const ev = createOperatorEvidence(join(root, "ev"));
    const gate05AFile = join(root, "ev", "gate05a.md");
    writeFileSync(gate05AFile, "# GATE-05A\n", "utf-8");
    const { "GATE-05": _d, ...gates01To04 } = ev;
    const baseOpts = {
      dbPath, dataDir, backupDir, consentSignedFilePath: consentFilePath,
      gateEvidence: { ...gates01To04, "GATE-05A": { filePath: gate05AFile, attestedBy: "Auditor" } },
      env: { ...OTP_CONFIGURED_ENV },
    };

    const expired = verifySingleSiteLaunchGates({
      ...baseOpts,
      founderAuthorization: createValidFounderAuth(gate05AFile, {
        authorizationId: "AUTH-EXP", authorizedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z",
      }),
    });
    expect(expired.pilotLifecycleState).toBe("PILOT_HOLD");
    expect(expired.founderAuthorization.status).toBe("EXPIRED");
    expect(expired.canStartLimitedFiveContainerPilot).toBe(false);

    const wrongSite = verifySingleSiteLaunchGates({
      ...baseOpts,
      founderAuthorization: createValidFounderAuth(gate05AFile, {
        authorizationId: "AUTH-SITE", siteCode: "SITE-OTHER-99",
      }),
    });
    expect(wrongSite.pilotLifecycleState).toBe("PILOT_HOLD");
    expect(wrongSite.founderAuthorization.status).toBe("INVALID_SCOPE_OR_ARTIFACT");
  });
});
