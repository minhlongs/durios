import { statSync } from "node:fs";

/**
 * GATE-01 evaluates a signed site consent record. The authoritative form is a
 * hand-filled paper document (docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md),
 * so the file on disk is expected to be a scan or photo of a signed document:
 * bytes that carry no machine-checkable signature. This module therefore reports
 * exactly what was observed and never upgrades "a file exists" into "consent verified".
 */
export type ConsentEvidenceStatus =
  | "PASS"
  | "PENDING_SITE_AND_CONSENT_SIGN_OFF"
  | "PENDING_SIGNED_CONSENT_INCOMPLETE";

export interface ConsentEvidenceReport {
  readonly passed: boolean;
  readonly statusLabel: ConsentEvidenceStatus;
  readonly detail: string;
}

const MISSING_CONSENT_DETAIL =
  "Chưa có biên bản chấp thuận dữ liệu đã ký (DURIOS_GATE01_CONSENT_FILE). Nghiêm cấm nạp dữ liệu khách hàng thật.";

function incompleteConsent(byteSize: number): ConsentEvidenceReport {
  return {
    passed: false,
    statusLabel: "PENDING_SIGNED_CONSENT_INCOMPLETE",
    detail:
      `Có tệp tại DURIOS_GATE01_CONSENT_FILE (${byteSize} byte) nhưng bằng chứng chưa đủ để khẳng định đã ký. ` +
      "Cần kiểm toán viên đối chiếu nội dung biên bản gốc. Nghiêm cấm nạp dữ liệu khách hàng thật.",
  };
}

export function verifyConsentEvidence(
  consentPath: string | undefined,
  consentVerifiedByAuditor = false
): ConsentEvidenceReport {
  if (!consentPath) return { passed: false, statusLabel: "PENDING_SITE_AND_CONSENT_SIGN_OFF", detail: MISSING_CONSENT_DETAIL };

  const byteSize = sizeOfFile(consentPath);
  if (byteSize === null) return { passed: false, statusLabel: "PENDING_SITE_AND_CONSENT_SIGN_OFF", detail: MISSING_CONSENT_DETAIL };

  // A hand-signed scanned consent record is never empty, and DuriOS cannot read a
  // signature out of a scan. So a present file is evidence of a *path*, not of a
  // signature: it stays incomplete until an auditor confirms the signed original.
  if (!consentVerifiedByAuditor) return incompleteConsent(byteSize);

  // The attestation vouches for a document, so the document must be there to attest.
  if (byteSize === 0) return incompleteConsent(byteSize);

  return {
    passed: true,
    statusLabel: "PASS",
    detail: `Kiểm toán viên đã đối chiếu biên bản chấp thuận đã ký (${byteSize} byte) tại '${consentPath}' với bản gốc.`,
  };
}

function sizeOfFile(path: string): number | null {
  try {
    return statSync(path).size;
  } catch {
    return null;
  }
}
