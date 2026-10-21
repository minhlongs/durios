---
title: "Full-Repo <= 95 LOC Modularity Ceiling Wave (--deep)"
description: "Tighten all 185 TypeScript files in src/ (101 files) and test/ (84 files) to strictly <= 95 LOC, update introspector locCeiling to 95, and verify all 15 Socratic turns."
status: in_progress
priority: P1
effort: 1h
branch: main
tags: [modularity, socratic-15-turn, loc-ceiling, clean-code, type-safety]
created: 2026-10-19
---

# Full-Repo `<= 95 LOC` Modularity Ceiling Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm --deep`)
- **Outcome:** Streamline all 59 TypeScript files in the `96–100` LOC band down to strictly `<= 95 LOC` (`maxSrcLoc <= 95`, `maxTestLoc <= 95`), achieving the next modularity ceiling while preserving clean 2-space formatting, zero `: any` casts, and 100% test pass rates.
- **Constraints:**
  - Preserve all domain logic, error handling, FSM transitions, and test assertions.
  - No minification, no 300+ char lines, no `: any` or `as any` type escapes.
  - Update `locCeiling = 95` in `src/saas/codebase-modularity-deep-introspector.ts` and sync all modularity guard tests.
  - Maintain byte parity between `site/public/` and `queue/` assets.
- **Non-goals:** Altering external HTTP contracts or deleting valid assertions.
- **Acceptance Criteria:**
  1. `maxSrcLoc <= 95` across all 101 `src/` `.ts` files.
  2. `maxTestLoc <= 95` across all 84 `test/` `.ts` files.
  3. `bun run typecheck` exits 0.
  4. `bun test` passes 100% of tests.
  5. `bun run blueprint:verify-25-steps -- --deep` outputs `GO_MODULAR_ZERO_ANY_VERIFIED (maxSrcLoc<=95, maxTestLoc<=95 <= 95, any=0)` with all 15 Socratic turns PASS.

## 2. Current Distribution (96-100 band = 59 files)
| LOC | Count | Files |
|-----|-------|-------|
| 100 | 15 | Various src/ and test/ |
| 99  | 15 | Various src/ and test/ |
| 98  | 14 | Various src/ and test/ |
| 97  | 6  | Various src/ and test/ |
| 96  | 9  | Various src/ and test/ |

## 3. Implementation Steps
- [ ] **Step 1:** Streamline the `src/` files in the `96–100` LOC band to `<= 95 LOC`.
- [ ] **Step 2:** Streamline the `test/` files in the `96–100` LOC band to `<= 95 LOC`.
- [ ] **Step 3:** Update `locCeiling = 95` in `src/saas/codebase-modularity-deep-introspector.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`, and `test/open-core-deep-introspector.test.ts`.
- [ ] **Step 4:** Run typecheck, full test suite, and 15-turn `--deep` introspector, then record technical journal entry.

## 4. Key Files to Modify (src/ 96-100 band)
Files at 100, 99, 98, 97, 96 LOC in src/ will be compacted via: joining wrapped lines, collapsing whitespace, inlining short throws, joining array/object literals.

## 5. Key Files to Modify (test/ 96-100 band)
Same compaction techniques applied to test files. Preserve all test names and assertions.

## 6. Success Criteria
- All 185 TS files <= 95 LOC
- Typecheck: 0 errors
- Tests: 145 pass / 0 fail
- 15-turn --deep: 15/15 PASS, GO_MODULAR_ZERO_ANY_VERIFIED
- UI/UX Pro Max: 100/100
- Blueprint: 25/25