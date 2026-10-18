import type { SqliteClient } from "../storage/sqlite-client.js";
import type { AuthenticatedActor, ProductPersona, TenantType, UserRole } from "../domain/types.js";
import { generateOpaqueToken, generateSaltHex, hashOpaqueToken, hashSecretWithSalt, verifySecretWithSalt } from "./crypto-helpers.js";
import { type OtpChannel, type OtpProviderAdapter, UnconfiguredOtpProvider } from "./otp-provider.js";
import { AuthenticationError, type IssuedAuthSession, type IssuedManagedPilotToken, type IssuedOtpChallenge, type PilotAccountRecord, type ProvisionPilotAccountInput } from "./auth-types.js";
import { consumeVerifiedOtpChallenge, createOtpChallengeRecord } from "./otp-challenge-store.js";
import { assertValidIdentityTuple } from "./rbac-policy.js";
import { assertRateLimitAllowed, clearRateLimitBucket, PASSWORD_LOGIN_LIMIT_POLICY, recordRateLimitAttempt } from "./rate-limit-store.js";

interface AccountRow {
  id: string; username: string; phone_number: string | null; password_hash: string; password_salt: string;
  actor_name: string; tenant_id: string; tenant_type: TenantType; role: UserRole; persona: ProductPersona; is_active: number; created_at: string;
}

const rowToActor = (r: AccountRow): AuthenticatedActor => {
  assertValidIdentityTuple(r.persona, r.tenant_type, r.role);
  return { id: r.id, name: r.actor_name, tenantId: r.tenant_id, tenantType: r.tenant_type, role: r.role, persona: r.persona };
};

export class SqliteAuthService {
  private otpProvider: OtpProviderAdapter;
  constructor(private readonly client: SqliteClient, otpProvider?: OtpProviderAdapter) {
    this.otpProvider = otpProvider ?? new UnconfiguredOtpProvider();
  }
  public setOtpProvider(provider: OtpProviderAdapter): void { this.otpProvider = provider; }
  public getOtpProvider(): OtpProviderAdapter { return this.otpProvider; }

  public provisionPilotAccount(input: ProvisionPilotAccountInput): PilotAccountRecord {
    const [username, tenantId, actorName] = [input.username?.trim(), input.tenantId?.trim(), input.actorName?.trim()];
    if (!username || !input.password || !tenantId || !actorName) {
      throw new Error("username, password, actorName, and tenantId are required.");
    }
    assertValidIdentityTuple(input.persona, input.tenantType, input.role);
    const id = input.id?.trim() || `ACT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const [now, salt, phone] = [new Date().toISOString(), generateSaltHex(), input.phoneNumber?.trim() || null];
    this.client.db.run(
      `INSERT INTO pilot_accounts (id, username, phone_number, password_hash, password_salt, actor_name, tenant_id, tenant_type, role, persona, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, username, phone, hashSecretWithSalt(input.password, salt), salt, actorName, tenantId, input.tenantType, input.role, input.persona, now, now]
    );
    return { id, username, phoneNumber: phone ?? undefined, actorName, tenantId, tenantType: input.tenantType, role: input.role, persona: input.persona, isActive: true, createdAt: now };
  }

  public loginWithPassword(username: string, password: string, ttlMs = 12 * 3600 * 1000): IssuedAuthSession {
    const normalizedUser = username.trim();
    const bucketKey = `pw_login:${normalizedUser.toLowerCase()}`;
    const lockMsg = "Too many failed password login attempts. Account login is temporarily locked.";
    assertRateLimitAllowed(this.client, bucketKey, lockMsg);
    const row = this.client.db.query<AccountRow, [string]>("SELECT * FROM pilot_accounts WHERE username = ?").get(normalizedUser);
    if (!row || !verifySecretWithSalt(password, row.password_salt, row.password_hash)) {
      recordRateLimitAttempt(this.client, bucketKey, PASSWORD_LOGIN_LIMIT_POLICY, lockMsg);
      throw new AuthenticationError("Invalid username or password.", "INVALID_CREDENTIALS");
    }
    if (!row.is_active) throw new AuthenticationError("Pilot account is disabled.", "ACCOUNT_DISABLED");
    clearRateLimitBucket(this.client, bucketKey);
    return this.createSession(row, "PASSWORD_SESSION", ttlMs);
  }

  public async requestOtpChallenge(phoneNumber: string, channel: OtpChannel = "ZALO", ttlMs = 5 * 60 * 1000): Promise<IssuedOtpChallenge> {
    if (!this.otpProvider.isConfigured) {
      this.otpProvider.sendOtp({ challengeId: "UNCONFIGURED", phoneNumber, otpCode: "000000", channel, expiresAt: new Date().toISOString() });
    }
    const phone = phoneNumber.trim();
    const row = this.client.db.query<AccountRow, [string]>("SELECT * FROM pilot_accounts WHERE phone_number = ?").get(phone);
    return createOtpChallengeRecord(this.client, this.otpProvider, row && row.is_active ? row.id : null, phone, channel, ttlMs);
  }

  public verifyOtpChallenge(challengeId: string, otpCode: string, sessionTtlMs = 12 * 3600 * 1000): IssuedAuthSession {
    const accountId = consumeVerifiedOtpChallenge(this.client, challengeId, otpCode);
    const account = this.client.db.query<AccountRow, [string]>("SELECT * FROM pilot_accounts WHERE id = ?").get(accountId);
    if (!account || !account.is_active) throw new AuthenticationError("Pilot account is disabled or not found.", "ACCOUNT_DISABLED");
    return this.createSession(account, "OTP_SESSION", sessionTtlMs);
  }

  public issueManagedPilotToken(accountId: string, deviceLabel: string, expiresAtIso: string): IssuedManagedPilotToken {
    const account = this.client.db.query<AccountRow, [string]>("SELECT * FROM pilot_accounts WHERE id = ?").get(accountId.trim());
    if (!account || !account.is_active) throw new Error(`Active pilot account '${accountId}' not found.`);
    const [actor, expDate] = [rowToActor(account), new Date(expiresAtIso)];
    if (isNaN(expDate.getTime()) || expDate.getTime() <= Date.now()) {
      throw new Error("Managed pilot token expiration must be a valid future ISO timestamp.");
    }
    const [tokenId, rawToken] = [`MPT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, generateOpaqueToken("dpt")];
    this.client.db.run(
      `INSERT INTO managed_pilot_tokens (id, token_hash, account_id, device_label, expires_at, revoked_at, revocation_reason, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      [tokenId, hashOpaqueToken(rawToken), account.id, deviceLabel.trim(), expDate.toISOString(), new Date().toISOString()]
    );
    return { tokenId, rawToken, accountId: account.id, deviceLabel: deviceLabel.trim(), expiresAt: expDate.toISOString(), actor };
  }

  public revokeManagedPilotToken(tokenId: string, reason = "Revoked by operator"): void {
    const res = this.client.db.run("UPDATE managed_pilot_tokens SET revoked_at = ?, revocation_reason = ? WHERE id = ?", [new Date().toISOString(), reason.trim(), tokenId.trim()]);
    if (res.changes === 0) throw new Error(`Managed pilot token '${tokenId}' not found.`);
  }
  public revokeSession(sessionId: string, reason = "Logged out"): void {
    const res = this.client.db.run("UPDATE auth_sessions SET revoked_at = ?, revocation_reason = ? WHERE id = ?", [new Date().toISOString(), reason.trim(), sessionId.trim()]);
    if (res.changes === 0) throw new Error(`Session '${sessionId}' not found.`);
  }

  public authenticateToken(rawToken: string): AuthenticatedActor {
    const cleaned = rawToken.trim();
    if (!cleaned) throw new AuthenticationError("Missing authentication token.", "MISSING_CREDENTIALS");
    const isMpt = cleaned.startsWith("dpt_");
    const row = this.client.db
      .query<{ account_id: string; expires_at: string; revoked_at: string | null }, [string]>(`SELECT account_id, expires_at, revoked_at FROM ${isMpt ? "managed_pilot_tokens" : "auth_sessions"} WHERE token_hash = ?`)
      .get(hashOpaqueToken(cleaned));
    if (!row) throw new AuthenticationError("Unrecognized authentication token.", "INVALID_CREDENTIALS");
    if (row.revoked_at) throw new AuthenticationError("Authentication token has been revoked.", isMpt ? "TOKEN_REVOKED" : "SESSION_REVOKED");
    if (new Date(row.expires_at).getTime() <= Date.now()) throw new AuthenticationError("Authentication token has expired.", isMpt ? "TOKEN_EXPIRED" : "SESSION_EXPIRED");
    const account = this.client.db.query<AccountRow, [string]>("SELECT * FROM pilot_accounts WHERE id = ?").get(row.account_id);
    if (!account || !account.is_active) throw new AuthenticationError("Pilot account is disabled or not found.", "ACCOUNT_DISABLED");
    return rowToActor(account);
  }

  private createSession(account: AccountRow, authMethod: "PASSWORD_SESSION" | "OTP_SESSION", ttlMs: number): IssuedAuthSession {
    const actor = rowToActor(account);
    const [sessionId, sessionToken] = [`SES-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, generateOpaqueToken("dss")];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    this.client.db.run(
      `INSERT INTO auth_sessions (id, token_hash, account_id, auth_method, expires_at, revoked_at, revocation_reason, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      [sessionId, hashOpaqueToken(sessionToken), account.id, authMethod, expiresAt, now.toISOString()]
    );
    return { sessionId, sessionToken, authMethod, expiresAt, actor };
  }
}
