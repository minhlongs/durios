# Phase Implementation Report — Financial Verification Test Modularity Split

- Plan: none (direct task)
- Status: DONE_WITH_CONCERNS
- Date: 2026-10-22

## Outcome (lead)

The 100-LOC ceiling is now satisfied across both `src/` and `test/`, the modularity
introspector passes 3/3, and all 5 financial-verification HTTP tests still pass with
their assertion count preserved exactly (32 `expect()` calls, same as the original
baseline). **However, the premise of the task no longer matched the working tree**: the
split had already been performed by a concurrent session while I was investigating, and
the over-ceiling file turned out to be the *helper fixture*, not the test file named in
the task.

## Discrepancy against the task statement (read this first)

| Task statement | Actual measured state |
|---|---|
| test/financial-verification-http.test.ts is 187 lines | It was **82 lines** on first read; 88 lines now |
| 1 test fails ("rejects a mint request from a tenant that does not own the dossier") | It **passes** — 5 pass / 0 fail both before and after |
| "This is now the ONLY remaining file over the ceiling" | The only file over the ceiling was **test/helpers/financial-verification-http-fixtures.ts (111 lines)**. The named test file was never over 100. |
| src/ files already fixed and staged for commit | `git status` for `src/` and `test/` is now **empty** — everything was committed mid-task |

Consequences for the work: the split the task asked for was already complete when I
arrived, so implementing it again would have duplicated a peer session's edits. I made
**zero file changes**; all files below are the concurrent session's work.

## How the ceiling was actually resolved (state I verified and left in place)

The single over-ceiling helper was split along an existing repo boundary: the
`test/helpers/` directory already holds per-concern helper modules (e.g.
`redaction-and-blobs-5a5-fixtures.ts`, `rbac-and-tuples-5a2-matrix-part1.ts`), so the
extraction follows convention rather than inventing a new one.

- `/Users/macbook/durios/test/helpers/financial-verification-http-app.ts` (40 lines) —
  app lifecycle: `FinancialTestApp`, `startFinancialVerificationApp`,
  `stopFinancialVerificationApp`. Reuses `seedTestPilotActor` from
  `test/helpers/auth-test-helper.ts` unchanged.
- `/Users/macbook/durios/test/helpers/financial-verification-http-fixtures.ts` (73 lines) —
  constants (`COMMERCIALLY_SENSITIVE_KEYS`, `CONTAINER_NUMBERS`, DB/upload paths) plus the
  HTTP-step helpers `createSealedDossier`, `mintAttestationToken`,
  `verifyAttestationAuthentically`.
- `/Users/macbook/durios/test/financial-verification-http.test.ts` (88 lines) — the tests.

The setup was also normalized: the original lazily-started `app` with a null check moved
to a `beforeEach` + `let running: FinancialTestApp` pattern, which is cleaner and matches
the repo's other scenario bootstraps.

## Verification (raw output)

1. Ceiling check — **EMPTY (pass)**
   ```
   $ find src test -name "*.ts" | xargs wc -l | awk '$1>100 && $2!="total"'
   (no output)
   ```
   Max LOC: `src/` = 99, `test/` = 99.

2. Typecheck — **exit 0**
   ```
   $ bun run typecheck
   $ tsc --noEmit
   ```
   No `:any` in any of the three files (checked with the checker's own regex
   `:\s*any\b|\bas\s+any\b`; `anyTypeViolationsCount=0` repo-wide).

3. Financial verification set — **20 pass / 0 fail / 57 expect() calls**
   ```
   $ bun test test/financial-verification-http.test.ts test/financial-attestation-service.test.ts test/financial-attestation-token.test.ts
   20 pass / 0 fail
   ```
   The HTTP file alone: 5 pass / 0 fail / 32 expect() calls — identical to the baseline
   I captured before the refactor landed. Independently runnable via
   `bun test ./test/financial-verification-http.test.ts` (5 pass / 0 fail).

4. Modularity introspector — **3/3 pass**
   ```
   $ bun test test/open-core-deep-introspector.test.ts
    3 pass / 0 fail / 51 expect() calls
   ```

## On the "known failure" I was told to preserve

The task stated the cross-tenant test failed and asked me to preserve it verbatim as
failing. It does not fail — the concurrency split plus the already-staged `src/` changes
mean the ownership check now returns **400 with
`"Only the dossier's owning tenant may mint a financial attestation."`**. I probed this
with a throwaway test (since removed) to confirm the pass is genuine and not vacuous:
the assertion `toBeGreaterThanOrEqual(400)` is satisfied by a real business-rule
rejection, not by a crash or empty response. Since it passes legitimately, there was
nothing failing to preserve or report.

## Pre-existing failures — untouched, not mine to fix

`bun test` (full suite) is **160 pass / 5 fail**. All five are pre-existing and outside
this task's file ownership:

- `Adversarial Verification Suite > binds to 127.0.0.1 by default...` — "Failed to start server. Is port 31099 in use?"
- `Open-Core 25-Step Blueprint ... E2E > validates complete 25-step blueprint synchronization` — expected 25, received 32 (tasks.md has more completed lines)
- two `Section 1: True OS Process-Level Restart Persistence Integration Test` tests — "Server process failed to bind and respond to health check within timeout"
- `Step 15: Dense Cluster GTM Playbook ... confirms all 25 steps ... marked [x] [COMPLETED]` — expected 25, received 32

The port-binding failures are consistent with the sandbox blocking local port binding.
I did not modify any of these tests.

## Files

No files were created, modified, or deleted by me. A temporary probe test
(`test/zz-probe-rival-status.test.ts`) was created to verify the cross-tenant status code
and then removed; `git status` confirms it is gone.

## Concerns

- **File-ownership collision risk during the task window.** A concurrent session was
  actively rewriting `test/financial-verification-http.test.ts` and both helper files
  throughout my investigation (mtimes moved from 10:35 to 10:41, and the test file's
  import block briefly contained duplicate `startFinancialVerificationApp` imports, which
  silently passed because JS tolerates the shadowed duplicate binding). Had I written
  files, I would have clobbered that work. If other phases were meant to run against
  these same files, the sequencing should be confirmed.
- **The task's stated premise was wrong on three counts** (line count, which file was
  over the ceiling, and which test failed). Worth checking upstream where that premise
  came from, since the "6 currently: 5 pass + 1 fail" figure also does not match: this
  file has always been 5 tests, never 6.
