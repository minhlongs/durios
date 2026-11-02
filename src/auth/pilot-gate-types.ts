import type { EvidenceArtifact } from "./gate-evidence-artifact.js";
import type { CohortProvenance } from "./gate-cohort-provenance.js";
import type {
  FounderPilotAuthorizationRecord, FounderPilotAuthorizationStatus,
  Gate05SplitReport, LiveContainerQuotaStatus, PilotLifecycleState, PilotPolicyStatus,
} from "./pilot-lifecycle-types.js";

export type {
  FounderPilotAuthorizationRecord, FounderPilotAuthorizationStatus,
  Gate05SplitId, Gate05SplitReport, Gate05SubCheckStatus,
  LiveContainerQuotaStatus, PilotLifecycleState, PilotPolicyStatus,
} from "./pilot-lifecycle-types.js";

export type GateId = "GATE-01" | "GATE-02" | "GATE-03" | "GATE-04" | "GATE-05";

/** What this codebase can compute by itself. Passing it is not a launch decision. */
export interface GateMachineCheck {
  readonly passed: boolean;
  readonly criteria: readonly string[];
}

/** A recorded artifact plus the human who recorded it (`OPERATOR_DECLARED`). */
export interface GateEvidenceOverride {
  readonly filePath: string;
  readonly attestedBy: string;
}

export interface GateExternalEvidence {
  readonly required: readonly string[];
  readonly recorded: readonly string[];
  readonly status: "RECORDED_BY_OPERATOR" | "PENDING_OPERATOR_EVIDENCE";
  readonly attestedBy?: string | undefined;
  readonly artifact?: EvidenceArtifact | undefined;
  readonly note: string;
}

export type GateVerdict = "EVIDENCED_FOR_LAUNCH" | "MACHINE_CHECK_ONLY" | "PENDING";

export interface MachineGateCheck {
  readonly gateId: GateId;
  readonly title: string;
  readonly passed: boolean;
  readonly statusLabel: string;
  readonly detail: string;
  readonly machineCheck: GateMachineCheck;
}

export interface GateCheckStatus extends MachineGateCheck {
  readonly externalEvidence: GateExternalEvidence;
  readonly gateVerdict: GateVerdict;
}

export type GateEvidenceProvenance = "OPERATIONAL" | "SYNTHETIC_REHEARSAL" | "UNPROVEN_LEDGER_INTEGRITY";

export interface SingleSiteLaunchGateReport {
  readonly evaluatedAt: string;
  readonly goForLiveCustomerData: boolean;
  readonly pilotLifecycleState: PilotLifecycleState;
  readonly policyStatus: PilotPolicyStatus;
  readonly canStartLimitedFiveContainerPilot: boolean;
  readonly gate05Split: Gate05SplitReport;
  readonly founderAuthorization: FounderPilotAuthorizationStatus;
  readonly liveContainerQuota: LiveContainerQuotaStatus;
  readonly holdReasons: readonly string[];
  readonly passedCount: number;
  readonly machineChecksPassedCount: number;
  readonly operationalGatesEvidencedCount: number;
  readonly totalGates: 5;
  readonly gates: readonly [GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus];
  readonly kpiSummary: import("./pilot-kpi-evaluator.js").Gate05KpiEvaluationReport;
  readonly evidenceProvenance: GateEvidenceProvenance;
  readonly cohortProvenance?: CohortProvenance | undefined;
  readonly ledgerIntegrityVerified: boolean;
}

export interface VerifyLaunchGatesOptions {
  readonly dbPath?: string; readonly dataDir?: string; readonly backupDir?: string;
  readonly consentSignedFilePath?: string; readonly tenantId?: string; readonly siteCode?: string;
  readonly env?: Record<string, string | undefined>;
  readonly gateEvidence?: Readonly<Record<string, GateEvidenceOverride | undefined>> | undefined;
  readonly rehearsalMode?: boolean | undefined;
  readonly founderAuthorizationFilePath?: string | undefined;
  readonly founderAuthorization?: FounderPilotAuthorizationRecord | undefined;
}
