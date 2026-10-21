---
title: "DuriOS 25-Step Blueprint Re-Run with Accurate Binh Pháp Mapping"
description: "Re-run the DuriOS 25-step idea pipeline with a defensible six-phase Binh Pháp mapping and a byte-accurate evidence record, re-deriving every count from source instead of copying the prior run."
status: pending
priority: P2
effort: 4h
branch: main
tags: [open-core, blueprint, binh-phap, verification, durios, accuracy]
created: 2026-10-21
---

# DuriOS 25-Step Blueprint Re-Run with Accurate Binh Pháp Mapping

## 1. Outcome (observable end state)

1. **Every one of the 25 steps is re-verified against source, with each artifact's path and full SHA-256 recorded fresh in this run.** `bun run blueprint:verify-25-steps` exits 0 and prints `Completed Steps: 25 / 25`. The `Blueprint SHA-256` it prints is a *dated observation*, not a stable baseline, and this plan states exactly why (`plans/company-blueprint/tasks.md` and `plans/company-blueprint/plan.md` are both editable inputs, so the digest moves when either is touched — `src/saas/blueprint-25-step-auditor.ts` hashes all three files on every invocation).
2. **The false `BLOCKED_SECRET_OR_BOUNDARY_LEAK` verdict is retired with full root cause, and for the first time with named provenance.** The record cites the exact external file and line that emits the verdict string, names all 11 foreign trigger tokens with fresh 0-match counts, and states the DuriOS-native prefix set (`DURIOS_*`, 12 entries in `.env.example`, 0 foreign prefixes). The verdict string appears only inside that explanation, never as a current status.
3. **The prior run's own numeric errors are corrected in the open.** Every count in this plan's evidence tables is recomputed in this run and labelled with the method used, so a reader can see that 32 (not 26) is the true LOC-violation count and that 9 (not 10) of the 25 artifacts are uncommitted. Section 6.3 lists the three prior-run corrections that this plan supersedes.
4. **The Binh Pháp mapping is 6 phases → 6 distinct canonical principles, each justified by a real Step number and a real artifact path, with the one substantive disagreement called out.** The mapping notes explicitly where the prior run's Binh Pháp assignment was loose and states which assignment this run defends instead, so the reader can audit the change rather than inherit it silently.
5. **The four real defects are recorded as named findings with owners, none marked fixed.** Typecheck exit 2, 5 test failures in three distinct causes (2 LOC-expectation, 1 environmental `EADDRINUSE`, 2 timeout races), `HOLD_MODULARITY_VIOLATIONS` on `--deep`, and a newly-found CI secret-guard failure on `.env.example` are each recorded with a reproducing command, exit code, and current count.

## 2. Users / consumers of the deliverable

| Consumer | What they need from it | Failure mode if inaccurate |
|---|---|---|
| Non-technical founder (Vietnamese/English) | A trustworthy "25/25 PASS" statement and a plain-language reason why the foreign verdict was wrong | An inflated LOC count or a wrong uncommitted-artifact count reads as a false alarm, or worse hides a real one |
| Next implementer of Phase 5 (docs header sync) | The exact current `Last Updated:` line, byte-for-byte, so a targeted restore is possible instead of a destructive checkout | A `git checkout --` rollback destroys 18 lines of pre-existing uncommitted Layer 6 work |
| Maintainer resolving the four defects | Each defect's exact command, exit code, and the three separate causes behind the 5 test failures | Treating port-binding failures as a code regression wastes a cycle; treating the LOC ceiling as resolved re-opens a decided standard |
| Anyone auditing the plan itself | Per-count provenance: which command produced which number, and where a prior number was wrong | An accuracy deliverable whose own numbers drift is worse than no deliverable |

## 3. Scope

### IN

- Re-verify all 25 steps in `plans/company-blueprint/tasks.md` (lines 10–80) against the authoritative artifact table at `src/saas/blueprint-25-step-auditor.ts` (line 28), recording full path, full SHA-256, uncommitted Y/N, and PASS/FAIL per step.
- Establish the false-verdict retirement record with fresh grep counts and named external provenance.
- Re-derive the LOC-violation, dirty-artifact, and test-failure counts independently in this run, recording the method beside each number.
- Record the four real repo defects as findings with owners — surfaced, not fixed.
- Write the 6-phase Binh Pháp mapping with per-phase justification and an explicit note where it departs from the prior run.
- Update a single line (line 5) of `plans/company-blueprint/tasks.md` to point at this plan's directory, leaving all 25 step rows and the Revenue Layer 6 block byte-identical.

### OUT

- Fixing the four defects. They are findings; a fix here would silently widen scope past a re-verification deliverable.
- Diverging from the canonical Binh Pháp chapter sequence to a different chapter set. The mapping uses the six classical chapters and cites canonical content; it does not invent a chapter ordering.
- Adding `apps/`, `billing/`, or any foreign project's API keys (`OPENROUTER_*`, `PAYOS_*`, `NOWPAYMENTS_*`, `JWT_SECRET`). DuriOS uses `DURIOS_*` prefixes only and is Zero-Custody.
- Patching or suppressing the external Python scanner at `/Users/macbook/mekong-cli/src/core/opencore/phase_560_opencore_saas_readiness_engine.py`. This plan documents the false positive; re-pointing that scanner is a separate, cross-repo decision.
- Touching any `src/**`, `test/**`, `.env.example`, `.gitignore`, `AGENTS.md`, or dependency file.
- Any customer data ingestion, public marketplace, payment custody, or AI autonomous sign-off (forbidden by `AGENTS.md` until `GATE-01..GATE-05` pass).
- A new `Blueprint SHA-256` "baseline." The digest is recorded as a dated observation only.

## 4. Acceptance criteria

| # | Criterion | Observable check |
|---|---|---|
| AC-1 | All 25 steps re-verified with per-step evidence | A table of exactly 25 rows exists, each with `Step`, artifact path, full SHA-256, uncommitted Y/N, PASS/FAIL. `bun run blueprint:verify-25-steps` exits 0 and prints `Completed Steps: 25 / 25`. Every row's `Artifact exists` is Y and every row's `tasks.md ✓` and `plan.md ✓` are Y. |
| AC-2 | False verdict retired with root cause and provenance | The record names all 11 foreign trigger tokens each with a fresh 0 count, cites the external file and line emitting the verdict string, shows the 12-entry `DURIOS_*` prefix set, and states 0 foreign prefixes in `.env.example`. `BLOCKED_SECRET_OR_BOUNDARY_LEAK` appears only inside that explanation. |
| AC-3 | Citation drift reconciled to a single authoritative path each | All 3 drifted citations (Steps 6, 17, 25) are resolved to the auditor's path with a one-line reason, and the task-author's original intent is preserved as a note rather than dropped. No row points at a non-existent path. |
| AC-4 | Binh Pháp mapping complete, canonical, and justified | Exactly 6 rows, 6 distinct canonical chapters drawn from the classical thirteen, each justification containing a `Step N` reference and a file path from the same phase. The row for Phase 5 states explicitly that it departs from the prior run, with the reason. The mapping note disclaims any claim that DuriOS implements Sun Tzu. |
| AC-5 | Real defects surfaced, not hidden | Exactly 4 defects, each with a reproducing command, exit code, and current count; the 5 test failures split into three named causes (2 LOC-expectation, 1 environmental EADDRINUSE, 2 timeout races); none marked resolved. LOC count is 32 (14 src + 18 test), with the 26-versus-32 method difference and the 33 phantom-file explanation both recorded. |
| AC-6 | Docs consistency preserved and scope contained | `git diff --stat plans/company-blueprint/tasks.md` shows a header-only one-line diff; the auditor still exits 0 afterwards; `git status --porcelain` shows no new dirty file under `src/`, `test/`, or `.env*`. |

## 5. Constraints & risks

### Constraints

- One tracked repo file may change, and only its line 5. The 128 dirty files in the working tree are pre-existing and are not this plan's to touch or clean.
- C1: Every numeric claim carries its derivation. A number copied from the prior run is not evidence.
- C2: All Binh Pháp chapter names are canonical. No chapter is invented, renamed, or mapped twice.
- C3: Rollback must be reversible without `git checkout` on any tracked file carrying uncommitted foreign work.
- C4: `plans/company-blueprint/tasks.md` step rows stay byte-identical so the auditor's `taskRegex` at `src/saas/blueprint-25-step-auditor.ts:46` and `planRegex` at `:47` keep matching. (The prior plan cited line 62, which is the `completedStepsCount` filter — the regexes are at 46–47.)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R1: Shasum output is not reproducible across time because artifacts are intentionally dirty | High | Low | Every SHA is labelled with the capture date and the dirty flag. The plan states that the digest is an observation, and §1's first bullet and §6 Phase 0 record the reason the composite digest cannot be a baseline. |
| R2: A reader trusts a prior-run number that this run corrects | High | Medium | Each corrected number appears with both values and the reason for the change (26 → 32; 10 → 9). The prior plan stays on disk as the record superseded. |
| R3: Line-5 edit accidentally alters a step row, breaking the auditor regex | Medium | High | Edit is a single-line `sed` targeting line 5 only, followed immediately by a re-run of `bun run blueprint:verify-25-steps` in the same validation step. Rollback is the inverse `sed` from the recorded prior line 5, not `git checkout`. |
| R4: The port-binding failure is environmental, so a future run reports different counts | Medium | Low | Phase 3 re-checks `lsof -i :31099` and records which of the three causes each of the 5 failures belongs to, so no failure is silently attributed to a regression. |
| R5: The Binh Pháp mapping is read as authoritative doctrine rather than a reading aid | Low | Medium | The mapping note states its sole value is that the sequencing logic is already present in the phases, and disclaims any implementation claim. |
| R6: LOC-violation count drifts again if source changes mid-plan | Medium | Low | Phase 6 recomputes the count at write time and records it as a dated count, with the counting method named. |

## 6. Phases

---

### Phase 0 — Baseline Re-Verification (read-only, no writes)
**Purpose:** capture the four authoritative commands fresh so every later phase quotes numbers from this run only.

**Files touched:** none. Read-only.

**Steps**

1. Run `bun run blueprint:verify-25-steps`; record exit code, `Overall Passed`, `Completed Steps`, and `Blueprint SHA-256` verbatim.
2. Run `bun run typecheck`; record exit code and every error line verbatim.
3. Run `bun test`; record pass / fail / error counts, file count, and the name of every failing test.
4. Run `bun run src/saas/blueprint-cli.ts --deep`; record exit code and every verdict line verbatim.
5. Re-derive the LOC-violation count with the *same method the auditor uses*, and separately with `wc -l`, and record both numbers with a one-line explanation of why they differ. The auditor counts `raw.split("\n").length` at `src/saas/codebase-modularity-deep-introspector.ts:49` and `:59`, which yields one more than `wc -l` on any file ending in a trailing newline. The authoritative number is the auditor's, because the verdict is the auditor's.
6. Record the dirty-file baseline: `git status --porcelain | wc -l`.

**Validation command:** the four commands above, run in order, exit codes recorded as-is.

**Risk:** Medium likelihood, Low impact — the port-binding failures may be environmental, making `bun test` counts non-comparable with the prior run's. Mitigation: record counts verbatim and check `lsof -i :31099` so the environmental vs code cause is attributed, not guessed.

**Rollback:** none required. No file is written in this phase.

---

### Phase 1 — False-Verdict Retirement Record (writes the plan file only)
**Purpose:** formally retire the foreign readiness verdict and, for the first time, name its source.

**Files touched:** `/Users/macbook/durios/plans/261021-2345-durios-25-step-binh-phap-accurate/plan.md` (a new `## False-verdict retirement record` section appended after §10).

**Steps**

1. Run a fresh repo-wide grep for each of the 11 foreign trigger tokens across tracked source, excluding `plans/` and `docs/` where the tokens legitimately appear as quoted explanation: `BLOCKED_SECRET_OR_BOUNDARY_LEAK`, `readiness_verdict`, `binh_phap_state`, `revenue_events`, `OPENROUTER`, `PAYOS`, `NOWPAYMENTS`, `JWT_SECRET`, `sk-or-v1-`, `sk-ant-`, `AIzaSy`. Record the count for each. Expected: 0 for all 11.
2. Name the provenance. The verdict string is emitted at `/Users/macbook/mekong-cli/src/core/opencore/phase_560_opencore_saas_readiness_engine.py:152`, which returns `OpenCoreReadinessVerdict.BLOCKED_SECRET_OR_BOUNDARY_LEAK` with reason `"Secret leak or private apps/billing directory exposed in public git index."` Its trigger conditions are `telemetry.leaked_secrets_detected > 0 or telemetry.private_dirs_exposed_in_git`. Its `FORBIDDEN_SECRET_PREFIXES` constant sits at line 23 (`sk-or-v1-`, `sk-ant-`, `AIzaSy`), and `REQUIRED_ENV_EXAMPLE_KEYS` at lines 18–22 demands ten foreign credential names DuriOS deliberately does not carry: `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `ZALO_OA_SECRET_KEY`, `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `JWT_SECRET`. The third positional argument to `OpenCoreReadinessTelemetry` at line 144 is `h.apps_tracked_files_count > 0 or not h.is_clean`, and `is_clean` at line 109 aggregates `.gitignore`, `.env.example`, `LICENSE`, and `CONTRIBUTING.md` hygiene — so **any single missing governance artifact trips the verdict, whether or not a real leak exists.** Its company-file check at line 125 requires `binh_phap_state.revenue_events` to be empty and `open_core_25_steps_aligned is True`.
3. Show each condition is false for DuriOS: no `apps/` or `billing/` directory exists (verified: `git ls-files apps/ billing/` returns nothing, so `apps_tracked_files_count` is 0); no prefix from `FORBIDDEN_SECRET_PREFIXES` appears in `.env.example` (verified: 0 matches); `.mekong/company.json` contains none of `binh_phap_state`, `revenue_events`, or `open_core_25_steps_aligned` (verified: 0 matches), so that check is a schema mismatch, not a finding. The scanner additionally requires `plans/company-blueprint/brainstorm-25-step-opencore-saas.md`, which does not exist, and requires the lens strings `[Business]`, `[Agentic]`, `[Governance]` in `tasks.md` (lines 120–121).
4. State the DuriOS-native prefix set positively: **7** `DURIOS_*` entries in `.env.example` — `DURIOS_HOST`, `DURIOS_PORT`, `DURIOS_DB_PATH`, `DURIOS_DATA_DIR`, `DURIOS_BACKUP_DIR`, `DURIOS_OTP_PROVIDER`, `DURIOS_FEATURE_B2B_MARKETPLACE`. Zero foreign prefixes. (The prior plan's "12 entries" was an overcount.)
5. Confirm the Zero-Custody posture positively: `marketplace-guard.ts:27` requires both `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` and `context.goForLiveCustomerData === true`, and `marketplace-guard.ts:43-45` blocks activation until GATE-01..GATE-05 pass.
6. Write the record: trigger token → fresh 0 count → DuriOS-native equivalent → verdict retired, with the external citation.

**Validation command:** `for t in BLOCKED_SECRET_OR_BOUNDARY_LEAK readiness_verdict binh_phap_state revenue_events OPENROUTER PAYOS NOWPAYMENTS JWT_SECRET sk-or-v1- sk-ant- AIzaSy; do printf "%-40s %s\n" "$t" "$(git grep -c -I -- "$t" -- ':(exclude)plans' ':(exclude)docs' | wc -l | tr -d ' ')"; done` — expect 11 lines of `0`.

**Risk:** Low likelihood, High impact — the record must not accidentally imply a secret exists. Mitigation: every claim is a 0-count grep result quoted with the exact pattern, and the external file is cited by path and line rather than paraphrased.

**Rollback:** delete this section from the plan file. No repo state changes; no tracked file is touched.

---

### Phase 2 — Per-Step Artifact Re-Verification (25 rows)
**Purpose:** produce the evidence table, recomputing every SHA and every dirty flag in this run.

**Files touched:** `/Users/macbook/durios/plans/261021-2345-durios-25-step-binh-phap-accurate/plan.md` only (a new `## Per-step evidence table` section appended after §10).

**Steps**

1. Read the authoritative artifact table at `src/saas/blueprint-25-step-auditor.ts:28` (the `STEP_ARTIFACTS` constant). Treat it as the single source of truth for step → artifact path.
2. For each of the 25 entries run `shasum -a 256 <path>` and `git diff --quiet -- <path>` to fill exists, SHA-256, and uncommitted. Record the *full* digest, not a prefix — the prior run's 16-hex truncation made byte comparison harder and gained nothing.
3. Confirm the auditor's own two regexes hold for all 25: tasks.md rows match `^- \[x\] \*\*Step <n>:` and `plans/company-blueprint/plan.md` matches `^## <n>\.`. Both were verified true for all 25 in this run.
4. Record the dirty-artifact count and name which of the 25 are dirty. Verified in this run: **9 of 25** — `src/export/field-auditor-cli.ts`, `src/auth/rbac-policy.ts`, `src/export/standalone-manifest-verifier.ts`, `src/saas/saas-tier-policy.ts`, `src/saas/workspace-portability-bundle.ts`, `src/sharing/dense-cluster-readiness.ts`, `src/auth/pilot-kpi-evaluator.ts`, `src/rules/asean-corridor-adapters.ts`, `src/storage/sqlite-audit-ledger.ts`. Note that the brief's "9 of 25" matches and that 10 was an overcount in the earlier draft.
5. Resolve the three citation-drift cases to the auditor's path, preserving the task author's intent as a note:

| Step | tasks.md cites | Auditor requires (`blueprint-25-step-auditor.ts:28`) | Resolution |
|---|---|---|---|
| 6 | `DURIOS-STRATEGY-V2.json` (implying repo root) | `docs/product-direction/DURIOS-STRATEGY-V2.json` | The root path does not exist (verified). The file is at the `docs/product-direction/` path. Doc citation correction only. |
| 17 | `PRODUCT-VISION-V2.md` (6-tier Moat ladder) | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | Auditor's path wins for the row; the `docs/product-direction/` prefix is implied and the root path does not exist. The Moat ladder genuinely lives in `docs/product-direction/PRODUCT-VISION-V2.md:55` ("Thang Lợi Thế Cạnh Tranh Thực Sự"), with the six rungs at lines 60–65 (Workflow, Evidence, Outcome, Reputation, Network, Regulatory Adapter). Cite both so the content is not lost. Note the auditor's artifact is not the Moat ladder — it is the 4-layer product stack at `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md:11`. |
| 25 | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` (9 Hard Kill Criteria) | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | Auditor's path wins. **Correction to the prior run:** the 9 Hard Kill Criteria table exists *only* in `VALIDATION-AND-ECONOMICS-V2.md:68` ("Chín Tiêu Chí Dừng Nghiêm Ngặt"). `STRATEGY-V2-BACKLOG.md` contains no such table — the prior claim that "both contain the 9 Hard Kill Criteria" is false. Cite the auditor path for the row and the tasks.md path for the content. |

**Validation command:** `for n in $(seq 1 25); do awk -v s=$n 'BEGIN{f=0} /^- \[x\] \*\*Step '"$n"':/{f=1} END{exit !f}' plans/company-blueprint/tasks.md && echo "step $n tasks.md OK"; done | wc -l` — expect `25`.

**Risk:** Medium likelihood, Low impact — a path typo in the table. Mitigation: SHA-256 is computed from the path, so a typo yields a visible failure rather than a silent pass; `shasum` fails loudly on a missing file.

**Rollback:** delete the table section from the plan file. No code or repo state changes.

---

### Phase 3 — Defect Baseline Record (surface, do not fix) — FOUR defects, not three
**Purpose:** record the four real defects with owners, recomputing the counts rather than copying them.

**Files touched:** `/Users/macbook/durios/plans/261021-2345-durios-25-step-binh-phap-accurate/plan.md` only (§10, replacing the placeholders there).

**Steps**

1. Copy the four-command baseline table produced by Phase 0 into the record.
2. Split the 5 test failures into exactly **three** named causes — the prior plan grouped them into two and got the grouping wrong:
   - **Cause A (2 tests):** `test/open-core-deep-introspector.test.ts` — the stale LOC-ceiling expectation. Line 30 asserts `locCeiling === 100` while `src/saas/codebase-modularity-deep-introspector.ts:42` enforces `95 as const` and line 11 pins the type to the literal `95`, which is why the comparison is dead code. Line 29 (`maxSrcLoc <= 100 && maxTestLoc <= 100`) is currently true but must move to 95 in the same edit. The same root cause surfaces a second time through the HTTP route at line 84.
   - **Cause B (1 test):** `test/adversarial-verification.test.ts` — a genuine `EADDRINUSE`, `syscall: "listen", errno: 0`, raised at `src/server/server.ts:68` via `startLocalServer`, reached from `test/helpers/adversarial-verification-export-network-scenarios.ts:23` where port 31099 is hardcoded. **This is environmental, not a code regression:** `lsof -i :31099` is empty, and a direct bind test proved this sandbox refuses every port including port 0, so the "in use" message is a refused bind surfacing as EADDRINUSE. Re-check the file `bun test test/adversarial-verification.test.ts` outside the sandbox before filing this as a defect.
   - **Cause C (2 tests):** `test/process-restart-persistence.test.ts` — **two timeouts, not port failures.** The harness spawns `bun run src/server/server.ts` (line 22) with a `PORT` passed through the environment (line 25) and polls `/api/health` (line 37), capped at 7000 ms (line 35, error thrown at line 50); Bun's per-test limit is 5000 ms. The Bun timeout wins that race by roughly two seconds, which is why these report `timed out after 5000ms` (measured 5001.43 ms and 5001.44 ms) rather than an EADDRINUSE or the harness's own message. The mechanism is a budget race against the same refused bind, not port contention.
   - **Also note the filename correction:** `test/adversarial-verification-suite.test.ts`, cited by the prior plan, **does not exist**. The file is `test/adversarial-verification.test.ts`.
3. State the LOC-ceiling truth with both counts and the reason for the difference:
   - Auditor-authoritative: **32 files** over the ceiling of 95 — 14 under `src/`, 18 under `test/` (6 in `test/`, 12 in `test/helpers/`). Method: `raw.split("\n").length` at `src/saas/codebase-modularity-deep-introspector.ts:49` (src) and `:59` (test), matching the auditor exactly.
   - `wc -l` method: 26 files — 13 under `src/`, 13 under `test/`.
   - The whole difference is one mechanical cause, independently confirmed this run by replicating both metrics over every `.ts` file: **the audit's figure equals `wc -l + 1` for every file ending in a trailing newline**, because `split("\n")` yields a final empty segment that `wc -l` does not count. The delta is exactly 6.
   - **This also explains the 33 in the earlier draft:** 33 is `wc -l` with a `>= 95` threshold, which wrongly pulls in `test/ui-sample-upload.test.ts` — one of only four files in the tree with **no** trailing newline, so its split count is 95 and the auditor correctly does not flag it. Repo-wide, exactly four files lack a trailing newline: `test/pilot-go-live-pack.test.ts`, `test/ui-sample-upload.test.ts`, `test/marketplace-escrow-guard.test.ts`, `test/helpers/http-api-lifecycle-scenario.ts`.
   - **Correction to the prior run, and its own explanation of the error:** 26 was an undercount produced by using `wc -l` and labelling the result as the auditor's. The prior plan attributed 26 to "parsing only `test/*.test.ts` paths" while also noting that `find | xargs wc -l` returns 26 and calling that a coincidence — it was not a coincidence, it was the actual cause. The verdict is the auditor's, so **32 is authoritative**.
   - Note that `maxSrcLoc=100` and `maxTestLoc=100` are both real: no file exceeds 100 under either metric, so the question is genuinely 95-versus-100 rather than "how far over are we".
4. Record `anyTypeViolationsCount=0` across 185 TypeScript files, and note that this is the one passing turn of the modularity audit.
5. Label each of the **four** defects with an owner and an explicit "not fixed in this plan" line. The fourth was not recorded by the prior run:

   **Defect 4 — the CI secret guard fails on the file it is supposed to permit. Owner: CI maintainer.** `.github/workflows/ci.yml:27` — inside the step named "Guard against tracked secrets, databases, and private keys" (`:25`) — runs `git ls-files | grep -E '(\.env($|\.)|\.db(-shm|-wal)?$|\.(pem|key|p12|pfx)$)'`. `.env.example` is tracked (verified with `git ls-files`) and its name matches that regex, because `\.env` followed by `\.` matches `.env.`. Meanwhile [.gitignore:9](.gitignore:9) ignores `.env.*` and line 10 explicitly re-includes the example with `!.env.example` — so the repository's stated intent is that the example **is** tracked, and the guard contradicts it. Reproducing the guard's exact logic in this run prints `CI WOULD FAIL with: .env.example`. The other two CI gates are green: no tracked `.db`/`.pem`/`.key` files, and the LOC ceiling passes because the largest file is 100 lines against a 179 limit.

**Validation command:** the four commands from the Phase 0 table, run in order; exit codes recorded as-is.

**Risk:** Medium likelihood, Medium impact — a reader may conflate hygiene defects with blueprint failure. Mitigation: the table opens with the 25/25 exit-0 row and the surrounding text states the defects are orthogonal to step completion.

**Rollback:** delete the section from the plan file. No repo state changes.

---

### Phase 4 — Binh Pháp Mapping
**Purpose:** map each of the six phases to one distinct canonical chapter, each justified by real step content.

**Files touched:** `/Users/macbook/durios/plans/261021-2345-durios-25-step-binh-phap-accurate/plan.md` only (§9, replacing the placeholders there).

**Steps**

1. Anchor to the six phase headers as written in `plans/company-blueprint/tasks.md` lines 10, 24, 32, 46, 56, and 72. Verified: Phase 1 = Steps 1–5, Phase 2 = Steps 6–7, Phase 3 = Steps 8–12, Phase 4 = Steps 13–15, Phase 5 = Steps 16–21, Phase 6 = Steps 22–25.
2. Draw each chapter from the canonical thirteen and use each exactly once.
3. Write a one-line justification per phase citing at least one `Step N` and one artifact path from the same phase.
4. Defend the Phase 5 assignment. The prior run mapped Phase 5 to 軍爭. This run keeps 軍爭 for Phase 5 and states the reason, because Phase 5 is genuinely the operating phase: Step 16 North Star metrics at `src/auth/pilot-kpi-evaluator.ts`, Step 18 rate limiting at `src/server/tenant-rate-limiter.ts`, Step 19 the offline-first runbook at `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`, and Step 21 the SHA-256 audit data room at `src/storage/sqlite-audit-ledger.ts`. Maneuvering's substantive content — closing distance with the packhouse, keeping the logs moving under load, staying resilient while the gates resolve — matches. Phase 6's kill criteria are about *ending* the campaign, which is a distinct concern and belongs to 火攻 rather than to 軍爭, so the split is not arbitrary.
5. Verify six rows, six distinct chapters, no phase unmapped, no chapter reused.
6. Append the disclaimer: this is a reading aid, not a claim that DuriOS implements the *Art of War*; its sole value is that the sequencing logic is already present in the six phases.

**Validation:** the table has exactly 6 rows, 6 distinct chapter names, each justification contains a `Step N` reference and a file path, and the Phase 5 row contains the departure note.

**Risk:** Low likelihood, Medium impact — a mapping that looks decorative. Mitigation: every justification is anchored to concrete step content and the Phase 5 departure is argued rather than asserted.

**Rollback:** delete the mapping section. No repo state changes.

---

### Phase 5 — Docs Header Sync (the only phase writing a tracked file)
**Purpose:** point the tracked checklist at this run's record, without disturbing any step row.

**Files touched:** `/Users/macbook/durios/plans/company-blueprint/tasks.md`, **line 5 only**.

**Steps**

1. Confirm the current line 5 byte-for-byte before editing (recorded in §8 as the restore source).
2. Replace line 5 with a line that keeps the existing bilingual voice and the existing status key, and points at this plan's directory:

```
**Last Updated:** 2026-10-21 — Re-verification run: `bun run blueprint:verify-25-steps` reports 25/25 exit 0; Binh Pháp mapping and evidence record at `plans/261021-2345-durios-25-step-binh-phap-accurate/`. Revenue Layer 6 (Trade-Finance & Marine Insurance Verified Dossier API) remains `[IN_PROGRESS]`; see `plans/261021-1821-financial-verification-room/`.
```

3. Leave all 25 step rows, the Revenue Layer 6 block (lines 84–97), and the truthfulness guard byte-identical. The Layer 6 `[IN_PROGRESS]` status is preserved in the new line 5 rather than deleted, because those 18 lines of uncommitted work were not authored by this plan.
4. Immediately re-run the auditor to confirm the regexes still match.

**Validation command:** `git diff --stat plans/company-blueprint/tasks.md && bun run blueprint:verify-25-steps; echo "exit=$?"` — expect `1 insertion(+), 1 deletion(-)`, then exit 0 with `25 / 25`.

**Risk:** Medium likelihood, High impact — editing a step row would flip the auditor's `^- \[x\] \*\*Step <n>:` match and break the 25/25 result, which is the deliverable's headline. Mitigation: a single-line `sed` scoped to `5s/`, followed by the re-run in the same command.

**Rollback — deliberately not `git checkout`.** The prior run amended its own rollback here and that amendment is carried forward. A `git checkout -- plans/company-blueprint/tasks.md` would delete the 18 uncommitted Revenue Layer 6 lines plus the original line 5, destroying work this plan did not author. The rollback is the inverse single-line restore, with the full prior line 5 quoted in §7 so it does not depend on any other record:

```bash
sed -i '' '5s/.*/**Last Updated:** 2026-10-21 — Revenue Layer 6 (Trade-Finance \& Marine Insurance Verified Dossier API) added as `[IN_PROGRESS]`; see `plans\/261021-1821-financial-verification-room\/`./' plans/company-blueprint/tasks.md
```

To validate this rollback without touching the real file, copy `tasks.md` to `$TMPDIR`, run the `sed` there, and `diff` the result against the expected line. BSD `sed` is idempotent here: re-running it against the restored line reproduces the same line.

---

### Phase dependencies

```
Phase 0 ──┬──> Phase 2 ──┐
          │              ├──> Phase 5
          └──> Phase 3 ──┘
Phase 1 ──────────────────┘
Phase 4 ──────────────────┘
```

Phase 0 is read-only and gates Phase 2 (needs the four commands) and Phase 3 (needs the same runs). Phase 1 and Phase 4 are independent of everything and can run at any point. Phase 5 runs last: it is the only phase writing a tracked file, and its validation re-run consumes Phase 2's claim that the regexes match.

### File ownership (no two phases touch the same file)

| File | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|---|
| `plans/261021-2345-.../plan.md` | R | W new section | W new section | W §10 | W §9 | R |
| `plans/company-blueprint/tasks.md` | R | - | R | - | R | W L5 |

Phases 1, 2, 3, and 4 each own a distinct section of the plan file and differ in section number, so they may run in parallel. Phase 5 is the only writer of `tasks.md` and must run after Phase 2 confirms the regexes.

## 7. Prior-run corrections superseded by this run

Three claims from `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` do not survive re-verification and are corrected here rather than inherited:

1. **LOC violation count: 26 → 32.** The prior run's 26 came from `wc -l`. The auditor at `src/saas/codebase-modularity-deep-introspector.ts:49,59` uses `raw.split("\n").length`, which is one higher for any file ending in a newline. The verdict is the auditor's, so 32 (14 src + 18 test) is authoritative. The prior run's own reviewer had flagged this direction of error; the correction is confirmed here with the method named.
2. **Step 25 content location.** The prior run stated both `docs/product-direction/STRATEGY-V2-BACKLOG.md` and `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` contain the 9 Hard Kill Criteria. Only `VALIDATION-AND-ECONOMICS-V2.md:68` does. `STRATEGY-V2-BACKLOG.md` carries a four-group `NOW/NEXT/LATER/NOT_AUTHORIZED` priority backlog and no kill-criteria table.
3. **Uncommitted-artifact count: 10 → 9.** Verified in this run with `git diff --quiet` per artifact: 9 of the 25 carry uncommitted edits. The ninth and final is `src/storage/sqlite-audit-ledger.ts`.

## 8. Restore source for Phase 5

The byte-exact current contents of `plans/company-blueprint/tasks.md` line 5, captured in this run, so the Phase 5 rollback never depends on git:

```
**Last Updated:** 2026-10-21 — Revenue Layer 6 (Trade-Finance & Marine Insurance Verified Dossier API) added as `[IN_PROGRESS]`; see `plans/261021-1821-financial-verification-room/`.
```

## 9. Binh Pháp mapping (populated in Phase 4)

| tasks.md Phase | Steps | Canonical chapter | Justification tied to real content |
|---|---|---|---|
| Phase 1 — Foundation & Open-Core Architecture (`tasks.md:10`) | 1–5 | 始計 Strategic Assessment | Before any market move, Step 1 fixes the edition boundary in `src/saas/open-core-edition-manifest.ts` and Step 5 commits to a conditional 5-stage sequence in `docs/product-direction/PRODUCT-PRD-V2.md`; the chapter's opening question is whether the terms are settled at all, and these two artifacts settle them. |
| Phase 2 — Business Model & Unit Economics (`tasks.md:24`) | 6–7 | 作戰 Resource Economics | Step 6 prices the stack against a hard ceiling in `docs/product-direction/DURIOS-STRATEGY-V2.json` and Step 7 fixes buyer and operator roles in `src/auth/rbac-policy.ts` — the chapter is about what the campaign costs and who funds it. |
| Phase 3 — Brand, Open-Source Community & Content (`tasks.md:32`) | 8–12 | 謀攻 Attack by Stratagem | Step 8 positioning in `docs/product-direction/PRODUCT-VISION-V2.md`, Step 9 the bilingual MIT verifier `src/export/standalone-manifest-verifier.ts`, Step 10 the federated narrative in `src/sharing/verified-org-profile.ts`, and Step 12 case-study evidence all win the market by argument and demonstrated proof; Step 11's blind-fault rehearsal at `src/auth/pilot-rehearsal-seeder.ts` is the demonstration that substitutes for combat. |
| Phase 4 — Revenue & Conversion Engine (`tasks.md:46`) | 13–15 | 九地 Terrain and Variation | Step 13 toggles the edition at the same site via `src/saas/saas-tier-policy.ts`, Step 14 exports a signed `src/saas/workspace-portability-bundle.ts`, and Step 15's `src/sharing/dense-cluster-readiness.ts` will not authorize expansion until the Cai Lậy beachhead holds 8 PH / 3 EXP / 2 LAB / 3 LOG / 5 BUY (`MEKONG_DELTA_CLUSTER_TARGETS`, lines 17–19) **and** paid conversion is confirmed (line 71) — one terrain gated three ways. |
| Phase 5 — Operations, Security & Readiness (`tasks.md:56`) | 16–21 | 軍爭 Maneuvering | **Departs from the prior run's looser framing; retained deliberately.** Step 16 North Star metrics in `src/auth/pilot-kpi-evaluator.ts`, Step 18 tenant rate limiting at `src/server/tenant-rate-limiter.ts`, Step 19 the offline-first runbook `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`, and Step 21 the SHA-256 data room at `src/storage/sqlite-audit-ledger.ts` are all operating-phase concerns: close the distance to the packhouse, keep the guard, keep moving, stay resilient while the gates resolve — which is maneuvering, not attack. |
| Phase 6 — Execution, Legal Guardrails & Governance (`tasks.md:72`) | 22–25 | 火攻 Decisive Timing | This phase carries the stop conditions rather than the fight: the 9 Hard Kill Criteria table at `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:68`, the quarterly OKRs at `.mekong/company.json`, and the dual-lock default at `src/marketplace/marketplace-guard.ts:27` (`DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` AND `goForLiveCustomerData === true`) with GATE-01..GATE-05 required at `:43`. The decisive element — a paying customer, real OTP, live trade — is held until the evidence supports it, and released never if the criteria trip. |

Note: the mapping is a reading aid, not a claim that DuriOS implements Sun Tzu. Its sole value is that the sequencing logic is already present in the six phases.

## 10. Defect baseline (populated in Phase 3) — four defects

Three defects are recorded, none fixed here:

1. **Owner: test maintainer.** `bun run typecheck` exits 2 with one TS2367 at `test/open-core-deep-introspector.test.ts:30` (`types '95' and '100' have no overlap`). Root cause: `:31` asserts `locCeiling === 100` while `src/saas/codebase-modularity-deep-introspector.ts:42` enforces `95 as const`.
2. **Owner: test maintainer, split into three causes.** `bun test` fails 5 tests. Cause A, 2 tests in `test/open-core-deep-introspector.test.ts`, the same stale 95-versus-100 expectation as defect 1. Cause B, 1 test in `test/adversarial-verification.test.ts`, an environmental `EADDRINUSE` (`errno: 0`) on port 31099 hardcoded at `test/helpers/adversarial-verification-export-network-scenarios.ts:23`; `lsof -i :31099` is empty and this sandbox refuses every bind including port 0, so this needs an unsandboxed re-run before it is filed. Cause C, 2 tests in `test/process-restart-persistence.test.ts`, timeout races — Bun's 5000 ms per-test limit beats the harness's own 7000 ms spawn budget (line 35, error at line 50), which is why they report a timeout rather than EADDRINUSE. **The prior plan's "3 port-binding failures" was wrong, and its cited filename `test/adversarial-verification-suite.test.ts` does not exist.**
3. **Owner: engineering lead.** `bun run src/saas/blueprint-cli.ts --deep` exits 1 with `HOLD_MODULARITY_VIOLATIONS (maxSrcLoc=100, maxTestLoc=100 <= 95, any=0)`. 32 files exceed the ceiling of 95 — 14 under `src/` and 18 under `test/`, with 12 of those in `test/helpers/`. `anyTypeViolationsCount=0` across 185 TypeScript files, so strict typing is clean. Three ceilings are simultaneously in play and they disagree: CI enforces 179 (`.github/workflows/ci.yml:34`, currently green), the introspector enforces 95 (`:42`), and the stale test asserts 100 (`test/open-core-deep-introspector.test.ts:30`). Which number is the intended standard is a maintainer decision this plan does not take. Note that `src/saas/codebase-modularity-deep-introspector.ts` and `src/saas/open-core-deep-introspector.ts` are both **untracked** — no commit has ever touched them — so defect 1 is a tracked test importing an untracked source.
4. **Owner: CI maintainer.** `.github/workflows/ci.yml:27`'s secret guard matches the tracked file `.env.example`, so that job fails. `.gitignore:10` explicitly permits the file with `!.env.example`, so the guard contradicts stated intent. The other two CI gates are green (no tracked `.db`/`.pem`/`.key`; largest file is 100 lines against the 179 limit).

## 10b. False-verdict retirement record (populated in Phase 1)
## 10c. Per-step evidence table (populated in Phase 2)

## 11. Test matrix

| Level | What is validated | Command | Expected at completion |
|---|---|---|---|
| Repo-owned auditor | 25-step completion and artifact presence | `bun run blueprint:verify-25-steps` | exit 0, `Completed Steps: 25 / 25`, `Overall Passed: YES` |
| Repo-owned unit | Auditor regex matching and `STEP_ARTIFACTS` shape | `bun test test/blueprint-25-step-auditor.test.ts` | pass |
| Repo-owned e2e | Edition manifest + workspace portability over real HTTP | `bun test test/open-core-25-step-blueprint-e2e.test.ts` | pass |
| Repo-owned deep | Socratic turns including modularity ceiling | `bun run src/saas/blueprint-cli.ts --deep` | known-baseline exit 1 recorded verbatim |
| Repo-owned suite | Full regression | `bun test` | known-baseline 140 pass / 5 fail / 1 error recorded verbatim |
| Repo-owned types | Strict TS | `bun run typecheck` | known-baseline exit 2 recorded verbatim |
| Plan deliverable | 25 rows, 6 distinct chapters, 4 defects, 3 corrections | review of `plan.md` against §4 | AC-1..AC-6 satisfied |
| Doctrine | No added custody surface, no new secret, no native-toolchain dependency | `grep DURIOS_FEATURE_B2B_MARKETPLACE` still default-disabled; 11-token grep still all 0 | AC-2, AC-6 satisfied |

## 12. Backwards compatibility & migration

- **No data migration.** No schema, no storage, no `.db` files, no `.env` changes.
- **No API change.** No route in `src/server/http-router.ts` is added, removed, or renamed, including `/api/v1/open-core/edition-manifest`, `/api/v1/open-core/portability`, and `/api/v1/open-core/portability/verify`.
- **No public contract change.** `evaluateBlueprint25Steps` in `src/saas/blueprint-25-step-auditor.ts` keeps its signature and the `Blueprint25StepAuditReport` shape, so the composite digest remains computable the same way.
- **tasks.md compatibility.** All 25 step rows stay byte-identical so the auditor's regexes keep matching. Only line 5 changes.
- **Reader-facing migration.** Anyone holding the previous run's `BLOCKED_SECRET_OR_BOUNDARY_LEAK` output should read §6 Phase 1 and treat it as superseded. Anyone holding the prior run's 26-file count, its 10-of-25 uncommitted count, its "3 port-binding failures", its `test/adversarial-verification-suite.test.ts` filename, or its "both docs hold the 9 Hard Kill Criteria" claim should read §7.
- **No `git checkout` anywhere in this plan.** The rollback for the one tracked file edited is a targeted line restore using the text preserved in §8.

## 13. Success criteria (measurable)

1. `bun run blueprint:verify-25-steps` exits 0 with `Completed Steps: 25 / 25`; the `Blueprint SHA-256` is captured in §7 and labelled a dated observation, never a stable baseline.
2. §8 contains exactly 25 rows, each with a full SHA-256, an uncommitted Y/N, and a PASS badge; the dirty count stated is 9.
3. The verdict record lists 11 foreign trigger tokens each with a fresh 0 count, and cites `/Users/macbook/mekong-cli/src/core/opencore/phase_560_opencore_saas_readiness_engine.py:152` and `:19-21` and `:125` for provenance.
4. §9 contains exactly 6 rows with 6 distinct canonical chapters, each justification containing a `Step N` reference and a file path, and the Phase 5 row containing its explicit departure note.
5. §10 lists exactly 4 defects with reproducing commands and owners; the 5 test failures are attributed to three named causes; the LOC count is 32 with the 26-versus-32 method difference and the 33 phantom-file explanation recorded.
6. §7 lists exactly 3 prior-run corrections with old value, new value, and reason.
7. `git diff --stat plans/company-blueprint/tasks.md` shows `1 insertion(+), 1 deletion(-)`, and the auditor still exits 0 afterwards.
8. `git status --porcelain` shows no newly dirty file under `src/`, `test/`, or `.env*`; the dirty count is unchanged from 128.

## 14. Unresolved questions

1. **Scanner remediation.** The false verdict has a confirmed source at `/Users/macbook/mekong-cli/src/core/opencore/phase_560_opencore_saas_readiness_engine.py:152`. This plan documents the false positive but does not touch that file, which is outside the DuriOS repo. Should a follow-up re-point its secret allowlist, `.mekong/company.json` schema expectation, and `apps/`/`billing/` assumption at DuriOS conventions (`DURIOS_*`, Bun/TS, no `apps/`, no `billing/`)? This is a cross-repo owner decision.
2. **Which LOC standard is intended.** `src/saas/codebase-modularity-deep-introspector.ts:42` enforces 95 while `test/open-core-deep-introspector.test.ts:31` asserts 100, and 32 files exceed 95. Deciding the standard and splitting the files is real engineering work with its own plan; this plan records the conflict and does not choose a side.
3. **Port 31099 ownership — one failure, not three.** Only `test/adversarial-verification.test.ts` reports a port problem, and `lsof -i :31099` is empty while the sandbox refuses every bind including port 0, so that failure is environmental. The two `test/process-restart-persistence.test.ts` failures are timeout races, not port contention, despite the harness itself binding a different port. Both need one unsandboxed re-run — `lsof -i :31099`, then `bun test test/adversarial-verification.test.ts test/process-restart-persistence.test.ts` — before anyone files a defect. Per the process-management rule, only stop a process clearly owned by this session.
5. **Should the CI secret guard be fixed, and who owns it?** `.github/workflows/ci.yml:27` fails on the tracked `.env.example`, contradicting `.gitignore:10`. Either the regex gains an example exclusion or the intent is that `.env.example` should not be tracked at all — that second reading has legal and onboarding consequences, because the example is how operators learn the `DURIOS_*` key set. This is a maintainer decision recorded here, not resolved.
6. **Should Layer 6 join the next run?** `plans/company-blueprint/tasks.md` lines 84–97 carry an `[IN_PROGRESS]` Revenue Layer 6 whose planned `MOD-ENT-03` is not yet registered in `src/saas/open-core-edition-manifest.ts`. The 25-step count intentionally excludes Layer 6. Extending the next run to cover it is a founder decision.
