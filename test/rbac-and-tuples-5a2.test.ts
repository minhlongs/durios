import { afterEach, describe, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { runRbacMatrixCreateUploadShareVerifySteps } from "./helpers/rbac-and-tuples-5a2-matrix-part1.js";
import { runRbacMatrixOrganicApproveExportSealedSteps } from "./helpers/rbac-and-tuples-5a2-matrix-part2.js";
import { runIdentityTupleValidationScenario } from "./helpers/rbac-and-tuples-5a2-tuples.js";

const TEST_DB = "./data/test-rbac-5a2.db";
const TEST_UPLOADS = "./data/test-rbac-5a2-uploads";

describe("Prompt 5A-2: Identity Tuple Validation & Server/Domain RBAC Matrix (HTTP + SQLite)", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("accepts all ratified (ProductPersona, TenantType, UserRole) tuples and rejects invalid or legacy tuples (403) without fallback or session creation", async () => {
    await runIdentityTupleValidationScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });

  it("enforces complete 5-role Allow & Deny matrix across all operational and management endpoints over HTTP + SQLite with zero side effects on denied calls", async () => {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    const ctx = await runRbacMatrixCreateUploadShareVerifySteps(app);
    await runRbacMatrixOrganicApproveExportSealedSteps(ctx);
  });
});
