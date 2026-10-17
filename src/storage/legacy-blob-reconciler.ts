import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import type { Database } from "bun:sqlite";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { StoredBlobResult } from "./file-storage-service.js";

export type LegacyUnmigratedReason =
  | "MISSING_LEGACY_FILE"
  | "AMBIGUOUS_LEGACY_FILES"
  | "SHA256_MISMATCH"
  | "UNSAFE_LEGACY_PATH";

export interface LegacyBlobMigrationItem {
  readonly documentId: string;
  readonly dossierId: string;
  readonly previousStoragePath: string;
  readonly newStoragePath?: string | undefined;
  readonly sha256Hash: string;
  readonly reason?: LegacyUnmigratedReason | undefined;
}

export interface LegacyBlobReconciliationReport {
  readonly migrated: readonly LegacyBlobMigrationItem[];
  readonly unmigrated: readonly LegacyBlobMigrationItem[];
}

export function reconcileLegacyBlobsInSqlite(
  db: Database,
  storageDir: string,
  resolveSafePath: (relPath: string) => string,
  storeFile: (bytes: Uint8Array, fileName?: string, docId?: string) => StoredBlobResult
): LegacyBlobReconciliationReport {
  const hasDocs = db
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'documents'"
    )
    .get();
  if (!hasDocs) return { migrated: [], unmigrated: [] };

  const rows = db
    .query<
      { id: string; dossier_id: string; file_name: string; sha256_hash: string; storage_path: string },
      []
    >("SELECT id, dossier_id, file_name, sha256_hash, storage_path FROM documents ORDER BY uploaded_at ASC, id ASC")
    .all();

  const migrated: LegacyBlobMigrationItem[] = [];
  const unmigrated: LegacyBlobMigrationItem[] = [];

  for (const row of rows) {
    const canonicalRelPath = `storage/blobs/${row.sha256_hash}.bin`;
    if (row.storage_path === canonicalRelPath) {
      const canonicalFull = resolveSafePath(canonicalRelPath);
      if (
        existsSync(canonicalFull) &&
        calculateSha256(new Uint8Array(readFileSync(canonicalFull))) === row.sha256_hash
      ) {
        continue;
      }
    }

    const candidate = findDeterministicLegacyFile(row.id, row.storage_path, storageDir, resolveSafePath);
    if (candidate.status !== "FOUND") {
      unmigrated.push({
        documentId: row.id,
        dossierId: row.dossier_id,
        previousStoragePath: row.storage_path,
        sha256Hash: row.sha256_hash,
        reason: candidate.reason,
      });
      continue;
    }

    const fileBytes = new Uint8Array(readFileSync(candidate.fullPath));
    if (calculateSha256(fileBytes) !== row.sha256_hash) {
      unmigrated.push({
        documentId: row.id,
        dossierId: row.dossier_id,
        previousStoragePath: row.storage_path,
        sha256Hash: row.sha256_hash,
        reason: "SHA256_MISMATCH",
      });
      continue;
    }

    const stored = storeFile(fileBytes, row.file_name, row.id);
    db.run("UPDATE documents SET storage_path = ? WHERE id = ?", [stored.storagePath, row.id]);
    migrated.push({
      documentId: row.id,
      dossierId: row.dossier_id,
      previousStoragePath: row.storage_path,
      newStoragePath: stored.storagePath,
      sha256Hash: row.sha256_hash,
    });
  }
  return { migrated, unmigrated };
}

function findDeterministicLegacyFile(
  docId: string,
  recordedStoragePath: string,
  storageDir: string,
  resolveSafePath: (relPath: string) => string
):
  | { readonly status: "FOUND"; readonly fullPath: string }
  | { readonly status: "UNRESOLVED"; readonly reason: LegacyUnmigratedReason } {
  try {
    const directSafe = resolveSafePath(recordedStoragePath);
    if (existsSync(directSafe) && statSync(directSafe).isFile()) {
      return { status: "FOUND", fullPath: directSafe };
    }
    if (recordedStoragePath.startsWith("data/uploads/")) {
      const strippedSafe = resolveSafePath(recordedStoragePath.slice("data/uploads/".length));
      if (existsSync(strippedSafe) && statSync(strippedSafe).isFile()) {
        return { status: "FOUND", fullPath: strippedSafe };
      }
    }
  } catch {
    return { status: "UNRESOLVED", reason: "UNSAFE_LEGACY_PATH" };
  }

  if (!existsSync(storageDir)) return { status: "UNRESOLVED", reason: "MISSING_LEGACY_FILE" };
  const prefix = `doc_${docId.replace(/[^a-zA-Z0-9_-]/g, "")}_`;
  const entries = readdirSync(storageDir).filter((entry) => entry.startsWith(prefix));
  if (entries.length === 1) {
    const matchedFull = resolveSafePath(entries[0]!);
    if (existsSync(matchedFull) && statSync(matchedFull).isFile()) {
      return { status: "FOUND", fullPath: matchedFull };
    }
  }
  return {
    status: "UNRESOLVED",
    reason: entries.length > 1 ? "AMBIGUOUS_LEGACY_FILES" : "MISSING_LEGACY_FILE",
  };
}
