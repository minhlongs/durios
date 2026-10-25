import type {
  AuthenticatedActor, ContainerDossier, DossierExportManifest,
} from "../domain/types.js";
import { AccessControlError } from "../auth/rbac-policy.js";
import { StaleDossierVersionError } from "../domain/stale-dossier-version-error.js";
import type { SqliteClient } from "./sqlite-client.js";
import {
  type DocumentRow, type DossierRow, type FieldRow, mapRowsToDossier, upsertDossierRows,
} from "./sqlite-dossier-mapper.js";
import { hasActiveSqliteShareGrant, listDossierRowsForActor } from "./sqlite-dossier-share-filter.js";
import { insertExportManifestRow, sealExportWithManifest } from "./sqlite-export-manifest.js";

export class SqliteDossierRepository {
  private accessChecker?: ((dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean) | undefined;

  constructor(public readonly client: SqliteClient) {}

  public setAccessChecker(
    checker: (dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean
  ): void {
    this.accessChecker = checker;
  }

  /**
   * Persists the dossier and returns it with the version the store now holds.
   *
   * When the caller supplies a version, the write is admitted only if that version is
   * still current, so a dossier edited behind another actor's back is refused instead
   * of quietly replacing their work. The returned object is authoritative afterwards:
   * the caller's copy still carries the version it read at, so a later save from that
   * copy is refused rather than overwriting the work that superseded it.
   */
  public save(dossier: ContainerDossier, expectedVersion?: number): ContainerDossier {
    const existing = this.client.db.query<{ version: number }, [string]>("SELECT version FROM container_dossiers WHERE id = ?").get(dossier.id);
    if (existing && expectedVersion !== undefined && expectedVersion !== existing.version) {
      throw new StaleDossierVersionError(dossier.id, expectedVersion, existing.version);
    }
    const nextVersion = existing ? existing.version + 1 : Math.max(1, dossier.version);
    this.client.transaction(() => { upsertDossierRows(this.client.db, dossier, expectedVersion); });
    return { ...dossier, version: nextVersion };
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

  public findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined {
    const raw = this.findRaw(dossierId);
    if (!raw) return undefined;
    if (raw.tenantId === actor.tenantId || hasActiveSqliteShareGrant(this.client.db, dossierId, raw.tenantId, actor.tenantId) || Boolean(this.accessChecker?.(dossierId, raw.tenantId, actor.tenantId))) return raw;
    return undefined;
  }

  public listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[] {
    return listDossierRowsForActor(this.client.db, actor).map((dRow) => this.hydrateDossier(dRow));
  }

  public getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const dossier = this.findById(dossierId, actor);
    if (dossier) return dossier;
    if (this.findRaw(dossierId)) throw new AccessControlError(`Cross-tenant access prohibited for dossier '${dossierId}'.`, "CROSS_TENANT_FORBIDDEN");
    throw new Error(`Dossier '${dossierId}' not found for tenant '${actor.tenantId}'.`);
  }

  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined {
    const accessible = this.findById(dossierId, actor);
    if (!accessible) return undefined;
    const row = this.client.db.query<{ manifest_json: string }, [string, string]>("SELECT manifest_json FROM export_manifests WHERE dossier_id = ? AND tenant_id = ?").get(dossierId, accessible.tenantId);
    return row ? JSON.parse(row.manifest_json) : undefined;
  }

  public saveExportManifest(manifest: DossierExportManifest, actor: AuthenticatedActor): void {
    insertExportManifestRow(this.client, manifest, actor);
  }

  public sealExport(dossier: ContainerDossier, manifest: DossierExportManifest, actor: AuthenticatedActor, expectedVersion?: number): ContainerDossier {
    return sealExportWithManifest(this.client, dossier, manifest, actor, (d, v) => this.save(d, v), expectedVersion);
  }
}
