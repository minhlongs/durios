# Technical Journal — 2026-10-17: Unified Pilot Go-Live Pack, Guarded B2B Escrow & Pluggable Extractor

## Summary
Completed the unified 3-direction implementation aligned with the 25-step DuriOS company blueprint (`plans/company-blueprint/plan.md`) and gated prompt campaign (`docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md`):

1. **Direction 3 (Pluggable Document Extractor & OCR Adapter Interface):**
   - Introduced `DocumentExtractorAdapter` and `CompositeExtractorRegistry` (`src/extraction/extractor-types.ts`, `src/extraction/composite-extractor-registry.ts`).
   - Built `LocalHeuristicTextExtractorAdapter` (`src/extraction/local-text-extractor.ts`) to parse ISO 6346 container numbers, customs seal numbers, cadmium lab results (`mg/kg`), planting area codes (`PUC`), packing house codes (`PHC`), net weight, and box counts from UTF-8/PDF streams with automatic fallback to `FixtureDocumentExtractorAdapter`.
   - Resolved a regex delimiter boundary nuance on `PHYTO_REGEX` so document headers (`PHYTOSANITARY_CERTIFICATE`) never false-match as certificate numbers.

2. **Direction 1 (Single-Site Pilot Go-Live Dossier Pack & Field Auditor Tool):**
   - Implemented `compilePilotGoLiveDossierPack`, `compileStandaloneGoLiveDossierPack`, and `verifyPilotGoLiveDossierPackIntegrity` (`src/export/pilot-dossier-pack-compiler.ts`) mapping `GATE-01`..`GATE-05` into a 5-item bilingual field checklist (`CHK-01`..`CHK-05`) sealed with a canonical SHA-256 digest (`reportSha256`).
   - Added `src/export/field-auditor-cli.ts` (`bun run pilot:audit-pack`) with `--output-dir`, `--verify`, and `--json` flags for on-site verification at the Cai Lậy packhouse.
   - Exposed `GET /api/v1/pilot/go-live-pack` (`src/server/pilot-dossier-pack-handler.ts`) enforcing `ADMIN` / `AUDITOR` / `MANAGER` RBAC (`403 Forbidden` for `CLERK` / `VIEWER`).

3. **Direction 2 (Guarded B2B Marketplace & Non-Custodial Escrow Scaffold - Prompt 6A):**
   - Implemented Dual-Lock protection (`src/marketplace/marketplace-guard.ts`) requiring both `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` and `goForLiveCustomerData === true` (fail-closed by default under Luật TMĐT `122/2025/QH15` and Nghị định `248/2026/NĐ-CP`).
   - Enforced strict zero-custody (`ZERO_CUSTODY_LICENSED_BANK_PARTNER`, rejecting any wallet/balance/card fields under Nghị định `52/2024/NĐ-CP`), buyer-tenant listing isolation, auditor price redaction, webhook idempotency keys, and 100% `compositeManifestSha256` verification on `EXPORTED` immutable dossiers before bank release authorization (`src/marketplace/escrow-state-machine.ts`).

## Verification Metrics
- **Typecheck:** `bun run typecheck` — 0 errors (`exactOptionalPropertyTypes: true`).
- **Tests:** `bun test` — 94 passed, 0 failed (3,549 `expect()` assertions across 22 test files).
- **Code Hygiene:** 0 `.ts` files > 179 LOC; 0 occurrences of `: any`, `as any`, or `<any>`.
