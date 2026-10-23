import { existsSync } from "node:fs";
import { assertLoopbackHostname } from "../server/server.js";
import { consentPassFromLedger, recordedAttestationForFile } from "./consent-attestation-ledger.js";
import { verifyConsentEvidence } from "./consent-evidence-verifier.js";
import { createOtpProviderFromEnv } from "./otp-provider.js";
import type { Gate05KpiEvaluationReport } from "./pilot-kpi-evaluator.js";
import type { GateCheckStatus, SingleSiteLaunchGateReport, VerifyLaunchGatesOptions } from "./pilot-launch-gate-report-types.js";
import { verifySiteBackup } from "./site-backup-manager.js";

export function buildLaunchGateReport(
  auditChainValid: boolean,
  kpiSummary: Gate05KpiEvaluationReport,
  options: VerifyLaunchGatesOptions = {}
): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const backupDir = options.backupDir ?? env.DURIOS_BACKUP_DIR;
  const consentPath = options.consentSignedFilePath ?? env.DURIOS_GATE01_CONSENT_FILE;

  // GATE-01 must not call a present file "verified consent": the form is hand-signed paper.
  const recorded = consentPath ? recordedAttestationForFile(options.auditEvents, consentPath) : null;
  const consentEvidence = recorded && consentPath
    ? consentPassFromLedger(consentPath, recorded)
    : verifyConsentEvidence(consentPath, Boolean(options.consentVerified), options.consentVerifiedByName, options.consentAttestedSha256);
  const gate01: GateCheckStatus = { gateId: "GATE-01", title: "Tiếp cận Vựa & Chấp thuận Dữ liệu (Luật DLCN 91/2025/QH15)", passed: consentEvidence.passed, statusLabel: consentEvidence.statusLabel, detail: consentEvidence.detail };
  const otpProvider = createOtpProviderFromEnv(env);
  const gate02Passed = otpProvider.isConfigured;
  // GATE-02 proves only that the gateway is configured: isConfigured is static and no OTP is dispatched.
  const gate02: GateCheckStatus = { gateId: "GATE-02", title: "Kênh OTP Thật (Zalo ZNS / SMS)", passed: gate02Passed, statusLabel: gate02Passed ? "PASS" : "PENDING_PROVIDER_CREDENTIALS", detail: gate02Passed ? `Đã đọc được cấu hình nhà cung cấp OTP '${otpProvider.providerName}'; chưa chứng minh gửi-nhận OTP thật — cần diễn tập gửi thật trên staging trước khi khai trương.` : "Đang ở chế độ fail-closed (UnconfiguredOtpProvider -> 503). Cần cấu hình DURIOS_OTP_PROVIDER và khóa API." };

  let loopbackOk = false;
  const configuredHost = env.DURIOS_HOST ?? "127.0.0.1";
  try { assertLoopbackHostname(configuredHost); loopbackOk = true; } catch { loopbackOk = false; }
  const gate03Passed = loopbackOk && auditChainValid;
  const gate03: GateCheckStatus = { gateId: "GATE-03", title: "Bảo mật On-Prem, Loopback 127.0.0.1 & Toàn vẹn Sổ cái", passed: gate03Passed, statusLabel: gate03Passed ? "PASS" : "SECURITY_CONFIG_INCOMPLETE", detail: gate03Passed ? `Host '${configuredHost}' hợp lệ (loopback) && chuỗi băm kiểm toán toàn vẹn.` : `Loopback=${loopbackOk}, AuditChainValid=${auditChainValid}.` };

  let gate04Passed = false;
  let gate04Detail = "Chưa chỉ định thư mục sao lưu (DURIOS_BACKUP_DIR) để xác minh.";
  if (backupDir && existsSync(backupDir)) {
    const verification = verifySiteBackup(backupDir);
    gate04Passed = verification.valid;
    gate04Detail = verification.valid ? `Bản sao lưu tại '${backupDir}' hợp lệ (100% blob khớp SHA-256).` : `Bản sao lưu lỗi: ${verification.errors.join("; ")}`;
  }
  const gate04: GateCheckStatus = { gateId: "GATE-04", title: "Chứng minh Sao lưu & Khôi phục (Backup/Restore Drill)", passed: gate04Passed, statusLabel: gate04Passed ? "PASS" : "PENDING_VERIFIED_BACKUP", detail: gate04Detail };
  const gate05: GateCheckStatus = { gateId: "GATE-05", title: "Diễn tập 5 Container & Bắt 100% Lỗi Gài Mù (< 5 phút/container)", passed: kpiSummary.gate05Passed, statusLabel: kpiSummary.gate05Passed ? "PASS" : "REHEARSAL_INCOMPLETE", detail: `Containers=${kpiSummary.totalContainers}/5, Mean=${kpiSummary.meanDeltaSeconds}s, BlindFaults=${kpiSummary.blindFaultsCaught}/${kpiSummary.blindFaultCount}.` };

  const gates = [gate01, gate02, gate03, gate04, gate05] as const;
  const passedCount = gates.filter((g) => g.passed).length;
  return {
    evaluatedAt: new Date().toISOString(), goForLiveCustomerData: passedCount === 5,
    passedCount, totalGates: 5, gates, kpiSummary,
  };
}
