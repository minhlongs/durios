import { validateIso6346Container } from "../domain/iso-6346.js";
import type { ComplianceRule, ContainerDossier, IngestedDocument, ValidationFinding } from "../domain/types.js";

export function evaluateCadmiumThreshold(
  rule: ComplianceRule,
  docs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  const labDoc = docs.find((d) => d.documentType === "LAB_TEST_REPORT");
  if (!labDoc) return;
  const cdField = labDoc.extractedFields.find((f) => f.fieldKey === "cadmium_mg_kg");
  if (!cdField) return;

  const val = Number.parseFloat(String(cdField.confirmedValue ?? cdField.rawValue));
  if (!Number.isNaN(val) && val > 0.050) {
    findings.push({
      ruleId: rule.ruleId,
      severity: "CRITICAL_BLOCKER",
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: `${val.toFixed(3)} mg/kg`,
      thresholdValue: "0.050 mg/kg",
      messageVi: `Hàm lượng Cadmi (${val.toFixed(3)} mg/kg) vượt ngưỡng pháp định tối đa (0.050 mg/kg).`,
      messageEn: `Cadmium concentration (${val.toFixed(3)} mg/kg) exceeds statutory limit (0.050 mg/kg).`,
    });
  }
}

export function evaluateCadmiumWarningThreshold(
  rule: ComplianceRule,
  docs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  const labDoc = docs.find((d) => d.documentType === "LAB_TEST_REPORT");
  if (!labDoc) return;
  const cdField = labDoc.extractedFields.find((f) => f.fieldKey === "cadmium_mg_kg");
  if (!cdField) return;

  const val = Number.parseFloat(String(cdField.confirmedValue ?? cdField.rawValue));
  if (!Number.isNaN(val) && val > 0.040) {
    findings.push({
      ruleId: rule.ruleId,
      severity: "ADVISORY_WARNING",
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: `${val.toFixed(3)} mg/kg`,
      thresholdValue: "0.040 mg/kg buffer",
      messageVi: `CẢNH BÁO NỘI BỘ: Hàm lượng Cadmi (${val.toFixed(3)} mg/kg) vượt ngưỡng kiểm soát nội bộ nhà đóng gói (>0.040 mg/kg). Đây là cảnh báo phòng ngừa nội bộ, không cấu thành vi phạm pháp lý nếu hàm lượng <= 0.050 mg/kg.`,
      messageEn: `INTERNAL ADVISORY: Cadmium level (${val.toFixed(3)} mg/kg) exceeds packhouse internal safety buffer (>0.040 mg/kg). This is an internal precaution and does not constitute a legal breach if <= 0.050 mg/kg.`,
    });
  }
}

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
