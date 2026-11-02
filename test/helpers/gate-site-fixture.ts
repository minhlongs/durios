import { mkdtempSync, writeFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seedGate05PilotRehearsal } from "../../src/auth/pilot-rehearsal-seeder.js";
import { createSiteBackup } from "../../src/auth/site-backup-manager.js";
import { createOperatorEvidence, OTP_CONFIGURED_ENV } from "./gate-operator-evidence.js";
import { seedOperationalGateSite } from "./operational-cohort-fixture.js";
import type { GateEvidenceOverride } from "../../src/auth/pilot-gate-types.js";

/** A whole launch-gate evaluation site, ready for `verifySingleSiteLaunchGates`. */
export interface GateSite {
  readonly root: string;
  readonly dbPath: string;
  readonly dataDir: string;
  readonly options: {
    dbPath: string; dataDir: string; backupDir: string; consentSignedFilePath: string;
    gateEvidence: Readonly<Record<string, GateEvidenceOverride>>; env: Record<string, string>;
  };
}

/**
 * Both halves of the gate contract, as two disposable sites:
 *  - `rehearsal`: seeded by the rehearsal seeder (synthetic documents, `DOS-CAILAY-R*` codes), and
 *  - `operational`: a non-synthetic GATE-05 cohort.
 *
 * Each one gets all five machine checks green plus five evidence files that *this test run* wrote
 * and attributed to a fixture operator. That combination is deliberate: it is exactly what an
 * attacker would assemble to try to force a launch decision, so the tests can prove it does not.
 */
export function buildGateSite(kind: "rehearsal" | "operational"): GateSite {
  const root = mkdtempSync(join(tmpdir(), `durios-gate-site-${kind}-`));
  const dbPath = join(root, "durios.db");
  const dataDir = join(root, "uploads");
  const backupDir = join(root, "backup");
  const consentFilePath = join(root, "consent-signed-by-the-test.md");
  if (kind === "rehearsal") {
    seedGate05PilotRehearsal({ dbPath, dataDir });
    writeFileSync(consentFilePath, "Consent artifact written by this test run, not by a packhouse\n", "utf-8");
    createSiteBackup(dbPath, dataDir, backupDir);
  } else {
    seedOperationalGateSite({ dbPath, dataDir, backupDir, consentFilePath });
  }
  return {
    root, dbPath, dataDir,
    options: {
      dbPath, dataDir, backupDir, consentSignedFilePath: consentFilePath,
      gateEvidence: createOperatorEvidence(join(root, "evidence-artifacts")),
      env: { ...OTP_CONFIGURED_ENV, DURIOS_GATE01_CONSENT_FILE: consentFilePath },
    },
  };
}

/**
 * Runs raw SQL against a site database, bypassing every application rule. Adversarial tests use
 * it to attack provenance the way a person with shell access would: rename rows, delete audit
 * events. The gates must survive that, because the ledger is hash-chained and the provenance
 * signals are written where the data is born.
 */
export function runRawSql(dbPath: string, sql: string): void {
  const db = new Database(dbPath);
  try {
    db.run(sql);
  } finally {
    db.close();
  }
}
