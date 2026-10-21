# Phase 2 — Public Financial Verification Endpoint

**Priority:** P1 | **Status:** Ready | **Depends on:** Phase 1

## Overview
Expose `POST /api/v1/open-core/financial-verification` as a pre-authentication route that
accepts an attestation token and returns a redacted dossier plus a cryptographic seal
verdict. Banks send no credentials.

## Key Insights
- `src/server/http-router.ts:33` already routes `/api/open-core/verify-iso-and-manifest`
  BEFORE `resolveAuthenticatedActor`. This is the exact precedent to copy.
- `redactDossierForActor` (`src/sharing/dossier-redactor.ts:51`) already returns a
  redacted clone for non-owners; `ALWAYS_REDACTED_KEYS` strips invoice value, buyer name,
  exporter margin and customs broker fee. A bank sees provenance, not pricing.
- Seal verdict comes from `verifyExportManifest` (`src/export/standalone-manifest-verifier.ts`).

## Requirements
- `GET` (query param) and `POST` (JSON body) both supported, mirroring the ISO handler.
- Request: `{attestation, containerNumber?, manifest?}`. Attestation is required.
- Response: `{success, verification: {attestationStatus, purpose, dossier: REDACTED, sealVerdict}}`.
- Seal check runs only if a manifest is supplied; absent manifest => `NOT_SUPPLIED` verdict,
  never a false failure.

## Architecture
One handler file <= 95 LOC. Router change is 1 line. No workspace mutation — read-only.

## Files
- Create: `src/server/financial-verification-handler.ts`
- Create: `test/financial-verification-handler.test.ts`
- Modify: `src/server/http-router.ts` — one pre-auth route line
- Modify: `src/sharing/dossier-redactor.ts` — quantity visibility for finance purposes

## Implementation Steps
1. Extend `canViewQuantities` in `dossier-redactor.ts` to include
   `TRADE_FINANCE` | `MARINE_INSURANCE` (bank needs weight/box count to value collateral).
2. Build handler: verify token -> assert not burned -> burn -> fetch dossier.
3. Construct a synthetic actor (tenant = bank, purpose-scoped) so the existing redactor
   path can be reused rather than duplicated.
4. If manifest supplied, run `verifyExportManifest` and map to a seal verdict object.
5. Map every rejection to `400`/`403` with NO dossier content in the body.
6. Add the route before the auth resolution line in `http-router.ts`.

## Todo
- [ ] Redactor quantity visibility for finance purposes
- [ ] Handler with burn-order correct (verify -> assert -> burn)
- [ ] Router pre-auth route
- [ ] Tests: no token, bad token, replay, valid + no manifest, valid + bad manifest

## Success Criteria
- Replay of a consumed token returns the same rejection the second time.
- Response never contains `invoice_value`, `buyer_name`, `exporter_margin`,
  `customs_broker_fee` (assert on the serialized JSON, not just the object).
- `GET` without manifest yields `NOT_SUPPLIED`, not an error.

## Risks
- Burn-order bug: burning before verifying turns a bad token into a consumed good token.
  Verify first, always.
- If redaction changes are careless, a bank could see rival pricing — the single
  highest-severity failure in this phase.

## Security Considerations
- No dossier-id enumeration: unknown dossier returns the same shape as a rejected token.
- Rate limiting left to existing `src/server/tenant-rate-limiter.ts` in Phase 2.
