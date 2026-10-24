import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, DocumentType } from "../../src/domain/types.js";

export const CADMIUM_CLERK: AuthenticatedActor = {
  id: "usr-clerk-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK", persona: "PACKHOUSE_CLERK", name: "Clerk Le",
};

export function makePdf(seed: string): Uint8Array {
  return new Uint8Array([
    0x25, 0x50, 0x44, 0x46,
    ...Array.from(seed).map((c) => c.charCodeAt(0) % 256),
  ]);
}

/** A dossier whose lab report reads exactly `cadmium` mg/kg, every field human-verified. */
export function buildCadmiumDossier(
  cadmium: string,
  code: string,
  actor: AuthenticatedActor = CADMIUM_CLERK
): { ws: ContainerDossierWorkspace; dossierId: string } {
  const ws = new ContainerDossierWorkspace();
  const dossier = ws.createDossier(
    {
      dossierCode: `DOS-${code}`, containerNumber: "MSKU1234565", sealNumber: "SEAL-CD-01",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    actor
  );
  const docs: Array<[string, DocumentType, Record<string, { raw: string }>]> = [
    ["p.pdf", "PACKING_LIST", { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CD-01" } }],
    ["ph.pdf", "PHYTOSANITARY_CERTIFICATE", { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CD-01" } }],
    ["lab.pdf", "LAB_TEST_REPORT", { cadmium_mg_kg: { raw: cadmium } }],
  ];
  for (const [name, type, fields] of docs) {
    const { document } = ws.uploadDocument(dossier.id, makePdf(name), name, type, actor, fields);
    for (const f of document.extractedFields) {
      ws.verifyField(dossier.id, document.id, { fieldId: f.id, confirmedValue: f.rawValue }, actor);
    }
  }
  return { ws, dossierId: dossier.id };
}
