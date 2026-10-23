import type { AuditEvent } from "../domain/types.js";
import type { Gate05KpiEvaluationReport } from "./pilot-kpi-evaluator.js";

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
  /** Hex SHA-256 the auditor recorded for the signed original. GATE-01 binds to it. */
  readonly consentAttestedSha256?: string | undefined;
  /** Audit events, when the caller can read them: a ledger attestation beats an argument. */
  readonly auditEvents?: readonly AuditEvent[] | undefined;
  readonly env?: Record<string, string | undefined>;
}
