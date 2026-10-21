import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import { SqliteAuditLedger } from "../storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import type {
  DocBackupRow, SiteBackupManifest, SiteBackupVerificationResult,
} from "./site-backup-manager.js";

export function verifySiteBackup(backupDir: string): SiteBackupVerificationResult {
  const absBackupDir = resolve(backupDir);
  const manifestPath = join(absBackupDir, "backup-manifest.json");
  const backupDbPath = join(absBackupDir, "durios.db");
  const backupUploadsDir = join(absBackupDir, "uploads");
  const errors: string[] = [];

  if (!existsSync(manifestPath)) return { valid: false, errors: ["Missing backup-manifest.json in backup directory."] };
  if (!existsSync(backupDbPath)) return { valid: false, errors: ["Missing durios.db in backup directory."] };

  let manifest: SiteBackupManifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as SiteBackupManifest; } catch {
    return { valid: false, errors: ["Malformed backup-manifest.json."] };
  }

  const actualDbSha = calculateSha256(new Uint8Array(readFileSync(backupDbPath)));
  if (actualDbSha !== manifest.databaseSha256) {
    errors.push(`Database SHA-256 mismatch: manifest expects '${manifest.databaseSha256}', actual is '${actualDbSha}'.`);
  }

  const client = new SqliteClient({ dbPath: backupDbPath });
  try {
    if (!new SqliteAuditLedger(client).verifyIntegrity()) {
      errors.push("Backup SQLite audit ledger hash chain failed verifyIntegrity().");
    }

    const docRows = client.db.query<DocBackupRow, []>("SELECT id, dossier_id, sha256_hash, storage_path, file_size_bytes FROM documents").all();
    if (docRows.length !== manifest.documentCount) {
      errors.push(`Document count mismatch: manifest records ${manifest.documentCount}, database has ${docRows.length}.`);
    }

    for (const doc of docRows) {
      const blobFile = join(backupUploadsDir, doc.storage_path);
      if (!existsSync(blobFile)) { errors.push(`Missing blob file '${doc.storage_path}' for document '${doc.id}'.`); continue; }
      const actualBlobSha = calculateSha256(new Uint8Array(readFileSync(blobFile)));
      if (actualBlobSha !== doc.sha256_hash) errors.push(`Corrupted blob for document '${doc.id}' at '${doc.storage_path}': expected '${doc.sha256_hash}', got '${actualBlobSha}'.`);
    }

    for (const entry of manifest.blobs) {
      const blobFile = join(backupUploadsDir, entry.relativePath);
      if (!existsSync(blobFile)) { errors.push(`Missing manifest blob '${entry.relativePath}'.`); continue; }
      const bytes = new Uint8Array(readFileSync(blobFile));
      if (calculateSha256(bytes) !== entry.sha256 || bytes.byteLength !== entry.sizeBytes) errors.push(`Manifest blob integrity mismatch at '${entry.relativePath}'.`);
    }
  } finally { client.close(); }
  return { valid: errors.length === 0, errors, manifest };
}

export function restoreSiteBackup(
  backupDir: string, targetDbPath: string, targetDataDir: string
): SiteBackupVerificationResult {
  const verification = verifySiteBackup(backupDir);
  if (!verification.valid || !verification.manifest) throw new Error(`Refusing to restore invalid or corrupted backup: ${verification.errors.join("; ")}`);
  const [absBackupDir, absTargetDbPath, absTargetDataDir] = [resolve(backupDir), resolve(targetDbPath), resolve(targetDataDir)];
  mkdirSync(dirname(absTargetDbPath), { recursive: true });
  mkdirSync(join(absTargetDataDir, "storage", "blobs"), { recursive: true });

  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = `${absTargetDbPath}${suffix}`;
    if (existsSync(candidate)) rmSync(candidate, { force: true });
  }

  writeFileSync(absTargetDbPath, new Uint8Array(readFileSync(join(absBackupDir, "durios.db"))));
  if (calculateSha256(new Uint8Array(readFileSync(absTargetDbPath))) !== verification.manifest.databaseSha256) throw new Error("Restored SQLite database failed post-write SHA-256 verification.");

  for (const blob of verification.manifest.blobs) {
    const srcBlob = join(absBackupDir, "uploads", blob.relativePath);
    const dstBlob = join(absTargetDataDir, blob.relativePath);
    mkdirSync(dirname(dstBlob), { recursive: true });
    writeFileSync(dstBlob, new Uint8Array(readFileSync(srcBlob)));
    if (calculateSha256(new Uint8Array(readFileSync(dstBlob))) !== blob.sha256) throw new Error(`Restored blob '${blob.relativePath}' failed post-write SHA-256 check.`);
  }

  const checkClient = new SqliteClient({ dbPath: absTargetDbPath });
  try {
    if (!new SqliteAuditLedger(checkClient).verifyIntegrity()) throw new Error("Restored database failed post-restore audit ledger integrity check.");
  } finally { checkClient.close(); }
  return verification;
}
