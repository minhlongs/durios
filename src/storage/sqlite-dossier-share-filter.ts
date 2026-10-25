import type { Database } from "bun:sqlite";
import type { AuthenticatedActor } from "../domain/types.js";
import type { DossierRow } from "./sqlite-dossier-mapper.js";

/**
 * Whether an active, unexpired share grant lets one tenant read another's dossier.
 * A grant whose purpose or scope no longer permits the access never resolves here,
 * so a revoked or expired grant can never widen visibility.
 */
export function hasActiveSqliteShareGrant(
  db: Database, dossierId: string, ownerTenantId: string, granteeTenantId: string
): boolean {
  const row = db
    .query<{ id: string }, [string, string, string, string]>(
      `SELECT id FROM share_grants
       WHERE dossier_id = ? AND owner_tenant_id = ? AND grantee_tenant_id = ? AND is_revoked = 0 AND expires_at > ?
       LIMIT 1`
    )
    .get(dossierId, ownerTenantId, granteeTenantId, new Date().toISOString());
  return Boolean(row);
}

/** Every dossier row the actor may see: their own, plus any actively shared with them. */
export function listDossierRowsForActor(db: Database, actor: AuthenticatedActor): readonly DossierRow[] {
  return db
    .query<DossierRow, [string, string, string]>(
      `SELECT DISTINCT d.* FROM container_dossiers d LEFT JOIN share_grants sg ON sg.dossier_id = d.id AND sg.owner_tenant_id = d.tenant_id AND sg.grantee_tenant_id = ? AND sg.is_revoked = 0 AND sg.expires_at > ? WHERE d.tenant_id = ? OR sg.id IS NOT NULL ORDER BY d.created_at DESC`
    )
    .all(actor.tenantId, new Date().toISOString(), actor.tenantId);
}
