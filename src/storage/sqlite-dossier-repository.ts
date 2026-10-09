import type {
  AuthenticatedActor,
  ContainerDossier,
  DossierExportManifest,
} from "../domain/types.js";
import type { SqliteClient } from "./sqlite-client.js";
import {
  type DocumentRow,
  type DossierRow,
  type FieldRow,
  mapRowsToDossier,
} from "./sqlite-dossier-mapper.js";

export class SqliteDossierRepository {
  constructor(private readonly client: SqliteClient) {}

  public save(dossier: ContainerDossier): void {
    this.client.transaction(() => {
      this.client.db.run(
        `INSERT INTO container_dossiers (
          id, tenant_id, dossier_code, container_number, seal_number,
          target_market, border_gate, target_temperature_c, declared_net_weight_kg,
          declared_box_count, lifecycle_state, is_immutable, export_sealed_at,
          latest_validation_result, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          container_number = excluded.container_number,
          seal_number = excluded.seal_number,
          border_gate = excluded.border_gate,
          target_temperature_c = excluded.target_temperature_c,
          declared_net_weight_kg = excluded.declared_net_weight_kg,
          declared_box_count = excluded.declared_box_count,
          lifecycle_state = excluded.lifecycle_state,
          is_immutable = excluded.is_immutable,
          export_sealed_at = excluded.export_sealed_at,
          latest_validation_result = excluded.latest_validation_result,
          updated_at = excluded.updated_at`,
        [
          dossier.id, dossier.tenantId, dossier.dossierCode, dossier.containerNumber,
          dossier.sealNumber, dossier.targetMarket, dossier.borderGate, dossier.targetTemperatureC,
          dossier.declaredNetWeightKg ?? null, dossier.declaredBoxCount ?? null,
          dossier.lifecycleState, dossier.isImmutable ? 1 : 0, dossier.exportSealedAt ?? null,
          dossier.latestValidationResult ? JSON.stringify(dossier.latestValidationResult) : null,
          dossier.createdAt, dossier.updatedAt,
        ]
      );

      for (const doc of dossier.documents) {
        this.client.db.run(
          `INSERT INTO documents (
            id, dossier_id, tenant_id, document_type, file_name, file_size_bytes,
            mime_type, sha256_hash, storage_path, uploaded_at, is_superseded
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET is_superseded = excluded.is_superseded`,
          [
            doc.id, dossier.id, dossier.tenantId, doc.documentType, doc.fileName,
            doc.fileSize, doc.mimeType, doc.sha256Hash, `data/uploads/${doc.id}.bin`,
            doc.uploadedAt, doc.isSuperseded ? 1 : 0,
          ]
        );

        for (const f of doc.extractedFields) {
          this.client.db.run(
            `INSERT INTO extracted_fields (
              id, document_id, dossier_id, tenant_id, field_key, raw_value,
              confirmed_value, confidence, bounding_box, verification_status,
              verified_by_actor_id, verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              confirmed_value = excluded.confirmed_value,
              verification_status = excluded.verification_status,
              verified_by_actor_id = excluded.verified_by_actor_id,
              verified_at = excluded.verified_at`,
            [
              f.id, doc.id, dossier.id, dossier.tenantId, f.fieldKey, f.rawValue,
              f.confirmedValue != null ? String(f.confirmedValue) : null,
              f.confidenceScore ?? 1.0,
              f.boundingBox ? JSON.stringify(f.boundingBox) : null,
              f.verificationStatus, f.verifiedBy ?? null, f.verifiedAt ?? null,
            ]
          );
        }
      }
    });
  }

  public findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined {
    const dRow = this.client.db.query<DossierRow, [string, string]>(
      "SELECT * FROM container_dossiers WHERE id = ? AND tenant_id = ?"
    ).get(dossierId, actor.tenantId);
    if (!dRow) return undefined;

    const docRows = this.client.db.query<DocumentRow, [string, string]>(
      "SELECT * FROM documents WHERE dossier_id = ? AND tenant_id = ?"
    ).all(dossierId, actor.tenantId);

    const fieldRows = this.client.db.query<FieldRow, [string, string]>(
      "SELECT * FROM extracted_fields WHERE dossier_id = ? AND tenant_id = ?"
    ).all(dossierId, actor.tenantId);

    return mapRowsToDossier(dRow, docRows, fieldRows);
  }

  public listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[] {
    const dRows = this.client.db.query<DossierRow, [string]>(
      "SELECT * FROM container_dossiers WHERE tenant_id = ? ORDER BY created_at DESC"
    ).all(actor.tenantId);

    return dRows.map((dRow) => {
      const docRows = this.client.db.query<DocumentRow, [string, string]>(
        "SELECT * FROM documents WHERE dossier_id = ? AND tenant_id = ?"
      ).all(dRow.id, actor.tenantId);

      const fieldRows = this.client.db.query<FieldRow, [string, string]>(
        "SELECT * FROM extracted_fields WHERE dossier_id = ? AND tenant_id = ?"
      ).all(dRow.id, actor.tenantId);

      return mapRowsToDossier(dRow, docRows, fieldRows);
    });
  }

  public getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const dossier = this.findById(dossierId, actor);
    if (!dossier) throw new Error(`Dossier '${dossierId}' not found for tenant '${actor.tenantId}'.`);
    return dossier;
  }

  public saveExportManifest(manifest: DossierExportManifest, actor: AuthenticatedActor): void {
    const manifestId = `MAN-${manifest.dossierId}`;
    const createdAt = manifest.exportedAt || new Date().toISOString();
    this.client.db.run(
      `INSERT INTO export_manifests (
        id, dossier_id, tenant_id, composite_hash, manifest_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(dossier_id) DO UPDATE SET
        composite_hash = excluded.composite_hash, manifest_json = excluded.manifest_json`,
      [manifestId, manifest.dossierId, actor.tenantId, manifest.compositeManifestSha256, JSON.stringify(manifest), createdAt]
    );
  }

  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined {
    const row = this.client.db.query<{ manifest_json: string }, [string, string]>(
      "SELECT manifest_json FROM export_manifests WHERE dossier_id = ? AND tenant_id = ?"
    ).get(dossierId, actor.tenantId);
    if (!row) return undefined;
    return JSON.parse(row.manifest_json);
  }
}
