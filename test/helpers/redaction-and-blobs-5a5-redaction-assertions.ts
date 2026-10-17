import { expect } from "bun:test";
import type { ContainerDossier } from "../../src/domain/types.js";
import { calculateSha256 } from "../../src/ingestion/document-hasher.js";
import { routeHttpRequest } from "../../src/server/http-router.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  seedAndMakeActor,
  type DossierDetailResponse,
  type DossierListOrDetailResponse,
} from "./redaction-and-blobs-5a5-fixtures.js";

const FORBIDDEN_COMMERCIAL_KEYS = [
  "invoice_value",
  "invoiceValue",
  "unit_price",
  "unitPrice",
  "buyer_name",
  "buyerName",
  "buyer_contact",
  "buyerContact",
  "commercial_contract_no",
  "commercialContractNo",
  "payment_terms",
  "paymentTerms",
  "exporter_margin",
  "exporterMargin",
  "customs_broker_fee",
  "customsBrokerFee",
  "clerkNote",
  "clerk_note",
  "storagePath",
  "storage_path",
];

export function assertNoCommercialLeak(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  for (const key of FORBIDDEN_COMMERCIAL_KEYS) {
    expect(serialized).not.toContain(`"${key}"`);
  }
  expect(serialized).not.toContain("storage/blobs/");
  expect(serialized).not.toContain("48000 USD");
  expect(serialized).not.toContain("2.60 USD/kg");
  expect(serialized).not.toContain("Synthetic Fruit Import Ltd");
  expect(serialized).not.toContain("SYNTH-CONTRACT-2026-88");
  expect(serialized).not.toContain("L/C 30 Days");
}

export async function assertSharedGranteeRedaction(
  workspace: ContainerDossierWorkspace,
  dossierId: string,
  sessionToken: string,
  expectQuantitiesPresent: boolean
): Promise<void> {
  const urls = [
    `http://localhost:3000/api/dossiers`,
    `http://localhost:3000/api/dossiers/${dossierId}`,
  ];
  for (const url of urls) {
    const res = await routeHttpRequest(
      workspace,
      new Request(url, { headers: { Authorization: `Bearer ${sessionToken}` } })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as DossierListOrDetailResponse;
    assertNoCommercialLeak(body);
    const target = Array.isArray(body.data) ? body.data[0]! : body.data;
    if (expectQuantitiesPresent) {
      expect(target.declaredNetWeightKg).toBe(18500);
      expect(target.declaredBoxCount).toBe(925);
    } else {
      expect("declaredNetWeightKg" in target).toBe(false);
      expect("declaredBoxCount" in target).toBe(false);
    }
  }
}

export async function verifyMultiGrantRevocationAndRawSafety(
  workspace: ContainerDossierWorkspace,
  currentDossier: ContainerDossier,
  ownerActor: ReturnType<typeof seedAndMakeActor>["actor"],
  buyerSessionToken: string,
  futureIso: string,
  pdfBytes: Uint8Array
): Promise<void> {
  const extraLogisticsGrant = workspace.shareManager.grantAccess(
    currentDossier,
    "TENANT-BUYER-5A5",
    "LOGISTICS",
    "READ_ONLY",
    futureIso,
    ownerActor,
    workspace.auditLedger
  );

  const multiGrantRes = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${currentDossier.id}`, {
      headers: { Authorization: `Bearer ${buyerSessionToken}` },
    })
  );
  const multiGrantJson = (await multiGrantRes.json()) as DossierDetailResponse;
  expect(multiGrantJson.data.declaredNetWeightKg).toBe(18500);
  expect(multiGrantJson.data.declaredBoxCount).toBe(925);

  workspace.shareManager.revokeAccess(
    extraLogisticsGrant.id,
    currentDossier,
    "Logistics leg finished",
    ownerActor,
    workspace.auditLedger
  );

  const afterRevokeRes = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${currentDossier.id}`, {
      headers: { Authorization: `Bearer ${buyerSessionToken}` },
    })
  );
  const afterRevokeJson = (await afterRevokeRes.json()) as DossierDetailResponse;
  expect("declaredNetWeightKg" in afterRevokeJson.data).toBe(false);
  expect("declaredBoxCount" in afterRevokeJson.data).toBe(false);

  const rawAfter = workspace.getRawDossier(currentDossier.id)!;
  expect(rawAfter.declaredNetWeightKg).toBe(18500);
  expect(rawAfter.declaredBoxCount).toBe(925);
  expect(rawAfter.documents[0]?.storagePath).toBe(
    `storage/blobs/${calculateSha256(pdfBytes)}.bin`
  );
}
