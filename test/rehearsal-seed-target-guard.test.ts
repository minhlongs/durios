import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { assertTargetIsRehearsalData, resolveRehearsalSeedTarget, RehearsalSeedTargetError } from "../src/auth/rehearsal-seed-target-guard.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";
import { SYNTHETIC_EXTRACTION_ENV_FLAG } from "../src/extraction/synthetic-extraction-mode.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { makeMultiTenantActor } from "./helpers/multi-tenant-pilot-scenarios.js";

describe("Rehearsal seeder needs a declared destination and refuses foreign data", () => {
  const dirs: string[] = [];
  const tempDir = (): string => { const d = mkdtempSync(join(tmpdir(), "seed-guard-")); dirs.push(d); return d; };
  let savedDbPath: string | undefined;
  let savedSynthetic: string | undefined;

  beforeEach(() => {
    savedDbPath = process.env.DURIOS_DB_PATH;
    savedSynthetic = process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
    delete process.env.DURIOS_DB_PATH;
  });
  afterEach(() => {
    if (savedDbPath === undefined) delete process.env.DURIOS_DB_PATH; else process.env.DURIOS_DB_PATH = savedDbPath;
    if (savedSynthetic === undefined) delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; else process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = savedSynthetic;
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it("refuses to pick a database for itself instead of defaulting to ./data/durios.db", () => {
    expect(() => resolveRehearsalSeedTarget({}, {})).toThrow(RehearsalSeedTargetError);
    expect(() => seedGate05PilotRehearsal()).toThrow(/refuses to pick a database/);
  });

  it("explains why: published credentials must not land in an operational database", () => {
    try {
      resolveRehearsalSeedTarget({}, {});
      throw new Error("expected a refusal");
    } catch (err) {
      const text = (err as RehearsalSeedTargetError).message;
      expect(text).toContain("published");
      expect(text).toContain("clerk.cailay");
      expect(text).toContain("DURIOS_DB_PATH");
      expect((err as RehearsalSeedTargetError).code).toBe("REHEARSAL_SEED_TARGET_REFUSED");
    }
  });

  it("derives the blob directory next to the declared database when it is not given", () => {
    const target = resolveRehearsalSeedTarget({ dbPath: "/tmp/rehearsal/durios.db" }, {});
    expect(target.dataDir).toBe("/tmp/rehearsal/uploads");
    const fromEnv = resolveRehearsalSeedTarget({}, { DURIOS_DB_PATH: "/tmp/env/durios.db", DURIOS_DATA_DIR: "/tmp/env/blobs" });
    expect(fromEnv).toEqual({ dbPath: "/tmp/env/durios.db", dataDir: "/tmp/env/blobs" });
  });

  it("refuses a SQLite file that is not a DuriOS database", () => {
    const dbPath = join(tempDir(), "unrelated.db");
    const db = new Database(dbPath);
    db.run("CREATE TABLE invoices (id TEXT PRIMARY KEY)");
    db.close();
    expect(() => assertTargetIsRehearsalData(dbPath)).toThrow(/not a rehearsal target/);
  });

  it("refuses a database holding a dossier this seeder did not create", () => {
    const root = tempDir();
    const dbPath = join(root, "durios.db");
    const app = createWorkspaceApp({ dbPath, dataDir: join(root, "uploads") });
    try {
      app.workspace.createDossier({
        dossierCode: "DOS-CUSTOMER-REAL-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-REAL-1",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14, declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }, makeMultiTenantActor("TENANT-REAL", "MANAGER"));
    } finally {
      app.sqliteClient.close();
    }
    expect(() => assertTargetIsRehearsalData(dbPath)).toThrow(/may hold operational or customer data/);
    expect(() => seedGate05PilotRehearsal({ dbPath, dataDir: join(root, "uploads") })).toThrow(RehearsalSeedTargetError);
  });

  it("accepts its own rehearsal database and declares synthetic extraction while seeding", () => {
    const root = tempDir();
    const dbPath = join(root, "durios.db");
    delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
    const seeded = seedGate05PilotRehearsal({ dbPath, dataDir: join(root, "uploads") });
    expect(seeded.dossiers).toHaveLength(5);
    expect(seeded.dossiers.every((d) => d.dossierCode.startsWith("DOS-CAILAY-R"))).toBe(true);
    expect(process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]).toBe("true");
    // Re-running the guard on a database this seeder produced is allowed.
    expect(() => assertTargetIsRehearsalData(dbPath)).not.toThrow();
    const app = createWorkspaceApp({ dbPath, dataDir: join(root, "uploads") });
    try {
      const fields = app.workspace.getRawDossier(seeded.dossiers[0]!.id)?.documents.flatMap((d) => d.extractedFields) ?? [];
      expect(fields.length).toBeGreaterThan(0);
    } finally {
      app.sqliteClient.close();
    }
  });
});
