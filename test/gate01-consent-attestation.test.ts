import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";

const DIR = join(process.env.TMPDIR ?? "/tmp", "gate01-attestation-test");
const NO_BACKUP = join(DIR, "absent-backup-dir");
const CONSENT = join(DIR, "signed-consent.pdf");

const CONTENT = "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)";
const AUDITOR = "Trần Văn Quản Lý";

function writeConsent(): string {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(CONSENT, CONTENT, "utf-8");
  return createHash("sha256").update(readFileSync(CONSENT)).digest("hex");
}

function evaluate(consentVerified: boolean, attestedSha256?: string) {
  const report = verifySingleSiteLaunchGates({
    consentSignedFilePath: CONSENT, consentVerified, consentAttestedSha256: attestedSha256,
    backupDir: NO_BACKUP,
  });
  const g = report.gates.find((x) => x.gateId === "GATE-01");
  if (!g) throw new Error("GATE-01 missing");
  return g;
}

describe("GATE-01 auditor attestation", () => {
  afterEach(() => rmSync(DIR, { recursive: true, force: true }));

  it("stays closed without an auditor attestation even when a consent file is present", () => {
    writeConsent();
    const g = evaluate(false);
    expect(g.passed).toBe(false);
    expect(g.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
  });

  it("stays closed for an attestation with no recorded hash", () => {
    writeConsent();
    const g = evaluate(true, undefined);
    expect(g.passed).toBe(false);
  });

  it("opens when an auditor attests the file that is actually there", () => {
    const attested = writeConsent();
    const g = evaluate(true, attested);
    expect(g.passed).toBe(true);
    expect(g.statusLabel).toBe("PASS");
    expect(g.detail).toContain("SHA-256 khớp");
  });

  it("attributes a PASS to the named attesting auditor", () => {
    const attested = writeConsent();
    const report = verifySingleSiteLaunchGates({
      consentSignedFilePath: CONSENT, consentVerified: true,
      consentAttestedSha256: attested, consentVerifiedByName: AUDITOR, backupDir: NO_BACKUP,
    });
    const g = report.gates.find((x) => x.gateId === "GATE-01");
    expect(g?.passed).toBe(true);
    expect(g?.detail).toContain(AUDITOR);
  });
});

  it("drives the whole report to HOLD when the attestation is absent", () => {
    const attested = writeConsent();
    const gates = {
      DURIOS_HOST: "127.0.0.1", DURIOS_OTP_PROVIDER: "ESMS",
      DURIOS_OTP_API_URL: "https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/",
      DURIOS_OTP_API_KEY: "LIVE_KEY_01",
    };
    const attestedRun = verifySingleSiteLaunchGates({
      consentSignedFilePath: CONSENT, consentVerified: true,
      consentAttestedSha256: attested, backupDir: NO_BACKUP, env: gates,
    });
    const bareRun = verifySingleSiteLaunchGates({
      consentSignedFilePath: CONSENT, backupDir: NO_BACKUP, env: gates,
    });
    expect(attestedRun.passedCount).toBe(bareRun.passedCount + 1);
    expect(attestedRun.goForLiveCustomerData).toBe(false);
    expect(bareRun.goForLiveCustomerData).toBe(false);
  });
