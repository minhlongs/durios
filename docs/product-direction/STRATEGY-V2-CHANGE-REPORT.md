# DuriOS Báo Cáo Thay Đổi Chiến Lược V2 (Strategy v2 Change Report)

**Mã tài liệu:** `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md`  
**Ngày lập:** 2026-10-17  
**Tác giả:** Principal Product Architect & Engineering Lead  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW** (Đệ trình Founder xem xét)

---

## 1. Nguồn Dữ Liệu Đã Đọc & Đối Chiếu (Source Documents Reviewed)

1. `docs/product-direction/PRODUCT-PRD-V1.md` (APPROVED — Founder approval, 2026-10-14): Baseline sản phẩm v1.0.
2. `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (APPROVED — Founder approval, 2026-10-14): Baseline kiến trúc v1.0.
3. `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`: Tiêu chuẩn 5 cổng khai trương Single-Site.
4. `docs/pilot-readiness/02_OTP_PROVIDER_EVALUATION.md`: Đánh giá kỹ thuật các nhà mạng OTP (Zalo ZNS / SMS).
5. `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`: Quy trình vận hành và an ninh máy chủ tại chỗ.
6. `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`: Giao thức đo lường KPI và mẫu văn bản DPA.
7. `AGENTS.md` & `README.md`: Quy ước mã nguồn, ranh giới kiểm thử và hướng dẫn vận hành.

---

## 2. Các Điểm Xung Đột Phát Hiện & Cách Xử Lý (Conflicts Reconciled)

| Điểm mâu thuẫn | Nguồn phát hiện | Xử lý & Khẳng định trong V2 |
|---|---|---|
| **Chỉ số thời gian đối soát: Mean vs Median** | Một số tài liệu khảo sát cũ dùng từ "median", trong khi Hợp đồng cốt lõi và brief mới nhất yêu cầu **"Thời gian đối soát TRUNG BÌNH dưới 5 phút"**. | Khẳng định dứt khoát trong V2: **Sử dụng Trung bình số học (Arithmetic Mean) làm KPI chính thức** để không che giấu các ca xử lý chậm; Median/Max chỉ là mô tả bổ sung. |
| **Tầm nhìn "Grab" vs Ranh giới Stage 0** | Chỉ đạo Founder ví "DuriOS là Grab ngành sầu riêng", dễ dẫn đến hiểu nhầm là phải lập tức xây dựng marketplace và super-app. | Phân định rõ ràng: "Grab" là ẩn dụ về **mạng lưới điều phối đa bên** trong dài hạn; hiện trạng kỹ thuật giữ nguyên **Stage Zero (Phần mềm hồ sơ vựa tại chỗ ở Cai Lậy)**. |
| **Tính doanh thu một lần vào ARR** | Một số ước tính trước đây gộp cả phí thiết lập (Setup Fee: 10M VND) và phí pilot (5M VND) vào mục tiêu ARR. | Chuẩn hóa mô hình tài chính: **Chỉ có phí thuê bao hàng năm (Subscription: 60M VND/vựa) mới được tính vào ARR**. Phí thiết lập và phí pilot tính vào doanh thu 1 lần. |

---

## 3. Danh Sách Các Tệp Đã Tạo Mới & Chỉnh Sửa

### Các tệp tạo mới:
1. `docs/product-direction/PRODUCT-VISION-V2.md`: Tầm nhìn, định vị dài hạn, phân định 5 cấp độ xác thực, ICP hiện tại và bản đồ hệ sinh thái tương lai.
2. `docs/product-direction/PRODUCT-PRD-V2.md`: Yêu cầu sản phẩm qua 5 giai đoạn (Stage 0 $\rightarrow$ Stage 4), ranh giới thẩm quyền phê duyệt.
3. `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`: Kiến trúc "Local Core + Opt-in Network", mô hình miền mở rộng, ADR 003, phân định tamper-evident và namespace cổng mở rộng `PLATFORM-*`.
4. `docs/product-direction/DURIOS-STRATEGY-V2.json`: Manifest máy đọc được chứa toàn bộ cấu trúc chiến lược và trạng thái rào chắn.
5. `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`: Giao thức pilot (mean $<5$ phút), 2 kịch bản blind test, mô hình toán kinh tế đảo chiều 424 vựa đạt $1M ARR, bottom-up TAM/SAM/SOM và kill criteria.
6. `docs/product-direction/STRATEGY-V2-BACKLOG.md`: Phân loại công việc theo `NOW`, `NEXT`, `LATER`, `NOT_AUTHORIZED`.
7. `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md`: Bản báo cáo này.

### Các tệp cập nhật:
1. `README.md`: Bổ sung phần điều hướng chỉ định rõ bản thiết kế V2 đang ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW` và duy trì Stage 0 làm baseline hoạt động.
2. `AGENTS.md`: Cập nhật hướng dẫn cho các tác nhân AI/kỹ sư tiếp theo về ranh giới V2 và nguyên tắc cấm tự động hóa vượt quyền.

---

## 3.5. Các Điểm Nâng Cấp Bổ Sung Theo Luận Điểm "Verified Durian Trade Network"

1. **Sự thật kinh tế (Economic Truth First):** Bổ sung dữ liệu chính thức Bộ NN&MT tháng 9/2026 (281 cơ sở đóng gói đang hoạt động, 1.599 mã PUC). Tính toán trần doanh thu SaaS Việt Nam tối đa là $657.643 ARR (281 vựa $\times$ 60M VND), khẳng định để đạt $1M ARR bắt buộc phải là Regional ASEAN Expansion và Multi-Revenue Stack (Core + Verification Modules + Network Fee + Transaction Orchestration).
2. **11 Thực thể Ontology Lõi & ASEAN Corridors:** Định nghĩa mô hình dữ liệu dùng chung (`Organization`, `ProductionSource`, `Lot`, `TestEvidence`, `Document`, `Container`, `Seal`, `CustodyEvent`, `Exception`, `Trade`, `Permission`) và triển khai `src/rules/asean-corridor-adapters.ts` (`VN_CN`, `MY_CN`, `TH_CN`, `PH_CN`).
3. **Federated Privacy-First Trust & Verified Profile:** Triển khai `src/sharing/verified-org-profile.ts` cho phép tổ chức chứng minh năng lực thực tế (`verifiedShipmentsCount`, `medianReadinessMinutes`, `documentReliabilityScore`) mà không để lộ danh tính nhà vườn, giá mua hay margin.
4. **4 Chỉ số đo lường giá trị thực tế từ container đầu tiên:** Bổ sung `src/auth/pilot-kpi-extended-types.ts` để đo lường phút tiết kiệm, điểm chạm con người, ngoại lệ phát hiện sớm và thiệt hại tài chính ngăn chặn được.

---

## 4. Kết Quả Kiểm Chứng (Verification Results)

- **JSON Validation:** `docs/product-direction/DURIOS-STRATEGY-V2.json` parse thành công 100%, không lỗi cú pháp.
- **Typecheck:** `bun run typecheck` đạt 0 lỗi.
- **Test Suite:** Chạy toàn bộ 121 bài kiểm thử (`3,699` expect assertions across 28 files) đạt 100% xanh.
- **Line Count Ceiling:** Tất cả các tệp `.ts` trong `src/` và `test/` duy trì strictly $\le 179$ LOC.
- **Kiểu dữ liệu:** 0 lần xuất hiện `: any`, `as any`, `<any>`.
- **Rà soát bảo mật:** Không chứa mã bí mật, database thật, hay thông tin nhạy cảm. Gitleaks 0 leaks.

---

## 5. Giới Hạn Hiện Tại Của Hệ Thống

1. **Khách hàng thật:** Chưa có vựa nào được nạp dữ liệu thật; hệ thống hoàn toàn chạy trên bộ dữ liệu tổng hợp (synthetic dataset).
2. **Hạ tầng tại vựa:** Chưa tiến hành lắp đặt phần cứng hay cấu hình HTTPS thực tế tại Cai Lậy; đang chờ Founder ký duyệt địa điểm chính thức.
3. **Cổng OTP:** Đang dùng bộ lưu trữ OTP giả lập nội bộ; chưa ký hợp đồng thương mại với đơn vị viễn thông (Zalo ZNS / SMS).

---

## 6. Ba Quyết Định Cụ Thể Cần Founder Phê Duyệt Để Mở Khóa Pilot

1. **Quyết định 1 (Phê duyệt Địa điểm):** Ký duyệt lựa chọn chính thức Cơ sở đóng gói tại Cai Lậy (Phương án 1) hoặc Cái Bè (Phương án 2) để đội ngũ tiến hành liên hệ khảo sát hạ tầng mạng và bàn cân.
2. **Quyết định 2 (Phê duyệt Bộ Tài liệu V2):** Phê duyệt bản Dự thảo Chiến lược V2 (`PRODUCT-VISION-V2.md`, `PRODUCT-PRD-V2.md`, `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`) để chính thức chuyển trạng thái từ `DRAFT_FOR_FOUNDER_REVIEW` sang `APPROVED_BASELINE`.
3. **Quyết định 3 (Phê duyệt Kế hoạch Ngân sách Staging OTP & Thiết bị):** Phê duyệt hạn mức ngân sách nhỏ (ước tính 3–5 triệu VND) để đăng ký tài khoản doanh nghiệp Zalo ZNS và mua sắm thiết bị Mini PC chạy thử nghiệm tại thực địa.
