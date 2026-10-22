import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";

const DIR = join(process.env.TMPDIR ?? "/tmp", "gate01-attestation-test");
const NO_BACKUP = join(DIR, "absent-backup-dir");
const CONSENT = join(DIR, "signed-consent.pdf");

function evaluate(consentVerified: boolean) {
  const report = verifySingleSiteLaunchGates({
    consentSignedFilePath: CONSENT, consentVerified, backupDir: NO_BACKUP,
  });
  const g = report.gates.find((x) => x.gateId === "GATE-01");
  if (!g) throw new Error("GATE-01 missing");
  return g;
}

describe("GATE-02 configuration is not proof of a live channel", () => {
  it("does not claim the channel was proven to deliver", () => {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(CONSENT, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)", "utf-8");
    const report = verifySingleSiteLaunchGates({
      consentSignedFilePath: CONSENT,
      backupDir: NO_BACKUP,
      env: {
        DURIOS_OTP_PROVIDER: "ESMS",
        DURIOS_OTP_API_URL: "https://rest.esms.vn/otp",
        DURIOS_OTP_API_KEY: "LIVE_KEY_01",
      },
    });
    const g2 = report.gates.find((g) => g.gateId === "GATE-02");
    expect(g2?.passed).toBe(true);
    expect(g2?.detail).toContain("chưa chứng minh gửi-nhận OTP thật");
    rmSync(DIR, { recursive: true, force: true });
  });
});

describe("GATE-01 auditor attestation", () => {  it("stays closed without an auditor attestation even when a consent file is present", () => {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(CONSENT, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)", "utf-8");

    const g = evaluate(false);

    expect(g.passed).toBe(false);
    expect(g.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
  });

  it("opens only when an auditor attests the signed original", () => {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(CONSENT, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)", "utf-8");

    const g = evaluate(true);

    expect(g.passed).toBe(true);
    expect(g.statusLabel).toBe("PASS");
    expect(g.detail).toContain("Kiểm toán viên");
    rmSync(DIR, { recursive: true, force: true });
  });
});

  it("attributes a PASS to the attesting auditor", () => {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(CONSENT, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)", "utf-8");
    const report = verifySingleSiteLaunchGates({
      consentSignedFilePath: CONSENT, consentVerified: true,
      consentVerifiedByName: "Trần Văn Quản Lý", backupDir: NO_BACKUP,
    });
    const g = report.gates.find((x) => x.gateId === "GATE-01");
    expect(g?.passed).toBe(true);
    expect(g?.detail).toContain("Trần Văn Quản Lý");
    rmSync(DIR, { recursive: true, force: true });
  });
