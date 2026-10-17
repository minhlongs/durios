---
title: "DuriOS Open-Core & SaaS Hardening Plan (25-Step Blueprint Audit Remediation)"
description: "Reviewed fail-closed local architecture plan remediating cryptographic, replay, transport, regulatory, CLI, vault, metering, licensing, and CI flaws while preserving 84 core tests."
status: completed
priority: P1
effort: 6h
branch: main
tags: [open-core, security, ed25519, sqlite, agpl, fail-closed, audit-remediation]
created: 2026-10-17
---

# DuriOS Open-Core & SaaS Hardening Plan

- **Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING` (Prior blanket statements claiming all 25 steps of `plans/open-core-saas-blueprint/plan.md` were complete are **erroneous** and superseded by this plan.)
- **Target Outcome:** Practical, verifiable, fail-closed **local open-core foundation** preserving all 84 original core tests across the 21 baseline test files, with zero hardcoded secrets, zero fabricated network delivery/sync receipts, zero unverified statutory market claims, and strict `<= 179` LOC / `0 any` compliance.

---

## 1. Executive Architecture & API Contract Review

### 1.1 Canonical Common API (Locked Across All Workers)

1. **`src/saas/saas-tier-policy.ts` (`lines 20-151`)**:
   - `createSignedSaasLicenseKey(payload: SaasLicensePayload, signingPrivateKeyPem: string): string`
     - **Breaking Scaffold Fix:** `signingPrivateKeyPem` is **REQUIRED** (Ed25519 PKCS#8 PEM or base64 DER private key). `DEFAULT_SIGNING_SECRET` (`line 31`) is deleted.
     - Signs canonical UTF-8 payload `${payload.edition}|${payload.tenantId}|${payload.expiresAt}` using `node:crypto` `sign(null, Buffer.from(encoded, "utf-8"), privateKey)`.
   - `resolveSaasSubscriptionStatus(env: Record<string, string | undefined> = process.env, nowIso = new Date().toISOString(), expectedTenantId?: string): SaasSubscriptionStatus`
     - Reads `env.DURIOS_SAAS_LICENSE_KEY` and `env.DURIOS_SAAS_LICENSE_PUBLIC_KEY`.
     - **Fail-Closed Rules:**
       - Missing `DURIOS_SAAS_LICENSE_KEY` $\rightarrow$ `COMMUNITY_OPEN_CORE`, `licenseValid: false`.
       - Present license key but missing/invalid `DURIOS_SAAS_LICENSE_PUBLIC_KEY` $\rightarrow$ `COMMUNITY_OPEN_CORE`, `licenseValid: false`, `degradedToCommunityReason: "MISSING_LICENSE_PUBLIC_KEY_GRACEFUL_DOWNGRADE"`.
       - Invalid Ed25519 signature via `verify(null, ...)` $\rightarrow$ `INVALID_LICENSE_SIGNATURE_GRACEFUL_DOWNGRADE`.
       - `expectedTenantId !== undefined` and (`expectedTenantId.trim() === ""` or `expectedTenantId !== tenantId`) $\rightarrow$ `COMMUNITY_OPEN_CORE`, `licenseValid: false`, `degradedToCommunityReason: "TENANT_MISMATCH_GRACEFUL_DOWNGRADE"`.
       - Expired `expiresAt <= Date.parse(nowIso)` $\rightarrow$ `EXPIRED_SUBSCRIPTION_GRACEFUL_DOWNGRADE`.
   - `generateEphemeralSaasLicenseKeyPair(): { publicKeyPem: string; privateKeyPem: string }`
     - Exported helper using `generateKeyPairSync("ed25519")` for deterministic unit/integration tests without hardcoded secrets.

2. **Complete Enumeration of `resolveSaasSubscriptionStatus` & `createSignedSaasLicenseKey` Callers (14 sites verified)**:
   - `src/saas/saas-tier-policy.ts:51,65` (definitions)
   - `src/server/saas-status-handler.ts:14` $\rightarrow$ pass `(process.env, new Date().toISOString(), actor.tenantId)`
   - `src/saas/cloud-ledger-anchor.ts:26` $\rightarrow$ pass `(env, anchoredAtIso, tenantId)`
   - `src/saas/partner-webhook-ingestor.ts:52` $\rightarrow$ pass `(env, new Date().toISOString(), payload.tenantId)`
   - `src/saas/managed-zns-alert-relay.ts:36,52` $\rightarrow$ pass `(env, dispatchedAt, request.tenantId)` (and optional `tenantId` in `getQuotaLimit(env, tenantId?)`)
   - `src/saas/hybrid-edge-sync-queue.ts:56` $\rightarrow$ pass `(env, syncedAt, tenantId)`
   - `src/saas/cloud-ocr-extractor-adapter.ts:31` $\rightarrow$ pass `(this.env, new Date().toISOString(), this.expectedTenantId)`
   - `src/saas/gacc-registry-watch-service.ts:73,114` $\rightarrow$ pass `(env, new Date().toISOString(), expectedTenantId)`
   - `src/saas/cloud-vault-backup-connector.ts:27` $\rightarrow$ pass `(env, new Date().toISOString(), tenantId)`
   - `src/rules/multi-market-pack-registry.ts:87` $\rightarrow$ pass `(env, new Date().toISOString(), expectedTenantId)`
   - `test/open-core-saas-monetization.test.ts:36,46,52,62,74`
   - `test/saas-cloud-connectors.test.ts:75`
   - `test/saas-advanced-ecosystem.test.ts:16`

---

## 2. Explicit Data Flows & Failure Mode Matrix

| Component (`file:line`) | Data In | Transformation & Control Flow | Data Out | Named Failure Modes & Mitigations |
|---|---|---|---|---|
| **Ed25519 License Guard** (`src/saas/saas-tier-policy.ts:51-151`) | `env.DURIOS_SAAS_LICENSE_KEY`, `env.DURIOS_SAAS_LICENSE_PUBLIC_KEY`, `nowIso`, `expectedTenantId` | Parse `DURIOS.<base64url>.<sigBase64url>` $\rightarrow$ check public key present $\rightarrow$ `crypto.verify(null, body, pubKey, sig)` $\rightarrow$ decode `edition\|tenantId\|expiresAt` $\rightarrow$ verify `expectedTenantId` & expiry | `SaasSubscriptionStatus` (`licenseValid`, `entitlements`) | **FM-1:** Forged token using public repo salt $\rightarrow$ Mitigated by asymmetric Ed25519 (`privateKey` required).<br>**FM-2:** Cross-tenant key reuse $\rightarrow$ Mitigated by mandatory `expectedTenantId` check failing closed. |
| **Local Ledger Anchor** (`src/saas/cloud-ledger-anchor.ts:19-67`) | `tenantId`, `dossierId`, `dossierEvents`, `env.DURIOS_LEDGER_ANCHOR_SIGNING_KEY` | Verify tenant-bound SaaS status $\rightarrow$ require explicit `DURIOS_LEDGER_ANCHOR_SIGNING_KEY` ($\ge 16$ chars) $\rightarrow$ `createHmac("sha256", key)` over head event | `CloudLedgerAnchorReceipt` (`anchorScheme: "LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA"`) | **FM-3:** Default secret forgery & false RFC 3161 TSA legal claim $\rightarrow$ Mitigated by removing `DEFAULT_TSA_SECRET` (`line 17`), failing closed without key, and explicit non-TSA receipt scheme. |
| **Partner Webhook Ingestor** (`src/saas/partner-webhook-ingestor.ts:25-101`) | `PartnerWebhookPayload`, `partnerSharedSecret`, `env` | 1. Verify tenant-bound SaaS status<br>2. Require non-empty secret & verify `createHmac("sha256")` + `timingSafeEqual` **first**<br>3. Check `${tenantId}:${idempotencyKey}` map; reject payload hash mismatch; emit `DRAFT` fields | `PartnerWebhookIngestionResult` (`verificationStatus: "DRAFT"`) | **FM-4:** Unauthenticated idempotency probing (`lines 59-69` order bug) $\rightarrow$ Mitigated by verifying HMAC before replay lookup.<br>**FM-5:** Cross-tenant key collision or mutated payload replay $\rightarrow$ Mitigated by tenant-scoped key + SHA-256 payload digest conflict error. |
| **Managed ZNS Relay** (`src/saas/managed-zns-alert-relay.ts:32-90`) | `ZnsAlertDispatchRequest`, `env`, injected `ZnsTransportAdapter` | Verify tenant-bound SaaS status $\rightarrow$ validate E.164 phone $\rightarrow$ check quota $\rightarrow$ require configured transport $\rightarrow$ invoke transport $\rightarrow$ increment quota only on transport `delivered: true` | `ZnsAlertDispatchReceipt` | **FM-6:** Fabricated `delivered: true` when offline/unconfigured (`line 84`) $\rightarrow$ Mitigated by failing closed when no `ZnsTransportAdapter` is injected or when transport returns `delivered: false`. |
| **Hybrid Edge Sync Queue** (`src/saas/hybrid-edge-sync-queue.ts:19-81`) | Sealed `DossierExportManifest`, optional SQLite `Database`, injected `EdgeSyncTransport` | Persist `PENDING_OFFLINE` row in SQLite (`edge_sync_queue` table or memory fallback) $\rightarrow$ on flush, verify tenant license & require injected `EdgeSyncTransport` $\rightarrow$ update to `SYNCED_TO_CLOUD` only after transport ack | `QueuedEdgeSyncItem[]` | **FM-7:** Data loss on process restart & fake cloud sync (`lines 20, 66-75`) $\rightarrow$ Mitigated by SQLite table persistence and requiring real transport ack receipt before marking `SYNCED_TO_CLOUD`. |
| **Cloud Vision OCR Adapter** (`src/saas/cloud-ocr-extractor-adapter.ts:17-89`) | `Uint8Array` document, `ExtractionContext`, injected `OcrTransport` | Check tenant-bound `cloudVisionOcr` entitlement AND injected transport/response $\rightarrow$ emit candidate fields with `verificationStatus: "DRAFT"` | `readonly ExtractedField[]` (`DRAFT` only) | **FM-8:** Unconfigured adapter claiming availability or bypassing HITL $\rightarrow$ Mitigated by `isAvailable === false` when transport missing, zero network calls, and immutable `DRAFT` status. |
| **Standalone Manifest Verifier** (`src/export/standalone-manifest-verifier.ts:18-90`, `package.json:17`) | `<manifest.json>` (`DossierExportManifest`) | Validate required manifest schema fields $\rightarrow$ recompute `compositeManifestSha256` $\rightarrow$ check ISO 6346 & 64-hex doc hashes $\rightarrow$ emit local integrity verdict | `ManifestVerificationResult` (exit `0` or `1`) | **FM-9:** `package.json:17` aliased `verify:manifest` to `field-auditor-cli.ts` $\rightarrow$ Mitigated by pointing `verify:manifest` to `src/export/standalone-manifest-verifier.ts` and rejecting non-manifest JSON inputs. |
| **Cloud Vault Connector** (`src/saas/cloud-vault-backup-connector.ts:17-83`) | `tenantId`, `SiteBackupManifest`, `clientPassphrase`, `env` | Verify tenant-bound SaaS status $\rightarrow$ derive key via `scryptSync(passphrase, salt, 32)` $\rightarrow$ AES-256-GCM encrypt with AAD `tenantId\|version\|sha256` $\rightarrow$ verify `expectedTenantId` & AAD on decrypt | `EncryptedCloudVaultEnvelope` (`payloadScope: "MANIFEST_METADATA_ONLY_NOT_BLOBS"`) | **FM-10:** Weak unsalted SHA-256 KDF (`line 18`), missing tenant AAD binding, and misleading full-backup claim $\rightarrow$ Mitigated by random 16-byte salt `scryptSync`, GCM AAD binding, and explicit metadata-only scope field. |
| **GACC Watch & Buyer Room** (`src/saas/gacc-registry-watch-service.ts:33-135`) | `pucCode`, `phcCode`, explicit `feedSnapshot`, `DossierExportManifest` | Require caller-supplied `feedSnapshot` (no default synthetic map) $\rightarrow$ check `APPROVED_ACTIVE`; require explicit portal base URL/signer for buyer room | `GaccWatchEvaluationResult`, `CrossBorderBuyerRoomLink` | **FM-11:** Synthetic orchard codes (`lines 33-65`) mistaken for live GACC approvals $\rightarrow$ Mitigated by removing default parameter and failing closed when no snapshot is provided. |
| **Multi-Market Pack Registry** (`src/rules/multi-market-pack-registry.ts:18-99`) | `SupportedExportMarketCode` (`CN`, `JP`, `KR`, `EU`) | Serve verified `CN` pack in Community; mark `JP`/`KR`/`EU` as `UNVERIFIED_EXTERNAL_LEGAL_COUNSEL_REQUIRED` without fabricated statutory limits and fail closed unless verified override provided | `MarketCompliancePackSpec` | **FM-12:** Unverified `0.05 mg/kg` / temperature rules for `JP`/`KR`/`EU` (`lines 34-78`) $\rightarrow$ Mitigated by failing closed on `JP`/`KR`/`EU` until external regulatory sign-off. |
| **Usage Metering & Status Route** (`src/saas/usage-metering-service.ts:28-89`, `src/server/saas-status-handler.ts:8-36`) | `tenantId`, `ContainerDossier[]`, `activeEdition` | Count tenant dossiers/exports/blocks $\rightarrow$ compute `0 VND` when `sealedExportedContainers === 0` $\rightarrow$ attach `isNonBindingEstimateOnly: true` | `UsageMeteringSummary` | **FM-13:** Charging `150,000 VND` for `0` containers (`line 68`) and presenting estimates as invoices $\rightarrow$ Mitigated by zeroing 0-container usage and adding non-binding disclaimer fields. |

---

## 3. Dependency Graph & Strict File Ownership Partition

```
[Phase 1: Worker 1 — Security Core (Ed25519 License, Partner HMAC, Ledger Anchor)]
       │
       ├──► [Phase 2: Worker 2 — Transports & SQLite Queue (Queue, ZNS Relay, Cloud OCR, Migration V6)]
       ├──► [Phase 3: Worker 3 — Verifier, Vault, GACC & Market Packs]
       ├──► [Phase 4: Worker 4 — Licensing, Governance Docs & CI Hardening]
       │
       ▼
[Phase 5: Coordinator — Usage Metering, Server Route, Index Exports, Package Scripts & Full Verification]
```

| Owner | Exclusively Owned Files (Zero Overlap) |
|---|---|
| **Worker 1 (`security-license-partner-anchor`)** | `src/saas/saas-tier-policy.ts`, `src/saas/partner-webhook-ingestor.ts`, `src/saas/cloud-ledger-anchor.ts`, `test/open-core-saas-monetization.test.ts` |
| **Worker 2 (`transports-queue-relay-ocr`)** | `src/saas/hybrid-edge-sync-queue.ts`, `src/saas/managed-zns-alert-relay.ts`, `src/saas/cloud-ocr-extractor-adapter.ts`, `src/storage/schema-migrations.ts`, `src/storage/schema-migrations-pilot.ts`, `test/saas-advanced-ecosystem.test.ts` |
| **Worker 3 (`verifier-vault-gacc-markets`)** | `src/export/standalone-manifest-verifier.ts`, `src/saas/cloud-vault-backup-connector.ts`, `src/saas/gacc-registry-watch-service.ts`, `src/rules/multi-market-pack-registry.ts`, `test/saas-cloud-connectors.test.ts` |
| **Worker 4 (`licensing-docs-release-gates`)** | `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`, `TRADEMARK-POLICY.md`, `CONTRIBUTING.md`, `SECURITY.md`, `README.md`, `docs/journals/261017-1135-open-core-saas-monetization.md`, `plans/open-core-saas-blueprint/plan.md`, `.github/workflows/ci.yml` |
| **Coordinator (`lead-integration`)** | `src/saas/usage-metering-service.ts`, `src/server/saas-status-handler.ts`, `src/index.ts`, `package.json` |

---

## 4. Phased Implementation Specification

### Phase 1: Cryptographic Licensing, Partner Webhook HMAC & Local Anchor (`Worker 1`)
- **Blockers:** None (root dependency for Phases 2, 3, 5).
- **Risk:** High (Likelihood: Medium, Impact: High — signature or parameter mismatch breaks downstream callers).
- **Mitigation:** Keep `resolveSaasSubscriptionStatus(env = process.env, nowIso = new Date().toISOString(), expectedTenantId?: string)` backward-compatible for 1- or 2-arg callers when `expectedTenantId` is omitted, while failing closed whenever `expectedTenantId` is passed and mismatches.
- **Changes:**
  1. `src/saas/saas-tier-policy.ts:1-151`: Replace SHA-256 symmetric pseudo-signature and `DEFAULT_SIGNING_SECRET` with `node:crypto` Ed25519 `sign`/`verify` (`DURIOS_SAAS_LICENSE_PUBLIC_KEY`). Add `generateEphemeralSaasLicenseKeyPair()`. Enforce `expectedTenantId` fail-closed downgrade (`TENANT_MISMATCH_GRACEFUL_DOWNGRADE`).
  2. `src/saas/partner-webhook-ingestor.ts:1-101`: Use `createHmac("sha256", partnerSharedSecret)` + `timingSafeEqual`. Verify signature and tenant-bound license **before** checking replay map (`lines 59-69`). Key replay map by `${payload.tenantId}:${payload.idempotencyKey}` with canonical payload SHA-256; throw conflict error if same key is replayed with different payload.
  3. `src/saas/cloud-ledger-anchor.ts:1-68`: Remove `DEFAULT_TSA_SECRET` (`line 17`). Require explicit `env.DURIOS_LEDGER_ANCHOR_SIGNING_KEY` (or `env.DURIOS_TSA_SIGNING_SECRET`, $\ge 16$ chars). Use `createHmac("sha256", key)`. Set `anchorScheme: "LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA"`. Verify `expectedTenantId` in both `anchorAuditLedgerHeadToCloud` and `verifyCloudLedgerAnchorReceipt`.
  4. `test/open-core-saas-monetization.test.ts:1-156`: Update to use `generateEphemeralSaasLicenseKeyPair()` and add negative tests (missing public key, wrong public key, wrong `expectedTenantId`, expired key).

### Phase 2: Injectable Transports & SQLite-Persisted Offline Queue (`Worker 2`)
- **Blockers:** Phase 1 (`saas-tier-policy.ts` signature).
- **Risk:** Medium (Likelihood: Medium, Impact: Medium — SQLite migration V6 & file line limits).
- **Mitigation:** Keep migration V6 compact in `src/storage/schema-migrations.ts` (currently 115 lines, well below 179 LOC ceiling).
- **Changes:**
  1. `src/storage/schema-migrations.ts:18-23`: Add `applyMigrationV6(db)` creating `edge_sync_queue` table (`queue_item_id`, `tenant_id`, `dossier_id` UNIQUE, `dossier_code`, `composite_manifest_sha256`, `queued_at`, `status`, `cloud_synced_at`, `cloud_ack_receipt_hash`).
  2. `src/saas/hybrid-edge-sync-queue.ts:19-81`: Support optional `Database` (from `bun:sqlite`) for durable persistence across restarts + injectable `EdgeSyncTransport`. Fail closed on `flushPendingToCloud` if license invalid for `tenantId` or if no transport is provided; only mark `SYNCED_TO_CLOUD` when transport returns `{ ackGranted: true, cloudAckReceiptHash }`.
  3. `src/saas/managed-zns-alert-relay.ts:32-90`: Require injectable `ZnsTransportAdapter` (fail closed if missing or if transport returns `delivered: false`). Enforce `expectedTenantId: request.tenantId`.
  4. `src/saas/cloud-ocr-extractor-adapter.ts:9-89`: Enforce `expectedTenantId` when configured; require explicit injected OCR transport/fixture response; fail closed (`isAvailable === false`, returns `[]`) when unconfigured; preserve `verificationStatus: "DRAFT"`.
  5. `test/saas-advanced-ecosystem.test.ts:1-112`: Add negative path tests (unconfigured ZNS transport throws, failed transport does not decrement quota, SQLite queue survives restart, unauthenticated webhook rejected before replay cache, conflicting webhook payload rejected).

### Phase 3: Standalone Manifest Verifier, Scrypt/AAD Vault, GACC Snapshot & Market Packs (`Worker 3`)
- **Blockers:** Phase 1 (`saas-tier-policy.ts` signature).
- **Risk:** Medium (Likelihood: Low, Impact: High — cryptographic envelope format & regulatory safety).
- **Mitigation:** Keep all functions under 179 LOC and preserve deterministic `CN` compliance behavior.
- **Changes:**
  1. `src/export/standalone-manifest-verifier.ts:18-90`: Validate structural fields of `DossierExportManifest` (reject `GoLiveReadinessReport` or missing fields); set honest `verificationSealBadge: "LOCAL_SHA256_MANIFEST_INTEGRITY_VERIFIED (Not Government or Cloud Attestation)"`.
  2. `src/saas/cloud-vault-backup-connector.ts:1-84`: Replace SHA-256 key derivation (`line 18`) with `scryptSync(clientPassphrase, salt, 32, { N: 16384, r: 8, p: 1 })` + 16-byte random salt (`saltBase64`). Bind `tenantId|envelopeVersion|plaintextManifestSha256` via AES-256-GCM `setAAD`. Require `expectedTenantId` in `decryptCloudVaultBackupEnvelope`. Add `payloadScope: "MANIFEST_METADATA_ONLY_NOT_BLOBS"`.
  3. `src/saas/gacc-registry-watch-service.ts:33-135`: Remove default `DEFAULT_GACC_FEED` parameter from `evaluateGaccRegistryWatch` (export `SYNTHETIC_TEST_GACC_FEED` for tests only; fail closed if caller passes no snapshot or empty snapshot). In `issueCrossBorderBuyerVerificationRoom`, verify `manifest.tenantId` and require explicit `portalBaseUrl` / `env.DURIOS_BUYER_PORTAL_BASE_URL` (fail closed if unconfigured).
  4. `src/rules/multi-market-pack-registry.ts:18-99`: Keep `CN` pack active and free in `COMMUNITY_OPEN_CORE`. Mark `JP`, `KR`, `EU` with `verificationStatus: "UNVERIFIED_EXTERNAL_LEGAL_COUNSEL_REQUIRED"` and fail closed in `getMarketCompliancePack` unless an explicit verified override is provided.
  5. `test/saas-cloud-connectors.test.ts:1-143`: Test scrypt + AAD cross-tenant tamper rejection, missing GACC snapshot fail-closed, unconfigured buyer room fail-closed, and standalone verifier rejecting non-manifest JSON.

### Phase 4: Licensing, MIT Boundary, Governance Docs & CI Hardening (`Worker 4`)
- **Blockers:** None (runs in parallel with Phases 1–3).
- **Risk:** Low (documentation and CI workflow).
- **Mitigation:** Ensure CI checks pass locally before completion.
- **Changes:**
  1. `LICENSE` & `LICENSE-MIT`: Remove non-standard "Single-Site Self-Hosting" restriction (`LICENSE:24`) and any competitive-use restriction incompatible with standard AGPL-3.0-only. Remove `src/export/pilot-dossier-pack-compiler.ts` from the MIT file list (`LICENSE:14`, `LICENSE-MIT:8`) because it depends on AGPL SQLite/auth modules; document the self-contained MIT verifier boundary (`src/domain/types.ts`, `src/domain/iso-6346.ts`, `src/ingestion/document-hasher.ts`, `src/export/manifest-compiler.ts`, `src/export/standalone-manifest-verifier.ts`).
  2. `.github/workflows/ci.yml:18-51`: Pin `bun-version: "1.3.14"`, enforce `bun install --frozen-lockfile` (remove `|| bun install` fallback at `line 23`), add tracked secret/binary `.db`/`.env` hygiene check, and test `bun run verify:manifest` negative/positive exit codes.
  3. `README.md`, `COMMERCIAL-LICENSE.md`, `TRADEMARK-POLICY.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/journals/261017-1135-open-core-saas-monetization.md`, `plans/open-core-saas-blueprint/plan.md`: Update status to reflect **Local Open-Core Foundation In Progress — External SaaS Infrastructure, Live Regulatory Feeds, Legal/CLA & Commercial Gates Pending** (not all 25 blueprint steps complete).

### Phase 5: Usage Estimate Honesty, Server Handler & Final Verification (`Coordinator`)
- **Blockers:** Phases 1–4.
- **Risk:** Low.
- **Changes:**
  1. `src/saas/usage-metering-service.ts:14-88`: Return `0` for `recommendedBillableVnd` when `sealedExportedContainers === 0` (`line 68`), and add `isNonBindingEstimateOnly: true` + `estimateDisclaimer`.
  2. `src/server/saas-status-handler.ts:14`: Pass `actor.tenantId` into `resolveSaasSubscriptionStatus(process.env, new Date().toISOString(), actor.tenantId)`.
  3. `package.json:17`: Point `"verify:manifest"` to `"bun run src/export/standalone-manifest-verifier.ts"`.
  4. `src/index.ts:27-36`: Verify all updated exports compile cleanly.

---

## 5. Backwards Compatibility, Rollback Plan & External Blockers

- **Backwards Compatibility Strategy:**
  - All 21 existing core test suites (84 tests covering HITL, ISO 6346, Cadmium GB 2762-2022 `0.050 mg/kg` statutory / `0.040 mg/kg` internal warning, RBAC tuples, Share Grants, Organic Evidence, Redaction, Site Backup, Go-Live Pack, and Marketplace Dual-Lock) remain 100% unchanged and green.
  - Intentional breaking changes are strictly confined to the new `src/saas/*`, `src/rules/multi-market-pack-registry.ts`, and `src/export/standalone-manifest-verifier.ts` scaffolds to eliminate unsafe default signing secrets and fabricated cloud responses.
- **Rollback Plan:**
  - Each phase is isolated by file ownership; reverting any phase is a clean file-level `git checkout -- <owned-files>` without cascading damage to core workspace, SQLite V1–V5 tables, or HTTP routes.
- **External Non-Code Blockers (Cannot Be Completed in Local Code):**
  1. Production cloud OCR vision backend & credentials (`CloudVisionOcrExtractorAdapter` live endpoint).
  2. Telecom carrier Zalo OA / ZNS contract & template approval (`ManagedSaasZnsAlertRelay` live gateway).
  3. Live GACC / Plant Protection Department regulatory feed integration (`GaccRegistryWatchService`).
  4. External legal counsel verification of `JP`/`KR`/`EU` statutory MRL & phytosanitary schedules (`multi-market-pack-registry.ts`).
  5. RFC 3161 Qualified Timestamping Authority contract (`cloud-ledger-anchor.ts`).
  6. Legal entity incorporation, CLA bot hosting, trademark registration, and commercial pricing sign-off.

---

## 6. Test Matrix & Measurable Success Criteria

| Test Layer | Target Files | Observable Acceptance Criteria |
|---|---|---|
| **Baseline Core Regression (84 tests)** | 21 original `test/*.test.ts` files | `84/84` tests pass untouched; HITL `DRAFT` $\rightarrow$ `HUMAN_VERIFIED` and Cadmium thresholds unchanged. |
| **Unit & Adversarial Security Tests** | `test/open-core-saas-monetization.test.ts`, `test/saas-cloud-connectors.test.ts`, `test/saas-advanced-ecosystem.test.ts` | Ed25519 invalid/missing pubkey/wrong-tenant rejected; unauthenticated webhook rejected before replay lookup; conflicting webhook payload throws; unconfigured ZNS/Sync/OCR/GACC/JP-KR-EU fail closed; Vault scrypt+AAD rejects wrong tenant/passphrase; SQLite sync queue persists across restart. |
| **CLI & Code Quality Gates** | `package.json`, `src/**/*.ts`, `test/**/*.ts` | `bun run typecheck` = 0 errors; `bun test` = 100% green; `bun run verify:manifest` runs `standalone-manifest-verifier.ts` (not `field-auditor-cli.ts`); 0 `.ts` files $> 179$ lines; 0 `any` occurrences. |

---

## 7. Behavioral Checklist Verification
- [x] Explicit data flows documented: what data enters, transforms, and exits each component
- [x] Dependency graph complete: no phase can start before its blockers are listed
- [x] Risk assessed per phase: likelihood x impact, with mitigation for High items
- [x] Backwards compatibility strategy stated: migration path for existing data/users/integrations
- [x] Test matrix defined: what gets unit tested, integrated, and end-to-end validated
- [x] Rollback plan exists: how to revert each phase without cascading damage
- [x] File ownership assigned: no two parallel phases touch the same file
- [x] Success criteria measurable: "done" means observable, not subjective

---

## 8. Execution Progress Log (Phases 1–5 Local Implementation)

- [x] **Phase 1: Cryptographic Licensing, Partner Webhook HMAC & Local Anchor** (`src/saas/saas-tier-policy.ts`, `src/saas/partner-webhook-ingestor.ts`, `src/saas/cloud-ledger-anchor.ts`, `test/open-core-saas-monetization.test.ts`) — Completed & Verified. Ed25519 asymmetric verification enforced, default signing/TSA secrets removed, HMAC timing-safe verification ordered before idempotency lookup.
- [x] **Phase 2: Injectable Transports & SQLite-Persisted Offline Queue** (`src/storage/schema-migrations.ts`, `src/saas/hybrid-edge-sync-queue.ts`, `src/saas/managed-zns-alert-relay.ts`, `src/saas/cloud-ocr-extractor-adapter.ts`, `test/saas-advanced-ecosystem.test.ts`) — Completed & Verified. SQLite migration V6 created, sync queue durable across restart, transports fail closed.
- [x] **Phase 3: Standalone Manifest Verifier, Scrypt/AAD Vault, GACC Snapshot & Market Packs** (`src/export/standalone-manifest-verifier.ts`, `src/saas/cloud-vault-backup-connector.ts`, `src/saas/gacc-registry-watch-service.ts`, `src/rules/multi-market-pack-registry.ts`, `test/saas-cloud-connectors.test.ts`) — Completed & Verified. Standalone verifier operational, scrypt + AAD vault sealing enforced, GACC synthetic default removed, JP/KR/EU external counsel gate active.
- [x] **Phase 4: Licensing, MIT Boundary, Governance Docs & CI Hardening** (`LICENSE`, `LICENSE-MIT`, `.github/workflows/ci.yml`, README/governance files) — Completed & Verified. AGPL-3.0-only clarity established, MIT subset bounded, CI frozen lockfile and secret hygiene checked.
- [x] **Phase 5: Usage Estimate Honesty, Server Handler & Final Verification** (`src/saas/usage-metering-service.ts`, `src/server/saas-status-handler.ts`, `package.json`) — Completed & Verified. Zero-container billing zeroed with non-binding disclaimer, tenant context passed to subscription resolver, `verify:manifest` script corrected.
