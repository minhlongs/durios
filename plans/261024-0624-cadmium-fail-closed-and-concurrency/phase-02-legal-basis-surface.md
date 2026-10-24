# Phase 2 — Surface Legal Basis To The Operator

## Context Links

- `src/ui/review-legal-basis.ts:18-37` — `legalBasisOf` and `ruleCarriesLegalConclusion`, currently test-only
- `src/ui/review-state.ts` — companion state vocabulary already in production
- `src/server/public/index.html:966-984` — the hand-copied `REVIEW_STATE_LABEL_VI` and `REVIEW_STATE_OF` mirror
- `src/server/static-ui.ts:8-12` — serves only `index.html` from `src/server/public/`
- `src/rules/deterministic-engine.ts:35-45` — the fail-closed finding the UI must distinguish
- Commit `3f60e66` — introduced the review-state surface and recorded this debt

## Overview

Priority: P1. Status: **completed** (2026-10-25).

Make the legal weight of each finding visible, and close the duplication that the
review-state surface left behind. Today `legalBasisOf` computes exactly the
distinction the pilot depends on — verified, unverified, advisory, inactive — and
nothing in production calls it, so an unverified `CRITICAL_BLOCKER` renders
identically to a real blocker.

The same file's sibling debt: `index.html` carries a hand-copied mirror of the
review rules, kept in step only by a comment. The server serves one HTML file and
no JS directory, so a module cannot be fetched by the browser directly.

## Two Corrections That Change What This Phase Should Do

**1. The "mirror" is not a mirror, so removing it is a behaviour change.**

The tested `classifyField` (`src/ui/review-state.ts:74-89`) checks
`result === "POTENTIAL_DISCREPANCY"`, `result === "MISSING_DOCUMENT"`,
`manualCorrection`, `sourceSuperseded`, and more. The browser's `REVIEW_STATE_OF`
(`index.html:974-983`) checks none of those and returns `NEEDS_REVIEW` for both
`EXTRACTED` and `DRAFT`.

The browser's call site (`index.html:1662-1666`) passes only
`{verificationStatus, selectedValue, isSuperseded}` — no `result`, no
`manualCorrection`. Substituting `classifyField` would drop the
`POTENTIAL_DISCREPANCY → DISCREPANCY` path on the browser side entirely, because
rows cannot even produce that input.

So requirement 3 must be split:

- **3a — inject the `REVIEW_STATE_LABEL` vocabulary.** `REVIEW_STATE_LABEL_VI` is
  a genuine duplication of `src/ui/review-state.ts`'s labels and is safe to remove
  and inject. This is the safe half.
- **3b — leave the browser's classifier alone this phase.** Whether `classifyField`'s
  richer semantics should reach the browser is a separate decision, and it requires
  the row object to carry `result` and `manualCorrection` first. Bundle it here and
  the phase silently regresses the review surface while its tests stay green.

**2. The escaping argument is written for the wrong context.**

The values to be injected sit inside the single inline `<script>` spanning
`index.html:910-2978`, inside a JavaScript object literal. The existing
`escapeHtml` helper (`index.html:1036`) escapes `& < > " '` — HTML-entity
escaping, which does **not** neutralise a JS string terminator, a backslash, or
`</script>` in a JavaScript context.

So: HTML-escape only values rendered into markup (as `f.citation` and
`f.ruleName` already are at lines 1751-1758), and for anything inside the inline
script use `JSON.stringify(...)` with `<` escaped to `<`. The four basis labels are
in-repo Vietnamese strings with no such content today, so the current risk is low —
but that constraint must be recorded rather than assumed, because a future
`LegalBasis` variant or a rule-derived citation could break it.

**3. Option A's recorded rationale is wrong, though the decision stands.**

The plan claimed Option A was "blocked by the build constraint" because "the repo
has no bundler". The server already serves raw, unmodified `.js` with
`application/javascript` at `/stitch/`
(`src/server/stitch-static-handler.ts:12,22-27`) and the page already loads
`durios-live-bridge.js` from it (`index.html:692`). The real blocker is narrower:
`src/ui/*.ts` is TypeScript using `.js` ESM specifiers and there is no transpile
step. Option B remains the right choice; the recorded reason is not.

Also: `serveIndexHtml()` (`src/server/static-ui.ts:6-22`) has **zero test
coverage** — no test imports or calls it — and its `cachedHtml` is a module-level
singleton never invalidated, so the injection test must account for cache persistence
across tests in a process.

## Key Insights

- The duplication constraint is structural, not accidental: `static-ui.ts` reads a
  single `src/server/public/index.html` path, and there is no static route for a
  directory under `src/ui/`. Two ways out — serve the module directory, or
  inject the module's output into the HTML. Serving a directory changes what the
  server exposes and is the cleaner fix, but it is a bigger change to a protected
  surface (the browser workspace must keep working end to end).
- The fail-closed finding's own text already says the rule cannot produce a legal
  conclusion (`deterministic-engine.ts:40-41`), in Vietnamese. Surfacing the basis
  is therefore a labelling task on data that already exists, not new policy.
- `ruleCarriesLegalConclusion` returns a `reasonKey`, which is a stable hook for a
  bilingual label without embedding policy in the view.

## The Missing Contract: Legal-Basis Metadata Never Reaches The Browser

This is the finding that makes this phase unexecutable as originally written.

`legalBasisOf` needs rule metadata — `isActive`, `isStatutoryVerified`, `severity`.
That metadata lives in `src/rules/rule-catalog.ts`. It is never sent to the
browser:

- `ValidationFinding` (`src/domain/types.ts:45-49`) carries only `ruleId`,
  `severity`, `ruleName`, `citation`, `observedValue`, `thresholdValue`,
  `messageVi`, `messageEn`. **There is no legal-basis field.**
- No route exposes the rule catalog; `src/server/http-router.ts:26-95` has no
  rules endpoint.
- `src/server/dossier-handlers.ts:53` passes the validation result through
  unchanged, so nothing enriches it server-side either.

Consequence: an implementer following this phase injects the *label vocabulary* —
four bilingual strings keyed by basis — and then has no basis value to key it with.
Findings render at runtime from `/api/dossiers/:id` JSON built at
`index.html:1751-1758,1771-1773`, and that JSON contains no basis. The Tests-Before
assertion "render the unverified basis, assert on the served markup" cannot pass,
because the served markup cannot know the basis.

**So this phase must also add the data path**, not only the presentation:

```ts
// src/domain/types.ts — ValidationFinding gains:
readonly legalBasis?: "verified" | "unverified" | "advisory" | "inactive";
```

Produced server-side by mapping each finding's `ruleId` through the catalog and
`legalBasisOf(rule)`. `test/static-ui-contract.test.ts:68-74` asserts which finding
fields the HTML may use and must be updated in the same phase.

## Requirements

Functional:

1. The rendered workspace shows, for each validation finding, whether it carries a
   legal conclusion, is an unverified statutory claim, is an internal check, or
   comes from an inactive rule.
2. The distinction uses `legalBasisOf`/`ruleCarriesLegalConclusion` output rather
   than a second hand-written rule table in the browser.
3. **3a** — `REVIEW_STATE_LABEL_VI` is removed from `index.html` and injected from
   `src/ui/review-state.ts` instead. **3b** — the browser's classifier
   (`REVIEW_STATE_OF`) is deliberately left as-is this phase, and that narrowing is
   recorded as a known, documented divergence rather than closed.
4. A `CRITICAL_BLOCKER` produced by the fail-closed path is visually distinct from
   a `CRITICAL_BLOCKER` from a verified rule.
5. `ValidationFinding` carries a `legalBasis` field produced server-side, so the
   badge has a real value to key on.
6. `test/static-ui-contract.test.ts:68-74` is updated to admit the new field.

Non-functional: the browser workspace keeps working with no console errors; no new
runtime dependency; responsive behaviour unchanged; Vietnamese remains primary.

Non-goals: PDF or image preview with bounding-box highlighting (the
`BoundingBox` contract exists but page image data does not); redesigning the
workspace; changing validation semantics.

## Architecture

Two options were considered.

**Option A — serve `src/ui/` as a static asset directory.** Add a route in
`src/server/static-ui.ts` so the browser can import the tested module directly.
Removes duplication permanently and makes the browser depend on the same code the
tests exercise. Cost: extends what the server exposes, and the module must be
loadable as a browser ESM module — `src/ui/*.ts` uses `.js` ESM specifiers and
TypeScript, which the browser cannot execute without a build step. The repo has
**no bundler** and adds no runtime dependency, so this option is blocked by the
build constraint, not by preference.

**Option B — the server injects the module's compiled values into the served
HTML.** `static-ui.ts` already reads `index.html` into a string and caches it.
Importing from `src/ui/` at the server and substituting the labels keeps one
source of truth, requires no browser build step, and stays inside the existing
serve path. Selected.

## Related Code Files

> **Implementation notes (recorded at completion).**
>
> The substitutable unit is a *whole statement*, not an expression. An earlier
> expression-level placeholder (`/*__X__*/` replaced by `{...}` or `null`) produced
> invalid JavaScript in both directions, so `review-state-injection.ts` emits two
> `const` declarations and the on-disk placeholder is one complete statement.
> Escaping uses `JSON.stringify` with `<` → `<`, not `escapeHtml`, because the
> injected values sit inside a JavaScript object literal.
>
> Enrichment lives in `executeValidation` (`src/workspace/dossier-lifecycle-service.ts`),
> not in the dossier handler as planned: the handler re-reads the dossier, so
> enriching there would tag a result that storage already holds. The engine also
> cannot host it — `deterministic-engine.ts` was already at the LOC ceiling.

- Modify `src/domain/types.ts` — add `legalBasis` to `ValidationFinding`.
- Create `src/rules/dossier-finding-enricher.ts` — maps each finding's `ruleId`
  through the catalog and `legalBasisOf` to produce the basis, so the browser never
  re-derives policy it was not given.
- Modify `src/server/dossier-handlers.ts` — enrich validation results with
  `legalBasis` before responding.
- Modify `src/server/static-ui.ts` — import the review-state and legal-basis
  vocabularies from `src/ui/` and substitute them into the served HTML. Keep the
  existing cache behaviour and the `index.html` fallback.
- Modify `src/server/public/index.html` — replace the hand-copied
  `REVIEW_STATE_OF`/`REVIEW_STATE_LABEL_VI` block with a placeholder the server
  fills, and render the legal-basis badge in the findings view. **Replace the
  label block only**; leave the classifier in place this phase, per the 3a/3b
  split.
- Create `src/server/review-state-injection.ts` — substitution logic, if
  `static-ui.ts` would exceed the 100 LOC ceiling.
- Create `src/server/legal-basis-labels.ts`, or add the map inside
  `review-state-injection.ts` — the bilingual derivation from the `LegalBasis`
  union, plus the JS-context-safe escaping.
- Modify `src/ui/review-state.ts` — add a `REVIEW_STATE_LABEL` accessor for the
  injected vocabulary if one does not already exist; do not change `classifyField`.
- Modify `src/ui/review-legal-basis.ts` only if a bilingual label helper is
  missing; do not change `legalBasisOf` semantics.
- Modify `test/static-ui-contract.test.ts` — replace disk-only assertions with
  `serveIndexHtml()` assertions, and admit the new finding field at lines 68-74.

## Implementation Steps

1. Read `src/server/static-ui.ts` in full and record how the HTML is cached and
   served.
2. Write the failing test first: a test asserting that the served HTML contains the
   Vietnamese review-state labels sourced from `src/ui/review-state.ts`, and that
   it contains no stale duplicate definition. Confirm it fails.
3. Decide the substitution boundary. Keep it minimal: replace the mirrored
   constants with injected values; do not attempt to inject the whole view.
4. Add a bilingual label map for the four legal bases in one place, derived from
   the `LegalBasis` union so a new basis cannot ship unlabelled.
5. Render the basis badge where validation findings are listed, using
   `ruleCarriesLegalConclusion`'s `allowed` flag to decide whether a legal
   conclusion may be stated.
6. Delete the hand-copied mirror from `index.html`, leaving the shared-note
   comment only if both sides still exist; otherwise remove the note too.
7. Manually load the workspace and confirm the badge renders and the console is
   clean, at 1440 / 768 / 375 px.

## Tests Before

The existing harness reads the HTML file from disk, never through
`serveIndexHtml()` — `test/static-ui-contract.test.ts:10` uses `readFileSync`. A
server-side substitution makes the on-disk file hold a placeholder, so a disk-based
assertion sees the placeholder and proves nothing. **The new test must call
`serveIndexHtml()` and read the `Response` body**, and must account for the
module-level `cachedHtml` singleton persisting across tests in one process.

- `serveIndexHtml()` returns HTML containing the six Vietnamese review-state
  labels, and their values equal what `src/ui/review-state.ts` exports — asserted
  by importing the module in the test and comparing.
- The on-disk `index.html` no longer contains a literal
  `const REVIEW_STATE_LABEL_VI`, confirming the duplication was replaced rather
  than duplicated again.
- A finding whose rule has `isStatutoryVerified: false` and `CRITICAL_BLOCKER`
  arrives over the real API carrying `legalBasis: "unverified"`, and is distinct
  from a verified rule. Assert on the API response and the rendered markup.
- `review-legal-basis.ts` is imported by at least one file outside `test/`; assert
  this by scanning the production sources, so the "no production caller" debt
  cannot silently return.
- The injected values survive the JS-string context: the emitted script block
  parses as valid JavaScript, which is what catches a missing escape.

## Refactor

The mirror moves out of `index.html` into a single server-side injection. The
browser keeps its render function; it reads injected values instead of local
duplicates.

## Tests After

- The six-state classification behaviour is unchanged from the committed
  `test/review-state.test.ts` baseline.
- Loading the workspace offline produces no `ReferenceError` for the removed
  mirror.
- The existing `test/review-claims-boundary.test.ts` assertions still hold, so the
  UI still avoids claiming certification or customs clearance.

## Success Criteria

- `bun test` passes, including the new injection tests and the three committed
  review-state tests.
- `bun run typecheck` reports 0 errors.
- The legal-basis badge is present in the served HTML for both verified and
  unverified cases.
- No literal duplicate of the review rules remains in `index.html`.
- No `src/` or `test/` file exceeds the enforced 100 LOC ceiling.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Injection breaks the cached HTML path and the workspace fails to load | Keep `static-ui.ts`'s fallback; load the page and check the console before finishing |
| The browser workspace is a protected flow and any regression is a launch blocker | Verify list load, dossier open, field verify and validation render after the change |
| Substitution introduces a template-injection vector from rule data | Substitute only values produced by the repo's own modules; escape anything that can contain document-derived text |
| Phase 1's new ruleId is not labelled in the UI | The basis map is derived from the `LegalBasis` union, so any rule routes through one of the four states |

## Security Considerations

The substitution input is rule metadata authored in the repository, not document
content, so the escaped-substitution risk is small — but document-derived values
already flow into this page through other paths, so keep escaping consistent with
the existing `escapeHtml` helper.

## Next Steps

Phase 3 is independent of this phase and may run in parallel; both touch
`src/server/public/index.html` only in different regions, but if executed in
parallel the file ownership must be split explicitly to avoid clobbering.
