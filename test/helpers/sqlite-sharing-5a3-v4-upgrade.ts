import { expect } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../../src/server/server.js";

export type WorkspaceAppInstance = ReturnType<typeof createWorkspaceApp>;

export function runV3ToV4SchemaUpgradeScenario(): void {
  const tempDir = mkdtempSync(join(tmpdir(), "durios-v3-to-v4-"));
  const v3DbPath = join(tempDir, "legacy-v3.db");
  const v3Uploads = join(tempDir, "uploads");
  let app: WorkspaceAppInstance | null = null;

  try {
    const rawDb = new Database(v3DbPath, { create: true });
    rawDb.run("PRAGMA foreign_keys = ON;");
    rawDb.run(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations (version, applied_at) VALUES
        (1, '2026-10-14T00:00:00.000Z'),
        (2, '2026-10-14T00:00:01.000Z'),
        (3, '2026-10-14T00:00:02.000Z');

      CREATE TABLE container_dossiers (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, dossier_code TEXT NOT NULL UNIQUE,
        container_number TEXT NOT NULL, seal_number TEXT NOT NULL, target_market TEXT NOT NULL,
        border_gate TEXT NOT NULL, target_temperature_c REAL NOT NULL, declared_net_weight_kg REAL,
        declared_box_count INTEGER, lifecycle_state TEXT NOT NULL, is_immutable INTEGER NOT NULL DEFAULT 0,
        export_sealed_at TEXT, latest_validation_result TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE documents (
        id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL, document_type TEXT NOT NULL, file_name TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL, mime_type TEXT NOT NULL, sha256_hash TEXT NOT NULL,
        storage_path TEXT NOT NULL, uploaded_at TEXT NOT NULL, is_superseded INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE extracted_fields (
        id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL,
        field_key TEXT NOT NULL, raw_value TEXT NOT NULL, confirmed_value TEXT, confidence REAL NOT NULL,
        bounding_box TEXT, verification_status TEXT NOT NULL, verified_by_actor_id TEXT, verified_at TEXT
      );
      CREATE TABLE audit_events (
        sequence_id INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, tenant_id TEXT NOT NULL,
        dossier_id TEXT, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, actor_role TEXT NOT NULL,
        event_type TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
        payload_before TEXT, payload_after TEXT, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE export_manifests (
        id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL UNIQUE REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL, composite_hash TEXT NOT NULL, manifest_json TEXT NOT NULL, created_at TEXT NOT NULL
      );
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
        id TEXT PRIMARY KEY, account_id TEXT REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        phone_number TEXT NOT NULL, channel TEXT NOT NULL, code_hash TEXT NOT NULL, code_salt TEXT NOT NULL,
        expires_at TEXT NOT NULL, consumed_at TEXT, attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5, created_at TEXT NOT NULL
      );
      CREATE TABLE auth_rate_limits (
        bucket_key TEXT PRIMARY KEY, attempt_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TEXT NOT NULL, blocked_until TEXT, updated_at TEXT NOT NULL
      );
      CREATE TABLE managed_pilot_tokens (
        id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
        device_label TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
        revocation_reason TEXT, created_at TEXT NOT NULL
      );
    `);
    const now = new Date().toISOString();
    rawDb.run(
      `INSERT INTO container_dossiers VALUES ('DOS-V3-01', 'TEN-A', 'CODE-V3-01', 'MSKU1234565', 'SEAL-V3', 'CN', 'Huu Nghi', 14.0, 18000, 900, 'DRAFT', 0, NULL, NULL, ?, ?)`,
      [now, now]
    );
    rawDb.close();

    app = createWorkspaceApp({ dbPath: v3DbPath, dataDir: v3Uploads });
    const ver4 = app.sqliteClient.db.query<{ version: number }, []>("SELECT version FROM schema_migrations WHERE version = 4").get();
    expect(ver4?.version).toBe(4);
    const ver = app.sqliteClient.db.query<{ v: number }, []>("SELECT MAX(version) as v FROM schema_migrations").get();
    expect(ver?.v).toBeGreaterThanOrEqual(4);

    const tables = app.sqliteClient.db
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((t) => t.name);
    expect(tables).toContain("share_grants");
    expect(tables).toContain("organic_evidence");

    const preservedDos = app.workspace.getRawDossier("DOS-V3-01");
    expect(preservedDos?.dossierCode).toBe("CODE-V3-01");
  } finally {
    app?.sqliteClient.close();
    app = null;
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  }
}
