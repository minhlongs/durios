import type { ContainerDossier } from "../domain/types.js";
import type { AseanTradeCorridorCode } from "../rules/asean-corridor-adapters.js";

export interface VerifiedOrganizationProfile {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantType: string;
  readonly verifiedShipmentsCount: number;
  readonly totalDossiersTracked: number;
  readonly medianDocumentReadinessMinutes: number;
  readonly unresolvedSealMismatches: number;
  readonly documentReliabilityScore: number;
  readonly supportedCorridors: readonly AseanTradeCorridorCode[];
  readonly compiledAtIso: string;
  readonly privacyDisclaimerVi: string;
}

const PRIVACY_DISCLAIMER =
  "Hồ sơ DuriOS Verified Profile được tổng hợp mật mã từ lịch sử thực tế; " +
  "tuyệt đối không chia sẻ danh tính nhà vườn, giá thu mua, hay bí mật thương mại.";

export function compileVerifiedOrganizationProfile(
  tenantId: string,
  tenantName: string,
  tenantType: string,
  dossiers: readonly ContainerDossier[],
  nowIso = new Date().toISOString()
): VerifiedOrganizationProfile {
  const tenantDossiers = dossiers.filter((d) => d.tenantId === tenantId);
  const totalDossiersTracked = tenantDossiers.length;

  const verifiedDossiers = tenantDossiers.filter(
    (d) => d.lifecycleState === "APPROVED_FOR_EXPORT" || d.lifecycleState === "EXPORTED"
  );
  const verifiedShipmentsCount = verifiedDossiers.length;

  const readinessDurationsMinutes: number[] = [];
  let unresolvedSealMismatches = 0;
  let cleanValidationRuns = 0;

  for (const d of tenantDossiers) {
    if (d.createdAt && d.updatedAt) {
      const diffMs = new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime();
      const mins = Math.max(0, Math.round(diffMs / (60 * 1000)));
      readinessDurationsMinutes.push(mins);
    }

    const hasSealMismatch = Boolean(
      d.latestValidationResult?.findings.some(
        (f) => f.ruleId.includes("SEAL") && f.severity === "CRITICAL_BLOCKER"
      )
    );
    if (hasSealMismatch && d.lifecycleState !== "EXPORTED") {
      unresolvedSealMismatches++;
    }

    const isClean =
      d.latestValidationResult?.status === "PASSED" ||
      d.lifecycleState === "APPROVED_FOR_EXPORT" ||
      d.lifecycleState === "EXPORTED";
    if (isClean) {
      cleanValidationRuns++;
    }
  }

  const medianDocumentReadinessMinutes = calculateMedian(readinessDurationsMinutes);
  const rawScore = totalDossiersTracked > 0 ? cleanValidationRuns / totalDossiersTracked : 1.0;
  const documentReliabilityScore = Math.min(1.0, Math.max(0.0, Number(rawScore.toFixed(3))));

  return {
    tenantId,
    tenantName,
    tenantType,
    verifiedShipmentsCount,
    totalDossiersTracked,
    medianDocumentReadinessMinutes,
    unresolvedSealMismatches,
    documentReliabilityScore,
    supportedCorridors: ["VN_CN"],
    compiledAtIso: nowIso,
    privacyDisclaimerVi: PRIVACY_DISCLAIMER,
  };
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? 0;
}
