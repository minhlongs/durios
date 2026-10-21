---
title: "DuriOS 25-Step Open-Core Idea Pipeline Re-Run with Binh Pháp Mapping"
description: "Re-run the 25-step idea pipeline correctly for DuriOS (Bun/TS, Zero-Custody), correct the false Mekong BLOCKED_SECRET_OR_BOUNDARY_LEAK verdict, and add an explicit Binh Pháp mapping over the six existing blueprint phases."
status: pending
priority: P2
effort: 4h
branch: main
tags: [open-core, blueprint, binh-phap, verification, durios]
created: 2026-10-21
---

# DuriOS 25-Step Open-Core Idea Pipeline Re-Run with Binh Pháp Mapping

## 1. Outcome (observable end state)

A single re-verification run of the DuriOS 25-step Open-Core pipeline exists with three observable properties:

1. **Every one of the 25 steps is re-verified against source code and named artifacts**, producing a per-step table with the artifact path, its current SHA-256, and a PASS / FAIL badge. Reproducible by one command — `bun run blueprint:verify-25-steps` — whose **exit code (0) and step count (25/25) are stable**; the composite SHA-256 it prints is not, and §7 records why.
2. **The false `readiness_verdict` of `BLOCKED_SECRET_OR_BOUNDARY_LEAK` is formally retired.** A written root-cause record states that the verdict's trigger terms (`binh_phap_state`, `revenue_events`, `OPENROUTER_*`, `PAYOS_*`, `NOWPAYMENTS_*`, `JWT_SECRET`) do not exist anywhere in this repository, that DuriOS is Zero-Custody with no custody surface to leak, and that the verdict originated from a foreign scanner rule set rather than a DuriOS finding.
3. **A Binh Pháp (Sun Tzu) mapping table** assigns each of the six phases in `plans/company-blueprint/tasks.md` to one of six Binh Pháp principles, with a one-line justification grounded in that phase's actual step content and its cited artifacts.

The in-repo truth established by this run is: `bun run blueprint:verify-25-steps` already reports 25/25 and exit 0. The re-run's job is to re-verify, explain, and map — not to restate business strategy and not to re-implement anything.

## 2. Users / consumers of the deliverable

| Consumer | What they need from it | How they use it |
|---|---|---|
| Founder / CEO (non-technical, Vietnamese + English) | A short, bilingual summary stating the sinkhole verdict is false and the blueprint is genuinely complete | Reads the outcome section; trusts the per-step evidence table if challenged |
| Engineering & Security | One command to reproduce the 25/25 result; an explicit list of the three real repo defects this run exposed | Runs the validation commands; triages the defect list |
| Governance & Legal | Proof that no secret or boundary leak exists and that Zero-Custody boundaries are intact | Cites the secret-hygiene evidence rows and the boundary modules list |
| Future Blueprint / audit reviewers | A stable artifact → SHA-256 baseline so drift is detectable on the next run | Re-runs and diffs the SHA-256 column |
| Strategic planning (Binh Pháp framing) | A defensible mapping from Sun Tzu principles to the six execution phases | Uses the mapping table in `§8` as narrative scaffolding |

## 3. Scope IN / OUT

### IN

- Re-verify all 25 steps in `plans/company-blueprint/tasks.md` (lines 11-80) against the artifacts named in `src/saas/blueprint-25-step-auditor.ts` (line 28), recording artifact path, SHA-256, and PASS/FAIL per step.
- Reconcile the two places where the tasks.md artifact citation disagrees with the authoritative auditor table, and the one where the tasks.md citation points at a path that does not exist at the stated location.
- Publish a root-cause record retiring the false `BLOCKED_SECRET_OR_BOUNDARY_LEAK` verdict, with the zero-match evidence for each foreign trigger token.
- Publish the Binh Pháp mapping table over the six phases.
- Record the three real repo defects this run surfaces (typecheck error, 5 test failures, `--deep` `HOLD_MODULARITY_VIOLATIONS`) as findings with owners — surfaced, not fixed.
- Update `plans/company-blueprint/tasks.md`'s verification header so the record matches source truth.

### OUT

- Re-implementing or re-deciding any business strategy. The 25 steps are `[COMPLETED]` per the repo's own record; the plan re-verifies, it does not redesign.
- Adding `apps/`, `billing/`, or any foreign project's API keys (`OPENROUTER_*`, `PAYOS_*`, `NOWPAYMENTS_*`, `JWT_SECRET`). DuriOS uses its own `DURIOS_*` prefixes (see `.env.example`) and is Zero-Custody.
- Fixing the three real defects. They are recorded as findings; separate work. Adding a fix here would silently widen scope past a re-verification deliverable.
- Introducing a Python/runtime dependency to satisfy the foreign scanner. DuriOS is Bun + TypeScript, `type: module`.
- Touching source code, `.env.example`, `.gitignore`, `AGENTS.md`, or any `src/**` file.
- Any customer data ingestion, public marketplace, payment custody, or AI autonomous sign-off (forbidden by `AGENTS.md` until `GATE-01..GATE-05` pass).

## 4. Acceptance criteria

| # | Criterion | Observable check |
|---|---|---|
| AC-1 | All 25 steps re-verified with per-step evidence | A table of 25 rows exists, each with `Step`, artifact path, PASS/FAIL, and SHA-256. `bun run blueprint:verify-25-steps` exits 0 and prints `Completed Steps: 25 / 25`. |
| AC-2 | False verdict retired with root cause | A written block names every foreign trigger token, states its match count as 0 across the repo, and shows the DuriOS-native key prefix set (`DURIOS_*`). Verdict string `BLOCKED_SECRET_OR_BOUNDARY_LEAK` appears only inside that explanation, never as a current status. |
| AC-3 | Citation drift reconciled | The 3 drifted artifact citations are each resolved to a single authoritative path, with a one-line reason. No row in the final table points at a non-existent path. |
| AC-4 | Binh Pháp mapping complete and justified | All 6 phases from `plans/company-blueprint/tasks.md` map to one principle each from the 6-principle set, each with a one-line justification tied to real step content. No phase unmapped, no principle used twice. |
| AC-5 | Real defects surfaced, not hidden | The 3 defects each appear with a reproducing command, exit code, and current count. None is marked resolved. `bun run typecheck` exit code and `bun test` pass/fail counts are recorded verbatim as the baseline. |
| AC-6 | Docs consistency preserved | Updated docs remain bilingual (Vietnamese + English) and no file change introduces a native-toolchain dependency or a secret. |

## 5. Constraints & risks

### Constraints

- **KISS / DRY.** One re-run, one table, one command. The Binh Pháp mapping reuses the six phase names already in `plans/company-blueprint/tasks.md` rather than inventing a new phase taxonomy.
- **Evidence-backed only.** Every claim about existing state cites a real file path, verified by re-grep at plan-writing time. Nothing is asserted from scout summary alone.
- **Zero-Custody.** No payment custody, no customer money holding, no public marketplace. (`AGENTS.md` lines 6-8.)
- **Doctrine lock.** No AI autonomous sign-off; human sign-off remains mandatory (`src/verification/hitl-service.ts`).
- **Bilingual.** Client-facing docs stay Vietnamese + English.
- **Native toolchain only.** Bun + TypeScript. No Python, no foreign runtimes.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Re-run is mistaken for a re-implementation and readers assume 25 steps are unverified | Med | Med | State up front that `bun run blueprint:verify-25-steps` already reports 25/25, exit 0; the deliverable is the re-verification record + mapping, and the header says so. |
| False verdict recurs because the foreign scanner rule set is never fed the right inputs | Med | High | The root-cause block names the exact trigger tokens to disable, so a human can re-point the scanner. This plan does not attempt to patch a tool that lives outside the repo. |
| Citation drift gets "fixed" by editing code paths instead of the doc citation, breaking the auditor | Med | High | Resolve drift in the doc citation only. `src/saas/blueprint-25-step-auditor.ts:28` is the authority; never edit it to match a stale citation. |
| Binh Pháp mapping reads as decorative rather than derived | Med | Med | Each justification must cite a step number and an artifact path from the same row. A mapping line without both is rejected. |
| Recording 3 real defects gets misread as "the blueprint failed" | Low | High | The defects are typedcheck/test/LOC hygiene, orthogonal to blueprint step completion. Section 6 Phase 1 says this explicitly. |
| Plan drifts into fixing defects (scope creep) | Med | Med | Phase 5 records findings with an explicit "not fixed here" line and names the follow-up owner. |

## 6. Phases

---

### Phase 1 — Evidence Capture & False-Verdict Root Cause
**Files touched:** `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` (self: §7 Phase 1–3 evidence tables, plus the rollback amendment below); `plans/company-blueprint/tasks.md` header lines 1-6 only.

**Steps**
1. Run `bun run blueprint:verify-25-steps`; capture exit code and the `Completed Steps` and `Blueprint SHA-256` lines verbatim.
2. Run a repo-wide grep for each foreign trigger token — `BLOCKED_SECRET_OR_BOUNDARY_LEAK`, `readiness_verdict`, `binh_phap_state`, `revenue_events`, `OPENROUTER`, `PAYOS`, `NOWPAYMENTS`, `JWT_SECRET`, `sk-or-v1-`, `sk-ant-`, `AIzaSy` — and record the match count for each (all are expected to be 0).
3. Confirm the Zero-Custody posture positively: `DURIOS_FEATURE_B2B_MARKETPLACE=disabled` in `.env.example`, and the market-place dual-lock constants in `src/marketplace/marketplace-guard.ts` and `src/marketplace/escrow-state-machine.ts`.
4. Confirm `.gitignore` omits `apps/` and `billing/` rules and that `.env.example` uses only `DURIOS_*` prefixes.
5. Write the false-verdict record: trigger-term → count 0 → DuriOS-native equivalent → verdict retired.

**Validation command:** `bun run blueprint:verify-25-steps; echo "exit=$?"` — expect exit 0 and `25 / 25`.

**Risk:** Low likelihood, High impact — the record must not accidentally assert a secret exists. Mitigation: every claim is a 0-count grep result, quoted with the exact pattern used.

**Rollback:** Delete the verdict-record section from the plan file and revert the tasks.md header with `git checkout -- plans/company-blueprint/tasks.md`. No source file is touched in this phase.

---

### Phase 2 — Per-Step Artifact Re-Verification (25 rows)
**Files touched:** `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` only (§7 evidence table). No source, no tasks.md.

**Steps**
1. Read the authoritative artifact table at `src/saas/blueprint-25-step-auditor.ts:28`. Treat it as the single source of truth for step → artifact path.
2. For each of the 25 entries, run `existsSync`-equivalent (`[ -f <path> ]`) and `shasum -a 256 <path>`.
3. Emit one row: `Step`, title, artifact path, exists Y/N, SHA-256 (first 16 hex), PASS/FAIL.
4. Cross-check against the regex the auditor itself applies: tasks.md rows must match `^- \[x\] \*\*Step <n>:` and `plans/company-blueprint/plan.md` must contain `^## <n>\.`. Both files currently satisfy this for all 25 steps.
5. Where tasks.md and the auditor table disagree, resolve toward the auditor and record the drift.

**Resolved drift (verified at plan time):**

| Step | tasks.md cites | Auditor requires (`blueprint-25-step-auditor.ts:28`) | Resolution |
|---|---|---|---|
| 6 | `DURIOS-STRATEGY-V2.json` (implying repo root) | `docs/product-direction/DURIOS-STRATEGY-V2.json` | Doc-only citation correction; the file exists at the `docs/product-direction/` path, not at root. |
| 25 | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | Both exist and both contain the 9 Hard Kill Criteria; auditor's path wins for the verification row. Note both in the table so the legal cite is not lost. |
| 17 | `PRODUCT-VISION-V2.md` (Moat ladder) | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | Auditor's path wins. The 6-tier Moat ladder genuinely lives in `PRODUCT-VISION-V2.md` (section at line 55, items at lines 59-66); cite both, verify against the auditor path. |

**Validation command:** `for n in $(seq 1 25); do awk -v s=$n 'BEGIN{f=0} /^- \[x\] \*\*Step '"$n"':/{f=1} END{exit !f}' plans/company-blueprint/tasks.md && echo "step $n tasks.md OK"; done | wc -l` — expect 25.

**Risk:** Medium likelihood, Low impact — a path typo in the table. Mitigation: SHA-256 is computed from the path, so a typo yields a visible failure, not a silent pass.

**Rollback:** This phase only adds rows to the plan file. Rollback = delete the table section. No code or repo state changes.

---

### Phase 3 — Defect Baseline Record (surface, do not fix)
**Files touched:** `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` only (§9 defect baseline).

**Steps**
1. Run `bun run typecheck`, record exit code and the error list.
2. Run `bun test`, record the pass/fail/error counts and the names of the 5 failing tests.
3. Run `bun run src/saas/blueprint-cli.ts --deep`, record exit code and the `Modularity Verdict` line.
4. State the LOC ceiling truth: `src/saas/codebase-modularity-deep-introspector.ts:42` sets `locCeiling = 95`, and 32 files under `src/` and `test/` currently exceed it (14 + 18).
5. Label each defect with owner and an explicit "not fixed in this plan" line.

**Baseline (verified 2026-10-21):**

| Check | Command | Exit | Result |
|---|---|---|---|
| Typecheck | `bun run typecheck` | 2 | 1 error — `test/open-core-deep-introspector.test.ts(30,12)`: TS2367, `types '95' and '100' have no overlap` |
| Tests | `bun test` | 1 | 140 pass / 5 fail / 1 error across 36 files |
| Deep blueprint | `bun run src/saas/blueprint-cli.ts --deep` | 1 | `Modularity Verdict: HOLD_MODULARITY_VIOLATIONS (maxSrcLoc=100, maxTestLoc=100 <= 95, any=0)` |
| 25-step blueprint | `bun run blueprint:verify-25-steps` | 0 | `YES (100%)`, 25/25 |

The 5 test failures split into two unrelated causes: 2 in `test/open-core-deep-introspector.test.ts` (stale LOC-ceiling expectation: the test asserts 100, the source enforces 95), and 3 in `test/adversarial-verification-suite.test.ts` plus `test/process-restart-persistence.test.ts` (test-harness port binding, `port 31099 in use`). Neither cause implicates blueprint step completion.

**Validation command:** the four commands in the table above, run in order, exit codes recorded as-is.

**Risk:** Medium likelihood, Medium impact — readers may conflate these hygiene defects with blueprint failure. Mitigation: the table opens with the 25/25 exit-0 row and the surrounding text states the defects are orthogonal.

**Rollback:** Additive record in the plan file. Rollback = delete the section. Note: the port-binding failures may be environmental — re-check `lsof -i :31099` before attributing them to a regression.

---

### Phase 4 — Binh Pháp Mapping
**Files touched:** `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md` only (§8). No source, no tasks.md.

**Steps**
1. Anchor to the six phases as written in `plans/company-blueprint/tasks.md` lines 10-80.
2. Map each phase to exactly one of: 始計 strategic assessment, 作戰 resource economics, 謀攻 attack by stratagem, 軍爭 maneuvering, 九地 terrain/variation, 火攻 fire attack/decisive timing.
3. Write a one-line justification per phase citing at least one step number and one artifact path from the same phase.
4. Verify no principle is reused and no phase is unmapped.

**Mapping table: `§8` below.** Validation = the table has 6 rows, 6 distinct principles, each justification containing a `Step N` reference and a file path.

**Risk:** Low likelihood, Medium impact — mapping could look decorative. Mitigation: each justification is anchored to concrete step content, enforced by the validation requirement above.

**Rollback:** Delete the mapping section. No repo state changes.

---

### Phase 5 — Docs Header Sync & Findings Handoff
**Files touched:** `plans/company-blueprint/tasks.md` header lines 1-6 only.

**Steps**
1. Update the `Last Updated` line to record that a re-verification run was performed, keeping the existing Vietnamese/English bilingual voice and the existing `[COMPLETED]` / `[IN_PROGRESS] / `[BLOCKED_BY_GATE]` status key.
2. Note in the header that the re-verification used `bun run blueprint:verify-25-steps` and that the record lives in this plan's directory.
3. Leave all 25 step rows and the Revenue Layer 6 section byte-identical — no status changes, no new steps.
4. Hand off the 3 defects as named findings for separate work. State explicitly: "recorded, not fixed."

**Validation command:** `git diff --stat plans/company-blueprint/tasks.md` — expect a small header-only diff, well under 20 lines changed, and `bun run blueprint:verify-25-steps` still exits 0.

**Risk:** Medium likelihood, High impact — accidentally editing a step row would flip the auditor's `^- \[x\] \*\*Step <n>:` match and break the 25/25 result. Mitigation: use targeted line edits on lines 1-6 only, then re-run the auditor to confirm exit 0.

**Rollback (amended in `implement` — see below):** the original rollback line for this phase read `git checkout -- plans/company-blueprint/tasks.md`. That was **removed**, because at implementation time the file already carried 18 lines of uncommitted work that was not authored here — the Revenue Layer 6 block at lines 81-97 plus its `Last Updated` line. A `git checkout --` would have destroyed that work silently and irreversibly. The implemented rollback is a targeted single-line `sed` on line 5, which restores the previous header text and leaves every other line byte-identical:

```bash
sed -i '' '5s/.*/**Last Updated:** 2026-10-21 — Revenue Layer 6 (Trade-Finance \& Marine Insurance Verified Dossier API) added as `[IN_PROGRESS]`; see `plans\/261021-1821-financial-verification-room\/`./' plans/company-blueprint/tasks.md
```

### Phase dependencies

```
Phase 1 ──┐
          ├──> Phase 3 ──> Phase 5
Phase 2 ──┘        ─┘
Phase 4 ───────────┘
```
Phases 1, 2, and 4 are independent and read-only (plan file only) and may run in parallel. Phase 3 consumes the raw runs from 1 and 2. Phase 5 runs last: it is the only phase that edits a tracked repo file.

### File ownership (no two phases touch the same file)

| File | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| `plans/261021-2015-.../plan.md` | W | W | W | W | R |
| `plans/company-blueprint/tasks.md` | W (L1-6) | - | - | - | W (L1-6) |

Phases 1 and 5 both touch tasks.md lines 1-6; they must not run concurrently.

## 7. Per-Step Evidence Table (populated in Phase 2)

### Phase 1 evidence — captured 2026-10-21 (`implement`)

**Blueprint audit result (first capture, before this plan edited `tasks.md`):**

```
Overall Passed: YES (100%)
Completed Steps: 25 / 25
Blueprint SHA-256: fddc58df34d5c79747c2c62ddb39b6f98bcb6e6a192767bb48822341edc42d36
exit=0
```

**Important — that composite SHA is not reproducible.** `fddc58df…` is the digest this run printed *before* Phase 5 edited `plans/company-blueprint/tasks.md`. The composite includes `tasks.md`, and this plan modified it (a one-line header append), so a live re-run now prints **`0e58f111f300e5ca4a8b6f70c45c72d6cacd0c48ada85c9f16aec1489a3d435e`**. The value is recorded here as a dated observation, not a stable baseline, and §1's "reproducible by one command" claim applies to the **exit code and the 25/25 count** — which are stable — not to the composite digest, which changes whenever any covered file changes. The 9-of-25 caveat in Phase 2 covers the per-file artifacts; this note covers the composite.

**Foreign trigger tokens — match counts.**

Two searches were run. `git grep -Il` covers tracked files only; a second direct `grep -rIl` over `plans docs src test .env.example .mekong` also covers untracked files. Every count is 0 across tracked files. The only file that mentions any of these strings at all is the plan file you are reading, which quotes them as the explanation itself — that is expected, not a leak.

| Token | Tracked files | Incl. untracked |
|---|---|---|
| `BLOCKED_SECRET_OR_BOUNDARY_LEAK` | 0 | 1 (this plan) |
| `readiness_verdict` | 0 | 0 |
| `binh_phap_state` | 0 | 1 (this plan) |
| `revenue_events` | 0 | 0 |
| `OPENROUTER` | 0 | 1 (this plan) |
| `PAYOS` | 0 | 1 (this plan) |
| `NOWPAYMENTS` | 0 | 0 |
| `JWT_SECRET` | 0 | 1 (this plan) |
| `sk-or-v1-` | 0 | 0 |
| `sk-ant-` | 0 | 0 |
| `AIzaSy` | 0 | 0 |

**Zero-Custody posture (positive proof, not absence-of-evidence):**

| Fact | Source | Line |
|---|---|---|
| Marketplace dual-lock requires the flag **and** the gate | `src/marketplace/marketplace-guard.ts` | `:27-28` — `featureFlagEnabled && context.goForLiveCustomerData === true` |
| Flag is `disabled` in the shipped example env | `.env.example` | `:25` |
| Marketplace refuses while `goForLiveCustomerData` is false, citing the 5 gates | `src/marketplace/marketplace-guard.ts` | `:43-45` |
| Violation type exists in the type union | `src/marketplace/marketplace-guard.ts` | `:4` — `"ZERO_CUSTODY_VIOLATION"` |
| Statutory basis named in the refusal message | `src/marketplace/marketplace-guard.ts` | `:37` — Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP |

**DuriOS-native `.env.example` key set (complete):** `DURIOS_HOST`, `DURIOS_PORT`, `DURIOS_DB_PATH`, `DURIOS_DATA_DIR`, `DURIOS_BACKUP_DIR`, `DURIOS_FEATURE_B2B_MARKETPLACE`, `DURIOS_OTP_PROVIDER`. Seven keys, all `DURIOS_*`. No third-party provider credential appears.

**`.gitignore` omissions:** `apps/` rule count 0, `billing/` rule count 0. Neither directory exists in the repository (`git ls-files apps/ billing/` returns nothing), so these are prospective rules, not live leaks.

**Verdict retired.** On this evidence the `BLOCKED_SECRET_OR_BOUNDARY_LEAK` result is a false positive produced by a foreign rule set. DuriOS has zero leaked secrets, zero tracked private directories, and a Zero-Custody posture enforced in code with the marketplace disabled by default. The thirteen hygiene shortfalls are contract mismatches: ten API keys for providers DuriOS deliberately does not integrate, two ignore rules for directories that do not exist, and one missing trademark notice in `CONTRIBUTING.md`.

**The precise mechanism, which is worse than "a strict checklist."** At `src/core/opencore/phase_560_opencore_saas_readiness_engine.py:137` in the foreign scanner, the leak signal is computed as:

```python
h.apps_tracked_files_count > 0 or not h.is_clean
```

So **any** single hygiene shortfall — including a `.gitignore` rule missing for a directory that does not exist — is reported under the message *"Secret leak or private apps/billing directory exposed in public git index."* The verdict conflates two different things: an actual leak, and an incomplete checklist. DuriOS trips the second. The same scanner also requires a `.mekong/company.json` key `binh_phap_state.revenue_events` and a file `plans/company-blueprint/brainstorm-25-step-opencore-saas.md`, neither of which DuriOS is expected to have. This makes the false positive structurally guaranteed for any repo that is not the Python project the scanner was written for — it is not a borderline judgment call that DuriOS happened to lose.

### Phase 2 evidence — per-step artifact re-verification (2026-10-21)

All 25 rows below come from the authoritative artifact table at `src/saas/blueprint-25-step-auditor.ts:28`, not from `tasks.md` prose. SHA-256 values are the first 16 hex characters of the digest of the file **as it exists in the working tree right now**.

| Step | Artifact | Exists | SHA-256 (16) | Uncommitted |
|---|---|---|---|---|
| 1 | `src/saas/open-core-edition-manifest.ts` | YES | `9487a5946f6cf4c5` | no |
| 2 | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` | YES | `cce526dadccaee41` | no |
| 3 | `src/verification/hitl-service.ts` | YES | `36b253e6ec336277` | no |
| 4 | `src/export/field-auditor-cli.ts` | YES | `62c68cb0215df92a` | **yes** |
| 5 | `docs/product-direction/PRODUCT-PRD-V2.md` | YES | `4898b9ec32aaeb35` | no |
| 6 | `docs/product-direction/DURIOS-STRATEGY-V2.json` | YES | `45beafb59ec9358e` | no |
| 7 | `src/auth/rbac-policy.ts` | YES | `def7b06b3c974cb8` | **yes** |
| 8 | `docs/product-direction/PRODUCT-VISION-V2.md` | YES | `a42305e0691f9ddb` | no |
| 9 | `src/export/standalone-manifest-verifier.ts` | YES | `77354cd3d5830085` | **yes** |
| 10 | `src/sharing/verified-org-profile.ts` | YES | `12f34553b88a27d5` | no |
| 11 | `src/auth/pilot-rehearsal-seeder.ts` | YES | `d18d30d9fa88ee52` | no |
| 12 | `src/auth/pilot-kpi-extended-types.ts` | YES | `71b65c18fd3f1878` | no |
| 13 | `src/saas/saas-tier-policy.ts` | YES | `70258f25e553312a` | **yes** |
| 14 | `src/saas/workspace-portability-bundle.ts` | YES | `170fbafc2ef5e287` | **yes** |
| 15 | `src/sharing/dense-cluster-readiness.ts` | YES | `e296fe4e3a299cc7` | **yes** |
| 16 | `src/auth/pilot-kpi-evaluator.ts` | YES | `22c01879f37f3528` | **yes** |
| 17 | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | YES | `2a5d116b17715bd5` | no |
| 18 | `src/server/tenant-rate-limiter.ts` | YES | `3c2d2b48fe5ea151` | no |
| 19 | `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` | YES | `445b539ebce4d8ea` | no |
| 20 | `src/rules/asean-corridor-adapters.ts` | YES | `af2c80d8148b2090` | **yes** |
| 21 | `src/storage/sqlite-audit-ledger.ts` | YES | `dcd227bb2bae5183` | **yes** |
| 22 | `.mekong/company.json` | YES | `401b8307518ecd45` | no |
| 23 | `src/marketplace/marketplace-guard.ts` | YES | `add74aba6c6f32da` | no |
| 24 | `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md` | YES | `b97bd4776f5e5fc8` | no |
| 25 | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | YES | `39ea1abb2d9b1a67` | no |

**Result: 25 / 25 exist, 25 / 25 PASS.** Nine of the 25 carry uncommitted edits in the working tree, so their digest is a working-tree value and will change on the next commit. This is recorded rather than hidden — a reviewer comparing against a clean checkout will see nine differences and should know why.

**Cross-validation (the auditor's own regexes):** `plans/company-blueprint/tasks.md` matches `^- \[x\] \*\*Step <n>:` for **25 / 25** steps, and `plans/company-blueprint/plan.md` contains `^## <n>\.` for **25 / 25**. Both files satisfy the pattern the auditor actually applies, which is why the run reports a genuine 25/25 rather than a partial count.

**Citation drift resolved (doc-only, toward the auditor):**

| Step | `tasks.md` cites | Auditor requires | Resolution |
|---|---|---|---|
| 6 | `DURIOS-STRATEGY-V2.json` (reads as repo root) | `docs/product-direction/DURIOS-STRATEGY-V2.json` | Citation-only fix; the file exists under `docs/product-direction/`, and does **not** exist at root. |
| 25 | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | Auditor wins for the verification row. Both files carry the 9 Hard Kill Criteria, so both are cited; the auditor path is authoritative for the check. |
| 17 | `PRODUCT-VISION-V2.md` (Moat ladder) | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | Auditor wins. The Moat ladder itself lives in `PRODUCT-VISION-V2.md`; cite both, verify the row against the auditor path. |

### Phase 3 evidence — defect baseline, re-measured 2026-10-21

Re-run during `implement` rather than carried over from planning. **Corrected twice — see the note below. The final measured count is 32 files**, not the 26 stated in the first `implement` pass and not the 33 in the planning draft.

| Check | Command | Exit | Result |
|---|---|---|---|
| 25-step blueprint | `bun run blueprint:verify-25-steps` | 0 | `YES (100%)`, `Completed Steps: 25 / 25` |
| Typecheck | `bun run typecheck` | 2 | 1 error — `test/open-core-deep-introspector.test.ts(30,12)` TS2367, `types '95' and '100' have no overlap` |
| Full suite | `bun test` | 1 | 140 pass / 5 fail / 4 error lines across 36 files |
| Deep blueprint | `bun run src/saas/blueprint-cli.ts --deep` | 1 | `Modularity Verdict: HOLD_MODULARITY_VIOLATIONS (maxSrcLoc=100, maxTestLoc=100 <= 95, any=0)` |

Note that the deep run still reports `Idea Verdict: GO_OPEN_CORE_SAAS` and `25-Step Blueprint Passed: YES (25/25)` — the `HOLD` applies only to the modularity dimension, not to blueprint completion.

**Defect 1 — typecheck fails causally.** `src/saas/codebase-modularity-deep-introspector.ts:42` sets `locCeiling = 95 as const`. The test at `test/open-core-deep-introspector.test.ts:30` asserts `locCeiling === 100` and `maxSrcLoc <= 100`. These two cannot both be true. **Owner: maintainer decision.** This is a policy choice (is the ceiling 95 or 100?) that the repo owner must make; it is not a mechanical bug, and this plan does not make it.

**Defect 2 — 5 test failures, two unrelated causes.**

- 2 in `test/open-core-deep-introspector.test.ts` — the same 95-vs-100 contradiction as Defect 1, asserting `GO_MODULAR_ZERO_ANY_VERIFIED` and `locCeiling === 100`.
- 3 in `test/adversarial-verification-suite.test.ts` and `test/process-restart-persistence.test.ts` — these are **two different failure signatures, not one cause**, and the earlier draft that grouped them was wrong:
  - `test/adversarial-verification.test.ts` (1) fails with a genuine `EADDRINUSE` on the hardcoded port 31099, raised at `src/server/server.ts:68` via `startLocalServer`, reached from `test/helpers/adversarial-verification-export-network-scenarios.ts:23`. Empty `lsof -i :31099` is consistent with a sandbox that grants `bind()` then refuses the listen, which is the likely cause here; it also affects `test/process-restart-persistence.test.ts` indirectly.
  - `test/process-restart-persistence.test.ts` (2) emits **no `EADDRINUSE` at all** — it reports `this test timed out after 5000ms`. Empty `lsof` is irrelevant to a timeout and cannot be used as evidence for it. Its cause is unverified here; do not attribute it to port availability.

  Re-check both on a machine where local port binding is permitted before triaging any of them as regressions. None of the 5 failures touch blueprint step completion.

**Defect 3 — modularity HOLD, 32 files over the ceiling.** 14 under `src/` (including `src/workspace/container-dossier-workspace.ts(100)` and several at 98–100) and 18 under `test/` — of which 12 are `test/helpers/*` files at 96–100 and 6 are `test/*.test.ts`. Zero `any`-type violations across 185 TypeScript files, so strict typing is clean. **Owner: engineering, separate work.**

**Correction history for this count (kept deliberately, because the wrong number survived its own check):** the planning draft said 33; the `implement` pass said 26 with an explicit claim that 33 was wrong; both were incorrect. The true figure is **32**. The 26 undercount came from parsing only `test/*.test.ts` paths and dropping the 12 `test/helpers/*` entries that share the same failing turn. A `find | xargs wc -l` line count coincidentally also returns 26, which is why the error passed for a while. Ground truth was established by calling `evaluateCodebaseModularityDeep` directly and counting the distinct file paths inside each failing turn's evidence string: 14 + 18 = 32.

All three are recorded as findings with owners. **None is fixed here.**


| Step | Title | Artifact (verifier path) | Exists | SHA-256 (16 hex) | Badge |
|---|---|---|---|---|---|
| 01 | Open-Core Master Framework | `src/saas/open-core-edition-manifest.ts` | to capture | to capture | to capture |
| 02 | 2026 Truthful Plan Refresh | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` | to capture | to capture | to capture |
| 03 | Agentic OS & HITL Governance | `src/verification/hitl-service.ts` | to capture | to capture | to capture |
| 04 | Pilot Readiness & Audit Evidence | `src/export/field-auditor-cli.ts` | to capture | to capture | to capture |
| 05 | Conditional 5-Stage Sequencing Roadmap | `docs/product-direction/PRODUCT-PRD-V2.md` | to capture | to capture | to capture |
| 06 | Economic Truth First & Multi-Revenue Stack | `docs/product-direction/DURIOS-STRATEGY-V2.json` | to capture | to capture | to capture |
| 07 | Tri-Tuple Buyer & Operator Personas | `src/auth/rbac-policy.ts` | to capture | to capture | to capture |
| 08 | Category Positioning | `docs/product-direction/PRODUCT-VISION-V2.md` | to capture | to capture | to capture |
| 09 | Bilingual Open-Source Docs & MIT Verifier | `src/export/standalone-manifest-verifier.ts` | to capture | to capture | to capture |
| 10 | Federated Privacy-First Narrative | `src/sharing/verified-org-profile.ts` | to capture | to capture | to capture |
| 11 | Field-First Demo & Blind-Fault Testing | `src/auth/pilot-rehearsal-seeder.ts` | to capture | to capture | to capture |
| 12 | Case Study Evidence Protocol | `src/auth/pilot-kpi-extended-types.ts` | to capture | to capture | to capture |
| 13 | Community-to-Pro Upgrade Trigger | `src/saas/saas-tier-policy.ts` | to capture | to capture | to capture |
| 14 | Signed Workspace Portability Funnel | `src/saas/workspace-portability-bundle.ts` | to capture | to capture | to capture |
| 15 | Dense Cluster GTM Playbook | `src/sharing/dense-cluster-readiness.ts` | to capture | to capture | to capture |
| 16 | North Star & Funnel Metrics | `src/auth/pilot-kpi-evaluator.ts` | to capture | to capture | to capture |
| 17 | Strategic & VC Narrative | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | to capture | to capture | to capture |
| 18 | Dual-License IP, Rate Limiting & Hygiene | `src/server/tenant-rate-limiter.ts` | to capture | to capture | to capture |
| 19 | On-Premise Resilience & Backup Runbook | `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` | to capture | to capture | to capture |
| 20 | Competitive & Regional Benchmarks | `src/rules/asean-corridor-adapters.ts` | to capture | to capture | to capture |
| 21 | Evidence-Backed Audit Data Room | `src/storage/sqlite-audit-ledger.ts` | to capture | to capture | to capture |
| 22 | Quarterly OKRs | `.mekong/company.json` | to capture | to capture | to capture |
| 23 | Dual-Lock Marketplace & Zero-Custody | `src/marketplace/marketplace-guard.ts` | to capture | to capture | to capture |
| 24 | Personal Data Protection & Disclaimers | `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md` | to capture | to capture | to capture |
| 25 | 9 Hard Kill Criteria & Incident Playbook | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | to capture | to capture | to capture |

All 25 artifact paths above were confirmed present on disk during planning; the SHA-256 and badge columns are captured in Phase 2 because they must reflect the run, not a planning-time snapshot.

## 8. Binh Pháp Mapping Table (populated in Phase 4)

| tasks.md Phase | Steps | Binh Pháp Principle | Justification tied to real content |
|---|---|---|---|
| Phase 1 — Foundation & Open-Core Architecture | 1-5 | 始計 **Strategic Assessment** | Before any market move, Step 1 fixes the edition boundary in `src/saas/open-core-edition-manifest.ts` (12 modules across 3 editions) and Step 5 commits to a conditional 5-stage sequence in `docs/product-direction/PRODUCT-PRD-V2.md`; Sun Tzu's opening judgment is whether the ground and the terms are settled at all. |
| Phase 2 — Business Model & Unit Economics | 6-7 | 作戰 **Resource Economics** | Step 6 prices the stack against a hard ceiling (281 packhouses × 60M VND ≈ $657,643) and Step 7 fixes the buyer/operator roles in `src/auth/rbac-policy.ts` — the chapter is about what the campaign costs and who funds it, not about combat. |
| Phase 3 — Brand, Open-Source Community & Content | 8-12 | 謀攻 **Attack by Stratagem** | Step 8 category positioning, Step 9 bilingual MIT verifier, Step 10 privacy-first narrative, and Step 12 case-study evidence all win the market by argument and demonstrated proof rather than by force; Step 11's blind-fault rehearsal at `test/pilot-rehearsal-seeder.test.ts` is the demonstration that substitutes for combat. |
| Phase 4 — Revenue & Conversion Engine | 13-15 | 九地 **Terrain / Variation** | Step 13 toggles on edition at the same site, Step 14 exports a signed `workspace-portability-bundle.ts` without breaking SQLite WAL, and Step 15's `src/sharing/dense-cluster-readiness.ts` refuses to expand before the Cai Lậy cluster holds 8 PH / 3 EXP / 2 LAB / 3 LOG / 5 BUY — one terrain, three different advantages, exactly the chapter's prescription. |
| Phase 5 — Operations, Security & Readiness | 16-21 | 軍爭 **Maneuvering** | Step 16 North Star metrics, Step 18 tenant rate limiting at `src/server/tenant-rate-limiter.ts`, Step 19 offline-first `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` backup, and Step 21's SHA-256 audit data room (`src/storage/sqlite-audit-ledger.ts`) close distance with the packhouse, keep guard, seize momentum, and stay resilient while the gate conditions resolve. |
| Phase 6 — Execution, Legal Guardrails & Governance | 22-25 | 火攻 **Fire Attack / Decisive Timing** | The gates are explicitly placed after every other phase, and the required timing is stated in code — the 9 Hard Kill Criteria table at `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:68`, plus the `B2B` marketplace and custody code blocked by default at `src/marketplace/marketplace-guard.ts:28` (requires `DURIOS_FEATURE_B2B_MARKETPLACE=enabled` AND `goForLiveCustomerData === true`). The decisive element (paying customer, real OTP, live trade) is held until the moment the evidence supports it. |

Note: the mapping is a reading aid, not a claim that DuriOS implements Sun Tzu. Its sole value is that the sequencing logic is already present in the phases.

## 9. Defect Baseline (populated in Phase 3)

See `§6 Phase 3` for the verified baseline table with commands and exit codes. Three defects are recorded, none fixed here:

1. `bun run typecheck` exits 2 — one TS2367 in `test/open-core-deep-introspector.test.ts:30`.
2. `bun test` — 5 failures (2 stale LOC-ceiling expectations in `test/open-core-deep-introspector.test.ts`; 3 test-harness port-binding failures in `test/adversarial-verification-suite.test.ts` and `test/process-restart-persistence.test.ts`).
3. `bun run src/saas/blueprint-cli.ts --deep` exits 1 — `HOLD_MODULARITY_VIOLATIONS`; 32 files under `src/` and `test/` exceed the `locCeiling = 95` at `src/saas/codebase-modularity-deep-introspector.ts:42`, with `any` count 0.

## 10. Test Matrix

| Level | What is validated | Command | Expected at completion |
|---|---|---|---|
| Repo-owned unit | 25-step audit regex matching (`^- \[x\] \*\*Step <n>:` in tasks.md; `^## <n>\.` in plan.md) | `bun test test/blueprint-25-step-auditor.test.ts` | pass |
| Repo-owned e2e | Edition manifest + workspace portability API over real HTTP | `bun test test/open-core-25-step-blueprint-e2e.test.ts` | pass |
| Repo-owned deep | Socratic turns incl. modularity ceiling | `bun run src/saas/blueprint-cli.ts --deep` | known-baseline exit 1 recorded verbatim |
| Repo-owned suite | Full regression | `bun test` | known-baseline 140/5/1 recorded verbatim |
| Repo-owned types | Strict TS | `bun run typecheck` | known-baseline exit 2 recorded verbatim |
| Plan deliverable | 25 rows populated, 6 mapping rows distinct, 3 defects listed | manual review of plan.md against §4 | AC-1..AC-6 satisfied |
| Doctrine | No added custody surface; no new secret; bilingual docs preserved | grep `DURIOS_FEATURE_B2B_MARKETPLACE` still `disabled`; grep for foreign tokens still 0 | AC-2, AC-6 satisfied |

## 11. Backwards Compatibility & Migration

- **No data migration.** No schema, no storage, no `.db` files, no `.env` changes.
- **No API change.** No route in `src/server/http-router.ts` is added, removed, or renamed, including `/api/v1/open-core/edition-manifest`, `/api/v1/open-core/portability`, and `/api/v1/open-core/portability/verify`.
- **No public contract change.** `evaluateBlueprint25Steps` in `src/saas/blueprint-25-step-auditor.ts` keeps its signature and the `Blueprint25StepAuditReport` shape.
- **tasks.md compatibility.** Step rows stay byte-identical so the auditor's regexes keep matching. Only the header changes.
- **Reader-facing migration.** Anyone holding the previous run's `BLOCKED_SECRET_OR_BOUNDARY_LEAK` output should read the Phase 1 record and treat it as superseded.

## 12. Success Criteria (measurable)

1. `bun run blueprint:verify-25-steps` exits 0 with `Completed Steps: 25 / 25`; the `Blueprint SHA-256` captured in `§7` is labelled as a dated observation, not a stable baseline.
2. `§7` contains exactly 25 rows, each with a non-placeholder SHA-256 and a PASS badge.
3. The verdict record lists 11 foreign trigger tokens, each with match count 0.
4. `§8` contains exactly 6 rows, 6 distinct principles, each justification containing a `Step N` reference and a file path.
5. `§9` lists exactly 3 defects with reproducing commands; none is marked fixed.
6. `git diff --stat plans/company-blueprint/tasks.md` shows a header-only diff and the auditor still exits 0 afterwards.

## 13. Unresolved Questions

1. **External scanner provenance.** The `BLOCKED_SECRET_OR_BOUNDARY_LEAK` verdict string does not exist anywhere in this repository (verified: 0 matches). Its source rule set lives outside the repo, so this plan documents the false positive rather than patching the scanner. If the operator can name the tool and config file, a follow-up should re-point it at DuriOS-native conventions (`DURIOS_*` prefixes, Bun/TS, no `apps/`, no `billing/`).
2. **LOC ceiling target.** `src/saas/codebase-modularity-deep-introspector.ts:42` enforces 95 while `test/open-core-deep-introspector.test.ts:30` asserts 100 and 32 files currently exceed 95. Which number is the intended standard is a maintainer decision this plan deliberately does not take; the defect is recorded, not resolved.
3. **Port-binding test failures.** Three failures report `port 31099 in use`. This may be a stale process on the operator's machine rather than a code regression. Re-check `lsof -i :31099` before anyone treats it as a defect to fix.
4. **Layer 6 scope.** `plans/company-blueprint/tasks.md` (lines 84-97) carries an `[IN_PROGRESS]` Revenue Layer 6 with a planned `MOD-ENT-03` that is not yet registered in `src/saas/open-core-edition-manifest.ts`. The 25-step count intentionally excludes Layer 6; whether the next run should extend to it is a founder decision.
