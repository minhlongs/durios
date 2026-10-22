import { describe, expect, it } from "bun:test";
import {
  buildFinancialAttestationToken,
  parseFinancialAttestationPayload,
  verifyFinancialAttestationToken,
  type FinancialAttestationPayload,
} from "../src/saas/financial-attestation-token.js";

const SECRET = "financial-attestation-test-secret";
const NOW = new Date("2026-10-22T09:00:00.000Z");

function payload(overrides: Partial<FinancialAttestationPayload> = {}): FinancialAttestationPayload {
  return {
    dossierId: "DOS-1",
    ownerTenantId: "TENANT-PACKHOUSE-1",
    purpose: "TRADE_FINANCE",
    institutionTenantId: "TENANT-BANK-1",
    issuedAt: NOW.toISOString(),
    expiresAt: new Date(NOW.getTime() + 15 * 60 * 1000).toISOString(),
    nonce: "nonce-1",
    ...overrides,
  };
}

describe("Financial Attestation Token (mint / verify)", () => {
  it("mints a three-segment DURIOS_ATT token that verifies successfully", () => {
    const token = buildFinancialAttestationToken(payload(), SECRET);
    const parts = token.split(".");
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("DURIOS_ATT");
    expect(verifyFinancialAttestationToken(token, SECRET, NOW).valid).toBe(true);
  });

  it("rejects a token signed with a different secret (forgery)", () => {
    const token = buildFinancialAttestationToken(payload(), SECRET);
    const forged = `${token.split(".")[0]}.${token.split(".")[1]}.${"0".repeat(64)}`;
    expect(verifyFinancialAttestationToken(forged, SECRET, NOW).reason).toBe("INVALID_ATTESTATION_SIGNATURE");
  });

  it("rejects a token whose payload was altered after signing (tampering)", () => {
    const token = buildFinancialAttestationToken(payload(), SECRET);
    const swapped = buildFinancialAttestationToken(payload({ purpose: "MARINE_INSURANCE" }), SECRET);
    const tampered = `${token.split(".")[0]}.${swapped.split(".")[1]}.${token.split(".")[2]}`;
    expect(verifyFinancialAttestationToken(tampered, SECRET, NOW).reason).toBe("INVALID_ATTESTATION_SIGNATURE");
  });

  it("rejects an expired token", () => {
    const expired = payload({
      issuedAt: new Date(NOW.getTime() - 30 * 60 * 1000).toISOString(),
      expiresAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
    });
    const token = buildFinancialAttestationToken(expired, SECRET);
    expect(verifyFinancialAttestationToken(token, SECRET, NOW).reason).toBe("ATTESTATION_EXPIRED");
  });

  it("rejects a token issued far in the future (clock-skew guard)", () => {
    const future = payload({
      issuedAt: new Date(NOW.getTime() + 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(NOW.getTime() + 90 * 60 * 1000).toISOString(),
    });
    const token = buildFinancialAttestationToken(future, SECRET);
    expect(verifyFinancialAttestationToken(token, SECRET, NOW).reason).toBe("ATTESTATION_ISSUED_IN_FUTURE");
  });

  it("rejects a token whose expiry precedes its issue time", () => {
    const inverted = payload({
      expiresAt: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
    });
    const token = buildFinancialAttestationToken(inverted, SECRET);
    expect(verifyFinancialAttestationToken(token, SECRET, NOW).reason).toBe("ATTESTATION_EXPIRY_BEFORE_ISSUE");
  });

  it("fails closed on malformed tokens and payloads", () => {
    const token = buildFinancialAttestationToken(payload(), SECRET);
    const encoded = token.split(".")[1]!;
    expect(verifyFinancialAttestationToken("not-a-token", SECRET, NOW).reason).toBe("MALFORMED_ATTESTATION_TOKEN");
    expect(verifyFinancialAttestationToken("DURIOS_ATT.$$$.sig", SECRET, NOW).reason).toBe("MALFORMED_ATTESTATION_PAYLOAD");
    expect(parseFinancialAttestationPayload("garbage")).toBeUndefined();
    expect(parseFinancialAttestationPayload(encoded)?.dossierId).toBe("DOS-1");
  });

  it("refuses a secret shorter than the minimum length", () => {
    expect(() => buildFinancialAttestationToken(payload(), "short")).toThrow();
  });
});
