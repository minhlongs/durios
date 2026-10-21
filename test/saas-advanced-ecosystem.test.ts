import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSignedSaasLicenseKey, generateEphemeralSaasLicenseKeyPair } from "../src/saas/saas-tier-policy.js";
import { ManagedSaasZnsAlertRelay } from "../src/saas/managed-zns-alert-relay.js";
import { PartnerLabWebhookIngestor, signPartnerWebhookPayload } from "../src/saas/partner-webhook-ingestor.js";
import { HybridEdgeSyncQueue } from "../src/saas/hybrid-edge-sync-queue.js";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import { getMarketCompliancePack, listAllMarketCompliancePacks } from "../src/rules/multi-market-pack-registry.js";
import type { DossierExportManifest } from "../src/domain/types.js";
describe("25-Step Open-Core Ecosystem: ZNS Relay, Partner Webhooks, Hybrid Edge Sync & Multi-Market Packs", () => {
  const { publicKeyPem, privateKeyPem } = generateEphemeralSaasLicenseKeyPair();
  const proKey = createSignedSaasLicenseKey(
    { tenantId: "ten-cailay-001", edition: "PACKHOUSE_PRO_SAAS", expiresAt: "2027-12-31T00:00:00.000Z" },
    privateKeyPem
  );
  const proEnv = { DURIOS_SAAS_LICENSE_KEY: proKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: publicKeyPem };
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  it("Step 7: fails closed when ZNS transport is unconfigured and dispatches with quota tracking when configured", () => {
    const unconfiguredRelay = new ManagedSaasZnsAlertRelay();
    expect(unconfiguredRelay.getQuotaLimit({}) === 0 && unconfiguredRelay.getQuotaLimit(proEnv, "ten-cailay-001") === 500).toBe(true);
    expect(unconfiguredRelay.getQuotaLimit(proEnv, "ten-other-999")).toBe(0);
    const req = {
      tenantId: "ten-cailay-001", dossierCode: "DOS-ZNS-01", containerNumber: "MSKU1234565",
      recipientPhoneE164: "+84909123456", templateType: "VALIDATION_BLOCKED_ALERT" as const,
      summaryVi: "Container MSKU1234565 bị chặn do sai lệch số chì.",
    };
    expect(() => unconfiguredRelay.dispatchAlert(req, proEnv, "2026-10-17T10:00:00.000Z")).toThrow("Managed Zalo ZNS transport is not configured (fail-closed).");
    expect(unconfiguredRelay.getDispatchedCount("ten-cailay-001")).toBe(0);
    const relay = new ManagedSaasZnsAlertRelay(() => ({
      providerMessageId: "ZALO-MSG-2026-001", deliveredAt: "2026-10-17T10:00:01.000Z",
    }));
    const receipt = relay.dispatchAlert(req, proEnv, "2026-10-17T10:00:00.000Z");
    expect(receipt.delivered && receipt.providerMessageId === "ZALO-MSG-2026-001" && receipt.remainingMonthlyQuota === 499).toBe(true);
    expect(relay.getDispatchedCount("ten-cailay-001")).toBe(1);
  });
  it("Step 15: verifies Partner HMAC before replay lookup, rejects conflicting payloads, and emits DRAFT fields", () => {
    const ingestor = new PartnerLabWebhookIngestor();
    const secret = "lab-vina-shared-secret-2026";
    const unsigned = {
      webhookId: "WH-LAB-001", idempotencyKey: "IDEM-LAB-001", partnerCode: "VINACERT-LAB-TG",
      partnerType: "ACCREDITED_CADMIUM_LAB" as const, tenantId: "ten-cailay-001",
      dossierId: "DOS-01", documentId: "DOC-LAB-01", documentType: "LAB_TEST_REPORT" as const,
      reportedFields: { cadmium_mg_kg: 0.014, sample_code: "VC-2026-88" },
      issuedAt: "2026-10-17T10:05:00.000Z",
    };
    const signatureSha256 = signPartnerWebhookPayload(unsigned, secret);
    const first = ingestor.ingestWebhook({ ...unsigned, signatureSha256 }, secret, proEnv);
    expect(!first.duplicateIgnored && first.candidateFields.length === 2 && first.candidateFields.every((f) => f.verificationStatus === "DRAFT")).toBe(true);
    expect(() => ingestor.ingestWebhook({ ...unsigned, signatureSha256: "0".repeat(64) }, secret, proEnv)).toThrow("Partner webhook signature verification failed");
    expect(ingestor.ingestWebhook({ ...unsigned, signatureSha256 }, secret, proEnv).duplicateIgnored).toBe(true);
    const conflicting = { ...unsigned, reportedFields: { cadmium_mg_kg: 0.085, sample_code: "VC-2026-88" } };
    const conflictingSig = signPartnerWebhookPayload(conflicting, secret);
    expect(() => ingestor.ingestWebhook({ ...conflicting, signatureSha256: conflictingSig }, secret, proEnv)).toThrow("Conflicting webhook payload");
  });
  it("Step 18: persists offline queue in SQLite across restarts and fails closed without transport", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-edge-sync-"));
    tempDirs.push(rootDir);
    const dbPath = join(rootDir, "edge-sync.db");
    const sampleManifest: DossierExportManifest = {
      manifestVersion: "1.0.0", dossierId: "DOS-EDGE-01", dossierCode: "CAILAY-EDGE-01",
      tenantId: "ten-cailay-001", exportedAt: "2026-10-17T02:00:00.000Z", exportedBy: "Manager",
      lifecycleState: "EXPORTED", isImmutable: true, containerNumber: "MSKU1234565", sealNumber: "SL-998822",
      documents: [], verifiedDataSummary: {}, complianceFindingsCount: { criticalBlockers: 0, advisoryWarnings: 0 },
      compositeManifestSha256: "f".repeat(64), regulatoryDisclaimers: ["Disclaimer"],
    };
    const client1 = new SqliteClient({ dbPath });
    const queue1 = new HybridEdgeSyncQueue({ sqliteClient: client1 });
    expect(queue1.enqueueOfflineSealedManifest(sampleManifest, "2026-10-17T02:01:00.000Z").status).toBe("PENDING_OFFLINE");
    client1.close();
    const client2 = new SqliteClient({ dbPath });
    try {
      const queue2 = new HybridEdgeSyncQueue({ sqliteClient: client2 });
      expect(queue2.listPendingItems("ten-cailay-001")).toHaveLength(1);
      expect(() => queue2.flushPendingToCloud("ten-cailay-001", proEnv, "2026-10-17T06:00:00.000Z")).toThrow("Edge sync transport is not configured; items remain in PENDING_OFFLINE.");
      const flushed = queue2.flushPendingToCloud(
        "ten-cailay-001", proEnv, "2026-10-17T06:00:00.000Z", () => ({ ackReceiptHash: "e".repeat(64) })
      );
      expect(flushed[0]?.status === "SYNCED_TO_CLOUD" && flushed[0]?.cloudAckReceiptHash === "e".repeat(64)).toBe(true);
      expect(queue2.listPendingItems("ten-cailay-001")).toHaveLength(0);
    } finally {
      client2.close();
    }
  });
  it("Step 21: serves CN market pack free in Community Edition and fails closed on unverified JP/KR/EU packs", () => {
    expect(listAllMarketCompliancePacks()).toHaveLength(4);
    expect(getMarketCompliancePack("CN", {}).editionRequired).toBe("COMMUNITY_OPEN_CORE");
    for (const m of ["JP", "KR", "EU"] as const) expect(() => getMarketCompliancePack(m, proEnv)).toThrow();
  });
});
