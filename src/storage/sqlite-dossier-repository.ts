import type {
  AuthenticatedActor, ContainerDossier, DossierExportManifest,
} from "../domain/types.js";
import { AccessControlError } from "../auth/rbac-policy.js";
import type { SqliteClient } from "./sqlite-client.js";
import {
  type DocumentRow, type DossierRow, type FieldRow, mapRowsToDossier, upsertDossierRows,
} from "./sqlite-dossier-mapper.js";

export class SqliteDossierRepository {
  private accessChecker?: ((dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean) | undefined;

  constructor(public readonly client: SqliteClient) {}

  public setAccessChecker(
    checker: (dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean
  ): void {
    this.accessChecker = checker;
  }

  public save(dossier: ContainerDossier): void {
    this.client.transaction(() => { upsertDossierRows(this.client.db, dossier); });
  }

  private hydrateDossier(dRow: DossierRow): ContainerDossier {
    const docRows = this.client.db.query<DocumentRow, [string]>("SELECT * FROM documents WHERE dossier_id = ?").all(dRow.id);
    const fieldRows = this.client.db.query<FieldRow, [string]>("SELECT * FROM extracted_fields WHERE dossier_id = ?").all(dRow.id);
    return mapRowsToDossier(dRow, docRows, fieldRows);
  }

  public findRaw(dossierId: string): ContainerDossier | undefined {
    const dRow = this.client.db.query<DossierRow, [string]>("SELECT * FROM container_dossiers WHERE id = ?").get(dossierId);
    return dRow ? this.hydrateDossier(dRow) : undefined;
  }

  public hasDocumentReferencingBlob(storagePath: string, sha256Hash: string): boolean {
    return this.client.db.query<{ id: string }, [string, string]>(
      "SELECT id FROM documents WHERE storage_path = ? OR sha256_hash = ? LIMIT 1"
    ).get(storagePath, sha256Hash) !== null;
  }

  private hasActiveSqliteShareGrant(dossierId: string, ownerTenantId: string, granteeTenantId: string): boolean {
    const row = this.client.db
      .query<{ id: string }, [string, string, string, string]>(
        `SELECT id FROM share_grants
         WHERE dossier_id = ? AND owner_tenant_id = ? AND grantee_tenant_id = ? AND is_revoked = 0 AND expires_at > ?
         LIMIT 1`
      )
      .get(dossierId, ownerTenantId, granteeTenantId, new Date().toISOString());
    return Boolean(row);
  }

  public findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined {
    const raw = this.findRaw(dossierId);
    if (!raw) return undefined;
    if (raw.tenantId === actor.tenantId || this.hasActiveSqliteShareGrant(dossierId, raw.tenantId, actor.tenantId) || Boolean(this.accessChecker?.(dossierId, raw.tenantId, actor.tenantId))) return raw;
    return undefined;
  }

  public listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[] {
    const dRows = this.client.db
      .query<DossierRow, [string, string, string]>(
        `SELECT DISTINCT d.* FROM container_dossiers d LEFT JOIN share_grants sg ON sg.dossier_id = d.id AND sg.owner_tenant_id = d.tenant_id AND sg.grantee_tenant_id = ? AND sg.is_revoked = 0 AND sg.expires_at > ? WHERE d.tenant_id = ? OR sg.id IS NOT NULL ORDER BY d.created_at DESC`
      )
      .all(actor.tenantId, new Date().toISOString(), actor.tenantId);
    return dRows.map((dRow) => this.hydrateDossier(dRow));
  }

  public getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const dossier = this.findById(dossierId, actor);
    if (dossier) return dossier;
    if (this.findRaw(dossierId)) throw new AccessControlError(`Cross-tenant access prohibited for dossier '${dossierId}'.`, "CROSS_TENANT_FORBIDDEN");
    throw new Error(`Dossier '${dossierId}' not found for tenant '${actor.tenantId}'.`);
  }

  public saveExportManifest(manifest: DossierExportManifest, actor: AuthenticatedActor): void {
    this.client.db.run(
      `INSERT INTO export_manifests (id, dossier_id, tenant_id, composite_hash, manifest_json, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(dossier_id) DO UPDATE SET composite_hash = excluded.composite_hash, manifest_json = excluded.manifest_json`,
      [`MAN-${manifest.dossierId}`, manifest.dossierId, actor.tenantId, manifest.compositeManifestSha256, JSON.stringify(manifest), manifest.exportedAt || new Date().toISOString()]
    );
  }

  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined {
    const accessible = this.findById(dossierId, actor);
    if (!accessible) return undefined;
    const row = this.client.db.query<{ manifest_json: string }, [string, string]>("SELECT manifest_json FROM export_manifests WHERE dossier_id = ? AND tenant_id = ?").get(dossierId, accessible.tenantId);
    return row ? JSON.parse(row.manifest_json) : undefined;
  }
}
