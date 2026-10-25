import type { GateCheckStatus } from "../auth/pilot-launch-gate-verifier.js";
import type { Gate05KpiEvaluationReport } from "../auth/pilot-kpi-evaluator.js";

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
  readonly passedGateCount: number;
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
}
