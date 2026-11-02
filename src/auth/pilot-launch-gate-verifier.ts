import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { computeGate05KpiFromDossiers, evaluateGate05PilotKpi, selectOwnTenantDossiers } from "./pilot-kpi-evaluator.js";
import { buildGateReport } from "./pilot-gate-report-builder.js";
import { summarizeGateReport } from "./pilot-gate-summary.js";
import { createWorkspaceApp } from "../server/server.js";
import type { SingleSiteLaunchGateReport, VerifyLaunchGatesOptions } from "./pilot-gate-types.js";
import { parsePilotCliDbOptions } from "./cli-db-args.js";

export type {
  GateCheckStatus, GateEvidenceProvenance, SingleSiteLaunchGateReport, VerifyLaunchGatesOptions,
} from "./pilot-gate-types.js";

export function evaluateWorkspaceLaunchGates(
  workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, options: VerifyLaunchGatesOptions = {}
): SingleSiteLaunchGateReport {
  // Readiness is a statement about one tenant's own rehearsal cohort: dossiers that
  // another tenant merely shared with this actor must not be able to satisfy GATE-05.
  const dossiers: readonly ContainerDossier[] = selectOwnTenantDossiers(workspace.listDossiers(actor), actor.tenantId);
  return buildGateReport(
    workspace.auditLedger.verifyIntegrity(), computeGate05KpiFromDossiers(dossiers),
    { ...options, tenantId: options.tenantId ?? actor.tenantId }, workspace.auditLedger.getAllEvents()
  );
}

export function verifySingleSiteLaunchGates(options: VerifyLaunchGatesOptions = {}): SingleSiteLaunchGateReport {
  const env = options.env ?? process.env;
  const dbPath = options.dbPath ?? env.DURIOS_DB_PATH ?? "./data/durios.db";
  const dataDir = options.dataDir ?? env.DURIOS_DATA_DIR ?? "./data/uploads";
  const app = createWorkspaceApp({ dbPath, dataDir });
  try {
    return buildGateReport(
      app.workspace.auditLedger.verifyIntegrity(),
      evaluateGate05PilotKpi({ dbPath, dataDir, ...(options.tenantId ? { tenantId: options.tenantId } : {}) }),
      options, app.workspace.auditLedger.getAllEvents()
    );
  } finally {
    app.sqliteClient.close();
  }
}

/**
 * `bun run pilot:verify-gates` is the documented way an operator checks readiness, and
 * until now it loaded the module and exited without printing anything — an unmet gate
 * looked identical to a met one. It now prints the full report and exits non-zero unless
 * every launch gate holds recorded operational evidence.
 *
 * stdout stays machine-readable JSON; the human summary goes to stderr so the two counts
 * (machine-checkable criteria vs launch gates cleared) are read separately, never as one
 * ambiguous "2/5".
 */
if (import.meta.main) {
  const report = verifySingleSiteLaunchGates(parsePilotCliDbOptions(process.argv.slice(2)));
  process.stderr.write(`${summarizeGateReport(report)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.goForLiveCustomerData ? 0 : 1);
}
