import { ContainerDossierWorkspace } from "./workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "./domain/types.js";

async function runDemo(): Promise<void> {
  const workspace = new ContainerDossierWorkspace();
  const clerk: AuthenticatedActor = {
    id: "usr-clerk-01",
    tenantId: "ten-cailay-001",
    tenantType: "PACKHOUSE_EXPORTER",
    role: "CLERK",
    persona: "PACKHOUSE_CLERK",
    name: "Nguyen Van A (Documentation Clerk)",
  };
  const manager: AuthenticatedActor = {
    id: "usr-mgr-01",
    tenantId: "ten-cailay-001",
    tenantType: "PACKHOUSE_EXPORTER",
    role: "MANAGER",
    persona: "PACKHOUSE_MANAGER",
    name: "Tran Thi B (Packhouse Operations Manager)",
  };

  // Step 1: Create Dossier
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-202610-001",
      containerNumber: "MSKU1234565",
      sealNumber: "SL-998822",
      targetMarket: "CN",
      borderGate: "Huu Nghi (Lang Son)",
      targetTemperatureC: 14.0,
      declaredNetWeightKg: 18240.0,
      declaredBoxCount: 960,
    },
    clerk
  );

  // Step 2 & 3: Upload supported documents with server-side SHA-256
  const fakePdfHeader1 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x01]);
  const fakePdfHeader2 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x02]);
  const fakePdfHeader3 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x03]);
  const doc1 = workspace.uploadDocument(
    dossier.id,
    fakePdfHeader1,
    "Packing_List_MSKU1234565.pdf",
    "PACKING_LIST",
    clerk,
    {
      container_number: { raw: "MSKU1234565" },
      seal_number: { raw: "SL-998822" },
      box_count: { raw: "960" },
      net_weight_kg: { raw: "18240.00" },
    }
  );
  const doc2 = workspace.uploadDocument(
    dossier.id,
    fakePdfHeader2,
    "Eurofins_LabReport_E2610.pdf",
    "LAB_TEST_REPORT",
    clerk,
    {
      cadmium_mg_kg: { raw: "0.028" },
      sample_code: { raw: "EF-2026-VN-9081" },
      sampling_date: { raw: "2026-10-06" },
    }
  );
  const doc3 = workspace.uploadDocument(
    dossier.id,
    fakePdfHeader3,
    "Phytosanitary_Cert_KDTV.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    clerk,
    {
      container_number: { raw: "MSKU1234565" },
      seal_number: { raw: "SL-998822" },
      phyto_cert_number: { raw: "KDTV-2026-VN-09928" },
    }
  );

  // Step 6: Require explicit human verification for all candidate fields
  for (const doc of [doc1.document, doc2.document, doc3.document]) {
    for (const field of doc.extractedFields) {
      workspace.verifyField(
        dossier.id,
        doc.id,
        {
          fieldId: field.id,
          confirmedValue: field.rawValue,
          clerkNote: "Verified against original stamp",
        },
        clerk
      );
    }
  }

  // Step 7 & 8: Run deterministic completeness and cross-document checks
  const validation = workspace.runValidation(dossier.id, clerk);

  // Step 9: Manager sign-off
  workspace.approveForExport(dossier.id, manager);

  // Step 10: Cryptographic export manifest compilation
  const manifest = workspace.exportDossier(dossier.id, manager);

  const isAuditClean = workspace.auditLedger.verifyIntegrity();
  process.stdout.write(
    `[DuriOS] Local vertical slice completed successfully:\n` +
      ` - Dossier ID: ${manifest.dossierId}\n` +
      ` - Status: ${manifest.lifecycleState}\n` +
      ` - Validation: ${validation.status} (${validation.criticalBlockers} blockers, ${validation.advisoryWarnings} warnings)\n` +
      ` - Audit Ledger: ${workspace.auditLedger.getAllEvents().length} events recorded, hash-chain integrity verified: ${isAuditClean}\n` +
      ` - Composite SHA-256: ${manifest.compositeManifestSha256}\n`
  );
}

runDemo().catch((err) => {
  process.stderr.write(`Fatal execution error: ${err.message}\n`);
  process.exit(1);
});
