# Technical Journal — 2026-10-17: Open-Core Public GitHub & SaaS Monetization Architecture

- **Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING`
- **Hardening & Remediation Plan Reference:** `/Users/macbook/durios/plans/261017-open-core-hardening/plan.md`
- **Blueprint Reference:** `/Users/macbook/durios/plans/open-core-saas-blueprint/plan.md`

## Summary & Audit Remediation Status
Prior blanket claims that all 25 steps of `plans/open-core-saas-blueprint/plan.md` were complete were inaccurate and have been superseded by `/Users/macbook/durios/plans/261017-open-core-hardening/plan.md`. Current status is `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING`, separating the verified **Local Open-Core Scaffold** from **External Gates Pending**:

1. **Implemented in Local Open-Core Scaffold:**
   - **Dual-License & Governance Artifacts (`LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`, `TRADEMARK-POLICY.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/workflows/ci.yml`):**
     - Reconciled exact MIT-licensed module list across `LICENSE` and `LICENSE-MIT` to self-contained verification/hashing/ISO modules plus canonical GNU Affero General Public License v3.0 (`AGPL-3.0-only`) text in `LICENSE`.
     - Hardened `.github/workflows/ci.yml` with pinned `bun-version: "1.3.14"`, strict `bun install --frozen-lockfile`, and secret/database hygiene guards.
   - **Fail-Closed Local SaaS Boundary & Connector Scaffolds (`src/saas/`, `src/rules/`, `src/export/`):**
     - Asymmetric Ed25519 license verification (`DURIOS_SAAS_LICENSE_KEY` + `DURIOS_SAAS_LICENSE_PUBLIC_KEY`) with mandatory `expectedTenantId` binding and automatic graceful downgrade to `COMMUNITY_OPEN_CORE`.
     - Partner webhook HMAC-SHA256 verification before replay lookup (`partner-webhook-ingestor.ts`), local HMAC ledger receipt (`LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA`), SQLite-persisted offline sync queue (`edge_sync_queue`), `scrypt` + AES-256-GCM AAD-bound backup manifest envelope (`MANIFEST_METADATA_ONLY_NOT_BLOBS`), explicit GACC snapshot & buyer portal base URL in `gacc-registry-watch-service.ts`, `CN` `0.040 mg/kg` internal Cd buffer + fail-closed `JP`/`KR`/`EU` packs, and non-binding usage estimates (`0 VND` at `0` exported containers).
     - Test Suite status: `106/106` tests passing, `0` TS errors, `<= 179` LOC per file, `0 any` types.

2. **External Gates Pending (Cannot Be Completed in Local Code Alone):**
   - **Cloud Gateway:** Production Cloud Vision OCR endpoint and hosted off-site backup storage infrastructure.
   - **eSMS / Zalo ZNS Telecom Contract:** Carrier contract registration, Zalo Official Account verification, and ZNS template approval.
   - **Official Legal / GACC Feed & RFC 3161 TSA:** Live GACC / Plant Protection Department registry feed synchronization and qualified RFC 3161 Timestamping Authority integration.
   - **External Legal Counsel Review:** Statutory verification of `JP`, `KR`, and `EU` MRL/phytosanitary rule packs (currently fail-closed as `UNVERIFIED_EXTERNAL_LEGAL_COUNSEL_REQUIRED`), formal trademark registration, and automated CLA bot deployment.
