import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAseanCorridorProtocol, listSupportedAseanCorridors,
} from "../src/rules/asean-corridor-adapters.js";
import { compileVerifiedOrganizationProfile } from "../src/sharing/verified-org-profile.js";
import { evaluateFirstContainerValueMetrics } from "../src/auth/pilot-kpi-extended-types.js";
import type { ContainerDossier } from "../src/domain/types.js";

function buildMockDossier(overrides: Partial<ContainerDossier> = {}): ContainerDossier {
  return {
    id: "DOS-TEST-01", tenantId: "TEN-CAILAY-01", dossierCode: "DUR-2026-001",
    containerNumber: "MSCU1234567", sealNumber: "SEAL-889900", targetMarket: "CN",
    borderGate: "Hữu Nghị", targetTemperatureC: 13.5, declaredNetWeightKg: 18500,
    declaredBoxCount: 950, lifecycleState: "EXPORTED", isImmutable: true,
    createdAt: "2026-10-17T08:00:00.000Z", updatedAt: "2026-10-17T08:04:00.000Z",
    documents: [], ...overrides,
  };
}

describe("Verified Durian Trade Network Primitives", () => {
  it("supports ASEAN export corridors (VN_CN, MY_CN, TH_CN, PH_CN) with portable ontology", () => {
    expect(listSupportedAseanCorridors().length).toBe(4);
    const myCn = getAseanCorridorProtocol("MY_CN");
    expect(myCn.originCountryIso2).toBe("MY");
    expect(myCn.destinationAuthorityCode).toBe("GACC");
    expect(myCn.requiresRegisteredOrchardPuc && myCn.requiresContainerInspectionAndSeal).toBe(true);
    expect(getAseanCorridorProtocol("TH_CN").minimumDryMatterPct).toBe(32);
  });

  it("compiles DuriOS Verified Organization Profile without leaking commercial secrets", () => {
    const d1 = buildMockDossier({
      id: "DOS-1", lifecycleState: "EXPORTED",
      createdAt: "2026-10-17T08:00:00.000Z", updatedAt: "2026-10-17T08:15:00.000Z",
    });
    const d2 = buildMockDossier({
      id: "DOS-2", lifecycleState: "APPROVED_FOR_EXPORT",
      createdAt: "2026-10-17T09:00:00.000Z", updatedAt: "2026-10-17T09:19:00.000Z",
    });

    const profile = compileVerifiedOrganizationProfile(
      "TEN-CAILAY-01", "Vựa Sầu Riêng Cai Lậy", "PACKHOUSE_EXPORTER", [d1, d2]
    );

    expect(profile.verifiedShipmentsCount).toBe(2);
    expect(profile.totalDossiersTracked).toBe(2);
    expect(profile.medianDocumentReadinessMinutes).toBe(17);
    expect(profile.unresolvedSealMismatches).toBe(0);
    expect(profile.documentReliabilityScore).toBe(1.0);
    expect(profile.privacyDisclaimerVi).toContain("không chia sẻ danh tính nhà vườn");
  });

  it("evaluates the 4 first-container value metrics accurately", () => {
    const dossierWithBlocker = buildMockDossier({
      createdAt: "2026-10-17T10:00:00.000Z",
      updatedAt: "2026-10-17T10:04:00.000Z",
      latestValidationResult: {
        status: "BLOCKED", criticalBlockers: 1, advisoryWarnings: 0,
        evaluatedRulesCount: 5, evaluatedAt: "2026-10-17T10:04:00.000Z",
        findings: [{
          ruleId: "GACC-SEAL-001", ruleName: "Cross-Document Seal Match",
          severity: "CRITICAL_BLOCKER", citation: "GACC Protocol",
          observedValue: "SEAL-01 != SEAL-02", thresholdValue: "EQUAL",
          messageVi: "Lệch số chì hải quan", messageEn: "Seal mismatch",
        }],
      },
    });

    const metrics = evaluateFirstContainerValueMetrics(dossierWithBlocker, 4.0);
    expect(metrics.minutesSavedPerContainer).toBe(31);
    expect(metrics.exceptionsDiscoveredPerContainer).toBe(1);
    expect(metrics.expectedLossAvoidedVnd).toBe(35_000_000);
  });

  it("validates DURIOS-STRATEGY-V2.json economic truth (281 packhouses vs 427 needed for $1M ARR)", () => {
    const raw = readFileSync(join(process.cwd(), "docs/product-direction/DURIOS-STRATEGY-V2.json"), "utf-8");
    const strategy = JSON.parse(raw) as {
      market_facts_official_sep_2026: { vietnam_active_packhouses: number };
      economic_truth_and_target_arr: {
        max_vietnam_saas_arr_usd: number;
        sites_required_for_one_million_arr_saas_only: number;
      };
      north_star_metrics: string[];
    };

    expect(strategy.market_facts_official_sep_2026.vietnam_active_packhouses).toBe(281);
    expect(strategy.economic_truth_and_target_arr.max_vietnam_saas_arr_usd).toBe(657643);
    expect(strategy.economic_truth_and_target_arr.sites_required_for_one_million_arr_saas_only).toBe(427);
    expect(strategy.north_star_metrics).toContain("Verified GMV");
  });
});
