import { expect } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FakeOtpProvider } from "../../src/auth/otp-provider.js";
import { createWorkspaceApp } from "../../src/server/server.js";

export { runHttpGatewayOtpProviderScenario } from "./server-auth-5a1-gateway-scenario.js";
export { runOtpVerifyRateLimitPersistenceScenario } from "./server-auth-5a1-otp-verify-scenario.js";

interface OtpChallengeResponse {
  data: { challengeId: string };
}

export async function runLegacyV2ToV3UpgradeScenario(): Promise<void> {
  const tempDir = mkdtempSync(join(tmpdir(), "durios-v2-upgrade-"));
  const legacyDbPath = join(tempDir, "legacy-v2.db");
  const legacyUploadsDir = join(tempDir, "uploads");
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  try {
    const rawDb = new Database(legacyDbPath, { create: true });
    rawDb.run("PRAGMA foreign_keys = ON;");
    rawDb.run(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations (version, applied_at) VALUES (1, '2026-10-14T00:00:00.000Z'), (2, '2026-10-14T00:00:01.000Z');
      CREATE TABLE pilot_accounts (
        id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, phone_number TEXT UNIQUE,
        password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, actor_name TEXT NOT NULL,
        tenant_id TEXT NOT NULL, tenant_type TEXT NOT NULL, role TEXT NOT NULL, persona TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE auth_sessions (
        id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        auth_method TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
        revocation_reason TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE otp_challenges (
        id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        phone_number TEXT NOT NULL, channel TEXT NOT NULL, code_hash TEXT NOT NULL, code_salt TEXT NOT NULL,
        expires_at TEXT NOT NULL, consumed_at TEXT, attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5, created_at TEXT NOT NULL
      );
      CREATE TABLE managed_pilot_tokens (
        id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        device_label TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
        revocation_reason TEXT, created_at TEXT NOT NULL
      );
    `);

    const nowIso = new Date().toISOString();
    const futureIso = new Date(Date.now() + 600_000).toISOString();
    rawDb.run(
      `INSERT INTO pilot_accounts VALUES ('ACT-LEG-01', 'legacy.user', '+84912345678', 'aa', 'bb', 'Legacy User', 'TENANT-LEG', 'PACKHOUSE_EXPORTER', 'CLERK', 'PACKHOUSE_CLERK', 1, ?, ?)`,
      [nowIso, nowIso]
    );
    rawDb.run(
      `INSERT INTO otp_challenges VALUES ('OTP-LEG-01', 'ACT-LEG-01', '+84912345678', 'ZALO', 'cc', 'dd', ?, NULL, 1, 5, ?)`,
      [futureIso, nowIso]
    );
    rawDb.close();

    const fakeOtp = new FakeOtpProvider();
    app = createWorkspaceApp({ dbPath: legacyDbPath, dataDir: legacyUploadsDir, otpProvider: fakeOtp });

    expect(
      app.sqliteClient.db.query<{ version: number }, []>("SELECT version FROM schema_migrations WHERE version = 3").get()?.version
    ).toBe(3);
    expect(
      app.sqliteClient.db.query<{ v: number }, []>("SELECT MAX(version) as v FROM schema_migrations").get()?.v
    ).toBeGreaterThanOrEqual(3);

    const preservedChallenge = app.sqliteClient.db
      .query<{ id: string; account_id: string; phone_number: string; attempts: number }, [string]>(
        "SELECT id, account_id, phone_number, attempts FROM otp_challenges WHERE id = ?"
      )
      .get("OTP-LEG-01");
    expect(preservedChallenge).toEqual({
      id: "OTP-LEG-01", account_id: "ACT-LEG-01", phone_number: "+84912345678", attempts: 1,
    });

    const postOtpReq = () =>
      app!.handler(new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+84999999999", channel: "ZALO" }),
      }));

    const decoyRes = await postOtpReq();
    expect(decoyRes.status).toBe(201);
    const decoyChallengeId = ((await decoyRes.json()) as OtpChallengeResponse).data.challengeId;

    expect(
      app.sqliteClient.db.query<{ account_id: string | null }, [string]>("SELECT account_id FROM otp_challenges WHERE id = ?").get(decoyChallengeId)?.account_id
    ).toBeNull();

    for (let i = 0; i < 2; i++) {
      expect((await postOtpReq()).status).toBe(201);
    }

    app.sqliteClient.close();
    app = createWorkspaceApp({ dbPath: legacyDbPath, dataDir: legacyUploadsDir, otpProvider: fakeOtp });

    expect((await postOtpReq()).status).toBe(429);

    app.sqliteClient.db.run("DELETE FROM pilot_accounts WHERE id = 'ACT-LEG-01'");
    expect(
      app.sqliteClient.db.query<{ id: string }, [string]>("SELECT id FROM otp_challenges WHERE id = ?").get("OTP-LEG-01")
    ).toBeNull();
  } finally {
    app?.sqliteClient.close();
    app = null;
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  }
}
