import { calculateSha256 } from "../ingestion/document-hasher.js";
import {
  evaluateWorkspaceLaunchGates, verifySingleSiteLaunchGates,
  type SingleSiteLaunchGateReport, type VerifyLaunchGatesOptions,
} from "../auth/pilot-launch-gate-verifier.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type {
  CompilePilotGoLivePackOptions, FieldAuditorChecklistItem, GoLiveReadinessReport,
} from "../domain/pilot-dossier-pack-types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";

const STATUTORY_REFS: readonly string[] = [
  "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 2026-01-01)",
  "Luật Giao dịch điện tử 20/2023/QH15 (hiệu lực 2024-07-01)",
  "Luật Thương mại điện tử 122/2025/QH15 & Nghị định 248/2026/NĐ-CP (hiệu lực 2026-07-01)",
  "Nghị định 52/2024/NĐ-CP về thanh toán không dùng tiền mặt",
];

const MANDATORY_DISCLAIMERS: readonly string[] = [
  "Hồ sơ chuẩn bị nội bộ phục vụ kiểm định cổng khai trương pilot tại một vựa; không thay thế quyết định thông quan hoặc chứng nhận nhà nước.",
  "Nghiêm cấm nạp dữ liệu khách hàng thật trước khi toàn bộ 5 cổng (GATE-01..GATE-05) đều đạt (goForLiveCustomerData === true).",
];

function toGateOpts(opts: CompilePilotGoLivePackOptions): VerifyLaunchGatesOptions {
  const res: Record<string, unknown> = {};
  if (opts.dbPath !== undefined) res.dbPath = opts.dbPath;
  if (opts.dataDir !== undefined) res.dataDir = opts.dataDir;
  if (opts.backupDir !== undefined) res.backupDir = opts.backupDir;
  if (opts.consentSignedFilePath !== undefined) res.consentSignedFilePath = opts.consentSignedFilePath;
  if (opts.tenantId !== undefined) res.tenantId = opts.tenantId;
  if (opts.env !== undefined) res.env = opts.env;
  return res as VerifyLaunchGatesOptions;
}

function buildChecklistFromGates(gateReport: SingleSiteLaunchGateReport): readonly FieldAuditorChecklistItem[] {
  const [g1, g2, g3, g4, g5] = gateReport.gates;
  return [
    { itemId: "CHK-01", linkedGateId: "GATE-01", category: "PDPL_CONSENT", titleVi: "Biên bản chấp thuận xử lý dữ liệu tại vựa & phê duyệt địa điểm", titleEn: "Signed Site Data Processing Consent & Site Approval", statutoryReference: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15", status: g1.passed ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g1.passed, evidenceDetail: g1.detail },
    { itemId: "CHK-02", linkedGateId: "GATE-02", category: "OTP_CHANNEL", titleVi: "Xác thực kênh OTP thật (Zalo ZNS / SMS) hoặc khóa fail-closed", titleEn: "Verified Live OTP Channel or Fail-Closed Gate", statutoryReference: "Luật Giao dịch điện tử 20/2023/QH15", status: g2.passed ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g2.passed, evidenceDetail: g2.detail },
    { itemId: "CHK-03", linkedGateId: "GATE-03", category: "ONPREM_LOOPBACK_AUDIT", titleVi: "Ràng buộc mạng cục bộ 127.0.0.1 & toàn vẹn chuỗi băm sổ cái", titleEn: "On-Prem 127.0.0.1 Loopback Binding & Audit Hash-Chain Integrity", statutoryReference: "GATE-03 On-Prem Security Runbook", status: g3.passed ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g3.passed, evidenceDetail: g3.detail },
    { itemId: "CHK-04", linkedGateId: "GATE-04", category: "BACKUP_RESTORE_DRILL", titleVi: "Diễn tập sao lưu & khôi phục khớp 100% mã băm SHA-256", titleEn: "Verified Site Backup & Restore Drill (100% SHA-256 Match)", statutoryReference: "GATE-04 Backup & Restore Protocol", status: g4.passed ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g4.passed, evidenceDetail: g4.detail },
    { itemId: "CHK-05", linkedGateId: "GATE-05", category: "REHEARSAL_AND_BLIND_FAULTS", titleVi: "Diễn tập 5 container (< 5 phút/container) & chặn 100% lỗi gài mù", titleEn: "5-Container Rehearsal (< 5 min/container) & 100% Blind-Fault Catch", statutoryReference: "GATE-05 Pilot KPI Protocol", status: g5.passed ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g5.passed, evidenceDetail: g5.detail },
  ];
}

function serializeReportCore(report: Omit<GoLiveReadinessReport, "reportSha256">): string {
  return JSON.stringify({
    reportVersion: report.reportVersion, reportId: report.reportId, siteCode: report.siteCode,
    compiledAt: report.compiledAt, compiledByActorId: report.compiledByActorId,
    compiledByActorRole: report.compiledByActorRole, overallVerdict: report.overallVerdict,
    goForLiveCustomerData: report.goForLiveCustomerData, passedGateCount: report.passedGateCount,
    totalGateCount: report.totalGateCount, gates: report.gates,
    fieldAuditorChecklist: report.fieldAuditorChecklist, kpiSnapshot: report.kpiSnapshot,
    statutoryReferences: report.statutoryReferences, mandatoryDisclaimers: report.mandatoryDisclaimers,
  });
}

function finalizeReport(
  gateReport: SingleSiteLaunchGateReport, actorId: string, actorRole: string,
  options: CompilePilotGoLivePackOptions = {}
): GoLiveReadinessReport {
  const siteCode = options.siteCode ?? "SITE-CAILAY-TIENGIANG-01";
  const compiledAt = options.forcedTimestamp ?? gateReport.evaluatedAt;
  const core: Omit<GoLiveReadinessReport, "reportSha256"> = {
    reportVersion: "1.0.0", reportId: `GOLIVE-${siteCode}-${compiledAt.slice(0, 10)}`,
    siteCode, compiledAt, compiledByActorId: actorId, compiledByActorRole: actorRole,
    overallVerdict: !gateReport.goForLiveCustomerData
      ? "HOLD_BLOCKERS_REMAIN"
      : options.rehearsalMode
        ? "READY_FOR_PILOT_GO_LIVE"
        : "GO_FOR_LIVE_CUSTOMER_DATA",
    goForLiveCustomerData: gateReport.goForLiveCustomerData,
    passedGateCount: gateReport.passedCount, totalGateCount: gateReport.totalGates,
    gates: gateReport.gates, fieldAuditorChecklist: buildChecklistFromGates(gateReport),
    kpiSnapshot: gateReport.kpiSummary, statutoryReferences: STATUTORY_REFS,
    mandatoryDisclaimers: MANDATORY_DISCLAIMERS,
  };
  return { ...core, reportSha256: calculateSha256(serializeReportCore(core)) };
}

export function compilePilotGoLiveDossierPack(
  workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, options: CompilePilotGoLivePackOptions = {}
): GoLiveReadinessReport {
  return finalizeReport(evaluateWorkspaceLaunchGates(workspace, actor, toGateOpts(options)), actor.id, actor.role, options);
}

export function compileStandaloneGoLiveDossierPack(
  actorId = "CLI-FIELD-AUDITOR",
  actorRole = "AUDITOR",
  options: CompilePilotGoLivePackOptions = {}
): GoLiveReadinessReport {
  return finalizeReport(verifySingleSiteLaunchGates(toGateOpts(options)), actorId, actorRole, options);
}

export function verifyPilotGoLiveDossierPackIntegrity(report: GoLiveReadinessReport): boolean {
  if (!report || report.reportVersion !== "1.0.0") return false;
  return calculateSha256(serializeReportCore(report)) === report.reportSha256;
}
