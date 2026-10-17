import { expect } from "bun:test";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AuthenticatedActor } from "../../src/domain/types.js";
import type { FileStorageService } from "../../src/storage/file-storage-service.js";
import type { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import type { SqliteDossierRepository } from "../../src/storage/sqlite-dossier-repository.js";
import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";

export const CLERK: AuthenticatedActor = {
  id: "USR-CLERK",
  name: "Documentation Clerk",
  role: "CLERK",
  tenantId: "TENANT-VN-01",
  tenantType: "PACKHOUSE_EXPORTER",
  persona: "PACKHOUSE_CLERK",
};

export const MANAGER: AuthenticatedActor = {
  id: "USR-MGR",
  name: "Packhouse Manager",
  role: "MANAGER",
  tenantId: "TENANT-VN-01",
  tenantType: "PACKHOUSE_EXPORTER",
  persona: "PACKHOUSE_MANAGER",
};

export function makePdf(tag: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.5 Synthetic unique PDF [${tag}] - ${Math.random()}`);
}

export function runFailedSaveCleanupScenario(
  workspace: ContainerDossierWorkspace,
  repo: SqliteDossierRepository,
  ledger: SqliteAuditLedger,
  storage: FileStorageService,
  dataDir: string
): void {
  const unrelatedFile = join(dataDir, "unrelated-existing-doc.pdf");
  writeFileSync(unrelatedFile, "unrelated content");
  expect(existsSync(unrelatedFile)).toBe(true);

  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-CONSISTENCY-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-CONS-1",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  const brokenRepo: SqliteDossierRepository = Object.create(repo);
  brokenRepo.save = () => {
    throw new Error("Simulated SQLite write constraint failure");
  };

  const brokenWorkspace = new ContainerDossierWorkspace(brokenRepo, ledger, storage);

  expect(() => {
    brokenWorkspace.uploadDocument(
      dossier.id,
      makePdf("fail-test"),
      "test-upload-fail.pdf",
      "PACKING_LIST",
      CLERK
    );
  }).toThrow("Simulated SQLite write constraint failure");

  const files = readdirSync(dataDir);
  expect(files).toContain("unrelated-existing-doc.pdf");
  expect(files.length).toBe(1);
}

export function runSafePathAndTraversalScenario(
  storage: FileStorageService,
  dataDir: string
): void {
  expect(() => {
    storage.resolveSafePath("../../../../etc/passwd");
  }).toThrow(/path traversal/);

  const stored = storage.storeFile(
    makePdf("traversal-safe"),
    "../../../../etc/passwd.pdf",
    "DOC-TRAVERSAL-01"
  );
  expect(stored.storagePath).toBe(`storage/blobs/${stored.sha256}.bin`);
  expect(stored.storagePath.includes("..")).toBe(false);
  const physicalPath = storage.resolveSafePath(stored.storagePath);
  expect(physicalPath.startsWith(dataDir)).toBe(true);
  expect(existsSync(physicalPath)).toBe(true);
}

export function runOversizedUploadRejectionScenario(workspace: ContainerDossierWorkspace): void {
  const overLimitBuffer = new Uint8Array(26 * 1024 * 1024);
  overLimitBuffer[0] = 0x25;
  overLimitBuffer[1] = 0x50;
  overLimitBuffer[2] = 0x44;
  overLimitBuffer[3] = 0x46;

  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-OVERSIZED",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-OS-01",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  expect(() => {
    workspace.uploadDocument(
      dossier.id,
      overLimitBuffer,
      "huge.pdf",
      "PACKING_LIST",
      CLERK
    );
  }).toThrow(/exceeds 25MB statutory limit/);
}
