import { expect } from "bun:test";
import { routeHttpRequest } from "../../src/server/http-router.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  buildValidDossierReadyForValidation, createPdfBytes,
} from "./redaction-and-blobs-5a5-scenarios.js";

export interface IdDataResponse { data: { id: string } }
export interface DocumentUploadResponse { data: { documentId: string } }
export interface ValidationStatusResponse { data: { status: string } }
export interface ShareGrantResponse { grant: { id: string } }

export async function verifyAliasDossierAndDocumentGroups(
  workspace: ContainerDossierWorkspace,
  ownerAdminActor: Parameters<typeof buildValidDossierReadyForValidation>[1],
  adminHeaders: Record<string, string>,
  clerkHeaders: Record<string, string>
): Promise<void> {
  const createRes = await routeHttpRequest(
    workspace,
    new Request("http://localhost:3000/api/v1/dossiers", {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({
        dossierCode: "DOS-V1-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-V1-01",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }),
    })
  );
  expect(createRes.status).toBe(201);
  const createdDossierId = ((await createRes.json()) as IdDataResponse).data.id;

  const listApiRes = await routeHttpRequest(workspace, new Request("http://localhost:3000/api/dossiers", { headers: adminHeaders }));
  const listV1Res = await routeHttpRequest(workspace, new Request("http://localhost:3000/api/v1/dossiers", { headers: adminHeaders }));
  expect(listApiRes.status).toBe(200);
  expect(listV1Res.status).toBe(200);
  expect(await listV1Res.json()).toEqual(await listApiRes.json());

  const getApiRes = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/dossiers/${createdDossierId}`, { headers: adminHeaders }));
  const getV1Res = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/v1/dossiers/${createdDossierId}`, { headers: adminHeaders }));
  expect(getV1Res.status).toBe(200);
  expect(await getV1Res.json()).toEqual(await getApiRes.json());

  const docUploadRes = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${createdDossierId}/documents`, {
      method: "POST", headers: clerkHeaders,
      body: JSON.stringify({
        fileName: "v1_packing.pdf", documentType: "PACKING_LIST",
        base64Content: Buffer.from(createPdfBytes("v1-doc-upload")).toString("base64"),
        fixtureFields: { container_number: { raw: "MSKU1234565" } },
      }),
    })
  );
  expect(docUploadRes.status).toBe(201);
  const uploadedDocId = ((await docUploadRes.json()) as DocumentUploadResponse).data.documentId;

  const detailForField = workspace.getDossier(createdDossierId, ownerAdminActor)!;
  const fieldId = detailForField.documents
    .find((d) => d.id === uploadedDocId)!
    .extractedFields.find((f) => f.fieldKey === "container_number")!.id;

  const verifyV1Res = await routeHttpRequest(
    workspace,
    new Request(
      `http://localhost:3000/api/v1/dossiers/${createdDossierId}/documents/${uploadedDocId}/fields/${fieldId}/verify`,
      { method: "POST", headers: clerkHeaders, body: JSON.stringify({ confirmedValue: "MSKU1234565" }) }
    )
  );
  expect(verifyV1Res.status).toBe(200);
}

export async function verifyAliasSharesAndOrganicGroups(
  workspace: ContainerDossierWorkspace,
  readyDossierId: string,
  adminHeaders: Record<string, string>,
  customsToken: string
): Promise<string> {
  const shareV1Res = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossierId}/shares`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({
        granteeTenantId: "TENANT-V1-CUSTOMS", purpose: "CUSTOMS_INSPECTION",
        scope: "READ_ONLY", expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    })
  );
  expect(shareV1Res.status).toBe(201);
  const shareGrantId = ((await shareV1Res.json()) as ShareGrantResponse).grant.id;

  const listSharesApi = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/dossiers/${readyDossierId}/shares`, { headers: adminHeaders }));
  const listSharesV1 = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/v1/dossiers/${readyDossierId}/shares`, { headers: adminHeaders }));
  expect(listSharesV1.status).toBe(200);
  expect(await listSharesV1.json()).toEqual(await listSharesApi.json());

  const baseOrgBody = {
    certifierName: "Demo Organic Certifier Lab (Synthetic)",
    certificateNumber: "SYNTH-ORG-5A5-001", standardCode: "TCVN_11041",
    standardDescription: "TCVN 11041 Organic Standard (Synthetic)", certifiedScope: "Fresh Durian Fruit",
    validFrom: "2026-01-01T00:00:00.000Z", validTo: "2027-12-31T23:59:59.000Z",
    issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
  };

  const recordOrgV1 = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossierId}/organic-evidence`, {
      method: "POST", headers: adminHeaders, body: JSON.stringify(baseOrgBody),
    })
  );
  expect(recordOrgV1.status).toBe(201);

  const legacyStatusBothRes = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossierId}/organic-evidence`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({ ...baseOrgBody, certificateNumber: "SYNTH-ORG-5A5-002", status: "CERTIFIED" }),
    })
  );
  expect(legacyStatusBothRes.status).toBe(422);

  const customsHeaders = { Authorization: `Bearer ${customsToken}` };
  const getOrgApi = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/dossiers/${readyDossierId}/organic-evidence`, { headers: customsHeaders }));
  const getOrgV1 = await routeHttpRequest(workspace, new Request(`http://localhost:3000/api/v1/dossiers/${readyDossierId}/organic-evidence`, { headers: customsHeaders }));
  expect(getOrgV1.status).toBe(200);
  expect(await getOrgV1.json()).toEqual(await getOrgApi.json());

  return shareGrantId;
}
