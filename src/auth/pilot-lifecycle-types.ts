import type { EvidenceArtifact } from "./gate-evidence-artifact.js";
import type { GateExternalEvidence, GateVerdict } from "./pilot-gate-types.js";

export type PilotLifecycleState =
  | "BLOCKED"
  | "READY_FOR_FOUNDER_REVIEW"
  | "LIMITED_PILOT_AUTHORIZED"
  | "PILOT_COMPLETED"
  | "PILOT_HOLD";

export type PilotPolicyStatus =
  | "PREREQUISITES_INCOMPLETE"
  | "PENDING_FOUNDER_APPROVAL"
  | "LIMITED_PILOT_AUTHORIZED"
  | "PILOT_GRADUATED"
  | "HOLD_ACTIVE";

export type Gate05SplitId = "GATE-05A" | "GATE-05B";

export interface Gate05SubCheckStatus {
  readonly subGateId: Gate05SplitId;
  readonly title: string;
  readonly passed: boolean;
  readonly statusLabel: string;
  readonly detail: string;
  readonly gateVerdict: GateVerdict;
  readonly externalEvidence: GateExternalEvidence;
}

export interface Gate05SplitReport {
  readonly gate05A: Gate05SubCheckStatus;
  readonly gate05B: Gate05SubCheckStatus;
}

export interface FounderPilotAuthorizationRecord {
  readonly authorizationVersion: "1.0.0";
  readonly authorizationId: string;
  readonly siteCode: string;
  readonly tenantId: string;
  readonly authorizedBy: string;
  readonly authorizedAt: string;
  readonly expiresAt: string;
  readonly maxContainers: 5;
  readonly gate05AEvidenceSha256: string;
  readonly revoked?: boolean | undefined;
  readonly holdReason?: string | undefined;
  readonly note?: string | undefined;
}

export interface FounderPilotAuthorizationStatus {
  readonly status:
    | "PENDING_FOUNDER_APPROVAL"
    | "AUTHORIZED_FOR_LIMITED_PILOT"
    | "REVOKED_OR_HOLD"
    | "EXPIRED"
    | "INVALID_SCOPE_OR_ARTIFACT";
  readonly valid: boolean;
  readonly reason: string;
  readonly record?: FounderPilotAuthorizationRecord | undefined;
  readonly artifact?: EvidenceArtifact | undefined;
}

export interface LiveContainerQuotaStatus {
  readonly maxContainers: 5;
  readonly usedContainers: number;
  readonly remainingContainers: number;
  readonly quotaEnforced: boolean;
  readonly canCreateNextContainer: boolean;
  readonly reason: string;
}
