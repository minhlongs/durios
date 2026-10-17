# DuriOS Commercial License & Managed SaaS Subscription Terms

- **Effective Date:** 2026-10-17
- **Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING` (Local open-core connector scaffolds implemented; live cloud infrastructure, telecom contracts, regulatory feeds, and legal sign-off pending — see `plans/261017-open-core-hardening/plan.md`).
- **Applies To:** DuriOS Packhouse Pro SaaS, Exporter Enterprise Edition, Managed Cloud Connectors (`src/saas/`), and alternate non-copyleft distributions.

## 1. Scope of Commercial Licensing vs. `AGPL-3.0-only` Community Core
DuriOS publishes its deterministic compliance rules, SHA-256 hash-chain audit ledger, and manifest verification engine on Public GitHub under a dual-license model (`MIT` for the 5 verification/hashing/ISO modules and `AGPL-3.0-only` for the Community Core).

**No Restriction of AGPL-3.0 Rights:** Commercial SaaS and Enterprise licenses cover **proprietary managed connectors, hosted cloud infrastructure, and alternate non-copyleft distribution**. Nothing in this Commercial License restricts, narrows, or revokes any rights granted to you under `AGPL-3.0-only` (including commercial use, multi-site self-hosting, modification, and network deployment in compliance with AGPL-3.0 Section 13) or `MIT` for the open-source core.

A Commercial Subscription (`DURIOS_SAAS_LICENSE_KEY`, verified via Ed25519 signature against `DURIOS_SAAS_LICENSE_PUBLIC_KEY`) is required only if you wish to connect to DuriOS-operated hosted services or distribute proprietary modifications without AGPL-3.0 source-disclosure obligations. In the current local repository scaffold, the `src/saas/` modules provide fail-closed local client/adapter boundaries awaiting external cloud gateway provisioning:
1. **Cloud Vision OCR Adapter (`CloudVisionOcrExtractorAdapter`):** Local adapter scaffold that requires an injected OCR transport and emits candidate fields strictly as `DRAFT` for mandatory human-in-the-loop verification (`HUMAN_VERIFIED`).
2. **Managed Zalo ZNS & SMS Relay (`ManagedSaasZnsAlertRelay`):** Local quota and dispatch scaffold requiring an injected telecom transport adapter (external Zalo OA / eSMS carrier contract pending).
3. **Cloud Vault Envelope Connector (`CloudVaultBackupConnector`):** Local client-side `scrypt` + AES-256-GCM envelope encryption for backup manifest metadata (`MANIFEST_METADATA_ONLY_NOT_BLOBS`); hosted off-site object storage and retention SLAs require an active cloud storage backend.
4. **GACC Registry Watch & Buyer Verification Room (`GaccRegistryWatchService`):** Local snapshot evaluation and signed URL builder requiring caller-supplied regulatory snapshots and configured portal base URLs.
5. **Local Ledger Receipt Anchor (`CloudLedgerAnchor`):** Local HMAC-SHA256 receipt generator (`LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA`); external qualified RFC 3161 Timestamping Authority integration is pending.

## 2. Zero Lock-In & Graceful Downgrade Architecture
- **Local Data Ownership:** Each self-hosted packhouse or exporter retains direct filesystem access to its local SQLite database (`./data/durios.db`) and content-addressed document blobs (`./data/uploads/storage/blobs/`). Note: operating this software does not by itself constitute a legal guarantee of statutory compliance with Vietnam's Personal Data Protection Law (`91/2025/QH15`); operators remain responsible for their own physical, organizational, and statutory data protection obligations.
- **Graceful Downgrade:** If `DURIOS_SAAS_LICENSE_KEY` is absent, unconfigured, mismatched to the tenant, or expired, DuriOS never locks or encrypts local SQLite customer data. The runtime automatically downgrades to `COMMUNITY_OPEN_CORE`, preserving local read and export access to historical dossiers and audit trails.

## 3. Trademark Notice
Trademark usage is governed separately by `TRADEMARK-POLICY.md` under nominative fair use and anti-confusion principles and does not restrict copyright permissions granted under `AGPL-3.0-only` or `MIT`.
