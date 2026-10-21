---
title: "Full-Repo <= 100 LOC Modularity Ceiling Wave (--deep)"
description: "Tighten all 185 TypeScript files in src/ (101 files) and test/ (84 files) to strictly <= 100 LOC (double-digit modularity), update introspector locCeiling to 100, and verify all 15 Socratic turns."
status: completed
priority: P1
effort: 1h
branch: main
tags: [modularity, socratic-15-turn, double-digit-loc, clean-code, type-safety]
created: 2026-10-18
---

# Full-Repo `<= 100 LOC` Modularity Ceiling Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm --deep`)
- **Outcome:** Streamline all 74 TypeScript files in the `101–110` LOC band (`26` in `src/`, `48` in `test/`) down to strictly `<= 100 LOC` (`maxSrcLoc <= 100`, `maxTestLoc <= 100`), achieving repository-wide double-digit file sizes while preserving clean 2-space formatting, zero `: any` casts, and 100% test pass rates.
- **Constraints:**
  - Preserve all domain logic, error handling, FSM transitions, and test assertions.
  - No minification, no 300+ char lines, no `: any` or `as any` type escapes.
  - Update `locCeiling = 100` in `src/saas/codebase-modularity-deep-introspector.ts` and sync all modularity guard tests.
  - Maintain byte parity between `site/public/` and `queue/` assets.
- **Non-goals:** Altering external HTTP contracts or deleting valid assertions.
- **Acceptance Criteria:**
  1. `maxSrcLoc <= 100` across all 101 `src/` `.ts` files.
  2. `maxTestLoc <= 100` across all 84 `test/` `.ts` files.
  3. `bun run typecheck` exits 0.
  4. `bun test` passes 100% of tests.
  5. `bun run blueprint:verify-25-steps -- --deep` outputs `GO_MODULAR_ZERO_ANY_VERIFIED (maxSrcLoc<=100, maxTestLoc<=100 <= 100, any=0)` with all 15 Socratic turns PASS.

## 2. Implementation Steps
- [x] **Step 1:** Streamline the 26 `src/` files in the `101–110` LOC band to `<= 100 LOC`.
- [x] **Step 2:** Streamline the 48 `test/` files in the `101–110` LOC band to `<= 100 LOC`.
- [x] **Step 3:** Update `locCeiling = 100` in `src/saas/codebase-modularity-deep-introspector.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`, and `test/open-core-deep-introspector.test.ts`.
- [x] **Step 4:** Run typecheck, full test suite, and 15-turn `--deep` introspector, then record technical journal entry.
