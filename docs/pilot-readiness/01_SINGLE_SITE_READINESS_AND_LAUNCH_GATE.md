# Pilot Kín Một Vựa — Hồ Sơ Sẵn Sàng & Cổng Khai Trương (Single-Site Readiness & Launch Gate)

**Mã tài liệu:** `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`  
**Ngày phát hành:** 2026-10-14  
**Trạng thái:** **READY FOR SINGLE-SITE LAUNCH GATE REVIEW**  
**Tài liệu nguồn sự thật:** `docs/product-direction/PRODUCT-PRD-V1.md` & `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (**APPROVED — Founder approval, 2026-10-14**)

---

## 1. Mục Đích & Phạm Vi Đợt Pilot Đầu Tiên

Tài liệu này quy định các cổng kiểm soát bắt buộc để đưa DuriOS từ trạng thái **đạt nghiệm thu kỹ thuật Prompt 5A** (`5A-1` đến `5A-6`) sang **chạy Pilot thực tế tại đúng 01 vựa đóng gói (Single-Site On-Premise)**.

- **Nguyên tắc cốt lõi:** Chưa cài đặt lên máy chủ khách hàng và chưa nạp bất kỳ chứng từ khách hàng thật nào cho đến khi toàn bộ 5 cổng chặn ở Mục 3 được đánh dấu **PASS**.
- **Ranh giới thương mại:** Mọi mức phí nêu trong `PRODUCT-PRD-V1.md` (phí Pilot 5 container, phí thuê bao năm, phí thiết lập) tiếp tục là **giả thuyết kiểm chứng thương mại (pricing hypothesis)**, không được trình bày như bảng giá thương mại cố định.
- **Ranh giới pháp lý & sản phẩm:**
  - Không mở B2B Marketplace hay Escrow (thuộc Cổng 3 / Prompt 6A).
  - Không triển khai lên Cloud công cộng và không mở rộng sang vựa thứ hai trong đợt đầu.
  - Không đưa ra bất kỳ cam kết thông quan hải quan (GACC / kiểm dịch cửa khẩu) và không tự nhận cấp hay xác minh chứng nhận hữu cơ (`duriosRecordStatus = "EVIDENCE_STORED_NOT_CERTIFIED"`).

---

## 2. Phương Án Chọn Địa Điểm Vựa Đầu Tiên (Trình Founder Phê Duyệt)

> **Quy tắc kiểm soát:** Xác nhận khả năng tiếp cận thực tế tại 01 vựa trước, sau đó trình Founder chốt; tuyệt đối **không tự ý đặt lịch hẹn chính thức hay chi tiêu ngân sách** trước khi Founder ký duyệt.

| Tiêu chí đối chiếu | **Phương án 1 (Đề xuất ưu tiên): Cai Lậy, Tiền Giang** | **Phương án 2 (Dự phòng / Đợt sau): Krông Pắc, Đắk Lắk** |
|---|---|---|
| **Mùa vụ đóng hàng thực tế (Tháng 10 – Tháng 12)** | **Đang vào vụ nghịch miền Tây (tháng 10 đến tháng 3 năm sau):** Có luồng container đóng hàng thực tế hàng tuần để đo KPI 5 container liên tục. | **Đã cuối/hết chính vụ Tây Nguyên (tháng 8 đến tháng 10):** Sản lượng đóng mới giảm mạnh sau tháng 10, rủi ro chờ đợi lâu mới đủ 5 container. |
| **Khả năng hỗ trợ kỹ thuật On-Prem tại chỗ** | Cách TP.HCM $\sim 1.5\text{–}2$ giờ đường bộ; Founder có thể trực tiếp cài đặt máy chủ, cấu hình mạng riêng, kiểm tra sao lưu và xử lý sự cố trong ngày. | Khoảng cách xa (cần di chuyển hàng không + đường bộ); chi phí đi lại và thời gian phản ứng khi có sự cố mạng/phần cứng cao hơn nhiều. |
| **Mật độ vựa xuất khẩu** | Tập trung nhiều cơ sở đóng gói có mã số PHC xuất chính ngạch qua cửa khẩu Hữu Nghị / Tân Thanh. | Tập trung các vựa lớn mùa chính vụ nhưng hoạt động theo đợt thu hoạch tập trung. |

**Đề xuất trình Founder:** Ưu tiên xác nhận tiếp cận **01 vựa tại Cai Lậy (Tiền Giang)** cho đợt Pilot đầu tiên; giữ **Krông Pắc (Đắk Lắk)** làm phương án dự phòng hoặc mở rộng ở giai đoạn tiếp theo.

---

## 3. Năm Cổng Chặn Khai Trương Pilot 01 Vựa (Go-Live Blocking Gates)

Pilot chỉ được phép chuyển sang trạng thái **GO FOR LIVE CUSTOMER DATA** khi cả 5 cổng dưới đây đều hoàn tất:

| Mã cổng | Hạng mục kiểm soát | Tiêu chí đạt (Pass Criteria) | Hồ sơ / Bằng chứng nghiệm thu | Trạng thái hiện tại |
|---|---|---|---|---|
| **GATE-01** | **Tiếp cận Vựa & Chấp thuận Dữ liệu** | 01 vựa xác nhận tiếp cận; Founder phê duyệt chọn site; chủ vựa ký Biểu mẫu Chấp thuận Sử dụng Dữ liệu trước khi nạp chứng từ thật. | `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` | **PENDING SITE & FOUNDER SIGN-OFF** |
| **GATE-02** | **Kênh OTP Thật (Zalo ZNS / SMS)** | Founder chọn nhà cung cấp từ báo cáo đánh giá; cấu hình `DURIOS_OTP_*` và gửi/nhận thành công OTP thật trên môi trường staging cho tài khoản thật. | `docs/pilot-readiness/02_OTP_PROVIDER_EVALUATION.md` + `src/auth/otp-provider.ts` (`HttpGatewayOtpProvider`) | **ADAPTER READY — PENDING PROVIDER CREDENTIALS** |
| **GATE-03** | **Bảo mật On-Prem, TLS & Giới hạn Mạng** | Ứng dụng bind `127.0.0.1:3000`; truy cập qua Reverse Proxy HTTPS (`NODE_ENV=production`); mạng riêng giới hạn; ổ đĩa và bản sao lưu được mã hóa; secrets lưu quyền `0600`. | `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` | **RUNBOOK & CONFIG VERIFIED** |
| **GATE-04** | **Chứng minh Sao lưu & Khôi phục (Backup/Restore Drill)** | Chạy `backup-site`, `verify-backup` và `restore-site` thành công trên môi trường staging; `verifyIntegrity() === true` và 100% blob khớp SHA-256 sau khôi phục. | `src/auth/site-backup-manager.ts` + `test/process-restart-persistence.test.ts` | **VERIFIED IN STAGING TESTS** |
| **GATE-05** | **Quy trình Đo KPI & Kiểm thử Staging Toàn trình** | Chốt quy trình bấm giờ (`< 5 phút/container` đạt, `< 3 phút/container` mục tiêu); kiểm thử staging qua đủ 3 phương thức đăng nhập, bắt 100% lỗi Container/Seal, 0 lỗi P0, `bun run typecheck` và `bun test` xanh 100%. | `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` + `bun test` | **VERIFIED IN STAGING TESTS** |
