import type { AuditEvent } from "../domain/types.js";
import type { ContainerKpiMetric } from "./pilot-kpi-evaluator.js";
import { REHEARSAL_DOSSIER_CODE_PREFIX } from "./rehearsal-seed-target-guard.js";

/**
 * Where the containers behind a launch-gate run really came from.
 *
 * The first version of this guard recognised a rehearsal cohort by its dossier-code prefix
 * (`DOS-CAILAY-R*`). That is trivially defeated by renaming a row, so the prefix is now only a
 * legacy signal. The authoritative signal is written at ingest time into the append-only,
 * hash-chained audit ledger: every document ingested while synthetic extraction was enabled
 * leaves a `SYNTHETIC_DOCUMENT_INGESTED` event naming the dossier. Deleting those events breaks
 * `verifyIntegrity()`, which fails the GATE-03 machine check, so a gate cannot be opened by
 * erasing the evidence of synthetic origin either.
 *
 * Limits, stated plainly: this detects data produced through the synthetic/fixture path. A
 * dossier whose fields were typed in by hand from an invented document is not distinguishable
 * from real keyed-in data by any machine check — that is what operator evidence review and
 * Founder sign-off are for.
 */
export const SYNTHETIC_PROVENANCE_EVENT_TYPES: readonly string[] = [
  "SYNTHETIC_DOCUMENT_INGESTED", "REHEARSAL_DOSSIER_SEEDED",
];

export interface CohortProvenance {
  readonly synthetic: boolean;
  readonly signals: readonly string[];
  readonly cohortSize: number;
}

export function resolveCohortProvenance(
  cohort: readonly ContainerKpiMetric[],
  auditEvents: readonly AuditEvent[]
): CohortProvenance {
  const cohortIds = new Set(cohort.map((m) => m.dossierId));
  const signals: string[] = [];
  for (const metric of cohort) {
    if (metric.dossierCode.startsWith(REHEARSAL_DOSSIER_CODE_PREFIX)) signals.push(`REHEARSAL_DOSSIER_CODE:${metric.dossierCode}`);
  }
  for (const event of auditEvents) {
    if (!cohortIds.has(event.dossierId) || !SYNTHETIC_PROVENANCE_EVENT_TYPES.includes(event.eventType)) continue;
    signals.push(`${event.eventType}:${event.dossierId}`);
  }
  return { synthetic: signals.length > 0, signals: [...new Set(signals)].slice(0, 10), cohortSize: cohort.length };
}

/** Legacy, name-only signal — kept so older rehearsal databases are still recognised. */
export function cohortContainsRehearsalData(dossierCodes: readonly string[]): boolean {
  return dossierCodes.some((code) => code.startsWith(REHEARSAL_DOSSIER_CODE_PREFIX));
}
