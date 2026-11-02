import { existsSync } from "node:fs";
import { createOtpProviderFromEnv } from "./otp-provider.js";
import { verifySiteBackup } from "./site-backup-manager.js";
import { assertLoopbackHostname } from "../server/server.js";
import type { Gate05KpiEvaluationReport } from "./pilot-kpi-evaluator.js";
import type {
  GateCheckStatus, GateEvidenceProvenance, MachineGateCheck, SingleSiteLaunchGateReport, VerifyLaunchGatesOptions,
} from "./pilot-gate-types.js";
import { GATE_MACHINE_CRITERIA, resolveGateExternalEvidence, withGateEvidenceSplit } from "./pilot-gate-evidence.js";
import { resolveCohortProvenance } from "./gate-cohort-provenance.js";
import { evaluatePilotLifecyclePolicy } from "./pilot-lifecycle-policy.js";
import type { AuditEvent } from "../domain/types.js";

export function buildGateReport(
  auditChainValid: boolean,
  kpiSummary: Gate05KpiEvaluationReport,
  options: VerifyLaunchGatesOptions = {},
  auditEvents: readonly AuditEvent[] = []
): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const backupDir = options.backupDir ?? env.DURIOS_BACKUP_DIR;
  const consentPath = options.consentSignedFilePath ?? env.DURIOS_GATE01_CONSENT_FILE;
  const cohortProvenance = resolveCohortProvenance(kpiSummary.containerMetrics, auditEvents);
  const syntheticCohort = options.rehearsalMode === true || cohortProvenance.synthetic;
  const rehearsalMode = syntheticCohort || !auditChainValid;
  const evidenceProvenance: GateEvidenceProvenance = syntheticCohort
    ? "SYNTHETIC_REHEARSAL"
    : auditChainValid ? "OPERATIONAL" : "UNPROVEN_LEDGER_INTEGRITY";
  const passLabel = syntheticCohort ? "PASS_SYNTHETIC_REHEARSAL" : auditChainValid ? "PASS" : "PASS_LEDGER_INTEGRITY_UNPROVEN";
  const rehearsalNote = syntheticCohort
    ? " [DIỄN TẬP TỔNG HỢP] Bằng chứng của cổng này do chính lệnh diễn tập tạo ra, không phải xác nhận thực địa; không có giá trị phê duyệt nạp dữ liệu khách hàng thật."
    : auditChainValid ? ""
    : " [SỔ KIỂM TOÁN KHÔNG XÁC MINH ĐƯỢC] Chuỗi băm kiểm toán không toàn vẹn nên không chứng minh được dữ liệu này từ đâu tới; không cổng nào được ghi nhận bằng chứng vận hành.";

  const gate01Passed = Boolean(consentPath && existsSync(consentPath));
  const gate01: MachineGateCheck = { machineCheck: { passed: gate01Passed, criteria: GATE_MACHINE_CRITERIA["GATE-01"] }, gateId: "GATE-01", title: "Tiếp cận Vựa & Chấp thuận Dữ liệu (Luật DLCN 91/2025/QH15)", passed: gate01Passed, statusLabel: gate01Passed ? passLabel : "PENDING_SITE_AND_CONSENT_SIGN_OFF", detail: gate01Passed ? `Biên bản chấp thuận đã ký tại '${consentPath}'.${rehearsalNote}` : "Chưa có biên bản chấp thuận dữ liệu đã ký (DURIOS_GATE01_CONSENT_FILE). Nghiêm cấm nạp dữ liệu khách hàng thật." };
  const otpProvider = createOtpProviderFromEnv(env);
  const gate02Passed = otpProvider.isConfigured;
  const gate02: MachineGateCheck = { machineCheck: { passed: gate02Passed, criteria: GATE_MACHINE_CRITERIA["GATE-02"] }, gateId: "GATE-02", title: "Kênh OTP Thật (Zalo ZNS / SMS)", passed: gate02Passed, statusLabel: gate02Passed ? passLabel : "PENDING_PROVIDER_CREDENTIALS", detail: gate02Passed ? `Đã cấu hình nhà cung cấp OTP '${otpProvider.providerName}'.${rehearsalNote}` : "Đang ở chế độ fail-closed (UnconfiguredOtpProvider -> 503). Cần cấu hình DURIOS_OTP_PROVIDER và khóa API." };

  let loopbackOk = false;
  const configuredHost = env.DURIOS_HOST ?? "127.0.0.1";
  try { assertLoopbackHostname(configuredHost); loopbackOk = true; } catch { loopbackOk = false; }
  const gate03Passed = loopbackOk && auditChainValid;
  const gate03: MachineGateCheck = { machineCheck: { passed: gate03Passed, criteria: GATE_MACHINE_CRITERIA["GATE-03"] }, gateId: "GATE-03", title: "Bảo mật On-Prem, Loopback 127.0.0.1 & Toàn vẹn Sổ cái", passed: gate03Passed, statusLabel: gate03Passed ? passLabel : "SECURITY_CONFIG_INCOMPLETE", detail: gate03Passed ? `Host '${configuredHost}' hợp lệ (loopback) && chuỗi băm kiểm toán toàn vẹn.${rehearsalNote}` : `Loopback=${loopbackOk}, AuditChainValid=${auditChainValid}.` };

  let gate04Passed = false;
  let gate04Detail = "Chưa chỉ định thư mục sao lưu (DURIOS_BACKUP_DIR) để xác minh.";
  if (backupDir && existsSync(backupDir)) {
    const verification = verifySiteBackup(backupDir);
    gate04Passed = verification.valid;
    gate04Detail = verification.valid ? `Bản sao lưu tại '${backupDir}' hợp lệ (100% blob khớp SHA-256).` : `Bản sao lưu lỗi: ${verification.errors.join("; ")}`;
  }
  const gate04: MachineGateCheck = { machineCheck: { passed: gate04Passed, criteria: GATE_MACHINE_CRITERIA["GATE-04"] }, gateId: "GATE-04", title: "Chứng minh Sao lưu & Khôi phục (Backup/Restore Drill)", passed: gate04Passed, statusLabel: gate04Passed ? passLabel : "PENDING_VERIFIED_BACKUP", detail: `${gate04Detail}${rehearsalNote}` };
  const mergedOverrides = {
    ...options.gateEvidence,
    ...(!options.gateEvidence?.["GATE-05"] && options.gateEvidence?.["GATE-05B"] ? { "GATE-05": options.gateEvidence["GATE-05B"] } : {}),
  };
  const stopwatchAttested = !rehearsalMode && kpiSummary.gate05Passed && resolveGateExternalEvidence("GATE-05", env, mergedOverrides).status === "RECORDED_BY_OPERATOR";
  const effectiveKpi: Gate05KpiEvaluationReport = stopwatchAttested ? { ...kpiSummary, timingEvidenceSource: "HUMAN_STOPWATCH_ATTESTED" } : kpiSummary;
  const gate05: MachineGateCheck = { machineCheck: { passed: effectiveKpi.gate05Passed, criteria: GATE_MACHINE_CRITERIA["GATE-05"] }, gateId: "GATE-05", title: "Diễn tập 5 Container & Bắt 100% Lỗi Gài Mù (< 5 phút/container)", passed: effectiveKpi.gate05Passed, statusLabel: effectiveKpi.gate05Passed ? passLabel : "REHEARSAL_INCOMPLETE", detail: `Containers=${effectiveKpi.totalContainers}/5, Mean=${effectiveKpi.meanDeltaSeconds}s, BlindFaults=${effectiveKpi.blindFaultsCaught}/${effectiveKpi.blindFaultCount}. Nguồn thời gian=${effectiveKpi.timingEvidenceSource}: khoảng thời gian lấy từ dấu thời gian hệ thống, KHÔNG thay thế biên bản bấm giờ của người vận hành theo GATE-05.${rehearsalNote}` };

  const machineGates = [gate01, gate02, gate03, gate04, gate05];
  const extras = effectiveKpi.timingEvidenceSource === "HUMAN_STOPWATCH_ATTESTED"
    ? { "GATE-05": ["timingEvidenceSource = HUMAN_STOPWATCH_ATTESTED (biên bản bấm giờ của người vận hành)"] }
    : {};
  const gates = withGateEvidenceSplit(machineGates, env, mergedOverrides, extras, rehearsalMode) as readonly
    [GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus];
  const machineChecksPassedCount = machineGates.filter((g) => g.machineCheck.passed).length;
  const operationalGatesEvidencedCount = gates.filter((g) => g.gateVerdict === "EVIDENCED_FOR_LAUNCH").length;
  const lifecycle = evaluatePilotLifecyclePolicy(auditChainValid, syntheticCohort, gates, effectiveKpi, options, auditEvents);
  return {
    evaluatedAt: new Date().toISOString(),
    goForLiveCustomerData: lifecycle.pilotLifecycleState === "PILOT_COMPLETED" && operationalGatesEvidencedCount === 5 && !rehearsalMode,
    ...lifecycle,
    passedCount: machineChecksPassedCount, machineChecksPassedCount, operationalGatesEvidencedCount,
    totalGates: 5, gates, kpiSummary: effectiveKpi, evidenceProvenance, cohortProvenance, ledgerIntegrityVerified: auditChainValid,
  };
}
