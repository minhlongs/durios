import type { ContainerDossier } from "../domain/types.js";

/**
 * Where the reconciliation timings came from. `SYSTEM_TIMESTAMPS` means the delta was
 * derived from row timestamps this process wrote, which a seeded or scripted rehearsal
 * produces in milliseconds. GATE-05 is defined against a human stopwatch protocol, so
 * anything other than `HUMAN_STOPWATCH_ATTESTED` is not evidence of handling time.
 */
export type TimingEvidenceSource = "SYSTEM_TIMESTAMPS" | "HUMAN_STOPWATCH_ATTESTED";

/** Whether the minutes-saved / loss-avoided figures were measured or assumed. */
export type ValueMetricsProvenance = "UNVALIDATED_ASSUMPTION" | "FIELD_MEASURED";

/**
 * The GATE-05 cohort for one tenant: only the dossiers that tenant owns.
 *
 * `listDossiers` also returns dossiers another tenant shared with this actor. A shared
 * container is not this tenant's reconciliation work, so folding it into the cohort
 * both disclosed another tenant's dossier codes and container numbers inside this
 * tenant's KPI payload and let a tenant's launch-gate readiness be satisfied by
 * somebody else's rehearsal containers.
 */
export function selectOwnTenantDossiers(
  dossiers: readonly ContainerDossier[],
  tenantId: string
): readonly ContainerDossier[] {
  return dossiers.filter((d) => d.tenantId === tenantId);
}

/** A container counts as a blind fault if the dossier is parked anywhere but a clean state. */
export function isBlindFaultDossier(d: ContainerDossier): boolean {
  const hasSealMismatchFinding = Boolean(d.latestValidationResult?.findings.some((f) => f.ruleId.includes("SEAL") && f.severity === "CRITICAL_BLOCKER"));
  const hasUnverifiedFields = d.documents.filter((doc) => !doc.isSuperseded).some((doc) => doc.extractedFields.some((fld) => fld.verificationStatus !== "HUMAN_VERIFIED"));
  return d.lifecycleState === "VALIDATION_BLOCKED" || d.lifecycleState === "HUMAN_VERIFICATION_REQUIRED" || hasSealMismatchFinding || hasUnverifiedFields;
}

/** The fault was caught if the workflow actually stopped it short of export. */
export function isApprovalBlockedForFault(d: ContainerDossier): boolean {
  return d.lifecycleState !== "READY_FOR_REVIEW" && d.lifecycleState !== "APPROVED_FOR_EXPORT" && d.lifecycleState !== "EXPORTED" && !d.isImmutable;
}
