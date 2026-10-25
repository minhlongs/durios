import { expect } from "bun:test";

type Handler = (req: Request) => Promise<Response> | Response;
// Each upload needs distinct bytes: identical content is deduplicated by hash, so a
// shared body would silently drop the lab report and block on "missing" instead.
const syntheticPdf = (name: string): string => Buffer.from(`%PDF-1.5 synthetic ${name}`).toString("base64");

/**
 * Creates over HTTP a dossier whose lab report reads 0.900 mg/kg cadmium, every
 * field human-verified and validated, so the run lands in VALIDATION_BLOCKED.
 */
export async function createHttpBlockedDossier(handle: Handler, clerkAuth: string): Promise<string> {
  const createRes = await handle(new Request("http://127.0.0.1/api/dossiers", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth },
    body: JSON.stringify({ dossierCode: "DOS-HTTP-OV", containerNumber: "MSKU1234565", sealNumber: "SEAL-HTTP-OV", targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.0, declaredNetWeightKg: 18000, declaredBoxCount: 900 }),
  }));
  expect(createRes.status).toBe(201);
  const dossierId = ((await createRes.json()) as { data: { id: string } }).data.id;
  const docs = [
    { type: "PACKING_LIST", name: "PackingList.pdf", fields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-HTTP-OV" }, box_count: { raw: "900" }, net_weight_kg: { raw: "18000" } } },
    { type: "LAB_TEST_REPORT", name: "LabTestReport.pdf", fields: { cadmium_mg_kg: { raw: "0.900" }, sample_code: { raw: "EF-2026-VN-9082" }, sampling_date: { raw: "2026-10-06" } } },
    { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoCert.pdf", fields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-HTTP-OV" }, phyto_cert_number: { raw: "KDTV-2026-VN-09929" } } },
  ];
  for (const d of docs) {
    const upRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth }, body: JSON.stringify({ fileName: d.name, documentType: d.type, base64Content: syntheticPdf(d.name), fixtureFields: d.fields }) }));
    expect(upRes.status).toBe(201);
  }
  const getRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}`, { headers: { Cookie: clerkAuth } }));
  const detail = ((await getRes.json()) as { data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> } }).data;
  for (const doc of detail.documents) {
    for (const f of doc.extractedFields) {
      const verifyRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: clerkAuth }, body: JSON.stringify({ confirmedValue: f.rawValue }) }));
      expect(verifyRes.status).toBe(200);
    }
  }
  const validateRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, { method: "POST", headers: { Cookie: clerkAuth } }));
  expect(validateRes.status).toBe(200);
  const blockers = ((await validateRes.json()) as { data: { findings: Array<{ ruleId: string; severity: string }> } }).data.findings
    .filter((f) => f.severity === "CRITICAL_BLOCKER").map((f) => f.ruleId);
  expect(blockers).toEqual(["RUL-CD-INTERNAL-BLOCK"]);
  return dossierId;
}

/** Posts an override request and returns the response for assertion. */
export function postOverride(handle: Handler, dossierId: string, cookie: string, reason?: string): Promise<Response> {
  return handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/override`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(reason === undefined ? {} : { reason }),
  })) as Promise<Response>;
}
