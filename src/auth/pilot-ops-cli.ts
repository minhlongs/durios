import { SqliteClient } from "../storage/sqlite-client.js";
import { SqliteAuthService } from "./sqlite-auth-service.js";
import type { ProductPersona, TenantType, UserRole } from "../domain/types.js";
import type { IssuedManagedPilotToken, PilotAccountRecord } from "./auth-types.js";
import {
  createSiteBackup, restoreSiteBackup, verifySiteBackup,
  type SiteBackupManifest, type SiteBackupVerificationResult,
} from "./site-backup-manager.js";

export type PilotOpsCommand =
  | {
      readonly action: "provision-account"; readonly id?: string | undefined;
      readonly username: string; readonly password: string; readonly phoneNumber?: string | undefined;
      readonly actorName: string; readonly tenantId: string; readonly tenantType: TenantType;
      readonly role: UserRole; readonly persona: ProductPersona;
    }
  | { readonly action: "issue-token"; readonly accountId: string; readonly deviceLabel: string; readonly expiresAt: string }
  | { readonly action: "revoke-token"; readonly tokenId: string; readonly reason?: string | undefined }
  | { readonly action: "revoke-session"; readonly sessionId: string; readonly reason?: string | undefined };

export function executePilotOpsCommand(
  authService: SqliteAuthService,
  cmd: PilotOpsCommand
): PilotAccountRecord | IssuedManagedPilotToken | { readonly revoked: true; readonly targetId: string } {
  switch (cmd.action) {
    case "provision-account":
      return authService.provisionPilotAccount({
        id: cmd.id, username: cmd.username, password: cmd.password, phoneNumber: cmd.phoneNumber,
        actorName: cmd.actorName, tenantId: cmd.tenantId, tenantType: cmd.tenantType, role: cmd.role, persona: cmd.persona,
      });
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

function getArg(args: readonly string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

export function runPilotOpsCliArgs(
  argv: readonly string[],
  authService: SqliteAuthService,
  env: Record<string, string | undefined> = process.env
):
  | PilotAccountRecord
  | IssuedManagedPilotToken
  | { readonly revoked: true; readonly targetId: string }
  | SiteBackupManifest
  | SiteBackupVerificationResult {
  if (argv.some((a) => a === "--password" || a.startsWith("--password="))) {
    throw new Error(
      "Security policy violation: passing password via command-line arguments (--password) is prohibited. Supply password via DURIOS_PILOT_PASSWORD environment variable."
    );
  }

  const action = argv[0];
  if (action === "provision-account") {
    const username = getArg(argv, "--username");
    const actorName = getArg(argv, "--name");
    const tenantId = getArg(argv, "--tenant");
    const tenantType = getArg(argv, "--tenant-type") as TenantType | undefined;
    const role = getArg(argv, "--role") as UserRole | undefined;
    const persona = getArg(argv, "--persona") as ProductPersona | undefined;
    const password = env.DURIOS_PILOT_PASSWORD;

    if (!username || !actorName || !tenantId || !tenantType || !role || !persona) {
      throw new Error(
        "Missing required flags for provision-account: --username, --name, --tenant, --tenant-type, --role, and --persona must all be explicitly provided (no implicit defaults)."
      );
    }
    if (!password) {
      throw new Error("Missing required environment variable: DURIOS_PILOT_PASSWORD.");
    }
    return executePilotOpsCommand(authService, {
      action: "provision-account", id: getArg(argv, "--id"), username, password,
      phoneNumber: getArg(argv, "--phone"), actorName, tenantId, tenantType, role, persona,
    });
  }

  if (action === "issue-token") {
    const accountId = getArg(argv, "--account-id");
    const deviceLabel = getArg(argv, "--device");
    const expiresAt = getArg(argv, "--expires-at");
    if (!accountId || !deviceLabel || !expiresAt) {
      throw new Error("Missing required flags for issue-token: --account-id, --device, --expires-at");
    }
    return executePilotOpsCommand(authService, { action: "issue-token", accountId, deviceLabel, expiresAt });
  }

  if (action === "revoke-token") {
    const tokenId = getArg(argv, "--token-id");
    if (!tokenId) throw new Error("Missing required flag for revoke-token: --token-id");
    return executePilotOpsCommand(authService, {
      action: "revoke-token",
      tokenId,
      reason: getArg(argv, "--reason") ?? "Operator CLI token revocation",
    });
  }

  if (action === "revoke-session") {
    const sessionId = getArg(argv, "--session-id");
    if (!sessionId) throw new Error("Missing required flag for revoke-session: --session-id");
    return executePilotOpsCommand(authService, {
      action: "revoke-session",
      sessionId,
      reason: getArg(argv, "--reason") ?? "Operator CLI session revocation",
    });
  }

  if (action === "backup-site") {
    const dbPath = getArg(argv, "--db") ?? env.DURIOS_DB_PATH;
    const dataDir = getArg(argv, "--data-dir") ?? env.DURIOS_DATA_DIR;
    const backupDir = getArg(argv, "--backup-dir");
    if (!dbPath || !dataDir || !backupDir) {
      throw new Error("Missing required flags for backup-site: --db, --data-dir, --backup-dir");
    }
    return createSiteBackup(dbPath, dataDir, backupDir);
  }

  if (action === "verify-backup") {
    const backupDir = getArg(argv, "--backup-dir");
    if (!backupDir) throw new Error("Missing required flag for verify-backup: --backup-dir");
    return verifySiteBackup(backupDir);
  }

  if (action === "restore-site") {
    const backupDir = getArg(argv, "--backup-dir");
    const targetDb = getArg(argv, "--target-db");
    const targetDataDir = getArg(argv, "--target-data-dir");
    if (!backupDir || !targetDb || !targetDataDir) {
      throw new Error("Missing required flags for restore-site: --backup-dir, --target-db, --target-data-dir");
    }
    return restoreSiteBackup(backupDir, targetDb, targetDataDir);
  }

  throw new Error(
    "Usage: bun run src/auth/pilot-ops-cli.ts <provision-account|issue-token|revoke-token|revoke-session|backup-site|verify-backup|restore-site> [flags]"
  );
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dbPath = getArg(argv, "--db") ?? process.env.DURIOS_DB_PATH ?? "./data/durios.db";
  const client = new SqliteClient({ dbPath });
  const authService = new SqliteAuthService(client);
  try {
    const result = runPilotOpsCliArgs(argv, authService, process.env);
    const out =
      "rawToken" in result
        ? { success: true, tokenId: result.tokenId, accountId: result.accountId, expiresAt: result.expiresAt }
        : { success: true, result };
    process.stdout.write(`${JSON.stringify(out)}\n`);
  } finally {
    client.close();
  }
}
