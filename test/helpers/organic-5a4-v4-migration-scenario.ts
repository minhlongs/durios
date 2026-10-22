import { expect } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DURIOS_ORGANIC_DISCLAIMER, DURIOS_ORGANIC_RECORD_STATUS } from "../../src/domain/pilot-types.js";
import { createWorkspaceApp } from "../../src/server/server.js";
const V4_SCHEMA_SQL = `
  CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
  INSERT INTO schema_migrations (version, applied_at) VALUES (1, '2026-10-14T00:00:00.000Z'), (2, '2026-10-14T00:00:01.000Z'), (3, '2026-10-14T00:00:02.000Z'), (4, '2026-10-14T00:00:03.000Z');
  CREATE TABLE container_dossiers (
id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, dossier_code TEXT NOT NULL UNIQUE, container_number TEXT NOT NULL, seal_number TEXT NOT NULL, target_market TEXT NOT NULL, border_gate TEXT NOT NULL, target_temperature_c REAL NOT NULL, declared_net_weight_kg REAL, declared_box_count INTEGER,
lifecycle_state TEXT NOT NULL, is_immutable INTEGER NOT NULL DEFAULT 0, export_sealed_at TEXT, latest_validation_result TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL );
  CREATE TABLE documents (
id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL, document_type TEXT NOT NULL, file_name TEXT NOT NULL,
file_size_bytes INTEGER NOT NULL, mime_type TEXT NOT NULL, sha256_hash TEXT NOT NULL, storage_path TEXT NOT NULL, uploaded_at TEXT NOT NULL, is_superseded INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE extracted_fields (
id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL,
field_key TEXT NOT NULL, raw_value TEXT NOT NULL, confirmed_value TEXT, confidence REAL NOT NULL, bounding_box TEXT, verification_status TEXT NOT NULL, verified_by_actor_id TEXT, verified_at TEXT
  );
  CREATE TABLE audit_events (
sequence_id INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, tenant_id TEXT NOT NULL, dossier_id TEXT, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, actor_role TEXT NOT NULL,
event_type TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, payload_before TEXT, payload_after TEXT, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE export_manifests (
id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL UNIQUE REFERENCES container_dossiers(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL, composite_hash TEXT NOT NULL, manifest_json TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE pilot_accounts (
id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, phone_number TEXT UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, actor_name TEXT NOT NULL,
tenant_id TEXT NOT NULL, tenant_type TEXT NOT NULL, role TEXT NOT NULL, persona TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE auth_sessions (
id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
auth_method TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT, revocation_reason TEXT, created_at TEXT NOT NULL );
  CREATE TABLE otp_challenges (
id TEXT PRIMARY KEY, account_id TEXT REFERENCES pilot_accounts(id) ON DELETE CASCADE, phone_number TEXT NOT NULL, channel TEXT NOT NULL, code_hash TEXT NOT NULL,
expires_at TEXT NOT NULL, consumed_at TEXT, attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 5, created_at TEXT NOT NULL
  );
  CREATE TABLE auth_rate_limits (
bucket_key TEXT PRIMARY KEY, attempt_count INTEGER NOT NULL DEFAULT 0, window_started_at TEXT NOT NULL, blocked_until TEXT, updated_at TEXT NOT NULL );
  CREATE TABLE managed_pilot_tokens (
id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, account_id TEXT NOT NULL REFERENCES pilot_accounts(id) ON DELETE CASCADE,
device_label TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT, revocation_reason TEXT, created_at TEXT NOT NULL );
  CREATE TABLE share_grants (
id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE, owner_tenant_id TEXT NOT NULL, grantee_tenant_id TEXT NOT NULL, purpose TEXT NOT NULL,
scope TEXT NOT NULL, granted_at TEXT NOT NULL, granted_by TEXT NOT NULL, expires_at TEXT NOT NULL, is_revoked INTEGER NOT NULL DEFAULT 0, revoked_at TEXT, revoked_by TEXT, revocation_reason TEXT
  );
  CREATE TABLE organic_evidence (
id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES container_dossiers(id) ON DELETE CASCADE, tenant_id TEXT NOT NULL, certifier_name TEXT NOT NULL, certifier_accreditation_number TEXT,
certificate_number TEXT NOT NULL, standard_code TEXT NOT NULL, standard_description TEXT NOT NULL, certified_scope TEXT NOT NULL, valid_from TEXT NOT NULL, valid_to TEXT NOT NULL,
issuing_date TEXT NOT NULL, status TEXT NOT NULL, evidence_document_id TEXT, source_document_url TEXT, regulatory_disclaimer TEXT NOT NULL, recorded_at TEXT NOT NULL, recorded_by TEXT NOT NULL
  );
`;
export function runV4ToV5MigrationScenario(): void {
  const tempDir = mkdtempSync(join(tmpdir(), "durios-v4-to-v5-")), [v4DbPath, v4Uploads] = [join(tempDir, "legacy-v4.db"), join(tempDir, "uploads")];
  let app: ReturnType<typeof createWorkspaceApp> | null = null;
  try {
    const rawDb = new Database(v4DbPath, { create: true });
    rawDb.run("PRAGMA foreign_keys = ON;");
    rawDb.run(V4_SCHEMA_SQL);
    const now = "2026-10-14T08:00:00.000Z";
    rawDb.run(`INSERT INTO container_dossiers VALUES ('DOS-V4-01', 'TEN-A', 'CODE-V4-01', 'MSKU1234565', 'SEAL-V4', 'CN', 'Huu Nghi', 14.0, 18000, 900, 'DRAFT', 0, NULL, NULL, '${now}', '${now}')`);
    rawDb.run(`INSERT INTO organic_evidence VALUES ('ORG-V4-LEGACY', 'DOS-V4-01', 'TEN-A', 'Demo Bio-Certifier (Synthetic)', 'DEMO-ACC-01', 'SYNTH-CERT-2026-01', 'TCVN_11041', 'Vietnamese Organic Standard', 'Durian Orchard Block A', '2026-01-01T00:00:00.000Z', '2027-06-30T23:59:59.000Z', '2026-01-01', 'IN_CONVERSION', 'DOC-SCAN-99', 'https://synthetic-cert.example/01', ?, ?, 'ACT-CLERK-V4')`, [DURIOS_ORGANIC_DISCLAIMER, now]);
    rawDb.close();
    app = createWorkspaceApp({ dbPath: v4DbPath, dataDir: v4Uploads });
    expect(app.sqliteClient.db.query<{ v: number }, []>("SELECT MAX(version) as v FROM schema_migrations").get()?.v).toBe(6);
    const cols = app.sqliteClient.db.query<{ name: string }, []>("PRAGMA table_info(organic_evidence)").all().map((c) => c.name);
    expect(cols.includes("issuer_claimed_status") && cols.includes("durios_record_status") && !cols.includes("status")).toBe(true);
    const migratedList = app.workspace.organicEvidenceManager.listEvidenceForDossier("DOS-V4-01", true, "TEN-A");
    expect(migratedList.length).toBe(1);
    expect(migratedList[0]).toEqual({
id: "ORG-V4-LEGACY", dossierId: "DOS-V4-01", tenantId: "TEN-A", certifierName: "Demo Bio-Certifier (Synthetic)", certifierAccreditationNumber: "DEMO-ACC-01", certificateNumber: "SYNTH-CERT-2026-01", standardCode: "TCVN_11041",
standardDescription: "Vietnamese Organic Standard", certifiedScope: "Durian Orchard Block A", validFrom: "2026-01-01T00:00:00.000Z", validTo: "2027-06-30T23:59:59.000Z", issuingDate: "2026-01-01",
issuerClaimedStatus: "IN_CONVERSION", duriosRecordStatus: DURIOS_ORGANIC_RECORD_STATUS, evidenceDocumentId: "DOC-SCAN-99", sourceDocumentUrl: "https://synthetic-cert.example/01", regulatoryDisclaimer: DURIOS_ORGANIC_DISCLAIMER,
recordedAt: now, recordedBy: "ACT-CLERK-V4", });
  } finally {
    app?.sqliteClient.close();
if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true }); }
}
