import type { IngestedDocument, ValidationFinding } from "../domain/types.js";

/**
 * The human-verification gate: the first active field that no human has confirmed.
 *
 * Returned as a finding rather than pushed onto a list because the engine stops the
 * whole run here — rules must not evaluate over values nobody has attested to.
 */
export function findHumanVerificationGateFinding(
  activeDocs: readonly IngestedDocument[]
): ValidationFinding | null {
  for (const doc of activeDocs) {
    for (const field of doc.extractedFields) {
      if (field.verificationStatus === "HUMAN_VERIFIED") continue;
      return {
        ruleId: "RUL-GATE-UNVERIFIED", severity: "CRITICAL_BLOCKER",
        ruleName: "Human Verification Gate", citation: "DuriOS Regulatory Safety Standard Art 3.1",
        observedValue: `Field '${field.fieldKey}' is ${field.verificationStatus}`,
        thresholdValue: "HUMAN_VERIFIED",
        messageVi: `Trường '${field.label}' chưa được nhân viên kiểm chứng.`,
        messageEn: `Field '${field.label}' has not been human verified.`,
      };
    }
  }
  return null;
}

/**
 * Fail closed on a document the system could not read.
 *
 * An uploaded file whose extraction produced no fields at all — an image or scan no
 * adapter supports, a corrupt payload, an adapter that threw — is evidence DuriOS
 * holds but cannot read. Treating it as satisfied let a dossier reach PASSED with a
 * mandatory document attached as an unreadable blob, so every such document blocks
 * until a readable file is supplied or the values are entered and verified by hand.
 */
export function pushUnreadableDocumentFindings(
  activeDocs: readonly IngestedDocument[],
  findings: ValidationFinding[]
): void {
  for (const doc of activeDocs) {
    if (doc.extractedFields.length > 0) continue;
    findings.push({
      ruleId: "RUL-DOC-UNREADABLE", severity: "CRITICAL_BLOCKER",
      ruleName: "Document Content Not Extracted",
      citation: "DuriOS Regulatory Safety Standard Art 3.2 — no evidence without readable content",
      observedValue: `${doc.documentType} '${doc.fileName}' yielded 0 extracted fields`,
      thresholdValue: "At least 1 extracted field",
      messageVi: `Không trích xuất được dữ liệu từ '${doc.fileName}' (${doc.documentType}): tệp có thể là ảnh chụp/scan mà hệ thống chưa đọc được, hoặc nội dung không hợp lệ. Hồ sơ bị chặn cho đến khi nạp tệp đọc được (PDF/văn bản) hoặc nhập thủ công các trường và kiểm chứng.`,
      messageEn: `No data could be extracted from '${doc.fileName}' (${doc.documentType}): the file may be an image/scan this build cannot read, or its content is invalid. The dossier is blocked until a readable file (PDF/text) is uploaded or the fields are entered and verified by hand.`,
    });
  }
}
