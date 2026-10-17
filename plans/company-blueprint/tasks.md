# DuriOS 25-Step Company Blueprint Task Checklist

**Project:** `~/durios` — Verified Durian Trade Network  
**Baseline Date:** 2026-10-17  
**Status Key:** `[COMPLETED]` (Hoàn thành trong mã nguồn/tài liệu) | `[IN_PROGRESS]` (Đang thực hiện tại thực địa) | `[BLOCKED_BY_GATE]` (Chờ điều kiện tiên quyết).

---

## Phase 1 — Foundation & Open-Core Architecture (Steps 1–5)
- [x] **Step 1: Open-Core Master Framework** `[COMPLETED]`  
  *Artifacts:* `src/saas/open-core-edition-manifest.ts`, `src/saas/saas-tier-policy.ts`, `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`.
- [x] **Step 2: 2026 Truthful Plan Refresh** `[COMPLETED]`  
  *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` (Số liệu Bộ NN&MT tháng 9/2026: 281 vựa, $658k SaaS ceiling vs $1M ARR).
- [x] **Step 3: Agentic OS & Human-in-the-Loop Governance** `[COMPLETED]`  
  *Artifacts:* `AGENTS.md`, `src/auth/rbac-policy.ts`, `src/verification/hitl-service.ts`.
- [x] **Step 4: Pilot Readiness & Audit Evidence Baseline (`GATE-01` to `GATE-05`)** `[COMPLETED]`  
  *Artifacts:* `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `src/export/field-auditor-cli.ts` (`GATE-01` DPA Consent, `GATE-02` OTP, `GATE-03` On-Prem Security, `GATE-04` Backup, `GATE-05` 5-Container Rehearsal KPI).
- [x] **Step 5: Conditional 5-Stage Sequencing Roadmap** `[COMPLETED]`  
  *Artifacts:* `docs/product-direction/PRODUCT-PRD-V2.md` (Stage 0 -> 4 roadmap).

---

## Phase 2 — Business Model & Unit Economics (Steps 6–7)
- [x] **Step 6: Economic Truth First & Multi-Revenue Stack** `[COMPLETED]`  
  *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `DURIOS-STRATEGY-V2.json`.
- [x] **Step 7: Tri-Tuple Buyer & Operator Personas** `[COMPLETED]`  
  *Artifacts:* `src/auth/rbac-policy.ts`, `test/tri-tuple-persona-rbac.test.ts`.

---

## Phase 3 — Brand, Open-Source Community & Content (Steps 8–12)
- [x] **Step 8: Category Positioning** `[COMPLETED]`  
  *Artifacts:* `docs/product-direction/PRODUCT-VISION-V2.md` ("Verified Durian Trade Network").
- [x] **Step 9: Bilingual Open-Source Documentation & MIT Verifier** `[COMPLETED]`  
  *Artifacts:* `README.md`, `src/export/standalone-manifest-verifier.ts`, `test/saas-cloud-connectors.test.ts`.
- [x] **Step 10: Federated Privacy-First Narrative** `[COMPLETED]`  
  *Artifacts:* `src/sharing/verified-org-profile.ts`, `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`.
- [x] **Step 11: Field-First Demonstration & Blind-Fault Testing** `[COMPLETED]`  
  *Artifacts:* `src/auth/pilot-rehearsal-seeder.ts`, `test/pilot-rehearsal-seeder.test.ts` (100% caught, mean < 5m).
- [x] **Step 12: Case Study Evidence Protocol** `[COMPLETED]`  
  *Artifacts:* `src/auth/pilot-kpi-extended-types.ts` (4 chỉ số giá trị thực địa từ container đầu tiên).

---

## Phase 4 — Revenue & Conversion Engine (Steps 13–15)
- [x] **Step 13: Community-to-Pro Upgrade Trigger** `[COMPLETED]`  
  *Artifacts:* `src/saas/open-core-edition-manifest.ts`, `src/saas/saas-tier-policy.ts`, `GET /api/v1/open-core/edition-manifest`, `test/open-core-saas-monetization.test.ts`.
- [x] **Step 14: Signed Workspace Portability Funnel** `[COMPLETED]`  
  *Artifacts:* `src/saas/workspace-portability-bundle.ts`, `src/server/open-core-portability-handler.ts`, `GET /api/v1/open-core/portability`, `POST /api/v1/open-core/portability/verify`, `test/open-core-workspace-portability.test.ts`.
- [ ] **Step 15: Dense Cluster GTM Playbook** `[BLOCKED_BY_GATE]`  
  *Trigger:* Cần hoàn tất nghiệm thu pilot 5 container tại Cai Lậy trước khi mở rộng ra 8 vựa + 3 exporter ĐBSCL.

---

## Phase 5 — Operations, Security & Readiness (Steps 16–21)
- [x] **Step 16: North Star & Funnel Metrics** `[COMPLETED]`  
  *Artifacts:* `Verified GMV`, `Revenue/Verified Container` trong `VALIDATION-AND-ECONOMICS-V2.md`.
- [x] **Step 17: Strategic & VC Narrative** `[COMPLETED]`  
  *Artifacts:* Thang 6 bậc Moat trong `PRODUCT-VISION-V2.md`.
- [x] **Step 18: Dual-License IP, Rate Limiting & Secret Hygiene** `[COMPLETED]`  
  *Artifacts:* `src/server/tenant-rate-limiter.ts`, `.github/workflows/ci.yml`, `gitleaks` clean.
- [x] **Step 19: On-Premise Resilience & Backup Runbook** `[COMPLETED]`  
  *Artifacts:* `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`.
- [x] **Step 20: Competitive & Regional Benchmarks** `[COMPLETED]`  
  *Artifacts:* `src/rules/asean-corridor-adapters.ts` (`VN_CN`, `MY_CN`, `TH_CN`, `PH_CN`).
- [x] **Step 21: Evidence-Backed Audit Data Room** `[COMPLETED]`  
  *Artifacts:* `src/storage/sqlite-audit-ledger.ts`, `src/export/pilot-dossier-pack-compiler.ts`.

---

## Phase 6 — Execution, Legal Guardrails & Governance (Steps 22–25)
- [x] **Step 22: Quarterly OKRs** `[COMPLETED]`  
  *Artifacts:* `.mekong/company.json` (OKRs Q4/2026 - 2028).
- [x] **Step 23: Dual-Lock Marketplace & Zero-Custody Governance** `[COMPLETED]`  
  *Artifacts:* `src/marketplace/marketplace-guard.ts`, `src/marketplace/escrow-state-machine.ts`.
- [x] **Step 24: Personal Data Protection & Statutory Disclaimers** `[COMPLETED]`  
  *Artifacts:* `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`, Luật 91/2025/QH15.
- [x] **Step 25: 9 Hard Kill Criteria & Incident Playbook** `[COMPLETED]`  
  *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` (9 Hard Kill Criteria table).
