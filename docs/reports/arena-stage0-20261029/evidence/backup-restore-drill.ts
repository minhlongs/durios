/**
 * Backup -> verify -> restore drill, runnable by hand with no prerequisites.
 *
 *   bun docs/reports/arena-stage0-20261029/evidence/backup-restore-drill.ts [source-dir]
 *
 * Without an argument it seeds its own synthetic rehearsal database (5 containers, 2 blind
 * faults) inside a fresh temp directory. With an argument it uses `source-dir/durios.db` and
 * `source-dir/uploads`, which is how you rehearse against a database you seeded yourself.
 *
 * Everything it writes goes to fresh temp directories. It never touches the repository ./data
 * directory and never modifies the source database.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import { seedGate05PilotRehearsal } from "../../../../src/auth/pilot-rehearsal-seeder.js";
import { createSiteBackup } from "../../../../src/auth/site-backup-manager.js";
import { restoreSiteBackup, verifySiteBackup } from "../../../../src/auth/site-restore-service.js";
import { calculateSha256 } from "../../../../src/ingestion/document-hasher.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const source = process.argv[2] ?? mkdtempSync(join(tmpdir(), "drill-source-"));
if (!process.argv[2]) {
  seedGate05PilotRehearsal({ dbPath: join(source, "durios.db"), dataDir: join(source, "uploads") });
  console.log(`== seeded a synthetic rehearsal database == ${source}`);
}
const dbPath = join(source, "durios.db");
const dataDir = join(source, "uploads");
if (!existsSync(dbPath)) throw new Error(`No database at ${dbPath}. Pass a directory holding durios.db + uploads.`);

let failures = 0;
const check = (label: string, ok: boolean, detail = ""): void => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? ` | ${detail}` : ""}`);
};
const sha = (p: string): string => calculateSha256(new Uint8Array(readFileSync(p)));

check("repository ./data was not used as the source", !existsSync(join(REPO_ROOT, "data", "durios.db")), `repo=${REPO_ROOT}`);

const backupRoot = mkdtempSync(join(tmpdir(), "drill-backup-"));
const backupDir = join(backupRoot, "backup");
const manifest = createSiteBackup(dbPath, dataDir, backupDir);
console.log(`== backup created == ${backupDir}`);
check("backup manifest records the database hash and counts", manifest.databaseSha256.length === 64,
  `dossiers=${manifest.dossierCount} documents=${manifest.documentCount} blobs=${manifest.blobs.length} auditChainValid=${manifest.auditChainValid}`);

const first = verifySiteBackup(backupDir);
const second = verifySiteBackup(backupDir);
check("backup verifies", first.valid, `errors=${JSON.stringify(first.errors)}`);
check("verification is idempotent (identical result twice)", JSON.stringify(first) === JSON.stringify(second));

const restoreRoot = mkdtempSync(join(tmpdir(), "drill-restore-"));
const restoredDb = join(restoreRoot, "restored.db");
const restoredData = join(restoreRoot, "uploads");
const restored = restoreSiteBackup(backupDir, restoredDb, restoredData);
console.log(`== restored into == ${restoreRoot}`);
check("restore reports valid", restored.valid, `errors=${JSON.stringify(restored.errors)}`);
// The backup is a `VACUUM INTO` snapshot, so it is compared against the hash the backup
// manifest recorded, not against the live WAL-mode file (those legitimately differ).
check("restored database hashes equal to the backup manifest's recorded hash", sha(restoredDb) === manifest.databaseSha256,
  `restored=${sha(restoredDb).slice(0, 16)}… manifest=${manifest.databaseSha256.slice(0, 16)}… liveSource=${sha(dbPath).slice(0, 16)}…`);

const blobDir = join(restoredData, "storage", "blobs");
const blobs = existsSync(blobDir) ? readdirSync(blobDir).filter((f) => f.endsWith(".bin")) : [];
let matched = 0;
for (const file of blobs) if (sha(join(blobDir, file)) === file.slice(0, -4)) matched += 1;
check("every restored blob re-hashes to its recorded SHA-256", blobs.length > 0 && matched === blobs.length, `${matched}/${blobs.length} blobs`);

// Byte-identity is not enough: prove the restored database is usable.
const db = new Database(restoredDb, { readonly: true });
const count = (table: string): number => (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
const dossiers = count("container_dossiers");
const documents = count("documents");
const auditEvents = count("audit_events");
const rows = db.query("SELECT event_type, previous_hash, event_hash FROM audit_events ORDER BY sequence_id ASC").all() as
  Array<{ event_type: string; previous_hash: string; event_hash: string }>;
db.close();
check("post-restore database is readable", dossiers > 0 && documents > 0 && auditEvents > 0,
  `dossiers=${dossiers} documents=${documents} auditEvents=${auditEvents} firstEvent=${rows[0]?.event_type ?? "-"} lastEvent=${rows[rows.length - 1]?.event_type ?? "-"}`);
let linked = 0;
for (let i = 1; i < rows.length; i += 1) if (rows[i]!.previous_hash === rows[i - 1]!.event_hash) linked += 1;
check("post-restore audit hash chain is unbroken", rows.length > 0 && linked === rows.length - 1,
  `${linked}/${Math.max(rows.length - 1, 0)} links, genesis previous_hash=${rows[0]?.previous_hash.slice(0, 16) ?? "-"}`);

// Corruption must be detected. verifySiteBackup checks the BACKUP tree, so tamper with the
// backup copy itself: that is what a corrupted archive looks like from the verifier's seat.
if (blobs.length > 0) {
  const backupBlobDir = join(backupDir, "uploads", "storage", "blobs");
  const target = join(backupBlobDir, blobs[0]!);
  const bytes = new Uint8Array(readFileSync(target));
  bytes[0] = bytes[0]! ^ 0xff;
  writeFileSync(target, bytes);
  const tampered = verifySiteBackup(backupDir);
  check("flipping one byte in a backed-up blob is detected", !tampered.valid,
    `errors=${JSON.stringify(tampered.errors).slice(0, 220)}`);
  const untouchedRestore = sha(join(blobDir, blobs[0]!)) === blobs[0]!.slice(0, -4);
  check("the already-restored copy is unaffected by backup tampering", untouchedRestore);
} else {
  check("a blob was available to tamper with", false);
}

writeFileSync(join(backupRoot, "drill-log.txt"), `source=${dbPath}\nrestore=${restoreRoot}\nfailures=${failures}\n`);
console.log(`== summary == failures=${failures}`);
console.log(`artifacts kept at ${backupRoot} and ${restoreRoot}`);
process.exit(failures === 0 ? 0 : 1);
