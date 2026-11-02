import { describeEvidenceArtifact, inspectEvidenceArtifact } from "./gate-evidence-artifact.js";
import { GATE_EXTERNAL_EVIDENCE_REQUIREMENTS, OPERATOR_EVIDENCE_NOTE } from "./gate-criteria.js";
import { resolveFounderPilotAuthorization } from "./founder-pilot-authorization.js";
import type { Gate05KpiEvaluationReport } from "./pilot-kpi-evaluator.js";
import type { GateCheckStatus, GateEvidenceOverride, GateExternalEvidence, VerifyLaunchGatesOptions } from "./pilot-gate-types.js";
import type {
  FounderPilotAuthorizationStatus, Gate05SplitReport, Gate05SubCheckStatus,
  LiveContainerQuotaStatus, PilotLifecycleState, PilotPolicyStatus,
} from "./pilot-lifecycle-types.js";
import type { AuditEvent } from "../domain/types.js";

export interface PilotLifecycleEvaluation {
  readonly pilotLifecycleState: PilotLifecycleState;
  readonly policyStatus: PilotPolicyStatus;
  readonly canStartLimitedFiveContainerPilot: boolean;
  readonly gate05Split: Gate05SplitReport;
  readonly founderAuthorization: FounderPilotAuthorizationStatus;
  readonly liveContainerQuota: LiveContainerQuotaStatus;
  readonly holdReasons: readonly string[];
}

function buildSubGateEvidence(
  subGateId: "GATE-05A" | "GATE-05B", env: Readonly<Record<string, string | undefined>>,
  overrides?: Readonly<Record<string, GateEvidenceOverride | undefined>>
): GateExternalEvidence {
  const override = overrides?.[subGateId] ?? (subGateId === "GATE-05B" ? overrides?.["GATE-05"] : undefined);
  const envKey = subGateId === "GATE-05A" ? "DURIOS_GATE05A_EVIDENCE_FILE" : "DURIOS_GATE05B_EVIDENCE_FILE";
  const declared = override?.filePath ?? env[envKey] ?? (subGateId === "GATE-05B" ? env.DURIOS_GATE05_EVIDENCE_FILE : "") ?? "";
  const attestedBy = override?.attestedBy ?? env.DURIOS_GATE_EVIDENCE_ATTESTED_BY ?? "";
  const artifact = declared.trim() === "" ? undefined : inspectEvidenceArtifact(declared);
  const recorded = [...(artifact ? [describeEvidenceArtifact(artifact)] : []), ...(attestedBy.trim() ? [`Người ghi nhận: ${attestedBy.trim()}`] : [])];
  const complete = Boolean(artifact && artifact.exists && artifact.isFile && attestedBy.trim() !== "");
  return {
    required: GATE_EXTERNAL_EVIDENCE_REQUIREMENTS["GATE-05"], recorded,
    status: complete ? "RECORDED_BY_OPERATOR" : "PENDING_OPERATOR_EVIDENCE",
    ...(complete ? { attestedBy: attestedBy.trim() } : {}), ...(artifact ? { artifact } : {}),
    note: complete ? OPERATOR_EVIDENCE_NOTE : `Chưa có bằng chứng ${subGateId} (${envKey}).`,
  };
}

export function evaluatePilotLifecyclePolicy(
  auditChainValid: boolean, syntheticCohort: boolean, gates: readonly GateCheckStatus[],
  kpiSummary: Gate05KpiEvaluationReport, options: VerifyLaunchGatesOptions, auditEvents: readonly AuditEvent[]
): PilotLifecycleEvaluation {
  const env = options.env ?? process.env;
  const siteCode = options.siteCode ?? env.DURIOS_SITE_CODE ?? "SITE-CAILAY-TIENGIANG-01";
  const tenantId = options.tenantId ?? env.DURIOS_TENANT_ID ?? "TENANT-CAILAY-PILOT-01";
  const gates01To04Evidenced = gates.slice(0, 4).every((g) => g.gateVerdict === "EVIDENCED_FOR_LAUNCH");
  const [ev05A, ev05B] = [buildSubGateEvidence("GATE-05A", env, options.gateEvidence), buildSubGateEvidence("GATE-05B", env, options.gateEvidence)];
  const legacyGate05Evidenced = gates[4]?.gateVerdict === "EVIDENCED_FOR_LAUNCH" && !syntheticCohort;
  const gate05APassed = (syntheticCohort && kpiSummary.gate05Passed) || ev05A.status === "RECORDED_BY_OPERATOR" || legacyGate05Evidenced;
  const gate05AVerdict = (!syntheticCohort && (ev05A.status === "RECORDED_BY_OPERATOR" || legacyGate05Evidenced)) ? "EVIDENCED_FOR_LAUNCH" : gate05APassed ? "MACHINE_CHECK_ONLY" : "PENDING";
  const gate05A: Gate05SubCheckStatus = {
    subGateId: "GATE-05A", title: "Diễn tập trước Cutover (Pre-Cutover Rehearsal & Blind-Fault Drill)", passed: gate05APassed,
    statusLabel: gate05AVerdict === "EVIDENCED_FOR_LAUNCH" ? "PASS" : gate05APassed ? "PASS_SYNTHETIC_REHEARSAL" : "REHEARSAL_INCOMPLETE",
    detail: gate05AVerdict === "EVIDENCED_FOR_LAUNCH" ? "Đã có biên bản diễn tập GATE-05A hợp lệ." : "Cần hoàn tất diễn tập 5 container + 2 ca mù và ghi nhận DURIOS_GATE05A_EVIDENCE_FILE.",
    gateVerdict: gate05AVerdict, externalEvidence: ev05A,
  };
  const gate05BPassed = !syntheticCohort && auditChainValid && kpiSummary.gate05Passed;
  const gate05BVerdict = (gate05BPassed && ev05B.status === "RECORDED_BY_OPERATOR") ? "EVIDENCED_FOR_LAUNCH" : gate05BPassed ? "MACHINE_CHECK_ONLY" : "PENDING";
  const gate05B: Gate05SubCheckStatus = {
    subGateId: "GATE-05B", title: "Nghiệm thu 5 Container Thật (Live 5-Container Graduation)", passed: gate05BPassed,
    statusLabel: gate05BVerdict === "EVIDENCED_FOR_LAUNCH" ? "PASS" : gate05BPassed ? "MACHINE_CHECK_ONLY" : "LIVE_COHORT_INCOMPLETE",
    detail: `OperationalContainers=${syntheticCohort ? 0 : kpiSummary.totalContainers}/5, Mean=${kpiSummary.meanDeltaSeconds}s, BlindFaults=${kpiSummary.blindFaultsCaught}/${kpiSummary.blindFaultCount}.`,
    gateVerdict: gate05BVerdict, externalEvidence: ev05B,
  };
  const founderAuth = resolveFounderPilotAuthorization({
    filePath: options.founderAuthorizationFilePath ?? env.DURIOS_FOUNDER_PILOT_AUTH_FILE,
    recordOverride: options.founderAuthorization, expectedSiteCode: siteCode, expectedTenantId: tenantId, gate05AArtifactSha256: ev05A.artifact?.sha256,
  });
  const createdIds = new Set(auditEvents.filter((e) => e.eventType === "DOSSIER_CREATED" && e.tenantId === tenantId && e.dossierId).map((e) => e.dossierId!));
  const usedContainers = syntheticCohort ? 0 : Math.max(kpiSummary.totalContainers, createdIds.size);
  const holdReasons: string[] = [];
  if (!auditChainValid) holdReasons.push("UNPROVEN_LEDGER_INTEGRITY: Chuỗi băm sổ cái kiểm toán bị đứt hoặc bị can thiệp.");
  if (env.DURIOS_PILOT_HOLD === "true" || env.DURIOS_PILOT_HOLD_REASON) holdReasons.push(`OPERATOR_HOLD: ${env.DURIOS_PILOT_HOLD_REASON ?? "DURIOS_PILOT_HOLD=true"}`);
  if (founderAuth.status === "REVOKED_OR_HOLD" || founderAuth.status === "EXPIRED" || founderAuth.status === "INVALID_SCOPE_OR_ARTIFACT") holdReasons.push(founderAuth.reason);
  const hasOpCreated = auditEvents.some((e) => e.eventType === "DOSSIER_CREATED" && !String((e.payloadAfter as Record<string, unknown> | null)?.dossierCode ?? "").startsWith("DOS-CAILAY-R"));
  if (options.rehearsalMode !== true && syntheticCohort && (founderAuth.valid || hasOpCreated)) holdReasons.push("SYNTHETIC_CONTAMINATION: Phát hiện dữ liệu synthetic/rehearsal trộn trong DB vận hành.");
  const hasExplicit05AOrFounder = Boolean(options.gateEvidence?.["GATE-05A"] || env.DURIOS_GATE05A_EVIDENCE_FILE || options.founderAuthorizationFilePath || env.DURIOS_FOUNDER_PILOT_AUTH_FILE || options.founderAuthorization);
  const effectiveFounderValid = founderAuth.valid || (!hasExplicit05AOrFounder && legacyGate05Evidenced && gates01To04Evidenced);
  const state: PilotLifecycleState = holdReasons.length > 0 ? "PILOT_HOLD"
    : (!gates01To04Evidenced || gate05AVerdict !== "EVIDENCED_FOR_LAUNCH" || syntheticCohort) ? "BLOCKED"
    : !effectiveFounderValid ? "READY_FOR_FOUNDER_REVIEW" : gate05BVerdict === "EVIDENCED_FOR_LAUNCH" ? "PILOT_COMPLETED" : "LIMITED_PILOT_AUTHORIZED";
  const policyStatus: PilotPolicyStatus = state === "PILOT_HOLD" ? "HOLD_ACTIVE" : state === "PILOT_COMPLETED" ? "PILOT_GRADUATED"
    : state === "LIMITED_PILOT_AUTHORIZED" ? "LIMITED_PILOT_AUTHORIZED" : state === "READY_FOR_FOUNDER_REVIEW" ? "PENDING_FOUNDER_APPROVAL" : "PREREQUISITES_INCOMPLETE";
  return {
    pilotLifecycleState: state, policyStatus, canStartLimitedFiveContainerPilot: state === "LIMITED_PILOT_AUTHORIZED" || state === "PILOT_COMPLETED",
    gate05Split: { gate05A, gate05B }, founderAuthorization: founderAuth, holdReasons,
    liveContainerQuota: {
      maxContainers: 5, usedContainers, remainingContainers: Math.max(0, 5 - usedContainers), quotaEnforced: state !== "PILOT_COMPLETED",
      canCreateNextContainer: state === "PILOT_COMPLETED" || (state === "LIMITED_PILOT_AUTHORIZED" && usedContainers < 5),
      reason: state === "LIMITED_PILOT_AUTHORIZED" ? `Đã dùng ${usedContainers}/5 container trong phạm vi pilot giới hạn.` : `Trạng thái vòng đời: ${state}.`,
    },
  };
}