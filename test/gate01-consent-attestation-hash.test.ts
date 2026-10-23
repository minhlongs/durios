import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyConsentEvidence } from "../src/auth/consent-evidence-verifier.js";

let DIR = "";

beforeEach(() => { DIR = mkdtempSync(join(tmpdir(), "gate01-attestation-hash-test-")); });
const CONSENT = join(DIR, "signed-consent.pdf");
const CONTENT = "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)";
const AUDITOR = "Trần Văn Quản Lý";

function writeConsent(): string {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(CONSENT, CONTENT, "utf-8");
  return createHash("sha256").update(readFileSync(CONSENT)).digest("hex");
}

describe("GATE-01 attestation binds to the attested content", () => {
  afterEach(() => rmSync(DIR, { recursive: true, force: true }));

  it("fails when an attestation is given without a recorded hash", () => {
    writeConsent();
    const g = verifyConsentEvidence(CONSENT, true, AUDITOR, undefined);
    expect(g.passed).toBe(false);
    expect(g.detail).toContain("chưa ghi nhận mã băm");
  });

  it("fails when the file no longer matches the attested hash", () => {
    const attested = writeConsent();
    expect(verifyConsentEvidence(CONSENT, true, AUDITOR, attested).passed).toBe(true);

    writeFileSync(CONSENT, "a different file entirely", "utf-8");

    const swapped = verifyConsentEvidence(CONSENT, true, AUDITOR, attested);
    expect(swapped.passed).toBe(false);
    expect(swapped.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
    expect(swapped.detail).toContain("đã bị thay thế");
  });
});

