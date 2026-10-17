import type { ContainerDossier } from "../domain/types.js";

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

export const MANUAL_BASELINE_MINUTES = 35;
export const PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION = 35_000_000;

export function evaluateFirstContainerValueMetrics(
  dossier: ContainerDossier,
  actualDurationMinutesOverride?: number
): FirstContainerValueMetrics {
  const actualDurationMinutes =
    actualDurationMinutesOverride ?? calculateActualDuration(dossier);

  const minutesSavedPerContainer = Math.max(
    0,
    Number((MANUAL_BASELINE_MINUTES - actualDurationMinutes).toFixed(1))
  );

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

function calculateActualDuration(dossier: ContainerDossier): number {
  if (!dossier.createdAt || !dossier.updatedAt) return 4.0;
  const start = new Date(dossier.createdAt).getTime();
  const end = new Date(dossier.updatedAt).getTime();
  const diffMinutes = (end - start) / (60 * 1000);
  return Math.max(0.5, Number(diffMinutes.toFixed(2)));
}
