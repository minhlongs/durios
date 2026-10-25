# Phase 1 — Evaluate Cadmium Without Asserting A Legal Conclusion

## Context Links

- `src/rules/rule-catalog.ts:27-42` — `RUL-GB2762-CD` current declaration
- `src/rules/deterministic-engine.ts:32-49` — the `isActive` skip and the fail-closed branch
- `src/rules/evaluator-helpers.ts:4-15` — `evaluateCadmiumThreshold`, currently unreachable for this rule
- `src/ui/review-legal-basis.ts:18-24` — `legalBasisOf`, the basis vocabulary this phase must agree with
- Test: `test/review-legal-basis.test.ts`

## Overview

Priority: P1. Status: completed.

Turn the cadmium rule from dead code into a real, blocking food-safety check while
being explicit that it carries no verified statutory basis. The founder cannot
obtain the primary legal text, so this rule must never be presented as a legal
conclusion — but it must evaluate, because right now it does not evaluate at all.

**Why a new rule rather than editing the existing one.** `RUL-GB2762-CD` is named
`Statutory Maximum Cadmium Residue Limit (MRL)` and cites
`GB 2762-2022 Table 1 (Pending authoritative text verification)`. Keeping that
`ruleId` and merely flipping `isActive` would leave a rule whose identity asserts
a statutory claim the repository cannot support, and the engine's fail-closed
branch at `deterministic-engine.ts:35` would then suppress the threshold
evaluation anyway — producing the illusion of protection with no actual
evaluation. A separate, honestly named rule avoids both traps.

**Why not simply promote the existing internal warning.** `RUL-INT-CD-WARN` at
0.040 mg/kg is `ADVISORY_WARNING` and advertises itself as not constituting a
legal breach below 0.050. Raising it to a blocker would change its documented
meaning and tie the stop line to 0.040 rather than the food-safety limit.

## Key Insights

- `if (!rule.isActive) continue;` at line 33 runs before the fail-closed check at
  line 35. Both matter: a disabled rule is invisible rather than safely blocked,
  and an active `CRITICAL_BLOCKER` with `!isStatutoryVerified` is blocked from
  evaluation rather than evaluated. This phase must fix the second.
- The threshold comparison already exists and is correct —
  `evaluateCadmiumThreshold` reads `confirmedValue ?? rawValue` and compares
  `> 0.050`. The work is routing, not arithmetic.
- `legalBasisOf` returns `"unverified"` when `isStatutoryVerified !== true` and
  severity is `CRITICAL_BLOCKER`, and `"advisory"` for lower severities. That
  vocabulary should drive the wording so the UI and the engine cannot disagree.
- Adding a `CRITICAL_BLOCKER` that actually fires changes validation outcomes for
  existing fixtures. Several tests currently assert `PASSED` at 0.028 mg/kg and
  must be updated to the new truth; see Tests After.
- The cadmium value is **operator-attested, not document-read**. The upload route
  accepts a client-supplied `fixtureFields` object
  (`src/server/document-handlers.ts:33-34,40`) which flows straight into field
  extraction. The blocker therefore controls a number a person typed. This is a
  known limitation of the pilot, not a defect this phase can fix, and it must be
  stated rather than left for someone to discover.

## The Gap This Phase Must Also Close

The H4 decision says a lot exceeding the cadmium threshold stops, a named human
signs, and the lot proceeds. **That last step has no mechanism today**, and
without one, activating the blocker makes the pilot structurally unusable rather
than safer.

Verified in source:

- `deterministic-engine.ts:54` maps any `CRITICAL_BLOCKER` to run status `BLOCKED`.
- `dossier-lifecycle-service.ts:13` maps `BLOCKED` to lifecycle `VALIDATION_BLOCKED`.
- `src/domain/dossier-fsm.ts` allows from `VALIDATION_BLOCKED` only
  `HUMAN_VERIFICATION_REQUIRED` and `CANCELLED`.
- `executeApproveForExport` (`dossier-lifecycle-service.ts:25`) accepts only a
  `PASSED` result or a lifecycle of exactly `REVIEW_REQUIRED` — and
  `REVIEW_REQUIRED` is reachable only from `ADVISORY_WARNING`, never from a
  blocker.
- Grep across `src/` for `acknowledg`, `override`, `waive`, `exception` finds no
  mechanism for an operator to sign past a blocker.

So today a cadmium-blocked dossier can only be cancelled. Phase 1 must therefore
open a signed-override path, or the quality manager this whole design depends on
has nothing to sign and every affected lot is a dead end.

## Requirements

### Blocking gap to close in this phase

1. A signed-override path exists: from `VALIDATION_BLOCKED`, an actor with the
   quality-manager role can record an explicit decision with a reason, moving the
   dossier to `REVIEW_REQUIRED`, which `executeApproveForExport` already accepts.
2. The override records its actor and reason in the audit ledger with the same
   `recordEvent` convention used by every other transition, so the decision is
   evidence rather than a hidden flag.
3. A non-manager actor cannot perform the override — the existing
   `assertCanTransition` role gate is the natural place, since approvals are
   already restricted to packhouse managers.
4. The cadmium finding is not deleted by the override; it remains on the dossier so
   the export still shows that the limit was exceeded and that a human signed past
   it.

### Functional

0. `ComplianceRule` in `src/domain/types.ts` gains a `statutoryClaim` discriminator
   (`"STATUTORY" | "INTERNAL_FOOD_SAFETY" | "NON_STATUTORY"`), and the engine's
   fail-closed branch keys on it instead of on `severity` alone. Without this the
   rule below is dead configuration.
1. A new rule `RUL-CD-INTERNAL-BLOCK` exists, active,
   `statutoryClaim: "INTERNAL_FOOD_SAFETY"`, `CRITICAL_BLOCKER`,
   threshold 0.050 mg/kg on `cadmium_mg_kg`, with
   `governingAuthority` and `statutoryReference` stating plainly that it is an
   internal packhouse food-safety check with **no verified statutory basis**.
2. Evaluating a dossier whose active `LAB_TEST_REPORT` carries cadmium above
   0.050 mg/kg produces a `CRITICAL_BLOCKER` finding for that rule, and the run
   status becomes `BLOCKED`.
3. The finding message states the measured value and the 0.050 mg/kg threshold,
   in Vietnamese first, and says it is an internal food-safety check, not a legal
   determination.
4. The legacy `RUL-GB2762-CD` stays inactive and is never silently revived. Its
   absence must remain a visible, explainable fact rather than a hidden one.
5. The `RUL-INT-CD-WARN` internal advisory at 0.040 mg/kg keeps its existing
   meaning and severity.

Non-functional: no new runtime dependency; files stay within 100 LOC; Vietnamese
labels remain the primary language.

Non-goals: obtaining the legal text; claiming statutory compliance; changing the
0.050 threshold; validating the `documentType`/`fixtureFields` inputs so the
reading is trustworthy (recorded above as a pilot limitation); touching `GATE-01`.

## A decision the founder must make before this phase runs
The signing role. `plan.md` records the intent as "one person, `MANAGER` on
`PACKHOUSE_EXPORTER`", but the existing gate this phase planned to reuse —
`isPackhouseMgr` at `src/domain/dossier-fsm.ts:63-67` — admits `ADMIN` as well:

```ts
actor.tenantType === "PACKHOUSE_EXPORTER" &&
actor.persona === "PACKHOUSE_MANAGER" &&
(actor.role === "MANAGER" || actor.role === "ADMIN")
```

A fixture `ADMIN` with `persona: "PACKHOUSE_MANAGER"` already exists
(`test/helpers/security-export-fixtures.ts`). Reusing that gate ships a two-role
override where a one-person gate was specified, and no test would catch it because
the Tests-Before only asserts that `CLERK` is rejected.

Two defensible choices, and the choice is the founder's:

- **Narrow** — a dedicated override gate in `src/auth/rbac-persona-assertions.ts`
  that admits `MANAGER` only. Matches the stated "one person" intent. Costs a new
  authorisation check beside the existing one.
- **Broaden the stated intent** — reuse `isPackhouseMgr` and correct `plan.md` to
  "MANAGER or ADMIN". No new code, but two roles can sign past a food-safety
  blocker.

The plan does not choose. Implementation must not silently pick either.

**Resolved on implementation.** The narrow gate was built, because `plan.md` already
records the founder's intent as "one person, `MANAGER` on `PACKHOUSE_EXPORTER`" and
reusing `isPackhouseMgr` would have contradicted that recorded decision rather than
settled it. Implemented as `assertCanOverrideBlocker` in
`src/auth/override-authorization.ts`, which admits `MANAGER` alone and rejects
`ADMIN` even with the `PACKHOUSE_MANAGER` persona. Both directions are pinned by
tests (`T-OV-04` clerk rejected, `T-OV-05` admin rejected, and the same pair again
over HTTP as `T-HTTP-OV-02` and `T-HTTP-OV-05`), so widening it later is a
deliberate edit rather than an accident. This remains the founder's call to confirm
or overturn.

## An earlier claim in this plan that was wrong

A previous revision asserted the new rule "takes the third path because its
`statutoryReference` does not present a statutory claim." That is false against
the real dispatch condition, which never reads `statutoryReference`. Recorded
here so it is not re-introduced.

## Architecture

The engine's dispatch, exactly as it stands (`src/rules/deterministic-engine.ts`):

```
for each rule
  ├── line 33:  !rule.isActive                      → skip
  ├── line 35:  !isStatutoryVerified && severity === "CRITICAL_BLOCKER"
  │              → push UNVERIFIED_STATUTORY_RULE finding; continue;   ← FAIL-CLOSED
  ├── otherwise                                     → evaluateIndividualRule
```

**This phase's central trap, stated plainly because a plan omission caused it:**

The fail-closed branch at line 35 keys off `isStatutoryVerified` and `severity`
only. It does **not** read `statutoryReference`, which is the property this
phase's argument leans on. So a rule declared `severity: "CRITICAL_BLOCKER"` with
`isStatutoryVerified: false` — exactly the field set in Requirement 1 below — is
swallowed by the fail-closed branch and **never reaches the cadmium evaluator**.
`RUL-INT-CD-WARN` escapes that branch only because its severity is
`ADVISORY_WARNING`.

A red-team reviewer reproduced this against the real engine with this phase's
exact field set: cadmium 0.900 mg/kg returned
`observedValue: "UNVERIFIED_STATUTORY_RULE"`, `thresholdValue: "VERIFIED"` — no
finding names 0.050, and the worst part is that `status` is still `BLOCKED`, so
the failure looks like success. The same simulation showed the blocker firing at
0.028 mg/kg, far under the limit.

**Therefore the engine branch must be extended, not merely fed a new rule.**
Add an explicit statutory-claim discriminator to `ComplianceRule` and key the
fail-closed branch on it, so "this rule claims a statutory basis it does not hold"
is distinguishable from "this rule makes no statutory claim":

```
  ├── line 35:  rule.statutoryClaim === "STATUTORY" && !isStatutoryVerified
  │              → push UNVERIFIED_STATUTORY_RULE finding; continue;   ← FAIL-CLOSED
```

Extended `statutoryClaim` union in `src/domain/types.ts`:
- `"STATUTORY"` — claims a legal basis. Fail closed when unverified. `RUL-GB2762-CD`
  is the only rule in this tier, and it stays inactive.
- `"INTERNAL_FOOD_SAFETY"` — a real food-safety control with no legal claim.
  Evaluates normally at `CRITICAL_BLOCKER`. `RUL-CD-INTERNAL-BLOCK` uses this.
- `"NON_STATUTORY"` — internal advisory. `RUL-INT-CD-WARN` uses this.

The existing `T08` test (`test/rules-and-completeness.test.ts:66-81`) pins the
current behaviour for a rule that *does* claim statutory authority and must still
pass unchanged, which is what proves the fail-closed path was narrowed rather
than removed.

## Related Code Files

- Modify `src/domain/types.ts` — add the `statutoryClaim` discriminator to
  `ComplianceRule`.
- Modify `src/rules/rule-catalog.ts` — add `RUL-CD-INTERNAL-BLOCK`; tag every
  existing rule with its claim tier; leave `RUL-GB2762-CD` inactive with its
  comment intact.
- Create `src/rules/cadmium-evaluators.ts` — the two cadmium evaluators moved out
  of `evaluator-helpers.ts`. **Mandatory:** that file is already 98 lines against a
  100-line ceiling, so there is no room to add a message variant in place.
- Modify `src/rules/evaluator-helpers.ts` — the cadmium evaluators move out; the
  remaining evaluators are re-exported from their new home so callers are unaffected.
- Modify `src/rules/deterministic-engine.ts` — key the fail-closed branch on
  `statutoryClaim`; dispatch the new `ruleId` in `evaluateIndividualRule`.
- Modify `src/domain/dossier-fsm.ts` — allow the signed override transition and
  gate it to the signing role (the role decision above is unresolved and must be
  settled first).
- Modify `src/auth/rbac-persona-assertions.ts` — only if the narrow `MANAGER`-only
  gate is chosen.
- Modify `src/workspace/dossier-lifecycle-service.ts` — implement the override,
  carrying the reason and recording the audit event.
- Modify `src/workspace/container-dossier-workspace.ts` — expose the override as a
  workspace method, following the existing `runValidation`/`approveForExport` shape.
- Modify `src/server/http-router.ts` and `src/server/dossier-handlers.ts` — the new
  `POST /api/dossiers/:id/override` route.
- Modify `src/server/server-types.ts` — the request-body type carrying `reason`,
  and any error mapping the override needs.
- Modify `src/server/public/index.html` — call the override from the review
  surface, so the quality manager can actually sign from the browser.
- Modify the existing tests named in Tests Before — update them to the new truth.
- Create `test/rules-cadmium-internal-block.test.ts` — the new coverage.
- Modify `src/domain/dossier-fsm.ts` — allow the signed override transition and
  gate it to the packhouse-manager role.
- Modify `src/workspace/dossier-lifecycle-service.ts` — implement the override,
  carrying the reason and recording the audit event.
- Modify `src/workspace/container-dossier-workspace.ts` — expose the override as a
  workspace method, following the existing `runValidation`/`approveForExport`
  shape.
- Modify `src/server/public/index.html` — call the override from the review
  surface, so the quality manager can actually sign from the browser.

## Implementation Steps

1. Read `src/rules/rule-catalog.ts`, `src/rules/evaluator-helpers.ts`,
   `src/rules/deterministic-engine.ts` and `src/domain/types.ts` in full before
   editing, and record the current line counts.
2. Write the failing test first (see Tests Before) and run it to confirm it fails
   for the right reason: no finding naming 0.050 is produced today.
3. **Extend the engine's fail-closed branch first.** Add the `statutoryClaim`
   discriminator to `ComplianceRule` in `src/domain/types.ts` and key
   `deterministic-engine.ts:35` on
   `rule.statutoryClaim === "STATUTORY" && !rule.isStatutoryVerified` instead of
   on `severity === "CRITICAL_BLOCKER"`. Then tag every existing rule with its
   claim tier: `RUL-GB2762-CD` is the only `"STATUTORY"` rule; `RUL-INT-CD-WARN`
   is `"NON_STATUTORY"`.
4. Add `RUL-CD-INTERNAL-BLOCK` to the catalog. Fields: `statutoryClaim:
   "INTERNAL_FOOD_SAFETY"`, `severity: "CRITICAL_BLOCKER"`, `isActive: true`,
   `isStatutoryVerified: false`, `fieldKeyRef: "cadmium_mg_kg"`, `threshold:
   0.050`, `unit: "mg/kg"`, `evaluationType: "NUMERIC_THRESHOLD"`. Name it for
   what it is, for example `Packhouse Internal Cadmium Food-Safety Block`.
   `governingAuthority` names the packhouse internal standard; `statutoryReference`
   states no verified statutory basis is held.
5. **Split the cadmium evaluators into `src/rules/cadmium-evaluators.ts` before
   adding the message variant.** `evaluator-helpers.ts` is already 98 lines and
   the enforced ceiling is 100, so there is no room. This split is mandatory, not
   optional.
6. Add the internal-check message in the new module. Do not reuse the wording that
   says "ngưỡng pháp định" (statutory limit) — that phrasing is what makes an
   unverified rule look statutory. The message must name the measured value, the
   0.050 mg/kg threshold, and identify the check as internal.
7. Register the `ruleId` in `deterministic-engine.ts` `evaluateIndividualRule`,
   importing from the new `cadmium-evaluators.ts`.
8. Confirm the fail-closed path still blocks a `"STATUTORY"` rule that is
   unverified — the existing `T08` test must pass unchanged, proving the branch
   was narrowed rather than removed.
9. Add the signed-override path in `src/domain/dossier-fsm.ts` and
   `src/workspace/dossier-lifecycle-service.ts`. Allow `VALIDATION_BLOCKED →
   REVIEW_REQUIRED`, gated to the signing role (see the role decision below). Name
   it for what it is — an operator signing past a blocker — and carry a required
   reason.
10. Record the override in the audit ledger with the same `recordEvent` convention
    as every other transition.
11. Authorise one new route, `POST /api/dossiers/:id/override` with a required
    `reason` body, and record it as a deliberate contract addition. Do not bolt
    the override onto `/approve` — that collapses override and approval into one
    call and makes the two-step sign-off untestable.
12. Add the browser call so the quality manager can sign from the workspace.
13. Run the regression gate.

## Tests Before

Write these first and confirm they fail on current `main`.

**Existing tests this phase must update (verified, not guessed).** A `CRITICAL_BLOCKER`
that actually fires at 0.050 changes outcomes for fixtures currently below the
limit. Each of these currently passes and will fail after this phase. Update them
to the new truth rather than leaving them to be discovered mid-implementation:

- `test/security-and-export.test.ts:25` and `:39` — assert `status).toBe("PASSED")`
  on a dossier whose `LAB_TEST_REPORT` reads cadmium `0.028`
  (`test/helpers/security-export-fixtures.ts:66`).
- `test/security-and-export.test.ts:62` — the same `PASSED` assertion on a third
  path.
- `test/security-and-export.test.ts:27-31` and `:41` — the export and manifest
  sealing steps that only execute when validation passes. They never run once the
  status is `BLOCKED`, so T10 and T11 fail outright rather than merely asserting a
  different value.
- `test/helpers/adversarial-verification-cadmium-scenario.ts:65-66` — asserts
  `criticalBlockers).toBe(0)` and `status).toBe("REVIEW_REQUIRED")` at
  0.045 mg/kg.
- `test/ui-sample-upload.test.ts:77` — asserts `PASSED`.
- `test/helpers/adversarial-verification-lifecycle-scenarios.ts:34` — asserts
  `PASSED`.

A red-team simulation using this phase's original field set showed the blocker
firing at 0.028 mg/kg, far under the limit, which is why this list is long. With
the corrected `statutoryClaim` branch the rule evaluates normally and fires only
above 0.050, so these dossiers should stay `PASSED` or `REVIEW_REQUIRED` as they
are today — but the assertions must be re-run and confirmed, not assumed.

- A dossier with one active `LAB_TEST_REPORT` whose `cadmium_mg_kg` field
  `confirmedValue` is `"0.900"` and `verificationStatus` is `HUMAN_VERIFIED`,
  evaluated with the active catalog, returns `status: "BLOCKED"` and includes a
  finding for `RUL-CD-INTERNAL-BLOCK` whose `thresholdValue` contains `0.050`.
- The same dossier's finding message does **not** contain the word
  "pháp định"/"statutory" as a claim of legal basis; it identifies the check as
  internal.
- `RUL-GB2762-CD` remains `isActive: false` in the exported catalog, asserted
  directly so a future edit cannot quietly revive it.
- A lot at 0.020 mg/kg yields no `RUL-CD-INTERNAL-BLOCK` finding.
- A `CLERK` attempting the cadmium override is rejected with `INSUFFICIENT_ROLE`;
  a `MANAGER` on `PACKHOUSE_EXPORTER` succeeds.
- After the override the dossier is in `REVIEW_REQUIRED` and the
  `RUL-CD-INTERNAL-BLOCK` finding is still present on the stored validation
  result, proving the override records a decision rather than erasing evidence.

Place these in `test/rules-cadmium-internal-block.test.ts`, following the
kebab-case and harness conventions in existing `test/` files.

## Refactor

Protected changes only: the new rule entry, the evaluator branch, and the engine
dispatch. `evaluateCadmiumThreshold` keeps its numeric logic; only the message
construction varies by rule kind.

## Tests After

- Cadmium 0.900 mg/kg → `BLOCKED` with the internal-block finding (promoted from
  Tests Before).
- Cadmium 0.045 mg/kg → the internal advisory `RUL-INT-CD-WARN` fires and the new
  block does not, confirming the two rules stay distinct.
- A dossier missing a `LAB_TEST_REPORT` produces no cadmium finding from either
  rule.
- The whole rule suite still passes, so no other rule's severities or counts
  shifted. Adding a `CRITICAL_BLOCKER` rule changes `criticalBlockers` counts and
  can affect existing assertions — check before assuming regression.

## Success Criteria

- `bun test` passes; specifically the new file passes and no previously passing
  rule test fails.
- `bun run typecheck` reports 0 errors.
- The assertions about 0.900 mg/kg, the inactive legacy rule, and the two
  override cases pass.
- A cadmium-blocked dossier can be driven by a manager from `BLOCKED` to approval
  in a test, with the override's actor and reason present in the audit trail.
- No `src/` or `test/` file exceeds the enforced 100 LOC ceiling after the change.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Adding a `CRITICAL_BLOCKER` rule breaks existing tests that assert exact blocker counts | Run the full suite, not only the new file; fix the assertion to the new truth rather than weakening it. Note existing tests use `toBeGreaterThanOrEqual`, which limits exposure |
| Operators read the new blocker as a legal citation | The rule name, `governingAuthority` and `statutoryReference` all state internal and unverified; Phase 2 makes it visible in the UI |
| Someone later flips `RUL-GB2762-CD` back on | It stays inactive, its comment explains why, and a test asserts it stays inactive |
| A blocked lot becomes a dead end and the pilot stalls | Closed in this phase by the signed-override path; without it the pilot could not process any lot over the limit |
| The override becomes a rubber stamp that erases the finding | The override records actor and reason in the audit ledger and never removes the finding from the stored validation result |
| `evaluator-helpers.ts` exceeds the LOC ceiling | Pre-planned split into `src/rules/cadmium-evaluators.ts` |

## Security Considerations

Food safety, not information security. The risk being closed is a lot exceeding
the cadmium limit passing unchallenged. The design deliberately trades
assertiveness for honesty: it blocks on a limit it can defend as a food-safety
control, and refuses to claim a legal basis it does not hold.

## Next Steps

Phase 2 depends on this phase's rule identity so the UI can label it correctly.
