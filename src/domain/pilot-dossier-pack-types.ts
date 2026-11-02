import type { GateCheckStatus, GateEvidenceProvenance } from "../auth/pilot-launch-gate-verifier.js";
import type { Gate05KpiEvaluationReport } from "../auth/pilot-kpi-evaluator.js";
import type { CohortProvenance } from "../auth/gate-cohort-provenance.js";

export type FieldChecklistStatus = "VERIFIED_READY" | "ACTION_REQUIRED";

export interface FieldAuditorChecklistItem {
  readonly itemId: "CHK-01" | "CHK-02" | "CHK-03" | "CHK-04" | "CHK-05";
  readonly linkedGateId: "GATE-01" | "GATE-02" | "GATE-03" | "GATE-04" | "GATE-05";
  readonly category:
    | "PDPL_CONSENT"
    | "OTP_CHANNEL"
    | "ONPREM_LOOPBACK_AUDIT"
    | "BACKUP_RESTORE_DRILL"
    | "REHEARSAL_AND_BLIND_FAULTS";
  readonly titleVi: string;
  readonly titleEn: string;
  readonly statutoryReference: string;
  readonly status: FieldChecklistStatus;
  readonly passed: boolean;
  readonly evidenceDetail: string;
}

export interface GoLiveReadinessReport {
  readonly reportVersion: "1.0.0";
  readonly reportId: string;
  readonly siteCode: string;
  readonly compiledAt: string;
  readonly compiledByActorId: string;
  readonly compiledByActorRole: string;
  readonly overallVerdict: "READY_FOR_PILOT_GO_LIVE" | "GO_FOR_LIVE_CUSTOMER_DATA" | "HOLD_BLOCKERS_REMAIN";
  readonly goForLiveCustomerData: boolean;
  /** MACHINE-checkable criteria that passed. Not a count of launch gates cleared. */
  readonly passedGateCount: number;
  readonly machineChecksPassedCount: number;
  /** Launch gates holding a passed machine check AND evidence a human recorded. */
  readonly operationalGatesEvidencedCount: number;
  readonly totalGateCount: 5;
  readonly gates: readonly [
    GateCheckStatus,
    GateCheckStatus,
    GateCheckStatus,
    GateCheckStatus,
    GateCheckStatus,
  ];
  readonly fieldAuditorChecklist: readonly FieldAuditorChecklistItem[];
  readonly kpiSnapshot: Gate05KpiEvaluationReport;
  readonly statutoryReferences: readonly string[];
  readonly mandatoryDisclaimers: readonly string[];
  readonly reportSha256: string;
  /**
   * Whether the evidence behind the gate results is operational or was fabricated by
   * the synthetic rehearsal drill. A sealed pack compiled in rehearsal mode always
   * carries `SYNTHETIC_REHEARSAL` and `goForLiveCustomerData: false`, so a rehearsal
   * artifact can never be mistaken for — or reused as — a go-live authorisation.
   */
  readonly evidenceProvenance: GateEvidenceProvenance;
  /** Audit-ledger signals showing whether the cohort holds synthetic containers. */
  readonly cohortProvenance?: CohortProvenance | undefined;
}

export interface CompilePilotGoLivePackOptions {
  readonly siteCode?: string | undefined;
  readonly tenantId?: string | undefined;
  readonly dbPath?: string | undefined;
  readonly dataDir?: string | undefined;
  readonly backupDir?: string | undefined;
  readonly consentSignedFilePath?: string | undefined;
  readonly env?: Record<string, string | undefined> | undefined;
  readonly forcedTimestamp?: string | undefined;
  readonly rehearsalMode?: boolean | undefined;
  /** Operator-recorded evidence per gate (file + who recorded it). */
  readonly gateEvidence?: Readonly<Record<string, import("../auth/pilot-gate-types.js").GateEvidenceOverride | undefined>> | undefined;
}
