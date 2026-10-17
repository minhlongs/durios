---
title: "Deep Brainstorm & 25-Step Open-Core Public GitHub + SaaS Introspector (--deep)"
description: "Bounded brainstorm contract, /idea RaaS partitioning, and 5-Turn Socratic Deep Introspector verifying MIT/AGPL/Commercial boundaries, Public GitHub hygiene, and SaaS unit economics."
status: completed
priority: P1
effort: 2h
branch: main
tags: [open-core, saas, brainstorm, idea, deep-introspection, ed25519, plg]
created: 2026-10-17
---

# Deep Brainstorm & 25-Step Open-Core Public GitHub + SaaS Plan (`--deep`)

## 1. Brainstorm Contract (`/ak-brainstorm` + `/idea`)
- **Outcome:** Verify and operationalize DuriOS's 25-step restructuring into a Public GitHub Open-Core repository (`AGPL-3.0-only` Core + `MIT` Verifier SDK) with sustainable SaaS monetization (`PACKHOUSE_PRO_SAAS` & `EXPORTER_ENTERPRISE`) via a 5-Turn Socratic Deep Introspector (`--deep`).
- **Constraints:** `0` `:any` types, all `.ts` files strictly `<= 179` LOC, zero secret/`.db` leaks on Public GitHub, fail-closed cloud adapters, and preservation of all 136 existing tests.
- **Non-goals:** Fabricating live external cloud OCR/ZNS/TSA network traffic or removing Dual-Lock Zero-Custody marketplace guards.
- **Acceptance Criteria:**
  1. `/idea` Step 1 GO verdict + 25-step Tri-Layer (`[Business]`, `[Agentic]`, `[Governance]`) synchronization verified across `.mekong/company.json`, `plans/company-blueprint/plan.md`, `plans/company-blueprint/tasks.md`, and `plans/open-core-saas-blueprint/plan.md`.
  2. `src/saas/open-core-deep-introspector.ts` (`<= 165` LOC) implements 5-Turn Socratic Cross-Examination (`--deep`):
     - **Turn 1 (MIT SDK Isolation):** Verifies the 4 MIT modules (`iso-6346.ts`, `document-hasher.ts`, `manifest-compiler.ts`, `standalone-manifest-verifier.ts`) have zero runtime imports from `AGPL` or `Commercial` modules (`auth`, `storage`, `saas`, `server`).
     - **Turn 2 (Public GitHub Governance & Secret Hygiene):** Verifies presence of `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`, `TRADEMARK-POLICY.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `.gitignore` exclusion of `.env` and `*.db`.
     - **Turn 3 (Ed25519 Zero-Lock-In & Graceful Downgrade):** Programmatically tests ephemeral Ed25519 license activation (`PACKHOUSE_PRO_SAAS`) and graceful downgrade to `COMMUNITY_OPEN_CORE` on expiry/tenant mismatch.
     - **Turn 4 (SaaS Unit Economics & Multi-Revenue Ceiling):** Verifies container gross margin $\ge 80\%$ (`150,000 VND` price vs `8,000 VND` COGS = `94.67%`) and Vietnam pure-SaaS ceiling (`281 * 60M VND = $657,643 < $1M ARR`) requiring the 8-layer revenue stack.
     - **Turn 5 (25-Step Blueprint & Tri-Layer Completeness):** Combines `evaluateBlueprint25Steps()` with module edition counts (`COMMUNITY_OPEN_CORE`, `PACKHOUSE_PRO_SAAS`, `EXPORTER_ENTERPRISE`).
  3. Wire `--deep` into `src/saas/blueprint-cli.ts` (`bun run blueprint:verify-25-steps -- --deep`) and `?deep=true` into `GET /api/v1/open-core/blueprint-status` (`src/server/open-core-blueprint-handler.ts`).
  4. Add unit + HTTP E2E tests in `test/open-core-deep-introspector.test.ts` and pass `bun run typecheck` + `bun test` (100% green).

## 2. Implementation Steps
- [x] **Step 1:** Create `src/saas/open-core-deep-introspector.ts` (`<= 165` LOC, `0 any`) implementing `evaluateOpenCoreDeepBrainstorm()`.
- [x] **Step 2:** Update `src/saas/blueprint-cli.ts` and `src/server/open-core-blueprint-handler.ts` to support `--deep` and `?deep=true`, and export from `src/index.ts`.
- [x] **Step 3:** Create `test/open-core-deep-introspector.test.ts` covering all 5 Socratic turns, CLI `--deep`, and HTTP `GET /api/v1/open-core/blueprint-status?deep=true`.
- [x] **Step 4:** Run `tester` and `code-reviewer` verification gates and write technical journal entry.
