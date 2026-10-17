import type { ContainerDossier } from "../domain/types.js";
import type { DuriosProductEdition } from "./saas-tier-policy.js";

export interface UsageMeteringSummary {
  readonly tenantId: string;
  readonly evaluatedAt: string;
  readonly activeEdition: DuriosProductEdition;
  readonly totalDossiersCreated: number;
  readonly sealedExportedContainers: number;
  readonly blockedComplianceCatches: number;
  readonly activeDocumentsProcessed: number;
  readonly verifiedFieldsCount: number;
  readonly estimatedManualMinutesSaved: number;
  readonly isNonBindingEstimateOnly: true;
  readonly estimateDisclaimer: string;
  readonly billingEstimateVnd: {
    readonly communitySelfHostedCostVnd: 0;
    readonly proPerContainerRateVnd: 150000;
    readonly proMonthlyFlatCapVnd: 4900000;
    readonly recommendedBillableVnd: number;
    readonly estimatedBorderHoldAvoidanceValueVnd: number;
  };
}

const MINUTES_SAVED_PER_CONTAINER = 40;
const PER_CONTAINER_RATE_VND = 150000;
const MONTHLY_FLAT_CAP_VND = 4900000;
const DEMURRAGE_RISK_PER_CATCH_VND = 15000000;

export function computeTenantUsageAndRoiReport(
  tenantId: string,
  dossiers: readonly ContainerDossier[],
  activeEdition: DuriosProductEdition,
  evaluatedAt = new Date().toISOString()
): UsageMeteringSummary {
  const tenantDossiers = dossiers.filter((d) => d.tenantId === tenantId);
  let sealedExportedContainers = 0;
  let blockedComplianceCatches = 0;
  let activeDocumentsProcessed = 0;
  let verifiedFieldsCount = 0;

  for (const dossier of tenantDossiers) {
    if (dossier.lifecycleState === "EXPORTED" && dossier.isImmutable) {
      sealedExportedContainers++;
    }
    if (
      dossier.lifecycleState === "VALIDATION_BLOCKED" ||
      dossier.latestValidationResult?.status === "BLOCKED"
    ) {
      blockedComplianceCatches++;
    }
    for (const doc of dossier.documents) {
      if (!doc.isSuperseded) {
        activeDocumentsProcessed++;
        for (const field of doc.extractedFields) {
          if (field.verificationStatus === "HUMAN_VERIFIED") {
            verifiedFieldsCount++;
          }
        }
      }
    }
  }

  const estimatedManualMinutesSaved =
    tenantDossiers.length * MINUTES_SAVED_PER_CONTAINER;
  const usageBasedVnd =
    sealedExportedContainers === 0
      ? 0
      : sealedExportedContainers * PER_CONTAINER_RATE_VND;
  const recommendedBillableVnd =
    activeEdition === "COMMUNITY_OPEN_CORE" || sealedExportedContainers === 0
      ? 0
      : Math.min(MONTHLY_FLAT_CAP_VND, usageBasedVnd);

  return {
    tenantId,
    evaluatedAt,
    activeEdition,
    totalDossiersCreated: tenantDossiers.length,
    sealedExportedContainers,
    blockedComplianceCatches,
    activeDocumentsProcessed,
    verifiedFieldsCount,
    estimatedManualMinutesSaved,
    isNonBindingEstimateOnly: true,
    estimateDisclaimer:
      "Simulation estimate only based on local heuristic constants; not a tax invoice, audited time study, or guaranteed financial saving.",
    billingEstimateVnd: {
      communitySelfHostedCostVnd: 0,
      proPerContainerRateVnd: PER_CONTAINER_RATE_VND,
      proMonthlyFlatCapVnd: MONTHLY_FLAT_CAP_VND,
      recommendedBillableVnd,
      estimatedBorderHoldAvoidanceValueVnd:
        blockedComplianceCatches * DEMURRAGE_RISK_PER_CATCH_VND,
    },
  };
}
