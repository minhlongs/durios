import type { DuriosProductEdition } from "./saas-tier-policy.js";

export type OpenCoreLicenseType = "AGPL-3.0-only" | "MIT" | "Commercial-Ed25519";

export interface OpenCoreModuleDescriptor {
  readonly moduleId: string;
  readonly title: string;
  readonly edition: DuriosProductEdition;
  readonly license: OpenCoreLicenseType;
  readonly entrypointPath: string;
  readonly stepNumbers: readonly number[];
  readonly upgradeTriggerDescription: string;
}

export interface OpenCoreEconomicTruthSummary {
  readonly vietnamActivePackhouses: 281;
  readonly vietnamActivePucs: 1599;
  readonly proAnnualPriceVnd: 60_000_000;
  readonly pureVietnamSaasCeilingUsd: 657_643;
  readonly targetArrUsd: 1_000_000;
  readonly multiRevenueStackRequired: true;
}

export interface OpenCoreEditionManifest {
  readonly manifestVersion: "1.0.0";
  readonly currentEdition: DuriosProductEdition;
  readonly openSourceLicenseSummary: "AGPL-3.0-only (Core) + MIT (Verifier SDK)";
  readonly economicTruth: OpenCoreEconomicTruthSummary;
  readonly modules: readonly OpenCoreModuleDescriptor[];
}

export const DURIOS_OPEN_CORE_MODULES: readonly OpenCoreModuleDescriptor[] = [
  {
    moduleId: "MOD-CORE-RULE-ENGINE",
    title: "Local Deterministic Rule Engine (VN_CN GACC)",
    edition: "COMMUNITY_OPEN_CORE",
    license: "AGPL-3.0-only",
    entrypointPath: "src/rules/deterministic-engine.ts",
    stepNumbers: [1, 4, 11],
    upgradeTriggerDescription: "Included in Community Core; upgrade to Pro for multi-market packs (JP, KR, EU).",
  },
  {
    moduleId: "MOD-CORE-HITL-SERVICE",
    title: "Human-in-the-Loop (HITL) Verification Service",
    edition: "COMMUNITY_OPEN_CORE",
    license: "AGPL-3.0-only",
    entrypointPath: "src/verification/hitl-service.ts",
    stepNumbers: [1, 3, 11],
    upgradeTriggerDescription: "Included in Community Core; upgrade to Pro for Cloud Vision OCR pre-extraction.",
  },
  {
    moduleId: "MOD-CORE-AUDIT-LEDGER",
    title: "Merklized SQLite SHA-256 Audit Ledger",
    edition: "COMMUNITY_OPEN_CORE",
    license: "AGPL-3.0-only",
    entrypointPath: "src/storage/sqlite-audit-ledger.ts",
    stepNumbers: [1, 19, 21],
    upgradeTriggerDescription: "Included in Community Core; upgrade to Enterprise for Cloud Ledger Anchor.",
  },
  {
    moduleId: "MOD-CORE-TRI-TUPLE-RBAC",
    title: "Tri-Tuple Persona & RBAC Policy Engine",
    edition: "COMMUNITY_OPEN_CORE",
    license: "AGPL-3.0-only",
    entrypointPath: "src/auth/rbac-policy.ts",
    stepNumbers: [1, 3, 7],
    upgradeTriggerDescription: "Included in Community Core; supports 5 statutory packhouse & buyer personas.",
  },
  {
    moduleId: "MOD-MIT-MANIFEST-VERIFIER",
    title: "Standalone Export Manifest Verifier SDK",
    edition: "COMMUNITY_OPEN_CORE",
    license: "MIT",
    entrypointPath: "src/export/standalone-manifest-verifier.ts",
    stepNumbers: [1, 9, 18],
    upgradeTriggerDescription: "Zero-dependency MIT SDK for customs brokers and cross-border buyers.",
  },
  {
    moduleId: "MOD-CORE-PORTABILITY-EXPORTER",
    title: "Signed Workspace Portability Bundle Exporter",
    edition: "COMMUNITY_OPEN_CORE",
    license: "AGPL-3.0-only",
    entrypointPath: "src/saas/workspace-portability-bundle.ts",
    stepNumbers: [1, 10, 14],
    upgradeTriggerDescription: "Self-serve HMAC-SHA256 bundle export to migrate seamlessly to Pro or Enterprise.",
  },
  {
    moduleId: "MOD-PRO-CLOUD-VISION-OCR",
    title: "Cloud Vision OCR Extractor Adapter",
    edition: "PACKHOUSE_PRO_SAAS",
    license: "Commercial-Ed25519",
    entrypointPath: "src/saas/cloud-ocr-extractor-adapter.ts",
    stepNumbers: [1, 13],
    upgradeTriggerDescription: "Triggered when packhouse exceeds manual data entry capacity (>5 containers/week).",
  },
  {
    moduleId: "MOD-PRO-MANAGED-ZNS-RELAY",
    title: "Managed Zalo ZNS & SMS Alert Relay",
    edition: "PACKHOUSE_PRO_SAAS",
    license: "Commercial-Ed25519",
    entrypointPath: "src/saas/managed-zns-alert-relay.ts",
    stepNumbers: [1, 4, 13],
    upgradeTriggerDescription: "Triggered when packhouse requires automated Zalo ZNS discrepancy alerts.",
  },
  {
    moduleId: "MOD-PRO-CLOUD-BACKUP-VAULT",
    title: "End-to-End Encrypted Cloud Backup Vault",
    edition: "PACKHOUSE_PRO_SAAS",
    license: "Commercial-Ed25519",
    entrypointPath: "src/saas/cloud-vault-backup-connector.ts",
    stepNumbers: [1, 13, 19],
    upgradeTriggerDescription: "Triggered when packhouse requires off-site encrypted disaster recovery.",
  },
  {
    moduleId: "MOD-PRO-GACC-REGISTRY-WATCH",
    title: "GACC Live PUC/PHC Registry Watch Service",
    edition: "PACKHOUSE_PRO_SAAS",
    license: "Commercial-Ed25519",
    entrypointPath: "src/saas/gacc-registry-watch-service.ts",
    stepNumbers: [1, 2, 13],
    upgradeTriggerDescription: "Triggered when monitoring 1,599 PUCs and 281 PHCs for sudden GACC suspensions.",
  },
  {
    moduleId: "MOD-ENT-HYBRID-EDGE-SYNC",
    title: "Hybrid Edge Multi-Site Sync Queue",
    edition: "EXPORTER_ENTERPRISE",
    license: "Commercial-Ed25519",
    entrypointPath: "src/saas/hybrid-edge-sync-queue.ts",
    stepNumbers: [1, 5, 15],
    upgradeTriggerDescription: "Triggered when an exporter coordinates multiple packhouses across Tien Giang/Mekong.",
  },
  {
    moduleId: "MOD-ENT-ASEAN-CORRIDORS",
    title: "ASEAN Multi-Origin Corridor Adapters (VN, MY, TH, PH)",
    edition: "EXPORTER_ENTERPRISE",
    license: "Commercial-Ed25519",
    entrypointPath: "src/rules/asean-corridor-adapters.ts",
    stepNumbers: [5, 6, 20],
    upgradeTriggerDescription: "Triggered when expanding verified trade corridors into Malaysia and Thailand.",
  },
];

export const DURIOS_OPEN_CORE_EDITION_MANIFEST: OpenCoreEditionManifest =
  getOpenCoreEditionManifest("COMMUNITY_OPEN_CORE");

export function getOpenCoreEditionManifest(
  currentEdition: DuriosProductEdition = "COMMUNITY_OPEN_CORE"
): OpenCoreEditionManifest {
  return {
    manifestVersion: "1.0.0",
    currentEdition,
    openSourceLicenseSummary: "AGPL-3.0-only (Core) + MIT (Verifier SDK)",
    economicTruth: {
      vietnamActivePackhouses: 281,
      vietnamActivePucs: 1599,
      proAnnualPriceVnd: 60_000_000,
      pureVietnamSaasCeilingUsd: 657_643,
      targetArrUsd: 1_000_000,
      multiRevenueStackRequired: true,
    },
    modules: DURIOS_OPEN_CORE_MODULES,
  };
}
