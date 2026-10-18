import { expect } from "bun:test";

interface DossierCreatedPayload { data: { id: string } }
interface DossierDocumentsPayload {
  data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> };
}
interface ExportResultPayload { data: { lifecycleState: string; isImmutable: boolean } }

export async function runHttpAdminExportScenario(
  handle: (req: Request) => Promise<Response> | Response,
  adminAuth: string
): Promise<void> {
  const createRes = await handle(
    new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth },
      body: JSON.stringify({
        dossierCode: "DOS-ADMIN-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-ADMIN-01",
      }),
    })
  );
  expect(createRes.status).toBe(201);
  const dossierId = ((await createRes.json()) as DossierCreatedPayload).data.id;

  const docTypes = [
    {
      type: "PACKING_LIST", name: "PL.pdf", content: Buffer.from("%PDF-1.5 pl admin").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-ADMIN-01" },
        box_count: { raw: "900" }, net_weight_kg: { raw: "18000" },
      },
    },
    {
      type: "LAB_TEST_REPORT", name: "Lab.pdf", content: Buffer.from("%PDF-1.5 lab admin").toString("base64"),
      fixtureFields: {
        cadmium_mg_kg: { raw: "0.020" }, sample_code: { raw: "S-1" }, sampling_date: { raw: "2026-10-06" },
      },
    },
    {
      type: "PHYTOSANITARY_CERTIFICATE", name: "Phyto.pdf", content: Buffer.from("%PDF-1.5 phyto admin").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-ADMIN-01" }, phyto_cert_number: { raw: "P-1" },
      },
    },
  ];

  for (const d of docTypes) {
    await handle(
      new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminAuth },
        body: JSON.stringify({
          fileName: d.name, documentType: d.type, base64Content: d.content, fixtureFields: d.fixtureFields,
        }),
      })
    );
  }

  const getRes = await handle(
    new Request(`http://127.0.0.1/api/dossiers/${dossierId}`, { headers: { Cookie: adminAuth } })
  );
  const docs = ((await getRes.json()) as DossierDocumentsPayload).data.documents;
  for (const doc of docs) {
    for (const f of doc.extractedFields) {
      await handle(
        new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: adminAuth },
          body: JSON.stringify({ confirmedValue: f.rawValue }),
        })
      );
    }
  }

  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, { method: "POST", headers: { Cookie: adminAuth } }))).status).toBe(200);
  expect((await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/approve`, { method: "POST", headers: { Cookie: adminAuth } }))).status).toBe(200);

  const exportRes = await handle(
    new Request(`http://127.0.0.1/api/dossiers/${dossierId}/export`, { method: "POST", headers: { Cookie: adminAuth } })
  );
  expect(exportRes.status).toBe(200);
  const exportData = ((await exportRes.json()) as ExportResultPayload).data;
  expect(exportData.lifecycleState).toBe("EXPORTED");
  expect(exportData.isImmutable).toBe(true);
}
