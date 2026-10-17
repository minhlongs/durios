import { afterEach, describe, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import type { createWorkspaceApp } from "../src/server/server.js";
import { runShareGrantsAndEvidencePersistenceScenario } from "./helpers/sqlite-sharing-5a3-http-persistence.js";
import { runAtomicRollbackAndScopingScenario } from "./helpers/sqlite-sharing-5a3-tx-rollback.js";
import { runV3ToV4SchemaUpgradeScenario } from "./helpers/sqlite-sharing-5a3-v4-upgrade.js";

const TEST_DB = "./data/test-sqlite-5a3.db";
const TEST_UPLOADS = "./data/test-sqlite-5a3-uploads";

describe("Prompt 5A-3: SQLite Persistence for Share Grants & Organic Evidence (HTTP + SQLite)", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("creates V4 schema on fresh DB and safely upgrades an existing V3 database while preserving all prior records", () => {
    runV3ToV4SchemaUpgradeScenario();
  });

  it("persists share grants, revocations, and organic evidence across SQLite restarts and enforces list/detail shared visibility, expiry, and multi-grant scope precedence", async () => {
    await runShareGrantsAndEvidencePersistenceScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });

  it("rolls back share_grants and organic_evidence atomically when a multi-step transaction fails and enforces SQLite CHECK constraints", () => {
    runAtomicRollbackAndScopingScenario();
  });
});
