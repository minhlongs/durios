# Sổ Tay Onboarding Vận Hành Thực Địa & Nhà Phát Triển (Operator & Developer Onboarding)

**Mã tài liệu:** `docs/pilot-readiness/06_OPERATOR_AND_DEVELOPER_ONBOARDING.md`  
**Ngày ban hành:** 2026-10-17  
**Đối tượng:** Nhân viên chứng từ tại vựa (`PACKHOUSE_CLERK`), Chủ vựa/Quản lý (`PACKHOUSE_MANAGER`), Kiểm toán viên (`SYSTEM_AUDITOR`) và Kỹ sư phát triển mở rộng.

---

## 1. Khởi Chạy Nhanh Trong 60 Giây (Quickstart)

### 1.1 Yêu cầu môi trường
- **Runtime:** [Bun](https://bun.sh) `>= 1.3.14` (tích hợp sẵn `bun:sqlite` ở chế độ WAL).
- **Hệ điều hành:** macOS, Linux hoặc Windows (Mini PC tại bàn cân vựa đóng gói).

### 1.2 Cài đặt & Kiểm tra toàn vẹn
```bash
bun install --frozen-lockfile
bun run typecheck
bun test
```
Kết quả chuẩn: **131 / 131 bài kiểm thử PASS** trên 31 bộ test, 0 lỗi TypeScript.

---

## 2. Các Lệnh Vận Hành Thực Địa Tại Vựa Cai Lậy (`SITE-CAILAY-TIENGIANG-01`)

| Mục đích vận hành | Câu lệnh thực thi | Kết quả đầu ra |
|---|---|---|
| **1. Khởi tạo 5 hồ sơ diễn tập (kèm 2 lỗi gài mù)** | `bun run pilot:seed-rehearsal` | Tạo 5 container mẫu (`DOS-CAILAY-R01..R05`) và tài khoản `clerk.cailay` / `manager.cailay` |
| **2. Đánh giá KPI `GATE-05` (< 5 phút & bắt 100% lỗi)** | `bun run pilot:evaluate-kpi` | Tính Arithmetic Mean thời gian đối soát và 4 chỉ số giá trị từ container đầu tiên |
| **3. Kiểm tra 5 cổng khai trương (`GATE-01..05`)** | `bun run pilot:verify-gates` | Kiểm tra trạng thái sẵn sàng trước khi nạp dữ liệu khách hàng thật |
| **4. Xuất Gói Hồ Sơ Kiểm Toán Thực Địa có băm SHA-256** | `bun run pilot:audit-pack -- --verify` | Xuất báo cáo kiểm định 5 cổng có chữ ký SHA-256 |
| **5. Kiểm chứng độc lập gói Manifest xuất khẩu (MIT SDK)** | `bun run verify:manifest <path-to-manifest.json>` | Kiểm tra chữ ký băm SHA-256 và số container chuẩn ISO 6346 |
| **6. Khởi động máy chủ Web UI tại bàn cân (`127.0.0.1:3000`)** | `bun run start:server` | Giao diện đối soát chứng từ song ngữ Việt - Anh |

---

## 3. Các Endpoint API Open-Core & Portability (`v1`)

1. **`GET /api/v1/open-core/edition-manifest`**
   - Trả về trạng thái phiên bản hiện tại của vựa (`COMMUNITY_OPEN_CORE`, `PACKHOUSE_PRO_SAAS`, hoặc `EXPORTER_ENTERPRISE`), danh mục 15 module kiến trúc và các chỉ số kinh tế thực chứng (281 cơ sở đóng gói đang hoạt động, trần SaaS \$657.643 ARR vs mục tiêu \$1M ARR).
2. **`GET /api/v1/open-core/portability`**
   - Xuất gói **`SignedWorkspacePortabilityBundle`** chứa `VerifiedOrganizationProfile`, danh mục tóm tắt hồ sơ container và mã băm tổng hợp chuỗi kiểm toán `auditEventsDigestSha256` kèm chữ ký `HMAC-SHA256` (loại bỏ hoàn toàn khóa bí mật nội bộ).
3. **`POST /api/v1/open-core/portability/verify`**
   - Kiểm tra tính toàn vẹn SHA-256 và chữ ký HMAC của gói Portability Bundle trước khi nạp lên hệ thống Pro SaaS hoặc Enterprise.
4. **`GET /api/v1/pilot/go-live-pack`**
   - Dành cho `ADMIN` / `AUDITOR` tải trực tiếp báo cáo sẵn sàng 5 cổng khai trương có niêm phong SHA-256.

---

## 4. Quy Tắc Bất Biến Cho Nhà Phát Triển (Engineering Guardrails)

1. **Giới hạn độ dài tệp:** Mọi tệp `.ts` trong `src/` và `test/` bắt buộc $\le 179$ dòng.
2. **Không dùng kiểu `any`:** Tuyệt đối `0` lần xuất hiện `: any`, `as any`, `<any>`.
3. **Bắt buộc xác minh con người (HITL):** Không một bộ trích xuất OCR/AI nào được phép ghi trực tiếp trạng thái `HUMAN_VERIFIED`; mọi trường trích xuất tự động phải khởi tạo ở `UNVERIFIED` / `DRAFT` chờ chuyên viên xác nhận.
4. **Không giữ tiền (Zero-Custody):** Tuyệt đối không lưu trữ số dư tiền mặt hay tự động giải ngân ngoài hệ thống ngân hàng được cấp phép.
