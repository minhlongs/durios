import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { SqliteDossierRepository } from "../src/storage/sqlite-dossier-repository.js";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../src/domain/types.js";

const REPO_DB = "./data/test-export-atomic-repo.db";

const MANAGER_ACTOR: AuthenticatedActor = {
  id: "usr-atomic-mgr", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "MANAGER", persona: "PACKHOUSE_MANAGER", name: "Manager Nguyen",
};

/**
 * The seal and its manifest are one write. If they were two, the manifest insert's
 * refusal of a duplicate would leave the dossier already EXPORTED while the operator
 * saw a failure — a stuck dossier, since an immutable one accepts no transition.
 * Tested at the repository because the FSM refuses a second export before the route
 * ever reaches this branch.
 */
describe("Sealing a dossier and recording its manifest", () => {
  afterEach(() => {
    for (const suffix of ["", "-wal", "-shm"]) if (existsSync(`${REPO_DB}${suffix}`)) rmSync(`${REPO_DB}${suffix}`, { force: true });
  });

  it("rolls the seal back when the manifest write refuses a duplicate", () => {
    const client = new SqliteClient({ dbPath: REPO_DB });
    try {
      const repo = new SqliteDossierRepository(client);
      const approved = repo.save({
        id: "DOS-ATOMIC-REPO", tenantId: "ten-cailay-001", dossierCode: "DOS-AR", containerNumber: "MSKU1234565",
        sealNumber: "SEAL-AR", targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.0,
        lifecycleState: "APPROVED_FOR_EXPORT", isImmutable: false, createdAt: "2026-10-25T00:00:00.000Z",
        updatedAt: "2026-10-25T00:00:00.000Z", version: 1, documents: [],
      });
      const manifest = { dossierId: approved.id, compositeManifestSha256: "first-seal", exportedAt: "2026-10-25T00:00:00.000Z" } as unknown as DossierExportManifest;
      const sealed: ContainerDossier = repo.sealExport({ ...approved, lifecycleState: "EXPORTED", isImmutable: true }, manifest, MANAGER_ACTOR, approved.version);
      expect(sealed.lifecycleState).toBe("EXPORTED");

      expect(() => repo.sealExport(sealed, { ...manifest, compositeManifestSha256: "second-seal" }, MANAGER_ACTOR, sealed.version))
        .toThrow("already exists and cannot be replaced");

      const row = client.db.query<{ state: string; count: number }, []>(
        `SELECT lifecycle_state as state, (SELECT COUNT(*) FROM export_manifests WHERE dossier_id = 'DOS-ATOMIC-REPO') as count FROM container_dossiers WHERE id = 'DOS-ATOMIC-REPO'`
      ).get();
      expect(row?.state).toBe("EXPORTED");
      expect(row?.count).toBe(1);
    } finally {
      client.close();
    }
  });
});
