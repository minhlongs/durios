# DuriOS Strategy Fork — Reframing & Proposed Outcome Preview

| Field | Value |
|---|---|
| Type | `/ak-advise` interview artifact — PROPOSED OUTCOME, not an implementation |
| Date | 2026-10-22 |
| Repo | `/Users/macbook/durios` @ `main` |
| Status | AWAITING FOUNDER CONFIRMATION of reframing + preview |

---

## Section 1 — Problem, reframed

DuriOS is not facing a V1-vs-V2 product choice, it is facing a missing decision mechanism. In the absence of a signed V2 decision, ~570 lines of Stage-2 concepts landed autonomously in code: `src/rules/asean-corridor-adapters.ts` (74 lines, four corridors), `src/sharing/verified-org-profile.ts` (93), `src/sharing/dense-cluster-readiness.ts` (88), `src/saas/usage-metering-service.ts` (97), `src/saas/saas-tier-policy.ts` (76), `src/saas/managed-zns-alert-relay.ts` (97), `src/saas/hybrid-edge-sync-queue.ts` (45). They became wired into `src/saas/blueprint-25-step-auditor.ts`, whose completion test is file-existence plus a markdown regex — so a 74-line stub registers as "Step 20 complete." Meanwhile the Stage-0 pilot is designed to measure one clerk's reconciliation time at one site, which structurally cannot produce 3 of the 4 signals the founder said would settle the direction (buyer behaviour change, owner paying full price, owner-initiated sharing to a counterparty); only "clerk uses it nightly unassisted" is observable at a single site with no counterparty. The repo is simultaneously accumulating V2 code, documenting a V2 strategy, and executing a V1 pilot, with no instrument that converts evidence into the founder's decision. The autonomous code is a symptom of that gap, not its cause.

---

## Section 2 — Topic / gates framing

This preview is about the **DECISION ARCHITECTURE** — how evidence converts into a signed baseline — not about picking a product direction today.

The advice will recommend:

- Keep **V1 as the execution baseline** until the pilot produces the four signals.
- Treat the ~570 lines as **disposition-marked scaffolding** pending that decision.

The one thing this preview deliberately does **NOT** do: it does not recommend deleting the V2 modules today, because the pilot cannot yet tell you whether they are scaffolding or the future core.

### Scope boundary

**IN scope now:**
1. Decision owner + calendar date recorded in `docs/product-direction/DURIOS-STRATEGY-V2.json`
2. Fix `pilot:verify-gates` so it prints state and exits non-zero on HOLD
3. Full 4-measurement KPI record per pilot container
4. Verbatim demand logging of clerk/owner requests for shareable artifacts
5. Explicit disposition markers on the seven V2 modules

**OUT of scope:**
- Building the closed transaction network
- Marketplace or escrow
- Loading real customer data
- Rewriting the core into the 11-entity ontology
- Implementing MY_CN/TH_CN/PH_CN rules beyond existing stubs
- Migrating data off the local core

---

## Section 3 — Hypothetical outcome: what the pilot must emit

**Per-container evidence record (proposed end state)**

| Field | Available today | Proposed | Status |
|---|---|---|---|
| `containerNumber` | dossier | unchanged | EXISTS |
| `meanDeltaSeconds` | `src/auth/pilot-kpi-evaluator.ts` | keep arithmetic mean, never substitute median | EXISTS |
| `blindFaultsCaught` | `src/auth/pilot-kpi-evaluator.ts` | require 2/2 | EXISTS |
| `minutesSavedPerContainer` | declared in `src/auth/pilot-kpi-extended-types.ts` | capture from real session, do not assume 30–45 min | DECLARED, NOT CAPTURED |
| `humanTouchesPerContainer` | declared | capture from real clerk session | DECLARED, NOT CAPTURED |
| `exceptionsDiscoveredPerContainer` | partial via planted blind faults | confirm against planted faults | PARTIAL |
| `expectedLossAvoidedVnd` | declared | leave null until a real incident occurs | DECLARED, NOT CAPTURED |
| `workflowArtifactRequests` | none | verbatim, timestamped, actor-attributed | NEW — does not exist |

### Assumptions (visible for correction)

1. The clerk session can be instrumented without changing the workflow being measured.
2. The owner will sit through a full-price conversation during a 5-container pilot rather than only after it — which changes sequencing versus today's design.
3. If no counterparty can be found quickly, signals 2–4 defer to the Stage-1 gate rather than blocking the pilot.

---

## Section 4 — Exact requirements (numbered, verifiable)

1. A named owner and calendar date for the V1/V2 decision, recorded in `DURIOS-STRATEGY-V2.json`.
2. `bun run pilot:verify-gates` prints the five gate states and exits non-zero while `goForLiveCustomerData` is false. Verified today: `src/auth/pilot-launch-gate-verifier.ts` (85 lines) exports only `evaluateWorkspaceLaunchGates` and `verifySingleSiteLaunchGates` — no `import.meta.main`, no argv handling, no output — so the script prints only Bun's banner and exits 0 regardless of gate state.
3. Each pilot container writes a KPI record with all four first-container measurements, the arithmetic mean reconciliation time, and the blind-fault catch count; nulls allowed only where a field is declared but genuinely unmeasured.
4. Every clerk/owner request for an exportable, shareable, or buyer-readable artifact is logged verbatim with timestamp and attributed actor.
5. GATE-01 (signed DPA on file) and GATE-02 (real Zalo ZNS/SMS credentials) close only by founder/legal/carrier action; they are already fail-closed and correct, and the requirement is only that they be recognised as external to engineering.
6. Each of the seven autonomously-built V2 modules carries an explicit disposition marker (manifest or file header) stating it is scaffolding pending the decision — or is removed.

---

## Section 5 — What done means (checkable end states)

- `DURIOS-STRATEGY-V2.json` `approval_status` is a signed state with `approved_by` and `approved_at` populated, or an explicit rejection naming V1 continuation.
- `bun run pilot:verify-gates` prints 5 gate lines and exits non-zero on HOLD.
- A pilot run writes per-container KPI records with all six fields present.
- A demand log exists with ≥1 attributed entry per pilot day.
- All seven V2 modules are either disposition-marked or absent.

---

## Section 6 — Non-goals

- Building the closed transaction network
- Marketplace or escrow
- Loading real customer data
- Rewriting the core into the 11-entity ontology
- Implementing MY_CN/TH_CN/PH_CN rules beyond existing stubs
- Migrating data off the local core

---

## Section 7 — Constraints non-negotiable

- Zero-custody; no public marketplace before liquidity is proven.
- Local core + opt-in network only.
- Human-in-the-loop with no AI auto-approval of export dossiers.
- Docs stay bilingual (Vietnamese + English).
- V1 remains the execution baseline until signed otherwise.
- No `:any` types, no `console.log` in production code (project quality gates).

---

Confirmation pending: does this reframing and preview match what you picture?
