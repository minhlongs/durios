import { validateIso6346Container } from "../domain/iso-6346.js";
import type { ComplianceRule, ContainerDossier, IngestedDocument, ValidationFinding } from "../domain/types.js";

// The cadmium evaluators outgrew this file and now live in their own module.
export { evaluateCadmiumThreshold, evaluateCadmiumWarningThreshold } from "./cadmium-evaluators.js";
export { evaluateColdChainTemperatureAttestation, maxTemperatureC, minTemperatureC } from "./cold-chain-evaluators.js";


export function evaluateCrossDocFieldDiscrepancy(
  key: string,
  rule: ComplianceRule,
  dossier: ContainerDossier,
  docs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  const values: { docType: string; val: string }[] = [];
  if (key === "container_number") {
    values.push({ docType: "DOSSIER_HEADER", val: dossier.containerNumber });
  }
  if (key === "seal_number") {
    values.push({ docType: "DOSSIER_HEADER", val: dossier.sealNumber });
  }

  for (const doc of docs) {
    const fld = doc.extractedFields.find((f) => f.fieldKey === key);
    if (fld && fld.confirmedValue != null) {
      values.push({ docType: doc.documentType, val: String(fld.confirmedValue) });
    }
  }

  const uniqueVals = new Set(values.map((v) => v.val.trim().toUpperCase()));
  if (uniqueVals.size > 1) {
    const summary = values.map((v) => `${v.docType}: ${v.val}`).join(" vs ");
    findings.push({
      ruleId: rule.ruleId,
      severity: rule.severity,
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: summary,
      thresholdValue: "Identity Match",
      messageVi: `Không đồng nhất trường ${key} giữa các chứng từ (${summary}).`,
      messageEn: `Cross-document discrepancy on ${key} (${summary}).`,
    });
  }
}

export function evaluateIsoChecksum(
  rule: ComplianceRule,
  dossier: ContainerDossier,
  findings: ValidationFinding[]
): void {
  const isoRes = validateIso6346Container(dossier.containerNumber);
  if (!isoRes.isValid) {
    findings.push({
      ruleId: rule.ruleId,
      severity: rule.severity,
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: dossier.containerNumber,
      thresholdValue: "ISO 6346 Modulo-11 valid",
      messageVi: `Số container không hợp lệ theo chuẩn ISO 6346: ${isoRes.reason ?? "Lỗi check digit"}.`,
      messageEn: `Container number fails ISO 6346 checksum: ${isoRes.reason ?? "Check digit mismatch"}.`,
    });
  }
}
