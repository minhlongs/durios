import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { createSiteBackup } from "../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { compileStandaloneGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "../src/export/pilot-dossier-pack-compiler.js";
import { formatGoLivePackMarkdown } from "../src/export/pilot-dossier-pack-formatter.js";
import { buildGateSite } from "./helpers/gate-site-fixture.js";
import { createOperatorEvidence, OTP_CONFIGURED_ENV } from "./helpers/gate-operator-evidence.js";
import { seedOperationalGate05Cohort } from "./helpers/operational-cohort-fixture.js";

const roots: string[] = [];
function makeCleanOperationalSite() {
  const root = mkdtempSync(join(tmpdir(), "durios-05ab-clean-"));
  roots.push(root);
  const [dbPath, dataDir, backupDir, consentFilePath] = [join(root, "durios.db"), join(root, "uploads"), join(root, "backup"), join(root, "consent.md")];
  createWorkspaceApp({ dbPath, dataDir }).sqliteClient.close();
  writeFileSync(consentFilePath, "Signed Packhouse Consent\n", "utf-8");
  createSiteBackup(dbPath, dataDir, backupDir);
  const ev = createOperatorEvidence(join(root, "evidence"));
  const gate05AFile = join(root, "evidence", "gate05a-rehearsal-minutes.md");
  writeFileSync(gate05AFile, "# GATE-05A Pre-Cutover Rehearsal Attestation\n5/5 synthetic pass\n", "utf-8");
  return { root, dbPath, dataDir, backupDir, consentFilePath, ev, gate05AFile };
}

describe("Stage 0 GATE-05A / GATE-05B split and 5-state pilot lifecycle", () => {
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });

  it("S1: rehearsal cohort passes 05A machine check but stays BLOCKED with SYNTHETIC_REHEARSAL provenance", () => {
    const target = buildGateSite("rehearsal");
    roots.push(target.root);
    const report = verifySingleSiteLaunchGates(target.options);
    expect(report.gate05Split.gate05A.statusLabel).toBe("PASS_SYNTHETIC_REHEARSAL");
    expect([report.cohortProvenance?.synthetic, report.pilotLifecycleState, report.canStartLimitedFiveContainerPilot, report.goForLiveCustomerData]).toEqual([true, "BLOCKED", false, false]);
  });

  it("S2 & S3: clean operational DB with 0 containers reaches READY_FOR_FOUNDER_REVIEW once GATE-01..04 + 05A are evidenced", () => {
    const s = makeCleanOperationalSite();
    const { "GATE-05": _drop05, ...gates01To04 } = s.ev;
    const without05A = verifySingleSiteLaunchGates({
      dbPath: s.dbPath, dataDir: s.dataDir, backupDir: s.backupDir, consentSignedFilePath: s.consentFilePath, gateEvidence: gates01To04, env: { ...OTP_CONFIGURED_ENV },
    });
    expect([without05A.kpiSummary.totalContainers, without05A.pilotLifecycleState]).toEqual([0, "BLOCKED"]);

    const ready = verifySingleSiteLaunchGates({
      dbPath: s.dbPath, dataDir: s.dataDir, backupDir: s.backupDir, consentSignedFilePath: s.consentFilePath,
      gateEvidence: { ...gates01To04, "GATE-05A": { filePath: s.gate05AFile, attestedBy: "Auditor" } }, env: { ...OTP_CONFIGURED_ENV },
    });
    expect([ready.pilotLifecycleState, ready.policyStatus, ready.gate05Split.gate05A.passed, ready.gate05Split.gate05B.passed, ready.canStartLimitedFiveContainerPilot, ready.goForLiveCustomerData]).toEqual([
      "READY_FOR_FOUNDER_REVIEW", "PENDING_FOUNDER_APPROVAL", true, false, false, false,
    ]);
  });

  it("S3 -> S4: valid Founder authorization unlocks LIMITED_PILOT_AUTHORIZED (max 5), and 5 real containers complete PILOT_COMPLETED", () => {
    const s = makeCleanOperationalSite();
    const { "GATE-05": gate05Ev, ...gates01To04 } = s.ev;
    const authFile = join(s.root, "founder-auth.json");
    writeFileSync(authFile, JSON.stringify({
      authorizationVersion: "1.0.0", authorizationId: "AUTH-CAILAY-001", siteCode: "SITE-CAILAY-TIENGIANG-01",
      tenantId: "TENANT-CAILAY-PILOT-01", authorizedBy: "Founder Minh Long", authorizedAt: "2026-11-01T00:00:00.000Z",
      expiresAt: "2027-11-01T00:00:00.000Z", maxContainers: 5,
    }), "utf-8");

    const limited = verifySingleSiteLaunchGates({
      dbPath: s.dbPath, dataDir: s.dataDir, backupDir: s.backupDir, consentSignedFilePath: s.consentFilePath,
      gateEvidence: { ...gates01To04, "GATE-05A": { filePath: s.gate05AFile, attestedBy: "Auditor" } },
      founderAuthorizationFilePath: authFile, env: { ...OTP_CONFIGURED_ENV },
    });
    expect([limited.pilotLifecycleState, limited.canStartLimitedFiveContainerPilot, limited.liveContainerQuota.remainingContainers, limited.goForLiveCustomerData]).toEqual([
      "LIMITED_PILOT_AUTHORIZED", true, 5, false,
    ]);

    const app = createWorkspaceApp({ dbPath: s.dbPath, dataDir: s.dataDir });
    seedOperationalGate05Cohort(app.workspace, app.authService);
    app.sqliteClient.close();

    const completed = compileStandaloneGoLiveDossierPack("AUD-01", "AUDITOR", {
      dbPath: s.dbPath, dataDir: s.dataDir, backupDir: s.backupDir, consentSignedFilePath: s.consentFilePath,
      gateEvidence: { ...gates01To04, "GATE-05A": { filePath: s.gate05AFile, attestedBy: "Auditor" }, "GATE-05B": gate05Ev },
      founderAuthorizationFilePath: authFile, env: { ...OTP_CONFIGURED_ENV },
    });
    expect([completed.pilotLifecycleState, completed.goForLiveCustomerData, verifyPilotGoLiveDossierPackIntegrity(completed)]).toEqual(["PILOT_COMPLETED", true, true]);
    expect(formatGoLivePackMarkdown(completed)).toContain("GATE-05A");
  });
});