# Code Review — DuriOS 25-Step Open-Core Re-Run with Binh Pháp Mapping

- **Plan reviewed:** `/Users/macbook/durios/plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` (421 lines)
- **Review type:** Static analysis, structural review, independent re-verification of load-bearing claims
- **Mode:** READ-ONLY. No repository file was modified. All counting scripts were written to `$TMPDIR`.
- **Date:** 2026-10-21
- **Reviewer:** code-reviewer (verify phase)

## Scope

| Dimension | Checked |
|---|---|
| Cited file:line references | 11 (auditor, marketplace-guard x5, introspector, test, .env.example, AGENTS.md, docs) |
| 25-row artifact table | All 25 paths + 25 SHA-256 digests + 25 uncommitted flags |
| Foreign trigger tokens | 11 tokens × 2 search scopes |
| Verification commands | 4 (blueprint:verify-25-steps, typecheck, bun test, --deep) |
| Foreign scanner source | `/Users/macbook/mekong-cli/src/core/opencore/phase_560_opencore_saas_readiness_engine.py` |
| Rollback safety | sed command executed against a scratch copy of the real file |
| Numeric claims in §8 | 6 (module counts, packhouse math, cluster thresholds, WAL, lint) |

## Verdict summary

The plan's **structural core is sound**. Scope discipline is genuinely respected: exactly one tracked file changed, `git diff` shows a 1-line header-only delta (`@@ -5 +5 @@`), and no `src/**`, `test/**`, `.env.example`, `.gitignore`, or dependency file was touched. The independently reproduced numbers that matter most — `bun run blueprint:verify-25-steps` exits 0 with `Completed Steps: 25 / 25`, typecheck exits 2 with one TS2367, and the full suite reports 140 pass / 5 fail / 1 error across 36 files — all match the plan verbatim.

**The load-bearing evidentiary table is accurate to the byte.** I recomputed all 25 first-16-digit SHA-256 digests independently with `shasum -a 256` and compared them against the plan's table: **25/25 exact matches, zero substitutions, no truncation drift.** The uncommitted column is likewise correct — I re-derived it with `git diff --quiet` and got the same 9-of-25 split.

However, the plan carries a pattern that disqualifies a clean approval: **several of its own "corrections" are themselves wrong, in the same direction of false precision that it criticizes.** It correctly identifies that an earlier draft claimed 33 LOC violations and "re-corrects" to 26 — but the true count is 32. It records a `Blueprint SHA-256` as an authoritative value when it is not reproducible in the current working tree. Its untracked-file column is wrong for 10 of 11 tokens. And its honest, well-reasoned amendment of a dangerous rollback reproduces a subtly-broken `sed`. Each of these is fixable with a targeted correction; none requires rework.

**Count of factual inaccuracies: 7** (details below, each with file:line).

An eighth candidate — an alleged escape bug in the Phase 5 rollback `sed` at `plan.md:197` — was **investigated and retracted**. My initial reproduction was corrupted by my own shell quoting: I passed the `sed` expression through `bash -c` with unescaped backticks, so bash consumed the `\/` escapes before `sed` ever saw them. Executing the plan's expression verbatim from a script file (`sed -i '' '5s/.*/…plans\/261021-1821-financial-verification-room\/…/'`) produces a result **byte-identical** to the pre-delivery line 5 — zero backslashes, correct path, 97 lines preserved, idempotent across repeated runs. BSD `sed` treats `\/` in a replacement as a literal `/`, so the escape is redundant but harmless. The rollback is **correct, safe, and reversible**. Retaining my retraction here rather than silently deleting the finding, because a reviewer repeating my first test would hit the same false positive.

## Verdict

**APPROVE_WITH_COMMENTS**

The defects are documentation-accuracy defects in a verification deliverable whose entire value proposition is evidentiary accuracy. That is a real inconsistency worth fixing before merge, but the plan is not misleading a reader about the repo's actual state: it never claims a false completion, never hides a real defect, and never touches source. The intent and the substance are right; the numbers need one reconciliation pass.

## Critical Issues

_None._ No trust-boundary violation, no data loss, no destructive change, no breaking contract change, no security regression. The scope discipline claims in §3 hold up under inspection.

## High Priority

### H-1. The `Blueprint SHA-256` in §7 is not reproducible from the current repository state — and the plan does not say so

`plan.md:228` records:

```
Blueprint SHA-256: fddc58df34d5c79747c2c62ddb39b6f98bcb6e6a192767bb48822341edc42d36
```

I reproduced the auditor's composite derivation from `src/saas/blueprint-25-step-auditor.ts:38-43` (`sha256(companyJsonSha256|planMdSha256|tasksMdSha256)`). That digest matches the **HEAD-committed** trio exactly:

- `.mekong/company.json` → `401b8307518ecd45…` (matches table row 22 — file is clean)
- `plans/company-blueprint/plan.md` → `7909c3bf4f104bf9…` (file is clean; worktree SHA == HEAD SHA)
- `plans/company-blueprint/tasks.md` → HEAD `8abf17cf017a90ba…`, worktree `4dc5783706581325…` (**differ** — the file was modified)

A live `bun run blueprint:verify-25-steps` run today prints:

```
Blueprint SHA-256: 0e58f111f300e5ca4a8b6f70c45c72d6cacd0c48ada85c9f16aec1489a3d435e
```

So the recorded value was captured **before** Phase 5's `tasks.md` header edit landed, and it is now stale. Two problems compound here:

1. **Reproducibility claim is broken.** §1 promises "The run is reproducible by one command and its exit code reflects the result," and §2 sells a "stable artifact → SHA-256 baseline" to future reviewers. A reader who runs the command and gets `0e58f111…` instead of `fddc58df…` will conclude either the repo drifted or the record is wrong. Neither is true, but the record does not distinguish them.
2. **The 9-of-25 caveat is incomplete.** `plan.md:298` correctly warns that 9 artifact digests are working-tree values, but the composite SHA is the one value the caveat most needs to cover, and it is only mentioned in the per-file table sense. The composite includes `tasks.md` — one of the files this very plan modified.

**Recommendation.** Replace the literal at `plan.md:228` with the current output, or annotate it: "captured pre-header-edit; recomputes to `0e58f111…` after the Phase 5 `tasks.md` change at commit time — confirm at final run." Add `tasks.md` to the sentence at `plan.md:298` as a tenth mutable input. This is a one-line fix that removes the plan's only genuinely misleading artifact.

### H-2 → retracted. The amended Phase 5 rollback `sed` is correct, safe, and reversible

`plan.md:194` amends the rollback from `git checkout --` to a single-line `sed`. The **reasoning is right and the command is right**. Both halves of the brief's question — is it correct/safe/reversible, and is the reasoning documented well enough — resolve favorably after direct execution.

**Why the amendment was the right call.** I confirmed the hazard was real. At plan-writing time `tasks.md` carried 18 lines of third-party work (the Revenue Layer 6 block, `plans/company-blueprint/tasks.md:82-97`) that was not authored by this plan. Amending to a targeted line edit rather than `git checkout --` was the correct decision — a `git checkout` would have destroyed that work silently and irreversibly.

**Verification performed.** I executed the plan's exact `sed` expression from a script file against a scratch copy of the real `tasks.md` in `$TMPDIR` (not through `bash -c`, which is what produced my false positive — see the note in the verdict summary):

- Resulting line 5 is **byte-identical** to the pre-delivery header (matching `shasum -a 256`), with the re-verification sentence correctly stripped.
- **Zero literal backslashes** in the output. BSD `sed` accepts `\/` in a replacement as a literal `/`; the escapes at `plan.md:197` are redundant but harmless. `\&` is correctly escaped (`&` *is* special in an `sed` replacement).
- File length preserved at 97 lines; only line 5 differs.
- **Idempotent**: running the rollback twice yields the same result and does not re-strip or corrupt anything, because the substitution is line-number-anchored (`5s/.*/…/`) and replaces the entire line.

**Residual risk (not a defect, worth one sentence).** The command is anchored to **line 5 by number, not by content**. If a future maintainer inserts a line above line 5 in `tasks.md`, the `sed` will silently overwrite the wrong line. `plan.md:194` documents *why* the amendment was made but not this anchor invariant, nor does it state that the rollback restores the *pre-this-plan* header text rather than HEAD (the 18 third-party lines are left intact by design).

**Recommendation (optional hardening, not a blocker).** Add one sentence to `plan.md:194`: "The `sed` substitutes line 5 by position and is idempotent; if a header line is ever inserted above line 5, the target must be re-anchored. It restores the pre-plan header text and deliberately leaves the 18 uncommitted third-party lines untouched."

## Medium Priority

### M-1. §9 contradicts §7 on the LOC-violation count — and both are wrong; the true count is 32

This is the finding the review brief asked me to check most carefully, and it is the clearest instance of the "confidently wrong correction" pattern.

- `plan.md:312` (Phase 3 evidence): "**One correction to the earlier draft: the violation count is 26 files, not 33** — 14 under `src/` and 12 under `test/`. The earlier 33 conflated duplicates across the two turns."
- `plan.md:330` (Defect 3): "**26 files over the ceiling** … 14 under `src/` … and 12 under `test/`"
- `plan.md:384` (§9): "**33 files** under `src/` and `test/` exceed the `locCeiling = 95`"
- `plan.md:418` (§13 unresolved question 2): "33 files currently exceed 95"

Actual, measured two independent ways:

| Method | src/ | test/ | Total |
|---|---|---|---|
| `--deep` run output, Turn 1 / Turn 2 evidence strings | 14 | 18 | **32** |
| Direct call into `evaluateCodebaseModularityDeep` in `$TMPDIR` script | 14 | 18 | **32** |
| `find src -name '*.ts' \| xargs wc -l` (`>95`) | 13 | 13 | 26 |

The instrument's own count is 32. The `14` for `src/` is **correct**; the `12` for `test/` is **wrong by 6**. The plan's source of error is visible: `test/` has 18 violations, of which 12 are top-level `test/*.test.ts` and 6 more are `test/helpers/*`. `plan.md:330` hedges with "(including `test/helpers/*` at 96–100)" as if `test/helpers/*` were a handful of incidental extras rather than 6 of the 18 — the count was taken from a partial read of Turn 2's evidence string. Note the `find`-based count of 26 is coincidentally identical to the plan's claim, which is why the wrong number survived: the author had a wrong number and any check that returned something near it looked like confirmation.

The internal contradiction is unambiguous: `plan.md:312` and `plan.md:330` say 26; `plan.md:384` and `plan.md:418` say 33. The brief asks whether §7 agrees with §9 — **it does not**. §9 was never updated when the Phase 3 evidence was "corrected."

The explanation offered — "The earlier 33 conflated duplicates across the two turns" — is also not the mechanism. 33 is not a duplicate-conflation artifact of 14 and 18 by any obvious reading; the honest statement is that an earlier draft guessed, and the re-measurement still miscounted `test/`.

**Recommendation.** Fix all four sites to **32 (14 `src/` + 18 `test/`, of which 6 are `test/helpers/*`)**. Delete the "conflated duplicates across the two turns" rationalization — replace with the measured derivation and note that 12 of the 18 `test/` violations are top-level suites and 6 are `test/helpers/*` modules, so a top-level-only count under-reports by 6. State the counting rule (files where `raw.split("\n").length > 95`, per `src/saas/codebase-modularity-deep-introspector.ts:49-51,59-61`) so a future re-measurement is unambiguous.

### M-2. The untracked-file column in the §7 trigger-token table is wrong for 10 of 11 rows

`plan.md:236-248` presents two columns, "Tracked files" and "Incl. untracked," asserting 0/0 for `readiness_verdict`, `revenue_events`, `NOWPAYMENTS`, `sk-or-v1-`, `sk-ant-`, `AIzaSy` and 0/1 (this plan) for the other five.

The `git grep -Il` figures are all exactly 0 — verified, 11/11 correct.

But re-running the plan's own stated second search (`grep -rIl` over `plans docs src test .env.example .mekong`) returns **1 for all 11 tokens**, and in every case the single match is the plan file itself (`plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md`, which is untracked). I confirmed this per-token; e.g. `readiness_verdict` → 1 file, and that file is the plan.

So the table's right-hand column understates its own search by exactly the rows where the author forgot the plan file is itself untracked. `plan.md:234` acknowledges the general principle in prose ("The only file that mentions any of these strings at all is the plan file you are reading") — but the table then contradicts that prose in 10 rows.

The **substance** is unharmed: zero real leaks, and the prose caveat is correct. This is a table-vs-prose inconsistency in a deliverable whose AC-2 acceptance criterion explicitly requires "A written block names every foreign trigger token, states its match count as 0 across the repo." As written, the table does not meet its own stated criterion.

**Recommendation.** Either correct all 11 "Incl. untracked" cells to `1 (this plan)`, or — cleaner — drop the second column and add one sentence: "The second search returns exactly one file for every token: this plan file, which is untracked and quotes the tokens as the explanation itself." The latter is both accurate and shorter, and it removes a column that can only mislead.

### M-3. `test/adversarial-verification-suite.test.ts` does not exist

`plan.md:154`, `plan.md:328`, and `plan.md:383` all cite `test/adversarial-verification-suite.test.ts` as a failure location. That file does not exist. `bun test` itself confirms: "The following filters did not match any test files … `test/adversarial-verification-suite.test.ts`".

The actual file is **`/Users/macbook/durios/test/adversarial-verification.test.ts`**, and the failing test lives at `test/helpers/adversarial-verification-export-network-scenarios.ts:23`. All three citations are wrong, which means a reader following Defect 2's instructions to "triage the defect list" hits a dead path three times.

**Recommendation.** Replace all three occurrences with `test/adversarial-verification.test.ts` (failure via `test/helpers/adversarial-verification-export-network-scenarios.ts:23`, `EADDRINUSE`).

### M-4. The port-binding failure attribution is stated more confidently than the evidence supports, and is mischaracterized as likely-environmental

`plan.md:328` calls the three port failures "**Likely environmental**: `lsof -i :31099` returns nothing, so no stale owner holds the port." I confirmed both facts: `lsof -i :31099` returns nothing, and `test/adversarial-verification.test.ts` fails with `EADDRINUSE` / "Failed to start server. Is port 31099 in use?".

But "no stale owner holds the port" and "likely environmental" are **in tension**, not support. If no process holds the port, `EADDRINUSE` is not a foreign-holder problem — it points at something else. And the second location, `test/process-restart-persistence.test.ts`, fails differently and more tellingly: it does not print `EADDRINUSE` at all, it prints `Server process failed to bind and respond to health check within timeout` after a **5001ms** wait. That is a **timeout signature, not an address-in-use signature.**

That distinction matters because this sandbox has local port binding disabled. The two failures are plausibly two different causes:

- `adversarial-verification.test.ts` — genuine `EADDRINUSE` (possibly a real race with another test using the same hardcoded port, or a lingering socket in TIME_WAIT from the same run)
- `process-restart-persistence.test.ts` — a spawned child process never binds at all, most consistent with binding being blocked in this environment

Grouping both under one "environmental" label with one `lsof` command as the proof is exactly the kind of unearned confidence the rest of the review brief asks me to flag. `plan.md:160` does hedge in the right direction ("the port-binding failures may be environmental — re-check `lsof -i :31099` before attributing them to a regression"), and `plan.md:419` repeats the hedge, so the plan is not *asserting* a cause. But `plan.md:328`'s "**Likely environmental**" verdict plus a single negative `lsof` as its evidence is stronger than the data carries.

**Recommendation.** At `plan.md:328`, split the two: state that `adversarial-verification.test.ts` fails with a real `EADDRINUSE` on a hardcoded port (cite `test/helpers/adversarial-verification-export-network-scenarios.ts:23`), while `process-restart-persistence.test.ts` fails with a 5s bind/health-check timeout and no `EADDRINUSE` — which is a different signature. Replace the `lsof` reassurance with the actual observation: both must be re-checked on a host with local binding permitted before either is called a regression. This is more honest and still costs one sentence.

## Low Priority

### L-1. `AGENTS.md` line range cited for Zero-Custody is off by two

`plan.md:71` cites "(`AGENTS.md` lines 6-8.)" for the Zero-Custody mandate. The relevant text — "**Safety Boundaries**: No public marketplace, no payment holding/custody, no AI autonomous sign-offs, and no real customer data ingestion until all five launch gates (`GATE-01..GATE-05`) pass." — is at **`AGENTS.md:8`**. Lines 6-7 cover the Stage-Zero baseline and V2 doc status. The range is close enough to be defensible as a block citation but a grep for the boundary sentence lands on line 8, not 6.

### L-2. §7 ships a 25-row placeholder table that AC-1 and §12 already supersede

`plan.md:335-363` retains the original planning table with `to capture` in all 75 data cells. `plan.md:363` explains these are populated in Phase 2, and the populated table at `plan.md:270-297` satisfies AC-1. But a reader of §7 encounters two 25-row artifact tables back to back, one entirely placeholder. §12's measurable criterion (`§7 contains exactly 25 rows, each with a non-placeholder SHA-256 and a PASS badge`) is only satisfied by the *second* table. Harmless but confusing.

**Recommendation.** Delete the placeholder table at `plan.md:335-363` and its trailing sentence, or mark it clearly as superseded by the Phase 2 table above it.

### L-3. §8's Step 14 justification asserts a SQLite WAL property the artifact does not contain

`plan.md:372` says Step 14 "exports a signed `workspace-portability-bundle.ts` **without breaking SQLite WAL**". I grepped `src/saas/workspace-portability-bundle.ts` for `wal`/`sqlite`: **zero matches**. The module handles HMAC-signed JSON payloads and profile compilation; it has no SQLite or WAL coupling to break. The claim is not false in spirit (the export path genuinely does not touch the database) but the specific mechanism named does not exist in the cited artifact.

**Recommendation.** Either soften to "exports a signed bundle without touching the SQLite store" or cite the actual storage module that carries the WAL guarantee.

### L-4. Bilingual requirement (AC-6) is not actually satisfied by the delivered line

AC-6 at `plan.md:63` requires "Updated docs remain bilingual (Vietnamese + English)." The delivered `tasks.md:5` — which the plan calls "keeping the existing Vietnamese/English bilingual voice" at `plan.md:185` — is **entirely English**. I checked for Vietnamese diacritics on line 5: zero matches. The pre-existing English text it appended to was likewise English, so the "existing voice" claim is about the file's status key, which is genuinely bilingual (`plan.md` line 6 of tasks.md: `[COMPLETED] (Hoàn thành…) | [IN_PROGRESS] (Đang thực hiện…)`). But the *new* text adds no Vietnamese.

This is a soft finding: AC-6 is arguably satisfied by the file retaining its bilingual status key, and the global rule requires bilingual *client-facing* docs rather than every internal line. Flagging it because AC-6 is stated as an acceptance criterion and the delivered artifact does not meet a literal reading of it.

## Edge Cases and Confirmed-Correct Claims

These are the claims I set out to break and could not. Recording them so the report is evidence-based in both directions:

| Claim | Site | Result |
|---|---|---|
| `blueprint-25-step-auditor.ts:28` is the authoritative 25-entry table | `plan.md:38,113` | **Correct.** Line 28 holds the full `STEP_ARTIFACTS` array, all 25 entries, one line. Auditor regexes at `:46-47` match the plan's description exactly. |
| All 25 artifact paths exist | `plan.md:270-297` | **Correct.** 25/25 exist on disk; all 25 match the auditor's paths byte-for-byte. |
| All 25 SHA-256 (16-hex) values | `plan.md:270-297` | **Correct.** Independently recomputed; 25/25 exact matches. |
| 9 of 25 carry uncommitted edits | `plan.md:298` | **Correct.** Same 9 identified (`field-auditor-cli`, `rbac-policy`, `standalone-manifest-verifier`, `saas-tier-policy`, `workspace-portability-bundle`, `dense-cluster-readiness`, `pilot-kpi-evaluator`, `asean-corridor-adapters`, `sqlite-audit-ledger`). |
| 25/25 regex cross-validation on tasks.md and plan.md | `plan.md:300` | **Correct.** `^- \[x\] \*\*Step <n>:` matches 1-25 in tasks.md; `^## <n>\.` matches 1-25 in plans/company-blueprint/plan.md. |
| All 11 trigger tokens → 0 tracked matches | `plan.md:96,236-248` | **Correct** for the tracked-file column. |
| marketplace-guard.ts `:27-28` dual-lock | `plan.md:254` | **Correct.** `env.DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` && `context.goForLiveCustomerData === true`. |
| marketplace-guard.ts `:43-45` gate refusal | `plan.md:256` | **Correct.** Cites GATE-01..GATE-05 in the throw message. |
| marketplace-guard.ts `:4` type-union member | `plan.md:257` | **Correct.** `"ZERO_CUSTODY_VIOLATION"` is on line 4. |
| marketplace-guard.ts `:37` statutory basis | `plan.md:258` | **Correct.** Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP. |
| `codebase-modularity-deep-introspector.ts:42` `locCeiling = 95 as const` | `plan.md:142,323` | **Correct.** Exact line and exact text. |
| `test/open-core-deep-introspector.test.ts:30` TS2367, `'95' and '100'` | `plan.md:149,317,382` | **Correct.** Line 30 col 12 is `expect(...locCeiling === 100)`, typecheck emits exactly that error. |
| `.env.example:25` flag disabled; 7 keys all `DURIOS_*` | `plan.md:260` | **Correct.** All 8 assignments are `DURIOS_*`; line 25 is `DURIOS_FEATURE_B2B_MARKETPLACE=disabled`. |
| `.gitignore` has no `apps/` or `billing/` rule | `plan.md:262` | **Correct.** Zero matches for either; `git ls-files apps/ billing/` empty. |
| Three citation drifts, resolved toward the auditor | `plan.md:121-125,304-308` | **Correct.** All three read exactly as described; `DURIOS-STRATEGY-V2.json` genuinely absent at root, present under `docs/product-direction/`. |
| Foreign scanner `completed_steps=25` is a default | `plan.md` §13 / brief item 6 | **Correct and fairly characterized.** `phase_560_...:135` declares `completed_steps: int = 25` and `:137` passes it straight into telemetry with no repo-derived input. `evaluate()` at `:141-143` computes `pct = clamped/total*100` from that constant, so "25/25" is 25/25 **by construction**, not by measurement. |
| Foreign scanner's actual failure mode | `plan.md:264` | **Correct in substance, incomplete in detail.** `forbidden prefix` scan is `plan.md`-level `sum(1 for p in FORBIDDEN_SECRET_PREFIXES if p in env_text)` at `:85` over **`.env.example` contents only** — not a secret scan of the repo. The verdict at `:144-146` triggers on `leaked_secrets_detected > 0 or private_dirs_exposed`, and `private_dirs_exposed` at `:137` is `apps_tracked > 0 or not is_clean` — i.e. **any** hygiene miss, including a missing `.gitignore` rule for a nonexistent directory, escalates to `BLOCKED_SECRET_OR_BOUNDARY_LEAK`. That is the real mechanism behind the false verdict and the plan does not state it. |
| "Thirteen hygiene shortfalls ... ten API keys ... two ignore rules ... one missing trademark notice" | `plan.md:264` | **Correct.** `REQUIRED_ENV_EXAMPLE_KEYS` has exactly 10 foreign keys (`OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `ZALO_OA_SECRET_KEY`, `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `JWT_SECRET`); `REQUIRED_GITIGNORE_RULES` has exactly 2 non-existent-dir rules (`apps/`, `billing/`, the other two `*.pem` and `.orchestrate/` are present); `CONTRIBUTING.md` exists with "CLA" but **zero** "Trademark" matches — the count is exactly 13. |
| 12 modules across 3 editions | `plan.md:369` | **Correct.** 6 Community / 4 Pro / 2 Enterprise = 12 `MOD-*` entries. |
| 281 × 60M VND ≈ $657,643 | `plan.md:370` | **Correct, and conservative.** Matches the deep run's `Container Gross Margin: 94.67% (150k VND vs 8k COGS)` and the `VN pure-SaaS ceiling $657643 < $1M target` line; also matches tasks.md:95-97. |
| 8 PH / 3 EXP / 2 LAB / 3 LOG / 5 BUY | `plan.md:372` | **Correct.** `src/sharing/dense-cluster-readiness.ts:18` defaults match exactly. |
| 185 TypeScript files, `any` count 0 | `plan.md:330` | **Correct.** 101 `src/` + 84 `test/` = 185; `anyTypeViolationsCount=0`. |
| 6-tier Moat ladder at `PRODUCT-VISION-V2.md:55`, items `59-66` | `plan.md:125` | **Correct.** Heading at 55, exactly 6 items at 60-65. |
| 9 Hard Kill Criteria at `VALIDATION-AND-ECONOMICS-V2.md:68` | `plan.md:374` | **Correct.** Heading at 68. |
| Typecheck exit 2, one TS2367 | `plan.md:149,317` | **Correct.** Reproduced. |
| Tests: 140 pass / 5 fail / 1 error across 36 files | `plan.md:318` | **Correct.** Reproduced verbatim. |
| Deep run exit 1, `HOLD_MODULARITY_VIOLATIONS`, still `GO_OPEN_CORE_SAAS` | `plan.md:319,321` | **Correct.** Reproduced verbatim. |
| `test/pilot-rehearsal-seeder.test.ts` exists (§8 Step 11) | `plan.md:371` | **Correct.** |
| `test/blueprint-25-step-auditor.test.ts` and `test/open-core-25-step-blueprint-e2e.test.ts` exist and pass | `plan.md:390-391` | **Correct.** 2 pass and 4 pass respectively. |
| Scope discipline: no source change | §3 OUT list | **Respected.** Only `plans/company-blueprint/tasks.md` modified; `@@ -5 +5 @@`. No `apps/`, `billing/`, `OPENROUTER_*`, `PAYOS_*`, `NOWPAYMENTS_*`, or `JWT_SECRET` introduced — all still 0 tracked matches. No new dependency, runtime, or config. |
| Outcome section matches out-of-scope list | §1 vs §3 OUT | **Consistent.** §1 promises verify + explain + map and explicitly disclaims restating strategy ("not to restate business strategy and not to re-implement anything"). No later phase reneges. |
| Dependency graph vs file-ownership table | `plan.md:202-217` | **Consistent.** Graph shows Phases 1/2/4 independent → 3 → 5; ownership marks Phases 1 and 5 as the two writing `tasks.md` L1-6 and the note at `:217` bars concurrency. Graph and table agree. |
| Binh Pháp mapping honesty | `plan.md:376` | **Correct and well-guarded.** "the mapping is a reading aid, not a claim that DuriOS implements Sun Tzu" — the exact disclaimer §4 of the brief asked for. All 6 phases mapped, 6 distinct principles, each justification cites a step number and an artifact path from that phase. No principle reused. |
| SHA-256 baseline reader-misleading risk | `plan.md:298` | **Partially mitigated, insufficiently.** The 9-of-25 caveat is present and honest, but the composite SHA at `:228` is un-caveated (see H-1), and §2's promise of a "stable" baseline overstates. |
| Amended rollback `sed` correctness/safety/reversibility | `plan.md:194-198` | **Correct, safe, reversible.** Verified by direct execution — byte-identical restoration, idempotent, 97 lines preserved. See H-2 (retracted defect, optional hardening only). |
| Phase 1 rollback still references `git checkout` | `plan.md:105` | **Inconsistent with the amendment.** Phase 1's rollback at `:105` still says "revert the tasks.md header with `git checkout -- plans/company-blueprint/tasks.md`" — the dangerous command that Phase 5's amendment at `:194` explicitly removed. Phase 1 also claims to touch `tasks.md` header lines 1-6 (`:92`) while its own steps only write the plan file; if Phase 1 does not actually edit tasks.md, its rollback should not reference it, and the file-ownership table's `W (L1-6)` cell for Phase 1 is wrong. Either way, one of `:92`, `:105`, `:215` is stale relative to the amendment. |
| `binh_phap_state` / `revenue_events` absent from `.mekong/company.json` | `plan.md:240-241` | **Correct and load-bearing.** Confirmed absent; `open_core_25_steps_aligned` absent too, which is why the scanner's `company_clean` at `:124-128` would be `False` and `synchronized` `False` — an additional, separate false negative the plan does not mention. |
| `brainstorm-25-step-opencore-saas.md` missing | — | Not cited by the plan. Noting because the foreign scanner requires it (`:120`) and DuriOS does not have it — a third concrete reason the scanner verdict is repo-mismatched, unmentioned by the plan. |

## Root-Cause Characterization of the Foreign Scanner (brief item 6)

I read the scorer directly. The plan's characterization is **essentially fair and not overstated**, and in one respect understated.

What the plan gets right: `completed_steps: int = 25` at `phase_560_opencore_saas_readiness_engine.py:135` is a **keyword default with no repo-derived input**, threaded through `:137` into `OpenCoreReadinessTelemetry` and consumed at `:142-143` as `pct = round((clamped / total) * 100.0, 2)`. With `total = len(TWENTY_FIVE_OPENCORE_STEPS)` = 25 and `clamped = min(25, 25)`, the engine reports 100% **before any measurement occurs**. The "25/25" is a constant, not a finding. Calling that out is the single most valuable thing this plan does, and it is accurate.

What the plan leaves out, and worth adding because it is the actual causal chain for the false verdict: `verify_filesystem_hygiene` at `:75-111` computes `is_clean` as a **conjunction of five unrelated conditions** (gitignore rules, `.env.example` keys, `LICENSE` text, `CONTRIBUTING.md` text, `apps/` git-index count). At `:137`, `private_dirs_exposed_in_git` is then set to `h.apps_tracked_files_count > 0 or not h.is_clean` — so **any single hygiene mismatch, including a `.gitignore` rule for a directory that does not exist, is reported as "private apps/billing directory exposed."** At `:144-146` that flag alone produces `BLOCKED_SECRET_OR_BOUNDARY_LEAK`. Combined with `audit_blueprint` at `:118-131` requiring a `binh_phap_state.revenue_events` key that DuriOS deliberately does not have and a `brainstorm-25-step-opencore-saas.md` DuriOS deliberately does not carry, the scanner is measuring a **different repository's contract** and reporting the mismatch as a security incident.

This strengthens rather than weakens the plan's conclusion, so adding it is a net improvement: the verdict is not merely a "foreign rule set" artifact, it is a **rule set whose failure taxonomy collapses contract-mismatch into leak**.

## Recommended Actions (priority order)

1. **H-1** — Annotate or refresh the `Blueprint SHA-256` at `plan.md:228`; add `tasks.md` to the mutable-input caveat at `plan.md:298`.
2. **M-1** — Correct the LOC count to 32 (14 src + 18 test) at `plan.md:312`, `:330`, `:384`, `:418`; drop the "conflated duplicates" rationalization; state the counting rule.
3. **M-2** — Fix or remove the untracked column at `plan.md:236-248`.
4. **M-3** — Correct the test filename at `plan.md:154`, `:328`, `:383` to `test/adversarial-verification.test.ts`.
5. **M-4** — Split the two port-failure signatures at `plan.md:328`.
6. **L-1/L-3** — Fix `AGENTS.md` line cite (`:71`) and the WAL claim (`:372`).
7. **L-2** — Remove or clearly mark the placeholder table at `plan.md:335-363`.
8. **Consistency** — Reconcile Phase 1's stale `git checkout` rollback (`:105`), its tasks.md file-ownership cell (`:215`) and its `W (L1-6)` claim (`:92`) against the Phase 5 amendment at `:194`.
9. **Optional** — Add the line-anchor invariant sentence to `plan.md:194` (H-2 hardening, not a blocker).

## Metrics

| Metric | Result |
|---|---|
| Load-bearing claims independently re-verified | 58 |
| Claims confirmed correct | 51 |
| Claims investigated and retracted as false positives | 1 (Phase 5 rollback `sed` — corrected, see H-2) |
| Factual inaccuracies found | 7 (1 high, 4 medium, 2 low) |
| Internal contradictions | 2 (§7 vs §9 LOC count; §7 table vs §7 prose) |
| Stale cross-references after amendment | 1 (Phase 1 rollback vs Phase 5 amendment) |
| Scope violations | 0 |
| Security / trust-boundary defects | 0 |
| Claims where plan is more conservative than warranted | 1 (foreign scanner mechanism understated — see root-cause section) |
| Claims where plan overstates | 1 ("Likely environmental" port attribution) |

## Unresolved Questions

1. Should `plans/company-blueprint/brainstorm-25-step-opencore-saas.md` be added so the foreign scanner's `synchronized` check can pass? I am not recommending it — doing so would be satisfying a foreign contract with DuriOS content, which §3 correctly forbids. But the file's absence is a *second, independent* reason the scanner's blueprint verdict is invalid, and the plan's root-cause block does not mention it.
2. `.mekong/company.json` lacks `open_core_25_steps_aligned`. The plan cites neither this omission nor its effect on `company_clean` at the foreign scanner's `:124-128`. Is the omission intentional (DuriOS not declaring alignment to a foreign catalog) or an oversight?
3. `AC-6` requires bilingual updated docs; the delivered `tasks.md:5` is English-only. Is the bilingual criterion scoped to client-facing docs only, or does it bind this header line?
