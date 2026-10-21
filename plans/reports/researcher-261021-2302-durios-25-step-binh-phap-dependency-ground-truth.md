# Ground Truth for DuriOS 25-Step Binh Pháp Mapping

**Date:** 2026-10-21
**Agent:** researcher #1 (dependency / structure research)
**Scope:** READ-ONLY. No source, docs, or config files modified.
**Verdict up front:** the auditor passes 25/25 live, but the tasks.md prose citations have **4 real drift defects**. The prior plan's Binh Pháp mapping has **3 unsupported claims**. Details below; a plan written from this report should use the corrected values.

---

## 1. The six phases of `plans/company-blueprint/tasks.md`

The file is **97 lines**, not 100 (the `wc -l` was 97; the task brief said "~100"). Line numbers below are current-file actual numbers.

Header block, `plans/company-blueprint/tasks.md:1-8`, verbatim:

```
# DuriOS 25-Step Company Blueprint Task Checklist

**Project:** `~/durios` — Verified Durian Trade Network
**Baseline Date:** 2026-10-17
**Last Updated:** 2026-10-21 — Revenue Layer 6 (Trade-Finance & Marine Insurance Verified Dossier API) added as `[IN_PROGRESS]`; see `plans/261021-1821-financial-verification-room/`. Re-verification run: `bun run blueprint:verify-25-steps` reports 25/25 exit 0; record at `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md`.
**Status Key:** `[COMPLETED]` (Hoàn thành trong mã nguồn/tài liệu) | `[IN_PROGRESS]` (Đang thực hiện tại thực địa) | `[BLOCKED_BY_GATE]` (Chờ điều kiện tiên quyết).
```

The "Re-verification run" clause on **line 5 is not yet committed**. `git diff` shows working-tree only (see §6).

### Phase inventory — confirmed exactly 6

`grep -n "^## "` on the file returns **six** `## Phase` headers, so the phase count of 6 is correct:

| # | Header (verbatim) | Line | Step range |
|---|---|---|---|
| 1 | `## Phase 1 — Foundation & Open-Core Architecture (Steps 1–5)` | 10 | 1–5 |
| 2 | `## Phase 2 — Business Model & Unit Economics (Steps 6–7)` | 24 | 6–7 |
| 3 | `## Phase 3 — Brand, Open-Source Community & Content (Steps 8–12)` | 32 | 8–12 |
| 4 | `## Phase 4 — Revenue & Conversion Engine (Steps 13–15)` | 46 | 13–15 |
| 5 | `## Phase 5 — Operations, Security & Readiness (Steps 16–21)` | 56 | 16–21 |
| 6 | `## Phase 6 — Execution, Legal Guardrails & Governance (Steps 22–25)` | 72 | 22–25 |

All 25 steps are `- [x]`. Note the phases are **lopsided**: Phase 3 holds 5 steps and Phase 5 holds 6, while Phase 2 holds only 2. Any mapping that assumes even step distribution per principle is wrong — 謀攻 covers 5 steps and 始計 covers 5, but 作戰 covers 2 and 火攻 covers 4.

### Revenue Layer 6 (lines 84-97) — outside the 25-step count

Header at `tasks.md:84`:

```
## Revenue Layer 6 — Trade-Finance & Marine Insurance Verified Dossier API (Open-Core Boundary Expansion)
```

It is a **seventh `##` header but not a phase**. It is outside the 25-step count. Evidence:

- It uses `- [ ]` rows with no `**Step N:**` numbering — the three rows are "Layer 6 Phase 1", "Layer 6 Phase 2", "Layer 6 Commercial Module Registration".
- `grep -c "^- \[x\] \*\*Step "` returns **25**, i.e. only the 25 numbered steps are checked. The auditor's regex (`blueprint-25-step-auditor.ts:46`, `^- \[x\] \*\*Step ${entry.step}:`) structurally cannot match a Layer 6 row.
- Layer 6 rows: `tasks.md:86` `[IN_PROGRESS]`, `tasks.md:90` `[BLOCKED_BY_GATE]`, `tasks.md:92` `[PENDING]`.

Statuses and blockers verbatim:

- **Layer 6 Phase 1: Signed Single-Use Attestation Token** — `[IN_PROGRESS]`. Artifacts *planned* (both MISSING, see §2): `src/saas/financial-attestation-token.ts`, `src/server/financial-verification-handler.ts`. Carries its own evidence label: "**Verified** (code plan) / **Hypothesis** (that any bank pays)".
- **Layer 6 Phase 2: `FINANCIAL_INSTITUTION` Tenant + RBAC Tuples** — `[BLOCKED_BY_GATE]`. Blocked by: Phase 1 paying pilot + legal clearance under Luật 91/2025/QH15 + `GATE-01` signed DPA.
- **Layer 6 Commercial Module Registration** — `[PENDING]`. Cites `MOD-ENT-03` in `src/saas/open-core-edition-manifest.ts` under edition `EXPORTER_ENTERPRISE`. **Neither `MOD-ENT-03` nor any third `MOD-ENT-*` exists yet** (§2).

The truthfulness guard at `tasks.md:95-97` states 281 packhouses × 60M VND ≈ $657,643 ARR remains the sole Verified revenue baseline, and Layer 6 must never be reported as revenue until a pilot signs.

**Consequence for the new plan:** Layer 6 must not be folded into the Binh Pháp six-phase mapping, and must not be cited as evidence for any 始計/作戰 claim. It is explicitly Hypothesis-tier. If the plan needs it, it belongs in a clearly separated non-mapped section.

---

## 2. Citation drift between `tasks.md` and the authoritative auditor

**Authority confirmed:** `STEP_ARTIFACTS` is at `src/saas/blueprint-25-step-auditor.ts:28` — the line number in the task brief is **correct**. Caveat: the array was flattened to a **single physical line 28** during the 100-LOC modularity refactor (the file is 81 lines total; the repo's `locCeiling` is 95). Any plan citing `blueprint-25-step-auditor.ts:28` is correct; a plan citing per-row sub-line numbers would be wrong.

**All 25 auditor-required artifacts exist on disk.** I parsed the array and ran `fs.existsSync` against each; every one returned true. Independently, `bun run src/saas/blueprint-cli.ts` reports `Overall Passed: YES (100%)`, `Completed Steps: 25 / 25`. The auditor's own gate logic (`:62-66`) requires both `completedInTasksMd` and `documentedInPlanMd`, so `plan.md` must keep its `## N.` headings — do not renumber.

I extracted **55 distinct path-like citations** from the `*Artifacts:*` rows and checked each against disk. **10 did not resolve as literal paths.** Here is the full triage:

### 2a. Real defects — a citation string that is wrong as written

| Step | tasks.md line | Cited string | Actual on disk | Verdict |
|---|---|---|---|---|
| 3 → 4 | 18 | `GATE-01`..`GATE-05` attributed to `src/export/field-auditor-cli.ts` | Codes are defined in `src/auth/pilot-launch-gate-verifier.ts:12` | **WRONG FILE.** `field-auditor-cli.ts` never mentions GATE ids (grep returns zero hits); it is a CLI wrapper delegating to `pilot-dossier-pack-compiler.ts`, which reads gate results from `pilot-launch-gate-verifier.ts` |
| 4 | 18 | `GATE-01 DPA Consent, GATE-02 OTP, GATE-03 On-Prem Security, GATE-04 Backup, GATE-05 5-Container Rehearsal KPI` | Gate *titles* exist at `pilot-launch-gate-verifier.ts:39` (GATE-01 = signed consent + site approval under Luật 91/2025/QH15) | **PARTIALLY WRONG.** GATE-01 description matches; the rest are plausible but not verified in- file. Cite the verifier, not the CLI |
| 6 | 26 | `DURIOS-STRATEGY-V2.json` (implied repo root) | Exists at `docs/product-direction/DURIOS-STRATEGY-V2.json` — **the auditor's path**. Bare filename is missing from root | **AMBIGUOUS → MISSING as written.** Use the auditor's full path |
| 13 | 48 | `GET /api/v1/open-core/edition-manifest` | Registered at `src/server/http-router.ts:59` as `/api/open-core/edition-manifest`, then `/api/v1` normalized at `http-router.ts:48-52` | **NOT A DEFECT.** The `/api/v1/` prefix is accepted and rewritten to `/api/` (`isV1Scope` → `routePath`). Cite `http-router.ts:52` |
| 14 | 50 | `GET /api/v1/open-core/portability` | `http-router.ts:62` | **NOT A DEFECT** (same normalization) |
| 14 | 50 | `POST /api/v1/open-core/portability/verify` | `http-router.ts:63` | **NOT A DEFECT** (same normalization) |
| 16 | 58 | `Verified GMV`, `Revenue/Verified Container` "in `VALIDATION-AND-ECONOMICS-V2.md`" | `Verified GMV` is at `VALIDATION-AND-ECONOMICS-V2.md:44` ("Verified GMV (North Star tối cao)") and `:40`; `Revenue/Verified Container` — **not found by grep** in that file | **HALF-SUPPORTED.** Cite `:44` for Verified GMV. Drop or re-source the Revenue/Verified Container claim |
| 17 | 60 | "Thang 6 bậc Moat trong `PRODUCT-VISION-V2.md`" | **Exactly 6 numbered moat tiers**, `PRODUCT-VISION-V2.md:55-64` (Workflow, Evidence, Outcome, Reputation, Network, Regulatory Adapter) | **CORRECT.** Good citation |
| 18 | 62 | `gitleaks` clean | Tooling claim, not a path | **UNVERIFIABLE from repo.** Omit or cite CI log |
| 25 (L6) | 89 | `src/saas/financial-attestation-token.ts`, `src/server/financial-verification-handler.ts` | Both **MISSING** | **CORRECTLY MARKED** — these are "Artifacts *planned*", consistent with `[IN_PROGRESS]` |
| 25 (L6) | 93 | `MOD-ENT-03`, edition `EXPORTER_ENTERPRISE` | `MOD-ENT-03` **does not exist**; only `MOD-ENT-01`, `MOD-ENT-02` | **CORRECTLY MARKED** as `[PENDING]`, but a reader must not cite MOD-ENT-03 as existing |

### 2b. The single most load-bearing drift: Step 3 / Step 4 GATE ownership

`tasks.md:16` cites Step 3 artifacts as `AGENTS.md`, `src/auth/rbac-policy.ts`, `src/verification/hitl-service.ts` — all three exist, no drift there.

The drift is in **Step 4, `tasks.md:18`**, which attributes the `GATE-01`..`GATE-05` enumeration to `src/export/field-auditor-cli.ts`. Verified by full read of that 92-line file: it contains **zero** GATE identifiers. The authoritative definitions are:

- `src/auth/pilot-launch-gate-verifier.ts:12` — the union type `"GATE-01" | "GATE-02" | "GATE-03" | "GATE-04" | "GATE-05"`
- `:39` — GATE-01 status object (consent / site approval, Luật 91/2025/QH15)
- `:63` — `goForLiveCustomerData: passedCount === 5`
- `src/domain/pilot-dossier-pack-types.ts:8` — the `linkedGateId` tuple used by the data room

The auditor does not catch this because Step 4's required artifact is `src/export/field-auditor-cli.ts` (which *does* exist) — the CLI is a legitimate entry point, just not where the GATE vocabulary lives. **A Binh Pháp justification for Step 4 must cite `pilot-launch-gate-verifier.ts`, not `field-auditor-cli.ts`.**

### 2c. Auditor vs tasks.md — artifact-path mismatches that do NOT break the gate

The auditor requires one artifact per step. Where tasks.md cites a *different* primary artifact, the auditor still passes (it only checks its own list). These are the notable ones:

| Step | Auditor requires | tasks.md cites (same step) | Both exist? |
|---|---|---|---|
| 6 | `docs/product-direction/DURIOS-STRATEGY-V2.json` | `VALIDATION-AND-ECONOMICS-V2.md` **first**, then bare `DURIOS-STRATEGY-V2.json` | Yes, both |
| 13 | `src/saas/saas-tier-policy.ts` | `open-core-edition-manifest.ts` **first**, then `saas-tier-policy.ts` | Yes, both |
| 16 | `src/auth/pilot-kpi-evaluator.ts` | No code path — doc-only (`VALUMENT...V2.md`) | Yes |
| 17 | `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` | `PRODUCT-VISION-V2.md` | Yes, both — **and tasks.md's choice is the better one for the moat ladder** |
| 25 | `docs/product-direction/STRATEGY-V2-BACKLOG.md` | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` | Yes, both |

For **Step 25** specifically there is a genuine fork. The auditor requires `STRATEGY-V2-BACKLOG.md`; the 9 Hard Kill Criteria table is in `VALIDATION-AND-ECONOMICS-V2.md:68` (verified). Both exist, so the gate passes either way, but a plan citing "9 Hard Kill Criteria" must cite `VALIDATION-AND-ECONOMICS-V2.md:68`, and a plan claiming the auditor's Step 25 artifact must cite `STRATEGY-V2-BACKLOG.md`.

---

## 3. The prior mapping table (`plan.md` §8) — verification of every claim

Source: `plans/261021-2015-durios-25-step-binh-phap-mapping/plan.md:381-393`.

### Principle assignment per phase

| tasks.md Phase | Steps | Prior plan's principle | My verdict on the assignment |
|---|---|---|---|
| 1 — Foundation & Open-Core Architecture | 1–5 | 始計 Strategic Assessment | Defensible |
| 2 — Business Model & Unit Economics | 6–7 | 作戰 Resource Economics | Defensible |
| 3 — Brand, Open-Source Community & Content | 8–12 | 謀攻 Attack by Stratagem | Defensible |
| 4 — Revenue & Conversion Engine | 13–15 | 九地 Terrain / Variation | Defensible, one claim false |
| 5 — Operations, Security & Readiness | 16–21 | 軍爭 Maneuvering | Defensible |
| 6 — Execution, Legal Guardrails & Governance | 22–25 | 火攻 Fire Attack / Decisive Timing | Defensible, citations correct |

The six-principle assignment itself is coherent and I found no phase that is obviously mis-principled. All six canonical Binh Pháp chapters appear exactly once. My concern is not the assignment but the **factual accuracy of the justifications**, below.

### Claim-by-claim verification

**Phase 1 / 始計 — "Step 1 fixes the edition boundary in `src/saas/open-core-edition-manifest.ts` (12 modules across 3 editions)"**
- vERIFIED. `open-core-edition-manifest.ts:37-48` holds **12** module data rows (`grep -c '{ moduleId: "MOD-'` → 12), across `DuriosProductEdition` = 3 values (`saas-tier-policy.ts:3`: `COMMUNITY_OPEN_CORE | PACKHOUSE_PRO_SAAS | EXPORTER_ENTERPRISE`).
- Per-edition split, `grep -o 'edition: "[A-Z_]*"' | sort | uniq -c`: **6 Community, 4 Pro, 2 Enterprise**. This matches the "6 Community, 4 Pro, 2 Enterprise" figure from the deep run exactly. **The prior plan's "12 modules across 3 editions" is correct; the finer split should be quoted as 6/4/2.**
- **Step 5 "conditional 5-stage sequence in PRODUCT-PRD-V2.md" — STAGE COUNT VERIFIED, "CONDITIONAL" SOFTENED.** `PRODUCT-PRD-V2.md:28` states "5 giai đoạn có điều kiện", and `:32`/`:40`,`:52`,`:62`,`:72`,`:81` enumerate STAGE 0→4 — the 5-stage claim is solid. But `:52-81` expresses each stage as an objective plus a scope list, with **no machine-enforced pass/fail condition**. "Conditional" is design intent, not a gate contract like GATE-01..05. `tasks.md:20`'s parenthetical "(Stage 0 -> 4 roadmap)" is accurate; do not upgrade it to an enforced gate.

**Phase 2 / 作戰 — "Step 6 prices the stack against a hard ceiling (281 packhouses × 60M VND ≈ $657,643)"**
- VERIFIED, with the correct paths. `VALIDATION-AND-ECONOMICS-V2.md:15` = 281 active packhouses; `:18` = 60,000,000 VND/packhouse/year; `:21` = the ceiling math `281 × 60.000.000 = 16.860.000.000 VND ≈ $657.643 ARR`.
- The **$657,643 figure is correct and is the sole Verified baseline** per the truthfulness guard at `tasks.md:95-97`.
- One nuance the prior plan omits but which strengthens 作戰: `:23-24` derives **427 packhouses needed** for $1M ARR and states `427 > 281`, concluding that even at 100% Vietnamese market share pure SaaS cannot reach $1M. That is a much sharper 作戰 citation than the ceiling alone — it is the arithmetic proof that the campaign must be funded by something beyond subscription.
- **"Step 7 fixes the buyer/operator roles in `src/auth/rbac-policy.ts`"** — VERIFIED. `rbac-policy.ts:23-26` defines `PACKHOUSE_CLERK`, `PACKHOUSE_MANAGER`, `BUYER_VIEWER`, `SYSTEM_AUDITOR` personas against `PACKHOUSE_EXPORTER` / `BUYER_IMPORTER` / `INSPECTION_AUDITOR` / `ORCHARD_COOP` tenant types.

**Phase 3 / 謀攻 — the weakest justification in the prior plan**
- Step 8 category positioning: VERIFIED. "Verified Durian Trade Network" is in `PRODUCT-VISION-V2.md:11` (heading) and `:17` (bolded definition "**DuriOS = Verified Durian Trade Network**"). Cite `:17`.
- Step 9 bilingual MIT verifier: `README.md` + `src/export/standalone-manifest-verifier.ts` — both exist. The manifest at `:40` describes it as "Zero-dependency offline verifier for Chinese buyers, customs brokers, and banks", which supports the "win by argument not force" reading.
- Step 10 privacy-first narrative: `src/sharing/verified-org-profile.ts` — exists, carries `privacyDisclaimerVi` at `:15` and `PRIVACY_DISCLAIMER` at `:81`.
- **Step 11's claim is CITED TO THE WRONG FILE.** The prior plan says "Step 11's blind-fault rehearsal at `test/pilot-rehearsal-seeder.test.ts` is the demonstration". The *test* file does exist and `:51-52` asserts `blindFaultCount === 2` and `blindFaultsCaught === 2` — so the "100% caught" claim is supported. But the "mean < 5m" half is **not in that file**; the actual computation lives in `src/auth/pilot-kpi-evaluator.ts:37,43` (`deltaSeconds`, `underFiveMinutes: deltaSeconds < 300`, `meanDeltaSeconds`). **Cite the evaluator, not the test, for the timing claim.** Also note `tasks.md:40` attributes "(100% caught, mean < 5m)" to the test file — same drift.
- Step 12 case-study evidence: `src/auth/pilot-kpi-extended-types.ts` — VERIFIED. `:6-9` holds exactly the four field metrics `minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`, matching `tasks.md:42`'s "4 chỉ số giá trị thực địa".

**Phase 4 / 九地 — contains one false claim**
- **FALSE CLAIM: "Step 14 exports a signed `workspace-portability-bundle.ts` without breaking SQLite WAL".**
  I grepped the file case-insensitively for `wal` and `sqlite`: **zero matches** (`grep -in "wal\|sqlite"` → no output). The file is a bundle serializer; it defines `WorkspacePortabilityPayload` (`:9`) with `bundleVersion`, `tenantId/Name/Type`, `profile`, `dossiersSummary`, `auditEventsDigestSha256` (`:24`) and signature fields. It never touches the storage engine, so it **cannot** be claimed to preserve or not preserve SQLite WAL mode. The WAL fact, where it is true, belongs to the manifest's own description of `MOD-AGPL-02` at `open-core-edition-manifest.ts:42` ("Local WAL SQLite persistence") — which is a **Community-tier module**, not part of Step 14's portability bundle.
  **Correct value for a plan:** Step 14 = signed Ed25519 bundle with a SHA-256 audit-event digest (`workspace-portability-bundle.ts:24`), routes at `http-router.ts:62-63`. Say that; say nothing about WAL.
- **Step 13 "toggles on edition at the same site" — VERIFIED.** `saas-tier-policy.ts:8` `buildEntitlements(edition)` gates `cloudVisionOcr`, `managedZaloZnsRelay`, `cloudE2eeBackupVault`, `gaccLiveRegistryWatch`, `crossBorderBuyerPortal` behind `isProOrAbove`, and `multiSiteEnterpriseSync` behind `EXPORTER_ENTERPRISE` only. `:9` `downgradeToCommunity` and `:39-59` handle graceful degradation — supporting "one terrain, different advantages" for the same deployment.
- **Step 15 "8 PH / 3 EXP / 2 LAB / 3 LOG / 5 BUY" — VERIFIED EXACTLY.** `src/sharing/dense-cluster-readiness.ts:17-19`:
  `targetPackhouses: 8, targetExporters: 3, targetLabs: 2, targetColdChainLogistics: 3, targetBuyerImporters: 5`.
  The fail-closed claim is also correct: `:63-64` `expansionAuthorized = beachheadGate05Passed && beachheadPaidConversionConfirmed`, and `:75` requires **both** `expansionAuthorized` **and** all five role counts to be met before `clusterTargetsMet` is true. Block reasons at `:69` (GATE-05 not passed at Cai Lậy) and `:72` (no paid conversion → WTP Kill Criterion #1).
  One refinement worth making: `:60-61` computes `networkDensityScore` as valid verified edges over `n*(n-1)`, capped at 1.0 — the cluster is judged on *verified edges between active nodes*, not raw org counts. `:50-56` drops self-edges, inactive nodes, and zero-container edges. That is a stronger 九地 citation than the role ratios.
- Cluster identity: `:22` `clusterCode: "MEKONG_DELTA_TIENGIANG_01"`, matching the Cai Lậy / Tiền Giang beachhead.

**Phase 5 / 軍爭 — all spot-checked claims hold**
- Step 16 North Star: the metric lives in `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:44`, **not** in `src/auth/pilot-kpi-evaluator.ts` as the auditor's Step 16 artifact implies. The evaluator instead computes GATE-05 KPI (delta seconds, blind-fault catch rate, `:24`,`:37`,`:43-46`). **Cite the doc for the North Star, the evaluator for the gate KPI** — they are different instruments.
- Step 18 tenant rate limiting: `src/server/tenant-rate-limiter.ts:11` `windowMs: 60 * 1000`, plus `:33-47` a SQLite-backed bucket with `blocked_until`. Supports the "keep guard" reading.
- Step 19 backup/restore runbook: `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` — Backup & Restore SOP at `:86`, Restore SOP at `:103`, runnable command at `:107`. The word "offline"/"air-gapped" does **not** appear, so the prior plan's "offline-first" wording is not supported by this file. Describe as on-premise backup + restore with a runnable restore path instead.
- Step 21 SHA-256 audit data room: `src/storage/sqlite-audit-ledger.ts` — VERIFIED and strong. `:1` imports `calculateSha256`; `:19-20` `previous_hash` / `event_hash`; `:40-41` reads the last `event_hash` and falls back to `GENESIS_HASH`; `:42-44` builds the hash input and inserts. A tamper-evident hash chain, exactly as claimed.
- Step 20 regional benchmarks: `src/rules/asean-corridor-adapters.ts:3` — `AseanTradeCorridorCode = "VN_CN" | "MY_CN" | "TH_CN" | "PH_CN"`, verbatim match to the auditor's `tasks.md:66` citation.

**Phase 6 / 火攻 — the prior plan's citations are the most accurate in the document**
- 9 Hard Kill Criteria at `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:68` — **VERIFIED VERBATIM**, line 68 is `## 3. Chín Tiêu Chí Dừng Nghiêm Ngặt (9 Hard Kill Criteria)`. The prior plan's `:68` citation is exactly right.
- Dual-lock at `src/marketplace/marketplace-guard.ts` — **VERIFIED VERBATIM**. `:27` `featureFlagEnabled = env.DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"`; `:28` `return featureFlagEnabled && context.goForLiveCustomerData === true`. The prior plan's citation of `marketplace-guard.ts:28` and its description of the AND condition are both correct.
- `goForLiveCustomerData` provenance: `src/auth/pilot-launch-gate-verifier.ts:63` sets it to `passedCount === 5`, i.e. all five gates. That closes the loop — the marketplace cannot open until the pilot gates pass, which is precisely the 火攻 "held until the evidence supports it" reading. **This link is the strongest single fact in the whole mapping and the prior plan does not cite it** — it should be added.
- Zero-custody enforcement (a good addition for 火攻): `marketplace-guard.ts:64-72` rejects any `custodyMode` other than the licensed bank partner, citing Nghị định 52/2024/NĐ-CP and status 422; `:74-81` rejects seven prohibited field keys (`walletBalance`, `holdFundsAmount`, `platformEscrowBalance`, `cardPan`, `cvv`, `bankSecretKey`, `privateKey`).
- Marketplace default-off rationale: `:37` cites Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP and requires Founder + legal sign-off. Note the statutory references in this file (`248/2026`) **disagree** with those in `pilot-launch-gate-verifier.ts:39` (`Luật 91/2025/QH15`) and `tasks.md:78` (`91/2025/QH15`) — different laws for different purposes (e-commerce vs personal data protection), so this is not necessarily an error, but a plan should not merge them.
- Step 22 OKRs: `.mekong/company.json:33-37` — **VERIFIED**, four dated OKR strings: Q4 2026 (5 gates + DPA + 5-container rehearsal, mean < 5.0 min, 100% blind-fault catch), Q1 2027 (4 field metrics + first commercial contract 5M VND → 60M VND/yr), Q2-Q4 2027 (dense cluster 8+3+2+3), 2028 (verified trade rooms + MY_CN corridor). **This file independently corroborates the 8/3/2/3 cluster ratio and the 60M VND price point** — a useful cross-source check a plan can cite as two-source corroboration.

### Overreach / unsupported claims summary

1. **UNSUPPORTED (Phase 4):** "Step 14 exports a signed bundle without breaking SQLite WAL" — `workspace-portability-bundle.ts` contains no WAL or SQLite reference. False as stated.
2. **MISCITED (Phase 3 / Step 11):** "mean < 5m" attributed to `test/pilot-rehearsal-seeder.test.ts`. The mean and the 300s threshold are in `src/auth/pilot-kpi-evaluator.ts:37,43`. The "100% caught" half *is* in the test (`:51-52`).
3. **MISCITED (Step 4, tasks.md:18):** GATE-01..05 attributed to `src/export/field-auditor-cli.ts`; actually `src/auth/pilot-launch-gate-verifier.ts:12`.
4. **THIN (Phase 3 / Step 8):** "Verified Durian Trade Network" as a `PRODUCT-VISION-V2.md` quote is unverified in this pass.
5. **UNDER-CITED (Phase 6):** the mapping omits the `pilot-launch-gate-verifier.ts:63` → `goForLiveCustomerData` → `marketplace-guard.ts:28` causal chain, which is the actual mechanism making 火攻's "decisive timing" real in code rather than rhetorical.

---

## 4. Is the phase count really 6?

**Yes, confirmed.** `grep -n "^## "` on `plans/company-blueprint/tasks.md` returns seven headers, six of which are `## Phase N` (`:10`, `:24`, `:32`, `:46`, `:56`, `:72`) and the seventh is the non-phase `## Revenue Layer 6` (`:84`). Six phases, 25 numbered steps, contiguous non-overlapping ranges 1–5 / 6–7 / 8–12 / 13–15 / 16–21 / 22–25. No gaps, no duplicates.

---

## 5. Quotable per-phase facts (all verified against source)

### Phase 1 (Steps 1–5) — 始計
- **Module/edition inventory:** `src/saas/open-core-edition-manifest.ts:37-48` — **12 modules, 3 editions**, split **6 Community (MOD-MIT-01..04, MOD-AGPL-01..02) / 4 Pro (MOD-PRO-01..04) / 2 Enterprise (MOD-ENT-01..02)**. Edition union at `src/saas/saas-tier-policy.ts:3`.
- **Zero-lock-in guarantee:** every one of the 12 rows carries `zeroLockInGuarantee: true`; `:59` states that on license expiry DuriOS degrades to `COMMUNITY_OPEN_CORE` with 100% local SQLite read/write/export preserved.
- **License split by module:** MIT for the 4 verifier/utility modules, AGPL-3.0-only for the two rule-engine + storage/RBAC modules, Commercial-Ed25519 for the 6 paid ones.
- **5-stage conditional roadmap:** `docs/product-direction/PRODUCT-PRD-V2.md:28` ("5 giai đoạn có điều kiện") and `:32`→`:81` STAGE 0–4, with STAGE 0 marked "Giai đoạn hiện tại" (`:40`).
- **HITL governance:** `src/verification/hitl-service.ts` exists; `MOD-AGPL-01` (`:41`) covers `src/rules/**, src/verification/**` and mandates Human-in-the-Loop sign-off.

### Phase 2 (Steps 6–7) — 作戰
- **The verified ceiling:** `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:15` = 281 active packhouses; `:18` = 60,000,000 VND/packhouse/yr; `:21` = `281 × 60.000.000 = 16.860.000.000 VND ≈ $657.643 ARR`.
- **The kill math (best single 作戰 citation):** `:23-24` — **427 packhouses required** for $1M ARR, `427 > 281`, therefore pure SaaS cannot reach $1M at 100% share.
- **Alternative revenue path (use carefully — it is a scenario, not verified revenue):** `:40` frames a 0.25% take-rate on $3.85bn Vietnamese durian trade needing only ~$400m GMV for $1m revenue. Label it Hypothesis.
- **North Star:** `:44` "Verified GMV (North Star tối cao)".
- **Tri-tuple personas:** `src/auth/rbac-policy.ts:23-26` — 4 personas × 4 tenant types.

### Phase 3 (Steps 8–12) — 謀攻
- **Moat ladder — exactly 6 tiers:** `docs/product-direction/PRODUCT-VISION-V2.md:55-64` — Workflow, Evidence, Outcome, Reputation, Network, Regulatory Adapter. `:56` explicitly rules out "All-in-one", "AI", "Blockchain", "Marketplace sầu riêng" as insufficient moats.
- **Blind-fault catch rate:** `test/pilot-rehearsal-seeder.test.ts:51-52` asserts 2 blind faults planted, 2 caught.
- **Timing math:** `src/auth/pilot-kpi-evaluator.ts:37` `underFiveMinutes: deltaSeconds < 300`; `:43` `meanDeltaSeconds`.
- **Four field value metrics:** `src/auth/pilot-kpi-extended-types.ts:6-9`.

### Phase 4 (Steps 13–15) — 九地
- **Cluster target ratios:** `src/sharing/dense-cluster-readiness.ts:17-19` — **8 / 3 / 2 / 3 / 5** (packhouses / exporters / labs / cold-chain logistics / buyer-importers), cluster code `MEKONG_DELTA_TIENGIANG_01` (`:22`).
- **Fail-closed expansion:** `:63-64` dual boolean gate, `:75` requires gate **and** all five ratios, `:69`/`:72` are the two block reasons (GATE-05 unpassed; no paid conversion / WTP Kill Criterion #1).
- **Network density, not headcount:** `:50-61` — verified edges between *active* nodes only, self-edges and zero-container edges discarded, density = validEdges / (n·(n−1)) capped at 1.0.
- **Entitlement layering:** `src/saas/saas-tier-policy.ts:8` — 5 features at Pro+, `multiSiteEnterpriseSync` at Enterprise only; `:9` graceful downgrade.

### Phase 5 (Steps 16–21) — 軍爭
- **Rate limiter:** `src/server/tenant-rate-limiter.ts:11` `windowMs: 60_000`, SQLite-backed `auth_rate_limits` with `blocked_until` (`:33-47`).
- **Tamper-evident audit chain:** `src/storage/sqlite-audit-ledger.ts:19-20` `previous_hash` / `event_hash`, `:40-41` genesis fallback, `:42-44` hash-input construction.
- **Corridor coverage:** `src/rules/asean-corridor-adapters.ts:3` — VN_CN / MY_CN / TH_CN / PH_CN; tables at `:28`, `:37`, `:46`, `:55`.
- **Corroborating OKRs:** `.mekong/company.json:33-37` — independently restates the 8+3+2+3 cluster and the 60M VND/yr price and the <5.0 min / 100% catch rehearsal targets.

### Phase 6 (Steps 22–25) — 火攻
- **9 Hard Kill Criteria:** `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:68` (line verified verbatim).
- **Dual-lock:** `src/marketplace/marketplace-guard.ts:27-28` — `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` **AND** `goForLiveCustomerData === true`.
- **Gate→marketplace causal chain (strongest 火攻 fact):** `src/auth/pilot-launch-gate-verifier.ts:63` `goForLiveCustomerData: passedCount === 5`.
- **Zero-custody enforcement:** `marketplace-guard.ts:64-72` (custody-mode allowlist, Nghị định 52/2024/NĐ-CP, 422) and `:74-81` (7 prohibited field keys).
- **Marketplace default-off rationale:** `:37` — Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP, Founder + legal sign-off required.
- **Escrow state machine:** `src/marketplace/escrow-state-machine.ts` exists (cited at `tasks.md:76`).

---

## 6. Working-tree state you need to know

`git diff plans/company-blueprint/tasks.md` shows **one uncommitted hunk, `@@ -2,7 +2,7 @@`** — the line-5 "Last Updated" sentence gaining the "Re-verification run … 25/25 exit 0; record at …plan.md" clause. It is **not committed**. A plan that treats the current header text as the committed baseline, or that writes a `sed` anchored to line 5 by number, should read §"Residual risk" in the existing review at `plans/reports/code-reviewer-261021-2015-binh-phap-verify-25-step-mapping.md:85` first — that report already flags the line-number anchor as brittle and recommends anchoring on content.

Also note the same review records live defects in the repo a new plan should not re-litigate: `bun run typecheck` exits 2 (one TS2367), the full suite is 140 pass / 5 fail / 1 error, and `blueprint-cli.ts --deep` exits 1 on `HOLD_MODULARITY_VIOLATIONS` with 32 files over the `locCeiling = 95`. My `bun run src/saas/blueprint-cli.ts` run (no `--deep`) exits clean with 25/25.

---

## 7. What a new plan should cite instead (correction table)

| Where | Prior/brief claim | Correct value to cite |
|---|---|---|
| Step 4 GATE ids | `src/export/field-auditor-cli.ts` | `src/auth/pilot-launch-gate-verifier.ts:12` (titles `:39`, count `:63`) |
| Step 6 strategy json | bare `DURIOS-STRATEGY-V2.json` | `docs/product-direction/DURIOS-STRATEGY-V2.json` |
| Step 11 mean < 5m | `test/pilot-rehearsal-seeder.test.ts` | `src/auth/pilot-kpi-evaluator.ts:37,43` |
| Step 14 WAL | "without breaking SQLite WAL" | `src/saas/workspace-portability-bundle.ts:24` (`auditEventsDigestSha256`); drop the WAL claim entirely |
| Step 16 North Star | `src/auth/pilot-kpi-evaluator.ts` | `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:44` |
| Step 17 moat ladder | `PRODUCT-VISION-V2.md` | Correct as-is: `PRODUCT-VISION-V2.md:55-64` |
| Step 25 Hard Kill | `VALIDATION-AND-ECONOMICS-V2.md` | `:68`, confirmed |
| Phase 1 module count | "12 modules across 3 editions" | Correct; add split **6 / 4 / 2**, `open-core-edition-manifest.ts:37-48` |
| Revenue Layer 6 | treated as a phase | Not a phase; Hypothesis-tier, excluded from the 25 count |
| Routes `/api/v1/...` | appear dead | Valid — normalized at `src/server/http-router.ts:48-52` |

## Unresolved questions

1. **RESOLVED — `MOD-MIT-03` path is clean.** `src/export/manifest-compiler.ts` exists, so all 12 manifest `pathPattern` targets for Phase 1 hold as declared.
2. **PARTIAL — "conditional 5-stage sequencing" is a roadmap, not a gate mechanism (yet).** `PRODUCT-PRD-V2.md:52-81` gives each stage a *objective* (`Mục tiêu`) and *scope* (`Trong phạm vi`) — e.g. Stage 1's objective is repeatability across 3–5 packhouses with a ≤2-hour install (`:53-57`), Stage 2's is controlled sharing between legal entities via `ShareAccessGrant` and `CommercialRedaction` (`:63-68`). **There are no numeric pass/fail gate conditions per stage** in the sections read. So Step 5 is a *planned* conditional roadmap: the "5 stages" claim is solid, the "conditional" adjective is intent, not an enforced contract. A 始計 justification may cite the sequencing as designed discipline, but must not imply the stages are machine-gated the way GATE-01..05 are.
3. **RESOLVED for the restore path, PARTIAL for offline-first.** `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` has a Backup & Restore SOP at `:86`, a Restore SOP at `:103`, and a concrete command at `:107` (`bun run src/auth/pilot-ops-cli.ts restore-site …`). So "documented restore procedure" is citable. **However, a grep for `offline` / `air-gap` returned no hits** — the runbook does not use that vocabulary. Do not describe Step 19 as "offline-first" on the strength of this file; describe it as an on-premise backup + restore runbook with a runnable restore command.
4. **RESOLVED — Step 8 positioning quote verified.** "Verified Durian Trade Network" appears in `docs/product-direction/PRODUCT-VISION-V2.md` at `:11` (section heading) and `:17` (bolded definition "**DuriOS = Verified Durian Trade Network**"). The 謀攻 Step 8 citation is sound; prefer `:17` as the strongest single anchor.
5. **Statutory reference variance:** `Nghị định 248/2026/NĐ-CP` (marketplace-guard.ts:37) vs `Luật 91/2025/QH15` (pilot-launch-gate-verifier.ts:39, tasks.md:78). Likely two distinct legal bases, but a bilingual client-facing doc must not conflate them.
