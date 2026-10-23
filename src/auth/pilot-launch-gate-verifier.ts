import { buildLaunchGateReport } from "./launch-gate-report-builder.js";
import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { computeGate05KpiFromDossiers, evaluateGate05PilotKpi } from "./pilot-kpi-evaluator.js";
import type { SingleSiteLaunchGateReport, VerifyLaunchGatesOptions } from "./pilot-launch-gate-report-types.js";
import { createWorkspaceApp } from "../server/server.js";

export type { GateCheckStatus, SingleSiteLaunchGateReport, VerifyLaunchGatesOptions } from "./pilot-launch-gate-report-types.js";

export function verifySingleSiteLaunchGates(options: VerifyLaunchGatesOptions = {}): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const dbPath = options.dbPath ?? env.DURIOS_DB_PATH ?? "./data/durios.db";
  const dataDir = options.dataDir ?? env.DURIOS_DATA_DIR ?? "./data/uploads";
  const app = createWorkspaceApp({ dbPath, dataDir });
  try {
    // A recorded attestation beats the caller arguments: an event is chain-linked.
    const auditEvents = app.workspace.auditLedger.getAllEvents();
    return buildLaunchGateReport(app.workspace.auditLedger.verifyIntegrity(), evaluateGate05PilotKpi({ dbPath, dataDir }), { ...options, auditEvents: options.auditEvents ?? auditEvents });
  } finally {
    app.sqliteClient.close();
  }
}

export function evaluateWorkspaceLaunchGates(
  workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, options: VerifyLaunchGatesOptions = {}
): SingleSiteLaunchGateReport {
  const dossiers: readonly ContainerDossier[] = workspace.listDossiers(actor);
  const auditEvents = options.auditEvents ?? workspace.auditLedger.getAllEvents();
  return buildLaunchGateReport(workspace.auditLedger.verifyIntegrity(), computeGate05KpiFromDossiers(dossiers), { ...options, auditEvents });
}
