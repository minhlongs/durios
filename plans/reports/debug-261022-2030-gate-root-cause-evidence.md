# Root-Cause Evidence: Hollow Launch Gates (GATE-01, GATE-02)

- **Date:** 2026-10-22 (Asia/Saigon)
- **Branch:** `hardening/launch-gate-evidence`
- **Purpose:** prove, by execution, why `goForLiveCustomerData` can authorize real customer data on evidence the code never inspects.
- **Method:** standalone Bun scripts calling `verifySingleSiteLaunchGates` directly. No test framework, no mocks.

## Repro 1 — GATE-01 is `existsSync` only

Script: `/tmp/claude/gate-repro.ts` (against `src/auth/pilot-launch-gate-verifier.ts`)

```
=== CASE 1: consent file exists but is EMPTY (0 bytes) ===
  file size: 0 bytes
  GATE-01 passed: true
  status: PASS

=== CASE 2: consent file contains unrelated junk, no signature ===
  file size: 27 bytes
  GATE-01 passed: true
  status: PASS

=== CASE 3: consent path never created ===
  file size: missing bytes
  GATE-01 passed: false
  status: PENDING_SITE_AND_CONSENT_SIGN_OFF
```

**Root cause:** `pilot-launch-gate-verifier.ts:38`
```ts
const gate01Passed = Boolean(consentPath && existsSync(consentPath));
```
The file content is never read. A 0-byte file and a file containing
"shopping list: milk, eggs" both open the gate that authorizes loading
real customer personal data.

## Repro 2 — GATE-02 passes on placeholder credentials

Script: `/tmp/claude/gate-repro2.ts`

```
GATE-02 passed: true
status: PASS
detail: Da cau hinh nha cung cap OTP (ESMS).
```

Input was `DURIOS_OTP_API_KEY: "LIVE_KEY_01"` with an unreachable URL.
No network call is made, so the gate proves configuration syntax, never delivery.

**Root cause:** `pilot-launch-gate-verifier.ts:41` reads `otpProvider.isConfigured`,
which is a hardcoded `true` on `HttpGatewayOtpProvider`
(`src/auth/http-gateway-otp-provider.ts:18`) once the constructor non-empty
providerName/apiUrl/apiKey check passes.

## The test that enshrines the false green

`test/pilot-launch-gate-verifier.test.ts:44-60` reaches
`goForLiveCustomerData: true` by writing a literal string into `TEST_CONSENT`
and passing `"LIVE_KEY_01"` / `"LIVE_SECRET_01"`.

## Why fix this first

GATE-01 authorizes ingesting real customer personal data under the repo own
hard safety boundary (`DECISION-01-CAI-LAY-SITE-SELECTION.md`: no real customer
data before all 5 gates pass). Today it is satisfied by the existence of a path.

The authoritative consent form already exists with real required fields:
`docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` Part A
(facility name, address, authorized representative + title, tenant id).
So the fix is not a new schema — it is making GATE-01 verify those markers.
