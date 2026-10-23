
## Option D is now reachable in the field (`551b6d3`)

The first cut of Option D only let **tests** open GATE-01, because nothing in
production appended the attestation event. The field-auditor CLI now records it via
`--consent-verified-by`, so an operator has a real path to a PASS, and the sequence
"gate reads closed → CLI records → gate reads open, attributed" is a regression test
rather than an assumption.

This is the point where I would stop and call GATE-01 defensible for a pilot:
the attestation is attributable, tamper-evident, and content-bound. It is **not** proof
that a signature exists on the attested document, and it never will be without
Option C — which is a key-custody problem at a non-technical site, not a code problem.
