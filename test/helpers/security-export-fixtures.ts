import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, ContainerDossier } from "../../src/domain/types.js";

export const CLERK: AuthenticatedActor = {
  id: "usr-clerk-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK",
  persona: "PACKHOUSE_CLERK",
  name: "Clerk Le",
};

export const MANAGER: AuthenticatedActor = {
  id: "usr-mgr-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "MANAGER",
  persona: "PACKHOUSE_MANAGER",
  name: "Manager Tran",
};

export const ATTACKER_TENANT_B: AuthenticatedActor = {
  id: "usr-hacker-02",
  tenantId: "ten-foreign-002",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "ADMIN",
  persona: "PACKHOUSE_MANAGER",
  name: "Hostile Tenant B",
};

export const ADMIN: AuthenticatedActor = {
  id: "usr-admin-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "ADMIN",
  persona: "PACKHOUSE_MANAGER",
  name: "Admin Hoang",
};

export function createPassingDossier(ws: ContainerDossierWorkspace, code: string): ContainerDossier {
  const dossier = ws.createDossier(
    {
      dossierCode: code,
      containerNumber: "MSKU1234565",
      sealNumber: "SL-998822",
      targetMarket: "CN",
      borderGate: "Huu Nghi",
      targetTemperatureC: 14.0,
      declaredNetWeightKg: 18240,
      declaredBoxCount: 960,
    },
    CLERK
  );

  const pdfBytes1 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x01]);
  const pdfBytes2 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x02]);
  const pdfBytes3 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x03]);

  const { document: doc1 } = ws.uploadDocument(dossier.id, pdfBytes1, "PackingList.pdf", "PACKING_LIST", CLERK, {
    container_number: { raw: "MSKU1234565" },
    seal_number: { raw: "SL-998822" },
    box_count: { raw: "960" },
    net_weight_kg: { raw: "18240.00" },
  });
  const { document: doc2 } = ws.uploadDocument(dossier.id, pdfBytes2, "Lab.pdf", "LAB_TEST_REPORT", CLERK, {
    cadmium_mg_kg: { raw: "0.028" },
    sample_code: { raw: "EF-2026-VN-9081" },
    sampling_date: { raw: "2026-10-06" },
  });
  const { document: doc3 } = ws.uploadDocument(dossier.id, pdfBytes3, "Phyto.pdf", "PHYTOSANITARY_CERTIFICATE", CLERK, {
    container_number: { raw: "MSKU1234565" },
    seal_number: { raw: "SL-998822" },
    phyto_cert_number: { raw: "KDTV-2026-VN-09928" },
  });

  for (const d of [doc1, doc2, doc3]) {
    for (const f of d.extractedFields) {
      ws.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  return ws.getDossier(dossier.id, CLERK)!;
}
