import { describe, expect, it } from "bun:test";
import { verifyExportManifest } from "../src/export/standalone-manifest-verifier.js";
import { createSignedSaasLicenseKey, generateEphemeralSaasLicenseKeyPair } from "../src/saas/saas-tier-policy.js";
import { decryptCloudVaultBackupEnvelope, encryptBackupManifestForCloudVault } from "../src/saas/cloud-vault-backup-connector.js";
import { evaluateGaccRegistryWatch, issueCrossBorderBuyerVerificationRoom, type GaccCodeRegistryEntry } from "../src/saas/gacc-registry-watch-service.js";
import { anchorAuditLedgerHeadToCloud, verifyCloudLedgerAnchorReceipt } from "../src/saas/cloud-ledger-anchor.js";
import { getMarketCompliancePack } from "../src/rules/multi-market-pack-registry.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { SiteBackupManifest } from "../src/auth/site-backup-manager.js";
import type { AuthenticatedActor, DossierExportManifest } from "../src/domain/types.js";
const CLERK: AuthenticatedActor = { id: "usr-clerk-cloud-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK", name: "Cai Lay Clerk" };
const MANAGER: AuthenticatedActor = { id: "usr-mgr-cloud-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER", name: "Cai Lay Manager" };
const TEST_GACC_SNAPSHOT: ReadonlyMap<string, GaccCodeRegistryEntry> = new Map([
  ["VN-TG-ORCHARD-0042", { code: "VN-TG-ORCHARD-0042", codeType: "PUC", province: "Tiền Giang", status: "APPROVED_ACTIVE", updatedAt: "2026-10-01T00:00:00.000Z" }],
  ["VN-TG-PACK-0018", { code: "VN-TG-PACK-0018", codeType: "PHC", province: "Tiền Giang", status: "APPROVED_ACTIVE", updatedAt: "2026-10-01T00:00:00.000Z" }],
  ["VN-TG-ORCHARD-SUSPENDED-99", { code: "VN-TG-ORCHARD-SUSPENDED-99", codeType: "PUC", province: "Tiền Giang", status: "SUSPENDED_BY_GACC", updatedAt: "2026-10-15T00:00:00.000Z" }],
]);
function buildSealedWorkspaceAndManifest(): { ws: ContainerDossierWorkspace; dossierId: string; manifest: DossierExportManifest } {
  const ws = new ContainerDossierWorkspace();
  const created = ws.createDossier({
    dossierCode: "DOS-CLOUD-2026-01", containerNumber: "MSKU1234565", sealNumber: "SL-998822",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14, declaredNetWeightKg: 18240, declaredBoxCount: 960,
  }, CLERK);
  const d1 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x01]), "Packing.pdf", "PACKING_LIST", CLERK, {
    container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SL-998822" },
    net_weight_kg: { raw: "18240" }, total_boxes: { raw: "960" }, PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" },
  });
  const d2 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x02]), "Lab.pdf", "LAB_TEST_REPORT", CLERK, {
    cadmium_mg_kg: { raw: "0.015" }, sample_code: { raw: "LAB-01" }, sampling_date: { raw: "2026-10-12" },
  });
  const d3 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x03]), "Phyto.pdf", "PHYTOSANITARY_CERTIFICATE", CLERK, {
    phyto_cert_no: { raw: "VN-PHYTO-01" }, inspection_date: { raw: "2026-10-12" },
    PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" }, target_temperature_c: { raw: "14" },
  });
  for (const doc of [d1.document, d2.document, d3.document]) {
    for (const f of doc.extractedFields) {
      ws.verifyField(created.id, doc.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }
  ws.runValidation(created.id, MANAGER);
  ws.approveForExport(created.id, MANAGER);
  return { ws, dossierId: created.id, manifest: ws.exportDossier(created.id, MANAGER) };
}
describe("25-Step Open-Core & SaaS Cloud Connectors Suite", () => {
  const keyPair = generateEphemeralSaasLicenseKeyPair();
  const proKey = createSignedSaasLicenseKey({ tenantId: "ten-cailay-001", edition: "PACKHOUSE_PRO_SAAS", expiresAt: "2027-12-31T00:00:00.000Z" }, keyPair.privateKeyPem);
  const proEnv = {
    DURIOS_SAAS_LICENSE_KEY: proKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: keyPair.publicKeyPem, DURIOS_LEDGER_ANCHOR_SIGNING_KEY: "dummy_test_signing_key_for_unit_tests",
  };
  it("verifies sealed DossierExportManifest with MIT standalone verifier and rejects tampering or non-manifest JSON", () => {
    const { manifest } = buildSealedWorkspaceAndManifest();
    const validRes = verifyExportManifest(manifest);
    expect(validRes.valid && validRes.iso6346ContainerValid).toBe(true);
    expect(validRes.verificationSealBadge).toBe("DuriOS Local Manifest Hash Check Passed (MIT Verifier)");
    expect(validRes.publicVerificationUrl).toBeUndefined();
    expect(verifyExportManifest(manifest, "https://verify.example.org/m").publicVerificationUrl).toContain(manifest.compositeManifestSha256);
    expect(verifyExportManifest({ ...manifest, sealNumber: "SL-TAMPERED" }).valid).toBe(false);
    expect(verifyExportManifest({ packFormatVersion: "1.0.0", randomField: true }).valid).toBe(false);
  });
  it("encrypts and decrypts SiteBackupManifest with scrypt + AAD AES-256-GCM E2EE for Cloud Vault", () => {
    const sampleBackup: SiteBackupManifest = {
      manifestVersion: "1.0.0", createdAt: "2026-10-17T08:00:00.000Z",
      databaseSha256: "a".repeat(64), auditChainValid: true, dossierCount: 5, documentCount: 15,
      blobs: [{ relativePath: "DOC-1.bin", sha256: "b".repeat(64), sizeBytes: 1024 }],
    };
    expect(() => encryptBackupManifestForCloudVault("ten-cailay-001", sampleBackup, "ValidPassphrase#2026", {})).toThrow("requires an active PACKHOUSE_PRO_SAAS");
    const envelope = encryptBackupManifestForCloudVault("ten-cailay-001", sampleBackup, "ValidPassphrase#2026", proEnv);
    expect(envelope.algorithm === "AES-256-GCM" && envelope.kdf === "scrypt-sha256-v1").toBe(true);
    expect(envelope.payloadScope).toBe("MANIFEST_METADATA_ONLY_NOT_BLOBS");
    expect(decryptCloudVaultBackupEnvelope(envelope, "ValidPassphrase#2026", "ten-cailay-001")).toEqual(sampleBackup);
    expect(() => decryptCloudVaultBackupEnvelope(envelope, "WrongPassphrase#9999", "ten-cailay-001")).toThrow();
    expect(() => decryptCloudVaultBackupEnvelope(envelope, "ValidPassphrase#2026", "ten-other-999")).toThrow("tenant mismatch");
    expect(() => decryptCloudVaultBackupEnvelope({ ...envelope, aadContext: "ten-other-999|1.0.0|bad" }, "ValidPassphrase#2026")).toThrow();
  });
  it("evaluates GACC PUC/PHC watch with explicit snapshot, buyer rooms with explicit portalBaseUrl, and statutory market packs", () => {
    const { manifest } = buildSealedWorkspaceAndManifest();
    expect(() => evaluateGaccRegistryWatch("VN-TG-ORCHARD-0042", "VN-TG-PACK-0018", proEnv)).toThrow("GACC registry snapshot feed is required");
    expect(evaluateGaccRegistryWatch("VN-TG-ORCHARD-0042", "VN-TG-PACK-0018", proEnv, TEST_GACC_SNAPSHOT, "ten-cailay-001").allActive).toBe(true);
    const suspendedWatch = evaluateGaccRegistryWatch("VN-TG-ORCHARD-SUSPENDED-99", "VN-TG-PACK-0018", proEnv, TEST_GACC_SNAPSHOT, "ten-cailay-001");
    expect(suspendedWatch.allActive === false && suspendedWatch.alertsVi[0]!.includes("SUSPENDED_BY_GACC")).toBe(true);
    expect(() => issueCrossBorderBuyerVerificationRoom(manifest, "SHR-CAILAY-001", "2027-11-01T00:00:00.000Z", proEnv)).toThrow("Explicit buyer portal base URL");
    const room = issueCrossBorderBuyerVerificationRoom(manifest, "SHR-CAILAY-001", "2027-11-01T00:00:00.000Z", proEnv, "https://portal.example.org");
    expect(room.supportedLocales).toEqual(["vi-VN", "zh-CN", "en-US"]);
    expect(room.portalUrl).toContain("https://portal.example.org/rooms/");
    expect(getMarketCompliancePack("CN", {}).cadmiumInternalActionThresholdMgKg).toBe(0.04);
    expect(() => getMarketCompliancePack("JP", proEnv, "ten-cailay-001")).toThrow("not yet statutory-verified");
  });
  it("anchors AuditLedger head eventHash with local HMAC key and fails closed without signing key", () => {
    const { ws, dossierId } = buildSealedWorkspaceAndManifest();
    const events = ws.auditLedger.getEventsForDossier(dossierId, MANAGER.tenantId);
    expect(() =>
      anchorAuditLedgerHeadToCloud(MANAGER.tenantId, dossierId, events, { DURIOS_SAAS_LICENSE_KEY: proKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: keyPair.publicKeyPem })
    ).toThrow("Explicit DURIOS_LEDGER_ANCHOR_SIGNING_KEY");
    const receipt = anchorAuditLedgerHeadToCloud(MANAGER.tenantId, dossierId, events, proEnv, "2026-10-17T09:00:00.000Z");
    const headHash = events[events.length - 1]!.eventHash;
    expect(verifyCloudLedgerAnchorReceipt(receipt, headHash, proEnv)).toBe(true);
    expect(verifyCloudLedgerAnchorReceipt(receipt, "0".repeat(64), proEnv)).toBe(false);
  });
});
