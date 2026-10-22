# Revenue Layer 6 Phase 1 — Financial Verification Room Implementation Report

**Date:** 2026-10-22
**Repo:** `/Users/macbook/durios` @ `main` (working tree, uncommitted)
**Scope:** Layer 6 Phase 1 (signed single-use attestation) + `--ship` bookkeeping.

## Outcome

Layer 6 Phase 1 is implemented, wired, and verified. A bank or marine insurer can now verify one
redacted sealed dossier by presenting a signed 15-minute single-use token to a **public
pre-authentication** route, with **no account and no RBAC change**. All four planned artifacts
exist, plus the migration and helper modules the plan did not anticipate. Commercial fields
(invoice value, buyer name, contact, exporter margin, payment terms) and blob storage paths are
stripped before the response leaves the server — asserted over real HTTP, not assumed.

Evidence labels, per the plan's own mandate:

- `Verified`: the code below exists and passes tests in this repository.
- `Hypothesis`: that any bank or insurer pays for this. Nothing here is revenue.

## Gates (all run fresh in this session)

| Gate | Command | Result |
|---|---|---|
| Types | `bun run typecheck` | exit 0, 0 errors |
| Full suite | `bun test` | **160 pass / 3 fail** |
| Deep audit | `bun run src/saas/blueprint-cli.ts --deep` | `GO_OPEN_CORE_SAAS`, `GO_2027_UI_UX_STANDARDIZED` (26/26), `GO_MODULAR_ZERO_ANY_VERIFIED` |
| Modularity | max src LOC | **100** (ceiling 100) |
| Modularity | max test LOC | **100** (ceiling 100) |
| Untyped casts | `: any` count | **0** |
| Blueprint | `bun run blueprint:verify-25-steps` | 25/25, "Overall Passed: YES (100%)" |
| Secrets | CI guard on `.env.example` | pass (unchanged from `8a17e69`) |

### The 3 failures are pre-existing and environmental, not regressions

All three are the same root cause: **this sandbox refuses every TCP port bind**, so tests that
spawn a real server process cannot pass. Proven by stashing all of this session's work and running
them on a clean `HEAD` — they fail identically there:

| File | Failure | Cause |
|---|---|---|
| `test/adversarial-verification.test.ts` | 127.0.0.1 bind | Port bind refused by sandbox |
| `test/process-restart-persistence.test.ts` | spawn + restart (2 cases) | Same — spawns a child server process |

These are **option C** from this session, which cannot be executed here by construction. Run
outside the sandbox to close them.

## Files

### Created (9)

| File | LOC | Role |
|---|---|---|
| `src/saas/financial-attestation-codec.ts` | 66 | Payload types, canonical JSON, HMAC sign, constant-time compare, token split |
| `src/saas/financial-attestation-token.ts` | 78 | Mint, parse, verify (signature + expiry + skew) |
| `src/saas/financial-attestation-service.ts` | 76 | Owner-gated mint + atomic single-use nonce burn |
| `src/server/financial-verification-request.ts` | 42 | Body parsing and input validation |
| `src/server/financial-verification-view.ts` | 82 | Redacted view, seal verdict, token redemption |
| `src/server/financial-verification-context.ts` | 24 | `WorkspaceLike` + lazy service factory |
| `src/server/financial-verification-handler.ts` | 74 | Two endpoints (mint, verify) |
| `src/storage/schema-migrations-share-purposes.ts` | 45 | Migration V6 |
| `test/financial-attestation-token.test.ts` | — | 8 tests: forge, tamper, expire, skew, malformed |
| `test/financial-attestation-service.test.ts` | — | 7 tests: mint, replay, owner gate |
| `test/financial-verification-http.test.ts` | — | 5 tests over real HTTP |
| `test/helpers/financial-verification-http-fixtures.ts` | — | Constants + request builders |
| `test/helpers/financial-verification-http-app.ts` | — | App lifecycle + rival-tenant seeder |

### Modified (6)

| File | Change |
|---|---|
| `src/domain/pilot-types.ts` | `SharePurpose` += `TRADE_FINANCE`, `MARINE_INSURANCE` |
| `src/storage/schema-migrations.ts` | Register V6 |
| `src/server/http-router.ts` | Public pre-auth verify route + authenticated mint route |
| `src/saas/open-core-edition-manifest.ts` | Register `MOD-ENT-03` |
| `.env.example` | Document the secret (was undocumented — real gap) |
| `test/helpers/organic-5a4-v4-migration-scenario.ts` | V5→V6 migration assertion |

## A blocker the plan did not anticipate: the database rejected the new purposes

The plan says to add `TRADE_FINANCE` and `MARINE_INSURANCE` to `SharePurpose` and move on. That
would have compiled and passed every test that touches only the TypeScript union — then **failed
at runtime** on the first real grant, because `schema-migrations-pilot.ts` defines:

```sql
purpose TEXT NOT NULL CHECK (purpose IN ('CUSTOMS_INSPECTION','BUYER_VERIFICATION','AUDIT','LOGISTICS'))
```

SQLite enforces that `CHECK` on every insert. Layer 2 is therefore **not** shippable with the plan's
file list alone. V6 was required.

`applyMigrationV6` rebuilds `share_grants` with the widened constraint and copies rows across,
matching the existing V5 idiom (table → new → INSERT SELECT → DROP → RENAME → re-index), inside one
transaction. Verified all three properties in a scratch harness before wiring it: an existing
`LOGISTICS` grant **survives** (1 row before, 1 row after), `TRADE_FINANCE` is **accepted**, and an
unknown purpose such as `RANDOM_NEW` is still **rejected** — the constraint was widened, not removed.

## What the tests actually prove

The redaction claim is the product, so it is asserted directly against the HTTP response body:
every expensive key must be `undefined`, as must `storagePath` and `storage_path`. Replay is
asserted as HTTP 401 with reason `ATTESTATION_ALREADY_REDEEMED`. Forgery is asserted to return no
`data` at all. Cross-tenant minting is asserted to fail against a manager seeded under a distinct
tenant.

Two bugs in my own first draft were caught and fixed here: `readJsonObject` had an inverted
condition that discarded valid object bodies and accepted arrays, and the burn check was separate
from the burn, which would let two concurrent verifications both succeed. The nonce claim is now a
single atomic operation.

## Two defects in the working tree that predate this session and are NOT mine

Both are already committed at `dfe349d`.

1. **`plans/company-blueprint/tasks.md` was corrupted at `dfe349d`, and this session repaired it.**
   HEAD contained a literal `PLACEHOLDER_CONTINUE` marker at line 71 followed by a stale duplicate
   of Steps 1–7, so the 25-step auditor matched **32 step markers instead of 25** and reported a
   false completion count. The repair removed exactly those 30 corrupt lines and nothing else — the
   diff is a pure deletion, and the auditor now counts 25 again. This is why the earlier report's
   "145 pass" figure could not be reproduced: it was measured against the already-damaged file.

2. **`.mekong/company.json` and several `plans/reports/*` files carry edits from another session.**
   The `company.json` changes are improvements — the LOC ceiling was corrected from 179 to the 100
   now enforced, and CAC/LTV/retention are honestly marked unmeasured. I verified both against
   source and left them in place rather than silently reverting work I did not author. They are
   **not** in this commit.

## Verification I could not complete

- The 3 port-binding tests above. Environmental; need one unsandboxed run.
- A live call against a real bank or insurer. The code path is proven; the commercial premise is
  not, and this report does not claim it is.

## Layer 2 remains blocked, correctly

`FINANCIAL_INSTITUTION` tenant + RBAC tuples is still `[BLOCKED_BY_GATE]`: a paying pilot plus legal
clearance under Luật 91/2025/QH15 plus a signed GATE-01 DPA. Phase 1 deliberately required none of
that, which is why it could ship.

Layer 6 commercial-module registration is now **done**: `MOD-ENT-03` appears in
`GET /api/v1/open-core/edition-manifest` under `EXPORTER_ENTERPRISE`.

## Unresolved questions

1. Who owns repairing the corrupted `tasks.md`? The 32-step miscount makes the 25-step auditor
   over-report completion, and the plan's own evidence table is now measured against a broken file.
2. Should the 281-packhouse × 60M VND = $657,643 ARR figure continue to be reported as the sole
   revenue baseline in `.mekong/company.json`, given it is now stated more conservatively?
3. Is the 17-minute window between token mint and first verification adequate, or should the TTL be
   configurable per purpose?
