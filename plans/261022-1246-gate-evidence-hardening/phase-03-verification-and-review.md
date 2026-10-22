# Phase 3 — Verification, review, ship prep

## Steps

1. `bun run typecheck` — **clean** (`tsc --noEmit`, 0 errors).
2. `bun test` — **171 pass / 3 fail / 1 error**.
3. `bun run blueprint:verify-25-steps` — **25/25, "Overall Passed: YES (100%)"**.
4. Local code review of the diff (fresh context, not self-graded).
5. Update the debug report with the after-state repro output.

## Baseline comparison

| | Before | After |
|---|---|---|
| bun test | 162 pass / 3 fail | 171 pass / 3 fail |
| typecheck | clean | clean |
| blueprint | 25/25 | 25/25 |

The **same 3 failures exist before and after**. They are environment limits, not
regressions — verified by stashing every change and re-running against a clean tree:
- `test/adversarial-verification.test.ts` — fails on a clean tree too (12 pass / 1 fail).
- 2x `test/process-restart-persistence.test.ts` — "Server process failed to bind and respond to health check within timeout" (sandbox denies local port binding).

## What code review changed

The review found a **Critical defect in the first version of this fix**, plus two
Important ones. All three are fixed in `f35c1b9`:

1. **The rehearsal drill passed `consentVerified: true` on an unauthenticated route.**
   `http-router.ts:41` matches the rehearsal path **before** the
   `resolveAuthenticatedActor` gate at line 46, so an anonymous POST could produce a
   report whose GATE-01 detail read "Kiểm toán viên đã đối chiếu...". That is the same
   false green this work removes. The drill no longer attests and now runs 4-of-5.
2. **The field-auditor CLI could not pass the attestation at all**, so the only real
   operator path could never open GATE-01 and the pack would sit at HOLD forever.
   Added `--consent-verified-by <name>`, which opens the gate **and records who**
   attested, because a nameless boolean leaves a false PASS unattributable.
3. **The byte-size comment contradicted its own code.** Collapsed into one honest
   precondition: no bytes means incomplete, attested or not.

The `afterEach` test-cleanup finding was fixed in `3a6cdd1`.

## Honest limitation of the fix

This is an **accountability control, not an access control**. It converts a
silently-hollow gate into an explicit, attributable one and removes the overclaim.
A caller can still pass `consentVerified: true` without a real signed document, and
the byte-size checks prove only that a non-empty file exists at the path — a 1-byte
file, a scan of a blank form, or a file swapped after attestation would still pass,
because `sizeOfFile` runs once with no content hash and no mtime binding.
Closing the TOCTOU window requires Option B/C/D in the blocker report.
