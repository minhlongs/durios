# DuriOS Executive Decision Memo: Deep Investigation & Capital Gate
## Supreme Command #09: Deliverables 9 & 10 — Final Audit Decision Memo

> **GHI CHÚ ĐIỀU CHỈNH HIỆU LỰC (SUPERSESSION & GOVERNANCE ALIGNMENT NOTE — 2026-10-14):**  
> Tài liệu này được giữ nguyên làm **bằng chứng kiểm toán lịch sử tại ngày 2026-10-09**. Kể từ ngày **2026-10-14**, định hướng sản phẩm hiện hành là `docs/product-direction/PRODUCT-PRD-V1.md` và `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (**APPROVED — Founder approval, 2026-10-14**). Các lỗi chặn kỹ thuật nêu tại Mục 1.D (`VULN-01` Actor Spoofing, `VULN-02` Cross-Tenant Leak, bền vững SQLite, che dữ liệu thương mại) đã được khắc phục và nghiệm thu trong Prompt 5A (`5A-1` → `5A-6`). Quyết định triển khai **Pilot kín tại 01 vựa (on-prem)** hiện được điều phối bởi `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`.

**To:** Founder & Investment Gate Review  
**From:** Adversarial Red Team / Chief Audit Officer  
**Date:** 2026-10-09  
**Inspected HEAD SHA:** `f621b4733b809d3f871340383031e060ea8f7ae9`  
**Git Branch:** `main`  
**Test Suite Status:** 35 passed, 0 failed, 183 expect() assertions across 8 test suites [402ms]  
**TypeScript Status:** 0 type errors (`bun x tsc --noEmit` exit 0)  
**Tranche 1 Capital Authorization:** `7,500,000 VND` maximum (Expended: `0 VND` - REPORTED ONLY)  

---

## 1. Executive Answers to Mandatory Audit Inquiries (A through H)

### A. Is the repository internally consistent?
**YES (VERIFIED).**  
Kiến trúc mã nguồn hoàn toàn đồng nhất và nhất quán với mô hình Container Dossier Workspace cục bộ:
- Không có sự phân mảnh về nguồn chân lý (Source of Truth).
- Trạng thái vòng đời (`DossierLifecycleState`) được kiểm soát chặt chẽ bởi state machine hướng sự kiện (`src/domain/dossier-state-machine.ts`).
- Dữ liệu được lưu trữ đồng bộ qua SQLite (`bun:sqlite`), lưu trữ tệp tin nhị phân trên đĩa an toàn (`FileStorageService`), và chuỗi hash bất biến ghi nhận mọi thao tác (`SqliteAuditLedger`).

### B. Is the prototype suitable for local controlled discovery?
**YES (VERIFIED).**  
Phần mềm hiện tại chạy ổn định 100% trên máy tính xách tay cá nhân của điều tra viên (Local-first, air-gapped, zero cloud dependencies). Có thể dùng để:
- Trực tiếp mô phỏng quy trình kiểm tra chứng từ (HITL UI) cho thư ký xưởng xem.
- Nhập thử các bản scan chứng từ mẫu ẩn danh để đo thời gian đối soát.
- Minh họa việc phát hiện sai lệch số seal và cảnh báo chỉ số Cadmium trong môi trường cô lập.

### C. Is any customer-facing use currently acceptable?
**NO (BLOCKED).**  
Tuyệt đối KHÔNG triển khai đưa vào sử dụng thực tế cho khách hàng (Customer-facing live use) tại thời điểm này:
- Chưa có chữ ký pháp lý xác thực nguồn gốc chứng từ.
- Chưa có hợp đồng dịch vụ bảo hiểm trách nhiệm pháp lý nếu xảy ra sự cố thông quan.
- Khách hàng không được dùng manifest xuất ra từ bản demo này để nộp cho cơ quan kiểm dịch/hải quan.

### D. What prevents a controlled multi-user pilot?
**FOUR CRITICAL DEFECTS PREVENT A MULTI-USER PILOT (BLOCKED):**
1. **P0 Actor Spoofing (VULN-01):** Actor được resolve qua header `x-actor-role` hoặc URL query `?role=`, cho phép bất kỳ ai tự cấp quyền `MANAGER` để ký duyệt dossier.
2. **P0 Cross-Tenant Leak (VULN-02):** Chưa có mã hóa session token giữa các vựa khác nhau nếu triển khai trên cùng một máy chủ.
3. **P1 Network Exposure (VULN-06):** Máy chủ HTTP chưa có TLS/HTTPS và xác thực mTLS trên mạng LAN/Wi-Fi xưởng.
4. **P1 Audit History Rewrite (VULN-04):** Chuỗi hash chỉ phát hiện can thiệp (Tamper Detection), chưa có cơ chế kháng can thiệp (Tamper Resistance) chống lại việc sửa trực tiếp file SQLite.

### E. Is the statutory regulatory engine ready to make legal claims?
**NO (CORRECTLY QUARANTINED).**  
Quy tắc `RUL-GB2762-CD` đã được vô hiệu hóa (`isActive: false`, `isStatutoryVerified: false`) do thiếu văn bản công báo pháp lý gốc (PRC NHC/SAMR GB 2762-2022). Chỉ có quy tắc khuyến nghị nội bộ `RUL-INT-CD-WARN` (`0.040 mg/kg`) hoạt động dưới dạng cảnh báo phi pháp lý (Advisory Warning). Phần mềm không được phép tuyên bố bảo đảm tuân thủ pháp luật.

### F. Is the proposed field discovery worth the next VND spent?
**YES (HIGH RETURN ON EVIDENCE).**  
Ngân sách `7,500,000 VND` cho 5 ngày khảo sát thực tế tại Tiền Giang và Đắk Lắk là khoản đầu tư có giá trị tối thượng để:
- Thoát khỏi bẫy "nghiên cứu bàn giấy" (Desk research hallucination).
- Xác minh xem chủ vựa có thực sự chịu chi trả tiền cho phần mềm hay phụ thuộc 100% vào dịch vụ "bao luật" cửa khẩu.
- Chặn đứng nguy cơ lãng phí hàng trăm triệu đồng viết code cho một nhu cầu không có thật.

### G. What exact evidence would justify the next investment (Tranche 2: 12.5M VND)?
**TOÀN BỘ 5 BẰNG CHỨNG BẮT BUỘC ĐÃ ĐƯỢC CHUẨN HÓA TẠI CANONICAL GATE:**
1. **Access Proof:** Ít nhất 03 nhà đóng gói (>3 cont/tuần) cho phép trực tiếp quan sát toàn bộ quy trình đóng cont và đối chiếu chứng từ.
2. **Commercial Skin-in-the-game:** Ít nhất 01 thỏa thuận nguyên tắc (LOI) pilot 5 container có điều kiện đặt cọc `2,500,000 - 5,000,000 VND` (hoàn tiền 100% nếu không phát hiện được lỗi chứng từ).
3. **Real Artifacts:** Thu thập tối thiểu 02 bộ chứng từ xuất khẩu thực tế ẩn danh hoàn chỉnh (Lab, Packing list, Phyto nháp, Tờ khai).
4. **HITL Fit:** Thư ký xưởng xác nhận giao diện đối soát <3 phút/tài liệu phù hợp với nhịp độ vận hành.
5. **Capital Discipline:** Chi phí khảo sát Tranche 1 không vượt quá `7,500,000 VND` và có đầy đủ hóa đơn/chứng từ hợp lệ.

### H. What should the founder do next, in order?
**THE 5-STEP ACTION PLAN FOR THE FOUNDER:**
1. **Bước 1 (Freeze Code):** Đóng băng toàn bộ việc viết code mới trong repository. Không thêm tính năng, không refactor.
2. **Bước 2 (Prepare Instruments):** In toàn bộ tài liệu khảo sát song ngữ trong thư mục `docs/field-discovery/` (01 đến 06 và 09).
3. **Bước 3 (Field Execution):** Thực hiện đúng Lộ trình 5 Ngày (`09_FIVE_DAY_EXECUTION_PROTOCOL.md`) tại Cai Lậy (Tiền Giang) và Krông Pắc (Đắk Lắk) với ngân sách tối đa `7,500,000 VND`.
4. **Bước 4 (Evidence Registration):** Điền trung thực mọi tiếp xúc vào `06_FIELD_EVIDENCE_REGISTER.md` và lưu trữ hóa đơn chi phí hợp lệ.
5. **Bước 5 (Gate Review):** Họp Hội đồng Thẩm định để đối chiếu Báo cáo `07_FIELD_DISCOVERY_REPORT_TEMPLATE.md` với Bộ Tiêu chí `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` trước khi quyết định giải ngân Tranche 2.

---

## 2. Final Capital & Venture Decision

```
================================================================================
FINAL VERDICT: CONDITIONAL GO (Khảo Sát Thực Địa 5 Ngày Được Phê Duyệt)
================================================================================
- Tranche 1 Authorization: VND 7,500,000 (Maximum Spending Ceiling)
- Allowed Activity: Field Discovery ONLY in Tien Giang & Dak Lak
- Prohibited Activity: Production feature code development, multi-tenant deployment,
                       cloud hosting, marketing spend, fixed asset purchase.
- Next Review Gate: Post-Discovery Synthesis Audit (End of Day 5 Field Execution).
================================================================================
```
