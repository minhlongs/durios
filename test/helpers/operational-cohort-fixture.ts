import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { validateIso6346Container } from "../../src/domain/iso-6346.js";
import { SYNTHETIC_EXTRACTION_ENV_FLAG } from "../../src/extraction/synthetic-extraction-mode.js";
import { createSiteBackup } from "../../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import type { SqliteAuthService } from "../../src/auth/sqlite-auth-service.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../../src/domain/types.js";
import { seedTestPilotActor } from "./auth-test-helper.js";

/**
 * A GATE-05 cohort that is NOT synthetic: five containers, three untouched and two parked on a
 * document this build cannot read, so the machine check can pass on an OPERATIONAL cohort.
 *
 * Two properties matter and are deliberate:
 *  - the dossier codes avoid the rehearsal seeder's prefix, and
 *  - nothing is ingested while synthetic extraction is enabled, so the audit ledger records no
 *    `SYNTHETIC_DOCUMENT_INGESTED` event for these dossiers (that event is what a launch-gate run
 *    now trusts — see `src/auth/gate-cohort-provenance.ts`).
 *
 * It is still a test fixture: it exercises the code path "machine check passed AND a human
 * recorded evidence". It is never a launch decision and no data here came from a real packhouse.
 */
const COHORT: ReadonlyArray<{ code: string; prefix10: string; seal: string; unreadableDocument: boolean }> = [
  { code: "DOS-CAILAY-OP01", prefix10: "CSQU305438", seal: "VN-SEAL-OP-01", unreadableDocument: false },
  { code: "DOS-CAILAY-OP02", prefix10: "MSCU601234", seal: "VN-SEAL-OP-02", unreadableDocument: false },
  { code: "DOS-CAILAY-OP03", prefix10: "MAEU712345", seal: "VN-SEAL-OP-03", unreadableDocument: false },
  { code: "DOS-CAILAY-OP04", prefix10: "CMAU823456", seal: "VN-SEAL-OP-04", unreadableDocument: true },
  { code: "DOS-CAILAY-OP05", prefix10: "OOLU934567", seal: "VN-SEAL-OP-05", unreadableDocument: true },
];

function containerNumber(prefix10: string): string {
  const res = validateIso6346Container(`${prefix10}0`);
  return `${prefix10}${res.expectedCheckDigit ?? 0}`;
}

export interface OperationalCohort {
  readonly actor: AuthenticatedActor;
  readonly managedToken: string;
  readonly dossierCodes: readonly string[];
}

export function seedOperationalGate05Cohort(
  workspace: ContainerDossierWorkspace,
  authService: SqliteAuthService,
  tenantId = "TENANT-CAILAY-PILOT-01"
): OperationalCohort {
  const provisioned = seedTestPilotActor(authService, { role: "CLERK", tenantId, tenantType: "PACKHOUSE_EXPORTER" });
  const actor = authService.authenticateToken(provisioned.managedToken);
  const savedFlag = process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
  delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
  try {
    for (const spec of COHORT) {
      const dossier = workspace.createDossier({
        dossierCode: spec.code, containerNumber: containerNumber(spec.prefix10), sealNumber: spec.seal,
        targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14.0,
        declaredNetWeightKg: 18240, declaredBoxCount: 960,
      }, actor);
      if (!spec.unreadableDocument) continue;
      // A PDF stub this build cannot parse: zero extracted fields, so the container is parked
      // short of export. That is the blind fault the GATE-05 KPI has to catch.
      workspace.uploadDocument(dossier.id, new TextEncoder().encode(`%PDF-1.5\n% unreadable stub ${spec.code}\n%%EOF\n`),
        `PackingList-${spec.code}.pdf`, "PACKING_LIST", actor);
      workspace.runValidation(dossier.id, actor);
    }
  } finally {
    if (savedFlag === undefined) delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
    else process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = savedFlag;
  }
  return { actor, managedToken: provisioned.managedToken, dossierCodes: COHORT.map((s) => s.code) };
}

/**
 * Builds a whole gate-evaluation site in one call: an operational cohort, a verified backup
 * (GATE-04) and a signed-consent file (GATE-01). The consent "signature" is a line of text
 * written by this test, exactly like the artifact a real operator would have to record.
 */
export function seedOperationalGateSite(target: {
  dbPath: string; dataDir: string; backupDir: string; consentFilePath: string;
}): OperationalCohort {
  mkdirSync(dirname(target.dbPath), { recursive: true });
  const app = createWorkspaceApp({ dbPath: target.dbPath, dataDir: target.dataDir });
  let cohort: OperationalCohort;
  try {
    cohort = seedOperationalGate05Cohort(app.workspace, app.authService);
  } finally {
    app.sqliteClient.close();
  }
  createSiteBackup(target.dbPath, target.dataDir, target.backupDir);
  writeFileSync(target.consentFilePath, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)\n", "utf-8");
  return cohort;
}
