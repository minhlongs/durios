---
title: "Octo-Hotspot Boundary Modularization Refactor (--deep <= 145 LOC)"
description: "Decompose all 8 boundary hotspot modules (175-179 LOC) in src/ into single-responsibility submodules <= 145 LOC with 100% backward compatibility and zero files > 174 LOC in src/."
status: completed
priority: P1
effort: 2h
branch: main
tags: [refactor, modularization, deep-brainstorm, open-core, clean-code]
created: 2026-10-17
---

# Octo-Hotspot Boundary Modularization Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm --deep`)
- **Outcome:** Eliminate all 8 boundary-hugging hotspot modules (`175–179` LOC) in `src/` by extracting cohesive helper submodules so every refactored file is strictly `<= 145` LOC and **zero files in `src/` exceed `174` LOC**.
- **Constraints:** Preserve 100% public API backward compatibility via re-exports, `0` `:any` types, and 100% test suite parity (`139+` tests green).
- **Non-goals:** Changing domain validation logic, SQLite schema versions, or HTTP route contracts.
- **Acceptance Criteria:**
  1. All 8 target `src/` modules (`175–179` LOC) decomposed to `<= 145` LOC:
     - `src/storage/file-storage-service.ts` (`179` LOC) $\rightarrow$ extract legacy blob reconciler into `src/storage/legacy-blob-reconciler.ts`.
     - `src/workspace/container-dossier-workspace.ts` (`179` LOC) $\rightarrow$ streamline constructor & upload rollback helper.
     - `src/saas/saas-tier-policy.ts` (`179` LOC) $\rightarrow$ streamline entitlements & downgrade builder.
     - `src/saas/hybrid-edge-sync-queue.ts` (`179` LOC) $\rightarrow$ streamline SQLite row mapper & queries.
     - `src/storage/sqlite-dossier-mapper.ts` (`176` LOC) $\rightarrow$ streamline row mapping & SQL upsert helpers.
     - `src/storage/sqlite-audit-ledger.ts` (`176` LOC) $\rightarrow$ streamline hash serialization & row mapper.
     - `src/server/document-handlers.ts` (`176` LOC) $\rightarrow$ streamline multipart/JSON upload parser.
     - `src/organic/organic-evidence-manager.ts` (`175` LOC) $\rightarrow$ streamline input validation helper.
  2. `evaluateOpenCoreDeepBrainstorm()` in `src/saas/open-core-deep-introspector.ts` verifies that all `src/` hotspot modules stay strictly `<= 174` LOC.
  3. `bun run typecheck` = 0 errors and `bun test` = 100% green.

## 2. Implementation Steps
- [x] **Step 1:** Extract `src/storage/legacy-blob-reconciler.ts` from `src/storage/file-storage-service.ts` and re-export types.
- [x] **Step 2:** Modularize and streamline `container-dossier-workspace.ts`, `saas-tier-policy.ts`, and `hybrid-edge-sync-queue.ts` (`<= 145` LOC each).
- [x] **Step 3:** Modularize and streamline `sqlite-dossier-mapper.ts`, `sqlite-audit-ledger.ts`, `document-handlers.ts`, `organic-evidence-manager.ts`, and `http-gateway-otp-provider.ts` (`<= 145` LOC each).
- [x] **Step 4:** Verify via `test/open-core-deep-introspector.test.ts`, run `bun run typecheck && bun test`, and log technical journal entry.
