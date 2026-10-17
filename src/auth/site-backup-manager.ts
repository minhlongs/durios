import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import { SqliteAuditLedger } from "../storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../storage/sqlite-client.js";
export { restoreSiteBackup, verifySiteBackup } from "./site-restore-service.js";

export interface BackupBlobEntry {
  readonly relativePath: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface SiteBackupManifest {
  readonly manifestVersion: "1.0.0";
  readonly createdAt: string;
  readonly databaseSha256: string;
  readonly auditChainValid: boolean;
  readonly dossierCount: number;
  readonly documentCount: number;
  readonly blobs: readonly BackupBlobEntry[];
}

export interface SiteBackupVerificationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly manifest?: SiteBackupManifest | undefined;
}

export interface DocBackupRow {
  id: string;
  dossier_id: string;
  sha256_hash: string;
  storage_path: string;
  file_size_bytes: number;
}

export function createSiteBackup(
  dbPath: string,
  dataDir: string,
  backupDir: string
): SiteBackupManifest {
  const absDbPath = resolve(dbPath);
  const absDataDir = resolve(dataDir);
  const absBackupDir = resolve(backupDir);

  if (!existsSync(absDbPath)) throw new Error(`Source SQLite database does not exist at '${absDbPath}'.`);

  mkdirSync(absBackupDir, { recursive: true });
  const backupDbPath = join(absBackupDir, "durios.db");
  if (existsSync(backupDbPath)) unlinkSync(backupDbPath);

  const sourceClient = new SqliteClient({ dbPath: absDbPath });
  try {
    sourceClient.db.run(`VACUUM INTO '${backupDbPath.replace(/'/g, "''")}'`);
  } finally {
    sourceClient.close();
  }

  const backupClient = new SqliteClient({ dbPath: backupDbPath });
  try {
    const ledger = new SqliteAuditLedger(backupClient);
    if (!ledger.verifyIntegrity()) {
      throw new Error("Refusing to complete backup: SQLite audit ledger hash chain failed integrity check.");
    }

    const dossierCountRow = backupClient.db
      .query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM container_dossiers")
      .get();
    const docRows = backupClient.db
      .query<DocBackupRow, []>(
        "SELECT id, dossier_id, sha256_hash, storage_path, file_size_bytes FROM documents ORDER BY uploaded_at ASC, id ASC"
      )
      .all();

    const backupUploadsDir = join(absBackupDir, "uploads");
    mkdirSync(join(backupUploadsDir, "storage", "blobs"), { recursive: true });

    const copiedPaths = new Set<string>();
    const blobEntries: BackupBlobEntry[] = [];

    for (const doc of docRows) {
      const relPath = doc.storage_path;
      const srcBlobPath = join(absDataDir, relPath);
      if (!existsSync(srcBlobPath)) {
        throw new Error(`Backup failed: missing physical blob '${relPath}' referenced by document '${doc.id}'.`);
      }
      const bytes = new Uint8Array(readFileSync(srcBlobPath));
      const actualSha = calculateSha256(bytes);
      if (actualSha !== doc.sha256_hash) {
        throw new Error(
          `Backup failed: blob SHA-256 mismatch for document '${doc.id}' at '${relPath}' (expected '${doc.sha256_hash}', got '${actualSha}').`
        );
      }

      if (!copiedPaths.has(relPath)) {
        const dstBlobPath = join(backupUploadsDir, relPath);
        mkdirSync(dirname(dstBlobPath), { recursive: true });
        writeFileSync(dstBlobPath, bytes);
        if (calculateSha256(new Uint8Array(readFileSync(dstBlobPath))) !== actualSha) {
          throw new Error(`Backup write verification failed for blob '${relPath}'.`);
        }
        copiedPaths.add(relPath);
        blobEntries.push({ relativePath: relPath, sha256: actualSha, sizeBytes: bytes.byteLength });
      }
    }

    const srcBlobsFolder = join(absDataDir, "storage", "blobs");
    if (existsSync(srcBlobsFolder)) {
      for (const fileName of readdirSync(srcBlobsFolder).sort()) {
        if (!fileName.endsWith(".bin")) continue;
        const relPath = `storage/blobs/${fileName}`;
        if (copiedPaths.has(relPath)) continue;

        const expectedSha = fileName.slice(0, -4);
        const bytes = new Uint8Array(readFileSync(join(srcBlobsFolder, fileName)));
        const actualSha = calculateSha256(bytes);
        if (actualSha !== expectedSha) throw new Error(`Corrupted blob in source directory '${relPath}'.`);

        writeFileSync(join(backupUploadsDir, relPath), bytes);
        blobEntries.push({ relativePath: relPath, sha256: actualSha, sizeBytes: bytes.byteLength });
      }
    }

    backupClient.close();
    const databaseSha256 = calculateSha256(new Uint8Array(readFileSync(backupDbPath)));
    const manifest: SiteBackupManifest = {
      manifestVersion: "1.0.0", createdAt: new Date().toISOString(), databaseSha256,
      auditChainValid: true, dossierCount: dossierCountRow?.cnt ?? 0,
      documentCount: docRows.length, blobs: blobEntries,
    };

    writeFileSync(join(absBackupDir, "backup-manifest.json"), JSON.stringify(manifest, null, 2));
    return manifest;
  } catch (err) {
    try { backupClient.close(); } catch { /* ignore */ }
    throw err;
  }
}
