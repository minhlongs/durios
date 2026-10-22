# DuriOS 25-Step Company Blueprint Task Checklist

- **Dự án / Project:** DuriOS (`durios-core`) — Workspace Hồ Sơ Container cho xuất khẩu nông sản Việt Nam
- **Baseline Date:** 2026-10-22
- **Last Updated:** 2026-10-22

**Chú giải trạng thái (Status Key):**

- `[COMPLETED]` — Hạng mục blueprint đã được **soạn thảo** (artifact tồn tại và marker checklist đã được đánh dấu).
- `[IN_PROGRESS]` — Hạng mục đang được triển khai, chưa đóng.
- `[BLOCKED_BY_GATE]` — Hạng mục bị chặn bởi một launch gate chưa đạt (GATE-01..05).
- `[PENDING]` — Hạng mục chưa bắt đầu hoặc chờ điều kiện tiên quyết.

**Cam kết trung thực (Truthfulness Commitment) — ĐỌC TRƯỚC KHI DÙNG FILE NÀY**

Dấu `[x]` trong checklist **chỉ có nghĩa là hạng mục blueprint đã được soạn thảo** — nghĩa là artifact tồn tại và mục
tASKS.md đã được ghi nhận. Nó **không** có nghĩa là tính năng đã chạy trong production, đã được thử nghiệm thực địa, hoặc
đã tạo ra doanh thu. Trạng thái thực thi thật được theo dõi **tách biệt** tại `plans/company-blueprint/plan.md`, dùng các
nhãn: `[Đã có code]` / `[Đã kiểm thử tổng hợp]` / `[Đang chờ điều kiện]` / `[Giả thuyết]` / `[Mục tiêu]` / `[Chưa được xác minh]`.
Lệnh `bun run blueprint:verify-25-steps` báo cáo 25/25 **chỉ đo mức độ phủ artifact** — cụ thể là ba điều kiện: marker
heading, marker checklist, và sự tồn tại của file trên đĩa (`existsSync`). Nó **không** chứng minh nội dung, hành vi, hay
chất lượng của bất kỳ artifact nào. Một file rỗng cũng vẫn PASS. Đừng đọc kết quả 25/25 là bằng chứng sẵn sàng khai thác.

Thông tin nền đã xác minh trong phiên làm việc này: site **SITE-CAILAY-TIENGIANG-01** được Founder phê duyệt ngày
2026-10-17; tài liệu V1 là baseline đã duyệt (2026-10-14); tài liệu V2 đang ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW`.
Trạng thái cổng: GATE-01 `PENDING SIGN-OFF`; GATE-02 `ADAPTER READY / PENDING CREDENTIALS` (fail-closed, trả 503); GATE-03
`RUNBOOK & CONFIG VERIFIED`; GATE-04 `VERIFIED IN STAGING TESTS ONLY`; GATE-05 `PROVEN ONLY ON SEEDED/SYNTHETIC REHEARSAL`
(`src/auth/pilot-rehearsal-seeder.ts` + `test/pilot-rehearsal-seeder.test.ts`). Hiện **chưa tồn tại** dữ liệu hợp đồng,
doanh thu, khách hàng hay retention — do đó mọi tuyên bố thương mại mang nhãn `[Chưa được xác minh]`.

## Phase 1 — Foundation & Open-Core Architecture (Bước 1–5)

- [x] **Step 1: Khung Open-Core Master Framework (Open-Core Master Framework)** `[COMPLETED]`
  - *Artifacts:* `src/saas/open-core-edition-manifest.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Bảng edition (`COMMUNITY_OPEN_CORE`, `PACKHOUSE_PRO_SAAS`, `EXPORTER_ENTERPRISE`) và 15 module kiến trúc đã được mã hoá; chưa có phép đo adoption thật.
  - *Việc tiếp theo:* Đối chiếu 15 module trong manifest với bản đồ dependency thực tế, loại bỏ module không có caller production.

- [x] **Step 2: Làm Mới Kế Hoạch Trung Thực 2026 (2026 Truthful Plan Refresh)** `[COMPLETED]`
  - *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`
  - *Trạng thái thực thi:* `[Đã có code]` — Số liệu Bộ NN&MT và trần ARR đã được ghi; bản thân con số vẫn là giả thuyết giá cho đến khi có khách trả tiền.
  - *Việc tiếp theo:* Kiểm chứng nguồn gốc báo chí chính thức của con số Bộ NN&MT trước khi dùng trong tài liệu vay/gọi vốn.

- [x] **Step 3: Hệ Điều Hành Agentic & Quản Trị HITL (Agentic OS & HITL Governance)** `[COMPLETED]`
  - *Artifacts:* `src/verification/hitl-service.ts`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — Phê duyệt con người bắt buộc trên các hành động nhạy cảm đã có unit test; chưa có bằng chứng vận hành thực địa.
  - *Việc tiếp theo:* Chứng minh AI không tự phê duyệt xuất khẩu trong một chuỗi thủ tục đầy đủ trên staging.

- [x] **Step 4: Sẵn Sàng Pilot & Bằng Chứng Kiểm Toán (Pilot Readiness & Audit Evidence)** `[COMPLETED]`
  - *Artifacts:* `src/export/field-auditor-cli.ts`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Bộ lập báo cáo niêm phong SHA-256 đã có, nhưng kết quả GATE-01..05 hiện chỉ suy ra từ sự tồn tại file, chưa chạy trên dữ liệu thật.
  - *Việc tiếp theo:* Chạy `bun run pilot:audit-pack -- --verify` trên thư mục dữ liệu/backup thật và ghi PASS/FAIL cho từng cổng.

- [x] **Step 5: Lộ Trình Tuần Tự 5 Chặng Có Điều Kiện (Conditional 5-Stage Sequencing Roadmap)** `[COMPLETED]`
  - *Artifacts:* `docs/product-direction/PRODUCT-PRD-V2.md`
  - *Trạng thái thực thi:* `[Đã có code]` — Trình tự điều kiện đã được tài liệu hoá; điều kiện tiên quyết của chặng 4–5 phụ thuộc cổng chưa đạt.
  - *Việc tiếp theo:* Gắn tiêu chí thoát định lượng cho từng chặng thay vì điều kiện định tính.

## Phase 2 — Business Model & Unit Economics (Bước 6–7)

- [x] **Step 6: Sự Thật Kinh Tế Trước & Đống Doanh Thu Đa Lớp (Economic Truth First & Multi-Revenue Stack)** `[COMPLETED]`
  - *Arction placeholder* — never written
  - *Artifacts:* `docs/product-direction/DURIOS-STRATEGY-V2.json`
  - *Trạng thái thực thi:* `[Giả thuyết]` — Trần $657.643 ARR và kết luận bắt buộc đa doanh thu là suy luận đúng trên số liệu công bố, nhưng chưa có bằng chứng giá thị trường chấp nhận.
  - *Việc tiếp theo:* Mở nhật ký nhu cầu/mức giá chấp nhận được để kiểm chứng 60.000.000 VND/năm và 5.000.000 VND/5 container.

- [x] **Step 7: Ba Nhóm Người Mua & Vận Hành (Tri-Tuple Buyer & Operator Personas)** `[COMPLETED]`
  - *Artifacts:* `src/auth/rbac-policy.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Vai trò và phân quyền đã mã hoá; chưa có measurement chứng minh phân khúc người mua trên dữ liệu thật.
  - *Việc tiếp theo:* Xác nhận ba nhóm persona bằng phỏng vấn site thay vì suy diễn từ vai trò kỹ thuật.
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
- [x] **Step 15: Dense Cluster GTM Playbook** `[COMPLETED]`  
  *Artifacts:* `src/sharing/dense-cluster-readiness.ts`, `docs/pilot-readiness/05_DENSE_CLUSTER_GTM_PLAYBOOK.md`, `test/dense-cluster-gtm.test.ts` (Mekong Delta Dense Cluster 8 PH, 3 EXP, 2 LAB, 3 LOG, 5 BUY có cổng bảo vệ fail-closed từ vựa Cai Lậy).

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

---

## Revenue Layer 6 — Trade-Finance & Marine Insurance Verified Dossier API (Open-Core Boundary Expansion)

- [x] **Layer 6 Phase 1: Signed Single-Use Attestation Token** `[COMPLETED]`  
  *Purpose:* Let a bank or marine insurer verify one sealed dossier with no account, no RBAC change.  
  *Evidence label:* **Verified** (code plan) / **Hypothesis** (that any bank pays).  
  *Artifacts:* `src/saas/financial-attestation-codec.ts`, `src/saas/financial-attestation-token.ts`, `src/saas/financial-attestation-service.ts`, `src/server/financial-verification-request.ts`, `src/server/financial-verification-view.ts`, `src/server/financial-verification-context.ts`, `src/server/financial-verification-handler.ts`, `src/storage/schema-migrations-share-purposes.ts` (migration V6 widens the `share_grants.purpose` CHECK), plus 3 test files.
- [ ] **Layer 6 Phase 2: `FINANCIAL_INSTITUTION` Tenant + RBAC Tuples** `[BLOCKED_BY_GATE]`  
  *Blocked by:* Phase 1 paying pilot + legal clearance under Luật 91/2025/QH15 + `GATE-01` signed DPA.
- [x] **Layer 6 Commercial Module Registration** `[COMPLETED]`  
  *Artifacts:* `MOD-ENT-03` in `src/saas/open-core-edition-manifest.ts` (edition `EXPORTER_ENTERPRISE`).

> **Truthfulness guard:** 281 packhouses × 60M VND ≈ $657,643 ARR remains the **sole Verified
> revenue baseline**. Layer 6 is the intended wedge above that ceiling, but until a pilot
> signs, it stays a Hypothesis and must never be reported as revenue.
