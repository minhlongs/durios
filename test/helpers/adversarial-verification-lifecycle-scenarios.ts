import { expect } from "bun:test";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { runCadmiumRegulatorySafetyGateScenario } from "./adversarial-verification-cadmium-scenario.js";
import { CLERK, MANAGER, makePdf } from "./adversarial-verification-storage-scenarios.js";

export { runCadmiumRegulatorySafetyGateScenario };

export function runValidationInvalidationOnFieldModifyScenario(
  workspace: ContainerDossierWorkspace
): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-INVAL-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-INV-001",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  const { document: doc1 } = workspace.uploadDocument(
    dossier.id,
    makePdf("packing-list-inval"),
    "PackingList.pdf",
    "PACKING_LIST",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-INV-001" } }
  );

  const { document: phytoDoc } = workspace.uploadDocument(
    dossier.id,
    makePdf("phyto-cert-inval"),
    "Phyto.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-INV-001" } }
  );

  const { document: doc3 } = workspace.uploadDocument(
    dossier.id,
    makePdf("lab-report-inval"),
    "LabReport.pdf",
    "LAB_TEST_REPORT",
    CLERK,
    { cadmium_mg_kg: { raw: "0.020" } }
  );

  for (const d of [doc1, phytoDoc, doc3]) {
    for (const f of d.extractedFields) {
      workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  const val1 = workspace.runValidation(dossier.id, CLERK);
  expect(val1.status).toBe("PASSED");
  const d1 = workspace.getDossier(dossier.id, CLERK);
  expect(d1?.lifecycleState).toBe("READY_FOR_REVIEW");

  const phytoContainerField = phytoDoc.extractedFields.find((f) => f.fieldKey === "container_number");
  expect(phytoContainerField).toBeDefined();

  const d2 = workspace.verifyField(
    dossier.id,
    phytoDoc.id,
    { fieldId: phytoContainerField!.id, confirmedValue: "WHLU9999999" },
    CLERK
  );

  expect(d2.latestValidationResult).toBeUndefined();
  expect(d2.lifecycleState).toBe("HUMAN_VERIFICATION_REQUIRED");

  expect(() => {
    workspace.approveForExport(dossier.id, MANAGER);
  }).toThrow();

  const val2 = workspace.runValidation(dossier.id, CLERK);
  expect(val2.status).toBe("BLOCKED");
  expect(val2.criticalBlockers).toBeGreaterThan(0);
  const crossDocFinding = val2.findings.find((f) => f.ruleId === "RUL-CROSS-CONT");
  expect(crossDocFinding).toBeDefined();
}

export function runSealedDossierProhibitsMutationsScenario(
  workspace: ContainerDossierWorkspace
): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-SEAL-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-SEAL-001",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  const { document: doc1 } = workspace.uploadDocument(
    dossier.id,
    makePdf("pl-seal"),
    "doc1.pdf",
    "PACKING_LIST",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-SEAL-001" } }
  );
  const { document: doc2 } = workspace.uploadDocument(
    dossier.id,
    makePdf("phyto-seal"),
    "doc2.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-SEAL-001" } }
  );
  const { document: doc3 } = workspace.uploadDocument(
    dossier.id,
    makePdf("lab-seal"),
    "doc3.pdf",
    "LAB_TEST_REPORT",
    CLERK,
    { cadmium_mg_kg: { raw: "0.015" } }
  );

  for (const d of [doc1, doc2, doc3]) {
    for (const f of d.extractedFields) {
      workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  workspace.runValidation(dossier.id, CLERK);
  workspace.approveForExport(dossier.id, MANAGER);
  const manifest = workspace.exportDossier(dossier.id, MANAGER);
  expect(manifest.isImmutable).toBe(true);
  expect(manifest.lifecycleState).toBe("EXPORTED");

  const sealed = workspace.getDossier(dossier.id, CLERK);
  expect(sealed?.isImmutable).toBe(true);
  expect(sealed?.lifecycleState).toBe("EXPORTED");

  expect(() => {
    workspace.uploadDocument(dossier.id, makePdf("forbidden"), "forbidden.pdf", "PACKING_LIST", CLERK);
  }).toThrow(/Cannot upload to sealed dossier/);

  expect(() => {
    workspace.verifyField(dossier.id, "any-id", { fieldId: "any-fld", confirmedValue: "x" }, CLERK);
  }).toThrow(/Dossier is sealed and immutable/);
}
