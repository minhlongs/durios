import { readFileSync, statSync } from "node:fs";
import { calculateSha256 } from "../ingestion/document-hasher.js";

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

/**
 * @param consentAttestedSha256 Hex digest recorded when the auditor compared the file
 *   with the signed paper original. An attestation without it is refused: the name alone
 *   cannot bind the PASS to a specific document, so a swapped file would still pass.
 */
export function verifyConsentEvidence(
  consentPath: string | undefined,
  consentVerifiedByAuditor = false,
  consentVerifiedByName?: string | undefined,
  consentAttestedSha256?: string | undefined
): ConsentEvidenceReport {
  if (!consentPath) return { passed: false, statusLabel: "PENDING_SITE_AND_CONSENT_SIGN_OFF", detail: MISSING_CONSENT_DETAIL };

  const byteSize = sizeOfFile(consentPath);
  if (byteSize === null) return { passed: false, statusLabel: "PENDING_SITE_AND_CONSENT_SIGN_OFF", detail: MISSING_CONSENT_DETAIL };

  // A non-empty file is a precondition for both branches: an attestation vouches for
  // a document, so there must be a document to attest. Anything with no bytes in it
  // stays incomplete even when attested.
  if (byteSize === 0) return incompleteConsent(byteSize);

  // Without an attestation, a present file is evidence of a path and nothing more:
  // DuriOS cannot read a signature out of a scan, so the gate stays shut.
  if (!consentVerifiedByAuditor) return incompleteConsent(byteSize);

  const attestedBy = consentVerifiedByName?.trim() || "(chưa ghi tên)";
  const expectedHash = consentAttestedSha256?.trim();
  if (!expectedHash) {
    return {
      passed: false,
      statusLabel: "PENDING_SIGNED_CONSENT_INCOMPLETE",
      detail:
        `Kiểm toán viên ${attestedBy} xác nhận đã đối chiếu nhưng chưa ghi nhận mã băm SHA-256 của biên bản gốc, ` +
        `nên không thể ràng buộc kết quả này với một tệp cụ thể. Nghiêm cấm nạp dữ liệu khách hàng thật.`,
    };
  }

  const actualHash = calculateSha256(readFileSync(consentPath));
  if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
    return {
      passed: false,
      statusLabel: "PENDING_SIGNED_CONSENT_INCOMPLETE",
      detail:
        `Mã băm SHA-256 của tệp tại '${consentPath}' không khớp mã băm mà kiểm toán viên ${attestedBy} đã ghi nhận. ` +
        `Có thể tệp đã bị thay thế sau khi xác nhận. Nghiêm cấm nạp dữ liệu khách hàng thật.`,
    };
  }

  return {
    passed: true,
    statusLabel: "PASS",
    detail: `Kiểm toán viên ${attestedBy} đã đối chiếu biên bản chấp thuận đã ký (${byteSize} byte, SHA-256 khớp) tại '${consentPath}' với bản gốc.`,
  };
}

function sizeOfFile(path: string): number | null {
  try {
    return statSync(path).size;
  } catch {
    return null;
  }
}
