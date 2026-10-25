import type { Database } from "bun:sqlite";

/**
 * Adds the optimistic-concurrency counter to the dossier aggregate root. Existing
 * pilot rows start at 1, which is the version their first recorded save produced,
 * so a database written before this migration stays writable without a backfill.
 *
 * Only the dossier row carries the counter: document and field rows are upserted
 * idempotently once the parent write is admitted, so a second counter there would
 * guard nothing while adding a way to fail a legitimate write.
 */
export function applyMigrationV7(db: Database): void {
  db.transaction(() => {
    db.run(`ALTER TABLE container_dossiers ADD COLUMN version INTEGER NOT NULL DEFAULT 1;`);
    db.run(`INSERT INTO schema_migrations (version, applied_at) VALUES (7, datetime('now'));`);
  })();
}
