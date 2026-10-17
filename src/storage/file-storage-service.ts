import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type { Database } from "bun:sqlite";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import {
  reconcileLegacyBlobsInSqlite,
  type LegacyBlobMigrationItem,
  type LegacyBlobReconciliationReport,
  type LegacyUnmigratedReason,
} from "./legacy-blob-reconciler.js";

export type {
  LegacyBlobMigrationItem,
  LegacyBlobReconciliationReport,
  LegacyUnmigratedReason,
};

export interface StoredBlobResult {
  readonly storagePath: string;
  readonly sha256: string;
  readonly createdNew: boolean;
}

export class FileStorageService {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/uploads") {
    this.storageDir = resolve(storageDir);
    if (!existsSync(this.storageDir)) mkdirSync(this.storageDir, { recursive: true });
  }

  public getStorageRoot(): string {
    return this.storageDir;
  }

  public storeFile(
    fileBytes: Uint8Array,
    _originalFileName?: string,
    _docId?: string
  ): StoredBlobResult {
    const sha256 = calculateSha256(fileBytes);
    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      throw new Error(`Invalid SHA-256 digest generated: '${sha256}'`);
    }

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
        throw new Error(
          `Integrity violation: existing blob at '${relativeStoragePath}' does not match SHA-256 '${sha256}'`
        );
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
      if (existsSync(tempPath)) {
        try { unlinkSync(tempPath); } catch { /* ignore */ }
      }
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
    } catch { /* ignore */ }
  }

  public resolveSafePath(userOrRelativePath: string): string {
    if (
      typeof userOrRelativePath !== "string" ||
      userOrRelativePath.trim() === "" ||
      userOrRelativePath.includes("\0") ||
      isAbsolute(userOrRelativePath) ||
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
    return reconcileLegacyBlobsInSqlite(
      db,
      this.storageDir,
      (relPath) => this.resolveSafePath(relPath),
      (bytes, fileName, docId) => this.storeFile(bytes, fileName, docId)
    );
  }
}
