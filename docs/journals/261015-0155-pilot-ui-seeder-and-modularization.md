# Technical Journal — 2026-10-15: Browser HITL Auth Gap, GATE-05 Seeder & Repo-Wide <=179 LOC Modularization

## Context
Following the completion of the Prompt 5A backend security and persistence campaign (`5A-1` through `5A-6`), three practical gaps remained before running live human workflow rehearsals (`GATE-05`) and maintaining strict codebase hygiene:
1. `src/server/public/index.html` still sent only `x-actor-role` headers without a browser login dialog, cookie session check (`/api/auth/me`), or `x-pilot-token` input, and had no UI panels for `5A-3` Share Grants or `5A-4` Organic Evidence.
2. Operators needed a single command (`bun run pilot:seed-rehearsal`) to seed the 5 synthetic Cai Lậy containers (including the 2 blind-seeded faults required by `GATE-05`: seal mismatch and unverified evidence).
3. `src/storage/schema-migrations.ts` (`373` LOC) and 14 test/scenario files (`276`–`1,099` LOC) exceeded the 200-line file ceiling and contained `as any` casts on parsed JSON responses.

## What Was Done
- **Browser HITL Auth & 5A Panels (`src/server/public/index.html`):** Added `<dialog id="auth-dialog">` supporting `/api/auth/login` (`HttpOnly; SameSite=Strict` `durios_session` cookie) and `x-pilot-token` header injection, plus `renderOrganicSection()` (`#sec-organic`) and `renderSharingSection()` (`#sec-shares`).
- **`GATE-05` Rehearsal Seeder (`src/auth/pilot-rehearsal-seeder.ts`):** Built `seedGate05PilotRehearsal()` and wired `"pilot:seed-rehearsal"` in `package.json`, verified by `test/pilot-rehearsal-seeder.test.ts`.
- **Full-Repo $\le 179$ LOC & Zero `:any`:** Split `src/storage/schema-migrations.ts` into 3 modules (`schema-migrations.ts`, `schema-migrations-auth.ts`, `schema-migrations-pilot.ts`), decomposed all 14 oversized `test/` and `test/helpers/` files into focused scenario modules, and replaced every `: any` / `as any` cast with explicit TypeScript interfaces.

## Verification Metrics
- `.ts` files $> 179$ LOC across `src/` and `test/`: `0` (max `179` LOC in `src/`, `177` LOC in `test/`)
- `:any` / `as any` / `<any>` across `src/` and `test/`: `0`
- `bun run typecheck`: `0` errors
- `bun test`: `79 pass, 0 fail` (`3,439` `expect()` calls across `17` test files)
