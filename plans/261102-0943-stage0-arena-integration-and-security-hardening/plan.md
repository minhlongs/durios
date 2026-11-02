---
title: "DuriOS Stage 0 Arena Integration, F-16/F-17 Hardening & Security Fixes"
description: "Integrate verified Stage 0 Arena deliverables onto origin/main, close F-16/F-17 and 3 HTTP handler security findings, and formalize GATE-05A/05B split"
status: completed
priority: P1
effort: 2h
branch: stage0/arena-integration-20261102
tags: [stage0, security, pilot-gates, rbac, backup-restore]
created: 2026-11-02
updated: 2026-11-02
---

# Plan: DuriOS Stage 0 Arena Integration, F-16/F-17 Hardening & Security Fixes

## Objective & Scope

Integrate the independently verified Stage 0 Arena handover (`F-01..F-15` + `F-14b`) onto `origin/main` (`027d171`), deliver surgical fixes and regression tests for `F-16` (rehearsal account lockdown) and `F-17` (backup/restore CLI DB isolation & flag parity), close 3 HTTP handler security review findings (`open-core-portability-handler.ts`, `ecosystem-rehearsal-handler.ts`, `export-manifest-handler.ts`), fix responsive CSS horizontal overflow at `768px`/`360px`, and formalize the `GATE-05A` (Pre-Cutover Rehearsal) vs `GATE-05B` (Live 5-Container Graduation) split.

## Phases

| Phase | Name | Status | Files |
|---|---|---|---|
| 1 | Align `stage0/arena-integration-20261102` with `origin/main` (`027d171`) | completed | `src/server/http-router.ts`, `src/server/static-ui.ts`, `src/server/stitch-static-handler.ts` + `origin/main` AEO/Showroom modules |
| 2 | Close 3 HTTP handler security review findings + unit tests | completed | `src/server/open-core-portability-handler.ts`, `src/server/ecosystem-rehearsal-handler.ts`, `src/server/export-manifest-handler.ts`, `test/http-handler-security-hardening.test.ts` |
| 3 | Formalize `GATE-05A` / `GATE-05B` split in pilot-readiness docs | completed | `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` |
| 4 | Full verification, PR creation, review, merge (`--ship`), and CI convergence | completed | All touched files |

## Phase 1 — Align with `origin/main` (`027d171`)
- Merge `origin/main` (`027d171`) into `stage0/arena-integration-20261102`, preserving `origin/main`'s PR #14, #16, and #17 AEO/Showroom routes and static UI injectors alongside Stage 0 `handleGetExportManifest` (`src/server/export-manifest-handler.ts`).
- Keep `src/server/http-router.ts` `<= 100 LOC`.

## Phase 2 — Close 3 Security Findings (TDD)
1. **Tenant Isolation on Portability Export (`src/server/open-core-portability-handler.ts`):**
   - Filter `workspace.listDossiers(actor)` through `selectOwnTenantDossiers(workspace.listDossiers(actor), actor.tenantId)` before passing to `exportWorkspacePortabilityBundle` so cross-tenant shared dossiers are never exported as owned by the requesting tenant.
2. **Synthetic Rehearsal Guard on Authenticated Seeding (`src/server/ecosystem-rehearsal-handler.ts` & `src/server/ecosystem-rehearsal-seeder.ts`):**
   - Call `assertRehearsalBootstrapEnabled()` at the start of `handleSeedAuthenticatedRehearsal` and `seedRehearsalDossiersForActor` so authenticated actors cannot seed synthetic rehearsal dossiers (`REHEARSAL_DOSSIER_SEEDED`) into a live production database when `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP` is disabled.
3. **Fail-Closed Dossier Existence on Export Manifest (`src/server/export-manifest-handler.ts`):**
   - Return `errorResponse(\`Dossier '\${dossierId}' not found\`, 404)` immediately when `!dossier` instead of conditionally skipping `workspace.shareManager.assertPurposeAllowed(dossier, actor, [...MANIFEST_PURPOSES], "manifest")`.
4. **Regression Test Suite (`test/http-handler-security-hardening.test.ts`):**
   - Test all 3 invariants (`<= 100 LOC`, `0 :any`).

## Phase 3 — Formalize `GATE-05A` / `GATE-05B` Operational Split
- Update `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` and `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` to document `GATE-05A` (Pre-Cutover Rehearsal & Blind-Fault Drill at the packhouse workstation unlocking the first 5 live containers once `GATE-01..04` are evidenced) and `GATE-05B` (Live 5-Container Human-Stopwatch Graduation).

## Acceptance Criteria
- `bun run typecheck` passes with `0 errors`.
- `bun test` passes 100% (`300+` tests, `0 fail`).
- `bun run src/saas/blueprint-cli.ts --deep` passes `15/15` Socratic Turns (`maxSrcLoc <= 100`, `maxTestLoc <= 100`, `0 :any`).
- `queue/durios-design-system.css` and `site/public/durios-design-system.css` are byte-for-byte identical.
- GitHub PR opened, reviewed, labeled `ready to ship stable`, merged into `main`, and GitHub Actions CI green.
