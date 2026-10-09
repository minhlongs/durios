import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../src/domain/types.js";

const CLERK: AuthenticatedActor = {
  id: "usr-clerk-01",
  tenantId: "ten-cailay-001",
  role: "CLERK",
  name: "Clerk Le",
};

const MANAGER: AuthenticatedActor = {
  id: "usr-mgr-01",
  tenantId: "ten-cailay-001",
  role: "MANAGER",
  name: "Manager Tran",
};

const ATTACKER_TENANT_B: AuthenticatedActor = {
  id: "usr-hacker-02",
  tenantId: "ten-foreign-002",
  role: "ADMIN",
  name: "Hostile Tenant B",
};

describe("DuriOS Security & Export Suite", () => {
  it("T09: Cross-tenant data access is isolated and clerk unauthorized sign-off is blocked", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-202610-001",
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

    const tenantBQuery = ws.getDossier(dossier.id, ATTACKER_TENANT_B);
    expect(tenantBQuery).toBeUndefined();

    expect(() => {
      ws.approveForExport(dossier.id, CLERK);
    }).toThrow(/Clerk role is unauthorized/);
  });

  it("T10: Export generates immutable sealed manifest with composite SHA-256 and disclaimers", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-202610-001",
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

    const pdfBytes1 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x11]);
    const pdfBytes2 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x12]);
    const pdfBytes3 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x13]);
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

    const validation = ws.runValidation(dossier.id, CLERK);
    expect(validation.status).toBe("PASSED");

    ws.approveForExport(dossier.id, MANAGER);
    const manifest = ws.exportDossier(dossier.id, MANAGER);

    expect(manifest.lifecycleState).toBe("EXPORTED");
    expect(manifest.isImmutable).toBe(true);
    expect(manifest.compositeManifestSha256).toHaveLength(64);
    expect(manifest.regulatoryDisclaimers.length).toBeGreaterThan(0);
    expect(manifest.documents.length).toBe(3);

    expect(() => {
      ws.uploadDocument(dossier.id, pdfBytes1, "Extra.pdf", "BILL_OF_LADING", CLERK);
    }).toThrow(/Cannot upload to sealed dossier/);
  });
});
