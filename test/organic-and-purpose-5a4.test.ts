import { afterEach, describe, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { runV4ToV5MigrationScenario } from "./helpers/organic-5a4-v4-migration-scenario.js";
import { runOrganicStatusValidationScenario } from "./helpers/organic-5a4-validation-scenario.js";
import { runSharePurposeMatrixScenario } from "./helpers/organic-5a4-purpose-matrix-scenario.js";

const TEST_DB = "./data/test-organic-purpose-5a4.db";
const TEST_UPLOADS = "./data/test-organic-purpose-5a4-uploads";

describe("Prompt 5A-4: Two-Layer Organic Status, Validity Gate & SharePurpose Access Control (HTTP + SQLite)", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("upgrades V4 database with legacy organic_evidence.status to V5 (issuer_claimed_status + durios_record_status) while preserving all fields and disclaimers", () => {
    runV4ToV5MigrationScenario();
  });

  it("enforces two-layer organic status separation and rejects client-supplied duriosRecordStatus, EXPIRED, SUSPENDED, past validTo, and validTo == now with 422 and zero side effects", async () => {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    await runOrganicStatusValidationScenario(app);
  });

  it("enforces SharePurpose matrix on /audit and /organic-evidence, multi-grant purpose evaluation, owner-only audit event scoping, and zero empty-200 masking", async () => {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    await runSharePurposeMatrixScenario(app);
  });
});
