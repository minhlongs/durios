import { expect } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculateSha256 } from "../../src/ingestion/document-hasher.js";
import { FileStorageService } from "../../src/storage/file-storage-service.js";
import { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../../src/storage/sqlite-client.js";
import { SqliteDossierRepository } from "../../src/storage/sqlite-dossier-repository.js";
import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  createPdfBytes, seedAndMakeActor, type Redaction5A5Context,
} from "./redaction-and-blobs-5a5-fixtures.js";
export function runContentAddressedBlobStorageScenario(ctx: Redaction5A5Context): void {
  let { dbPath, dataDir, client, workspace } = ctx;
  const clerk = seedAndMakeActor(workspace, "TENANT-BLOB-01", "CLERK");
  const dossier = workspace.createDossier({
    dossierCode: "DOS-BLOB-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-BLOB-01",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, clerk.actor);
  const pdfBytes = createPdfBytes("content-addressed-blob-01");
  const expectedSha = calculateSha256(pdfBytes);
  const expectedRelativePath = `storage/blobs/${expectedSha}.bin`;
  const expectedPhysicalPath = join(dataDir, "storage", "blobs", `${expectedSha}.bin`);
  const { document } = workspace.uploadDocument(
    dossier.id, pdfBytes, "phyto_cert.pdf", "PHYTOSANITARY_CERTIFICATE", clerk.actor
  );
  expect(document.sha256Hash === expectedSha && document.storagePath === expectedRelativePath && existsSync(expectedPhysicalPath)).toBe(true);
  expect(calculateSha256(new Uint8Array(readFileSync(expectedPhysicalPath)))).toBe(expectedSha);
  const dbRow = client.db
    .query<{ storage_path: string; sha256_hash: string }, [string]>("SELECT storage_path, sha256_hash FROM documents WHERE id = ?")
    .get(document.id);
  expect(dbRow?.storage_path === expectedRelativePath && dbRow?.sha256_hash === expectedSha).toBe(true);
  const auditEvents = workspace.auditLedger.getEventsForDossier(dossier.id, clerk.actor.tenantId);
  expect(JSON.stringify(auditEvents)).not.toContain("storage/blobs/");
  expect(JSON.stringify(auditEvents)).not.toContain("storagePath");
  client.close();
  client = new SqliteClient({ dbPath });
  const repo = new SqliteDossierRepository(client);
  const ledger = new SqliteAuditLedger(client);
  const fileStorage = new FileStorageService(dataDir);
  workspace = new ContainerDossierWorkspace(repo, ledger, fileStorage);
  const reloaded = workspace.getDossier(dossier.id, clerk.actor);
  expect(reloaded?.documents[0]?.storagePath === expectedRelativePath && existsSync(expectedPhysicalPath)).toBe(true);
  Object.assign(ctx, { client, repo, ledger, fileStorage, workspace });
}
export function runBlobDeduplicationAndRollbackScenario(ctx: Redaction5A5Context): void {
  const { dataDir, repo, ledger, fileStorage, workspace } = ctx;
  const clerk = seedAndMakeActor(workspace, "TENANT-DEDUP-01", "CLERK");
  const d1 = workspace.createDossier({
    dossierCode: "DOS-DEDUP-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-DEDUP-01",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, clerk.actor);
  const d2 = workspace.createDossier({
    dossierCode: "DOS-DEDUP-002", containerNumber: "MSKU1234565", sealNumber: "SEAL-DEDUP-02",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, clerk.actor);
  const sharedPdf = createPdfBytes("shared-across-dossiers");
  const expectedSha = calculateSha256(sharedPdf);
  const expectedPhysicalPath = join(dataDir, "storage", "blobs", `${expectedSha}.bin`);
  workspace.uploadDocument(d1.id, sharedPdf, "packing_1.pdf", "PACKING_LIST", clerk.actor);
  expect(existsSync(expectedPhysicalPath)).toBe(true);
  const reused = fileStorage.storeFile(sharedPdf, "packing_reuse.pdf", "DOC-REUSE");
  expect(!reused.createdNew && reused.storagePath === `storage/blobs/${expectedSha}.bin`).toBe(true);
  const failingRepo: SqliteDossierRepository = Object.create(repo);
  failingRepo.save = () => { throw new Error("Simulated DB failure on second dossier"); };
  const failingWs = new ContainerDossierWorkspace(failingRepo, ledger, fileStorage);
  expect(() => failingWs.uploadDocument(d2.id, sharedPdf, "packing_2.pdf", "PACKING_LIST", clerk.actor)).toThrow("Simulated DB failure on second dossier");
  expect(existsSync(expectedPhysicalPath) && calculateSha256(new Uint8Array(readFileSync(expectedPhysicalPath))) === expectedSha).toBe(true);
  const uniquePdf = createPdfBytes("brand-new-unreferenced-blob");
  const uniqueSha = calculateSha256(uniquePdf);
  const uniquePhysicalPath = join(dataDir, "storage", "blobs", `${uniqueSha}.bin`);
  expect(() => failingWs.uploadDocument(d2.id, uniquePdf, "unique_fail.pdf", "PACKING_LIST", clerk.actor)).toThrow("Simulated DB failure on second dossier");
  expect(existsSync(uniquePhysicalPath)).toBe(false);
  const tamperPdf = createPdfBytes("tamper-target-content");
  const tamperSha = calculateSha256(tamperPdf);
  const tamperPhysicalPath = join(dataDir, "storage", "blobs", `${tamperSha}.bin`);
  writeFileSync(tamperPhysicalPath, "corrupted bytes not matching sha256");
  expect(() => fileStorage.storeFile(tamperPdf, "tamper.pdf", "DOC-TAMPER")).toThrow(/Integrity violation/);
  expect(readFileSync(tamperPhysicalPath, "utf8")).toBe("corrupted bytes not matching sha256");
}
export function runBlobPathTraversalProtectionScenario(ctx: Redaction5A5Context): void {
  const { dataDir, fileStorage } = ctx;
  for (const unsafePath of ["../outside.bin", "../../etc/passwd", "/etc/passwd", "", "."]) {
    expect(() => fileStorage.resolveSafePath(unsafePath)).toThrow(/path traversal/);
  }
  mkdirSync(`${dataDir}-sibling`, { recursive: true });
  expect(() => fileStorage.resolveSafePath("../uploads-sibling/secret.bin")).toThrow(/path traversal/);
  expect(() => fileStorage.resolveSafePath("../uploads_evil/secret.bin")).toThrow(/path traversal/);
}
