import { expect } from "bun:test";
import { STATUTORY_COMPLIANCE_RULES } from "../../src/rules/rule-catalog.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { CLERK, makePdf } from "./adversarial-verification-storage-scenarios.js";

export function runCadmiumRegulatorySafetyGateScenario(
  workspace: ContainerDossierWorkspace
): void {
  const gb2762Rule = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-GB2762-CD");
  expect(gb2762Rule).toBeDefined();
  expect(gb2762Rule?.isActive).toBe(false);
  expect(gb2762Rule?.isStatutoryVerified).toBe(false);

  const internalAdvRule = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-INT-CD-WARN");
  expect(internalAdvRule).toBeDefined();
  expect(internalAdvRule?.severity).toBe("ADVISORY_WARNING");
  expect(internalAdvRule?.isStatutoryVerified).toBe(false);

  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-CD-SAFE-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-CD-001",
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
    makePdf("doc1-cd"),
    "doc1.pdf",
    "PACKING_LIST",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CD-001" } }
  );
  const { document: doc2 } = workspace.uploadDocument(
    dossier.id,
    makePdf("doc2-cd"),
    "doc2.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CD-001" } }
  );
  const { document: doc3 } = workspace.uploadDocument(
    dossier.id,
    makePdf("doc3-cd"),
    "doc3.pdf",
    "LAB_TEST_REPORT",
    CLERK,
    { cadmium_mg_kg: { raw: "0.045" } }
  );

  for (const d of [doc1, doc2, doc3]) {
    for (const f of d.extractedFields) {
      workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  const valResult = workspace.runValidation(dossier.id, CLERK);
  expect(valResult.criticalBlockers).toBe(0);
  expect(valResult.status).toBe("REVIEW_REQUIRED");

  const warnFinding = valResult.findings.find((f) => f.ruleId === "RUL-INT-CD-WARN");
  expect(warnFinding).toBeDefined();
  expect(warnFinding?.severity).toBe("ADVISORY_WARNING");
  expect(warnFinding?.messageVi).toContain("CẢNH BÁO NỘI BỘ");
  expect(warnFinding?.messageVi).toContain("không cấu thành vi phạm pháp lý");
}
