import { describe, expect, it } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import { SqliteDossierRepository } from "../src/storage/sqlite-dossier-repository.js";
import { SqliteAuditLedger } from "../src/storage/sqlite-audit-ledger.js";
import { FileStorageService } from "../src/storage/file-storage-service.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../src/domain/types.js";
const TEST_DB_PATH = "./data/test_restart.db";
const TEST_STORAGE_DIR = "./data/test_uploads";
const CLERK: AuthenticatedActor = {
  id: "ACT-CLERK-1", name: "Nguyen Van A", role: "CLERK",
  tenantId: "TENANT-VN-001", tenantType: "PACKHOUSE_EXPORTER", persona: "PACKHOUSE_CLERK",
};
function cleanup(): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    if (existsSync(`${TEST_DB_PATH}${suffix}`)) rmSync(`${TEST_DB_PATH}${suffix}`);
  }
  if (existsSync(TEST_STORAGE_DIR)) rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
}
describe("Phase A: Persistence and Restart", () => {
  it("persists dossier, document, HITL verification, and audit across client reopen", () => {
    cleanup();
    const fileStorage = new FileStorageService(TEST_STORAGE_DIR);
    let client = new SqliteClient({ dbPath: TEST_DB_PATH });
    let repo = new SqliteDossierRepository(client);
    let ledger = new SqliteAuditLedger(client);
    let workspace = new ContainerDossierWorkspace(repo, ledger);
    const dossier = workspace.createDossier({
      dossierCode: "DOS-RESTART-001", containerNumber: "MSKU1234565", sealNumber: "VN-SEAL-8899",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
    }, CLERK);
    const samplePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
    const { storagePath, sha256 } = fileStorage.storeFile(samplePdfBytes, "test_phytosanitary.pdf", "DOC-01");
    expect(sha256 && storagePath === `storage/blobs/${sha256}.bin`).toBe(true);
    expect(existsSync(fileStorage.resolveSafePath(storagePath))).toBe(true);
    const { document } = workspace.uploadDocument(
      dossier.id, samplePdfBytes, "test_phytosanitary.pdf", "PHYTOSANITARY_CERTIFICATE", CLERK,
      {
        phytosanitary_cert_number: { raw: "VN-PHYTO-2026-99" },
        target_market: { raw: "CN" },
        treatment_temperature_c: { raw: "14.5" },
      }
    );
    for (const f of document.extractedFields) {
      workspace.verifyField(dossier.id, document.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
    expect(workspace.runValidation(dossier.id, CLERK).status).toBe("BLOCKED");
    client.close();
    client = new SqliteClient({ dbPath: TEST_DB_PATH });
    repo = new SqliteDossierRepository(client);
    ledger = new SqliteAuditLedger(client);
    workspace = new ContainerDossierWorkspace(repo, ledger);
    const reloadedDossier = workspace.getDossier(dossier.id, CLERK);
    expect(reloadedDossier?.dossierCode === "DOS-RESTART-001" && reloadedDossier?.containerNumber === "MSKU1234565").toBe(true);
    expect(reloadedDossier?.documents.length).toBe(1);
    const reloadedDoc = reloadedDossier?.documents[0];
    expect(reloadedDoc?.documentType === "PHYTOSANITARY_CERTIFICATE" && reloadedDoc?.extractedFields.length === 3).toBe(true);
    expect(reloadedDoc?.extractedFields.every((f) => f.verificationStatus === "HUMAN_VERIFIED")).toBe(true);
    expect(reloadedDossier?.latestValidationResult?.status).toBe("BLOCKED");
    const events = ledger.getEventsForDossier(dossier.id, CLERK.tenantId);
    expect(events.length >= 4 && ledger.verifyIntegrity()).toBe(true);
    client.close();
    cleanup();
  });
  it("enforces path traversal prevention in FileStorageService", () => {
    cleanup();
    const fileStorage = new FileStorageService(TEST_STORAGE_DIR);
    expect(() => fileStorage.resolveSafePath("../../etc/passwd")).toThrow("Security violation: path traversal detected");
    expect(() => fileStorage.resolveSafePath("/etc/hosts")).toThrow("Security violation: path traversal detected");
    cleanup();
  });
  it("rolls back atomic SQLite transaction on error", () => {
    cleanup();
    const client = new SqliteClient({ dbPath: TEST_DB_PATH });
    expect(() => {
      client.transaction(() => {
        client.db.run(
          `INSERT INTO container_dossiers (
            id, tenant_id, dossier_code, container_number, seal_number,
            target_market, border_gate, target_temperature_c, lifecycle_state, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ["DOS-ROLLBACK-1", "TENANT-1", "DOS-TX", "MSKU1234565", "SEAL-1", "CN", "Gate", 14, "DRAFT", "now", "now"]
        );
        throw new Error("Simulated unexpected disk or validation error");
      });
    }).toThrow("Simulated unexpected disk or validation error");
    expect(client.db.query("SELECT * FROM container_dossiers WHERE id = 'DOS-ROLLBACK-1'").get()).toBeNull();
    client.close();
    cleanup();
  });
});
