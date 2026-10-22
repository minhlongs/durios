---
title: "gate-evidence-hardening"
description: "Make GATE-01 and GATE-02 require real evidence instead of file existence and non-empty config, so goForLiveCustomerData cannot authorize customer data on unverified inputs."
status: completed
priority: P1
effort: "S"
tags: ["launch-gate", "compliance", "tdd"]
created: 2026-10-22
---

# Launch-gate evidence hardening

## Overview

The 5-gate launch sequence decides when real customer data may be loaded.
GATE-01 (data consent) and GATE-02 (OTP channel) previously passed on inputs the
code never inspected: `existsSync(consentPath)` and a non-empty gateway key.
Root cause is proven by execution in `plans/reports/debug-261022-2030-gate-root-cause-evidence.md`.

## Goals

| # | Goal | Priority | Status |
|---|------|----------|--------|
| 1 | GATE-01 must pass only when the consent file carries the required signed markers | P1 | **Revised — see below** |
| 2 | GATE-01 must not describe mere file existence as verified consent | P1 | DONE |
| 3 | GATE-02 must fail closed and never claim delivery from configuration alone | P1 | DONE |
| 4 | The test suite must not assert `goForLiveCustomerData: true` on unverified inputs | P1 | DONE |
| 5 | Existing consumers (`field-auditor-cli`, `ecosystem-rehearsal-drill`) keep working unchanged | P2 | DONE |

## Non-Goals

- No new consent form schema. The authoritative form already exists at
  `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` Part A.
- No change to GATE-03, GATE-04, GATE-05 semantics.
- No change to `plan.md` / `tasks.md` blueprint text or step labels.
- No live OTP call. A gateway call is out of scope for a local pilot dry-run.
- No cryptographic consent verification. See the blocker report for options and costs.

## Acceptance Criteria

- [x] A 0-byte consent file fails GATE-01.
- [x] A consent file lacking the signed markers fails GATE-01 and names what is missing.
- [x] An absence attestation cannot open an empty file.
- [x] GATE-01 no longer claims verified consent from file existence.
- [x] GATE-02 detail states configuration was read, not that delivery was proven.
- [x] No test asserts `goForLiveCustomerData: true` using `"LIVE_KEY_01"`-style placeholders without an explicit attestation.
- [x] `bun run typecheck` clean; `bun test` has no new failures versus the pre-change baseline.

## Design note: why not a marker check

The original plan called for parsing consent markers from the file. Red-team found the
consent form is a **hand-filled paper document with no signature block**,
(`grep` for "Chữ ký"/"Ký tên" returns nothing), so the file on disk is a scan or photo
whose bytes carry no machine-checkable signature. A marker check would be invented
from nothing and would be exactly as forgeable as `existsSync` — but it would read as
stronger, which is worse. See `plans/reports/plan-blocker-261022-2030-gate-evidence-consent-form.md`
for the four options and their costs.

The shipped design keeps the gate closed by default and opens it only when a caller
passes `consentVerified: true`, which is an explicit auditor act rather than an
inference from bytes.

## Risk & Rollback

- **Risk:** GATE-01 becomes stricter, so any currently-passing pilot run flips to pending. This is intended.
- **Risk:** GATE-01 gains a new status label `PENDING_SIGNED_CONSENT_INCOMPLETE`. `statusLabel` is a loose `string`, so nothing breaks type-wise; nothing matches the old label string except this gate itself.
- **Rollback:** single revert; no schema or data migration.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Consent evidence verifier + GATE-01 wiring (TDD) | done |
| 2 | GATE-02 honest reporting + test truth-up (TDD) | done |
| 3 | Verification: typecheck, tests, code review | done |
