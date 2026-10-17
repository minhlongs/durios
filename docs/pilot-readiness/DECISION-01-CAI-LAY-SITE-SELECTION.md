# Quyết Định Lựa Chọn Địa Điểm Thử Nghiệm Thực Địa (Site Selection Decision)

**Mã văn bản:** `DECISION-01-CAI-LAY-SITE-SELECTION`  
**Ngày ban hành:** 2026-10-17  
**Thẩm quyền phê duyệt:** Founder & CEO DuriOS  
**Căn cứ:**
- Báo cáo khảo sát vựa Cai Lậy (`docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`).
- Hợp đồng Brainstorm và Chiến lược Verified Durian Trade Network (`PRODUCT-VISION-V2.md`).
- Phê duyệt chính thức của Founder ngày 2026-10-17.

---

## 1. Quyết Định Phê Duyệt

1. **Địa điểm chính thức triển khai Stage Zero:**
   - **Tên cơ sở:** Cơ sở đóng gói sầu riêng xuất khẩu Cai Lậy (SITE-CAILAY-TIENGIANG-01).
   - **Địa bàn:** Huyện Cai Lậy, Tỉnh Tiền Giang (vùng trọng điểm sầu riêng Tây Nam Bộ).
   - **Loại hình hoạt động:** Thu mua, phân loại, kiểm nghiệm Cadimi, đóng gói container lạnh xuất khẩu sang Trung Quốc theo Nghị định thư GACC.

2. **Kích hoạt quy trình 5 Cổng Khai Trương (Launch Gates):**
   - **`GATE-01` (Chấp thuận dữ liệu theo Luật 91/2025/QH15):** Giao bộ phận Pháp lý & Vận hành tiếp cận chủ vựa để ký Biên bản chấp thuận xử lý dữ liệu (DPA) theo mẫu đã chuẩn bị tại `04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`.
   - **`GATE-02` (Kênh OTP xác thực):** Chuẩn bị nạp thông tin nhà mạng (Zalo ZNS / SMS) trên môi trường staging.
   - **`GATE-03` (Bảo mật máy chủ tại chỗ):** Triển khai máy chủ Mini PC on-premise chạy Bun + SQLite (WAL mode) độc lập trên mạng nội bộ LAN của vựa, không mở port công khai ra ngoài.
   - **`GATE-04` (Sao lưu dữ liệu định kỳ):** Cấu hình ổ cứng sao lưu gắn ngoài có mã hóa.
   - **`GATE-05` (Diễn tập 5 container & KPI < 5 phút):** Thực hiện đo lường chỉ số thời gian đối soát trung bình và 4 chỉ số kinh tế mới (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`).

---

## 2. Ranh Giới An Toàn Bắt Buộc

- Nghiêm cấm nạp dữ liệu khách hàng thật cho đến khi toàn bộ 5 cổng đều được kiểm toán viên ký xác nhận bằng công cụ CLI `bun run pilot:audit-pack -- --verify`.
- Giữ nguyên mô hình **Zero-Custody** (không giữ tiền) và **Local Core** (dữ liệu lưu tại vựa).
