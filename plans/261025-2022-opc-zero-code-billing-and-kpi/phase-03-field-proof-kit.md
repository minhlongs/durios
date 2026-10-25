---
title: "Phase 3 — Field Proof Kit Bundler for Counterparties & Hùng Hậu Briefing"
description: "Compile and cryptographically verify a standalone Field Proof Kit JSON combining Go-Live readiness, multi-container KPIs, and verified export manifests."
status: ready
phase: 3
---

# Phase 3: Field Proof Kit Bundler for Counterparties & Hùng Hậu Briefing

## Context

To convert the Cai Lậy single-site pilot into a paid contract and present undeniable field evidence to Hùng Hậu Holdings executives, the 1-person OPC founder needs a single, self-contained cryptographic artifact (`FieldProofKitBundle`) that combines:
1. The `GoLiveReadinessReport` (5 launch gates + statutory references).
2. The `AggregateContainerValueMetrics` across the 5 pilot containers (time saved, human touches, loss avoided in VND).
3. The array of sealed `DossierExportManifest`s for all `EXPORTED` containers, each verified via `verifyExportManifest`.
4. The `OpcCommercialQuote` (5M VND pilot -> 60M VND/year Pro / 180M VND Enterprise) with zero-custody disclaimer.
5. A top-level `proofKitSha256` digest over the entire bundle with an offline verification function `verifyFieldProofKitBundle()`.

## Requirements

1. **`src/export/field-proof-kit-compiler.ts` (<= 95 LOC):**
   - Define `FieldProofKitBundle` interface and `CompileFieldProofKitOptions`.
   - Implement `compileFieldProofKitBundle(options)` which aggregates the readiness report, exported container manifests (verified with `verifyExportManifest`), multi-container value metrics, and commercial quote, sealing the bundle with `proofKitSha256`.
   - Implement `verifyFieldProofKitBundle(bundle)` which recomputes `proofKitSha256`, verifies the inner `GoLiveReadinessReport` integrity, and verifies every included `DossierExportManifest`.

2. **`src/export/field-proof-kit-cli.ts` (<= 95 LOC):**
   - CLI entry point & programmatic runner `runFieldProofKitCli(options)` supporting `--output-dir`, `--verify`, `--site-code`, `--tenant-id`, `--plan`, `--db-path`, `--data-dir`, `--backup-dir`, `--consent-file`.

3. **`test/field-proof-kit.test.ts` (<= 95 LOC):**
   - End-to-end test compiling a Field Proof Kit with sealed export manifests and KPI metrics, verifying cryptographic integrity (`verifyFieldProofKitBundle(bundle).valid === true`), and proving that any byte tampering in a container manifest or KPI number flips `valid` to `false`.
