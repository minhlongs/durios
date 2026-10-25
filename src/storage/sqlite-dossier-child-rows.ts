import type { Database } from "bun:sqlite";
import type { ContainerDossier } from "../domain/types.js";

/**
 * Writes a dossier's document and extracted-field rows.
 *
 * These are guarded by the parent write: the dossier row is only overwritten when
 * its version still matches, so these child upserts stay idempotent and are never
 * reached by a save the version guard has already refused.
 */
export function upsertDossierChildRows(db: Database, dossier: ContainerDossier): void {
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
