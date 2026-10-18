---
title: "Full-Repo <= 125 LOC Modularity Refactor & Deep Introspector Telemetry (--deep)"
description: "Streamline all remaining 126-130 LOC modules across src/ and test/ so 100% of TypeScript files in the repository are strictly <= 125 LOC, enforced by the automated Codebase Modularity Guard."
status: in_progress
priority: P1
effort: 1.5h
branch: main
tags: [refactor, modularity, deep-brainstorm, clean-code, socratic]
created: 2026-10-18
---

# Full-Repo `<= 125 LOC` Modularity Refactor Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm --deep`)
- **Outcome:** Drive every single TypeScript file across both `src/` and `test/` down to strictly **`<= 125 LOC`**, lock in the `<= 125 LOC` ceiling in `test/ecosystem-rehearsal-and-modularity.test.ts`, and expose live `modularityVerification` metrics (`maxSrcLoc <= 125`, `maxTestLoc <= 125`, `allFilesUnder125Loc: true`) in `OpenCoreDeepBrainstormReport`.
- **Constraints:** Preserve 100% public API backward compatibility, `0` `:any` types, and all 142 tests (`3,960+` assertions).
- **Non-goals:** Altering domain compliance rules, SQLite schema versions, or HTTP endpoint contracts.
- **Acceptance Criteria:**
  1. All 15 `src/` files in the `126–130` LOC band streamlined to `<= 124` LOC.
  2. All 22 `test/` files in the `126–130` LOC band streamlined to `<= 124` LOC.
  3. `test/ecosystem-rehearsal-and-modularity.test.ts` enforces `<= 125 LOC` across all `src/` and `test/` `.ts` files.
  4. `bun run typecheck && bun test && bun run blueprint:verify-25-steps -- --deep` passes 100%.

## 2. Implementation Steps
- [ ] **Step 1:** Streamline the 15 `src/` modules (`126–130` LOC) to `<= 124` LOC each.
- [ ] **Step 2:** Streamline the 22 `test/` modules (`126–130` LOC) to `<= 124` LOC each.
- [ ] **Step 3:** Update `test/ecosystem-rehearsal-and-modularity.test.ts` to enforce `<= 125 LOC` across all `src/` and `test/` TypeScript files.
- [ ] **Step 4:** Run `bun run typecheck && bun test && bun run blueprint:verify-25-steps -- --deep` and write technical journal entry.
