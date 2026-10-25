import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { makeMultiTenantActor } from "./helpers/multi-tenant-pilot-scenarios.js";
import { StaleDossierVersionError } from "../src/domain/stale-dossier-version-error.js";
import { upsertDossierRows } from "../src/storage/sqlite-dossier-root-writer.js";

const TEST_DB = "./data/test-version-guard.db";
const TEST_UPLOADS = "./data/test-version-guard-uploads";

/** A valid PDF whose bytes differ per name, because identical content is deduplicated. */
function pdfBytes(name: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.5 synthetic ${name}\n%%EOF\n`);
}

function cleanUp(): void {
  for (const suffix of ["", "-wal", "-shm"]) if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
  if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
}

function openDossier(
  app: ReturnType<typeof createWorkspaceApp>,
  clerk: ReturnType<typeof makeMultiTenantActor>,
  code: string
) {
  return app.workspace.createDossier({
    dossierCode: code, containerNumber: "MSKU1234565", sealNumber: "SEAL-GUARD",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 12.0,
    declaredNetWeightKg: 19000, declaredBoxCount: 950,
  }, clerk);
}

/**
 * The repository checks the version and then writes, in two separate statements.
 * These tests call the write directly, so what refuses the stale save is the guarded
 * UPDATE in SQL rather than the check in front of it. If only the check were doing the
 * work, an await placed between the two statements would silently admit a write made
 * on top of someone else's edit — and the caller would be told a version nobody stored.
 */
describe("The version guard inside the guarded upsert", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    cleanUp();
  });

  it("refuses a write whose precondition no longer matches the stored row", () => {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    const clerk = makeMultiTenantActor("TENANT-LOCAL-001", "CLERK", "Clerk A");
    const created = openDossier(app, clerk, "DOS-GUARD-1");
    const held = app.workspace.getRawDossier(created.id)!;

    // Another operator's write moves the stored version forward. This operator still
    // holds the version it read before that write landed.
    app.workspace.uploadDocument(created.id, pdfBytes("Competing.pdf"), "Competing.pdf", "PACKING_LIST", clerk, undefined, held.version);
    const current = app.workspace.getRawDossier(created.id)!;
    expect(current.version).toBe(held.version + 1);

    // Written straight to the storage layer, bypassing the check that precedes it.
    const stale = { ...current, lifecycleState: "APPROVED_FOR_EXPORT" as const };
    expect(() => upsertDossierRows(app!.sqliteClient.db, stale, held.version)).toThrow(StaleDossierVersionError);

    // The refused save changed nothing: the state is what the winning write left.
    const afterRefusal = app.workspace.getRawDossier(created.id)!;
    expect(afterRefusal.lifecycleState).toBe(current.lifecycleState);
    expect(afterRefusal.version).toBe(current.version);
  });

  it("admits a write carrying the version the store currently holds", () => {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    const clerk = makeMultiTenantActor("TENANT-LOCAL-001", "CLERK", "Clerk A");
    const created = openDossier(app, clerk, "DOS-GUARD-3");
    const held = app.workspace.getRawDossier(created.id)!;

    upsertDossierRows(app!.sqliteClient.db, { ...held, lifecycleState: "APPROVED_FOR_EXPORT" }, held.version);

    const afterWrite = app.workspace.getRawDossier(created.id)!;
    expect(afterWrite.lifecycleState).toBe("APPROVED_FOR_EXPORT");
    expect(afterWrite.version).toBe(held.version + 1);
  });
});
