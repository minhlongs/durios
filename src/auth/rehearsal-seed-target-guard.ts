import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { Database } from "bun:sqlite";

/**
 * The rehearsal seeder creates pilot accounts whose usernames and passwords are published in
 * this repository, plus five synthetic dossiers. Pointed at an operational database it would
 * quietly add a way in with public credentials, so it now needs an explicit destination and
 * refuses any target that already holds data which is not rehearsal data.
 */
export const REHEARSAL_DOSSIER_CODE_PREFIX = "DOS-CAILAY-R";
export const REHEARSAL_USERNAMES: readonly string[] = ["clerk.cailay", "manager.cailay"];

export interface RehearsalSeedTarget {
  readonly dbPath: string;
  readonly dataDir: string;
}

export class RehearsalSeedTargetError extends Error {
  public readonly status = 400;
  public readonly code = "REHEARSAL_SEED_TARGET_REFUSED";

  constructor(message: string) {
    super(message);
    this.name = "RehearsalSeedTargetError";
  }
}

export function resolveRehearsalSeedTarget(
  options: { dbPath?: string; dataDir?: string } = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): RehearsalSeedTarget {
  const dbPath = options.dbPath ?? env.DURIOS_DB_PATH;
  if (!dbPath || dbPath.trim() === "") {
    throw new RehearsalSeedTargetError(
      "pilot:seed-rehearsal refuses to pick a database for you. It provisions accounts with published " +
        "passwords (clerk.cailay, manager.cailay) and writes five synthetic dossiers, so the destination " +
        "must be declared: pass { dbPath, dataDir } or start with DURIOS_DB_PATH=/path/to/rehearsal.db " +
        "(and DURIOS_DATA_DIR for the blob directory). The former default ./data/durios.db is the " +
        "operational database and is no longer written to silently."
    );
  }
  return { dbPath, dataDir: options.dataDir ?? env.DURIOS_DATA_DIR ?? join(dirname(dbPath), "uploads") };
}

/** Refuses to seed into anything that is not an empty database or an existing rehearsal database. */
export function assertTargetIsRehearsalData(dbPath: string): void {
  if (!existsSync(dbPath)) return;
  const db = new Database(dbPath, { readonly: true });
  try {
    const hasDossiers = db
      .query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'container_dossiers'")
      .get() as { n: number };
    if (hasDossiers.n === 0) {
      throw new RehearsalSeedTargetError(
        `'${dbPath}' is an existing SQLite database without the DuriOS schema, so it is not a rehearsal target. ` +
          "Point DURIOS_DB_PATH at an empty path or at a database this seeder created."
      );
    }
    const foreign = db
      .query("SELECT COUNT(*) AS n FROM container_dossiers WHERE dossier_code NOT LIKE ?")
      .get(`${REHEARSAL_DOSSIER_CODE_PREFIX}%`) as { n: number };
    const hasAccounts = db
      .query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'pilot_accounts'")
      .get() as { n: number };
    const foreignAccounts = hasAccounts.n === 0
      ? { n: 0 }
      : (db.query("SELECT COUNT(*) AS n FROM pilot_accounts WHERE username NOT IN (?, ?)")
          .get(REHEARSAL_USERNAMES[0], REHEARSAL_USERNAMES[1]) as { n: number });
    if (foreign.n > 0 || foreignAccounts.n > 0) {
      throw new RehearsalSeedTargetError(
        `'${dbPath}' already holds data this seeder did not create (${foreign.n} non-rehearsal dossier(s), ` +
          `${foreignAccounts.n} non-rehearsal account(s)). Refusing to add rehearsal accounts with published ` +
          "passwords to a database that may hold operational or customer data. Copy it aside and seed a fresh " +
          "rehearsal database instead."
      );
    }
  } finally {
    db.close();
  }
}
