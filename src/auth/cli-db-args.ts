/**
 * Shared CLI flag parser for pilot and operational scripts so `--db`, `--db-path`,
 * `--data-dir`, and `--tenant-id` behave identically across every CLI entry point
 * without silently falling back to `./data/durios.db` when an explicit path was passed.
 */
export function getCliArgValue(argv: readonly string[], ...flags: readonly string[]): string | undefined {
  for (const flag of flags) {
    const eqPrefix = `${flag}=`;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]!;
      if (arg === flag && i + 1 < argv.length) return argv[i + 1];
      if (arg.startsWith(eqPrefix)) return arg.slice(eqPrefix.length);
    }
  }
  return undefined;
}

export interface ParsedPilotCliDbOptions {
  readonly dbPath?: string;
  readonly dataDir?: string;
  readonly tenantId?: string;
}

export function parsePilotCliDbOptions(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env
): ParsedPilotCliDbOptions {
  const dbPath = getCliArgValue(argv, "--db", "--db-path") ?? env.DURIOS_DB_PATH;
  const dataDir = getCliArgValue(argv, "--data-dir") ?? env.DURIOS_DATA_DIR;
  const tenantId = getCliArgValue(argv, "--tenant", "--tenant-id");
  return {
    ...(dbPath ? { dbPath } : {}),
    ...(dataDir ? { dataDir } : {}),
    ...(tenantId ? { tenantId } : {}),
  };
}
