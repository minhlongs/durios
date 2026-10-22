import { existsSync } from "node:fs";
import { verifyConsentEvidence } from "./consent-evidence-verifier.js";
import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { createOtpProviderFromEnv } from "./otp-provider.js";
import {
  computeGate05KpiFromDossiers, evaluateGate05PilotKpi, type Gate05KpiEvaluationReport,
} from "./pilot-kpi-evaluator.js";
import { verifySiteBackup } from "./site-backup-manager.js";
import { assertLoopbackHostname, createWorkspaceApp } from "../server/server.js";

export interface GateCheckStatus {
  readonly gateId: "GATE-01" | "GATE-02" | "GATE-03" | "GATE-04" | "GATE-05";
  readonly title: string; readonly passed: boolean;
  readonly statusLabel: string; readonly detail: string;
}

export interface SingleSiteLaunchGateReport {
  readonly evaluatedAt: string; readonly goForLiveCustomerData: boolean;
  readonly passedCount: number; readonly totalGates: 5;
  readonly gates: readonly [GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus];
  readonly kpiSummary: Gate05KpiEvaluationReport;
}

export interface VerifyLaunchGatesOptions {
  readonly dbPath?: string; readonly dataDir?: string; readonly backupDir?: string;
  readonly consentSignedFilePath?: string;
  /**
   * Set only by an auditor who has compared the file against the signed paper
   * original. File bytes alone can never prove a signature on a scan.
   */
  readonly consentVerified?: boolean;
  /** Who attested, so a PASS is attributable after the fact. */
  readonly consentVerifiedByName?: string;
  readonly env?: Record<string, string | undefined>;
}

function buildGateReport(
  auditChainValid: boolean,
  kpiSummary: Gate05KpiEvaluationReport,
  options: VerifyLaunchGatesOptions = {}
): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const backupDir = options.backupDir ?? env.DURIOS_BACKUP_DIR;
  const consentPath = options.consentSignedFilePath ?? env.DURIOS_GATE01_CONSENT_FILE;

  // GATE-01 must not call a present file "verified consent": the consent form is a
  // hand-signed paper document, so file bytes cannot prove a signature.
  const consentEvidence = verifyConsentEvidence(consentPath, Boolean(options.consentVerified), options.consentVerifiedByName);
  const gate01: GateCheckStatus = { gateId: "GATE-01", title: "Tiếp cận Vựa & Chấp thuận Dữ liệu (Luật DLCN 91/2025/QH15)", passed: consentEvidence.passed, statusLabel: consentEvidence.statusLabel, detail: consentEvidence.detail };
  const otpProvider = createOtpProviderFromEnv(env);
  const gate02Passed = otpProvider.isConfigured;
  // GATE-02 proves only that the gateway is configured: isConfigured is a static flag
  // and no OTP is dispatched here, so the detail says exactly what was checked.
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

export function evaluateWorkspaceLaunchGates(
  workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, options: VerifyLaunchGatesOptions = {}
): SingleSiteLaunchGateReport {
  const dossiers: readonly ContainerDossier[] = workspace.listDossiers(actor);
  return buildGateReport(workspace.auditLedger.verifyIntegrity(), computeGate05KpiFromDossiers(dossiers), options);
}

export function verifySingleSiteLaunchGates(options: VerifyLaunchGatesOptions = {}): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const dbPath = options.dbPath ?? env.DURIOS_DB_PATH ?? "./data/durios.db";
  const dataDir = options.dataDir ?? env.DURIOS_DATA_DIR ?? "./data/uploads";
  const app = createWorkspaceApp({ dbPath, dataDir });
  try {
    return buildGateReport(app.workspace.auditLedger.verifyIntegrity(), evaluateGate05PilotKpi({ dbPath, dataDir }), options);
  } finally {
    app.sqliteClient.close();
  }
}
