import type { Database } from "bun:sqlite";

export function applyMigrationV4(db: Database): void {
  db.transaction(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS share_grants (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        owner_tenant_id TEXT NOT NULL,
        grantee_tenant_id TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK (purpose IN ('CUSTOMS_INSPECTION', 'BUYER_VERIFICATION', 'AUDIT', 'LOGISTICS')),
        scope TEXT NOT NULL CHECK (scope IN ('READ_ONLY', 'READ_AND_VERIFY')),
        granted_at TEXT NOT NULL,
        granted_by TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_revoked INTEGER NOT NULL DEFAULT 0 CHECK (is_revoked IN (0, 1)),
        revoked_at TEXT,
        revoked_by TEXT,
        revocation_reason TEXT,
        CHECK (owner_tenant_id <> grantee_tenant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_share_grants_dossier ON share_grants(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_owner ON share_grants(owner_tenant_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_grantee ON share_grants(grantee_tenant_id);
      CREATE INDEX IF NOT EXISTS idx_share_grants_lookup ON share_grants(dossier_id, grantee_tenant_id, is_revoked, expires_at);

      CREATE TABLE IF NOT EXISTS organic_evidence (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        certifier_name TEXT NOT NULL,
        certifier_accreditation_number TEXT,
        certificate_number TEXT NOT NULL,
        standard_code TEXT NOT NULL CHECK (standard_code IN ('TCVN_11041', 'USDA_NOP_EQUIVALENT', 'EU_ORGANIC_2018_848', 'JAS', 'GLOBAL_G.A.P_ORGANIC_CONVERSION')),
        standard_description TEXT NOT NULL,
        certified_scope TEXT NOT NULL,
        valid_from TEXT NOT NULL,
        valid_to TEXT NOT NULL,
        issuing_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('IN_CONVERSION', 'CERTIFIED', 'EXPIRED', 'SUSPENDED')),
        evidence_document_id TEXT,
        source_document_url TEXT,
        regulatory_disclaimer TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        recorded_by TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_organic_evidence_dossier ON organic_evidence(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_organic_evidence_tenant ON organic_evidence(tenant_id);

      INSERT INTO schema_migrations (version, applied_at) VALUES (4, datetime('now'));
    `);
  })();
}

export function applyMigrationV5(db: Database): void {
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
    `);

    const cols = db
      .query<{ name: string }, []>("PRAGMA table_info(organic_evidence)")
      .all()
      .map((c) => c.name);

    const hasLegacyStatus = cols.includes("status");
    const hasNewColumns =
      cols.includes("issuer_claimed_status") && cols.includes("durios_record_status");

    if (hasLegacyStatus || !hasNewColumns) {
      const sourceStatusExpr = hasLegacyStatus ? "status" : "issuer_claimed_status";
      db.run(`
        CREATE TABLE organic_evidence_v5_new (
          id TEXT PRIMARY KEY,
          dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE,
          tenant_id TEXT NOT NULL,
          certifier_name TEXT NOT NULL,
          certifier_accreditation_number TEXT,
          certificate_number TEXT NOT NULL,
          standard_code TEXT NOT NULL CHECK (standard_code IN ('TCVN_11041', 'USDA_NOP_EQUIVALENT', 'EU_ORGANIC_2018_848', 'JAS', 'GLOBAL_G.A.P_ORGANIC_CONVERSION')),
          standard_description TEXT NOT NULL,
          certified_scope TEXT NOT NULL,
          valid_from TEXT NOT NULL,
          valid_to TEXT NOT NULL,
          issuing_date TEXT NOT NULL,
          issuer_claimed_status TEXT NOT NULL CHECK (issuer_claimed_status IN ('IN_CONVERSION', 'CERTIFIED', 'EXPIRED', 'SUSPENDED')),
          durios_record_status TEXT NOT NULL DEFAULT 'EVIDENCE_STORED_NOT_CERTIFIED' CHECK (durios_record_status = 'EVIDENCE_STORED_NOT_CERTIFIED'),
          evidence_document_id TEXT,
          source_document_url TEXT,
          regulatory_disclaimer TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          recorded_by TEXT NOT NULL
        );

        INSERT INTO organic_evidence_v5_new (
          id, dossier_id, tenant_id, certifier_name, certifier_accreditation_number,
          certificate_number, standard_code, standard_description, certified_scope,
          valid_from, valid_to, issuing_date, issuer_claimed_status, durios_record_status,
          evidence_document_id, source_document_url, regulatory_disclaimer, recorded_at, recorded_by
        )
        SELECT
          id, dossier_id, tenant_id, certifier_name, certifier_accreditation_number,
          certificate_number, standard_code, standard_description, certified_scope,
          valid_from, valid_to, issuing_date, ${sourceStatusExpr}, 'EVIDENCE_STORED_NOT_CERTIFIED',
          evidence_document_id, source_document_url, regulatory_disclaimer, recorded_at, recorded_by
        FROM organic_evidence;

        DROP TABLE organic_evidence;
        ALTER TABLE organic_evidence_v5_new RENAME TO organic_evidence;
      `);
    }

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_organic_evidence_dossier ON organic_evidence(dossier_id);
      CREATE INDEX IF NOT EXISTS idx_organic_evidence_tenant ON organic_evidence(tenant_id);
      CREATE TABLE IF NOT EXISTS edge_sync_queue (
        queue_item_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        dossier_id TEXT NOT NULL UNIQUE,
        dossier_code TEXT NOT NULL,
        composite_manifest_sha256 TEXT NOT NULL,
        status TEXT NOT NULL,
        queued_at TEXT NOT NULL,
        cloud_synced_at TEXT,
        cloud_ack_receipt_hash TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_edge_sync_tenant_status ON edge_sync_queue(tenant_id, status);
      INSERT INTO schema_migrations (version, applied_at) VALUES (5, datetime('now'));
    `);
  })();
}

