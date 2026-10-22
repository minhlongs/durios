# DuriOS Blueprint Refresh — Cook Run Report

**Command:** `/ak:cook` — "Làm mới blueprint DuriOS theo /idea" with `--auto --ship`
**Date:** 2026-10-22
**Repo:** `/Users/macbook/durios`, branch `main`
**Scope:** three blueprint output files only. No source-code change was made.

## Outcome

All three blueprint outputs were refreshed against live evidence dated 2026-10-22, and every
verification gate the task asked for passes: `blueprint:verify-25-steps` reports 25/25 with all
artifacts present, the deep audit keeps 15/15 turns and `GO_MODULAR_ZERO_ANY_VERIFIED`,
`bun run typecheck` exits 0, the full test suite is 165 pass / 0 fail, and `git diff --check`
is clean.

## What changed

**`.mekong/company.json`** — kept every existing key and the five `next_steps` the test asserts.
Updated `target_arr` (now states the 428-site requirement and that CAC/LTV/margin are
unmeasured), `icp` (names the buyer and the operator, records the founder site approval of
2026-10-17 and the 03/09/2026 publication date for the 281 figure), and `agents` (the stale
`<= 179 LOC` claim is replaced with the enforced 100-LOC ceiling, and revenue/legal roles now
record that no contract, revenue or retention data is verified). `okrs` and `next_steps` were
rewritten so the quarter's goal is *verify the gate file* and *close GATE-01/GATE-02* rather
than asserting all five gates are passed. All pre-existing keys and the `/edition-manifest`
endpoint are preserved.

**`plans/company-blueprint/plan.md`** — rewritten from 85 to 456 lines. Each of the 25 steps now
carries the three layers the task specified (Business / Agentic / Governance), an evidence
source line, a current-status line, and a next action. Step 4 documents each launch gate with
its own status, and step 4 plus step 24 carry the one-time-revenue separation, the Bear/Base/
Bull scenarios with deployment, support, hardware and OTP/OCR cost categories, and the
explicit statement that CAC, LTV and subscription margin are not measurable yet.

**`plans/company-blueprint/tasks.md`** — rewritten from 97 to 227 lines. All 25 checklist
markers keep the `- [x] **Step N: ` shape the auditor matches, and now carry an honest
execution-status label. Added the five execution priorities as a table with owner, dependency
and definition of done; a separate follow-up section for tool fixes (Revenue Layer 6
completion, real-device OTP and backup verification, manifest caller audit) so those are not
mistaken for priorities; a blocking-conditions section; and a market-source table.

## Verification gates

| Gate | Command | Result |
|---|---|---|
| Blueprint | `bun run blueprint:verify-25-steps --json` | 25/25 completed, allArtifactsPresent true, overallPassed true |
| Deep audit | `bun run blueprint:verify-25-steps --deep` | 15/15 turns, `GO_MODULAR_ZERO_ANY_VERIFIED`, maxSrcLoc/maxTestLoc = 100, any = 0, UI/UX 100/100 |
| Contract tests | `bun test` | 165 pass, 0 fail, 3628 assertions, across 39 files |
| Typecheck | `bun run typecheck` | exit 0 |
| Whitespace | `git diff --check` | clean |
| JSON | `.mekong/company.json` parsed | valid; `name=DuriOS`, `stage=zero`, 5 `next_steps`, manifest endpoint retained |

## Evidence findings that shaped the labels

The gate verifier in `src/auth/pilot-launch-gate-verifier.ts` is fail-closed and demands real
artifacts, so the honest reading of each gate is: GATE-01 pending signed-consent file; GATE-02
adapter ready but failing closed to 503 without provider credentials; GATE-03 runbook and
config verified; GATE-04 verified only in staging tests; GATE-05 proven only on the seeded
rehearsal in `src/auth/pilot-rehearsal-seeder.ts`, not on a real field drill. No signed
contract, revenue, paying customer or retention data exists anywhere in the repository, so
every commercial claim of that kind is labelled `[Chưa được xác minh]`.

Two arithmetic points were corrected while writing: reaching $1M ARR at 60.000.000 VND/year
requires 427,28 sites, which rounds up to **428** (a fraction of a site cannot be sold) rather
than the 427 previously written; and the 281-packhouse figure is sourced to the Ministry of
Agriculture and Environment announcement of **03/09/2026** at the regular government press
conference, with its scope stated as active durian packing facilities nationwide.

## Cross-file review

Every business claim in the three files now either cites a file path or carries a hypothesis
label; the 25/25 verdict is described in all three as artifact coverage only; and every
condition that still needs real data is stated as requiring all five gates first.

## Unresolved questions

- The `25/25` verdict remains a documentation-coverage check by design. Making it also require
  behavioural evidence would mean changing `src/saas/blueprint-25-step-auditor.ts`, which is
  outside the authorized three-file scope. This is now stated in both markdown files instead
  of being silently implied.
- The concurrent sessions active in this repository staged and rewrote parts of the blueprint
  files while this work was in progress. The three files were re-verified directly from disk at
  the end of the run and are correct as reported, but a commit should confirm that state.
- No commit was made. Other sessions have staged work in this tree, so committing would mix
  their in-progress changes into this task's commit.

## Journal

No opt-out was passed and the resolved preference is the default (auto), so the journal step
applies. No durable decision emerged from this run that is not already recorded in the three
blueprint files themselves; the call to make `blueprint:verify-25-steps` behave as a
behavioural gate is a founder decision recorded as an unresolved question above.

## Security review of the concurrent Revenue Layer 6 code

An automated background review flagged three medium-severity issues in
`src/server/financial-verification-view.ts` and
`src/server/financial-verification-handler.ts`. Those files belong to the concurrent
Revenue Layer 6 work and are outside this task's three-file scope, so none were modified.
Each finding was verified against the source before judging it.

**1. Empty-string secret fallback (`DURIOS_FINANCIAL_ATTESTATION_SECRET ?? ""`).**
Not exploitable, and confirmed empirically rather than by reading alone. Minting with the
variable unset throws `"Financial attestation secret must be at least 16 characters."`
because `assertUsableSecret` in `financial-attestation-codec.ts` rejects any secret under 16
characters before an HMAC is ever computed. The verify path throws identically, and
`handleVerifyFinancialAttestation` catches it and returns HTTP 400. So the fallback never
produces a signature computed over an empty string; the path fails closed. The `?? ""` is a
type-checker convenience sitting in front of a real guard one call deeper.

**2. Missing caller-to-token tenant binding (IDOR / cross-tenant).**
Already defended, in two places. The mint handler
(`handleMintFinancialAttestation`) asserts a valid actor and refuses when
`dossier.tenantId !== actor.tenantId`, so a cross-tenant mint is blocked before a token
exists; `AssertOwnerManagementRole` enforces the same tenant match plus a MANAGER or ADMIN
role. The verification path then reads the dossier by the token's own `dossierId`, not by a
caller-supplied one. The suggested fix — binding the caller's identity to the token's
`institutionTenantId` — is a sound hardening for when `FINANCIAL_INSTITUTION` becomes a real
authenticated tenant in Layer 6 Phase 2, but today that tenant is deliberately modelled as a
cross-tenant viewer with no share grant, which is exactly what the redactor strips for. No
change made.

**3. Specific failure reasons returned to the caller.**
Real but low severity, and left as-is deliberately. `verifyAndRedeemToken` returns reasons
such as `ATTESTATION_ALREADY_REDEEMED` and `MALFORMED_ATTESTATION_TOKEN`, and two tests in
`test/financial-verification-http.test.ts` assert on those exact strings, so tightening this
would be a public-contract change rather than a private fix. The disclosed reasons describe
the token the caller already holds and nothing about the dossier contents, and distinguishing
replay from expiry is genuinely useful to a bank integrator debugging a failed verification.
If it is tightened later, the right shape is a generic external reason with the specific one
logged server-side, decided by whoever owns Layer 6.
