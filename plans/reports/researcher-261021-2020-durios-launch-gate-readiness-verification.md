# Independent Verification of DuriOS Launch-Gate & 25-Step Blueprint Claims

**Researcher:** Independent verification agent (read-only)
**Date:** 2026-10-21 (Asia/Saigon)
**Repo:** `/Users/macbook/durios` @ `main` (working tree heavily modified, uncommitted)

> Purpose: verify what the repo *proves* about itself, as opposed to what it *claims*. All commands below were actually executed in an isolated temp data dir (`$TMPDIR/durios-pilot`); no repo data was mutated.

---

## Headline finding

The repo does **not** prove 25/25 completed in any functional sense. `blueprint:verify-25-steps` passing is a **file-existence check plus a markdown-checklist regex** — it confirms 25 documents/files exist and that `tasks.md` contains `- [x] **Step N:` markers. It says nothing about behavior.

The genuine, machine-verifiable state today is:
- **Typecheck: FAILS** (1 error)
- **Tests: 140 pass / 5 fail / 1 error** (suite is NOT green, contradicting 4 separate documentation claims)
- **Pilot go-live gates: 3/5 PASS** (`goForLiveCustomerData === false`)
- **25-step blueprint auditor: 25/25 PASS** but on artifact-existence semantics only

---

## Q1 — GATE-01..GATE-05

All five gates are implemented in one file: `src/auth/pilot-launch-gate-verifier.ts` (`buildGateReport`, lines 29–66). There is a second implementation path used by HTTP handlers, `evaluateWorkspaceLaunchGates` (line 68), which passes the in-memory workspace rather than opening a DB.

| Gate | Requirement | Implementation | Current status (measured) | Fail-closed? |
|---|---|---|---|---|
| **GATE-01** | Signed site/data consent form exists before any real customer data is loaded | `pilot-launch-gate-verifier.ts:38` — `Boolean(consentPath && existsSync(consentPath))`; consent path from `options.consentSignedFilePath \|\| env.DURIOS_GATE01_CONSENT_FILE` | **PENDING_SITE_AND_CONSENT_SIGN_OFF** (no file configured) | **Yes — fail-closed.** Absent file means gate fails and `goForLiveCustomerData` stays `false`. It is a *presence* check only (file exists), not a signature/content check. |
| **GATE-02** | A real OTP channel (Zalo ZNS / SMS) is configured and able to send | Same file lines 40–42 — `createOtpProviderFromEnv(env).isConfigured`. Env-driven provider selection lives in `src/auth/http-gateway-otp-provider.ts`; unconfigured default is `UnconfiguredOtpProvider` at `src/auth/otp-provider.ts:12-15` | **PENDING_PROVIDER_CREDENTIALS** — running on `UNCONFIGURED_OTP_PROVIDER` | **Yes — genuinely fail-closed, and the strongest gate.** `UnconfiguredOtpProvider.sendOtp` *throws* `OtpProviderNotConfiguredError` (`otp-provider.ts:14`), and the HTTP layer converts it to **503** at `src/server/auth-handlers.ts:53`. No simulated delivery is possible in unconfigured mode. Requires real provider credentials + carrier contract to close. |
| **GATE-03** | Loopback bind `127.0.0.1` + audit hash-chain integrity | Lines 44–48 — `assertLoopbackHostname(env.DURIOS_HOST ?? "127.0.0.1")` from `src/server/server.ts:53`, AND `auditChainValid` | **PASS** (measured: host loopback-valid and 17-event chain verified) | **Yes — fail-closed.** `assertLoopbackHostname` throws for any non-loopback hostname, so a public bind is rejected at startup. Note: this gate's pass is *weak* — it validates a default string plus a chain the system itself wrote. It is not a network-exposure test. |
| **GATE-04** | Backup/restore drill: `verifySiteBackup()` valid, 100% blob SHA-256 match | Lines 50–57 — requires `env.DURIOS_BACKUP_DIR` to exist, then calls `verifySiteBackup()` from `src/auth/site-backup-manager.ts` | **PASS when a real backup dir is supplied** (see below); otherwise `PENDING_VERIFIED_BACKUP` | **Partly.** If `DURIOS_BACKUP_DIR` is unset the gate simply fails to `PENDING_VERIFIED_BACKUP` (fail-closed, arguably too conservatively — a null result, not a proven failure). Backup machinery itself is real: I ran `backup-site` via `src/auth/pilot-ops-cli.ts` and got `{"success":true,"auditChainValid":true,"dossierCount":5,"documentCount":15}` with per-blob SHA-256. Re-running the pack against that dir moved the gate to PASS (3/5 total). |
| **GATE-05** | 5-container rehearsal, arithmetic mean < 300s, 100% blind faults caught | Lines 58 + `evaluateGate05PilotKpi` / `computeGate05KpiFromDossiers` in `src/auth/pilot-kpi-evaluator.ts` | **PASS** — measured `totalContainers=5, meanDeltaSeconds=0.01, blindFaultsCaught=2/2, gate05Passed=true` | **No — it is honest about being synthetic.** The mean of 0.01s is a *fixture artifact*: the seeder writes both `createdAt` and `evaluatedAt` in the same millisecond. This gate proves the *scoring mechanism* works, not that a clerk reconciles in 5 minutes. `pilot-kpi-evaluator.ts:25` also checks non-superseded docs have no non-`HUMAN_VERIFIED` fields. |

**Roll-up:** `goForLiveCustomerData = passedCount === 5` (`pilot-launch-gate-verifier.ts:63`). Measured **false**.

**Critical defect — `bun run pilot:verify-gates` produces no output.** `src/auth/pilot-launch-gate-verifier.ts` is 85 lines and exports only `evaluateWorkspaceLaunchGates` and `verifySingleSiteLaunchGates`. It has **no CLI entrypoint** (no `import.meta.main`, no `process.argv` handling, no `console.log`). `package.json:15` maps the script to that file, so running it prints only bun's `$ bun run ...` banner and **exits 0 regardless of gate state**. Anyone using this as acceptance evidence gets a silent false positive. The only usable gate-reading commands are `bun run pilot:audit-pack` and the HTTP route `GET /api/v1/pilot/gates` (routed at `src/server/http-router.ts:54`, handling in `src/server/ecosystem-rehearsal-handler.ts:55`).

---

## Q2 — Verification scripts: what runs, what passes, what is safe as evidence

All executed. `EVIDENCE` = safe to cite as independent acceptance proof.

| Script | Purpose | Output | Safe as evidence? |
|---|---|---|---|
| `test` | `bun test`, 36 test files | Pass/fail text, exit code | **No — fails today.** 140 pass / **5 fail** / 1 error. Two process-restart tests time out at 5000 ms ("Server process failed to bind and respond to health check within timeout"), which is a **sandbox artifact** — local port binding is disabled in this research sandbox (`test/helpers/adversarial-verification-export-network-scenarios.ts:23` binds `127.0.0.1:31099`). In a normal environment these would likely pass; they are not proven defects. Two `open-core-deep-introspector` failures are **real** (see Q1-adjacent note below). |
| `typecheck` | `tsc --noEmit`, strict | Error list, exit code | **No — fails today.** `test/open-core-deep-introspector.test.ts(30,12): error TS2367: This comparison appears to be unintentional because the types '95' and '100' have no overlap.` This is a real code/test contradiction (see below), not a sandbox issue. |
| `start` | CLI end-to-end simulation (`src/cli.ts`) | Plain text with exit 0 | **Yes — genuinely pass and meaningful.** Prints `Status: EXPORTED`, `Validation: PASSED (0 blockers, 0 warnings)`, `Audit Ledger: 17 events recorded, hash-chain integrity verified: true`, plus a composite SHA-256. Good smoke evidence for the hash-chain and the create→verify→export path. |
| `start:server` | HTTP server on `127.0.0.1:3000` | Running process, exit on signal | **Yes as a smoke test.** Cannot be fully exercised here (port binding disabled in sandbox). Assertion that it binds loopback is code-level (`server.ts:53`). |
| `pilot:seed-rehearsal` | Seeds 5 containers, 2 blind faults, clerk+manager accounts | JSON on stdout, exit 0 | **Yes.** Creates `DOS-CAILAY-R01..R05`, two `dpt_...` pilot tokens, scenarios including `BLIND_FAULT_SEAL_MISMATCH`. Deterministic and re-runnable in a temp DB. |
| `pilot:evaluate-kpi` | Computes GATE-05 KPIs from SQLite | JSON on stdout, exit 0 | **Yes, with the caveat that the 0.01s mean is synthetic.** Real mechanism; proves KPI wiring and the `zeroMissGate` logic. |
| `pilot:verify-gates` | Intended to read GATE-01..05 | **Nothing. Exit 0 always.** | **No — broken.** No CLI entrypoint (see Q1). Do not use as acceptance evidence under any circumstances. |
| `pilot:audit-pack` | Generates sealed go-live pack (JSON + optional Markdown) | 1 stdout summary line; files written (`field-auditor-cli.ts:38-39`: JSON always, Markdown with the markdown option); exit 0 | **Yes — the best single piece of evidence available.** Prints `Verdict=HOLD_BLOCKERS_REMAIN Gates=3/5 SHA256=<hash> Integrity=true`. Writes `GOLIVE-<site>-<date>.json` containing all five gates with labels and details, plus `goForLiveCustomerData`. Exit code does **not** encode verdict — it stayed 0 while verdict was HOLD, so read the JSON, not the exit status. |
| `blueprint:verify-25-steps` | Audits the 25-step blueprint | Formatted table on stdout + Blueprint/composite SHA-256, exit 0 | **Weak — cite only as a documentation-coverage check.** `src/saas/blueprint-25-step-auditor.ts:28-56` maps each step to a `STEP_ARTIFACTS` path and passes if: the file **exists**, `tasks.md` matches `^- \[x\] \*\*Step N:`, and `plan.md` matches `^## N\.`. No behavioral test of any step. A step is "completed" if it marked `[x]` in markdown and left a file behind. |
| `verify:manifest` | Independent MIT-SDK manifest verifier, `<manifest.json>` arg | Usage error + **exit 1** with no args | **Yes in principle, but needs an input artifact.** Fails on invocation without a path. It is the one externally-consumable MIT tool (buyers/brokers verify without DuriOS code) — but I could not produce a valid manifest input within scope, so it is unverified in this pass. |

### The two real test failures (not sandbox artifacts)

`test/open-core-deep-introspector.test.ts` asserts `report.modularityDeepAudit.locCeiling === 100` and that `verdict === "GO_MODULAR_ZERO_ANY_VERIFIED"`. The source reports `locCeiling = 95` (`src/saas/codebase-modularity-deep-introspector.ts:42`) and verdict `"HOLD_MODULARITY_VIOLATIONS"`. Measured live: `maxSrcLoc: 100, maxTestLoc: 100, locCeiling: 95, anyType: 0`.

So the **enforced LOC ceiling is 95** while the **docs claim 179** (`docs/pilot-readiness/06_OPERATOR_AND_DEVELOPER_ONBOARDING.md:54`, and `.mekong/company.json` line 29). Enforcement is at 95; docs and the company file both overstate. Neither is currently satisfiable at 100 as the test demands. This is a genuine repo inconsistency requiring a decision (lower the test, raise the ceiling, or refactor the ~2 files at 99-100 lines).

Also note the two *failing* LOC assertions are the same ones that make `blueprint-status?deep=true` report `HOLD`, which is surfaced by `README.md:163` as an advertised feature.

---

## Q3 — Zero-Custody compliance (money never held)

Real, enforced code — not just prose:

- `src/marketplace/marketplace-guard.ts:52-60` — `PROHIBITED_CUSTODY_KEYS = ["walletBalance","holdFundsAmount","platformEscrowBalance","cardPan","cvv","bankSecretKey","privateKey"]` (7 keys).
- `src/marketplace/marketplace-guard.ts:62-83` — `assertZeroCustodyCompliance(payload, custodyMode?)`: throws `MarketplaceGuardError` with **HTTP 422** and code `ZERO_CUSTODY_VIOLATION` if a prohibited key is present (even if `undefined`-valued) or if `custodyMode` is anything other than the single accepted literal `"ZERO_CUSTODY_LICENSED_BANK_PARTNER"` (line 66) with the message "DuriOS is strictly non-custodial under Nghị định 52/2024/NĐ-CP and never holds or pools transaction funds."
- Enforcement point: `src/marketplace/escrow-state-machine.ts:41` calls `assertZeroCustodyCompliance(rawPayload, input.custodyMode)` on every escrow contract creation, *before* constructing the contract at line 48. The contract type itself hard-codes the non-custodial literal at `src/domain/marketplace-types.ts:41`.
- The escrow state machine's own witness: `src/marketplace/marketplace-guard.ts` type has no field for a DuriOS-held balance — custody is offloaded to `licensedBankPartnerCode` / `bankEscrowReferenceNo` (`escrow-state-machine.ts:48`).
- Dual-lock: `src/marketplace/marketplace-guard.ts:25-29` requires **both** `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` **and** `goForLiveCustomerData === true`. Default (neither set) = marketplace disabled, HTTP 403 (`:35-41`), and also 403 if gates incomplete (`:43-49`). Since GATE-01/02 cannot pass today, the marketplace is **unconditionally closed** in the current state.

Honest limitation: this proves DuriOS *refuses to model custody of funds*, and that the module emitting custody fields is locked. It does not prove a deployment never accidentally holds money via some other path; it proves the one modeled path is guarded and disabled by default.

---

## Q4 — SHA-256 hash-chain audit ledger & HITL enforcement

**Hash chain — two implementations, both verified working:**

- `src/audit/audit-ledger.ts` (in-memory, 32 lines). Genesis anchor `"GENESIS-0000…000"` at line 6. `recordEvent` (line 8) builds `hashInput` from the full record **including `previousHash: this.lastHash`**, computes `calculateSha256` (line 12), and chains via `this.lastHash = eventHash` (line 15). `verifyIntegrity()` (lines 22–31) walks the array checking both `previousHash` continuity and recomputed hash equality; returns `false` on any mismatch. Events frozen via `Object.freeze`.
- `src/storage/sqlite-audit-ledger.ts` (persistent, DB-backed). Same genesis constant at line 5. `recordEvent` (lines 27–47) runs inside `client.transaction(...)` and reads the previous head with `SELECT event_hash FROM audit_events ORDER BY sequence_id DESC LIMIT 1` (line 40) — so the chain is per-DB-table, ordered by an explicit `sequence_id` rather than trusting row order. `verifyIntegrity()` (lines 65–82) re-reads all rows and recomputes. Note it `JSON.parse`s `payload_before/after` and re-serializes via `JSON.stringify`, so the hash input is canonicalized rather than raw column text.
- Hashing primitive: `calculateSha256` from `src/ingestion/document-hasher.ts` — the MIT-licensed module, deliberately isolated so an external auditor can recompute chain hashes with no DuriOS code.
- **Proven end-to-end:** `bun run start` printed `Audit Ledger: 17 events recorded, hash-chain integrity verified: true`; `backup-site` reported `"auditChainValid":true`; GATE-03 currently PASSes on this basis.

The system is **tamper-evident, not tamper-proof**, and the repo says so honestly (`README.md:98`): an administrator with full disk access can recompute the whole chain. It detects modification and refuses export; it is not WORM. That is the correct, honest framing.

**HITL — the real enforcement point is the rules engine:**

- `src/rules/deterministic-engine.ts:13` — `if (field.verificationStatus !== "HUMAN_VERIFIED")` gates evaluation. This is the load-bearing line: a field that an OCR/AI extractor produced cannot satisfy a compliance rule until a human signs it off.
- `src/verification/hitl-service.ts:30` — the only place `HUMAN_VERIFIED` (or `REJECTED`) is written, and only via `HitlVerificationService.verifyOrCorrectField`, which requires an `AuthenticatedActor` and writes `verifiedBy`/`verifiedAt` (lines 36-37) plus a `FIELD_HUMAN_VERIFIED` or `FIELD_MANUALLY_EDITED` audit event (line 47).
- `src/verification/hitl-service.ts:70-80` — `areAllFieldsVerified` sweeps non-superseded documents; any non-verified field returns `false`.
- Export consequence: `src/export/manifest-compiler.ts:27` only compiles fields where `verificationStatus === "HUMAN_VERIFIED"` (with counts at line 39), so unverified data cannot enter a sealed manifest.
- Downstream: `src/auth/pilot-kpi-evaluator.ts:25` treats any non-`HUMAN_VERIFIED` field as a GATE-05 blocker.
- Adapters are bound by the same rule: `CloudVisionOcrExtractorAdapter` is documented (`README.md:144`, `COMMERCIAL-LICENSE.md` §1) to emit only `DRAFT` awaiting `HUMAN_VERIFIED`. I did **not** independently verify the OCR adapter's code emits DRAFT — that claim is doc-level only.

The repo has no test anywhere asserting an AI adapter can never write `HUMAN_VERIFIED`; `docs/pilot-readiness/06_…:56` states the rule as a development guardrail. It is enforced structurally (only `HitlVerificationService` writes the status) rather than by an automated check.

---

## Q5 — Dual-license architecture

Confirmed as a genuine three-way split, declared in both docs and code.

**Declared documents:**
- `LICENSE` (dual-license agreement): MIT for 4 named modules (`src/domain/iso-6346.ts`, `src/ingestion/document-hasher.ts`, `src/export/manifest-compiler.ts`, `src/export/standalone-manifest-verifier.ts`), `AGPL-3.0-only` for Community Core, Commercial License for proprietary SaaS connectors.
- `LICENSE-MIT` — verbatim MIT text scoped explicitly to those same 4 files plus `src/domain/types.ts` when used as their type definitions.
- `COMMERCIAL-LICENSE.md` — applies to `src/saas/`, Enterprise, and hosted/alternate non-copyleft distributions. Explicitly states (§1) it does **not** narrow AGPL-3.0 rights, and (§2) requires `DURIOS_SAAS_LICENSE_KEY` Ed25519 verification only for proprietary modification/distribution or connecting to DuriOS-operated hosted services.
- `package.json:27` — `"license": "AGPL-3.0-only OR LicenseRef-DuriOS-Commercial"`.
- `TRADEMARK-POLICY.md` exists as a separate nominative-fair-use instrument.

**Enforced in code, per module — `src/saas/open-core-edition-manifest.ts`:**
- `MOD-MIT-01..04` (lines 37-40): the 4 verifier/hasher/ISO/compiler modules — `license: "MIT"`, all `zeroLockInGuarantee: true`.
- `MOD-AGPL-01` (line 41): `src/rules/**`, `src/verification/**` — `license: "AGPL-3.0-only"`.
- `MOD-AGPL-02` (line 42): `src/storage/**`, `src/audit/**`, `src/auth/**` — `license: "AGPL-3.0-only"` (so the audit ledger and RBAC are copyleft).
- `MOD-PRO-01..04` (lines 43-46): OCR, ZNS relay, cloud vault, GACC watch — `edition: "PACKHOUSE_PRO_SAAS"`, `license: "Commercial-Ed25519"`.
- `MOD-ENT-01..02` (lines 47-48): edge sync, ASEAN corridor + marketplace/escrow — `edition: "EXPORTER_ENTERPRISE"`, `license: "Commercial-Ed25519"`.
- This manifest is served live at `GET /api/v1/open-core/edition-manifest` (and `/api/open-core/…`), handler `src/server/open-core-portability-handler.ts:3`, wired at `src/server/http-router.ts:59` with a `/api/v1/` alias at `http-router.ts:47-52`. **Verified empirically: both prefixes return 200.** The README's advertised v1 paths are real.
- License verification + graceful downgrade: `src/saas/saas-tier-policy.ts:3` defines the three editions; `downgradeToCommunity` (line 9) implements the zero-lock-in fallback; `resolveSaasSubscription` downgrades on missing key (`:39`), missing public key (`:46`), bad signature (`:51`), malformed payload (`:54`,`:62`), tenant mismatch (`:65`), and expiry (`:68`) — never locking local SQLite.

One wrinkle worth flagging: `MOD-ENT-02` lists `src/rules/asean-corridor-adapters.ts` as **Enterprise/Commercial** while `MOD-AGPL-01` lists `src/rules/**` as **AGPL-3.0-only**. Those globs overlap. The manifest is hand-maintained and internally inconsistent on which license covers that file.

---

## Q6 — Is there a `brainstorm-25-step-opencore-saas.md`?

**No file of that exact name exists anywhere in the repo.** Searched all paths (including `plans/`, `docs/`, and the `.git` history via logs) — no match.

However, the *substance* of such a brainstorm exists and is directly usable:
- `plans/261017-deep-open-core-saas-brainstorm/plan.md` — the brainstorm *plan* directory for the same subject.
- `docs/journals/261017-1635-deep-brainstorm-idea-25-step-open-core-saas.md` — the brainstorming journal, i.e. the closest functional equivalent to a `brainstorm-25-step-opencore-saas.md`.
- `docs/journals/261017-1408-idea-25-step-blueprint.md` — the earlier idea journal that seeded the 25-step framework.
- The authoritative **step→framework mapping already exists as executable code**, not prose: `src/saas/blueprint-25-step-auditor.ts:28` `STEP_ARTIFACTS` arrays all 25 steps with exact titles and required artifact paths, mirrored by `plans/company-blueprint/plan.md` §§1–25 and `plans/company-blueprint/tasks.md`.

So a *new* brainstorm artifact is not needed. The mapping the task asks about is already generated and hashed by the blueprint auditor.

---

## Q7 — Is `.mekong/company.json` generated?

**Hand-maintained.** Evidence:
- No script in the repo writes it. Grepping `src/`, `test/`, `scripts/` (no `scripts/` dir exists) for writers finds nothing; all references are **readers** — `src/saas/blueprint-25-step-auditor.ts:34` (`readFileSync` for the SHA-256 composite), and three test files that read or write it only into *temp* dirs for negative tests.
- `git log -- .mekong` shows it arriving via ordinary feature commits (`26a41e3`, `32af6ce`, `d6ca29e`), i.e. authored alongside code, not emitted by a tool run.
- No `mekong` CLI exists in the repo or on PATH (`which mekong` → "aliased to `me mekong`", unrelated). No `.claude` hook or workflow references `.mekong`.
- **No schema is governed by any instruction.** Neither `CLAUDE.md`, `AGENTS.md`, nor `README.md` mentions the file. `src/saas/blueprint-25-step-auditor.ts` reads it as raw bytes for hashing and never validates its shape. The only structural constraint is Step 22's requirement that the file *exists*.

Consequence: `.mekong/company.json` is an unvalidated, hand-edited source of truth whose content (site selection, ARR targets, OKRs, gate assignments) is load-bearing for narrative but enforced by nothing. It has already drifted from code — see Q1/Q2 above (LOC 179 vs 95, and `/api/v1/open-core/` endpoint claims).

---

## What is honestly verifiable right now, with no external infrastructure

Without a bank account, cloud account, or real customer data, the repo genuinely proves this much: a deterministic create→hash→extract→**human-verify**→validate→seal-export pipeline runs locally on Bun + WAL SQLite and completes with `EXPORTED`, zero blockers, and a 17-event SHA-256 hash chain that verifies — reproducibly, in an isolated DB, in this environment. You can prove the tamper-evidence mechanism (`SqliteAuditLedger.verifyIntegrity` / `AuditLedger.verifyIntegrity`, both recomputing from the MIT-licensed `calculateSha256`), you can prove HITL is structurally unavoidable because only `HitlVerificationService` writes `HUMAN_VERIFIED` and `deterministic-engine.ts:13` refuses to evaluate otherwise, and you can prove the manifest compiler never seals an unverified field. You can prove zero-custody is enforced rather than promised: seven prohibited balance/payment keys are rejected with HTTP 422 by `assertZeroCustodyCompliance` on every escrow creation, and the whole marketplace module is double-locked behind a feature flag *and* `goForLiveCustomerData` — so it is closed in the current state regardless. You can prove the backup/restore drill is real (`VACUUM INTO` + per-blob SHA-256, `auditChainValid: true`, 5 dossiers / 15 documents), and that GATE-03 passes on a genuine loopback assert plus chain integrity. You can prove the dual-license boundary is declared *and* machine-readable through `open-core-edition-manifest.ts`, served over HTTP at both route prefixes, with a fail-closed Ed25519 verifier that degrades to Community instead of locking local data. That is a real, defensible evidence base for a pilot.

What is **not** verifiable without external infrastructure, and what the repo's own docs mostly admit: GATE-01 needs a physically signed consent form, GATE-02 needs live carrier credentials and a Zalo/eSMS contract, and GATE-05's 0.01-second mean is a fixture artifact that proves the scorer, not clerk performance. And the claim that all 25 steps are `[COMPLETED]` is **not** proven by `blueprint:verify-25-steps`, which checks artifact existence and markdown checkboxes and would pass identically if every step's logic were deleted but its file kept. Treat 25/25 as "documented and present," not "implemented and tested."

---

## Unresolved questions

1. Which is authoritative for the LOC ceiling — the **enforced 95** (`codebase-modularity-deep-introspector.ts:42`) or the documented **179** (`docs/pilot-readiness/06_…:54`, `.mekong/company.json`)? The failing tests and the docs cannot both be right; someone must choose.
2. Should `src/auth/pilot-launch-gate-verifier.ts` gain a CLI entrypoint so `pilot:verify-gates` emits a report? Right now it is a silent trap for anyone using it as evidence.
3. `MOD-ENT-02` marks `src/rules/asean-corridor-adapters.ts` Commercial/Enterprise while `MOD-AGPL-01` covers `src/rules/**` as AGPL — which license actually applies? This is a real IP ambiguity for downstream licensees.
4. `pilot:audit-pack` exits 0 even when verdict is `HOLD_BLOCKERS_REMAIN` — should the exit code encode the verdict so CI can consume it?
5. `test:coverage` is defined in `package.json` but was outside this task's scope; coverage percentage is unknown and unclaimed.
6. The two process-restart test failures re-run outside this sandbox to confirm they are port-binding artifacts and not real defects.

---

Status: DONE_WITH_CONCERNS
Summary: The repo's load-bearing mechanisms (SHA-256 hash chain, HITL enforcement, zero-custody rejection, backup drill, dual-license boundary) are genuinely implemented and, in part, empirically verified here; but `blueprint:verify-25-steps` proves only artifact existence, the "25/25 COMPLETED" claim is not a functional proof, typecheck fails on a real LOC-ceiling contradiction, the test suite is not green (5 fail), and the real launch-gate state is 3/5 with `goForLiveCustomerData === false`.
Concerns/Blockers: (1) `pilot:verify-gates` has no CLI entrypoint and always exits 0 — do not use it as acceptance evidence. (2) Typecheck fails: `test/open-core-deep-introspector.test.ts:30` expects `locCeiling === 100` and `GO_MODULAR_ZERO_ANY_VERIFIED` while the code enforces 95 and returns `HOLD_MODULARITY_VIOLATIONS`. (3) Docs and `.mekong/company.json` claim a 179-LOC ceiling; enforcement is 95. (4) `MOD-AGPL-01` and `MOD-ENT-02` assign conflicting licenses to `src/rules/asean-corridor-adapters.ts`. (5) GATE-05's 0.01s mean is a fixture artifact — proves the scorer, not real clerk speed. (6) `.mekong/company.json` is hand-maintained, unvalidated, and already drifted from code.
