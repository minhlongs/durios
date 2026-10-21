---
title: "Financial Verification Room — Signed Single-Use Attestation (Phase 1)"
description: "Enable banks & marine insurers to verify a sealed DuriOS dossier via a signed single-use attestation token, without creating bank accounts or expanding RBAC."
status: ready_for_review
priority: P1
effort: 2h
branch: main
tags: [open-core, revenue-layer-6, exporter-enterprise, phase-1, loc-ceiling-95]
created: 2026-10-21
---

# Financial Verification Room (Phase 1)

## Business Context

DuriOS revenue Layer 6 (trade-finance & marine-cargo-insurance verified dossier API) is the
only layer that reaches customers outside the 281-packhouse ceiling. Pure-VN-SaaS revenue
caps at $657,643 ARR; Layer 6 is the wedge that breaks it.

**Evidence labels (mandatory):**
- `Verified`: code/artifacts present in this repo.
- `Hypothesis`: requires customer validation.
- `Target`: directional goal.

The revenue number itself is **Hypothesis** — no bank has committed. Nothing in this phase
promises revenue.

## Verified Foundations Reused

| Component | File | Status |
|---|---|---|
| Sealed manifest compiler | `src/export/manifest-compiler.ts` | Verified |
| Offline verifier SDK | `src/export/standalone-manifest-verifier.ts` | Verified |
| Redacted cross-tenant view | `src/sharing/dossier-redactor.ts` | Verified |
| Share grants w/ purpose + expiry | `src/sharing/share-access-manager.ts` | Verified |
| HMAC partner signing | `src/saas/partner-webhook-ingestor.ts` | Verified (pattern) |
| Cloud ledger anchor | `src/saas/cloud-ledger-anchor.ts` | Verified (pattern) |
| Unauthenticated public route example | `src/server/http-router.ts:33` | Verified — routes BEFORE auth |
| Edition gating + graceful downgrade | `src/saas/saas-tier-policy.ts` | Verified |

## Architectural Decision

**Chosen: signed single-use attestation (Phase 1).** Not new tenant accounts.

Why: `TenantType` (`src/domain/types.ts`) has only 4 members and `ALLOWED_IDENTITY_TUPLES`
(`src/auth/rbac-policy.ts:21`) has only 4 personas. Adding `FINANCIAL_INSTITUTION` would
touch the exact code that prevents cross-tenant dossier reads — a security-critical path
where a mistake leaks a competitor's pricing. Phase 1 needs no RBAC change at all.

Phase 1 mechanism:
1. Packhouse MANAGER/ADMIN requests an attestation for a specific dossier.
2. Server mints `DURIOS_ATT.<payload>.<hmac-sha256>` (single-use, TTL 15 min, purpose-scoped).
3. Bank POSTs it to `/api/v1/open-core/financial-verification` (public, pre-auth route).
4. Server validates signature + expiry + single-use replay guard, then returns the
   **redacted** dossier view plus a cryptographic seal verdict.

The bank never gets an account; the packhouse never exposes raw commercial fields
(`ALWAYS_REDACTED_KEYS` already strips invoice value, buyer name, exporter margin).

## Phase 2 Deferred (explicitly out of scope now)

`FINANCIAL_INSTITUTION` tenant type + `TRADE_FINANCE` / `MARINE_INSURANCE` share purposes +
RBAC tuples. Only after Phase 1 has a paying pilot and legal clearance.

## Files

### Create
- `src/saas/financial-attestation-token.ts` — mint/verify single-use HMAC token
- `src/server/financial-verification-handler.ts` — public endpoint handler
- `test/financial-attestation-token.test.ts` — unit tests
- `test/financial-verification-handler.test.ts` — handler/replay tests

### Modify
- `src/domain/pilot-types.ts` — add `TRADE_FINANCE`, `MARINE_INSURANCE` to `SharePurpose`
- `src/sharing/dossier-redactor.ts` — allow quantity visibility for these purposes
- `src/server/http-router.ts` — add pre-auth public route
- `src/saas/open-core-edition-manifest.ts` — register module MOD-ENT-03
- `src/saas/blueprint-25-step-auditor.ts` — mark Layer 6 step

## Constraints
- Hard ceiling: **<= 95 LOC per file** (project-wide standard; current max = 99 pre-wave, 0 files >100).
- Zero `: any`, zero `console.log`, `exactOptionalPropertyTypes` respected.
- Existing API contracts unchanged; nothing deleted.
- `bun run typecheck` exit 0; `bun test` all 36+ suites pass.
- No secrets in code — key from `DURIOS_FINANCIAL_ATTESTATION_SECRET` (min 16 chars).

## Success Criteria
1. Forged/expired/replayed/missing-purpose tokens all fail closed (no dossier data leaked).
2. Valid token returns redacted dossier + seal verdict; commercial fields absent.
3. Community edition degrades gracefully (no silent Pro unlock).
4. Module visible in `GET /api/v1/open-core/edition-manifest`.
5. All tests green; typecheck clean; no file > 95 LOC.

## Risks
- **Trust, not tech**: packhouses must believe a rival cannot read their pricing. Mitigated by reusing the existing redactor — must be demonstrated, not assumed.
- **Legal (Hypothesis)**: sharing dossier data with a bank engages Luật 91/2025/QH15 — the same law behind GATE-01. Legal review required before selling; not resolved by code.
- **Edition placement**: `EXPORTER_ENTERPRISE` chosen because counterparties are external institutions, not single packhouses. Revisit if a pilot wants it bundled in Pro.

## Security Notes
- Replay guard is mandatory; without it a leaked QR is a permanent dossier read.
- Single-use tokens are burned on first successful verification (same idempotency pattern as `partner-webhook-ingestor.ts`).
- Route must sit BEFORE `resolveAuthenticatedActor` so banks need no credentials.
