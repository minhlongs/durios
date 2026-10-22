# Phase 2 — GATE-02 honest reporting + test truth-up

## Context

`pilot-launch-gate-verifier.ts:41` reads `otpProvider.isConfigured`. That flag is a
hardcoded `true` on `HttpGatewayOtpProvider` once the constructor non-empty checks pass.
So the gate reports "configured" when it has only proven syntax. Proven in the debug report.

## Files

| File | Action |
|------|--------|
| `src/auth/pilot-launch-gate-verifier.ts` | **edit** — honest detail text; gate semantics unchanged |
| `test/pilot-launch-gate-verifier.test.ts` | **edit** — stop asserting a live-data green on placeholders |

## Steps

1. Keep `gate02Passed = otpProvider.isConfigured` **unchanged** (fail-closed behavior is already correct when config is absent).
2. Change only the `detail` string so it no longer reads as proof of a working channel.
   It must state that configuration was parsed, and that a live send has not been proven.
   Keep the Vietnamese voice of the other gate details.
3. In `test/pilot-launch-gate-verifier.test.ts`, the test currently named "reports goForLiveCustomerData: true only when all 5 blocking gates pass":
   - keep asserting the 5-gate logic (that is real and worth testing)
   - add a comment stating that GATE-01/GATE-02 satisfaction here is **configuration-only**, not field-proven delivery
   - do not weaken the assertion; do not delete the test
4. Add one new test asserting GATE-02 is `false` when `DURIOS_OTP_PROVIDER` is absent.

## Non-Goals

- No live network call to the OTP gateway.
- No change to `isConfigured` on any provider adapter.
- No `sendOtp` smoke test (would need credentials and network).

## Success

Gate detail no longer overclaims; the suite still passes; new negative test green.
