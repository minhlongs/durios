import { expect } from "bun:test";
import { calculateSha256 } from "../../src/ingestion/document-hasher.js";
import { routeHttpRequest } from "../../src/server/http-router.js";
import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  createPdfBytes,
  seedAndMakeActor,
  type DossierDetailResponse,
  type Redaction5A5Context,
} from "./redaction-and-blobs-5a5-fixtures.js";
import {
  assertSharedGranteeRedaction,
  verifyMultiGrantRevocationAndRawSafety,
} from "./redaction-and-blobs-5a5-redaction-assertions.js";

export async function runOwnerVsSharedRedactionScenario(ctx: Redaction5A5Context): Promise<void> {
  const { workspace } = ctx;
  const ownerAdmin = seedAndMakeActor(workspace, "TENANT-OWNER-5A5", "ADMIN");
  const customsAuditor = seedAndMakeActor(workspace, "TENANT-CUSTOMS-5A5", "AUDITOR");
  const buyerViewer = seedAndMakeActor(workspace, "TENANT-BUYER-5A5", "VIEWER");
  const logisticsViewer = seedAndMakeActor(workspace, "TENANT-LOGISTICS-5A5", "VIEWER");
  const auditPartner = seedAndMakeActor(workspace, "TENANT-AUDIT-5A5", "AUDITOR");

  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-5A5-REDACT-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-5A5-01",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18500, declaredBoxCount: 925,
    },
    ownerAdmin.actor
  );

  const pdfBytes = createPdfBytes("commercial-packing-list");
  const { document } = workspace.uploadDocument(
    dossier.id, pdfBytes, "commercial_invoice_packing.pdf", "PACKING_LIST", ownerAdmin.actor,
    {
      container_number: { raw: "MSKU1234565" },
      seal_number: { raw: "SEAL-5A5-01" },
      net_weight_kg: { raw: "18500" },
      box_count: { raw: "925" },
      invoice_value: { raw: "48000 USD" },
      unit_price: { raw: "2.60 USD/kg" },
      buyer_name: { raw: "Synthetic Fruit Import Ltd" },
      buyer_contact: { raw: "buyer@synthetic-example.invalid" },
      commercial_contract_no: { raw: "SYNTH-CONTRACT-2026-88" },
      payment_terms: { raw: "L/C 30 Days" },
      exporter_margin: { raw: "14.5%" },
      customs_broker_fee: { raw: "350 USD" },
    }
  );

  const containerField = document.extractedFields.find((f) => f.fieldKey === "container_number")!;
  workspace.verifyField(
    dossier.id, document.id,
    {
      fieldId: containerField.id,
      confirmedValue: "MSKU1234565",
      clerkNote: "Internal packhouse margin note: keep confidential",
    },
    ownerAdmin.actor
  );

  const futureIso = new Date(Date.now() + 86_400_000).toISOString();
  const currentDossier = workspace.getDossier(dossier.id, ownerAdmin.actor)!;

  for (const [grantee, purpose] of [
    ["TENANT-CUSTOMS-5A5", "CUSTOMS_INSPECTION"],
    ["TENANT-BUYER-5A5", "BUYER_VERIFICATION"],
    ["TENANT-LOGISTICS-5A5", "LOGISTICS"],
    ["TENANT-AUDIT-5A5", "AUDIT"],
  ] as const) {
    workspace.shareManager.grantAccess(
      currentDossier, grantee, purpose, "READ_ONLY", futureIso, ownerAdmin.actor, workspace.auditLedger
    );
  }

  const ownerDetailRes = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}`, {
      headers: { Authorization: `Bearer ${ownerAdmin.sessionToken}` },
    })
  );
  expect(ownerDetailRes.status).toBe(200);
  const ownerDetailJson = (await ownerDetailRes.json()) as DossierDetailResponse;
  expect(ownerDetailJson.data.declaredNetWeightKg).toBe(18500);
  expect(ownerDetailJson.data.declaredBoxCount).toBe(925);
  expect(ownerDetailJson.data.documents[0]?.storagePath).toBe(
    `storage/blobs/${calculateSha256(pdfBytes)}.bin`
  );
  const ownerFields = ownerDetailJson.data.documents[0]!.extractedFields;
  expect(ownerFields.some((f) => f.fieldKey === "invoice_value")).toBe(true);
  expect(ownerFields.some((f) => f.fieldKey === "unit_price")).toBe(true);
  expect(ownerFields.some((f) => f.fieldKey === "buyer_name")).toBe(true);

  await assertSharedGranteeRedaction(workspace, dossier.id, customsAuditor.sessionToken, true);
  await assertSharedGranteeRedaction(workspace, dossier.id, logisticsViewer.sessionToken, true);
  await assertSharedGranteeRedaction(workspace, dossier.id, buyerViewer.sessionToken, false);
  await assertSharedGranteeRedaction(workspace, dossier.id, auditPartner.sessionToken, false);

  await verifyMultiGrantRevocationAndRawSafety(
    workspace, currentDossier, ownerAdmin.actor, buyerViewer.sessionToken, futureIso, pdfBytes
  );
}

export async function runNestedCommercialRedactionScenario(): Promise<void> {
  const inMemoryWs = new ContainerDossierWorkspace();
  const owner = seedAndMakeActor(inMemoryWs, "TENANT-MEM-OWNER", "ADMIN");
  const grantee = seedAndMakeActor(inMemoryWs, "TENANT-MEM-GRANTEE", "VIEWER");

  const dossier = inMemoryWs.createDossier(
    {
      dossierCode: "DOS-NESTED-REDACT-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-NEST-01",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    owner.actor
  );

  const storedRef = inMemoryWs.getRawDossier(dossier.id) as unknown as Record<string, unknown>;
  Object.assign(storedRef, {
    invoiceValue: 50000, unitPrice: 2.75, buyerName: "Secret Buyer Co",
    buyerContact: "+86-000-0000", commercialContractNo: "CNT-SECRET-01",
    paymentTerms: "TT 100%", exporterMargin: 0.18, customsBrokerFee: 400,
    clerkNote: "Confidential note", storage_path: "storage/blobs/secret.bin",
  });

  inMemoryWs.shareManager.grantAccess(
    dossier, "TENANT-MEM-GRANTEE", "BUYER_VERIFICATION", "READ_ONLY",
    new Date(Date.now() + 86_400_000).toISOString(), owner.actor, inMemoryWs.auditLedger
  );

  const detailRes = await routeHttpRequest(
    inMemoryWs,
    new Request(`http://localhost:3000/api/dossiers/${dossier.id}`, {
      headers: { Authorization: `Bearer ${grantee.sessionToken}` },
    })
  );
  expect(detailRes.status).toBe(200);
  const detailBody = (await detailRes.json()) as DossierDetailResponse;
  for (const key of [
    "invoiceValue", "unitPrice", "buyerName", "buyerContact", "commercialContractNo",
    "paymentTerms", "exporterMargin", "customsBrokerFee", "clerkNote", "storage_path",
    "declaredNetWeightKg", "declaredBoxCount",
  ]) {
    expect(detailBody.data[key]).toBeUndefined();
  }

  expect(storedRef.invoiceValue).toBe(50000);
  expect(storedRef.buyerName).toBe("Secret Buyer Co");
}
