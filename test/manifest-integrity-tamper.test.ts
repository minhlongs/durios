import { afterEach, describe, expect, it } from "bun:test";
import { verifyExportManifest } from "../src/export/standalone-manifest-verifier.js";
import { computeManifestIntegritySha256 } from "../src/export/manifest-integrity.js";
import { buildTwoTenantSealedDossier, disposeSealedDossierFixtures } from "./helpers/two-tenant-sealed-dossier.js";
import { OVERRIDE_MANAGER, buildBlockedDossier } from "./helpers/blocked-dossier-fixture.js";
import type { DossierExportManifest } from "../src/domain/types.js";

async function sealedManifest(): Promise<DossierExportManifest> {
  const fx = await buildTwoTenantSealedDossier();
  const res = await fx.get(`/api/dossiers/${fx.dossierId}/manifest`, fx.owner);
  expect(res.status).toBe(200);
  return ((await res.json()) as { data: DossierExportManifest }).data;
}

describe("Whole-record manifest integrity hash (F-06)", () => {
  afterEach(() => { disposeSealedDossierFixtures(); });

  it("seals every field and verifies a manifest nobody touched", async () => {
    const manifest = await sealedManifest();
    expect(manifest.manifestIntegritySha256).toMatch(/^[a-f0-9]{64}$/);
    const result = verifyExportManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.integrityCoverage).toBe("FULL");
    expect(result.errors).toHaveLength(0);
  });

  it("detects edits to fields the composite hash never covered", async () => {
    const manifest = await sealedManifest();
    // Every one of these used to verify clean: compositeManifestSha256 covers only
    // identity, documents and verifiedDataSummary, so a holder could rewrite the
    // compliance outcome, the disclaimers or the provenance and keep a valid seal.
    const cases: ReadonlyArray<{ readonly label: string; readonly tampered: DossierExportManifest }> = [
      {
        label: "disclaimers replaced with a clearance claim",
        tampered: { ...manifest, regulatoryDisclaimers: ["This manifest IS an official GACC customs clearance approval."] },
      },
      { label: "exporter rewritten", tampered: { ...manifest, exportedBy: "Someone Else" } },
      { label: "export timestamp rewritten", tampered: { ...manifest, exportedAt: "2020-01-01T00:00:00.000Z" } },
    ];
    for (const testCase of cases) {
      const result = verifyExportManifest(testCase.tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("integrity SHA-256 mismatch"))).toBe(true);
    }
    // A blocker count that was already zero must not be reported as tampering.
    expect(verifyExportManifest({ ...manifest, complianceFindingsCount: manifest.complianceFindingsCount }).valid).toBe(true);
  });

  it("detects an override-sealed manifest whose blocker count was zeroed by hand", () => {
    // The exact edit that used to slip through: a lot exported past a signed cadmium
    // override still carries its blocker count, and rewriting that count to zero made
    // the manifest verify clean while the composite hash stayed untouched.
    const { ws, dossierId } = buildBlockedDossier();
    ws.overrideBlocker(dossierId, "Regression fixture: signed override for the integrity test", OVERRIDE_MANAGER);
    ws.approveForExport(dossierId, OVERRIDE_MANAGER);
    const manifest = ws.exportDossier(dossierId, OVERRIDE_MANAGER);
    expect(manifest.complianceFindingsCount.criticalBlockers).toBeGreaterThan(0);
    expect(verifyExportManifest(manifest).valid).toBe(false);

    const zeroed = { ...manifest, complianceFindingsCount: { criticalBlockers: 0, advisoryWarnings: 0 } };
    const result = verifyExportManifest(zeroed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("integrity SHA-256 mismatch"))).toBe(true);
    expect(result.zeroCriticalBlockers).toBe(true);
  });

  it("keeps the composite hash as the control for identity tampering", async () => {
    const manifest = await sealedManifest();
    const result = verifyExportManifest({ ...manifest, containerNumber: "MSKU0000000" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Composite SHA-256 mismatch"))).toBe(true);
  });

  it("verifies a legacy manifest without the field but reports partial coverage", async () => {
    const manifest = await sealedManifest();
    const legacy = { ...manifest, manifestIntegritySha256: undefined };
    const result = verifyExportManifest(legacy);
    expect(result.integrityCoverage).toBe("PARTIAL_LEGACY");
    // Not an error: manifests sealed before the field existed stay verifiable, but the
    // verifier says out loud that only the composite subset is protected.
    expect(result.valid).toBe(true);
  });

  it("hashes canonically, independent of key order and of its own field", () => {
    const nested = { b: { d: 3, c: 2 }, a: 1 };
    expect(computeManifestIntegritySha256(nested)).toBe(computeManifestIntegritySha256({ a: 1, b: { c: 2, d: 3 } }));
    expect(computeManifestIntegritySha256({ ...nested, manifestIntegritySha256: "f".repeat(64) }))
      .toBe(computeManifestIntegritySha256(nested));
  });
});
