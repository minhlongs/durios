/**
 * Builds an OPERATIONAL (non rehearsal-seeded) gate-evaluation site for the CLI matrix in
 * gate-cli-matrix.sh: five fixture containers, a verified site backup, and placeholder files
 * standing in for the artifacts a human operator has to record.
 *
 * Everything written here is a test fixture. The "consent" and "evidence" files are text
 * created by this script; they carry no signature and no field verification. The matrix uses
 * them only to show which combination of machine checks and recorded evidence the launch-gate
 * verifier accepts, never to claim a site is ready.
 *
 * usage: bun gate-cohort-site.ts <rootDir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorkspaceApp } from "../../../../src/server/server.js";
import { createSiteBackup } from "../../../../src/auth/site-backup-manager.js";
import { seedOperationalGate05Cohort } from "../../../../test/helpers/operational-cohort-fixture.js";

const root = process.argv[2];
if (!root) {
  process.stderr.write("usage: bun gate-cohort-site.ts <rootDir>\n");
  process.exit(2);
}
const dbPath = join(root, "durios.db");
const dataDir = join(root, "uploads");
mkdirSync(root, { recursive: true });
const app = createWorkspaceApp({ dbPath, dataDir });
try {
  const cohort = seedOperationalGate05Cohort(app.workspace, app.authService);
  process.stdout.write(`${JSON.stringify({ root, dbPath, dataDir, dossierCodes: cohort.dossierCodes })}\n`);
} finally {
  app.sqliteClient.close();
}
createSiteBackup(dbPath, dataDir, join(root, "backup"));
writeFileSync(join(root, "consent.pdf"), "%PDF-1.5 FIXTURE consent artifact — unsigned, created by gate-cohort-site.ts\n", "utf-8");
mkdirSync(join(root, "evidence"), { recursive: true });
for (const gate of ["01", "02", "03", "04", "05"]) {
  writeFileSync(join(root, "evidence", `gate-${gate}.pdf`), `%PDF-1.5 FIXTURE GATE-${gate} evidence stub — unsigned\n`, "utf-8");
}
process.stdout.write(`site ready at ${root} (backup=${join(root, "backup")})\n`);
