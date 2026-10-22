import type { DuriosProductEdition } from "./saas-tier-policy.js";

export type ModuleLicenseClass = "MIT" | "AGPL-3.0-only" | "Commercial-Ed25519";

export interface OpenCoreModuleDescriptor {
  readonly moduleId: string;
  readonly name: string;
  readonly pathPattern: string;
  readonly edition: DuriosProductEdition;
  readonly license: ModuleLicenseClass;
  readonly zeroLockInGuarantee: boolean;
  readonly description: string;
}

export interface OpenCoreEconomicTruth {
  readonly vietnamActivePackhouses: 281;
  readonly registeredVietnamDurianPackhouses: 281;
  readonly proAnnualPriceVnd: 60_000_000;
  readonly annualProSubscriptionVnd: 60_000_000;
  readonly perContainerPayGoVnd: 150_000;
  readonly pureVietnamSaasCeilingUsd: 657_643;
  readonly targetArrUsd: 1_000_000;
  readonly multiRevenueStackRequired: true;
  readonly eightLayerRevenueStack: readonly string[];
}

export interface OpenCoreEditionManifest {
  readonly manifestVersion: "1.0.0";
  readonly activeEdition: DuriosProductEdition;
  readonly repositoryLicenseModel: "AGPL-3.0-only (Core) + MIT (Verifier SDK) + Commercial (Pro/Enterprise)";
  readonly zeroLockInPolicy: string;
  readonly modules: readonly OpenCoreModuleDescriptor[];
  readonly economicTruth: OpenCoreEconomicTruth;
}

const MODULES_CATALOG: readonly OpenCoreModuleDescriptor[] = [
  { moduleId: "MOD-MIT-01", name: "ISO 6346 Check-Digit Validator", pathPattern: "src/domain/iso-6346.ts", edition: "COMMUNITY_OPEN_CORE", license: "MIT", zeroLockInGuarantee: true, description: "Standalone ISO 6346:1995 container number & check-digit verifier." },
  { moduleId: "MOD-MIT-02", name: "Canonical SHA-256 Document Hasher", pathPattern: "src/ingestion/document-hasher.ts", edition: "COMMUNITY_OPEN_CORE", license: "MIT", zeroLockInGuarantee: true, description: "Deterministic SHA-256 byte and string digest utility." },
  { moduleId: "MOD-MIT-03", name: "Deterministic Dossier Manifest Compiler", pathPattern: "src/export/manifest-compiler.ts", edition: "COMMUNITY_OPEN_CORE", license: "MIT", zeroLockInGuarantee: true, description: "Canonical export manifest serialization and composite SHA-256 compiler." },
  { moduleId: "MOD-MIT-04", name: "Standalone Cryptographic Manifest Verifier SDK", pathPattern: "src/export/standalone-manifest-verifier.ts", edition: "COMMUNITY_OPEN_CORE", license: "MIT", zeroLockInGuarantee: true, description: "Zero-dependency offline verifier for Chinese buyers, customs brokers, and banks." },
  { moduleId: "MOD-AGPL-01", name: "VN-CN Statutory Rule Engine & HITL Verification", pathPattern: "src/rules/**, src/verification/**", edition: "COMMUNITY_OPEN_CORE", license: "AGPL-3.0-only", zeroLockInGuarantee: true, description: "Local deterministic GACC compliance rules and mandatory Human-in-the-Loop sign-off." },
  { moduleId: "MOD-AGPL-02", name: "Single-Site SQLite Storage, Audit Ledger & RBAC", pathPattern: "src/storage/**, src/audit/**, src/auth/**", edition: "COMMUNITY_OPEN_CORE", license: "AGPL-3.0-only", zeroLockInGuarantee: true, description: "Local WAL SQLite persistence, continuous SHA-256 hash chain, and Tri-Tuple RBAC." },
  { moduleId: "MOD-PRO-01", name: "Cloud Vision OCR Document Extractor", pathPattern: "src/saas/cloud-ocr-extractor-adapter.ts", edition: "PACKHOUSE_PRO_SAAS", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Managed cloud OCR for blurry Zalo/mobile photos; outputs DRAFT fields requiring HITL." },
  { moduleId: "MOD-PRO-02", name: "Managed Zalo ZNS & SMS Alert Relay", pathPattern: "src/saas/managed-zns-alert-relay.ts", edition: "PACKHOUSE_PRO_SAAS", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Turnkey Zalo OA template & SMS Brandname dispatch for OTP and seal mismatch alerts." },
  { moduleId: "MOD-PRO-03", name: "End-to-End Encrypted (E2EE) Cloud Backup Vault", pathPattern: "src/saas/cloud-vault-backup-connector.ts", edition: "PACKHOUSE_PRO_SAAS", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Client-side AES-256-GCM + scrypt encrypted offsite disaster recovery vault." },
  { moduleId: "MOD-PRO-04", name: "GACC Live Registry Watch & Cross-Border Buyer Portal", pathPattern: "src/saas/gacc-registry-watch-service.ts", edition: "PACKHOUSE_PRO_SAAS", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Real-time GACC 2,408-code suspension monitor and bilingual VI/ZH/EN buyer room." },
  { moduleId: "MOD-ENT-01", name: "Hybrid Edge-to-Cloud Multi-Site Sync Queue", pathPattern: "src/saas/hybrid-edge-sync-queue.ts", edition: "EXPORTER_ENTERPRISE", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Multi-packhouse offline queue synchronization with cryptographic cloud receipts." },
  { moduleId: "MOD-ENT-02", name: "ASEAN Multi-Origin Corridor Rules & Zero-Custody Escrow", pathPattern: "src/rules/asean-corridor-adapters.ts, src/marketplace/**", edition: "EXPORTER_ENTERPRISE", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "TH-CN / MY-CN compliance rules and Dual-Lock Zero-Custody trade escrow orchestration." },
  { moduleId: "MOD-ENT-03", name: "Financial Verification Room (Trade-Finance & Marine Insurance)", pathPattern: "src/saas/financial-attestation-token.ts, src/saas/financial-attestation-service.ts, src/server/financial-verification-handler.ts", edition: "EXPORTER_ENTERPRISE", license: "Commercial-Ed25519", zeroLockInGuarantee: true, description: "Signed single-use attestation letting a bank or marine insurer verify one redacted sealed dossier with no account and no RBAC change." },
];

export function getOpenCoreEditionManifest(
  activeEdition: DuriosProductEdition = "COMMUNITY_OPEN_CORE"
): OpenCoreEditionManifest {
  return {
    manifestVersion: "1.0.0",
    activeEdition,
    repositoryLicenseModel: "AGPL-3.0-only (Core) + MIT (Verifier SDK) + Commercial (Pro/Enterprise)",
    zeroLockInPolicy:
      "If a commercial license expires or is absent, DuriOS degrades gracefully to COMMUNITY_OPEN_CORE with 100% local SQLite read/write/export access preserved.",
    modules: MODULES_CATALOG,
    economicTruth: {
      vietnamActivePackhouses: 281,
      registeredVietnamDurianPackhouses: 281,
      proAnnualPriceVnd: 60_000_000,
      annualProSubscriptionVnd: 60_000_000,
      perContainerPayGoVnd: 150_000,
      pureVietnamSaasCeilingUsd: 657_643,
      targetArrUsd: 1_000_000,
      multiRevenueStackRequired: true,
      eightLayerRevenueStack: [
        "1. Packhouse Pro SaaS (60M VND/year or 150k VND/container)",
        "2. Managed Cloud Vision OCR & Zalo ZNS Usage Packs",
        "3. E2EE Cloud Backup Vault & 5-Year Statutory Archive",
        "4. GACC Live Registry Watch & Cross-Border Buyer Verification Room",
        "5. Zero-Custody Dual-Lock Trade Escrow Orchestration Fee",
        "6. Trade-Finance & Marine Cargo Insurance Verified Dossier API",
        "7. ASEAN Multi-Origin Corridors (Thailand DOA->CN, Malaysia DOA->CN)",
        "8. Enterprise Dedicated Cluster & Custom ERP/Customs EDI Integration",
      ],
    },
  };
}
