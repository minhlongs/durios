import type { ContainerDossier } from "../domain/types.js";
import { MANUAL_BASELINE_MINUTES, PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION, VALUE_METRIC_ASSUMPTIONS, type ValueMetricAssumption } from "./pilot-kpi-value-assumptions.js";

// Re-exported so existing importers of this module keep resolving them.
export { MANUAL_BASELINE_MINUTES, PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION, VALUE_METRIC_ASSUMPTIONS, type ValueMetricAssumption } from "./pilot-kpi-value-assumptions.js";

export interface FirstContainerValueMetrics {
  readonly dossierId: string;
  readonly dossierCode: string;
  readonly minutesSavedPerContainer: number;
  readonly humanTouchesPerContainer: number;
  readonly exceptionsDiscoveredPerContainer: number;
  readonly expectedLossAvoidedVnd: number;
  readonly baselineManualMinutes: number;
  readonly actualDurationMinutes: number;
}

export interface AggregateContainerValueMetrics {
  readonly evaluatedContainerCount: number;
  readonly meanMinutesSavedPerContainer: number;
  readonly totalMinutesSaved: number;
  readonly meanHumanTouchesPerContainer: number;
  readonly totalExceptionsDiscovered: number;
  readonly totalExpectedLossAvoidedVnd: number;
  readonly perContainerMetrics: readonly FirstContainerValueMetrics[];
  /** The assumptions every figure above derives from — see VALUE_METRIC_ASSUMPTIONS. */
  readonly assumptions: readonly ValueMetricAssumption[];
}

export function evaluateFirstContainerValueMetrics(
  dossier: ContainerDossier,
  actualDurationMinutesOverride?: number
): FirstContainerValueMetrics {
  const actualDurationMinutes = actualDurationMinutesOverride ?? calculateActualDuration(dossier);
  const minutesSavedPerContainer = Math.max(0, Number((MANUAL_BASELINE_MINUTES - actualDurationMinutes).toFixed(1)));

  let humanTouches = 0;
  for (const doc of dossier.documents) {
    if (!doc.isSuperseded) {
      for (const f of doc.extractedFields) {
        if (f.verificationStatus === "HUMAN_VERIFIED" || f.confirmedValue != null) {
          humanTouches++;
        }
      }
    }
  }

  const findings = dossier.latestValidationResult?.findings ?? [];
  const exceptionsDiscoveredPerContainer = findings.length;
  const criticalExceptionsCount = findings.filter(
    (f) => f.severity === "CRITICAL_BLOCKER"
  ).length;
  const expectedLossAvoidedVnd =
    criticalExceptionsCount * PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION;

  return {
    dossierId: dossier.id,
    dossierCode: dossier.dossierCode,
    minutesSavedPerContainer,
    humanTouchesPerContainer: humanTouches,
    exceptionsDiscoveredPerContainer,
    expectedLossAvoidedVnd,
    baselineManualMinutes: MANUAL_BASELINE_MINUTES,
    actualDurationMinutes,
  };
}

export function evaluateAggregateContainerValueMetrics(
  dossiers: readonly ContainerDossier[]
): AggregateContainerValueMetrics {
  const perContainerMetrics = dossiers.map((d) => evaluateFirstContainerValueMetrics(d));
  const count = perContainerMetrics.length;
  const totalMinutesSaved = Number(
    perContainerMetrics.reduce((acc, m) => acc + m.minutesSavedPerContainer, 0).toFixed(1)
  );
  const meanMinutesSavedPerContainer = count > 0 ? Number((totalMinutesSaved / count).toFixed(1)) : 0;
  const totalTouches = perContainerMetrics.reduce((acc, m) => acc + m.humanTouchesPerContainer, 0);
  const meanHumanTouchesPerContainer = count > 0 ? Number((totalTouches / count).toFixed(1)) : 0;
  const totalExceptionsDiscovered = perContainerMetrics.reduce((acc, m) => acc + m.exceptionsDiscoveredPerContainer, 0);
  const totalExpectedLossAvoidedVnd = perContainerMetrics.reduce((acc, m) => acc + m.expectedLossAvoidedVnd, 0);
  return {
    evaluatedContainerCount: count, meanMinutesSavedPerContainer, totalMinutesSaved,
    meanHumanTouchesPerContainer, totalExceptionsDiscovered, totalExpectedLossAvoidedVnd, perContainerMetrics,
    assumptions: VALUE_METRIC_ASSUMPTIONS,
  };
}

function calculateActualDuration(dossier: ContainerDossier): number {
  if (!dossier.createdAt || !dossier.updatedAt) return 4.0;
  const start = new Date(dossier.createdAt).getTime();
  const end = new Date(dossier.updatedAt).getTime();
  const diffMinutes = (end - start) / (60 * 1000);
  return Math.max(0.5, Number(diffMinutes.toFixed(2)));
}
