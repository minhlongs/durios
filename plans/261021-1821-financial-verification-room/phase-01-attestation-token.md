# Phase 1 — Signed Single-Use Attestation Token

**Priority:** P1 | **Status:** Ready | **Depends on:** none

## Overview
Mint and verify `DURIOS_ATT.<payload>.<hmac-sha256>` attestation tokens scoped to one
dossier, one purpose, one use, with a hard TTL. Fail closed on every violation.

## Key Insights
- `src/saas/partner-webhook-ingestor.ts` already proves the house pattern: canonical
  JSON -> sorted keys -> HMAC-SHA256 -> hex. Reuse, do not reinvent.
- Single-use burning mirrors its `processedKeys` idempotency map.
- Tier gating uses `resolveSaasSubscriptionStatus(env, nowIso, tenantId)` exactly like
  `cloud-ledger-anchor.ts` does, and degrades to community on invalid license.

## Requirements
- Payload: `{dossierId, tenantId, purpose, issuedAtIso, expiresAtIso, nonce}`
- Purpose restricted to `TRADE_FINANCE` | `MARINE_INSURANCE`
- Expiry <= 15 minutes, configurable via `DURIOS_FINANCIAL_ATTESTATION_TTL_MINUTES`
- Secret from `DURIOS_FINANCIAL_ATTESTATION_SECRET`, min 16 chars, no default
- Edition must be `EXPORTER_ENTERPRISE` for minting

## Architecture
Pure functions + one small in-memory burner class. No SQLite writes (replay protection
lives in-process for Phase 1; Phase 2 may persist).

## Files
- Create: `src/saas/financial-attestation-token.ts` (target <= 95 LOC)
- Create: `test/financial-attestation-token.test.ts` (target <= 95 LOC)
- Modify: `src/domain/pilot-types.ts` — extend `SharePurpose` union

## Implementation Steps
1. Add `TRADE_FINANCE` and `MARINE_INSURANCE` to `SharePurpose` in
   `src/domain/pilot-types.ts` (the union is 4 members today; keep it readable).
2. Create `FinancialAttestationPurpose` type alias limited to the two new values.
3. Implement `canonicalAttestationString(payload)` — sorted-key JSON, matching
   `buildCanonicalPartnerWebhookPayload` style.
4. Implement `mintFinancialAttestation({dossierId, tenantId, purpose}, env, nowIso)`.
5. Implement `verifyFinancialAttestation(token, {expectedDossierId, expectedTenantId, purpose}, env, nowIso)`
   returning a discriminated result:
   `{status:"VALID", dossierId, purpose} | {status:"REJECTED", reason: AttestationRejectionReason}`.
6. Implement `FinancialAttestationBurner` with `burn(tokenDigest)` + `assertNotBurned(tokenDigest)`.
7. Rejection reasons: `MALFORMED`, `TENANT_MISMATCH`, `PURPOSE_MISMATCH`, `EXPIRED`,
   `INVALID_SIGNATURE`, `INSUFFICIENT_EDITION`, `ALREADY_CONSUMED`.

## Todo
- [ ] Extend `SharePurpose` union
- [ ] Implement canonical serialization
- [ ] Implement mint
- [ ] Implement verify (fail closed on every branch)
- [ ] Implement burner
- [ ] Unit tests: each rejection reason + happy path

## Success Criteria
- Every rejection reason has a dedicated test asserting no dossier payload is returned.
- Tampered signature, wrong tenant, wrong purpose, expired, and replay all rejected.
- No `any`; `noImplicitAny` + `exactOptionalPropertyTypes` clean.

## Risks
- Revealing *which* reason rejected a token is safe (no dossier data), but do not echo
  the dossierId back on `INVALID_SIGNATURE` — attacker-controlled input.
- TTL too long widens the leak window if a QR is screenshotted; 15 min default.

## Security Considerations
- `timingSafeEqual` for signature comparison (constant-time), same as existing HMAC code.
- Never log the secret; never log full token (digest only).
