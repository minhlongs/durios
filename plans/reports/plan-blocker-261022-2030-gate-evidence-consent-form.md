# Gate-hardening plan blocker: consent form is a paper document (no markers)

- **Date:** 2026-10-22
- **Status:** BLOCKER found during red-team; blocks Phase 1 as written.

## Finding

The plan assumed the signed consent record carries machine-checkable markers named
`TENANT`, `FACILITY`, `AUTHORIZED_REPRESENTATIVE`, `DECLARATION`.
It does not. Reading `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`:

- Part A is a **hand-filled paper form**: facility name / address / representative + title /
  local tenant id, each a run of dots to be written on by hand.
- There is **no signature block anywhere** (`grep` for "Ký tên", "Chữ ký" returns nothing).
- Part B is a policy (retention/deletion), Part C is a manual KPI log sheet.

So the file at `DURIOS_GATE01_CONSENT_FILE` is expected to be a **scan or photo of a
signed human document**. Its bytes are not parseable evidence of a signature.
A marker check would therefore either (a) be invented from nothing, or
(b) be satisfied by editing the text, which is exactly as forgeable as `existsSync`.

## Consequence for the plan

Adding a marker validator does not close the real gap; it only moves it.
A stricter-but-still-forgeable check that claims to be stronger is worse than the
current honest `existsSync`, because it manufactures false confidence.

## Options for the founder (need a decision — do not guess)

| # | Option | What it buys | Cost / residual risk |
|---|---|---|---|
| A | Keep `existsSync`, fix only the **claims**: rename the status label and detail text to say "signed consent file present at path" instead of implying verified consent, and record in plan.md that GATE-01 is an existence check, not a consent check. | Honesty; zero false confidence; smallest change. | The real gap stays open until a human signs. |
| B | Same as A, plus a **documented operator attestation step**: a person records SHA-256 of the signed scan in a small local file, and GATE-01 checks the file exists AND its recorded hash matches the scanned document. | Binds the gate to a specific signed artifact rather than any path. | Still relies on an operator doing it truthfully; needs a tiny new module + docs. |
| C | True cryptographic signature (e.g. Ed25519 over the consent record, key held by the packhouse manager). | Strong; not forgeable by path or text edits. | Requires key custody at a non-technical site, enrollment ceremony, and a key-loss story — significant scope. |
| D | Block on a **human sign-off record** (an auditor or founder records consent in the audit ledger, and GATE-01 reads that ledger entry). | Ties the gate to an immutable, attributable act. | Needs an audit-ledger writer path for consent; moderate scope. |

## Recommendation

Option A now, Option B as the immediate follow-up. A is honest and tiny; C is the only
genuinely strong answer but is not YAGNI-justified for one pilot site in Cai Lậy.
