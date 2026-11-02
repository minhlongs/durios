import type { EvidenceArtifact } from "./gate-evidence-artifact.js";
import type { CohortProvenance } from "./gate-cohort-provenance.js";

export type GateId = "GATE-01" | "GATE-02" | "GATE-03" | "GATE-04" | "GATE-05";

/** What this codebase can compute by itself. Passing it is not a launch decision. */
export interface GateMachineCheck {
  readonly passed: boolean;
  readonly criteria: readonly string[];
}

/**
 * A recorded artifact plus the human who recorded it. The system never verifies a signature
 * or a site visit; it stores a declaration and names who made it (`OPERATOR_DECLARED`).
 */
export interface GateEvidenceOverride {
  readonly filePath: string;
  readonly attestedBy: string;
}

export interface GateExternalEvidence {
  readonly required: readonly string[];
  readonly recorded: readonly string[];
  readonly status: "RECORDED_BY_OPERATOR" | "PENDING_OPERATOR_EVIDENCE";
  readonly attestedBy?: string | undefined;
  /** What the system could establish about the declared file: existence, size, SHA-256. */
  readonly artifact?: EvidenceArtifact | undefined;
  readonly note: string;
}

/**
 * `EVIDENCED_FOR_LAUNCH` is the only verdict that may open a gate: the machine check passed
 * and a human recorded the external evidence the documented criterion asks for.
 * `MACHINE_CHECK_ONLY` is the honest label for "2/5" on a staging box.
 */
export type GateVerdict = "EVIDENCED_FOR_LAUNCH" | "MACHINE_CHECK_ONLY" | "PENDING";

/** A gate as the builder first computes it, before the evidence split is attached. */
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

/**
 * What the gate evidence is made of.
 *
 * `SYNTHETIC_REHEARSAL` means the artifacts a gate checked were produced by the
 * rehearsal drill itself — a consent file written by the drill, OTP credentials never
 * used to send a code, containers seeded in milliseconds. Such a report can show that
 * the checks run; it can never authorise live customer data.
 *
 * `UNPROVEN_LEDGER_INTEGRITY` means the append-only hash chain did not verify, so where the
 * measured containers came from cannot be established at all. Erasing ledger rows is how someone
 * would try to hide a synthetic origin; a run in that state records evidence for no gate.
 */
export type GateEvidenceProvenance = "OPERATIONAL" | "SYNTHETIC_REHEARSAL" | "UNPROVEN_LEDGER_INTEGRITY";

export interface SingleSiteLaunchGateReport {
  readonly evaluatedAt: string;
  readonly goForLiveCustomerData: boolean;
  /** Machine-checkable criteria that passed. Kept equal to `machineChecksPassedCount`. */
  readonly passedCount: number;
  readonly machineChecksPassedCount: number;
  /** Launch gates holding both a passed machine check and recorded operator evidence. */
  readonly operationalGatesEvidencedCount: number;
  readonly totalGates: 5;
  readonly gates: readonly [GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus, GateCheckStatus];
  readonly kpiSummary: import("./pilot-kpi-evaluator.js").Gate05KpiEvaluationReport;
  readonly evidenceProvenance: GateEvidenceProvenance;
  /** Why the run is operational or synthetic: audit-ledger signals, not dossier names alone. */
  readonly cohortProvenance?: CohortProvenance | undefined;
  /** Whether the hash-chained audit ledger verified. False ⇒ no gate may be evidenced. */
  readonly ledgerIntegrityVerified: boolean;
}

export interface VerifyLaunchGatesOptions {
  readonly dbPath?: string; readonly dataDir?: string; readonly backupDir?: string;
  readonly consentSignedFilePath?: string; readonly tenantId?: string;
  readonly env?: Record<string, string | undefined>;
  /** Operator-recorded evidence per gate; the env contract is documented in pilot-gate-evidence.ts. */
  readonly gateEvidence?: Readonly<Record<string, GateEvidenceOverride | undefined>> | undefined;
  /** Set by the full-gates rehearsal drill, whose evidence the drill fabricates. */
  readonly rehearsalMode?: boolean | undefined;
}
