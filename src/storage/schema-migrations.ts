import type { Database } from "bun:sqlite";

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const row = db.query<{ version: number }, []>(
    "SELECT MAX(version) as version FROM schema_migrations"
  ).get();
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    applyMigrationV1(db);
  }
}

function applyMigrationV1(db: Database): void {
  db.transaction(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS container_dossiers (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        dossier_code TEXT NOT NULL UNIQUE,
        container_number TEXT NOT NULL,
        seal_number TEXT NOT NULL,
        target_market TEXT NOT NULL,
        border_gate TEXT NOT NULL,
        target_temperature_c REAL NOT NULL,
        declared_net_weight_kg REAL,
        declared_box_count INTEGER,
        lifecycle_state TEXT NOT NULL,
        is_immutable INTEGER NOT NULL DEFAULT 0,
        export_sealed_at TEXT,
        latest_validation_result TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dossiers_tenant ON container_dossiers(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_dossiers_code ON container_dossiers(dossier_code);

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        sha256_hash TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        is_superseded INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_documents_dossier ON documents(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

      CREATE TABLE IF NOT EXISTS extracted_fields (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        field_key TEXT NOT NULL,
        raw_value TEXT NOT NULL,
        confirmed_value TEXT,
        confidence REAL NOT NULL,
        bounding_box TEXT,
        verification_status TEXT NOT NULL,
        verified_by_actor_id TEXT,
        verified_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_fields_doc ON extracted_fields(document_id);
      CREATE INDEX IF NOT EXISTS idx_fields_dossier ON extracted_fields(dossier_id);

      CREATE TABLE IF NOT EXISTS audit_events (
        sequence_id INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        tenant_id TEXT NOT NULL,
        dossier_id TEXT,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload_before TEXT,
        payload_after TEXT,
        previous_hash TEXT NOT NULL,
        event_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_dossier ON audit_events(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_id);

      CREATE TABLE IF NOT EXISTS export_manifests (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL UNIQUE REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        composite_hash TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      INSERT INTO schema_migrations (version, applied_at)
      VALUES (1, datetime('now'));
    `);
  })();
}
