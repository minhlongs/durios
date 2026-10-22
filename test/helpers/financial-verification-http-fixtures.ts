import type { FinancialTestApp } from "./financial-verification-http-app.js";
import { expect } from "bun:test";

export const TEST_ATTESTATION_SECRET = "durios-financial-attestation-test-secret";
export const FINANCIAL_TEST_DB = "./data/test-financial-verification.db";
export const FINANCIAL_TEST_UPLOADS = "./data/test-financial-verification-uploads";

export const COMMERCIALLY_SENSITIVE_KEYS: readonly string[] = [
  "invoice_value", "invoiceValue", "unit_price", "unitPrice",
  "buyer_name", "buyerName", "buyer_contact", "buyerContact",
  "commercial_contract_no", "payment_terms", "exporter_margin", "exporterMargin",
];

/** Valid ISO 6346 container numbers (check-digit verified) for repeatable test seeding. */
export const CONTAINER_NUMBERS: Readonly<Record<string, string>> = {
  DOS_FIN_001: "MSKU1234565",
  DOS_FIN_002: "MSKU1234570",
  DOS_FIN_003: "MSKU1234586",
};

export async function createSealedDossier(
  handle: FinancialTestApp["handle"],
  managerAuth: string,
  dossierCode: string,
  containerNumber: string
): Promise<string> {
  const res = await handle(
    new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: managerAuth },
      body: JSON.stringify({
        dossierCode, containerNumber, sealNumber: `SEAL-${dossierCode}`,
        borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }),
    })
  );
  expect(res.status).toBe(201);
  const body = (await res.json()) as { data: { id: string } };
  return body.data.id;
}

export async function mintAttestationToken(
  handle: FinancialTestApp["handle"],
  managerAuth: string,
  dossierId: string,
  purpose: "TRADE_FINANCE" | "MARINE_INSURANCE",
  institutionTenantId: string
): Promise<string> {
  const res = await handle(
    new Request("http://127.0.0.1/api/open-core/financial-attestation", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: managerAuth },
      body: JSON.stringify({ dossierId, purpose, institutionTenantId }),
    })
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { data: { token: string } };
  return body.data.token;
}

export async function verifyAttestationAuthentically(
  handle: FinancialTestApp["handle"],
  token: string
): Promise<Response> {
  return handle(
    new Request("http://127.0.0.1/api/open-core/financial-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  );
}
