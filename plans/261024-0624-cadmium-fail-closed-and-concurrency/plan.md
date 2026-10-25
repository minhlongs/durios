---
title: "Cadmium Fail-Closed Evaluation, Legal-Basis Surface & Dossier Optimistic Concurrency"
description: "Close three verified gaps so the Cai Lay pilot can run on real data: evaluate the cadmium threshold again without asserting a legal conclusion, surface legal basis to operators, and stop blind upserts from erasing human verification."
status: pending
priority: P1
effort: "3 phases"
issue:
branch: feat/pilot-read-surface-and-h4-fail-closed
tags: [compliance, rules-engine, concurrency, ui, pilot]
blockedBy: []
blocks: []
created: 2026-10-24
---

# Cadmium Fail-Closed Evaluation, Legal-Basis Surface & Dossier Optimistic Concurrency

## Overview

The Cai Lậy pilot cannot run honestly today because of three verified gaps, each
proven in source rather than inferred.

**Gap A — the cadmium rule is not merely hidden, it is not evaluated at all.**
`RUL-GB2762-CD` (cadmium, threshold 0.050 mg/kg, severity `CRITICAL_BLOCKER`) is
declared `isActive: false` in `src/rules/rule-catalog.ts:34` with the comment
`DISABLED: Primary legal evidence not present in repository`, and
`isStatutoryVerified: false`. In `src/rules/deterministic-engine.ts:33` the engine
runs `if (!rule.isActive) continue;` **before** it reaches the fail-closed branch
at lines 35-45. The consequence is worse than a display problem: a lot testing
0.900 mg/kg produces no cadmium finding whatsoever. The operator believes
cadmium is being checked. It is not.

The primary legal text is genuinely unavailable — the founder cannot obtain it,
and the repo holds none. The catalog itself records
`GB 2762-2022 Table 1 (Pending authoritative text verification)`. So the rule
cannot be promoted to a statutory conclusion.

**Gap B — legal basis is computed but never shown.**
`src/ui/review-legal-basis.ts` already implements `legalBasisOf()` and
`ruleCarriesLegalConclusion()`, both tested, and **no production code calls
either**. A `CRITICAL_BLOCKER` that cannot legally conclude renders identically
to a genuine blocker.

**Gap C — every write path is a blind upsert.**
`SqliteDossierRepository.save()` (
`src/storage/sqlite-dossier-repository.ts:21`) writes the whole aggregate and
`upsertDossierRows` (`src/storage/sqlite-dossier-mapper.ts`) uses
`ON CONFLICT(id) DO UPDATE SET` on every column, including `confirmed_value`,
`verification_status`, `verified_by_actor_id` and `verified_at`. There is no
version column, no 409, and no optimistic lock anywhere in `src/server`,
`src/storage` or `src/workspace`. `export_manifests` likewise upserts blind on
`dossier_id`, so an overwrite can erase the sealed manifest and the human
signature inside it.

## The confirmed compliance decision

A strict statutory gate (H1) was rejected because its precondition — primary legal
text in hand — does not exist and cannot be produced. In its place the founder
chose a fail-closed human gate (H4): **the system never draws a legal conclusion
it cannot support, and a lot exceeding the cadmium threshold stops in
`HUMAN_VERIFICATION_REQUIRED` until a named actor records an explicit decision.**
The signing role is the factory quality manager: one person, `MANAGER` on
`PACKHOUSE_EXPORTER`.

Phase 1 turns this into code by evaluating the threshold for real while publishing
the rule as an internal food-safety check rather than a legal conclusion. This
keeps the 0.050 mg/kg threshold as the stop line for food safety, which is what
protects the consumer, without asserting a citation nobody can produce.

## Scope correction recorded

An earlier pass of this investigation concluded the browser workspace was not
connected to the API. That was wrong and was corrected against source.
`src/server/public/index.html` already calls `/api/dossiers` (list and create),
`/api/dossiers/:id`, `:id/audit`, `:id/manifest`, `:id/documents` (list and
upload), `:id/documents/:d/fields/:f/verify`, `:id/validate`, `:id/approve`,
`:id/export`, plus `/api/pilot/kpi`, `/api/pilot/gates` and `/api/auth/*`. Every
one of those routes exists in `src/server/http-router.ts`. Wiring the UI to the
backend is therefore **not** in this plan's scope.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Cadmium above 0.050 mg/kg produces a real blocking finding again, published as an unverified internal food-safety check rather than a legal conclusion | P1 |
| 2 | Operators can see which findings carry legal weight and which do not, so an unverified blocker is never mistaken for a real one | P1 |
| 3 | Two people editing one dossier can no longer silently overwrite each other, and a sealed manifest cannot be erased by a stale save | P1 |
| 4 | The known debt from the review-state surface commit is closed: the legal-basis helper gets a production caller and the hand-copied mirror is removed | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Evaluate Cadmium Without Asserting A Legal Conclusion](./phase-01-cadmium-internal-block.md) | Completed |
| 2 | [Surface Legal Basis To The Operator](./phase-02-legal-basis-surface.md) | Completed |
| 3 | [Optimistic Concurrency For Dossier Writes](./phase-03-optimistic-concurrency.md) | Completed |

## Success Criteria

- [x] A dossier whose lab report reads cadmium 0.900 mg/kg yields a blocking finding naming the 0.050 mg/kg threshold, verifiable by a single `bun test` assertion.
- [x] That finding is labelled as an internal food-safety check with no verified statutory basis; no wording anywhere claims a legal conclusion for it.
- [x] A rule with `isStatutoryVerified: false` and `CRITICAL_BLOCKER` severity is visibly distinguished from a verified rule in the rendered workspace.
- [x] A save carrying a client-supplied version older than the stored one fails with HTTP 409; the newer write survives.
- [x] `review-legal-basis.ts` is imported by production code, not only by tests.
- [x] `bun test` equals or exceeds the measured pre-change baseline of **191 pass / 0 fail** across 42 files, with no test left failing.
- [x] `bun run typecheck` reports 0 errors.
- [ ] No file in `src/` or `test/` exceeds the **100 LOC** ceiling enforced by `test/ecosystem-rehearsal-and-modularity.test.ts:77`; no `:any` type; no `console.log` in production code.

## Constraints

Synthetic data only; no real customer data enters the system, so `GATE-01`
remains a reporting check and hardening it is explicitly out of scope. Zero
runtime npm dependencies (`bun:sqlite` and `node:crypto` only) — SQLCipher is
not an option. `OTP` provider activation is out of scope; `GATE-02` failing
closed with 503 is acceptable.

On public contracts: no existing route is removed and no success response
changes. Two **additions** are authorised by this plan, each recorded in its
phase — a `POST /api/dossiers/:id/override` route for the signed cadmium
override, and a client-supplied `version` precondition on the mutating dossier
routes. Both are new surfaces rather than changes to existing behaviour.

On the 100 LOC ceiling: this is a hard gate, not a guideline.
`test/ecosystem-rehearsal-and-modularity.test.ts:77` fails the suite on any
`.ts` file over 100 lines in `src/` or `test/`. `src/rules/evaluator-helpers.ts`
is already at 98 lines, so splitting the cadmium evaluators into their own module
is **mandatory**, not optional.

## Red Team Review

### Session — 2026-10-24
**Findings:** 19 (15 accepted, 4 rejected or redirected)
**Severity breakdown:** 5 Critical, 6 High, 8 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | New rule lands in the fail-closed branch and never evaluates the threshold | Critical | Accept | Phase 1 |
| 2 | Phase 1 breaks at least six existing passing tests, all unanticipated | Critical | Accept | Phase 1 |
| 3 | Blocker's input is operator-typed, not document-read | High | Accept | Phase 1 |
| 4 | GATE-05 cannot detect the cadmium defect it is meant to catch | High | Accept | Phase 1 |
| 5 | Version guard is a no-op for the two-operator case | Critical | Accept | Phase 3 |
| 6 | Manifest immutability requirement is unreachable | High | Accept | Phase 3 |
| 7 | Write paths bypass `repo.save`; three version-blind tests break | High | Accept | Phase 3 |
| 8 | Substitution target is a JS string context, escaping argument is wrong | Medium | Accept | Phase 2 |
| 9 | The "mirror" is not a mirror — removing it changes behaviour | High | Accept | Phase 2 |
| 10 | Option A rationale is a false build constraint | Medium | Accept | Phase 2 |
| 11 | 110 LOC ceiling is wrong; enforced ceiling is 100 | Medium | Accept | All |
| 12 | "Two known EADDRINUSE failures" do not exist | Medium | Accept | All |
| 13 | Phase 2 has no mechanism to deliver legal-basis metadata | Critical | Accept | Phase 2 |
| 14 | Phase 2 test reads from disk, so server-side injection is unverifiable | High | Accept | Phase 2 |
| 15 | Phase 1 route constraint forbids the route the phase needs | Critical | Accept | Phase 1 |
| 16 | Signing role: `ADMIN` also passes the gate the plan names | High | Redirect | Phase 1 |
| 17 | `serveIndexHtml` has zero test coverage | Medium | Accept | Phase 2 |
| 18 | In-memory repository rule is unexecutable as written | High | Accept | Phase 3 |
| 19 | Phase 1's `evaluationType`-based fix was the wrong discriminator | Medium | Reject | — |

**Verdict applied:** the plan was not executable as drafted. Findings 1, 13 and 15
each independently blocked a phase; 5 meant Phase 3 would have shipped a guard that
could never fire for the case it existed to close. All are now written into the
phase bodies as mechanisms, not left as risks.

Two claims in this plan were **wrong and were the author's own error**, not merely
omissions: the 110 LOC ceiling (#11) and the two pre-existing `EADDRINUSE` failures
(#12). Both were inherited from the 2026-10-23 reconnaissance report without
re-measuring. The real ceiling is 100 lines for `src/` and `test/`, enforced by
`test/ecosystem-rehearsal-and-modularity.test.ts:77`, and `bun test` is green at
191 pass / 0 fail with no `EADDRINUSE` anywhere in the tree.

Finding 19 was rejected: the reviewer proposed branching on `evaluationType`, but
`evaluationType` describes *how* a rule is computed (`"NUMERIC_THRESHOLD"`), not
whether it claims legal authority. The accepted discriminator is `statutoryClaim`,
which expresses the distinction the fail-closed branch actually needs.

Finding 16 is redirected rather than accepted, because the choice is the founder's:
the existing `isPackhouseMgr` gate admits `MANAGER` **and** `ADMIN`, while the
recorded intent is one person. Phase 1 now presents both options and forbids an
implementer from silently picking.

### Whole-Plan Consistency Sweep

Applied as a decision delta, then searched across all four plan files:

1. **`evaluator-helpers.ts` split** — flagged mandatory in Phase 1 (the file is 98
   of 100 lines). Phase 1's file list, steps and risk table updated. Verified no
   other phase claims the split is optional.
2. **`save` returning the persisted dossier** — Phase 3's requirement, architecture,
   steps, call-site table and file list all updated together. Verified Phase 1 does
   not depend on `save` returning a value.
3. **Client-supplied `version`** — added to Constraints in `plan.md` as an
   authorised contract addition, and to Phase 3's requirements, gap section,
   architecture and steps. Verified the older claim "no new request field is needed
   on existing routes" no longer appears anywhere.
4. **`legalBasis` on `ValidationFinding`** — added to Phase 2's missing-contract
   section, requirements, tests, file list and success criteria. Verified Phase 1's
   success criteria do not predicate on Phase 2 shipping first.
5. **The override route** — `plan.md` Constraints names it as authorised;
   Phase 1's steps authorize it. Verified Phase 3 no longer says "no route is
   added", which would contradict it.
6. **3a/3b split on the review-state mirror** — Phase 2's requirements, tests,
   file list, risk table and the earlier "one source of truth" claim all narrowed.
   Verified the plan no longer states that a test checks the mirror "on both sides";
   no such parity test exists.
7. **Baseline numbers** — every phase now scores against 191 pass / 0 fail and the
   100-line ceiling. Verified no occurrence of "110 LOC" or "EADDRINUSE" remains in
   any plan file.

**Unresolved after the sweep:** one, carried into Phase 1 explicitly — the signing
role (`MANAGER` only, or `MANAGER`+`ADMIN`). This is a founder decision and Phase 1
must not be executed until it is answered.
