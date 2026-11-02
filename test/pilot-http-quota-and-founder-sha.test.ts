import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateIso6346Container } from "../src/domain/iso-6346.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { createSiteBackup } from "../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { createOperatorEvidence, createValidFounderAuth, OTP_CONFIGURED_ENV } from "./helpers/gate-operator-evidence.js";
import { seedOperationalGateSite } from "./helpers/operational-cohort-fixture.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

const roots: string[] = [];
const SAVED_ENV_KEYS = [
  "DURIOS_ENFORCE_PILOT_QUOTA", "DURIOS_GATE01_CONSENT_FILE", "DURIOS_BACKUP_DIR", "DURIOS_HOST", "DURIOS_OTP_PROVIDER",
  "DURIOS_OTP_API_URL", "DURIOS_OTP_API_KEY", "DURIOS_GATE01_EVIDENCE_FILE", "DURIOS_GATE02_EVIDENCE_FILE",
  "DURIOS_GATE03_EVIDENCE_FILE", "DURIOS_GATE04_EVIDENCE_FILE", "DURIOS_GATE05A_EVIDENCE_FILE",
  "DURIOS_GATE_EVIDENCE_ATTESTED_BY", "DURIOS_FOUNDER_PILOT_AUTH_FILE",
] as const;

function iso(prefix10: string): string {
  return `${prefix10}${validateIso6346Container(`${prefix10}0`).expectedCheckDigit ?? 0}`;
}

describe("HTTP /api/v1/dossiers dynamic quota guard, mandatory GATE-05A SHA-256 & zero legacy bypass", () => {
  afterEach(() => {
    for (const k of SAVED_ENV_KEYS) delete process.env[k];
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });

  it("Done-means #1 & #2: POST /api/v1/dossiers blocks unready workspace and enforces 5-container cap in LIMITED_PILOT_AUTHORIZED", async () => {
    const root = mkdtempSync(join(tmpdir(), "durios-http-quota-"));
    roots.push(root);
    const [dbPath, dataDir, backupDir, consentPath] = [join(root, "durios.db"), join(root, "uploads"), join(root, "backup"), join(root, "consent.md")];
    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      const actor = seedTestPilotActor(app.authService, { role: "CLERK", tenantId: "TENANT-CAILAY-PILOT-01", tenantType: "PACKHOUSE_EXPORTER" });
      process.env.DURIOS_ENFORCE_PILOT_QUOTA = "true";
      const postV1 = (idx: number) => app.handler(new Request("http://127.0.0.1/api/v1/dossiers", {
        method: "POST", headers: { "content-type": "application/json", "x-pilot-token": actor.managedToken },
        body: JSON.stringify({ dossierCode: `DOS-HTTP-0${idx}`, containerNumber: iso(`MSCU60123${idx}`), sealNumber: `SEAL-0${idx}` }),
      }));
      const blockedRes = await postV1(1);
      expect([blockedRes.status, ((await blockedRes.json()) as { error: string }).error.includes("PILOT_LIFECYCLE_BLOCKED")]).toEqual([400, true]);

      writeFileSync(consentPath, "Signed Consent\n", "utf-8");
      createSiteBackup(dbPath, dataDir, backupDir);
      const ev = createOperatorEvidence(join(root, "ev"));
      const gate05AFile = join(root, "ev", "gate05a.md");
      writeFileSync(gate05AFile, "# GATE-05A\n", "utf-8");
      Object.assign(process.env, {
        ...OTP_CONFIGURED_ENV, DURIOS_GATE01_CONSENT_FILE: consentPath, DURIOS_BACKUP_DIR: backupDir,
        DURIOS_GATE01_EVIDENCE_FILE: ev["GATE-01"]!.filePath, DURIOS_GATE02_EVIDENCE_FILE: ev["GATE-02"]!.filePath,
        DURIOS_GATE03_EVIDENCE_FILE: ev["GATE-03"]!.filePath, DURIOS_GATE04_EVIDENCE_FILE: ev["GATE-04"]!.filePath,
        DURIOS_GATE05A_EVIDENCE_FILE: gate05AFile, DURIOS_GATE_EVIDENCE_ATTESTED_BY: "Auditor",
      });
      const reviewRes = await postV1(1);
      expect([reviewRes.status, ((await reviewRes.json()) as { error: string }).error.includes("PILOT_LIFECYCLE_READY_FOR_FOUNDER_REVIEW")]).toEqual([400, true]);

      const authFile = join(root, "founder-auth.json");
      writeFileSync(authFile, JSON.stringify(createValidFounderAuth(gate05AFile)), "utf-8");
      process.env.DURIOS_FOUNDER_PILOT_AUTH_FILE = authFile;
      for (let i = 1; i <= 5; i++) expect((await postV1(i)).status).toBe(201);
      const sixthRes = await postV1(6);
      expect([sixthRes.status, ((await sixthRes.json()) as { error: string }).error.includes("PILOT_QUOTA_EXCEEDED")]).toEqual([400, true]);
    } finally {
      app.sqliteClient.close();
    }
  });

  it("Done-means #3 & #4: missing/mismatched gate05AEvidenceSha256 forces PILOT_HOLD, and legacy GATE-05 without Founder auth stops at READY_FOR_FOUNDER_REVIEW", () => {
    const root = mkdtempSync(join(tmpdir(), "durios-sha-legacy-"));
    roots.push(root);
    const [dbPath, dataDir, backupDir, consentPath] = [join(root, "durios.db"), join(root, "uploads"), join(root, "backup"), join(root, "consent.md")];
    seedOperationalGateSite({ dbPath, dataDir, backupDir, consentFilePath: consentPath });
    const ev = createOperatorEvidence(join(root, "ev"));
    const base = { dbPath, dataDir, backupDir, consentSignedFilePath: consentPath, gateEvidence: ev, env: { ...OTP_CONFIGURED_ENV } };

    const legacyWithoutFounder = verifySingleSiteLaunchGates(base);
    expect([legacyWithoutFounder.pilotLifecycleState, legacyWithoutFounder.goForLiveCustomerData]).toEqual(["READY_FOR_FOUNDER_REVIEW", false]);

    const badSha = verifySingleSiteLaunchGates({ ...base, founderAuthorization: createValidFounderAuth(ev["GATE-05"]!.filePath!, { gate05AEvidenceSha256: "0".repeat(64) }) });
    expect([badSha.founderAuthorization.status, badSha.pilotLifecycleState, badSha.goForLiveCustomerData]).toEqual(["INVALID_SCOPE_OR_ARTIFACT", "PILOT_HOLD", false]);

    const missingShaFile = join(root, "founder-missing-sha.json");
    const { gate05AEvidenceSha256: _omit, ...withoutSha } = createValidFounderAuth(ev["GATE-05"]!.filePath!);
    writeFileSync(missingShaFile, JSON.stringify(withoutSha), "utf-8");
    const missingSha = verifySingleSiteLaunchGates({ ...base, founderAuthorizationFilePath: missingShaFile });
    expect([missingSha.founderAuthorization.status, missingSha.pilotLifecycleState, missingSha.goForLiveCustomerData]).toEqual(["INVALID_SCOPE_OR_ARTIFACT", "PILOT_HOLD", false]);
  });
});
