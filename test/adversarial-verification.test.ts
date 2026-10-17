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
  runCadmiumRegulatorySafetyGateScenario,
  runSealedDossierProhibitsMutationsScenario,
  runValidationInvalidationOnFieldModifyScenario,
} from "./helpers/adversarial-verification-lifecycle-scenarios.js";
import {
  runActorSpoofingRejectionScenario,
  runAuditDeletionDetectionScenario,
  runAuditPayloadTamperDetectionScenario,
  runAuditTamperBlocksExportScenario,
  runClerkRoleApprovalGateScenario,
  runExportManifestIntegrityScenario,
  runLocalhostBindingAndMalformedRequestsScenario,
} from "./helpers/adversarial-verification-scenarios.js";
import {
  runFailedSaveCleanupScenario,
  runOversizedUploadRejectionScenario,
  runSafePathAndTraversalScenario,
} from "./helpers/adversarial-verification-storage-scenarios.js";

describe("Adversarial Verification Suite (Supreme Command #07)", () => {
  let tempDir: string;
  let dbPath: string;
  let dataDir: string;
  let client: SqliteClient;
  let repo: SqliteDossierRepository;
  let ledger: SqliteAuditLedger;
  let storage: FileStorageService;
  let workspace: ContainerDossierWorkspace;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "durios-adv-test-"));
    dbPath = join(tempDir, "durios.db");
    dataDir = join(tempDir, "uploads");
    client = new SqliteClient({ dbPath });
    repo = new SqliteDossierRepository(client);
    ledger = new SqliteAuditLedger(client);
    storage = new FileStorageService(dataDir);
    workspace = new ContainerDossierWorkspace(repo, ledger, storage);
  });

  afterEach(() => {
    try {
      client.close();
    } catch {
      // ignore
    }
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Section 2: Database and File Consistency", () => {
    it("cleans up newly created file when repository metadata save fails, preserving unrelated files", () => {
      runFailedSaveCleanupScenario(workspace, repo, ledger, storage, dataDir);
    });

    it("sanitizes unsafe filenames and prevents path traversal", () => {
      runSafePathAndTraversalScenario(storage, dataDir);
    });

    it("rejects oversized file uploads beyond configured limit (25MB)", () => {
      runOversizedUploadRejectionScenario(workspace);
    });
  });

  describe("Section 3: Validation Invalidation & Invariants", () => {
    it("invalidates previous passing validation and resets lifecycle when field is modified", () => {
      runValidationInvalidationOnFieldModifyScenario(workspace);
    });

    it("prohibits document uploads and field verification on sealed/exported dossiers", () => {
      runSealedDossierProhibitsMutationsScenario(workspace);
    });
  });

  describe("Section 4: Regulatory Safety Gate — Cadmium Rules", () => {
    it("handles regulatory uncertainty safely: GB 2762-2022 disabled, advisory warning labeled internal", () => {
      runCadmiumRegulatorySafetyGateScenario(workspace);
    });
  });

  describe("Section 5: Actor and Role Security Boundary", () => {
    it("rejects client-controlled headers and resolves role strictly from server-verified tokens", () => {
      runActorSpoofingRejectionScenario(workspace);
    });

    it("enforces server-side role gate: CLERK cannot approve dossier for export", () => {
      runClerkRoleApprovalGateScenario(workspace);
    });
  });

  describe("Section 6: Audit Hash-Chain Integrity & Tamper Detection", () => {
    it("detects payload modification in SQLite and fails integrity verification", () => {
      runAuditPayloadTamperDetectionScenario(workspace, client, ledger);
    });

    it("detects event deletion and breaks cryptographic chain", () => {
      runAuditDeletionDetectionScenario(workspace, client, ledger);
    });

    it("fails closed on export when audit tampering is detected", () => {
      runAuditTamperBlocksExportScenario(workspace, client);
    });
  });

  describe("Section 7: Export Integrity & Provenance", () => {
    it("generates manifest with exact SHA-256 hashes and legal disclaimers", () => {
      runExportManifestIntegrityScenario(workspace);
    });
  });

  describe("Section 8: API and Local Network Boundary", () => {
    it("binds to 127.0.0.1 by default and rejects malformed requests", async () => {
      await runLocalhostBindingAndMalformedRequestsScenario(dbPath, dataDir);
    });
  });
});
