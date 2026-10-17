import type {
  ComplianceRule, ContainerDossier, ValidationFinding, ValidationRunResult,
} from "../domain/types.js";
import {
  evaluateCadmiumThreshold, evaluateCadmiumWarningThreshold,
  evaluateCrossDocFieldDiscrepancy, evaluateIsoChecksum,
} from "./evaluator-helpers.js";

export class DeterministicRuleEngine {
  constructor(private readonly rules: readonly ComplianceRule[]) {}

  public evaluate(dossier: ContainerDossier): ValidationRunResult {
    const findings: ValidationFinding[] = [];
    const activeDocs = dossier.documents.filter((d) => !d.isSuperseded);

    for (const doc of activeDocs) {
      for (const field of doc.extractedFields) {
        if (field.verificationStatus !== "HUMAN_VERIFIED") {
          return {
            status: "HUMAN_VERIFICATION_REQUIRED",
            criticalBlockers: 1, advisoryWarnings: 0, evaluatedRulesCount: 0,
            findings: [{
              ruleId: "RUL-GATE-UNVERIFIED", severity: "CRITICAL_BLOCKER",
              ruleName: "Human Verification Gate", citation: "DuriOS Regulatory Safety Standard Art 3.1",
              observedValue: `Field '${field.fieldKey}' is ${field.verificationStatus}`,
              thresholdValue: "HUMAN_VERIFIED",
              messageVi: `Trường '${field.label}' chưa được nhân viên kiểm chứng.`,
              messageEn: `Field '${field.label}' has not been human verified.`,
            }],
            evaluatedAt: new Date().toISOString(),
          };
        }
      }
    }

    let evaluatedCount = 0;

    for (const rule of this.rules) {
      if (!rule.isActive) continue;

      if (!rule.isStatutoryVerified && rule.severity === "CRITICAL_BLOCKER") {
        findings.push({
          ruleId: rule.ruleId, severity: "CRITICAL_BLOCKER", ruleName: rule.name,
          citation: rule.statutoryReference, observedValue: "UNVERIFIED_STATUTORY_RULE",
          thresholdValue: "VERIFIED",
          messageVi: `Quy tắc ${rule.ruleId} chưa được thẩm định cơ sở pháp lý, không thể áp dụng kết luận pháp lý.`,
          messageEn: `Rule ${rule.ruleId} lacks verified statutory basis; cannot produce a legal conclusion.`,
        });
        evaluatedCount++;
        continue;
      }

      evaluatedCount++;
      this.evaluateIndividualRule(rule, dossier, findings);
    }

    const criticalBlockers = findings.filter((f) => f.severity === "CRITICAL_BLOCKER").length;
    const advisoryWarnings = findings.filter((f) => f.severity === "ADVISORY_WARNING").length;
    const status: ValidationRunResult["status"] =
      criticalBlockers > 0 ? "BLOCKED" : advisoryWarnings > 0 ? "REVIEW_REQUIRED" : "PASSED";

    return {
      status, criticalBlockers, advisoryWarnings,
      evaluatedRulesCount: evaluatedCount, findings,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private evaluateIndividualRule(
    rule: ComplianceRule,
    dossier: ContainerDossier,
    findings: ValidationFinding[]
  ): void {
    const activeDocs = dossier.documents.filter((d) => !d.isSuperseded);

    if (rule.ruleId === "RUL-DOC-001" && !activeDocs.some((d) => d.documentType === "LAB_TEST_REPORT")) {
      findings.push({
        ruleId: rule.ruleId, severity: rule.severity, ruleName: rule.name, citation: rule.statutoryReference,
        observedValue: "Missing LAB_TEST_REPORT", thresholdValue: "Present",
        messageVi: "Thiếu Phiếu kết quả kiểm nghiệm kim loại nặng (Cadmi).",
        messageEn: "Missing required Lab Test Report for heavy metals (Cadmium).",
      });
    }

    if (rule.ruleId === "RUL-DOC-002" && !activeDocs.some((d) => d.documentType === "PHYTOSANITARY_CERTIFICATE")) {
      findings.push({
        ruleId: rule.ruleId, severity: rule.severity, ruleName: rule.name, citation: rule.statutoryReference,
        observedValue: "Missing PHYTOSANITARY_CERTIFICATE", thresholdValue: "Present",
        messageVi: "Thiếu Giấy chứng nhận Kiểm dịch thực vật (Phytosanitary Certificate).",
        messageEn: "Missing required Phytosanitary Certificate.",
      });
    }

    if (rule.ruleId === "RUL-GB2762-CD") evaluateCadmiumThreshold(rule, activeDocs, findings);
    if (rule.ruleId === "RUL-INT-CD-WARN") evaluateCadmiumWarningThreshold(rule, activeDocs, findings);
    if (rule.ruleId === "RUL-ISO6346-CHK") evaluateIsoChecksum(rule, dossier, findings);
    if (rule.ruleId === "RUL-CROSS-CONT") evaluateCrossDocFieldDiscrepancy("container_number", rule, dossier, activeDocs, findings);
    if (rule.ruleId === "RUL-CROSS-SEAL") evaluateCrossDocFieldDiscrepancy("seal_number", rule, dossier, activeDocs, findings);
  }
}
