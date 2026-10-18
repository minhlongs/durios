# Page Override: Domain 2 — Trust, Auditor & MIT Verifier (`design-system/pages/trust-and-verifier.md`)

> **Inherits from:** `design-system/MASTER.md`  
> **Target Surfaces:** `auditor.html`, `buyer.html`, `mit-verifier-lab.html`, `socratic-introspector.html`, `rehearsal-command.html`, `organic-escrow-guard.html`

## 1. Cryptographic Proof & Verification Rules
- **Tabular Monospace Digests:** All SHA-256 hashes, ISO 6346 check-digit outputs (`CSQU3054383`), and 5-Gate checklists (`GATE-01..GATE-05`) must render with `--durios-font-mono` and `font-variant-numeric: tabular-nums`.
- **1-Byte Tamper Simulation (`mit-verifier-lab.html`):** Must expose a clear destructive/alert state (`MANIFEST_HASH_MISMATCH`, `--durios-danger`) paired with text/icon indicators (never color alone).
- **Non-Custodial Escrow & Organic Disclaimers (`organic-escrow-guard.html`):** Always display `EVIDENCE_STORED_NOT_CERTIFIED` and `ZERO_CUSTODY_LICENSED_BANK_PARTNER` badges prominently above action controls.
