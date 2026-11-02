import type { AuditEvent } from "../../src/domain/types.js";
import type { ContainerKpiMetric } from "../../src/auth/pilot-kpi-evaluator.js";

/**
 * Minimal stand-ins for the two inputs of `resolveCohortProvenance`: the KPI rows describing the
 * containers a gate run measured, and the append-only audit events about them. Real values come
 * from the workspace and the ledger; these let a test state the classification rule directly.
 */
export function cohortMetric(dossierId: string, dossierCode: string): ContainerKpiMetric {
  return {
    dossierId, dossierCode, containerNumber: "CSQU3054383", lifecycleState: "APPROVED_FOR_EXPORT",
    tStartIso: "2026-10-30T01:00:00.000Z", tEndIso: "2026-10-30T01:01:00.000Z", deltaSeconds: 60,
    underFiveMinutes: true, underThreeMinutes: true, isBlindFault: false, blindFaultBlocked: false,
  };
}

export function provenanceAuditEvent(dossierId: string, eventType: string): AuditEvent {
  return {
    id: `evt-${dossierId}-${eventType}`, tenantId: "TENANT-CAILAY-PILOT-01", dossierId,
    actorId: "usr-clerk-fixture", actorRole: "CLERK", eventType, entityType: "DOCUMENT",
    entityId: "doc-fixture-01", payloadBefore: null, payloadAfter: null,
    timestamp: "2026-10-30T01:00:00.000Z", eventHash: "hash", previousHash: "prev",
  };
}
