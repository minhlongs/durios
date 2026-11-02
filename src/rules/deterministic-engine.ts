import type { ComplianceRule, ContainerDossier, ValidationFinding, ValidationRunResult } from "../domain/types.js";
import { findHumanVerificationGateFinding, pushUnreadableDocumentFindings } from "./extraction-completeness.js";
import { evaluateCadmiumThreshold, evaluateCadmiumWarningThreshold, evaluateColdChainTemperatureAttestation, evaluateCrossDocFieldDiscrepancy, evaluateIsoChecksum, minTemperatureC } from "./evaluator-helpers.js";


export class DeterministicRuleEngine {
  constructor(private readonly rules: readonly ComplianceRule[]) {}

  public evaluate(dossier: ContainerDossier): ValidationRunResult {
    const findings: ValidationFinding[] = [];
    const activeDocs = dossier.documents.filter((d) => !d.isSuperseded);

    const gateFinding = findHumanVerificationGateFinding(activeDocs);
    if (gateFinding) {
      return {
        status: "HUMAN_VERIFICATION_REQUIRED",
        criticalBlockers: 1, advisoryWarnings: 0, evaluatedRulesCount: 0,
        findings: [gateFinding], evaluatedAt: new Date().toISOString(),
      };
    }
    pushUnreadableDocumentFindings(activeDocs, findings);

    let evaluatedCount = 0;
    for (const rule of this.rules) {
      if (!rule.isActive) continue;

      // Only a rule that CLAIMS a statutory basis is held here. A rule that makes
      // no legal claim — an internal food-safety control — must still evaluate, or
      // a lot over the limit passes unchallenged while appearing to be checked.
      // An absent claim tier counts as STATUTORY, so a pre-migration rule record
      // cannot quietly acquire the right to block without legal review.
      const claimsStatutory = (rule.statutoryClaim ?? "STATUTORY") === "STATUTORY";
      if (claimsStatutory && !rule.isStatutoryVerified) {
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

  private evaluateIndividualRule(rule: ComplianceRule, dossier: ContainerDossier, findings: ValidationFinding[]): void {
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

    if (rule.ruleId === "RUL-CD-INTERNAL-BLOCK") evaluateCadmiumThreshold(rule, activeDocs, findings);
    if (rule.ruleId === "RUL-INT-CD-WARN") evaluateCadmiumWarningThreshold(rule, activeDocs, findings);
    if (rule.ruleId === "RUL-TEMP-WINDOW" && minTemperatureC("VN_CN") > 0) evaluateColdChainTemperatureAttestation(rule, dossier, findings);
    if (rule.ruleId === "RUL-ISO6346-CHK") evaluateIsoChecksum(rule, dossier, findings);
    if (rule.ruleId === "RUL-CROSS-CONT") evaluateCrossDocFieldDiscrepancy("container_number", rule, dossier, activeDocs, findings);
    if (rule.ruleId === "RUL-CROSS-SEAL") evaluateCrossDocFieldDiscrepancy("seal_number", rule, dossier, activeDocs, findings);  }
}
