import type { ContainerDossier } from "../domain/types.js";
import type { ShareAccessGrant, SharePurpose, ShareScope } from "../domain/pilot-types.js";
import type { SqliteClient } from "../storage/sqlite-client.js";

export interface ShareGrantRow {
  id: string; dossier_id: string; owner_tenant_id: string; grantee_tenant_id: string;
  purpose: SharePurpose; scope: ShareScope; granted_at: string; granted_by: string;
  expires_at: string; is_revoked: number; revoked_at: string | null;
  revoked_by: string | null; revocation_reason: string | null;
}

export function mapRowToShareGrant(row: ShareGrantRow): ShareAccessGrant {
  return { id: row.id, dossierId: row.dossier_id, ownerTenantId: row.owner_tenant_id, granteeTenantId: row.grantee_tenant_id, purpose: row.purpose, scope: row.scope, grantedAt: row.granted_at, grantedBy: row.granted_by, expiresAt: row.expires_at, isRevoked: row.is_revoked === 1, revokedAt: row.revoked_at ?? undefined, revokedBy: row.revoked_by ?? undefined, revocationReason: row.revocation_reason ?? undefined };
}

export function ensureDossierRowInSqlite(client: SqliteClient, dossier: ContainerDossier): void {
  client.db.run(
    `INSERT OR IGNORE INTO container_dossiers (
      id, tenant_id, dossier_code, container_number, seal_number,
      target_market, border_gate, target_temperature_c, declared_net_weight_kg,
      declared_box_count, lifecycle_state, is_immutable, export_sealed_at,
      latest_validation_result, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dossier.id, dossier.tenantId, dossier.dossierCode, dossier.containerNumber,
      dossier.sealNumber, dossier.targetMarket, dossier.borderGate,
      dossier.targetTemperatureC, dossier.declaredNetWeightKg ?? null,
      dossier.declaredBoxCount ?? null, dossier.lifecycleState,
      dossier.isImmutable ? 1 : 0, dossier.exportSealedAt ?? null,
      dossier.latestValidationResult ? JSON.stringify(dossier.latestValidationResult) : null,
      dossier.createdAt, dossier.updatedAt]
  );
}

export function insertShareGrantRow(
  client: SqliteClient,
  dossier: ContainerDossier,
  grant: ShareAccessGrant
): void {
  ensureDossierRowInSqlite(client, dossier);
  client.db.run(
    `INSERT INTO share_grants (id, dossier_id, owner_tenant_id, grantee_tenant_id, purpose, scope, granted_at, granted_by, expires_at, is_revoked, revoked_at, revoked_by, revocation_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL)`,
    [grant.id, grant.dossierId, grant.ownerTenantId, grant.granteeTenantId, grant.purpose, grant.scope, grant.grantedAt, grant.grantedBy, grant.expiresAt]
  );
}

export function markShareGrantRevokedRow(
  client: SqliteClient,
  grantId: string,
  dossierId: string,
  ownerTenantId: string,
  revokedAt: string,
  revokedBy: string,
  revocationReason: string
): void {
  client.db.run(
    `UPDATE share_grants SET is_revoked = 1, revoked_at = ?, revoked_by = ?, revocation_reason = ?
     WHERE id = ? AND dossier_id = ? AND owner_tenant_id = ?`,
    [revokedAt, revokedBy, revocationReason, grantId, dossierId, ownerTenantId]
  );
}

export function queryShareGrantById(client: SqliteClient, grantId: string): ShareAccessGrant | undefined {
  const row = client.db.query<ShareGrantRow, [string]>("SELECT * FROM share_grants WHERE id = ?").get(grantId);
  return row ? mapRowToShareGrant(row) : undefined;
}

export function queryAllGrantsForOwner(
  client: SqliteClient,
  dossierId: string,
  ownerTenantId: string
): readonly ShareAccessGrant[] {
  return client.db.query<ShareGrantRow, [string, string]>("SELECT * FROM share_grants WHERE dossier_id = ? AND owner_tenant_id = ? ORDER BY granted_at ASC, id ASC").all(dossierId, ownerTenantId).map(mapRowToShareGrant);
}

export function queryActiveGrantsForGrantee(
  client: SqliteClient,
  dossierId: string,
  ownerTenantId: string,
  granteeTenantId: string,
  nowIso: string
): readonly ShareAccessGrant[] {
  return client.db
    .query<ShareGrantRow, [string, string, string, string]>(
      `SELECT * FROM share_grants
       WHERE dossier_id = ? AND owner_tenant_id = ? AND grantee_tenant_id = ? AND is_revoked = 0 AND expires_at > ?
       ORDER BY granted_at ASC, id ASC`
    )
    .all(dossierId, ownerTenantId, granteeTenantId, nowIso)
    .map(mapRowToShareGrant);
}
