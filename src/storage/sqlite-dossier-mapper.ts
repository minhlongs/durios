import type { Database } from "bun:sqlite";
import type {
  ContainerDossier, DocumentType, DossierLifecycleState,
  ExtractedField, FieldVerificationStatus, IngestedDocument, ValidationRunResult,
} from "../domain/types.js";

export interface DossierRow {
  readonly id: string; readonly tenant_id: string; readonly dossier_code: string;
  readonly container_number: string; readonly seal_number: string; readonly target_market: string;
  readonly border_gate: string; readonly target_temperature_c: number;
  readonly declared_net_weight_kg: number | null; readonly declared_box_count: number | null;
  readonly lifecycle_state: string; readonly is_immutable: number;
  readonly export_sealed_at: string | null; readonly latest_validation_result: string | null;
  readonly created_at: string; readonly updated_at: string;
}

export interface DocumentRow {
  readonly id: string; readonly dossier_id: string; readonly tenant_id: string;
  readonly document_type: string; readonly file_name: string; readonly file_size_bytes: number;
  readonly mime_type: string; readonly sha256_hash: string; readonly storage_path: string;
  readonly uploaded_at: string; readonly is_superseded: number;
}

export interface FieldRow {
  readonly id: string; readonly document_id: string; readonly dossier_id: string;
  readonly tenant_id: string; readonly field_key: string; readonly raw_value: string;
  readonly confirmed_value: string | null; readonly confidence: number;
  readonly bounding_box: string | null; readonly verification_status: string;
  readonly verified_by_actor_id: string | null; readonly verified_at: string | null;
}

const formatLabel = (key: string): string => key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export function mapRowsToDossier(dossierRow: DossierRow, docRows: readonly DocumentRow[], fieldRows: readonly FieldRow[]): ContainerDossier {
  const fieldsByDoc = new Map<string, ExtractedField[]>();
  for (const f of fieldRows) {
    const list = fieldsByDoc.get(f.document_id) ?? [];
    list.push({ id: f.id, documentId: f.document_id, fieldKey: f.field_key, label: formatLabel(f.field_key), rawValue: f.raw_value, normalizedValue: f.confirmed_value ?? f.raw_value, confidenceScore: f.confidence, boundingBox: f.bounding_box ? JSON.parse(f.bounding_box) : { pageNumber: 1, x: 0, y: 0, width: 0, height: 0 }, verificationStatus: f.verification_status as FieldVerificationStatus, confirmedValue: f.confirmed_value ?? undefined, verifiedBy: f.verified_by_actor_id ?? undefined, verifiedAt: f.verified_at ?? undefined });
    fieldsByDoc.set(f.document_id, list);
  }
  const documents: IngestedDocument[] = docRows.map((d) => ({ id: d.id, dossierId: d.dossier_id, tenantId: d.tenant_id, documentType: d.document_type as DocumentType, fileName: d.file_name, fileSize: d.file_size_bytes, mimeType: d.mime_type, sha256Hash: d.sha256_hash, storagePath: d.storage_path, uploadedAt: d.uploaded_at, isSuperseded: Boolean(d.is_superseded), extractedFields: fieldsByDoc.get(d.id) ?? [] }));
  const validationResult: ValidationRunResult | undefined = dossierRow.latest_validation_result ? JSON.parse(dossierRow.latest_validation_result) : undefined;
  return { id: dossierRow.id, tenantId: dossierRow.tenant_id, dossierCode: dossierRow.dossier_code, containerNumber: dossierRow.container_number, sealNumber: dossierRow.seal_number, targetMarket: dossierRow.target_market as "CN", borderGate: dossierRow.border_gate, targetTemperatureC: dossierRow.target_temperature_c, declaredNetWeightKg: dossierRow.declared_net_weight_kg ?? undefined, declaredBoxCount: dossierRow.declared_box_count ?? undefined, lifecycleState: dossierRow.lifecycle_state as DossierLifecycleState, isImmutable: Boolean(dossierRow.is_immutable), createdAt: dossierRow.created_at, updatedAt: dossierRow.updated_at, exportSealedAt: dossierRow.export_sealed_at ?? undefined, latestValidationResult: validationResult, documents };
}

export function upsertDossierRows(db: Database, dossier: ContainerDossier): void {
  db.run(
    `INSERT INTO container_dossiers (id, tenant_id, dossier_code, container_number, seal_number, target_market, border_gate, target_temperature_c, declared_net_weight_kg, declared_box_count, lifecycle_state, is_immutable, export_sealed_at, latest_validation_result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET container_number = excluded.container_number, seal_number = excluded.seal_number, border_gate = excluded.border_gate, target_temperature_c = excluded.target_temperature_c, declared_net_weight_kg = excluded.declared_net_weight_kg, declared_box_count = excluded.declared_box_count, lifecycle_state = excluded.lifecycle_state, is_immutable = excluded.is_immutable, export_sealed_at = excluded.export_sealed_at, latest_validation_result = excluded.latest_validation_result, updated_at = excluded.updated_at`,
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
    const relativeStoragePath = doc.storagePath ?? `storage/blobs/${doc.sha256Hash}.bin`;
    db.run(
      `INSERT INTO documents (id, dossier_id, tenant_id, document_type, file_name, file_size_bytes, mime_type, sha256_hash, storage_path, uploaded_at, is_superseded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET is_superseded = excluded.is_superseded, storage_path = excluded.storage_path`,
      [doc.id, dossier.id, dossier.tenantId, doc.documentType, doc.fileName, doc.fileSize, doc.mimeType, doc.sha256Hash, relativeStoragePath, doc.uploadedAt, doc.isSuperseded ? 1 : 0]
    );

    for (const f of doc.extractedFields) {
      db.run(
        `INSERT INTO extracted_fields (id, document_id, dossier_id, tenant_id, field_key, raw_value, confirmed_value, confidence, bounding_box, verification_status, verified_by_actor_id, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET confirmed_value = excluded.confirmed_value, verification_status = excluded.verification_status, verified_by_actor_id = excluded.verified_by_actor_id, verified_at = excluded.verified_at`,
        [
          f.id, doc.id, dossier.id, dossier.tenantId, f.fieldKey, f.rawValue,
          f.confirmedValue != null ? String(f.confirmedValue) : null,
          f.confidenceScore ?? 1.0, f.boundingBox ? JSON.stringify(f.boundingBox) : null,
          f.verificationStatus, f.verifiedBy ?? null, f.verifiedAt ?? null,
        ]
      );
    }
  }
}
