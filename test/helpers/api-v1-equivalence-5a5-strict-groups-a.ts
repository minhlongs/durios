import {
  createPdfBytes,
  type DossierDetailResponse,
  type DossierDocumentPayload,
} from "./redaction-and-blobs-5a5-scenarios.js";
import type { CompareCallFn, EquivalenceActors } from "./api-v1-equivalence-5a5-normalizer.js";

export interface EquivalencePhase1State {
  dosApiId: string;
  dosV1Id: string;
  docsApi: DossierDocumentPayload[];
  docsV1: DossierDocumentPayload[];
  docPayloads: Array<Record<string, unknown>>;
  grantCustomsApiId: string;
  grantCustomsV1Id: string;
}

export async function runEquivalenceGroups1And2And6(
  actors: EquivalenceActors,
  compareCall: CompareCallFn
): Promise<EquivalencePhase1State> {
  const {
    ownerAdmin, ownerClerk, ownerViewer, sharedCustomsClerk,
    sharedCustomsViewer, sharedLogisticsViewer, intruderAdmin, unauthenticated,
  } = actors;

  // GROUP 1: Dossier (POST .../dossiers, GET .../dossiers, GET .../dossiers/:id)
  await compareCall("/dossiers", "/dossiers", "GET", unauthenticated, undefined, 401);
  await compareCall(
    "/dossiers", "/dossiers", "POST", ownerViewer,
    { dossierCode: "DOS-EQ-DENIED", containerNumber: "MSKU1234565", sealNumber: "SEAL-EQ-01" },
    403
  );
  await compareCall("/dossiers", "/dossiers", "POST", ownerAdmin, { dossierCode: "" }, 400);

  const createdPair = await compareCall<DossierDetailResponse>(
    "/dossiers", "/dossiers", "POST", ownerAdmin,
    {
      dossierCode: "DOS-EQ-MAIN-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-EQ-01",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    201
  );
  const dosApiId = createdPair.bodyApi.data.id;
  const dosV1Id = createdPair.bodyV1.data.id;

  await compareCall("/dossiers", "/dossiers", "GET", ownerAdmin, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", ownerAdmin, undefined, 200);
  await compareCall("/dossiers", "/dossiers", "GET", intruderAdmin, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", intruderAdmin, undefined, 404);
  await compareCall(`/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", unauthenticated, undefined, 401);

  // GROUP 2: Documents & Verify
  const docPayloads = [
    {
      fileName: "eq_packing.pdf",
      documentType: "PACKING_LIST",
      base64Content: Buffer.from(createPdfBytes("eq-pl-content")).toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-EQ-01" },
        box_count: { raw: "900" }, net_weight_kg: { raw: "18000" },
        invoice_value: { raw: "49500 USD" }, buyer_name: { raw: "Synthetic Buyer Co." },
      },
    },
    {
      fileName: "eq_lab.pdf",
      documentType: "LAB_TEST_REPORT",
      base64Content: Buffer.from(createPdfBytes("eq-lab-content")).toString("base64"),
      fixtureFields: {
        cadmium_mg_kg: { raw: "0.024" },
        sample_code: { raw: "SYNTH-EQ-SMP-01" },
        sampling_date: { raw: "2026-10-06" },
      },
    },
    {
      fileName: "eq_phyto.pdf",
      documentType: "PHYTOSANITARY_CERTIFICATE",
      base64Content: Buffer.from(createPdfBytes("eq-phyto-content")).toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" },
        seal_number: { raw: "SEAL-EQ-01" },
        phyto_cert_number: { raw: "SYNTH-EQ-KDTV-01" },
      },
    },
  ];

  await compareCall(`/dossiers/${dosApiId}/documents`, `/dossiers/${dosV1Id}/documents`, "POST", ownerViewer, docPayloads[0], 403);
  await compareCall(`/dossiers/${dosApiId}/documents`, `/dossiers/${dosV1Id}/documents`, "POST", intruderAdmin, docPayloads[0], 403);

  for (const docPayload of docPayloads) {
    await compareCall(`/dossiers/${dosApiId}/documents`, `/dossiers/${dosV1Id}/documents`, "POST", ownerClerk, docPayload, 201);
  }

  const detailAfterUpload = await compareCall<DossierDetailResponse>(
    `/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", ownerAdmin, undefined, 200
  );
  const docsApi = detailAfterUpload.bodyApi.data.documents;
  const docsV1 = detailAfterUpload.bodyV1.data.documents;

  const firstVerifyApi = `/dossiers/${dosApiId}/documents/${docsApi[0]!.id}/fields/${docsApi[0]!.extractedFields[0]!.id}/verify`;
  const firstVerifyV1 = `/dossiers/${dosV1Id}/documents/${docsV1[0]!.id}/fields/${docsV1[0]!.extractedFields[0]!.id}/verify`;
  await compareCall(firstVerifyApi, firstVerifyV1, "POST", ownerViewer, { confirmedValue: "MSKU1234565" }, 403);
  await compareCall(firstVerifyApi, firstVerifyV1, "POST", intruderAdmin, { confirmedValue: "MSKU1234565" }, 403);
  await compareCall(firstVerifyApi, firstVerifyV1, "POST", ownerClerk, {}, 400);

  for (const docIdx of [0, 1]) {
    const fieldsA = docsApi[docIdx]!.extractedFields;
    const fieldsB = docsV1[docIdx]!.extractedFields;
    for (let fIdx = 0; fIdx < fieldsA.length; fIdx++) {
      await compareCall(
        `/dossiers/${dosApiId}/documents/${docsApi[docIdx]!.id}/fields/${fieldsA[fIdx]!.id}/verify`,
        `/dossiers/${dosV1Id}/documents/${docsV1[docIdx]!.id}/fields/${fieldsB[fIdx]!.id}/verify`,
        "POST", ownerClerk,
        { confirmedValue: fieldsA[fIdx]!.rawValue, clerkNote: "Internal clerk note" }, 200
      );
    }
  }

  // GROUP 6: Shares (POST/GET .../shares)
  const fixedExpiresAt = "2027-06-01T00:00:00.000Z";
  await compareCall(`/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "POST", ownerClerk, { granteeTenantId: "TENANT-EQ-CUSTOMS", purpose: "CUSTOMS_INSPECTION", scope: "READ_AND_VERIFY", expiresAt: fixedExpiresAt }, 403);
  await compareCall(`/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "POST", intruderAdmin, { granteeTenantId: "TENANT-EQ-INTRUDER", purpose: "CUSTOMS_INSPECTION", scope: "READ_ONLY", expiresAt: fixedExpiresAt }, 403);
  await compareCall(`/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "POST", ownerAdmin, { granteeTenantId: "TENANT-EQ-OWNER", purpose: "CUSTOMS_INSPECTION", scope: "READ_ONLY", expiresAt: fixedExpiresAt }, 400);

  const grantCustomsPair = await compareCall<{ grant: { id: string } }>(
    `/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "POST", ownerAdmin,
    { granteeTenantId: "TENANT-EQ-CUSTOMS", purpose: "CUSTOMS_INSPECTION", scope: "READ_AND_VERIFY", expiresAt: fixedExpiresAt }, 201
  );
  const grantCustomsApiId = grantCustomsPair.bodyApi.grant.id;
  const grantCustomsV1Id = grantCustomsPair.bodyV1.grant.id;

  await Bun.sleep(5);

  await compareCall(`/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "POST", ownerAdmin, { granteeTenantId: "TENANT-EQ-LOGISTICS", purpose: "LOGISTICS", scope: "READ_ONLY", expiresAt: fixedExpiresAt }, 201);
  for (const [actor, code] of [[ownerAdmin, 200], [ownerClerk, 200], [sharedCustomsClerk, 200], [intruderAdmin, 404]] as const) {
    await compareCall(`/dossiers/${dosApiId}/shares`, `/dossiers/${dosV1Id}/shares`, "GET", actor, undefined, code);
  }
  for (const actor of [sharedCustomsClerk, sharedLogisticsViewer]) {
    await compareCall("/dossiers", "/dossiers", "GET", actor, undefined, 200);
    await compareCall(`/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", actor, undefined, 200);
  }
  await compareCall(`/dossiers/${dosApiId}/documents`, `/dossiers/${dosV1Id}/documents`, "POST", sharedCustomsClerk, docPayloads[0], 403);

  const doc2VerifyApi0 = `/dossiers/${dosApiId}/documents/${docsApi[2]!.id}/fields/${docsApi[2]!.extractedFields[0]!.id}/verify`;
  const doc2VerifyV10 = `/dossiers/${dosV1Id}/documents/${docsV1[2]!.id}/fields/${docsV1[2]!.extractedFields[0]!.id}/verify`;
  await compareCall(doc2VerifyApi0, doc2VerifyV10, "POST", sharedCustomsViewer, { confirmedValue: docsApi[2]!.extractedFields[0]!.rawValue }, 403);
  await compareCall(doc2VerifyApi0, doc2VerifyV10, "POST", sharedLogisticsViewer, { confirmedValue: docsApi[2]!.extractedFields[0]!.rawValue }, 403);

  const fieldsDoc2Api = docsApi[2]!.extractedFields;
  const fieldsDoc2V1 = docsV1[2]!.extractedFields;
  for (let fIdx = 0; fIdx < fieldsDoc2Api.length; fIdx++) {
    await compareCall(
      `/dossiers/${dosApiId}/documents/${docsApi[2]!.id}/fields/${fieldsDoc2Api[fIdx]!.id}/verify`,
      `/dossiers/${dosV1Id}/documents/${docsV1[2]!.id}/fields/${fieldsDoc2V1[fIdx]!.id}/verify`,
      "POST", sharedCustomsClerk, { confirmedValue: fieldsDoc2Api[fIdx]!.rawValue }, 200
    );
  }

  return { dosApiId, dosV1Id, docsApi, docsV1, docPayloads, grantCustomsApiId, grantCustomsV1Id };
}
