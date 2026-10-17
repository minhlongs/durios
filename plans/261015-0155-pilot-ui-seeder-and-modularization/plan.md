# Plan: Pilot HITL UI Auth/5A Panels, GATE-05 Rehearsal Seeder & Full-Repo Modularization

- **Date:** 2026-10-15
- **Status:** COMPLETED
- **Mode:** `/ak-bootstrap` + `/ak-brainstorm --deep`

## 1. Brainstorm Contract

- **Outcome:**
  1. Close the authentication gap between the hardened `5A-1` server (`src/server/actor-resolver.ts`) and the Browser HITL Workspace (`src/server/public/index.html`), and expose `5A-3` Delegated Share Grants and `5A-4` Organic Evidence panels in the UI (**Option B**).
  2. Provide a deterministic `GATE-05` single-site rehearsal seeder (`src/auth/pilot-rehearsal-seeder.ts` + `bun run pilot:seed-rehearsal`) that provisions Cai Lậy `CLERK` and `MANAGER` accounts and seeds 5 containers including 2 blind faults (**Option C**).
  3. Decompose all oversized `.ts` files across `src/` and `test/` so every TypeScript file in the repository is $\le 179$ lines with `0` `:any` / `as any` casts (**Option A**).
- **Constraints:**
  - Preserve all existing API contracts (`/api/v1/*` and `/api/*`), SQLite migrations (`V1`–`V5`), and static UI test contracts (`test/static-ui-contract.test.ts`, `test/ui-sample-upload.test.ts`).
  - Do not initiate Phase 3 B2B Marketplace / Escrow (`Prompt 6A`) before `GATE-01`..`GATE-05` sign-off.
- **Non-Goals:**
  - Cloud multi-tenant deployment or real customer data ingestion before `GATE-01` consent.
- **Acceptance Criteria:**
  - `0` `.ts` files in `src/` or `test/` exceed `179` lines.
  - `0` occurrences of `: any`, `as any`, or `<any>` in `src/` or `test/`.
  - `bun run typecheck` exits `0`.
  - `bun test` passes all `79` tests (`3,439` `expect()` assertions across `17` test files).

## 2. Completed Phases

| Phase | Scope | Key Artifacts | Status |
|---|---|---|---|
| **Phase 1 (src/ Refactor)** | Split `schema-migrations.ts` & `sqlite-dossier-repository.ts`; remove all `as any` in `src/` | `src/storage/schema-migrations.ts`, `src/storage/schema-migrations-auth.ts`, `src/storage/schema-migrations-pilot.ts`, `src/storage/sqlite-dossier-mapper.ts` | DONE |
| **Phase 2 (Option B — UI)** | Browser HITL Pilot Login (`5A-1`), Organic Evidence (`5A-4`), and Share Grants (`5A-3`) panels | `src/server/public/index.html`, `test/static-ui-contract.test.ts` | DONE |
| **Phase 3 (Option C — Seeder)** | `GATE-05` 5-container rehearsal seeder with 2 blind faults (`SEAL_MISMATCH`, `UNVERIFIED_EVIDENCE`) | `src/auth/pilot-rehearsal-seeder.ts`, `package.json`, `test/pilot-rehearsal-seeder.test.ts` | DONE |
| **Phase 4 (Option A — test/ Split)** | Decompose 14 oversized `test/` & `test/helpers/` files to $\le 177$ LOC and zero `any` | `test/*.test.ts`, `test/helpers/*.ts` | DONE |

## 3. Unresolved Questions

- **External `GATE-01` / `GATE-02` Field Execution:** Actual Cai Lậy packhouse site selection, data-consent signing (`GATE-01`), and live Zalo ZNS / eSMS commercial gateway credential provisioning (`GATE-02`) remain operational founder/field tasks outside local repository code.
