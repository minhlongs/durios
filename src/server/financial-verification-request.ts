import type { FinancialVerificationPurpose } from "../saas/financial-attestation-token.js";

export interface MintAttestationRequestBody {
  readonly dossierId: string;
  readonly purpose: FinancialVerificationPurpose;
  readonly institutionTenantId: string;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await req.json();
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function parseMintRequestBody(body: Record<string, unknown>): MintAttestationRequestBody {
  const dossierId = readString(body.dossierId);
  const institutionTenantId = readString(body.institutionTenantId);
  const rawPurpose = readString(body.purpose);
  if (!dossierId) throw new Error("dossierId is required to mint a financial attestation.");
  if (!institutionTenantId) {
    throw new Error("institutionTenantId is required to mint a financial attestation.");
  }
  if (rawPurpose !== "TRADE_FINANCE" && rawPurpose !== "MARINE_INSURANCE") {
    throw new Error("purpose must be either TRADE_FINANCE or MARINE_INSURANCE.");
  }
  return { dossierId, purpose: rawPurpose, institutionTenantId };
}

export function parseVerificationRequestBody(body: Record<string, unknown>): string {
  const token = readString(body.token);
  if (!token) throw new Error("token is required to verify a financial attestation.");
  return token;
}
