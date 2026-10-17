import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createSignedSaasLicenseKey,
  generateEphemeralSaasLicenseKeyPair,
  resolveSaasSubscriptionStatus,
} from "../src/saas/saas-tier-policy.js";
import { computeTenantUsageAndRoiReport } from "../src/saas/usage-metering-service.js";
import { CloudVisionOcrExtractorAdapter } from "../src/saas/cloud-ocr-extractor-adapter.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import type { AuthenticatedActor } from "../src/domain/types.js";

const MANAGER: AuthenticatedActor = {
  id: "usr-mgr-saas-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "MANAGER",
  persona: "PACKHOUSE_MANAGER",
  name: "Cai Lay Manager",
};

describe("Open-Core Public GitHub & SaaS Monetization Suite", () => {
  const tempDirs: string[] = [];
  const { publicKeyPem, privateKeyPem } = generateEphemeralSaasLicenseKeyPair();

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("defaults to COMMUNITY_OPEN_CORE with full local compliance & verifier access when no SaaS license is set", () => {
    const status = resolveSaasSubscriptionStatus({});
    expect(status.edition).toBe("COMMUNITY_OPEN_CORE");
    expect(status.licenseValid).toBe(false);
    expect(status.entitlements.localDeterministicCompliance).toBe(true);
    expect(status.entitlements.localDataAccessGuaranteed).toBe(true);
    expect(status.entitlements.cloudVisionOcr).toBe(false);
    expect(status.entitlements.managedZaloZnsRelay).toBe(false);
  });

  it("verifies Ed25519 license keys and fails closed on missing pubkey, invalid signature, tenant mismatch, and expiry", () => {
    const validProKey = createSignedSaasLicenseKey(
      { tenantId: "ten-cailay-001", edition: "PACKHOUSE_PRO_SAAS", expiresAt: "2027-01-01T00:00:00.000Z" },
      privateKeyPem
    );
    const proEnv = { DURIOS_SAAS_LICENSE_KEY: validProKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: publicKeyPem };

    const proStatus = resolveSaasSubscriptionStatus(proEnv, "2026-10-17T00:00:00.000Z", "ten-cailay-001");
    expect(proStatus.edition).toBe("PACKHOUSE_PRO_SAAS");
    expect(proStatus.licenseValid).toBe(true);
    expect(proStatus.entitlements.cloudVisionOcr).toBe(true);
    expect(proStatus.entitlements.crossBorderBuyerPortal).toBe(true);
    expect(proStatus.entitlements.multiSiteEnterpriseSync).toBe(false);

    const mismatch = resolveSaasSubscriptionStatus(proEnv, "2026-10-17T00:00:00.000Z", "ten-other-999");
    expect(mismatch.licenseValid).toBe(false);
    expect(mismatch.degradedToCommunityReason).toBe("TENANT_MISMATCH_GRACEFUL_DOWNGRADE");

    const missingPubKey = resolveSaasSubscriptionStatus(
      { DURIOS_SAAS_LICENSE_KEY: validProKey },
      "2026-10-17T00:00:00.000Z",
      "ten-cailay-001"
    );
    expect(missingPubKey.licenseValid).toBe(false);
    expect(missingPubKey.degradedToCommunityReason).toBe("MISSING_LICENSE_PUBLIC_KEY_GRACEFUL_DOWNGRADE");

    const otherKeyPair = generateEphemeralSaasLicenseKeyPair();
    const tampered = resolveSaasSubscriptionStatus(
      { DURIOS_SAAS_LICENSE_KEY: validProKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: otherKeyPair.publicKeyPem },
      "2026-10-17T00:00:00.000Z",
      "ten-cailay-001"
    );
    expect(tampered.licenseValid).toBe(false);
    expect(tampered.degradedToCommunityReason).toBe("INVALID_LICENSE_SIGNATURE_GRACEFUL_DOWNGRADE");

    const expiredStatus = resolveSaasSubscriptionStatus(proEnv, "2028-01-01T00:00:00.000Z", "ten-cailay-001");
    expect(expiredStatus.edition).toBe("COMMUNITY_OPEN_CORE");
    expect(expiredStatus.degradedToCommunityReason).toBe("EXPIRED_SUBSCRIPTION_GRACEFUL_DOWNGRADE");
    expect(expiredStatus.entitlements.localDataAccessGuaranteed).toBe(true);
  });

  it("gates CloudVisionOcrExtractorAdapter behind paid SaaS subscription while preserving mandatory DRAFT HITL status", () => {
    const proKey = createSignedSaasLicenseKey(
      { tenantId: "ten-cailay-001", edition: "PACKHOUSE_PRO_SAAS", expiresAt: "2027-06-01T00:00:00.000Z" },
      privateKeyPem
    );
    const ocrFixture = {
      cadmium_mg_kg: { raw: "0.012", confidence: 0.99 },
      sample_code: { raw: "LAB-VISION-99", confidence: 0.97 },
    };

    const communityAdapter = new CloudVisionOcrExtractorAdapter({
      env: {},
      simulatedCloudResponse: ocrFixture,
      ocrTransport: () => ocrFixture,
    } as ConstructorParameters<typeof CloudVisionOcrExtractorAdapter>[0]);
    expect(communityAdapter.isAvailable).toBe(false);

    const proAdapter = new CloudVisionOcrExtractorAdapter({
      env: { DURIOS_SAAS_LICENSE_KEY: proKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: publicKeyPem },
      expectedTenantId: "ten-cailay-001",
      simulatedCloudResponse: ocrFixture,
      ocrTransport: () => ocrFixture,
    } as ConstructorParameters<typeof CloudVisionOcrExtractorAdapter>[0]);
    expect(proAdapter.isAvailable).toBe(true);

    const extracted = proAdapter.extractFields(new Uint8Array([1, 2, 3]), {
      documentId: "DOC-CLOUD-01",
      documentType: "LAB_TEST_REPORT",
      fileName: "ZaloScan.jpg",
      mimeType: "image/jpeg",
      sha256Hash: "a".repeat(64),
    });
    expect(extracted).toHaveLength(2);
    expect(extracted.every((f) => f.verificationStatus === "DRAFT")).toBe(true);
  });

  it("computes non-binding 0 VND estimate when 0 sealed containers exist and scopes GET /api/v1/saas/status to actor.tenantId", async () => {
    const ws = new ContainerDossierWorkspace();
    ws.createDossier(
      {
        dossierCode: "DOS-SAAS-001",
        containerNumber: "MSKU1234565",
        sealNumber: "SL-998822",
        targetMarket: "CN",
        borderGate: "Huu Nghi",
        targetTemperatureC: 14,
        declaredNetWeightKg: 18240,
        declaredBoxCount: 960,
      },
      MANAGER
    );

    const report = computeTenantUsageAndRoiReport(MANAGER.tenantId, ws.listDossiers(MANAGER), "PACKHOUSE_PRO_SAAS");
    expect(report.totalDossiersCreated).toBe(1);
    expect(report.sealedExportedContainers).toBe(0);
    expect(report.isNonBindingEstimateOnly).toBe(true);
    expect(report.billingEstimateVnd.recommendedBillableVnd).toBe(0);

    const rootDir = mkdtempSync(join(tmpdir(), "durios-saas-http-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    const prevKey = process.env.DURIOS_SAAS_LICENSE_KEY;
    const prevPub = process.env.DURIOS_SAAS_LICENSE_PUBLIC_KEY;
    try {
      process.env.DURIOS_SAAS_LICENSE_KEY = createSignedSaasLicenseKey(
        { tenantId: "ten-foreign-enterprise-999", edition: "EXPORTER_ENTERPRISE", expiresAt: "2027-12-31T00:00:00.000Z" },
        privateKeyPem
      );
      process.env.DURIOS_SAAS_LICENSE_PUBLIC_KEY = publicKeyPem;

      const creds = seedTestPilotActor(app.authService, { role: "MANAGER" });
      const res = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/saas/status", {
          headers: { Authorization: `Bearer ${creds.sessionToken}` },
        })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success: boolean;
        data: { subscription: { edition: string; licensedTenantId?: string; degradedToCommunityReason?: string } };
      };
      expect(body.data.subscription.edition).toBe("COMMUNITY_OPEN_CORE");
      expect(body.data.subscription.degradedToCommunityReason).toBe("TENANT_MISMATCH_GRACEFUL_DOWNGRADE");
      expect(body.data.subscription.licensedTenantId).toBeUndefined();
    } finally {
      process.env.DURIOS_SAAS_LICENSE_KEY = prevKey;
      process.env.DURIOS_SAAS_LICENSE_PUBLIC_KEY = prevPub;
      app.sqliteClient.close();
    }
  });
});
