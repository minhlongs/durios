
## Option D shipped (`5b24d71`) — attestation now lives in the audit ledger

GATE-01 reads a `SITE_CONSENT_ATTESTED` event from the audit ledger in preference to
the caller arguments. This closes the gap Option B left open: the attestation is now
an **event**, not a parameter, so it is attributable and tamper-evident — it cannot be
rewritten without breaking the hash chain GATE-03 already verifies.

**Now closed:**
- A boolean argument alone no longer opens the gate when the ledger has no event.
- The attestation carries the auditor name, the consent path, and the SHA-256.
- A replaced file still fails, even with a matching event present.

**Still open:**
- **The ledger event is only as honest as the person who appends it.** An auditor can
  still record an event naming a scan of an unsigned form. What changed is that the act
  is now attributable and tamper-evident, not that the signature became verifiable.
- **Nothing records a cryptographic proof of the underlying signature.** Only Option C
  (Ed25519 over the consent record) does that, and it is not justified for one pilot site.
- **The event is appended by whoever runs the CLI.** The remaining exposure is that
  the same person can operate the pacer and the auditor; if that separation matters it
  needs a role rule at the append site.
