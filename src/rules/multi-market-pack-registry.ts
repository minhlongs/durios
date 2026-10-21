import type { DocumentType } from "../domain/types.js";
import { resolveSaasSubscriptionStatus } from "../saas/saas-tier-policy.js";

export type SupportedExportMarketCode = "CN" | "JP" | "KR" | "EU";

export interface MarketCompliancePackSpec {
  readonly marketCode: SupportedExportMarketCode;
  readonly marketNameVi: string;
  readonly authorityCode: string;
  readonly editionRequired: "COMMUNITY_OPEN_CORE" | "PACKHOUSE_PRO_SAAS";
  readonly statutoryVerified: boolean;
  readonly cadmiumStatutoryLimitMgKg: number;
  readonly cadmiumInternalActionThresholdMgKg: number;
  readonly minTemperatureC: number;
  readonly maxTemperatureC: number;
  readonly mandatoryDocumentTypes: readonly DocumentType[];
}

const MARKET_PACKS: Readonly<Record<SupportedExportMarketCode, MarketCompliancePackSpec>> = { CN: { marketCode: "CN", marketNameVi: "Trung Quốc (GACC Nghị định thư Sầu riêng tươi)", authorityCode: "GACC / GB 2762-2022", editionRequired: "COMMUNITY_OPEN_CORE", statutoryVerified: true, cadmiumStatutoryLimitMgKg: 0.05, cadmiumInternalActionThresholdMgKg: 0.04, minTemperatureC: 12, maxTemperatureC: 15, mandatoryDocumentTypes: ["PACKING_LIST", "LAB_TEST_REPORT", "PHYTOSANITARY_CERTIFICATE"] }, JP: { marketCode: "JP", marketNameVi: "Nhật Bản (MAFF & MHLW Positive List)", authorityCode: "MAFF-JP", editionRequired: "PACKHOUSE_PRO_SAAS", statutoryVerified: false, cadmiumStatutoryLimitMgKg: 0.05, cadmiumInternalActionThresholdMgKg: 0.015, minTemperatureC: 13, maxTemperatureC: 15, mandatoryDocumentTypes: ["PACKING_LIST", "LAB_TEST_REPORT", "PHYTOSANITARY_CERTIFICATE"] }, KR: { marketCode: "KR", marketNameVi: "Hàn Quốc (MFDS & QIA Kiểm dịch thực vật)", authorityCode: "MFDS-KR", editionRequired: "PACKHOUSE_PRO_SAAS", statutoryVerified: false, cadmiumStatutoryLimitMgKg: 0.05, cadmiumInternalActionThresholdMgKg: 0.02, minTemperatureC: 12, maxTemperatureC: 15, mandatoryDocumentTypes: ["PACKING_LIST", "LAB_TEST_REPORT", "PHYTOSANITARY_CERTIFICATE"] }, EU: { marketCode: "EU", marketNameVi: "Liên minh Châu Âu (EFSA EC 2023/915)", authorityCode: "EFSA-EU", editionRequired: "PACKHOUSE_PRO_SAAS", statutoryVerified: false, cadmiumStatutoryLimitMgKg: 0.05, cadmiumInternalActionThresholdMgKg: 0.015, minTemperatureC: 12, maxTemperatureC: 15, mandatoryDocumentTypes: ["PACKING_LIST", "LAB_TEST_REPORT", "PHYTOSANITARY_CERTIFICATE"] } };

export function getMarketCompliancePack(
  marketCode: SupportedExportMarketCode,
  env: Record<string, string | undefined> = process.env,
  expectedTenantId?: string
): MarketCompliancePackSpec {
  const pack = MARKET_PACKS[marketCode];
  if (pack.editionRequired === "PACKHOUSE_PRO_SAAS") {
    const sub = resolveSaasSubscriptionStatus(env, new Date().toISOString(), expectedTenantId);
    if (!sub.licenseValid) {
      throw new Error(
        `Market Compliance Pack '${marketCode}' (${pack.authorityCode}) requires an active PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription. Market 'CN' is 100% free in COMMUNITY_OPEN_CORE.`
      );
    }
  }
  if (!pack.statutoryVerified) {
    throw new Error(
      `Market Compliance Pack '${marketCode}' (${pack.authorityCode}) is not yet statutory-verified for automated compliance release.`
    );
  }
  return pack;
}

export function listAllMarketCompliancePacks(): readonly MarketCompliancePackSpec[] {
  return Object.values(MARKET_PACKS);
}
