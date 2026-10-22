import type { Database } from "bun:sqlite";

export function applyMigrationV6(db: Database): void {
  db.transaction(() => {
    db.run(`
      CREATE TABLE share_grants_v6_new (
        id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        owner_tenant_id TEXT NOT NULL, grantee_tenant_id TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK (purpose IN ('CUSTOMS_INSPECTION', 'BUYER_VERIFICATION', 'AUDIT', 'LOGISTICS', 'TRADE_FINANCE', 'MARINE_INSURANCE')),
        scope TEXT NOT NULL CHECK (scope IN ('READ_ONLY', 'READ_AND_VERIFY')),
        granted_at TEXT NOT NULL, granted_by TEXT NOT NULL, expires_at TEXT NOT NULL,
        is_revoked INTEGER NOT NULL DEFAULT 0 CHECK (is_revoked IN (0, 1)),
        revoked_at TEXT, revoked_by TEXT, revocation_reason TEXT,
        CHECK (owner_tenant_id <> grantee_tenant_id)
      );

      INSERT INTO share_grants_v6_new (
        id, dossier_id, owner_tenant_id, grantee_tenant_id, purpose, scope,
        granted_at, granted_by, expires_at, is_revoked, revoked_at, revoked_by, revocation_reason
      )
      SELECT
        id, dossier_id, owner_tenant_id, grantee_tenant_id, purpose, scope,
        granted_at, granted_by, expires_at, is_revoked, revoked_at, revoked_by, revocation_reason
      FROM share_grants;

      DROP TABLE share_grants;
      ALTER TABLE share_grants_v6_new RENAME TO share_grants;
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_share_grants_dossier ON share_grants(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_owner ON share_grants(owner_tenant_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_grantee ON share_grants(grantee_tenant_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_lookup ON share_grants(dossier_id, grantee_tenant_id, is_revoked, expires_at);
      INSERT INTO schema_migrations (version, applied_at) VALUES (6, datetime('now'));
    `);
  })();
}
