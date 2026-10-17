import { expect } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculateSha256 } from "../../src/ingestion/document-hasher.js";
import {
  createPdfBytes, seedAndMakeActor, type Redaction5A5Context,
} from "./redaction-and-blobs-5a5-fixtures.js";

function insertLegacyDocRow(
  db: Redaction5A5Context["client"]["db"],
  id: string, dossierId: string, tenantId: string, docType: string,
  fileName: string, sizeBytes: number, sha256: string, storagePath: string, uploadedAt: string
): void {
  db.run(
    `INSERT INTO documents (
      id, dossier_id, tenant_id, document_type, file_name, file_size_bytes,
      mime_type, sha256_hash, storage_path, uploaded_at, is_superseded
    ) VALUES (?, ?, ?, ?, ?, ?, 'application/pdf', ?, ?, ?, 0)`,
    [id, dossierId, tenantId, docType, fileName, sizeBytes, sha256, storagePath, uploadedAt]
  );
}

export function runLegacyBlobReconciliationScenario(ctx: Redaction5A5Context): void {
  const { dataDir, client, fileStorage, workspace } = ctx;
  const clerk = seedAndMakeActor(workspace, "TENANT-LEGACY-01", "CLERK");
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-LEGACY-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-LEG-01",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18000, declaredBoxCount: 900,
    },
    clerk.actor
  );

  const now = new Date().toISOString();

  // Case 1: Deterministic legacy file with matching hash -> migrated
  const validBytes = createPdfBytes("legacy-valid-doc");
  const validSha = calculateSha256(validBytes);
  writeFileSync(join(dataDir, "doc_DOC-LEG-VALID_1700000001.pdf"), validBytes);
  insertLegacyDocRow(
    client.db, "DOC-LEG-VALID", dossier.id, dossier.tenantId,
    "PACKING_LIST", "legacy_valid.pdf", validBytes.byteLength, validSha, "data/uploads/DOC-LEG-VALID.bin", now
  );

  // Case 2: Legacy file missing on disk -> unmigrated (MISSING_LEGACY_FILE)
  const missingSha = calculateSha256(createPdfBytes("legacy-missing-doc"));
  insertLegacyDocRow(
    client.db, "DOC-LEG-MISSING", dossier.id, dossier.tenantId,
    "BILL_OF_LADING", "legacy_missing.pdf", 128, missingSha, "data/uploads/DOC-LEG-MISSING.bin", now
  );

  // Case 3: Legacy file with mismatched hash -> unmigrated (SHA256_MISMATCH), file not deleted
  const mismatchRecordedSha = calculateSha256(createPdfBytes("expected-content"));
  const wrongDiskBytes = createPdfBytes("actual-tampered-content");
  const legacyMismatchFile = join(dataDir, "doc_DOC-LEG-MISMATCH_1700000002.pdf");
  writeFileSync(legacyMismatchFile, wrongDiskBytes);
  insertLegacyDocRow(
    client.db, "DOC-LEG-MISMATCH", dossier.id, dossier.tenantId,
    "COMMERCIAL_INVOICE", "legacy_mismatch.pdf", wrongDiskBytes.byteLength, mismatchRecordedSha, "data/uploads/DOC-LEG-MISMATCH.bin", now
  );

  // Case 4: Multiple ambiguous files matching doc_<id>_* -> unmigrated (AMBIGUOUS_LEGACY_FILES)
  const ambigBytes = createPdfBytes("ambiguous-content");
  const ambigSha = calculateSha256(ambigBytes);
  writeFileSync(join(dataDir, "doc_DOC-LEG-AMBIG_100.pdf"), ambigBytes);
  writeFileSync(join(dataDir, "doc_DOC-LEG-AMBIG_200.pdf"), ambigBytes);
  insertLegacyDocRow(
    client.db, "DOC-LEG-AMBIG", dossier.id, dossier.tenantId,
    "CUSTOMS_DECLARATION", "legacy_ambig.pdf", ambigBytes.byteLength, ambigSha, "data/uploads/DOC-LEG-AMBIG.bin", now
  );

  const report = fileStorage.reconcileLegacyDocumentBlobs(client.db);

  expect(report.migrated.length).toBe(1);
  expect(report.migrated[0]?.documentId).toBe("DOC-LEG-VALID");
  expect(report.migrated[0]?.newStoragePath).toBe(`storage/blobs/${validSha}.bin`);
  expect(existsSync(join(dataDir, "storage", "blobs", `${validSha}.bin`))).toBe(true);

  const validRow = client.db
    .query<{ storage_path: string }, [string]>("SELECT storage_path FROM documents WHERE id = ?")
    .get("DOC-LEG-VALID");
  expect(validRow?.storage_path).toBe(`storage/blobs/${validSha}.bin`);

  expect(report.unmigrated.length).toBe(3);
  expect(report.unmigrated.find((u) => u.documentId === "DOC-LEG-MISSING")?.reason).toBe("MISSING_LEGACY_FILE");
  expect(report.unmigrated.find((u) => u.documentId === "DOC-LEG-MISMATCH")?.reason).toBe("SHA256_MISMATCH");
  expect(report.unmigrated.find((u) => u.documentId === "DOC-LEG-AMBIG")?.reason).toBe("AMBIGUOUS_LEGACY_FILES");

  expect(existsSync(legacyMismatchFile)).toBe(true);
  const mismatchRow = client.db
    .query<{ storage_path: string }, [string]>("SELECT storage_path FROM documents WHERE id = ?")
    .get("DOC-LEG-MISMATCH");
  expect(mismatchRow?.storage_path).toBe("data/uploads/DOC-LEG-MISMATCH.bin");
}
