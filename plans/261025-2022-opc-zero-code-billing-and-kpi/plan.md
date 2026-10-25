---
title: "Zero-Code Billing, Multi-Container KPI Measurement & Field Proof Kit for Cai Lay Pilot"
description: "Implement Zero-Code Billing CLI tooling, evaluate FirstContainerValueMetrics across all N dossiers, and add Field Proof Kit export commands strictly adhering to the <= 100 LOC ceiling."
status: completed
priority: P1
effort: "3 phases"
branch: feat/opc-zero-code-billing-and-kpi
tags: [opc, zero-code-billing, kpi, field-proof-kit, loc-ceiling-100]
created: 2026-10-25
---

# Zero-Code Billing, Multi-Container KPI Measurement & Field Proof Kit for Cai Lay Pilot

## Overview

Following the unanimous `--ultra` strategic advice (`plans/reports/advise-261025-1919-durios-grab-opc-revenue-stack.md`), DuriOS is advancing toward its pilot milestone under a 1-person OPC model with 0–5 hours/week field time. To prepare for the Cai Lậy single-site pilot (`SITE-CAILAY-TIENGIANG-01`), we close three concrete technical gaps in the codebase:

1. **Gap 1: Missing Operator CLI for Zero-Code Billing & Offline Ed25519 License Generation:**
   While `src/saas/saas-tier-policy.ts` implements `createSignedSaasLicenseKey()` and `generateEphemeralSaasLicenseKeyPair()`, there is no CLI tool for the 1-person OPC operator to issue, verify, or inspect offline Ed25519 commercial license keys (`DURIOS.<payload>.<sig>`) for packhouses (5M VND pilot, 60M VND annual, or pay-go packs) or export standard payment remittance details.
2. **Gap 2: KPI Evaluator Blind Spot on Multi-Container Value Metrics:**
   `src/auth/pilot-kpi-evaluator.ts:49` currently only calls `evaluateFirstContainerValueMetrics(dossiers[0]!)`, ignoring the remaining $N-1$ containers. When evaluating 5 rehearsal or live containers, the 4 economic value KPIs (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`) must be aggregated across all $N$ evaluated dossiers with mean and total statistics without breaking `FirstContainerValueMetrics` compatibility.
3. **Gap 3: Missing Field Proof Kit Bundler for Counterparties & Hùng Hậu Meetings:**
   Field auditor CLI (`src/export/field-auditor-cli.ts`) compiles single-site launch readiness, but does not aggregate the 5 sealed container manifests (`DossierExportManifest`), KPI audit results, and zero-custody compliance disclaimer into an exportable, standalone "Field Proof Kit" bundle (`DURIOS_PROOF_KIT_<siteCode>_<timestamp>.json`) verified by SHA-256.

## Architecture & Constraints

- **Strict <= 100 LOC Ceiling:** Every `.ts` file in `src/` and `test/` MUST be strictly `<= 100 lines` (enforced by `test/ecosystem-rehearsal-and-modularity.test.ts:77`).
- **Zero `:any` Types:** Strict TypeScript mode with zero untyped casts.
- **On-Prem & Loopback Invariant:** Keep HTTP server on `127.0.0.1` (`assertLoopbackHostname`).
- **Zero Payment Gateways in Code:** Maintain Zero-Custody (no third-party custodial code, no online payment webhooks before 3 paying packhouses).

## Phases

| Phase | Title | Description | Target Files | Status |
|---|---|---|---|---|
| **Phase 1** | Zero-Code Billing Operator CLI | Operator CLI to issue & verify signed Ed25519 license keys & VietQR pilot invoices | `src/saas/license-generator-cli.ts`, `src/saas/invoice-template.ts`, `test/license-generator-cli.test.ts` | Completed |
| **Phase 2** | Multi-Container KPI Aggregation | Extend `pilot-kpi-evaluator.ts` to aggregate value metrics across all $N$ containers | `src/auth/pilot-kpi-evaluator.ts`, `src/auth/pilot-kpi-extended-types.ts`, `test/pilot-kpi-multi-container.test.ts` | Completed |
| **Phase 3** | Field Proof Kit Bundler | Compile & verify 5-container SHA-256 manifests + KPI report for counterparties | `src/export/field-proof-kit-compiler.ts`, `src/export/field-proof-kit-cli.ts`, `test/field-proof-kit.test.ts` | Completed |

## Success Criteria

- [x] All new files in `src/` and `test/` are strictly `<= 100 LOC` (`wc -l <file> <= 100`).
- [x] Operator CLI can generate a valid Ed25519 signed license string matching `DURIOS.<base64url>.<sig>` and be validated by `resolveSaasSubscriptionStatus`.
- [x] `computeGate05KpiFromDossiers` returns aggregate value metrics across all $N$ containers while retaining `firstContainerMetrics` for backward compatibility.
- [x] Field Proof Kit compiler outputs a self-contained JSON pack verifying the composite SHA-256 integrity of 5 container manifests and KPI reports.
- [x] Full test suite passes (`bun test` >= 235 tests passing, 0 failures).
- [x] Typecheck clean (`bun run typecheck` reports 0 errors).
