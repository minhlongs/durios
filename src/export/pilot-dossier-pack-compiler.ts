import { calculateSha256 } from "../ingestion/document-hasher.js";
import { provenanceDisclaimer, serializeReportCore } from "./pilot-report-seal.js";

export { verifyPilotGoLiveDossierPackIntegrity } from "./pilot-report-seal.js";
import {
  evaluateWorkspaceLaunchGates, verifySingleSiteLaunchGates,
  type SingleSiteLaunchGateReport, type VerifyLaunchGatesOptions,
} from "../auth/pilot-launch-gate-verifier.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { buildChecklistFromGates } from "./pilot-pack-checklist.js";
import type { CompilePilotGoLivePackOptions, GoLiveReadinessReport } from "../domain/pilot-dossier-pack-types.js";
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
  if (opts.rehearsalMode !== undefined) res.rehearsalMode = opts.rehearsalMode;
  if (opts.gateEvidence !== undefined) res.gateEvidence = opts.gateEvidence;
  return res as VerifyLaunchGatesOptions;
}



function finalizeReport(
  gateReport: SingleSiteLaunchGateReport, actorId: string, actorRole: string,
  options: CompilePilotGoLivePackOptions = {}
): GoLiveReadinessReport {
  const siteCode = options.siteCode ?? "SITE-CAILAY-TIENGIANG-01";
  const compiledAt = options.forcedTimestamp ?? gateReport.evaluatedAt;
  // Anything that is not a proven operational run — a synthetic cohort or an unverifiable
  // ledger — compiles as a report about the drill, never as a launch authorisation.
  const rehearsalMode = options.rehearsalMode === true || gateReport.evidenceProvenance !== "OPERATIONAL";
  const allMachineChecksPassed = gateReport.machineChecksPassedCount === gateReport.totalGates;
  // A launch gate is cleared only when a human recorded the evidence the documented
  // criterion asks for; passing every machine check on a staging box clears nothing.
  const allGatesEvidenced = gateReport.operationalGatesEvidencedCount === gateReport.totalGates;
  const core: Omit<GoLiveReadinessReport, "reportSha256"> = {
    reportVersion: "1.0.0", reportId: `GOLIVE-${siteCode}-${compiledAt.slice(0, 10)}`,
    siteCode, compiledAt, compiledByActorId: actorId, compiledByActorRole: actorRole,
    // Three different statements, kept apart:
    //  - GO_FOR_LIVE_CUSTOMER_DATA: operational run, every machine check passed AND a human
    //    recorded the evidence each documented criterion asks for.
    //  - READY_FOR_PILOT_GO_LIVE: a declared rehearsal showed every machine check can pass.
    //    It describes the drill, authorises nothing, and never sets goForLiveCustomerData.
    //  - HOLD_BLOCKERS_REMAIN: anything else.
    overallVerdict: rehearsalMode
      ? (allMachineChecksPassed ? "READY_FOR_PILOT_GO_LIVE" : "HOLD_BLOCKERS_REMAIN")
      : (allMachineChecksPassed && allGatesEvidenced ? "GO_FOR_LIVE_CUSTOMER_DATA" : "HOLD_BLOCKERS_REMAIN"),
    goForLiveCustomerData: !rehearsalMode && allMachineChecksPassed && allGatesEvidenced,
    passedGateCount: gateReport.machineChecksPassedCount, totalGateCount: gateReport.totalGates,
    machineChecksPassedCount: gateReport.machineChecksPassedCount,
    operationalGatesEvidencedCount: gateReport.operationalGatesEvidencedCount,
    gates: gateReport.gates, fieldAuditorChecklist: buildChecklistFromGates(gateReport),
    kpiSnapshot: gateReport.kpiSummary, statutoryReferences: STATUTORY_REFS,
    mandatoryDisclaimers: rehearsalMode ? [...MANDATORY_DISCLAIMERS, provenanceDisclaimer(gateReport.evidenceProvenance)] : MANDATORY_DISCLAIMERS,
    evidenceProvenance: gateReport.evidenceProvenance,
    ...(gateReport.cohortProvenance ? { cohortProvenance: gateReport.cohortProvenance } : {}),
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
