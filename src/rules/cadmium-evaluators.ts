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
  const labDoc = docs.find((d) => d.documentType === "LAB_TEST_REPORT");
  // No lab report at all is RUL-DOC-001's finding, not this rule's.
  if (!labDoc) return;
  const val = readCadmium(docs);
  if (val === null) {
    // A lab report that carries no readable cadmium result proves nothing. Returning
    // silently let a dossier whose heaviest-metal evidence was blank validate as
    // PASSED, which is the one outcome a food-safety control must never produce.
    findings.push({
      ruleId: rule.ruleId,
      severity: "CRITICAL_BLOCKER",
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: "NOT_EXTRACTED",
      thresholdValue: "0.050 mg/kg (internal control)",
      messageVi: "KHÔNG ĐỌC ĐƯỢC KẾT QUẢ CADMI: phiếu kiểm nghiệm có trong hồ sơ nhưng trường 'cadmium_mg_kg' trống hoặc không phải số. Không thể kết luận an toàn thực phẩm — cần nạp lại phiếu kiểm nghiệm có kết quả rõ ràng, hoặc nhập giá trị đã kiểm chứng thủ công. Đây là kiểm soát nội bộ, không phải kết luận pháp lý.",
      messageEn: "CADMIUM RESULT NOT READABLE: a lab test report is present but its 'cadmium_mg_kg' field is empty or not numeric. No food-safety conclusion can be drawn — re-upload a legible report or enter a human-verified value. This is an internal control, not a legal determination.",
    });
    return;
  }
  if (val <= 0.050) return;
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
