# DuriOS Repository Freeze & Baseline Preservation Report
## Supreme Command #10: Formal Repository Freeze & Audit Gate

> **GHI CHÚ ĐIỀU CHỈNH HIỆU LỰC (SUPERSESSION & GOVERNANCE ALIGNMENT NOTE — 2026-10-14):**  
> Tài liệu này được bảo toàn nguyên vẹn làm **hồ sơ lịch sử kiểm toán tại thời điểm 2026-10-09**. Kể từ ngày **2026-10-14**, theo quyết định phê duyệt chính thức của Founder tại `docs/product-direction/PRODUCT-PRD-V1.md` và `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md`:  
> 1. Chỉ dẫn **"DEVELOPMENT FROZEN / cấm sửa mã nguồn"** và lệnh chặn Pilot do `VULN-01` (Actor Spoofing) / `VULN-02` (Cross-Tenant Isolation) trong tài liệu này **không còn hiệu lực thi hành**, vì các hạng mục bảo mật và lưu trữ của Prompt 5A (`5A-1` đến `5A-6`) đã được triển khai và đạt nghiệm thu kỹ thuật.  
> 2. Việc chuẩn bị và khai trương **Pilot kín thực tế tại 01 vựa (on-prem)** hiện tuân theo định hướng PRD/Kiến trúc ngày `2026-10-14` và bộ cổng sẵn sàng tại `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`.

**Date:** 2026-10-09  
**Git Branch:** `main`  
**Current HEAD SHA:** `f621b4733b809d3f871340383031e060ea8f7ae9`  
**Status Confirmation:** HEAD SHA strictly matches `f621b4733b809d3f871340383031e060ea8f7ae9`.  
**Operating State:** **DEVELOPMENT FROZEN** *(Historical state as of 2026-10-09; superseded on 2026-10-14)*  

---

## 1. Working Tree Preservation State (Dirty Tree Preserved)

The working tree has been inspected and **preserved without modification, reset, rebase, stash, or clean**.

### Modified Tracked Files (Preserved):
1. `src/rules/evaluator-helpers.ts` — Disclaimer wording separating advisory warnings from statutory limits.
2. `src/rules/rule-catalog.ts` — Statutory quarantine flags (`isStatutoryVerified: false`, `RUL-GB2762-CD` disabled).
3. `src/server/server.ts` — Environment port configuration for isolated local testing.
4. `src/workspace/container-dossier-workspace.ts` — Compensating disk rollback on DB write failure; validation invalidation on field edits.

### Untracked Files and Directories (Preserved):
1. `docs/` — Contains complete audit package (`docs/audits/`) and field discovery instruments (`docs/field-discovery/`).
2. `test/adversarial-verification.test.ts` — Adversarial test suite (compensating rollback, field mutation invalidation, audit integrity, safe path jail).
3. `test/process-restart-persistence.test.ts` — Multi-process restart persistence integration tests (`Bun.spawn`, `SIGTERM`).

---

## 2. Document Availability & Verification Checklist

The exact locations and availability of all critical governance and field discovery documents have been physically verified:

| Required Document | Path in Repository | Size (Bytes) | Verification Status |
|---|---|---|---|
| **Executive Decision Memo** | `docs/audits/COMMAND-09-EXECUTIVE-DECISION-MEMO.md` | 7,279 | **VERIFIED AVAILABLE** |
| **Security Threat Model** | `docs/audits/COMMAND-09-SECURITY-THREAT-MODEL.md` | 5,440 | **VERIFIED AVAILABLE** |
| **Regulatory Safety Report** | `docs/audits/COMMAND-09-REGULATORY-SAFETY.md` | 4,442 | **VERIFIED AVAILABLE** |
| **Tranche 1 Capital Control** | `docs/audits/COMMAND-09-TRANCHE-1-CAPITAL-CONTROL.md` | 4,723 | **VERIFIED AVAILABLE** |
| **5-Day Execution Protocol** | `docs/field-discovery/09_FIVE_DAY_EXECUTION_PROTOCOL.md` | 6,963 | **VERIFIED AVAILABLE** |
| **Explicit GO/HOLD/STOP Criteria** | `docs/field-discovery/08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` | 5,825 | **VERIFIED AVAILABLE** |

---

## 3. Unresolved Technical & Security Blockers (Pilot / Production)

The following blockers have been documented and permanently frozen until field evidence justifies resolving them:

1. **VULN-01 (Actor Spoofing - P0):** Unauthenticated actor resolution via `x-actor-role` / `?role=` header/query parameter. Strictly blocks multi-user or customer-facing deployment.
2. **VULN-02 (Cross-Tenant Boundary - P0):** Absence of cryptographic session authentication between tenant partitions in multi-tenant contexts.
3. **VULN-04 (Audit Hash Rewriting - P1):** Local SQLite audit hash chain provides tamper detection, but not tamper resistance against actors with direct OS file access.
4. **VULN-06 (Network Ingress - P1):** Unauthenticated local HTTP endpoints; requires localhost-only binding (`127.0.0.1`) during offline field discovery.
5. **RUL-GB2762-CD (Statutory Quarantine):** Chinese Cadmium statutory rule remains disabled until primary gazette documents are obtained.

---

## 4. Final Operational Governance Status

```
================================================================================
FINAL CLASSIFICATION STATUS:
================================================================================
1. REPOSITORY FROZEN:
   - Source code modifications: FROZEN (No new code, no refactoring, no package additions)
   - Runtime dependencies: FROZEN (0 external npm dependencies, native Bun only)
   - Test suites: FROZEN (35 tests, 183 assertions verified passing in baseline)

2. FIELD DISCOVERY AUTHORIZED:
   - Territory: Cai Lậy (Tiền Giang) & Krông Pắc (Đắk Lắk)
   - Scope: 5-Day Protocol (09_FIVE_DAY_EXECUTION_PROTOCOL.md)
   - Capital Ceiling: VND 7,500,000 (Tranche 1 Capped)
   - Purpose: Real workflow observation, WTP testing, and collecting 2+ real anonymized dossiers.

3. PRODUCTION NOT AUTHORIZED:
   - Multi-user pilot: BLOCKED (Pending authentication & tenant isolation)
   - Cloud deployment: BLOCKED (Air-gapped local execution only)
   - Commercial sales: BLOCKED (No software sales before passing Canonical Gate)
================================================================================
```
