import { afterEach, beforeEach, describe, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStorageService } from "../src/storage/file-storage-service.js";
import { SqliteAuditLedger } from "../src/storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import { SqliteDossierRepository } from "../src/storage/sqlite-dossier-repository.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import {
  runBlobDeduplicationAndRollbackScenario,
  runBlobPathTraversalProtectionScenario,
  runContentAddressedBlobStorageScenario,
  runLegacyBlobReconciliationScenario,
  runNestedCommercialRedactionScenario,
  runOwnerVsSharedRedactionScenario,
  type Redaction5A5Context,
} from "./helpers/redaction-and-blobs-5a5-scenarios.js";
import {
  runApiV1AliasRouteGroupsScenario,
  runApiVsApiV1StrictEquivalenceScenario,
} from "./helpers/api-v1-equivalence-5a5-scenarios.js";

describe("Prompt 5A-5: Commercial Redaction, Content-Addressed Blob Storage & /api/v1 Alias", () => {
  let ctx: Redaction5A5Context;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "durios-5a5-test-"));
    const dbPath = join(tempDir, "test-5a5.db");
    const dataDir = join(tempDir, "uploads");
    const client = new SqliteClient({ dbPath });
    const repo = new SqliteDossierRepository(client);
    const ledger = new SqliteAuditLedger(client);
    const storage = new FileStorageService(dataDir);
    const workspace = new ContainerDossierWorkspace(repo, ledger, storage);
    ctx = { tempDir, dbPath, dataDir, client, repo, ledger, fileStorage: storage, workspace };
  });

  afterEach(() => {
    try {
      ctx.client.close();
    } catch {
      // ignore if already closed
    }
    if (ctx?.tempDir && existsSync(ctx.tempDir)) {
      rmSync(ctx.tempDir, { recursive: true, force: true });
    }
  });

  it("gives owner full data while redacting commercial fields and storagePath for shared tenants according to SharePurpose across detail, list,upload/verify, and manifest", async () => {
    await runOwnerVsSharedRedactionScenario(ctx);
  });

  it("redacts nested commercial camelCase/snake_case properties without mutating stored dossier", async () => {
    await runNestedCommercialRedactionScenario();
  });

  it("stores physical blobs at ${dataDir}/storage/blobs/{sha256}.bin, records exact relative path in SQLite, hides storagePath on HTTP, and survives restart", () => {
    runContentAddressedBlobStorageScenario(ctx);
  });

  it("reuses identical existing blob without overwriting, refuses corrupted existing blob, and protects shared blobs when a duplicate upload DB save fails", () => {
    runBlobDeduplicationAndRollbackScenario(ctx);
  });

  it("blocks parent traversal, absolute paths, and sibling-prefix directory traversal", () => {
    runBlobPathTraversalProtectionScenario(ctx);
  });

  it("migrates legacy files only when deterministically found and hash-verified, reporting unmigrated items without fabricating paths", () => {
    runLegacyBlobReconciliationScenario(ctx);
  });

  it("supports /api/v1/... alias equivalently across all 7 approved route groups and rejects out-of-scope /api/v1 routes with 404", async () => {
    await runApiV1AliasRouteGroupsScenario(ctx);
  });

  it("proves strict side-by-side equivalence between /api and /api/v1 across all 7 route groups for allowed and denied requests of owner, shared tenant, and unauthorized actors", async () => {
    await runApiVsApiV1StrictEquivalenceScenario();
  });
});
