import type { ComplianceRule, IngestedDocument, ValidationFinding } from "../domain/types.js";

/** The lab-reported cadmium reading a finding is based on, if one exists. */
function readCadmium(docs: readonly IngestedDocument[]): number | null {
  const labDoc = docs.find((d) => d.documentType === "LAB_TEST_REPORT");
  const cdField = labDoc?.extractedFields.find((f) => f.fieldKey === "cadmium_mg_kg");
  if (!cdField) return null;
  const val = Number.parseFloat(String(cdField.confirmedValue ?? cdField.rawValue));
  return Number.isNaN(val) ? null : val;
}

/**
 * The packhouse's internal food-safety stop line.
 *
 * This rule carries no verified statutory basis, so it states plainly that it is an
 * internal control. Phrasing matters: calling it a "statutory limit" would assert a
 * legal basis the repository cannot support, which is exactly the failure the
 * disabled RUL-GB2762-CD rule was withdrawn for.
 */
export function evaluateCadmiumThreshold(
  rule: ComplianceRule,
  docs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  const val = readCadmium(docs);
  if (val === null || val <= 0.050) return;
  findings.push({
    ruleId: rule.ruleId,
    severity: "CRITICAL_BLOCKER",
    ruleName: rule.name,
    citation: rule.statutoryReference,
    observedValue: `${val.toFixed(3)} mg/kg`,
    thresholdValue: "0.050 mg/kg",
    messageVi: `CẢNH BÁO AN TOÀN THỰC PHẨM (KIỂM TRA NỘI BỘ): Hàm lượng Cadmi ${val.toFixed(3)} mg/kg vượt ngưỡng kiểm soát nội bộ 0.050 mg/kg. Đây là kiểm soát nội bộ của nhà đóng gói, không phải kết luận pháp lý và chưa có cơ sở pháp lý được thẩm định.`,
    messageEn: `FOOD SAFETY ALERT (INTERNAL CHECK): Cadmium level ${val.toFixed(3)} mg/kg exceeds the packhouse internal control limit of 0.050 mg/kg. This is an internal packhouse control, not a legal determination, and holds no verified statutory basis.`,
  });
}

/** The packhouse's early-warning buffer, deliberately advisory and non-legal. */
export function evaluateCadmiumWarningThreshold(
  rule: ComplianceRule,
  docs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  const val = readCadmium(docs);
  if (val === null || val <= 0.040) return;
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
