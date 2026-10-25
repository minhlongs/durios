import { describe, expect, it } from "bun:test";
import { computeGate05KpiFromDossiers } from "../src/auth/pilot-kpi-evaluator.js";
import type { ContainerDossier, ExtractedField, ValidationFinding } from "../src/domain/types.js";

function buildSyntheticCohortDossier(
  idx: number,
  options: { durationSeconds: number; humanTouches: number; isBlindFault: boolean }
): ContainerDossier {
  const startMs = Date.parse("2026-10-25T08:00:00.000Z") + idx * 600_000;
  const createdAt = new Date(startMs).toISOString();
  const updatedAt = new Date(startMs + options.durationSeconds * 1000).toISOString();
  const fields: ExtractedField[] = Array.from({ length: options.humanTouches }, (_, fIdx) => ({
    id: `fld-${idx}-${fIdx}`, documentId: `doc-${idx}`, fieldKey: `field_${fIdx}`, label: `Field ${fIdx}`,
    rawValue: "VAL", normalizedValue: "VAL", confirmedValue: "VAL", confidenceScore: 0.99,
    boundingBox: { pageNumber: 1, x: 0, y: 0, width: 10, height: 10 },
    verificationStatus: "HUMAN_VERIFIED", verifiedBy: "actor-qc", verifiedAt: updatedAt,
  }));

  const findings: ValidationFinding[] = options.isBlindFault
    ? [{
        ruleId: "RUL-SEAL-MISMATCH", ruleName: "Container Seal Cross-Check",
        severity: "CRITICAL_BLOCKER", citation: "GACC Decree 248",
        observedValue: "SEAL-01", thresholdValue: "SEAL-02",
        messageVi: "Lỗi gài mù niêm phong", messageEn: "Blind fault seal mismatch",
      }]
    : [];

  return {
    id: `dos-pilot-${idx}`, dossierCode: `DOS-CAILAY-0${idx}`, tenantId: "TENANT-CAILAY-01",
    containerNumber: `CSQU305438${idx}`, sealNumber: `SEAL-0${idx}`, targetMarket: "CN_GACC",
    borderGate: "HUU_NGHI", targetTemperatureC: 13.5, declaredNetWeightKg: 18500,
    declaredBoxCount: 1850, lifecycleState: options.isBlindFault ? "VALIDATION_BLOCKED" : "EXPORTED",
    isImmutable: !options.isBlindFault, createdAt, updatedAt, version: 3,
    documents: [{
      id: `doc-${idx}`, dossierId: `dos-pilot-${idx}`, tenantId: "TENANT-CAILAY-01",
      documentType: "PACKING_LIST", fileName: `packing-${idx}.pdf`, fileSize: 1024,
      mimeType: "application/pdf", sha256Hash: "a".repeat(64), storagePath: `/tmp/packing-${idx}.pdf`,
      uploadedAt: createdAt, isSuperseded: false, extractedFields: fields,
    }],
    latestValidationResult: {
      status: options.isBlindFault ? "BLOCKED" : "PASSED",
      evaluatedAt: updatedAt, criticalBlockers: options.isBlindFault ? 1 : 0,
      advisoryWarnings: 0, evaluatedRulesCount: 5, findings,
    },
  };
}

describe("Multi-Container KPI Value Metrics Aggregation (5-Container Pilot Cohort)", () => {
  it("evaluates and aggregates value metrics across all 5 containers while preserving firstContainerMetrics", () => {
    const cohort: ContainerDossier[] = [
      buildSyntheticCohortDossier(1, { durationSeconds: 150, humanTouches: 4, isBlindFault: false }),
      buildSyntheticCohortDossier(2, { durationSeconds: 180, humanTouches: 5, isBlindFault: false }),
      buildSyntheticCohortDossier(3, { durationSeconds: 120, humanTouches: 3, isBlindFault: true }),
      buildSyntheticCohortDossier(4, { durationSeconds: 165, humanTouches: 4, isBlindFault: true }),
      buildSyntheticCohortDossier(5, { durationSeconds: 135, humanTouches: 4, isBlindFault: false }),
    ];

    const report = computeGate05KpiFromDossiers(cohort);
    expect(report.gate05Passed).toBe(true);
    expect(report.totalContainers).toBe(5);
    expect(report.blindFaultCount).toBe(2);
    expect(report.blindFaultsCaught).toBe(2);
    expect(report.firstContainerMetrics?.dossierCode).toBe("DOS-CAILAY-01");
    expect(report.aggregateValueMetrics?.evaluatedContainerCount).toBe(5);
    expect(report.aggregateValueMetrics?.perContainerMetrics.length).toBe(5);
    expect(report.aggregateValueMetrics?.totalExceptionsDiscovered).toBe(2);
    expect(report.aggregateValueMetrics?.totalExpectedLossAvoidedVnd).toBe(70_000_000);
    expect(report.aggregateValueMetrics?.meanHumanTouchesPerContainer).toBe(4);
    expect(report.aggregateValueMetrics?.meanMinutesSavedPerContainer).toBeGreaterThan(30);
  });
});
