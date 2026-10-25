import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../domain/types.js";
import type { SqliteClient } from "./sqlite-client.js";

/** Binds a manifest to its row values, shared by the insert and the existence check. */
export function insertExportManifestRow(client: SqliteClient, manifest: DossierExportManifest, actor: AuthenticatedActor): void {
  const result = client.db.run(
    `INSERT INTO export_manifests (id, dossier_id, tenant_id, composite_hash, manifest_json, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(dossier_id) DO NOTHING`,
    [`MAN-${manifest.dossierId}`, manifest.dossierId, actor.tenantId, manifest.compositeManifestSha256, JSON.stringify(manifest), manifest.exportedAt || new Date().toISOString()]
  );
  if (result.changes === 0) {
    throw new Error(`Export manifest for dossier '${manifest.dossierId}' already exists and cannot be replaced.`);
  }
}

/**
 * Seals the dossier and records its manifest in one transaction.
 *
 * Two separate writes would leave a dossier permanently sealed while the operator
 * saw a failed export, because the manifest write is what refuses a second seal.
 * Making them atomic means a refused re-seal also rolls the lifecycle state back.
 */
export function sealExportWithManifest(
  client: SqliteClient,
  dossier: ContainerDossier,
  manifest: DossierExportManifest,
  actor: AuthenticatedActor,
  save: (dossier: ContainerDossier, expectedVersion?: number) => ContainerDossier,
  expectedVersion?: number
): ContainerDossier {
  return client.transaction(() => {
    const saved = save(dossier, expectedVersion);
    insertExportManifestRow(client, manifest, actor);
    return saved;
  });
}
