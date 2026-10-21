import type { SqliteAuthService } from "../../src/auth/sqlite-auth-service.js";
import { executePilotOpsCommand, type PilotOpsCommand } from "../../src/auth/pilot-ops-cli.js";
import type { ProductPersona, TenantType, UserRole } from "../../src/domain/types.js";
export interface ProvisionedTestActor {
  readonly accountId: string; readonly username: string; readonly password: string; readonly phoneNumber: string;
  readonly sessionToken: string; readonly sessionCookie: string; readonly sessionId: string;
  readonly managedToken: string; readonly managedTokenId: string;
}
export function extractSessionCookiePair(setCookieHeader: string | null): string {
  if (!setCookieHeader) throw new Error("Missing Set-Cookie header on session response");
  const match = setCookieHeader.match(/^(durios_session=[^;]+)/);
  if (!match?.[1]) throw new Error(`Invalid durios_session Set-Cookie header: ${setCookieHeader}`);
  return match[1];
}
function defaultPersonaForRole(role: UserRole): ProductPersona {
  switch (role) {
    case "MANAGER": case "ADMIN": return "PACKHOUSE_MANAGER";
    case "AUDITOR": return "SYSTEM_AUDITOR";
    case "VIEWER": return "BUYER_VIEWER";
    case "CLERK": default: return "PACKHOUSE_CLERK";
  }
}
export function seedTestPilotActor(authService: SqliteAuthService, options: { id?: string; username?: string; password?: string; phoneNumber?: string; actorName?: string; tenantId?: string; tenantType?: TenantType; role: UserRole; persona?: ProductPersona }): ProvisionedTestActor {
  const tenantId = options.tenantId ?? "TENANT-LOCAL-001";
  const role = options.role;
  const suffix = `${tenantId}-${role}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase();
  const username = options.username ?? `user_${suffix}`;
  const password = options.password ?? `Pass_${suffix}!99`;
  const phoneNumber = options.phoneNumber ?? `+8490${Math.floor(1000000 + Math.random() * 8999999)}`;
  const actorName = options.actorName ?? `${role} (${tenantId})`;
  const tenantType = options.tenantType ?? "PACKHOUSE_EXPORTER";
  const persona = options.persona ?? defaultPersonaForRole(role);
  const account = executePilotOpsCommand(authService, { action: "provision-account", id: options.id, username, password, phoneNumber, actorName, tenantId, tenantType, role, persona } as PilotOpsCommand);
  if (!("id" in account)) throw new Error("Unexpected response from provision-account");
  const session = authService.loginWithPassword(username, password);
  const managed = executePilotOpsCommand(authService, { action: "issue-token", accountId: account.id, deviceLabel: "test-suite-device", expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() });
  if (!("rawToken" in managed)) throw new Error("Unexpected response from issue-token");
  return { accountId: account.id, username, password, phoneNumber, sessionToken: session.sessionToken, sessionCookie: `durios_session=${encodeURIComponent(session.sessionToken)}`, sessionId: session.sessionId, managedToken: managed.rawToken, managedTokenId: managed.tokenId };
}
