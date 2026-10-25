import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileExportManifest } from "../src/export/manifest-compiler.js";
import {
  compileFieldProofKitBundle,
  verifyFieldProofKitBundle,
  type FieldProofKitBundle,
} from "../src/export/field-proof-kit-compiler.js";
import { runFieldProofKitCli } from "../src/export/field-proof-kit-cli.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../src/domain/types.js";

function buildExportedDossierManifest(idx: number): DossierExportManifest {
  const dossier: ContainerDossier = {
    id: `dos-exp-${idx}`, dossierCode: `DOS-CAILAY-EXP-0${idx}`, tenantId: "TENANT-CAILAY-01",
    containerNumber: "CSQU3054383", sealNumber: `SEAL-EXP-0${idx}`, targetMarket: "CN_GACC",
    borderGate: "HUU_NGHI", targetTemperatureC: 13.5, declaredNetWeightKg: 18500,
    declaredBoxCount: 1850, lifecycleState: "EXPORTED", isImmutable: true,
    createdAt: "2026-10-25T08:00:00.000Z", updatedAt: "2026-10-25T08:02:30.000Z", version: 4,
    documents: [{
      id: `doc-exp-${idx}`, dossierId: `dos-exp-${idx}`, tenantId: "TENANT-CAILAY-01",
      documentType: "PACKING_LIST", fileName: `packing-${idx}.pdf`, mimeType: "application/pdf",
      fileSize: 2048, sha256Hash: "b".repeat(64), storagePath: `/tmp/packing-${idx}.pdf`,
      uploadedAt: "2026-10-25T08:00:00.000Z", isSuperseded: false,
      extractedFields: [{
        id: `fld-${idx}`, documentId: `doc-exp-${idx}`, fieldKey: "net_weight_kg", label: "Net Weight",
        rawValue: "18500", normalizedValue: 18500, confirmedValue: 18500, confidenceScore: 0.99,
        boundingBox: { pageNumber: 1, x: 0, y: 0, width: 10, height: 10 },
        verificationStatus: "HUMAN_VERIFIED", verifiedBy: "actor-mgr", verifiedAt: "2026-10-25T08:01:00.000Z",
      }],
    }],
    latestValidationResult: {
      status: "PASSED", evaluatedAt: "2026-10-25T08:02:00.000Z",
      criticalBlockers: 0, advisoryWarnings: 0, evaluatedRulesCount: 4, findings: [],
    },
  };
  const actor: AuthenticatedActor = {
    id: "actor-mgr", name: "Cai Lay Quality Manager", role: "MANAGER",
    tenantId: "TENANT-CAILAY-01", tenantType: "PACKHOUSE_EXPORTER", persona: "PACKHOUSE_MANAGER",
  };
  return compileExportManifest(dossier, actor);
}

describe("Field Proof Kit Bundler & Cryptographic Verification", () => {
  const testDir = mkdtempSync(join(tmpdir(), "durios-proofkit-test-"));
  afterAll(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it("compiles, exports to disk, and verifies a Field Proof Kit bundle and detects tampering", () => {
    const manifests = [buildExportedDossierManifest(1), buildExportedDossierManifest(2)];
    const bundle = compileFieldProofKitBundle({
      siteCode: "SITE-CAILAY-TIENGIANG-01", tenantId: "TENANT-CAILAY-01",
      planCode: "PRO_ANNUAL_60M_VND", dbPath: join(testDir, "proofkit.db"),
      dataDir: join(testDir, "uploads"), manifestsOverride: manifests,
      forcedTimestamp: "2026-10-25T09:00:00.000Z",
    });

    const verified = verifyFieldProofKitBundle(bundle);
    expect(verified.valid).toBe(true);
    expect(verified.readinessValid).toBe(true);
    expect(verified.allManifestsValid).toBe(true);
    expect(bundle.commercialQuote.amountVnd).toBe(60_000_000);

    const cliOut = runFieldProofKitCli({
      outputDir: testDir, dbPath: join(testDir, "proofkit.db"),
      dataDir: join(testDir, "uploads"), manifestsOverride: manifests,
      forcedTimestamp: "2026-10-25T09:00:00.000Z",
    });
    expect(cliOut.exitCode).toBe(0);
    expect(cliOut.outputFilePath).toBeDefined();

    const verifyOut = runFieldProofKitCli({ verifyFilePath: cliOut.outputFilePath });
    expect(verifyOut.exitCode).toBe(0);
    expect(verifyOut.integrityVerified).toBe(true);

    const tampered: FieldProofKitBundle = {
      ...bundle,
      commercialQuote: { ...bundle.commercialQuote, amountVnd: 1_000 },
    };
    expect(verifyFieldProofKitBundle(tampered).valid).toBe(false);
  });
});
