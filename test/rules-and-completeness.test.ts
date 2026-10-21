import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { DeterministicRuleEngine } from "../src/rules/deterministic-engine.js";
import type { AuthenticatedActor, ComplianceRule } from "../src/domain/types.js";

const CLERK: AuthenticatedActor = {
  id: "usr-clerk-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK", persona: "PACKHOUSE_CLERK", name: "Clerk Le",
};

const BASE_DOSSIER = {
  dossierCode: "DOS-202610-001", containerNumber: "MSKU1234565", sealNumber: "SL-998822",
  targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.0,
  declaredNetWeightKg: 18240, declaredBoxCount: 960,
};

describe("DuriOS Compliance Rules & Completeness Suite", () => {
  it("T06: Missing required document triggers CRITICAL_BLOCKER", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(BASE_DOSSIER, CLERK);

    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const { document: doc } = ws.uploadDocument(dossier.id, pdfBytes, "PackingList.pdf", "PACKING_LIST", CLERK);
    for (const f of doc.extractedFields) {
      ws.verifyField(dossier.id, doc.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }

    const validation = ws.runValidation(dossier.id, CLERK);
    expect(validation.status).toBe("BLOCKED");
    expect(validation.criticalBlockers).toBeGreaterThanOrEqual(2);
    expect(validation.findings.some((f) => f.ruleId === "RUL-DOC-001")).toBe(true);
    expect(validation.findings.some((f) => f.ruleId === "RUL-DOC-002")).toBe(true);
  });

  it("T07: Cross-document container identifier mismatch triggers CRITICAL_BLOCKER", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(BASE_DOSSIER, CLERK);

    const { document: doc1 } = ws.uploadDocument(
      dossier.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x01]),
      "PackingList.pdf", "PACKING_LIST", CLERK,
      { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SL-998822" } }
    );
    const { document: doc2 } = ws.uploadDocument(
      dossier.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x02]),
      "Phyto.pdf", "PHYTOSANITARY_CERTIFICATE", CLERK,
      { container_number: { raw: "CMAU7654321" }, seal_number: { raw: "SL-998822" } }
    );
    const { document: doc3 } = ws.uploadDocument(
      dossier.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x03]),
      "Lab.pdf", "LAB_TEST_REPORT", CLERK,
      { cadmium_mg_kg: { raw: "0.025" } }
    );

    for (const d of [doc1, doc2, doc3]) {
      for (const f of d.extractedFields) {
        ws.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
      }
    }

    const validation = ws.runValidation(dossier.id, CLERK);
    expect(validation.status).toBe("BLOCKED");
    expect(validation.findings.some((f) => f.ruleId === "RUL-CROSS-CONT")).toBe(true);
  });

  it("T08: Unverified regulatory rule is flagged and blocked from producing legal conclusion", () => {
    const unverifiedRule: ComplianceRule = {
      ruleId: "RUL-SPECULATIVE-001", name: "Speculative Unpromulgated Pesticide Rule",
      severity: "CRITICAL_BLOCKER", description: "Speculative draft rule without statutory circular.",
      governingAuthority: "Unknown", statutoryReference: "DRAFT_SPECULATION_NO_LEGAL_BASE",
      isActive: true, isStatutoryVerified: false, evaluationType: "NUMERIC_THRESHOLD",
    };

    const engine = new DeterministicRuleEngine([unverifiedRule]);
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(BASE_DOSSIER, CLERK);

    const result = engine.evaluate(dossier);
    expect(result.status).toBe("BLOCKED");
    expect(result.findings[0]?.observedValue).toBe("UNVERIFIED_STATUTORY_RULE");
  });
});
