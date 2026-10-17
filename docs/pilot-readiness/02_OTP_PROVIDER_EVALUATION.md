# Báo Cáo Đánh Giá Nhà Cung Cấp OTP (Zalo ZNS / SMS) & Hướng Dẫn Tích Hợp

**Mã tài liệu:** `docs/pilot-readiness/02_OTP_PROVIDER_EVALUATION.md`  
**Ngày phát hành:** 2026-10-14  
**Trạng thái:** **TRÌNH FOUNDER CHỌN NHÀ CUNG CẤP TRƯỚC KHI BẬT OTP THẬT**  
**Mã nguồn liên quan:** `src/auth/otp-provider.ts`, `src/auth/sqlite-auth-service.ts`, `src/server/auth-handlers.ts`

---

## 1. Bối Cảnh & Điều Kiện Chặn

Theo `PRODUCT-PRD-V1.md` (Mục 5.2.2) và `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (Mục 2.1), DuriOS yêu cầu hỗ trợ đủ **03 phương thức xác thực** về cùng một `AuthenticatedActor`:
1. `Password + Session Cookie`
2. `Zalo/SMS OTP + Session Cookie`
3. `Managed Pilot Token` (gắn theo người/thiết bị)

Do đó, **kênh OTP thật phải hoạt động thực tế trước khi Pilot nạp dữ liệu khách hàng thật**. Khi chưa cấu hình thông tin xác thực của nhà cung cấp thật, hệ thống bắt buộc giữ trạng thái `UnconfiguredOtpProvider` và từ chối yêu cầu OTP với mã `503 OTP_PROVIDER_UNAVAILABLE` (tuyệt đối không giả vờ gửi thành công).

---

## 2. Bảng So Sánh 3 Phương Án Nhà Cung Cấp Tại Việt Nam

| Tiêu chí đánh giá | **Phương án 1 (Đề xuất số 1): eSMS.vn (Vihat Group)** | **Phương án 2 (Dự phòng): Vietguys** | **Phương án 3: Zalo Cloud (ZNS trực tiếp) + SMS rời** |
|---|---|---|---|
| **Kênh hỗ trợ trên 01 cổng API** | **Zalo ZNS + SMS Brandname** (hỗ trợ tự động chuyển kênh dự phòng ZNS $\rightarrow$ SMS trên cùng một API). | **Zalo ZNS + SMS Brandname** (hỗ trợ đa kênh doanh nghiệp). | Chỉ có **Zalo ZNS**; muốn có SMS dự phòng phải tích hợp thêm nhà cung cấp thứ hai. |
| **Thời gian đăng ký & duyệt mẫu OTP** | $3\text{–}5$ ngày làm việc để kích hoạt Zalo OA doanh nghiệp và duyệt mẫu ZNS OTP; hỗ trợ thủ tục trọn gói. | $3\text{–}5$ ngày làm việc cho ZNS; quy trình kiểm duyệt hồ sơ doanh nghiệp chặt. | Tự thực hiện xác thực Zalo OA và tự lập trình cơ chế xoay vòng OAuth2 `refresh_token`. |
| **Chi phí ước tính cho Pilot 01 vựa** | Hạn mức nạp đầu vào linh hoạt ($\sim 500.000\text{–}1.000.000\text{ VNĐ}$). Đơn giá ZNS $\sim 250\text{–}330\text{ đ/tin}$, SMS $\sim 550\text{–}850\text{ đ/tin}$. Với quy mô 01 vựa ($\sim 10\text{–}20$ lượt OTP/ngày), chi phí thực tế **$< 200.000\text{ VNĐ/tháng}$**. | Đơn giá tương đương nhưng thường yêu cầu gói cam kết tối thiểu ban đầu cao hơn. | Đơn giá ZNS gốc ($\sim 220\text{–}300\text{ đ/tin}$), nhưng tốn chi phí vận hành quản lý token OAuth. |
| **Cơ chế xác thực từ máy chủ On-Prem** | `ApiKey` + `SecretKey` tĩnh qua HTTPS POST JSON (`X-Api-Key`, `X-Secret-Key`); không lo đứt phiên giữa ca làm việc tại vựa do hết hạn `refresh_token`. | `ApiKey` / `Passcode` tĩnh qua HTTPS POST JSON. | Phức tạp hơn: phải lưu trữ và tự động làm mới `access_token` / `refresh_token` định kỳ. |
| **Độ tin cậy nhận tin tại vựa** | Rất cao: Nhân viên vựa dùng Zalo thường xuyên; nếu thiết bị mất kết nối dữ liệu tạm thời có thể gọi kênh `SMS`. | Rất cao trên cả ZNS và SMS Brandname. | Phụ thuộc hoàn toàn vào kết nối Internet trên điện thoại người nhận. |

### Khuyến nghị trình Founder quyết định
- **Chọn Phương án 1 (`eSMS.vn` — gói Zalo ZNS kèm SMS Brandname dự phòng)** hoặc **Phương án 2 (`Vietguys`)** để có cả hai kênh `ZALO` và `SMS` qua một kết nối HTTPS duy nhất.
- Trong thời gian chờ nhà mạng duyệt SMS Brandname (thường mất $7\text{–}14$ ngày), kích hoạt **Zalo ZNS** trước ($3\text{–}5$ ngày) và cấp sẵn **Managed Pilot Token** cho máy tính cố định tại bàn giấy của vựa.

---

## 3. Cấu Hình Kỹ Thuật Adapter Đã Triển Khai (`HttpGatewayOtpProvider`)

Trong `src/auth/otp-provider.ts`, lớp `HttpGatewayOtpProvider` và hàm `createOtpProviderFromEnv` đã được triển khai với các nguyên tắc an toàn sau:

1. **Fail-Closed mặc định:**
   - Nếu `DURIOS_OTP_PROVIDER` không được đặt (hoặc đặt là `UNCONFIGURED`), hoặc thiếu `DURIOS_OTP_API_URL`, `DURIOS_OTP_API_KEY`, `DURIOS_OTP_SECRET_KEY`, hệ thống trả về `UnconfiguredOtpProvider` (`503 OTP_PROVIDER_UNAVAILABLE`).
   - Chỉ chấp nhận `DURIOS_OTP_API_URL` dùng giao thức `https://` (hoặc `http://127.0.0.1` / `http://localhost` khi chạy kiểm thử staging nội bộ).
2. **Kiểm tra điều kiện theo kênh:**
   - Kênh `ZALO` bắt buộc có `DURIOS_OTP_ZALO_OA_ID` và `DURIOS_OTP_ZALO_TEMPLATE_ID`.
   - Kênh `SMS` bắt buộc có `DURIOS_OTP_SMS_BRANDNAME`.
3. **Bảo vệ bí mật & Chống treo kết nối:**
   - Mọi lệnh gọi cổng OTP đều áp dụng `AbortSignal.timeout` (`DURIOS_OTP_TIMEOUT_MS`, mặc định `8000` ms).
   - Mã `otpCode`, `apiKey` và `secretKey` **không bao giờ** được ghi vào log hay chuỗi thông báo lỗi trả về client.
   - Bảng `otp_challenges` trong SQLite chỉ lưu `code_hash` + `code_salt` (SHA-256 băm muối), áp dụng giới hạn tối đa 5 lần nhập sai/challenge và rate-limit theo số điện thoại trong `auth_rate_limits`.

### Biến môi trường cần cấu hình trên máy chủ On-Prem khi có tài khoản OTP thật:

```ini
DURIOS_OTP_PROVIDER=ESMS
DURIOS_OTP_API_URL=https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/
DURIOS_OTP_API_KEY=<cấp_từ_nhà_cung_cấp>
DURIOS_OTP_SECRET_KEY=<cấp_từ_nhà_cung_cấp>
DURIOS_OTP_ZALO_OA_ID=<oa_id_đã_duyệt>
DURIOS_OTP_ZALO_TEMPLATE_ID=<template_otp_id>
DURIOS_OTP_SMS_BRANDNAME=<brandname_đã_duyệt>
DURIOS_OTP_TIMEOUT_MS=8000
```
