---
title: "Phase 1 — Zero-Code Billing Operator CLI & Pilot Invoice Generator"
description: "Implement offline Ed25519 commercial license key CLI and deterministic VietQR pilot/annual invoice template for 1-person OPC operations."
status: ready
phase: 1
---

# Phase 1: Zero-Code Billing Operator CLI & Pilot Invoice Generator

## Context

In the 1-person OPC revenue stack, DuriOS avoids building premature payment gateways before having 3 paying packhouses. Instead, the founder collects 5,000,000 VND (30-day pilot), 60,000,000 VND/year (annual Pro), or pay-go via standard bank transfer (VietQR) and issues a cryptographically signed offline Ed25519 license key (`DURIOS.<payload>.<sig>`).

Currently, `src/saas/saas-tier-policy.ts` exports `createSignedSaasLicenseKey`, `generateEphemeralSaasLicenseKeyPair`, and `resolveSaasSubscriptionStatus`, but there is no operator CLI or commercial invoice remittance generator to issue and verify keys from the command line or programmatically.

## Requirements

1. **`src/saas/invoice-template.ts` (<= 95 LOC):**
   - Define `OpcCommercialPlanCode = "PILOT_30D_5M_VND" | "PRO_ANNUAL_60M_VND" | "ENTERPRISE_ANNUAL_180M_VND"`.
   - Define `OpcCommercialQuote` interface with `quoteId`, `tenantId`, `siteCode`, `planCode`, `edition` (`"PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE"`), `amountVnd`, `durationDays`, `issuedAt`, `expiresAt`, `paymentMethod` (`"BANK_TRANSFER_VIETQR_MANUAL"`), `transferMemo`, and `zeroCustodyDisclaimer` (confirming compliance with Nghị định 52/2024/NĐ-CP).
   - Implement `buildOpcCommercialQuote(input)` that calculates `expiresAt` (`issuedAt + durationDays`) and deterministic `transferMemo` (`DURIOS <tenantId> <planCode>`).

2. **`src/saas/license-generator-cli.ts` (<= 95 LOC):**
   - Implement `issueOpcCommercialLicenseBundle(options)` that:
     - Takes `tenantId`, `siteCode`, `planCode`, `privateKeyPem`, `publicKeyPem`, `issuedAtIso`.
     - Builds the `OpcCommercialQuote`.
     - Calls `createSignedSaasLicenseKey` to mint `licenseKey` (`DURIOS.<payload>.<sig>`).
     - Verifies the minted key immediately via `resolveSaasSubscriptionStatus` to guarantee 100% self-consistency before returning.
   - Support CLI flags (`--keygen`, `--issue`, `--verify`, `--tenant-id`, `--plan`, `--site-code`, `--private-key-file`, `--public-key-file`, `--license-key`) when invoked via `bun run src/saas/license-generator-cli.ts`.

3. **`test/license-generator-cli.test.ts` (<= 95 LOC):**
   - Test keypair generation, 5M VND 30-day pilot license issuance, 60M VND 365-day annual license issuance, Enterprise 180M VND issuance, immediate verification, tenant mismatch rejection, and CLI argument handling.
