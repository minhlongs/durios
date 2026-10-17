import {
  existsSync, mkdirSync, readdirSync, readFileSync,
  renameSync, rmdirSync, statSync, unlinkSync, writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type { Database } from "bun:sqlite";
import { calculateSha256 } from "../ingestion/document-hasher.js";

export type LegacyUnmigratedReason =
  | "MISSING_LEGACY_FILE" | "AMBIGUOUS_LEGACY_FILES" | "SHA256_MISMATCH" | "UNSAFE_LEGACY_PATH";

export interface StoredBlobResult {
  readonly storagePath: string;
  readonly sha256: string;
  readonly createdNew: boolean;
}

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

export class FileStorageService {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/uploads") {
    this.storageDir = resolve(storageDir);
    if (!existsSync(this.storageDir)) mkdirSync(this.storageDir, { recursive: true });
  }

  public getStorageRoot(): string { return this.storageDir; }

  public storeFile(fileBytes: Uint8Array, _originalFileName?: string, _docId?: string): StoredBlobResult {
    const sha256 = calculateSha256(fileBytes);
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error(`Invalid SHA-256 digest generated: '${sha256}'`);

    const relativeStoragePath = `storage/blobs/${sha256}.bin`;
    const targetPath = this.resolveSafePath(relativeStoragePath);
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    if (existsSync(targetPath)) {
      const existingBytes = new Uint8Array(readFileSync(targetPath));
      const isIdentical =
        calculateSha256(existingBytes) === sha256 &&
        existingBytes.byteLength === fileBytes.byteLength &&
        Buffer.compare(Buffer.from(existingBytes), Buffer.from(fileBytes)) === 0;
      if (!isIdentical) {
        throw new Error(`Integrity violation: existing blob at '${relativeStoragePath}' does not match SHA-256 '${sha256}'`);
      }
      return { storagePath: relativeStoragePath, sha256, createdNew: false };
    }

    const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      writeFileSync(tempPath, fileBytes);
      if (calculateSha256(new Uint8Array(readFileSync(tempPath))) !== sha256) {
        throw new Error(`Atomic write verification failed for '${relativeStoragePath}'`);
      }
      renameSync(tempPath, targetPath);
    } catch (err) {
      if (existsSync(tempPath)) { try { unlinkSync(tempPath); } catch { /* ignore */ } }
      throw err;
    }
    return { storagePath: relativeStoragePath, sha256, createdNew: true };
  }

  public readFile(storagePath: string): Uint8Array {
    const safePath = this.resolveSafePath(storagePath);
    if (!existsSync(safePath)) throw new Error(`File not found at storage path: ${storagePath}`);
    return new Uint8Array(readFileSync(safePath));
  }

  public deleteFile(storagePath: string): void {
    const safePath = this.resolveSafePath(storagePath);
    if (existsSync(safePath)) unlinkSync(safePath);
    const blobsDir = resolve(this.storageDir, "storage", "blobs");
    const storageSubDir = resolve(this.storageDir, "storage");
    try {
      if (existsSync(blobsDir) && readdirSync(blobsDir).length === 0) rmdirSync(blobsDir);
      if (existsSync(storageSubDir) && readdirSync(storageSubDir).length === 0) rmdirSync(storageSubDir);
    } catch { /* ignore empty directory cleanup errors */ }
  }

  public resolveSafePath(userOrRelativePath: string): string {
    if (
      typeof userOrRelativePath !== "string" || userOrRelativePath.trim() === "" ||
      userOrRelativePath.includes("\0") || isAbsolute(userOrRelativePath) ||
      /^[a-zA-Z]:[\\/]/.test(userOrRelativePath)
    ) {
      throw new Error("Security violation: path traversal detected");
    }

    const fullPath = resolve(this.storageDir, userOrRelativePath);
    const rootWithSep = this.storageDir.endsWith(sep) ? this.storageDir : `${this.storageDir}${sep}`;
    const rel = relative(this.storageDir, fullPath);
    if (
      !rel || rel === "." || rel === ".." ||
      rel.startsWith(`..${sep}`) || rel.startsWith("../") || rel.startsWith("..\\") ||
      isAbsolute(rel) || !fullPath.startsWith(rootWithSep)
    ) {
      throw new Error("Security violation: path traversal detected");
    }
    return fullPath;
  }

  public reconcileLegacyDocumentBlobs(db: Database): LegacyBlobReconciliationReport {
    const hasDocumentsTable = db.query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'documents'").get();
    if (!hasDocumentsTable) return { migrated: [], unmigrated: [] };

    const rows = db.query<{ id: string; dossier_id: string; file_name: string; sha256_hash: string; storage_path: string }, []>(
      "SELECT id, dossier_id, file_name, sha256_hash, storage_path FROM documents ORDER BY uploaded_at ASC, id ASC"
    ).all();

    const migrated: LegacyBlobMigrationItem[] = [];
    const unmigrated: LegacyBlobMigrationItem[] = [];

    for (const row of rows) {
      const canonicalRelPath = `storage/blobs/${row.sha256_hash}.bin`;
      if (row.storage_path === canonicalRelPath) {
        const canonicalFullPath = this.resolveSafePath(canonicalRelPath);
        if (existsSync(canonicalFullPath) && calculateSha256(new Uint8Array(readFileSync(canonicalFullPath))) === row.sha256_hash) {
          continue;
        }
      }

      const candidate = this.findDeterministicLegacyFile(row.id, row.storage_path);
      if (candidate.status !== "FOUND") {
        unmigrated.push({ documentId: row.id, dossierId: row.dossier_id, previousStoragePath: row.storage_path, sha256Hash: row.sha256_hash, reason: candidate.reason });
        continue;
      }

      const fileBytes = new Uint8Array(readFileSync(candidate.fullPath));
      if (calculateSha256(fileBytes) !== row.sha256_hash) {
        unmigrated.push({ documentId: row.id, dossierId: row.dossier_id, previousStoragePath: row.storage_path, sha256Hash: row.sha256_hash, reason: "SHA256_MISMATCH" });
        continue;
      }

      const stored = this.storeFile(fileBytes, row.file_name, row.id);
      db.run("UPDATE documents SET storage_path = ? WHERE id = ?", [stored.storagePath, row.id]);
      migrated.push({ documentId: row.id, dossierId: row.dossier_id, previousStoragePath: row.storage_path, newStoragePath: stored.storagePath, sha256Hash: row.sha256_hash });
    }
    return { migrated, unmigrated };
  }

  private findDeterministicLegacyFile(
    docId: string,
    recordedStoragePath: string
  ): { readonly status: "FOUND"; readonly fullPath: string } | { readonly status: "UNRESOLVED"; readonly reason: LegacyUnmigratedReason } {
    try {
      const directSafe = this.resolveSafePath(recordedStoragePath);
      if (existsSync(directSafe) && statSync(directSafe).isFile()) return { status: "FOUND", fullPath: directSafe };
      if (recordedStoragePath.startsWith("data/uploads/")) {
        const strippedSafe = this.resolveSafePath(recordedStoragePath.slice("data/uploads/".length));
        if (existsSync(strippedSafe) && statSync(strippedSafe).isFile()) return { status: "FOUND", fullPath: strippedSafe };
      }
    } catch {
      return { status: "UNRESOLVED", reason: "UNSAFE_LEGACY_PATH" };
    }

    if (!existsSync(this.storageDir)) return { status: "UNRESOLVED", reason: "MISSING_LEGACY_FILE" };
    const prefix = `doc_${docId.replace(/[^a-zA-Z0-9_-]/g, "")}_`;
    const entries = readdirSync(this.storageDir).filter((entry) => entry.startsWith(prefix));
    if (entries.length === 1) {
      const matchedFull = this.resolveSafePath(entries[0]!);
      if (existsSync(matchedFull) && statSync(matchedFull).isFile()) return { status: "FOUND", fullPath: matchedFull };
    }
    return { status: "UNRESOLVED", reason: entries.length > 1 ? "AMBIGUOUS_LEGACY_FILES" : "MISSING_LEGACY_FILE" };
  }
}
