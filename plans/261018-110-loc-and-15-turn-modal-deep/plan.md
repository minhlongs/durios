---
title: "Full-Repo <= 110 LOC Modularity & 3-Pillar 15-Turn Live Socratic Modal (--deep)"
description: "Tighten all 184 TypeScript files in src/ and test/ to <= 110 LOC, upgrade the browser Socratic Inspector Modal to 3 Pillars (15 Turns), and enforce CSS+JS byte parity in Modularity Turn 5."
status: completed
priority: P1
effort: 4h
branch: main
tags: [modularity, socratic-15-turn, ui-ux-2027, clean-code, type-safety]
created: 2026-10-18
---

# Full-Repo `<= 110 LOC` Modularity & 3-Pillar 15-Turn Live Socratic Modal Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm --deep`)
- **Outcome:** Streamline all 70 TypeScript files in the `111–115` LOC band (`38` in `src/`, `32` in `test/`) down to `<= 110 LOC`, update `locCeiling = 110` in `src/saas/codebase-modularity-deep-introspector.ts`, and upgrade the browser Socratic Inspector Modal (`durios-live-bridge.js`) to display all 3 Pillars (`15 / 15 PASS`: 5 Open-Core + 5 UI/UX + 5 Modularity).
- **Constraints:** Zero `: any` or `as any` casts, zero test regressions across 35 test suites, preserve `openSocratic10TurnModal` symbol compatibility.
- **Non-goals:** Changing domain rules or HTTP route paths.
- **Acceptance Criteria:**
  1. `maxSrcLoc <= 110` across all 101 `src/` `.ts` files.
  2. `maxTestLoc <= 110` across all 83 `test/` `.ts` files.
  3. `site/public/durios-live-bridge.js` and `queue/durios-live-bridge.js` byte-identical and rendering Pillar C (`5 Codebase Modularity & Type-Safety Turns`) with `modal-filter-modularity`.
  4. `bun run typecheck && bun test && bun run blueprint:verify-25-steps -- --deep` passes 100%.

## 2. Implementation Steps
- [x] **Step 1:** Streamline the 38 `src/` files and 32 `test/` files in the `111–115` LOC band to `<= 110 LOC`.
- [x] **Step 2:** Upgrade `site/public/durios-live-bridge.js` (and sync `queue/durios-live-bridge.js`) to render all 15 Socratic turns across 3 pillars (`Open-Core [5]`, `UI/UX [5]`, `Modularity [5]`).
- [x] **Step 3:** Update `src/saas/codebase-modularity-deep-introspector.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`, and `test/open-core-deep-introspector.test.ts` to enforce `locCeiling = 110` and CSS+JS asset parity.
- [x] **Step 4:** Verify with `bun run typecheck`, `bun test`, and `bun run blueprint:verify-25-steps -- --deep`, then record technical journal entry.

## 3. Bounded Ownership Split (VN/EN)
**Source (src/):**
- Senior Engineer: Files with domain logic (dossier-fsm.ts, escrow-state-machine.ts, organic-evidence-manager.ts, asean-corridor-adapters.ts) - 12 files.
- Mid Engineer: Utility and adapter files (field-auditor-cli.ts, standalone-manifest-verifier.ts, http-gateway-otp-provider.ts, pilot-* services, blueprint-cli.ts, index.ts, cli.ts) - 16 files.
- Junior Engineer: Remaining src/ files (10 files) - focus on comment cleanup and whitespace.

**Test (test/):**
- Senior Engineer: Core test suites (open-core-deep-introspector.test.ts, ecosystem-rehearsal-and-modularity.test.ts, field-auditor-cli.test.ts, standalone-manifest-verifier.test.ts) - 8 files.
- Mid Engineer: Integration and CLI test suites (pilot-ops-cli.test.ts, pilot-launch-gate-verifier.test.ts, pilot-kpi-evaluator.test.ts, sqlite-auth-service.test.ts, site-restore-service.test.ts, marketplace/escrow-state-machine.test.ts) - 12 files.
- Junior Engineer: Helper and scenario test files (remaining 12 files) - focus on removing duplicate assertions and consolidating setup.

**Browser Inspector (site/public/durios-live-bridge.js & queue/durios-live-bridge.js):**
- UI/UX Engineer: Update modal to show 3 pillars, add modularity filter, ensure CSS+JS byte parity, preserve internal API and modal name.
- Ownership: Single engineer responsible for both site/public and queue copies to maintain mirror parity.

## 4. Risk Assessment & Mitigation
- **Risk:** Over-compaction harming readability.  
  **Mitigation:** Preserve logical groupings, keep JSDoc and type definitions, only remove dead code and redundant whitespace.
- **Risk:** CSS/JS drift between site/public and queue.  
  **Mitigation:** Implement a pre-commit hook (or verify in Step 2) that fails if the two files differ.
- **Risk:** Changing locCeiling breaks existing tests.  
  **Mitigation:** Update test expectations in tandem with source changes, run tests in isolation before combining.
- **Risk:** Modal fallback to static 100 score.  
  **Mitigation:** Ensure modal reads real audit data; if unavailable, show `pending` or `error` with accurate passed counts, never fabricate `PASS/100`.

## 5. Success Criteria (Measurable)
- [ ] `find src test -name '*.ts' -exec sh -c 'wc -l {} | tail -1' \; | awk '{print $1}' | sort -nr | head -1` <= 110
- [ ] `cmp site/public/durios-live-bridge.js queue/durios-live-bridge.js` returns no output.
- [ ] Manual inspection of modal shows three pill buttons (Open-Core, UI/UX, Modularity) and selecting Modularity shows exactly 5 turns.
- [ ] `bun run typecheck` exits 0.
- [ ] `bun test` passes all tests.
- [ ] `bun run blueprint:verify-25-steps -- --deep` exits 0 with green output.

## 6. Open Questions
- None.
