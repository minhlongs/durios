# Phase 3 — Edition Manifest, Blueprint & Docs Sync

**Priority:** P2 | **Status:** Ready | **Depends on:** Phase 2

## Overview
Register the new commercial module, mark revenue Layer 6 in the 25-step auditor, and keep
the bilingual evidence trail honest about what is Hypothesis vs Verified.

## Files
- Modify: `src/saas/open-core-edition-manifest.ts` — add MOD-ENT-03
- Modify: `src/saas/blueprint-25-step-auditor.ts` — Layer 6 status
- Modify: `plans/company-blueprint/tasks.md` — add Layer 6 row with evidence label

## Implementation Steps
1. Add module: `{moduleId:"MOD-ENT-03", name:"Trade-Finance & Marine Insurance Verified Dossier API", pathPattern:"src/saas/financial-attestation-token.ts, src/server/financial-verification-handler.ts", edition:"EXPORTER_ENTERPRISE", license:"Commercial-Ed25519", zeroLockInGuarantee:true, description:"Single-use signed attestation lets banks and insurers verify a sealed dossier without account creation; commercial pricing stays redacted."}`
2. Keep `economicTruth` untouched — no revenue number becomes `Verified` by shipping code.
3. Add a `[IN_PROGRESS]` row (not `[COMPLETED]`) with explicit `Hypothesis` label for demand.

## Todo
- [ ] MOD-ENT-03 registered and asserted by a manifest test
- [ ] Blueprint row added with Honest evidence label
- [ ] `.mekong/company.json` untouched unless a gate actually changes

## Success Criteria
- `GET /api/v1/open-core/edition-manifest` includes MOD-ENT-03 for enterprise edition only.
- Community edition response does not contain the new entitlement.
- No doc claims a bank has signed or revenue has arrived.

## Risks
- Documentation drift toward optimism. Mitigation: every new row carries its evidence label.
