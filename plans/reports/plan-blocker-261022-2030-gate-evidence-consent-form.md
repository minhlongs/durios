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

## What shipped (Option A, honest interim)

Option A landed on `hardening/launch-gate-evidence` as three commits:
`4356c6e` (the fix), `f35c1b9` (review corrections), `3a6cdd1` (test hygiene).

**What it achieves:** GATE-01 can no longer report verified consent from a mere path.
A present file stays `PENDING_SIGNED_CONSENT_INCOMPLETE` until a named auditor attests
it against the signed paper original, and an empty file cannot be attested open.
GATE-02 keeps fail-closed semantics but its detail no longer claims delivery was proven,
since `isConfigured` is a static env check and no OTP is dispatched.

**What it does not achieve — read this before relying on it:**

- **Not an access control.** `consentVerified` is one boolean; any caller can set it.
  The shipped protection is that a PASS now carries a name (`--consent-verified-by`),
  so a false PASS is attributable after the fact, instead of silently green.
- **No binding to content.** `sizeOfFile` runs once. A 1-byte file, a scan of an
  unsigned or blank form, or a photo of the wrong site all still yield PASS, since
  size is not content.
- **TOCTOU window is open.** Attestation and read are separate operations on a path.

**Which options close the remaining gap:**

- **Option B** (recorded SHA-256 of the signed scan) closes the swapped-file and
  wrong-content cases cheaply: the audit pack already carries SHA-256 machinery.
  It does not close "attested an unsigned original".
- **Option C** (Ed25519 over the consent record) closes everything except key custody
  at a non-technical site and key loss — which for one Cai Lậy pilot is real cost for
  little gain.
- **Option D** (consent recorded in the immutable audit ledger, GATE-01 reads that
  entry) is the strongest fit for this repo: the ledger already exists and gates on it.
  It needs a writer path for the consent event and a decision on who may append.

**GATE-02 is unchanged in kind:** a syntactic key is still PASS. A live send rehearsal
against a staging provider remains outstanding and is a human step.

## Option B shipped (`69f8d3b`) — what it closed, and what it did not

The attestation now carries the SHA-256 the auditor recorded for the signed
original, and GATE-01 compares it against the file it reads. This is wired through
the field-auditor CLI as `--consent-sha256`, and it reuses the repo's existing
`calculateSha256` rather than adding a second hash path.

**Closed by Option B:**
- A file **swapped after attestation** now fails, with a detail naming the mismatch.
- An attestation with **no recorded hash** is refused rather than treated as
  sufficient, so a bare boolean can no longer open the gate.

**Still open, and Option B cannot close it:**
- **It is still an attestation of a human act.** If the auditor records the hash of
  a scan of an *unsigned*, *blank*, or *wrong-site* form, GATE-01 still passes: the
  hash binds to content but says nothing about whether a signature is on it.
- **The TOCTOU gap is narrowed but not closed.** The gate hashes the file at
  evaluation time and still does not hold an open fd between attest and read.
- **`consentVerified` remains a plain boolean.** No key, no cryptographic proof.

**Remaining decision:** Option D (record consent as an event in the immutable
audit ledger and read it from there) is the cheapest step that closes the last
attribution gap, because this repo already has the ledger and already gates on it.
Option C (Ed25519 over the consent record) closes everything and is still not
justified for one Cai Lậy pilot, given key custody at a non-technical site.
