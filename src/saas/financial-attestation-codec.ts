import { createHmac, timingSafeEqual } from "node:crypto";

export type FinancialVerificationPurpose = "TRADE_FINANCE" | "MARINE_INSURANCE";

export interface FinancialAttestationPayload {
  readonly dossierId: string;
  readonly ownerTenantId: string;
  readonly purpose: FinancialVerificationPurpose;
  readonly institutionTenantId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly nonce: string;
}

export interface FinancialAttestationVerification {
  readonly valid: boolean;
  readonly reason: string;
  readonly payload?: FinancialAttestationPayload | undefined;
}

export const TOKEN_PREFIX = "DURIOS_ATT";
export const TOKEN_MAX_AGE_SKEW_MS = 5 * 60 * 1000;

export function buildCanonicalPayload(payload: FinancialAttestationPayload): string {
  return JSON.stringify({
    dossierId: payload.dossierId,
    ownerTenantId: payload.ownerTenantId,
    purpose: payload.purpose,
    institutionTenantId: payload.institutionTenantId,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    nonce: payload.nonce,
  });
}

export function assertUsableSecret(secret: string): string {
  const trimmed = secret?.trim() ?? "";
  if (trimmed.length < 16) {
    throw new Error("Financial attestation secret must be at least 16 characters.");
  }
  return trimmed;
}

export function signCanonical(canonical: string, secret: string): string {
  return createHmac("sha256", secret).update(canonical, "utf-8").digest("hex");
}

export function hasMatchingSignature(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected, "utf-8");
  const providedBuf = Buffer.from(provided, "utf-8");
  return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
}

export function toBase64Url(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

export function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

export function splitAttestationToken(token: string): { readonly encoded: string; readonly signature: string } | undefined {
  const parts = (token?.trim() ?? "").split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX || !parts[1] || !parts[2]) return undefined;
  return { encoded: parts[1]!, signature: parts[2]! };
}
