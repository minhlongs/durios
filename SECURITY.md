# Security Policy (`SECURITY.md`)

## 1. Local Loopback Threat Model & Security Boundaries
DuriOS is a local-first export dossier preparation workspace engineered around explicit fail-closed boundaries:
- **Loopback-First On-Premises Binding (`GATE-03`):** The local HTTP server binds strictly to `127.0.0.1` by default and refuses public unencrypted interface binding unless an explicit reverse-proxy TLS override is configured.
- **Tamper Detection vs. Disk-Level WORM:** All SHA-256 document digests (`sha256Hash`) and hash-chain audit ledger events (`AuditLedger`) are computed on the server. Client-supplied hashes or forged identity headers (`x-actor-*`) are never trusted. Note that a local SQLite SHA-256 hash chain detects unauthorized row edits when compared against an external reference digest, but does not prevent a privileged local OS administrator with full disk write access from rewriting the entire local SQLite file and recomputing hashes unless anchored externally.
- **Fail-Closed Authentication & SaaS Connectors (`5A-1`, `GATE-02` & `src/saas/`):** Unauthenticated requests fail closed with HTTP `401`. Unconfigured OTP channels fail closed with HTTP `503`. SaaS connectors (`src/saas/`) verify asymmetric Ed25519 license signatures (`DURIOS_SAAS_LICENSE_PUBLIC_KEY`) and tenant binding (`expectedTenantId`), failing closed or gracefully downgrading to `COMMUNITY_OPEN_CORE` when keys or transports are missing.
- **Dual-Locked B2B Marketplace (`Prompt 6A`):** Multi-party marketplace and non-custodial escrow coordination remain locked by default (`403 FEATURE_LOCKED_PENDING_PILOT_SIGN_OFF`) unless both `DURIOS_FEATURE_B2B_MARKETPLACE=enabled` and all 5 pilot launch gates (`GATE-01`..`GATE-05`) are verified.

## 2. Reporting a Vulnerability (Best-Effort Maintainer Triage)
Please **do not** open a public GitHub issue for security vulnerabilities, authentication bypasses, cross-tenant isolation flaws, or hash-chain integrity bugs.

Instead, report suspected vulnerabilities privately to the repository maintainers via GitHub Security Advisories (Private Vulnerability Reporting) with:
1. Affected file path and line number (`src/...`).
2. Minimal deterministic reproduction test case (using synthetic data only — never include real customer PII or production credentials).
3. Impact assessment on tenant isolation, RBAC, or SHA-256 manifest integrity.

**Triage Policy:** This open-core repository is maintained on a **best-effort basis** without a formal commercial 24/7 incident response SLA. Maintainers review private vulnerability reports on a best-effort basis, prioritize verified issues affecting authentication, tenant isolation, or cryptographic integrity, and publish regression tests alongside fixes.
