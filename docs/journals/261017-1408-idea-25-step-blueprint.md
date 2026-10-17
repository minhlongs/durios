# Technical Journal: DuriOS 25-Step Open-Core Blueprint Pipeline

**Date:** 2026-10-17  
**Author:** Principal Product Architect & Engineering Lead  
**Command:** `/cook "chạy lại /idea 25 bước chính xác cho dự án ~/durios mã nguồn mở này --deep"`

## Key Outcomes

1. **Step 1 Open-Core Edition Partitioning:**
   - Formalized `COMMUNITY_OPEN_CORE` (`AGPL-3.0-only` Core + `MIT` Verifier SDK) vs `PACKHOUSE_PRO_SAAS` (60M VND/site/year) vs `EXPORTER_ENTERPRISE`.
2. **25-Step Blueprint Synchronization:**
   - Synchronized `.mekong/company.json`, `plans/company-blueprint/plan.md` (all 25 steps strictly formatted), and `plans/company-blueprint/tasks.md` with explicit `[Verified]`, `[Hypothesis]`, `[Target]` labels.
3. **Step 14 Signed Workspace Portability Funnel (`src/saas/workspace-portability-bundle.ts`):**
   - Implemented `exportWorkspacePortabilityBundle` and `verifyWorkspacePortabilityBundle` with HMAC-SHA256 signature, excluding private secrets, to power friction-free Community-to-Pro migration.
4. **Verification & Testing:**
   - 124 passed / 0 failed across 29 test files (`3,709` expect assertions).
   - 0 files > 179 LOC, 0 `: any`, 0 secret leaks.
