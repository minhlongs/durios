import { expect } from "bun:test";
interface DossierDocumentPayload { id: string; extractedFields: Array<{ id: string; rawValue: string }> }
interface DossierDetailPayload { data: { id: string; lifecycleState: string; isImmutable: boolean; documents: DossierDocumentPayload[] } }
interface ExportResultPayload { success: boolean; data: { lifecycleState: string; isImmutable: boolean } }
interface AuditResultPayload { data: { isChainValid: boolean; count: number } }
export async function runHttpDossierLifecycleScenario(handle: (req: Request) => Promise<Response> | Response, clerkAuth: string, managerAuth: string): Promise<void> {
  const createRes = await handle(new Request("http://127.0.0.1/api/dossiers", { method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth }, body: JSON.stringify({ dossierCode: "DOS-HTTP-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-HTTP-99", borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900 }) }));
  expect(createRes.status).toBe(201);
  const createBody = (await createRes.json()) as { success: boolean; data: { id: string } };
  expect(createBody.success).toBe(true);
  const dossierId = createBody.data.id;
  const docTypes = [
    { type: "PACKING_LIST", name: "PackingList.pdf", content: Buffer.from("%PDF-1.5 Packing List synthetic content").toString("base64"), fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-HTTP-99" }, box_count: { raw: "900" }, net_weight_kg: { raw: "18000" } } },
    { type: "LAB_TEST_REPORT", name: "LabTestReport.pdf", content: Buffer.from("%PDF-1.5 Lab Test Cadmium synthetic content").toString("base64"), fixtureFields: { cadmium_mg_kg: { raw: "0.028" }, sample_code: { raw: "EF-2026-VN-9081" }, sampling_date: { raw: "2026-10-06" } } },
    { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoCert.pdf", content: Buffer.from("%PDF-1.5 Phytosanitary Certificate synthetic content").toString("base64"), fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-HTTP-99" }, phyto_cert_number: { raw: "KDTV-2026-VN-09928" } } },
  ];
  for (const d of docTypes) {
    const uploadRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth }, body: JSON.stringify({ fileName: d.name, documentType: d.type, base64Content: d.content, fixtureFields: d.fixtureFields }) }));
    expect(uploadRes.status).toBe(201);
  }
  const getRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}`, { headers: { Cookie: clerkAuth } }));
  const dossierData = ((await getRes.json()) as DossierDetailPayload).data;
  expect(dossierData.documents.length).toBe(3);
  for (const doc of dossierData.documents) {
    for (const f of doc.extractedFields) {
      const verifyRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth }, body: JSON.stringify({ confirmedValue: f.rawValue }) }));
      expect(verifyRes.status).toBe(200);
    }
  }
  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, { method: "POST", headers: { Cookie: clerkAuth } }))).status).toBe(200);
  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/approve`, { method: "POST", headers: { Cookie: clerkAuth } }))).status).toBe(403);
  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/approve`, { method: "POST", headers: { Cookie: managerAuth } }))).status).toBe(200);
  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/export`, { method: "POST" }))).status).toBe(401);
  const clerkExportRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/export`, { method: "POST", headers: { Cookie: clerkAuth, "x-actor-role": "MANAGER" } }));
  expect(clerkExportRes.status).toBe(403);
  const clerkExportBody = (await clerkExportRes.json()) as { success: boolean; error: string };
  expect(clerkExportBody.success).toBe(false);
  expect(clerkExportBody.error).toMatch(/unauthorized/i);
  const checkRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}`, { headers: { Cookie: clerkAuth } }));
  const checkData = ((await checkRes.json()) as DossierDetailPayload).data;
  expect(checkData.lifecycleState).toBe("APPROVED_FOR_EXPORT");
  expect(checkData.isImmutable).toBe(false);
  const mgrExportRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/export`, { method: "POST", headers: { Cookie: managerAuth } }));
  expect(mgrExportRes.status).toBe(200);
  const mgrExportBody = (await mgrExportRes.json()) as ExportResultPayload;
  expect(mgrExportBody.success).toBe(true);
  expect(mgrExportBody.data.lifecycleState).toBe("EXPORTED");
  expect(mgrExportBody.data.isImmutable).toBe(true);
  const postExportValRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, { method: "POST", headers: { Cookie: managerAuth } }));
  expect(postExportValRes.status).toBe(409);
  const postExportValBody = (await postExportValRes.json()) as { success: boolean; error: string; errorCode?: string };
  expect(postExportValBody.success).toBe(false);
  expect(postExportValBody.errorCode).toBe("DOSSIER_IMMUTABLE");
  expect(postExportValBody.error).toMatch(/sealed/i);
  const auditRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/audit`, { headers: { Cookie: clerkAuth } }));
  const auditData = ((await auditRes.json()) as AuditResultPayload).data;
  expect(auditData.isChainValid).toBe(true);
  expect(auditData.count).toBeGreaterThan(3);
}