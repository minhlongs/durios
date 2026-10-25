import { expect } from "bun:test";

const syntheticPdf = (name: string): string => Buffer.from(`%PDF-1.5 synthetic ${name}`).toString("base64");

/**
 * Adds the three documents a clean dossier needs and human-verifies every extracted
 * field, returning the version the store now holds. The caller cannot skip this: an
 * unverified field leaves the dossier in HUMAN_VERIFICATION_REQUIRED, where the FSM
 * refuses approval before any version check is reached.
 */
export async function completeDossierDocuments(
  handler: (req: Request) => Promise<Response> | Response,
  dossierId: string,
  cookie: string,
  version: number,
  identifiers: { containerNumber: string; sealNumber: string }
): Promise<number> {
  // The documents must agree with the dossier header, or the cross-document rules
  // block the lot on a seal/container mismatch instead of reading a clean pass.
  const { containerNumber, sealNumber } = identifiers;
  const docs = [
    { type: "PACKING_LIST", name: "PackingList.pdf", fields: { container_number: { raw: containerNumber }, seal_number: { raw: sealNumber }, box_count: { raw: "950" }, net_weight_kg: { raw: "19000" } } },
    { type: "LAB_TEST_REPORT", name: "LabTestReport.pdf", fields: { cadmium_mg_kg: { raw: "0.010" }, sample_code: { raw: "EF-2026-VN-9082" }, sampling_date: { raw: "2026-10-06" } } },
    { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoCert.pdf", fields: { container_number: { raw: containerNumber }, seal_number: { raw: sealNumber }, phyto_cert_number: { raw: "KDTV-2026-VN-09929" } } },
  ];
  for (const d of docs) {
    const up = await handler(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ fileName: d.name, documentType: d.type, version, base64Content: syntheticPdf(d.name), fixtureFields: d.fields }),
    })) as Response;
    expect(up.status).toBe(201);
    version = ((await up.json()) as { data: { version: number } }).data.version;
  }
  const detailRes = await handler(new Request(`http://127.0.0.1/api/dossiers/${dossierId}`, { headers: { Cookie: cookie } }));
  const detail = ((await detailRes.json()) as { data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> } }).data;
  for (const doc of detail.documents) {
    for (const f of doc.extractedFields) {
      const vr = await handler(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ confirmedValue: f.rawValue, version }),
      })) as Response;
      expect(vr.status).toBe(200);
      version = ((await vr.json()) as { data: { version: number } }).data.version;
    }
  }
  return version;
}

/** Drives a dossier to a validated state, returning the version validation left behind. */
export async function driveToValidated(
  handler: (req: Request) => Promise<Response> | Response,
  dossierId: string,
  cookie: string,
  version: number
): Promise<number> {
  const ready = await completeDossierDocuments(handler, dossierId, cookie, version, { containerNumber: "MSKU1234565", sealNumber: "SEAL-RACE" });
  const validate = await handler(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ version: ready }),
  })) as Response;
  expect(validate.status).toBe(200);
  return ((await validate.json()) as { data: { status: string; version: number } }).data.version;
}
