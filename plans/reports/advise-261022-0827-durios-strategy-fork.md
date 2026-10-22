# DuriOS Strategy Fork — Advisory Report

**Type:** `/ak-advise` advisory output
**Date:** 2026-10-22 · **Repo:** `/Users/macbook/durios` @ `main`
**Scope:** V1 baseline vs V2 "Verified Durian Trade Network" — decision architecture, not product build
**Status:** ADVICE DELIVERED — reframing confirmed with one open decision (route A vs route B)

## Needs from you
GATE-01 (signed DPA on file) and GATE-02 (real Zalo ZNS/SMS carrier credentials) are legal/procurement actions, not engineering. No real customer data loads until both exist, and the pilot cannot start without them regardless of any other decision. One open decision remains: decide the direction now on economics (Route B), or hold V1 pending pilot signals (Route A).

## 1. Verdict
V2 is strategically sound and the arithmetic in `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` is correct and unforgiving: 281 active Vietnamese packhouses × 60,000,000 VND caps pure SaaS at **$657,643 ARR** while **427 sites** are needed for $1M. Multi-revenue or ASEAN is therefore a requirement eventually, not ambition. But V2 is premature as build work and correct as documented direction, because kill criteria 4–7 (privacy refusal, buyer indifference, no repeat trades, subsidy dependency) are entirely unmeasured.

The urgent defect is not product direction. The repository has no mechanism converting pilot evidence into a signed baseline, and that vacuum did two things: ~570 lines of Stage-2 concepts landed autonomously, and `src/saas/blueprint-25-step-auditor.ts` certified them as completed steps using file existence plus a markdown regex — so a 74-line ASEAN stub registers as "Step 20 complete". Worse, `bun run pilot:verify-gates` is silently false: `src/auth/pilot-launch-gate-verifier.ts` (85 lines) exports only `evaluateWorkspaceLaunchGates` and `verifySingleSiteLaunchGates` — no `import.meta.main`, no argv handling, no output — so it prints Bun's banner and **exits 0 regardless of gate state**. There is currently no command that truthfully reports whether you may go live.

## 2. What you should do
1. Repair `pilot:verify-gates` — add a CLI entrypoint printing all five gate states and exiting non-zero while `goForLiveCustomerData` is false. Roughly fifteen lines; highest leverage in the repo.
2. Close the measurement gap — `minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd` are declared in `src/auth/pilot-kpi-extended-types.ts` but never captured. NOW-06 acceptance cannot be evaluated against unmeasured fields. Capture them or mark explicitly unmeasured; never leave a declared field silently empty.
3. Start the verbatim demand log on day one — every clerk/owner request for an exportable, shareable or buyer-readable artifact, timestamped and attributed. Only route to signals 3 and 4 without a counterparty; near-zero cost.
4. Record decision owner and calendar date in `docs/product-direction/DURIOS-STRATEGY-V2.json` before further V2 work.
5. Take the two external actions (GATE-01 DPA signature, GATE-02 carrier credentials).
6. The founder declined disposition markers on the V2 modules, so that requirement is dropped and not recommended. One point stands: those modules must not be cited as completed steps in any acceptance artifact, because the auditor's semantics make that claim false.

## 3. What you shouldn't do
- Don't delete the V2 modules — the pilot has not yet told you whether they are scaffolding or future core.
- Don't build the closed network, marketplace or escrow now — kill criteria 4, 5, 6, 7 gate exactly that work and all four are unmeasured.
- Don't add a second packhouse or buyer before the single-site pilot proves the clerk workflow; that is Stage-1 work and multiplies installation risk.
- Don't let `blueprint:verify-25-steps` keep appearing as behavioral evidence — it is a documentation-coverage check.

## 4. What could be better / more efficient
Ranked by leverage per hour: (a) the `verify-gates` CLI fix, ~15 lines, removes a lying acceptance command; (b) verbatim demand log, near-zero cost, produces the two hardest signals; (c) instrumenting the existing clerk session instead of recruiting a counterparty; (d) KPI capture work, real but bounded.

## 5. My take and how to get there
**Route A (recommended):** fix the instrument, close the two external gates, run the five-container pilot with full measurement and demand logging, sign the baseline on evidence. V1 stays execution baseline throughout. If the four signals fire, V2 modules graduate from scaffolding to real work with rational build order; if not, you have kill criteria already written down and avoided two years of network investment. Costs ~2–4 weeks calendar and may conclude "V1 is the ceiling", which retires the network thesis.
**Route B (decide now):** decide V1 vs V2 on economics alone. The $657,643 ceiling forces eventual multi-revenue, so V2 is the only path to $1M, but thirteen Stage-1/2 gates must be passed before revenue appears. Faster to decide, blind on demand. Its honest form is: commit to V2 as direction, keep Stage 0 as the only funded build, accept the network stays speculative until the pilot answers it — functionally Route A with paperwork settled.

## 6. Benefits
Evidence-based signing instead of autonomous drift · a truthful go/no-go command · NOW-06 genuinely evaluable · the nine kill criteria stop being prose · the pilot produces buyer-side and sharing-side signals it currently cannot · Stage-2 code stops masquerading as completed work.

## 7. Trade-offs
Route A costs 2–4 weeks you could have spent building, and the answer may be "V1 is the ceiling". Route B costs the learning a pilot provides and bets arithmetic over demand. Recorded disagreement: the founder declined scaffolding markers on the V2 modules, so they stay unlabeled, and the cost is that the ambiguity which caused the autonomous build persists into the next session.

## 8. Unverified
- Three test failures are attributed to the sandbox disabling local port binding (`test/helpers/adversarial-verification-export-network-scenarios.ts:23` binds `127.0.0.1:31099`); not verified clean in a normal environment. Confirmed on `main` today: `bun run typecheck` passes 0 errors; 142/145 tests pass.
- Not verified that the clerk session can be instrumented without altering the measured workflow.
- Not verified whether an invited counterparty can be recruited before the pilot window.
- `PRODUCT-PRD-V1.md` and `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` were not read in full; V1 baseline commitments are described from the V2 change report's account of them.

## 9. Work checklist, success metrics & handoff brief
Work checklist:
- [ ] Add CLI entrypoint to `src/auth/pilot-launch-gate-verifier.ts`: print five gates, exit non-zero on HOLD
- [ ] Verify `bun run pilot:verify-gates` reports HOLD and non-zero today
- [ ] Capture or explicitly null the four first-container KPI measurements
- [ ] Add the verbatim, actor-attributed demand log
- [ ] Record decision owner and date in `DURIOS-STRATEGY-V2.json`
- [ ] Stop citing `blueprint:verify-25-steps` as behavioral evidence
- [ ] Founder: sign DPA (GATE-01); procure Zalo ZNS credentials (GATE-02)
- [ ] Run the five-container pilot with full instrumentation
- [ ] Sign or reject V2 baseline on the four signals

Success metrics:
- `bun run pilot:verify-gates` exits non-zero on HOLD and prints five lines
- per-container record carries all six fields with no undeclared nulls
- ≥1 attributed demand-log entry per pilot day
- `goForLiveCustomerData` false until GATE-01 and GATE-02 close
- `DURIOS-STRATEGY-V2.json` `approval_status` signed with `approved_by`/`approved_at`, or an explicit V1 rejection
- clerk reconciles ≥5 containers unassisted, mean <300s, 2/2 blind faults caught

Handoff brief (fenced text block):
```text
Objective: Repair DuriOS's pilot evidence instrument so the V1/V2 baseline decision can be signed on measured signals, and run the five-container Cai Lậy pilot with complete instrumentation.
Done means: pilot:verify-gates prints five gate lines and exits non-zero on HOLD; each pilot container writes a record with containerNumber, meanDeltaSeconds, blindFaultsCaught, minutesSavedPerContainer, humanTouchesPerContainer, exceptionsDiscoveredPerContainer (expectedLossAvoidedVnd may be null); a demand log exists with >=1 timestamped, actor-attributed entry per pilot day; DURIOS-STRATEGY-V2.json approval_status is signed with approved_by and approved_at, or an explicit rejection naming V1 continuation.
Out of scope: Building the closed transaction network, marketplace, or escrow; loading real customer data; rewriting the core into the 11-entity ontology; implementing MY_CN/TH_CN/PH_CN beyond existing stubs; migrating data off the local core; deleting the existing V2 modules.
Constraints: Zero-custody, no public marketplace before proven liquidity; local core + opt-in network; no AI auto-approval of export dossiers; docs bilingual VI+EN; V1 stays execution baseline until signed otherwise; no :any types; no console.log in production; never weaken a test to make it pass.
Stop and ask only if: A failure cannot be explained from cause; a destructive or irreversible action is required (data deletion, force-push, history rewrite); a change falls outside this scope or repository; the founder declines to set a decision date.
```

## 9b. Verified scout evidence
- `bun run typecheck` passes clean on `main` (exit 0) — the LOC-ceiling/verdict contradiction that broke `main` on 2026-10-21 is fixed
- `bun test`: 142 pass / 3 fail / 1 error out of 145 across 36 files; all three failures share root cause "Server process failed to bind and respond to health check within timeout" (`test/process-restart-persistence.test.ts:50`), attributed to sandbox-disabled local port binding
- V2 modules present autonomously: `src/rules/asean-corridor-adapters.ts` (74 lines), `src/sharing/verified-org-profile.ts` (93), `src/sharing/dense-cluster-readiness.ts` (88), `src/saas/usage-metering-service.ts` (97), `src/saas/saas-tier-policy.ts` (76), `src/saas/managed-zns-alert-relay.ts` (97), `src/saas/hybrid-edge-sync-queue.ts` (45); total `src/` = 101 files / 7,546 lines at `HEAD` (`main`), 105 files / 7,867 lines in the working tree including uncommitted financial-attestation modules)
- `src/saas/blueprint-25-step-auditor.ts` STEP_ARTIFACTS maps step 20 to `src/rules/asean-corridor-adapters.ts`; completion is file-existence + markdown regex, not behavior
- GATE-01 pending (no DPA file), GATE-02 pending (`UNCONFIGURED_OTP_PROVIDER`), so `goForLiveCustomerData` is false; both gates already fail-closed and correct, and both close only by founder/legal/carrier action
