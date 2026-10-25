import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, DocumentType } from "../../src/domain/types.js";

export const OVERRIDE_MANAGER: AuthenticatedActor = {
  id: "usr-mgr-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "MANAGER", persona: "PACKHOUSE_MANAGER", name: "Manager Nguyen",
};

export const OVERRIDE_CLERK: AuthenticatedActor = {
  id: "usr-clerk-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK", persona: "PACKHOUSE_CLERK", name: "Clerk Le",
};

export const OVERRIDE_ADMIN: AuthenticatedActor = {
  id: "usr-admin-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "ADMIN", persona: "PACKHOUSE_MANAGER", name: "Admin Tran",
};

export function makePdfBytes(seed: string): Uint8Array {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, ...Array.from(seed).map((c) => c.charCodeAt(0))]);
}

/**
 * A dossier whose lab report reads 0.900 mg/kg cadmium — over the internal limit —
 * every field human-verified and validated, so it lands in VALIDATION_BLOCKED.
 */
export function buildBlockedDossier(): { ws: ContainerDossierWorkspace; dossierId: string } {
  const ws = new ContainerDossierWorkspace();
  const dossier = ws.createDossier({
    dossierCode: "DOS-OV-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-OV-01",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.0,
    declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, OVERRIDE_CLERK);
  const docs: Array<[string, DocumentType, Record<string, { raw: string }>]> = [
    ["p.pdf", "PACKING_LIST", { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-OV-01" } }],
    ["ph.pdf", "PHYTOSANITARY_CERTIFICATE", { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-OV-01" } }],
    ["lab.pdf", "LAB_TEST_REPORT", { cadmium_mg_kg: { raw: "0.900" } }],
  ];
  for (const [name, type, fields] of docs) {
    const { document } = ws.uploadDocument(dossier.id, makePdfBytes(name), name, type, OVERRIDE_CLERK, fields);
    for (const f of document.extractedFields) {
      ws.verifyField(dossier.id, document.id, { fieldId: f.id, confirmedValue: f.rawValue }, OVERRIDE_CLERK);
    }
  }
  ws.runValidation(dossier.id, OVERRIDE_CLERK);
  return { ws, dossierId: dossier.id };
}
