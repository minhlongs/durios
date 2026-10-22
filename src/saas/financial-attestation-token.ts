import {
  buildCanonicalPayload,
  fromBase64Url,
  hasMatchingSignature,
  splitAttestationToken,
  toBase64Url,
  TOKEN_MAX_AGE_SKEW_MS,
  assertUsableSecret,
  signCanonical,
  type FinancialAttestationPayload,
  type FinancialAttestationVerification,
} from "./financial-attestation-codec.js";

export type { FinancialAttestationPayload, FinancialVerificationPurpose, FinancialAttestationVerification } from "./financial-attestation-codec.js";

export const FINANCIAL_ATTESTATION_TTL_MS = 15 * 60 * 1000;

export function buildFinancialAttestationToken(
  payload: FinancialAttestationPayload,
  secret: string
): string {
  const usableSecret = assertUsableSecret(secret);
  const canonical = buildCanonicalPayload(payload);
  const signature = signCanonical(canonical, usableSecret);
  return `DURIOS_ATT.${toBase64Url(canonical)}.${signature}`;
}

export function parseFinancialAttestationPayload(encoded: string): FinancialAttestationPayload | undefined {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const rec = parsed as Record<string, unknown>;
    const str = (key: string): string | undefined => typeof rec[key] === "string" ? rec[key] as string : undefined;
    const dossierId = str("dossierId");
    const ownerTenantId = str("ownerTenantId");
    const institutionTenantId = str("institutionTenantId");
    const issuedAt = str("issuedAt");
    const expiresAt = str("expiresAt");
    const nonce = str("nonce");
    const purpose = str("purpose");
    if (!dossierId || !ownerTenantId || !institutionTenantId || !issuedAt || !expiresAt || !nonce) return undefined;
    if (purpose !== "TRADE_FINANCE" && purpose !== "MARINE_INSURANCE") return undefined;
    return { dossierId, ownerTenantId, institutionTenantId, issuedAt, expiresAt, nonce, purpose };
  } catch {
    return undefined;
  }
}

export function verifyFinancialAttestationToken(
  token: string,
  secret: string,
  referenceNow: Date | string = new Date()
): FinancialAttestationVerification {
  const usableSecret = assertUsableSecret(secret);
  const parts = splitAttestationToken(token);
  if (!parts) return { valid: false, reason: "MALFORMED_ATTESTATION_TOKEN" };

  const payload = parseFinancialAttestationPayload(parts.encoded);
  if (!payload) return { valid: false, reason: "MALFORMED_ATTESTATION_PAYLOAD" };

  const expected = signCanonical(buildCanonicalPayload(payload), usableSecret);
  if (!hasMatchingSignature(expected, parts.signature)) {
    return { valid: false, reason: "INVALID_ATTESTATION_SIGNATURE", payload };
  }

  const now = referenceNow instanceof Date ? referenceNow.getTime() : Date.parse(referenceNow);
  if (Number.isNaN(now)) return { valid: false, reason: "INVALID_REFERENCE_TIME", payload };
  const issuedAt = Date.parse(payload.issuedAt);
  const expiresAt = Date.parse(payload.expiresAt);
  if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) {
    return { valid: false, reason: "INVALID_ATTESTATION_TIMESTAMPS", payload };
  }
  if (expiresAt <= issuedAt) return { valid: false, reason: "ATTESTATION_EXPIRY_BEFORE_ISSUE", payload };
  if (issuedAt - now > TOKEN_MAX_AGE_SKEW_MS) return { valid: false, reason: "ATTESTATION_ISSUED_IN_FUTURE", payload };
  if (now >= expiresAt) return { valid: false, reason: "ATTESTATION_EXPIRED", payload };

  return { valid: true, reason: "ATTESTATION_VALID", payload };
}
