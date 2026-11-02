import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { GoLiveReadinessReport } from "../domain/pilot-dossier-pack-types.js";
import type { GateEvidenceProvenance } from "../auth/pilot-gate-types.js";

/** Appended to a pack whose evidence the rehearsal drill fabricated for itself. */
export const REHEARSAL_DISCLAIMER =
  "BÁO CÁO DIỄN TẬP TỔNG HỢP (SYNTHETIC REHEARSAL): biên bản chấp thuận, thông tin nhà cung cấp OTP và 5 container " +
  "trong báo cáo này do lệnh diễn tập tự tạo trên dữ liệu tổng hợp. Báo cáo KHÔNG phải xác nhận địa điểm, KHÔNG phải " +
  "chấp thuận của chủ vựa, KHÔNG phải bằng chứng gửi/nhận OTP thật, và goForLiveCustomerData luôn bằng false ở chế độ này.";

/** Appended to a pack whose audit chain did not verify, so its provenance is unprovable. */
export const LEDGER_UNPROVEN_DISCLAIMER =
  "SỔ KIỂM TOÁN KHÔNG XÁC MINH ĐƯỢC (UNPROVEN LEDGER INTEGRITY): chuỗi băm kiểm toán của cơ sở dữ liệu này không toàn " +
  "vẹn, nên không thể chứng minh các container được đo đến từ đâu. Báo cáo KHÔNG phải xác nhận sẵn sàng vận hành và " +
  "goForLiveCustomerData luôn bằng false ở trạng thái này; phải khôi phục sổ kiểm toán hoặc điều tra nguyên nhân trước.";

/** The disclaimer matching a report's provenance, so the pack states why it authorises nothing. */
export function provenanceDisclaimer(provenance: GateEvidenceProvenance): string {
  return provenance === "UNPROVEN_LEDGER_INTEGRITY" ? LEDGER_UNPROVEN_DISCLAIMER : REHEARSAL_DISCLAIMER;
}

/**
 * The exact bytes the pack hash covers. Every field is enumerated rather than
 * spreading the object, so a field added later cannot silently fall outside the seal.
 */
export function serializeReportCore(report: Omit<GoLiveReadinessReport, "reportSha256">): string {
  return JSON.stringify({
    reportVersion: report.reportVersion, reportId: report.reportId, siteCode: report.siteCode,
    compiledAt: report.compiledAt, compiledByActorId: report.compiledByActorId,
    compiledByActorRole: report.compiledByActorRole, overallVerdict: report.overallVerdict,
    goForLiveCustomerData: report.goForLiveCustomerData,
    pilotLifecycleState: report.pilotLifecycleState ?? "BLOCKED",
    policyStatus: report.policyStatus ?? "PREREQUISITES_INCOMPLETE",
    canStartLimitedFiveContainerPilot: report.canStartLimitedFiveContainerPilot ?? false,
    passedGateCount: report.passedGateCount,
    totalGateCount: report.totalGateCount, gates: report.gates,
    fieldAuditorChecklist: report.fieldAuditorChecklist, kpiSnapshot: report.kpiSnapshot,
    statutoryReferences: report.statutoryReferences, mandatoryDisclaimers: report.mandatoryDisclaimers,
    evidenceProvenance: report.evidenceProvenance ?? "OPERATIONAL",
  });
}

export function verifyPilotGoLiveDossierPackIntegrity(report: GoLiveReadinessReport): boolean {
  if (!report || report.reportVersion !== "1.0.0") return false;
  return calculateSha256(serializeReportCore(report)) === report.reportSha256;
}
