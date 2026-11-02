import { SqliteClient } from "../storage/sqlite-client.js";
import { SqliteAuthService } from "./sqlite-auth-service.js";
import type { ProductPersona, TenantType, UserRole } from "../domain/types.js";
import type { IssuedManagedPilotToken, PilotAccountRecord } from "./auth-types.js";
import { createSiteBackup, restoreSiteBackup, verifySiteBackup, type SiteBackupManifest, type SiteBackupVerificationResult } from "./site-backup-manager.js";
import { getCliArgValue } from "./cli-db-args.js";

export type PilotOpsCommand =
  | { action: "provision-account"; id?: string; username: string; password: string; phoneNumber?: string; actorName: string; tenantId: string; tenantType: TenantType; role: UserRole; persona: ProductPersona; }
  | { action: "issue-token"; accountId: string; deviceLabel: string; expiresAt: string }
  | { action: "revoke-token"; tokenId: string; reason?: string }
  | { action: "revoke-session"; sessionId: string; reason?: string };

type RevokedResult = { readonly revoked: true; readonly targetId: string };
export function executePilotOpsCommand(
  authService: SqliteAuthService, cmd: PilotOpsCommand
): PilotAccountRecord | IssuedManagedPilotToken | RevokedResult {
  switch (cmd.action) {
    case "provision-account":
      return authService.provisionPilotAccount({ id: cmd.id, username: cmd.username, password: cmd.password, phoneNumber: cmd.phoneNumber, actorName: cmd.actorName, tenantId: cmd.tenantId, tenantType: cmd.tenantType, role: cmd.role, persona: cmd.persona });
    case "issue-token":
      return authService.issueManagedPilotToken(cmd.accountId, cmd.deviceLabel, cmd.expiresAt);
    case "revoke-token":
      authService.revokeManagedPilotToken(cmd.tokenId, cmd.reason ?? "Operator CLI revocation");
      return { revoked: true, targetId: cmd.tokenId };
    case "revoke-session":
      authService.revokeSession(cmd.sessionId, cmd.reason ?? "Operator CLI revocation");
      return { revoked: true, targetId: cmd.sessionId };
  }
}

export function runPilotOpsCliArgs(argv: readonly string[], authService: SqliteAuthService | undefined, env: Record<string, string | undefined> = process.env): PilotAccountRecord | IssuedManagedPilotToken | RevokedResult | SiteBackupManifest | SiteBackupVerificationResult {
  if (argv.some((a) => a === "--password" || a.startsWith("--password="))) throw new Error("Security policy violation: passing password via command-line arguments (--password) is prohibited. Supply password via DURIOS_PILOT_PASSWORD environment variable.");
  const action = argv[0];
  if (action === "backup-site") {
    const [dbPath, dataDir, backupDir] = [getCliArgValue(argv, "--db", "--db-path") ?? env.DURIOS_DB_PATH, getCliArgValue(argv, "--data-dir") ?? env.DURIOS_DATA_DIR, getCliArgValue(argv, "--backup-dir")];
    if (!dbPath || !dataDir || !backupDir) throw new Error("Missing required flags for backup-site: --db, --data-dir, --backup-dir");
    return createSiteBackup(dbPath, dataDir, backupDir);
  }
  if (action === "verify-backup") { const backupDir = getCliArgValue(argv, "--backup-dir"); if (!backupDir) throw new Error("Missing required flag for verify-backup: --backup-dir"); return verifySiteBackup(backupDir); }
  if (action === "restore-site") {
    const [backupDir, targetDb, targetDataDir] = [getCliArgValue(argv, "--backup-dir"), getCliArgValue(argv, "--target-db"), getCliArgValue(argv, "--target-data-dir")];
    if (!backupDir || !targetDb || !targetDataDir) throw new Error("Missing required flags for restore-site: --backup-dir, --target-db, --target-data-dir");
    return restoreSiteBackup(backupDir, targetDb, targetDataDir);
  }
  if (!authService) throw new Error("Auth service is required for account/token/session operations.");
  if (action === "provision-account") {
    const [username, actorName, tenantId] = [getCliArgValue(argv, "--username"), getCliArgValue(argv, "--name"), getCliArgValue(argv, "--tenant", "--tenant-id")];
    const [tenantType, role, persona] = [getCliArgValue(argv, "--tenant-type") as TenantType | undefined, getCliArgValue(argv, "--role") as UserRole | undefined, getCliArgValue(argv, "--persona") as ProductPersona | undefined];
    const password = env.DURIOS_PILOT_PASSWORD;
    if (!username || !actorName || !tenantId || !tenantType || !role || !persona) {
      throw new Error("Missing required flags for provision-account: --username, --name, --tenant, --tenant-type, --role, and --persona must all be explicitly provided (no implicit defaults).");
    }
    if (!password) throw new Error("Missing required environment variable: DURIOS_PILOT_PASSWORD.");
    const phone = getCliArgValue(argv, "--phone");
    return executePilotOpsCommand(authService, { action: "provision-account", id: getCliArgValue(argv, "--id"), username, password, phoneNumber: phone, actorName, tenantId, tenantType, role, persona } as PilotOpsCommand);
  }
  if (action === "issue-token") {
    const [accountId, deviceLabel, expiresAt] = [getCliArgValue(argv, "--account-id"), getCliArgValue(argv, "--device"), getCliArgValue(argv, "--expires-at")];
    if (!accountId || !deviceLabel || !expiresAt) throw new Error("Missing required flags for issue-token: --account-id, --device, --expires-at");
    return executePilotOpsCommand(authService, { action: "issue-token", accountId, deviceLabel, expiresAt });
  }
  if (action === "revoke-token") {
    const tokenId = getCliArgValue(argv, "--token-id");
    if (!tokenId) throw new Error("Missing required flag for revoke-token: --token-id");
    return executePilotOpsCommand(authService, { action: "revoke-token", tokenId, reason: getCliArgValue(argv, "--reason") ?? "Operator CLI token revocation" });
  }
  if (action === "revoke-session") {
    const sessionId = getCliArgValue(argv, "--session-id");
    if (!sessionId) throw new Error("Missing required flag for revoke-session: --session-id");
    return executePilotOpsCommand(authService, { action: "revoke-session", sessionId, reason: getCliArgValue(argv, "--reason") ?? "Operator CLI session revocation" });
  }
  throw new Error("Usage: bun run src/auth/pilot-ops-cli.ts <provision-account|issue-token|revoke-token|revoke-session|backup-site|verify-backup|restore-site> [flags]");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const action = argv[0];
  const needsDb = action === "provision-account" || action === "issue-token" || action === "revoke-token" || action === "revoke-session";
  const dbPath = getCliArgValue(argv, "--db", "--db-path") ?? process.env.DURIOS_DB_PATH;
  if (needsDb && !dbPath) {
    throw new Error("Missing required database path for account/token CLI operation: supply --db <path> (or --db-path <path>) or set DURIOS_DB_PATH.");
  }
  const client = needsDb && dbPath ? new SqliteClient({ dbPath }) : undefined;
  try {
    const result = runPilotOpsCliArgs(argv, client ? new SqliteAuthService(client) : undefined, process.env);
    const out = "rawToken" in result ? { success: true, tokenId: result.tokenId, accountId: result.accountId, expiresAt: result.expiresAt } : { success: true, result };
    process.stdout.write(`${JSON.stringify(out)}\n`);
  } finally {
    client?.close();
  }
}
