# Phase 1 — Consent evidence validator + GATE-01 wiring

## Context

GATE-01 currently: `Boolean(consentPath && existsSync(consentPath))` at
`src/auth/pilot-launch-gate-verifier.ts:38`. Proven to pass on a 0-byte file.

## Files

| File | Action |
|------|--------|
| `src/auth/consent-evidence-verifier.ts` | **create** — parses and validates the signed consent record |
| `src/auth/pilot-launch-gate-verifier.ts` | **edit** — use the validator; keep fail-closed shape |
| `test/consent-evidence-verifier.test.ts` | **create** — RED first, then GREEN |
| `test/pilot-launch-gate-verifier.test.ts` | **edit** — replace the literal-string consent fixture with a valid one |

## Steps

1. **RED.** Write `test/consent-evidence-verifier.test.ts` asserting:
   - empty file → invalid, reason mentions missing markers
   - unrelated junk → invalid
   - all required markers present → valid
   - file unreadable/missing → invalid (never throws to the caller as an unhandled crash)
2. Run the new test. **Confirm it fails** because the module does not exist.
3. **GREEN.** Create `src/auth/consent-evidence-verifier.ts`:
   - `export interface ConsentEvidenceReport { readonly verified: boolean; readonly statusLabel: string; readonly detail: string; readonly missingMarkers: readonly string[]; }`
   - `export function verifyConsentEvidence(filePath: string | undefined): ConsentEvidenceReport`
   - Return a union type `ConsentEvidenceStatus = "PASS" | "PENDING_SITE_AND_CONSENT_SIGN_OFF" | "PENDING_SIGNED_CONSENT_INCOMPLETE"`
   - Required markers, taken verbatim from `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` Part A:
     `TENANT`, `FACILITY`, `AUTHORIZED_REPRESENTATIVE`, `DECLARATION`
   - Read with `readFileSync` inside a `try/catch`; an unreadable file is `verified: false`, never a crash.
   - `statusLabel` for a file that exists but lacks markers must NOT be `PASS`.
4. Wire into `pilot-launch-gate-verifier.ts`: replace the `existsSync` expression with `verifyConsentEvidence(consentPath).verified`.
   - Keep `GATE-01` in the returned tuple in the same index (consumers address gates by `gateId`, but a positional test exists).
   - Preserve the existing `detail` string for the missing-file case so no downstream match breaks.
5. Update `test/pilot-launch-gate-verifier.test.ts` to write a consent fixture that carries all required markers.
6. Run typecheck + the two touched test files. Both must be green.

## Stop Conditions

- If a required marker would force inventing a field that is not in the consent form doc, **stop and ask** — the doc is authoritative.
- If any existing consumer matches the `detail` string exactly, **stop and ask** before changing it.

## Success

`bun test test/consent-evidence-verifier.test.ts test/pilot-launch-gate-verifier.test.ts` green, and the 0-byte case now fails.
