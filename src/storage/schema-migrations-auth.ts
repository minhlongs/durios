import type { Database } from "bun:sqlite";

export function applyMigrationV2(db: Database): void {
  db.transaction(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS pilot_accounts (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        phone_number TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        tenant_type TEXT NOT NULL,
        role TEXT NOT NULL,
        persona TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pilot_accounts_tenant ON pilot_accounts(tenant_id);

      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        auth_method TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        revocation_reason TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_account ON auth_sessions(account_id);

      CREATE TABLE IF NOT EXISTS otp_challenges (
        id TEXT PRIMARY KEY,
        account_id TEXT REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        phone_number TEXT NOT NULL,
        channel TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        code_salt TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_otp_challenges_account ON otp_challenges(account_id);
      CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone ON otp_challenges(phone_number);

      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        bucket_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TEXT NOT NULL,
        blocked_until TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS managed_pilot_tokens (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        device_label TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        revocation_reason TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_managed_tokens_hash ON managed_pilot_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_managed_tokens_account ON managed_pilot_tokens(account_id);

      INSERT INTO schema_migrations (version, applied_at) VALUES (2, datetime('now'));
    `);
  })();
}

export function applyMigrationV3(db: Database): void {
  db.transaction(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        bucket_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TEXT NOT NULL,
        blocked_until TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    const cols = db.query<{ name: string; notnull: number }, []>("PRAGMA table_info(otp_challenges)").all();
    const accountIdCol = cols.find((c) => c.name === "account_id");

    if (accountIdCol && accountIdCol.notnull === 1) {
      db.run(`
        CREATE TABLE otp_challenges_v3_new (
          id TEXT PRIMARY KEY,
          account_id TEXT REFERENCES pilot_accounts(id) ON DELETE CASCADE,
          phone_number TEXT NOT NULL,
          channel TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          code_salt TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          consumed_at TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 5,
          created_at TEXT NOT NULL
        );
        INSERT INTO otp_challenges_v3_new (
          id, account_id, phone_number, channel, code_hash, code_salt,
          expires_at, consumed_at, attempts, max_attempts, created_at
        )
        SELECT
          id, account_id, phone_number, channel, code_hash, code_salt,
          expires_at, consumed_at, attempts, max_attempts, created_at
        FROM otp_challenges;
        DROP TABLE otp_challenges;
        ALTER TABLE otp_challenges_v3_new RENAME TO otp_challenges;
      `);
    }

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_otp_challenges_account ON otp_challenges(account_id);
      CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone ON otp_challenges(phone_number);
      INSERT INTO schema_migrations (version, applied_at) VALUES (3, datetime('now'));
    `);
  })();
}
