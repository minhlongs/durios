import type { Database } from "bun:sqlite";
import type { ContainerDossier } from "../domain/types.js";
import { StaleDossierVersionError } from "../domain/stale-dossier-version-error.js";
import { upsertDossierChildRows } from "./sqlite-dossier-child-rows.js";

const DOSSIER_COLUMNS = "id, tenant_id, dossier_code, container_number, seal_number, target_market, border_gate, target_temperature_c, declared_net_weight_kg, declared_box_count, lifecycle_state, is_immutable, export_sealed_at, latest_validation_result, created_at, updated_at, version";

function dossierRowValues(dossier: ContainerDossier): readonly (string | number | null)[] {
  return [
    dossier.id, dossier.tenantId, dossier.dossierCode, dossier.containerNumber,
    dossier.sealNumber, dossier.targetMarket, dossier.borderGate, dossier.targetTemperatureC,
    dossier.declaredNetWeightKg ?? null, dossier.declaredBoxCount ?? null,
    dossier.lifecycleState, dossier.isImmutable ? 1 : 0, dossier.exportSealedAt ?? null,
    dossier.latestValidationResult ? JSON.stringify(dossier.latestValidationResult) : null,
    dossier.createdAt, dossier.updatedAt, dossier.version,
  ];
}

/**
 * Persists the dossier aggregate.
 *
 * The insert path creates the row at the version the caller supplied (1 for a new
 * dossier). The update path carries the version guard: the row is overwritten only
 * when the version the caller holds still matches what is stored, and the write takes
 * the counter forward. Comparing and incrementing happen inside one UPDATE, so two
 * racing writers cannot both satisfy the guard — the first moves the version and the
 * second matches no row, leaving the transaction with nothing to write.
 */
export function upsertDossierRows(db: Database, dossier: ContainerDossier, expectedVersion: number | undefined): void {
  const placeholders = DOSSIER_COLUMNS.split(", ").map(() => "?").join(", ");
  const guarded = db.run(
    `INSERT INTO container_dossiers (${DOSSIER_COLUMNS}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET
       container_number = excluded.container_number, seal_number = excluded.seal_number,
       border_gate = excluded.border_gate, target_temperature_c = excluded.target_temperature_c,
       declared_net_weight_kg = excluded.declared_net_weight_kg, declared_box_count = excluded.declared_box_count,
       lifecycle_state = excluded.lifecycle_state, is_immutable = excluded.is_immutable,
       export_sealed_at = excluded.export_sealed_at, latest_validation_result = excluded.latest_validation_result,
       updated_at = excluded.updated_at, version = container_dossiers.version + 1
     WHERE container_dossiers.version = ?`,
    [...dossierRowValues(dossier), expectedVersion ?? dossier.version]
  );
  // A guarded UPDATE that matches no row is a stale write, not a no-op. The caller
  // already verified the version a statement earlier, so this fires only when
  // something moved between the check and the write — but if it ever does, the write
  // must be refused rather than reported successful with a version nobody stored.
  if (guarded.changes === 0 && dossierExists(db, dossier.id)) {
    const storedVersion = storedDossierVersion(db, dossier.id);
    throw new StaleDossierVersionError(dossier.id, expectedVersion ?? dossier.version, storedVersion);
  }
  upsertDossierChildRows(db, dossier);
}

function dossierExists(db: Database, dossierId: string): boolean {
  return db.query<{ id: string }, [string]>("SELECT id FROM container_dossiers WHERE id = ?").get(dossierId) !== null;
}

function storedDossierVersion(db: Database, dossierId: string): number {
  const row = db.query<{ version: number }, [string]>("SELECT version FROM container_dossiers WHERE id = ?").get(dossierId);
  return row ? row.version : 0;
}
