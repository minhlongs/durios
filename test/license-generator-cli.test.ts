import { describe, expect, it } from "bun:test";
import {
  issueOpcCommercialLicenseBundle,
  runLicenseGeneratorCli,
} from "../src/saas/license-generator-cli.js";
import { resolveSaasSubscriptionStatus } from "../src/saas/saas-tier-policy.js";
import { buildOpcCommercialQuote } from "../src/saas/invoice-template.js";

describe("Zero-Code Billing & Offline Ed25519 License Generator CLI", () => {
  it("builds deterministic commercial quote with zero-custody remittance disclaimer", () => {
    const quote = buildOpcCommercialQuote({
      tenantId: "TENANT-CAILAY-01",
      siteCode: "SITE-CAILAY-TIENGIANG-01",
      planCode: "PILOT_30D_5M_VND",
      issuedAtIso: "2026-10-25T00:00:00.000Z",
    });

    expect(quote.amountVnd).toBe(5_000_000);
    expect(quote.durationDays).toBe(30);
    expect(quote.expiresAt).toBe("2026-11-24T00:00:00.000Z");
    expect(quote.transferMemo).toBe("DURIOS TENANT-CAILAY-01 PILOT_30D_5M_VND");
    expect(quote.zeroCustodyDisclaimer).toContain("Nghị định 52/2024/NĐ-CP");
  });

  it("issues and cryptographically verifies 5M VND pilot license key", () => {
    const bundle = issueOpcCommercialLicenseBundle({
      tenantId: "TENANT-CAILAY-01",
      siteCode: "SITE-CAILAY-TIENGIANG-01",
      planCode: "PILOT_30D_5M_VND",
      issuedAtIso: "2026-10-25T00:00:00.000Z",
    });

    expect(bundle.licenseKey.startsWith("DURIOS.")).toBe(true);
    expect(bundle.verificationStatus.licenseValid).toBe(true);
    expect(bundle.verificationStatus.edition).toBe("PACKHOUSE_PRO_SAAS");
    expect(bundle.verificationStatus.licensedTenantId).toBe("TENANT-CAILAY-01");

    const directCheck = resolveSaasSubscriptionStatus(
      {
        DURIOS_SAAS_LICENSE_KEY: bundle.licenseKey,
        DURIOS_SAAS_LICENSE_PUBLIC_KEY: bundle.publicKeyPem,
      },
      "2026-10-26T00:00:00.000Z",
      "TENANT-CAILAY-01"
    );
    expect(directCheck.licenseValid).toBe(true);
  });

  it("issues 60M VND annual Pro and 180M VND Enterprise licenses with correct editions", () => {
    const proBundle = issueOpcCommercialLicenseBundle({
      tenantId: "PACKHOUSE-CAILAY",
      planCode: "PRO_ANNUAL_60M_VND",
    });
    expect(proBundle.quote.amountVnd).toBe(60_000_000);
    expect(proBundle.verificationStatus.edition).toBe("PACKHOUSE_PRO_SAAS");
    expect(proBundle.verificationStatus.entitlements.multiSiteEnterpriseSync).toBe(false);

    const entBundle = issueOpcCommercialLicenseBundle({
      tenantId: "HUNG-HAU-HOLDINGS",
      planCode: "ENTERPRISE_ANNUAL_180M_VND",
    });
    expect(entBundle.quote.amountVnd).toBe(180_000_000);
    expect(entBundle.verificationStatus.edition).toBe("EXPORTER_ENTERPRISE");
    expect(entBundle.verificationStatus.entitlements.multiSiteEnterpriseSync).toBe(true);
  });

  it("handles CLI subcommands: --keygen and default issuance", () => {
    const keygenRes = runLicenseGeneratorCli(["--keygen"]);
    expect(keygenRes.exitCode).toBe(0);
    const keygenData = JSON.parse(keygenRes.outputJson) as { publicKeyPem: string; privateKeyPem: string };
    expect(keygenData.publicKeyPem).toContain("PUBLIC KEY");
    expect(keygenData.privateKeyPem).toContain("PRIVATE KEY");

    const issueRes = runLicenseGeneratorCli([
      "--tenant-id", "TEST-TENANT",
      "--plan", "PILOT_30D_5M_VND",
    ]);
    expect(issueRes.exitCode).toBe(0);
    const issueData = JSON.parse(issueRes.outputJson) as { licenseKey: string };
    expect(issueData.licenseKey.startsWith("DURIOS.")).toBe(true);
  });
});
