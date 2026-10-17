import { createWorkspaceApp } from "../server/server.js";
import type { ContainerDossier } from "../domain/types.js";
import {
  evaluateFirstContainerValueMetrics, type FirstContainerValueMetrics,
} from "./pilot-kpi-extended-types.js";

export interface ContainerKpiMetric {
  readonly dossierId: string;
  readonly dossierCode: string;
  readonly containerNumber: string;
  readonly lifecycleState: string;
  readonly tStartIso: string;
  readonly tEndIso: string | null;
  readonly deltaSeconds: number | null;
  readonly underFiveMinutes: boolean;
  readonly underThreeMinutes: boolean;
  readonly isBlindFault: boolean;
  readonly blindFaultBlocked: boolean;
}

export interface Gate05KpiEvaluationReport {
  readonly evaluatedAt: string;
  readonly totalContainers: number;
  readonly reconciledCount: number;
  readonly meanDeltaSeconds: number;
  readonly underFiveMinuteGate: boolean;
  readonly underThreeMinuteTarget: boolean;
  readonly blindFaultCount: number;
  readonly blindFaultsCaught: number;
  readonly zeroMissGate: boolean;
  readonly gate05Passed: boolean;
  readonly containerMetrics: readonly ContainerKpiMetric[];
  readonly firstContainerMetrics?: FirstContainerValueMetrics | undefined;
}

function isBlindFaultDossier(d: ContainerDossier): boolean {
  const hasSealMismatchFinding = Boolean(
    d.latestValidationResult?.findings.some((f) => f.ruleId.includes("SEAL") && f.severity === "CRITICAL_BLOCKER")
  );
  const hasUnverifiedFields = d.documents
    .filter((doc) => !doc.isSuperseded)
    .some((doc) => doc.extractedFields.some((fld) => fld.verificationStatus !== "HUMAN_VERIFIED"));

  return (
    d.lifecycleState === "VALIDATION_BLOCKED" ||
    d.lifecycleState === "HUMAN_VERIFICATION_REQUIRED" ||
    hasSealMismatchFinding ||
    hasUnverifiedFields
  );
}

function isApprovalBlockedForFault(d: ContainerDossier): boolean {
  return (
    d.lifecycleState !== "READY_FOR_REVIEW" &&
    d.lifecycleState !== "APPROVED_FOR_EXPORT" &&
    d.lifecycleState !== "EXPORTED" &&
    !d.isImmutable
  );
}

export function computeGate05KpiFromDossiers(dossiers: readonly ContainerDossier[]): Gate05KpiEvaluationReport {
  const metrics: ContainerKpiMetric[] = dossiers.map((d) => {
    const tStartMs = new Date(d.createdAt).getTime();
    const tEndIso = d.latestValidationResult?.evaluatedAt ?? d.updatedAt ?? null;
    const tEndMs = tEndIso ? new Date(tEndIso).getTime() : null;
    const deltaSeconds =
      tEndMs !== null && Number.isFinite(tStartMs) && Number.isFinite(tEndMs)
        ? Math.max(0, Math.round(((tEndMs - tStartMs) / 1000) * 100) / 100)
        : null;

    const blindFault = isBlindFaultDossier(d);
    const blocked = blindFault ? isApprovalBlockedForFault(d) : false;

    return {
      dossierId: d.id, dossierCode: d.dossierCode, containerNumber: d.containerNumber,
      lifecycleState: d.lifecycleState, tStartIso: d.createdAt, tEndIso, deltaSeconds,
      underFiveMinutes: deltaSeconds !== null && deltaSeconds < 300,
      underThreeMinutes: deltaSeconds !== null && deltaSeconds < 180,
      isBlindFault: blindFault, blindFaultBlocked: blocked,
    };
  });

  const validDeltas = metrics.map((m) => m.deltaSeconds).filter((v): v is number => v !== null);
  const meanDeltaSeconds =
    validDeltas.length > 0
      ? Math.round((validDeltas.reduce((acc, v) => acc + v, 0) / validDeltas.length) * 100) / 100
      : 0;

  const blindFaultMetrics = metrics.filter((m) => m.isBlindFault);
  const blindFaultsCaught = blindFaultMetrics.filter((m) => m.blindFaultBlocked).length;
  const zeroMissGate = blindFaultMetrics.length >= 2 && blindFaultsCaught === blindFaultMetrics.length;
  const underFiveMinuteGate = validDeltas.length >= 5 && meanDeltaSeconds < 300;
  const underThreeMinuteTarget = validDeltas.length >= 5 && meanDeltaSeconds < 180;

  const firstContainerMetrics = dossiers.length > 0 ? evaluateFirstContainerValueMetrics(dossiers[0]!) : undefined;

  return {
    evaluatedAt: new Date().toISOString(),
    totalContainers: metrics.length, reconciledCount: validDeltas.length,
    meanDeltaSeconds, underFiveMinuteGate, underThreeMinuteTarget,
    blindFaultCount: blindFaultMetrics.length, blindFaultsCaught, zeroMissGate,
    gate05Passed: metrics.length >= 5 && underFiveMinuteGate && zeroMissGate,
    containerMetrics: metrics, firstContainerMetrics,
  };
}

export function evaluateGate05PilotKpi(options: { dbPath?: string; dataDir?: string } = {}): Gate05KpiEvaluationReport {
  const app = createWorkspaceApp(options);
  try {
    const rows = app.sqliteClient.db
      .query<{ id: string }, []>("SELECT id FROM container_dossiers ORDER BY created_at ASC, id ASC")
      .all();

    const dossiers: ContainerDossier[] = [];
    for (const r of rows) {
      const raw = app.workspace.getRawDossier(r.id);
      if (raw) dossiers.push(raw);
    }
    return computeGate05KpiFromDossiers(dossiers);
  } finally {
    app.sqliteClient.close();
  }
}

if (import.meta.main) {
  process.stdout.write(`${JSON.stringify(evaluateGate05PilotKpi(), null, 2)}\n`);
}
