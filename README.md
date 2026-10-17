# DuriOS — Container Dossier Workspace (Local Prototype)

> Hệ điều hành quản lý hồ sơ kỹ thuật số và kiểm tra tuân thủ xuất khẩu sầu riêng (Bản thử nghiệm cục bộ)  
> Digital technical dossier workspace and export compliance verification system for Vietnamese durian (Local development prototype).

---

## 0. Định hướng chiến lược V2 / Strategic Realignment v2.0
- **Tầm nhìn dài hạn:** *DuriOS — Nền tảng điều phối giao dịch sầu riêng dựa trên hồ sơ và bằng chứng có thể kiểm tra* (Ẩn dụ "Grab" điều phối mạng lưới đa bên trong chuỗi giá trị sầu riêng xuất khẩu Đông Nam Á).
- **Hiện trạng vận hành (Baseline):** Dự án hiện ở **STAGE ZERO** (Phần mềm B2B chuyên ngành, chạy tại chỗ trên máy chủ nội bộ, phục vụ đối soát hồ sơ container cho 01 vựa đóng gói tại Cai Lậy, Tiền Giang).
- **Tài liệu chiến lược V2:** Đang ở trạng thái **`DRAFT_FOR_FOUNDER_REVIEW`** (`docs/product-direction/PRODUCT-VISION-V2.md`, `PRODUCT-PRD-V2.md`, `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`, `DURIOS-STRATEGY-V2.json`). Bản `V1` tiếp tục là baseline thực thi cho đến khi Founder phê duyệt chính thức.
- **Ranh giới an toàn:** Tuyệt đối không mở sàn giao dịch công khai, không giữ tiền khách hàng (Zero-Custody), không nạp dữ liệu thật trước khi vượt qua đủ 5 cổng khai trương (`GATE-01..GATE-05`).

---

## 1. Tổng quan & Bản chất hệ thống / Overview

DuriOS là công cụ cục bộ hỗ trợ chuẩn bị và đối soát hồ sơ container xuất khẩu sầu riêng tươi sang thị trường Trung Quốc (GACC). Hệ thống tập trung vào một quy trình cốt lõi duy nhất:

**Tạo hồ sơ container** $\rightarrow$ **Tải chứng từ mẫu** $\rightarrow$ **Băm SHA-256 trên máy chủ** $\rightarrow$ **Trích xuất trường dữ liệu ứng viên** $\rightarrow$ **Xác minh người vận hành (HITL)** $\rightarrow$ **Chạy kiểm tra tuân thủ tất định** $\rightarrow$ **Cảnh báo lỗi/nguy cơ** $\rightarrow$ **Xuất gói hồ sơ niêm phong số** $\rightarrow$ **Lưu vết kiểm toán chuỗi băm (Hash-chain Audit)** $\rightarrow$ **Lưu trữ bền vững qua SQLite**.

---

## 2. Yêu cầu tiên quyết / Prerequisites

- **Bun**: $\ge 1.3.0$ (Đã kiểm nghiệm trên Bun `1.3.14` trên macOS Darwin).
- **TypeScript**: $\ge 5.7.0$.
- Không yêu cầu cài đặt Docker, PostgreSQL, hoặc các dịch vụ đám mây bên ngoài.

---

## 3. Cài đặt & Lệnh vận hành / Setup & Commands

### 3.1 Cài đặt phụ thuộc / Install dependencies
```bash
bun install
```

### 3.2 Kiểm tra kiểu dữ liệu / Type checking
```bash
bun run typecheck
```

### 3.3 Chạy toàn bộ kiểm thử tự động / Run test suite
```bash
bun test
```
*Tất cả 79 bài kiểm thử trải rộng trên 17 bộ test suite (`3,439` `expect()` assertions: Auth 5A-1, RBAC Tuples 5A-2, Share Grants 5A-3, Organic Evidence 5A-4, Redaction & Content-Addressed Blobs 5A-5, Staging Rehearsal 5A-6, Adversarial Verification, v.v.).*

### 3.4 Khởi tạo dữ liệu diễn tập GATE-05 (5 container + 2 lỗi gài mù) / Seed GATE-05 Pilot Rehearsal
```bash
bun run pilot:seed-rehearsal
```
- Tạo tài khoản `clerk.cailay` (`PACKHOUSE_CLERK`) và `manager.cailay` (`PACKHOUSE_MANAGER`) kèm Pilot Token thiết bị (`dpt_...`) và 5 container mẫu tại Cai Lậy (`DOS-CAILAY-R01`..`R05`), bao gồm 2 container gài lỗi mù (`BLIND_FAULT_SEAL_MISMATCH` và `BLIND_FAULT_UNVERIFIED_EVIDENCE`).

### 3.5 Khởi động máy chủ HTTP & Giao diện trình duyệt / Start Local Server & Web Workspace
```bash
bun run start:server
```
- Máy chủ gắn kết cục bộ độc quyền tại: `http://127.0.0.1:3000` (hoặc cổng cấu hình qua `PORT`).
- Giao diện người dùng Web tiếng Việt có sẵn trực tiếp tại: `http://127.0.0.1:3000/` (hỗ trợ đăng nhập phiên Pilot `durios_session` / `x-pilot-token`, đính kèm bằng chứng hữu cơ `5A-4` và cấp/thu hồi quyền chia sẻ `5A-3`).

### 3.6 Chạy kịch bản dòng lệnh mô phỏng đầy đủ / Run CLI End-to-End Simulation
```bash
bun run start
# hoặc: bun run src/cli.ts
```

---

## 4. Kiến trúc lưu trữ & Bền vững dữ liệu / Persistence & Data Architecture

- **Cơ sở dữ liệu SQLite cục bộ (`./data/durios.db`)**:
  - Sử dụng module gốc `bun:sqlite`, chế độ WAL (`PRAGMA journal_mode = WAL`) và kích hoạt toàn vẹn khóa ngoại (`PRAGMA foreign_keys = ON`).
  - Hệ thống di chuyển schema phiên bản tự động (`schema_migrations`), chạy an toàn và lặp lại không phá hủy dữ liệu.
- **Thư mục lưu trữ tệp cục bộ định danh theo nội dung (`./data/uploads/storage/blobs/<sha256>.bin`)**:
  - Lưu trữ byte tệp độc lập với metadata cơ sở dữ liệu theo cơ chế Content-Addressed Storage (`5A-5`) với ghi tạm nguyên tử (`atomic temp write + rename`) và kiểm tra đối chiếu SHA-256 khi đọc/ghi.
  - Băm SHA-256 được tính toán tại máy chủ từ nội dung byte thực tế của tệp; ngăn chặn tuyệt đối Path Traversal.
- **Sao lưu & Phục hồi cấp trạm (`src/auth/pilot-ops-cli.ts` & `src/auth/site-backup-manager.ts`)**:
  - Hỗ trợ `VACUUM INTO` snapshot cơ sở dữ liệu + kiểm tra chuỗi băm kiểm toán + kiểm tra toàn vẹn toàn bộ blob trước khi khôi phục.
- **Cách xóa sạch dữ liệu thử nghiệm an toàn / Reset Demo Data**:
  ```bash
  rm -f data/*.db data/*.db-wal data/*.db-shm
  rm -rf data/uploads/*
  ```

---

## 5. Ranh giới an toàn & Kiểm toán / Security Boundary & Audit Ledger

1. **Xác thực phiên & Phân quyền Tuple RBAC (`5A-1` & `5A-2`)**:
   - Máy chủ chỉ lắng nghe trên `127.0.0.1`.
   - Mọi API nghiệp vụ (`/api/v1/*` và `/api/*`) bắt buộc xác thực qua phiên đăng nhập (`HttpOnly; SameSite=Strict` cookie `durios_session`), `Authorization: Bearer <token>`, hoặc `x-pilot-token` (`SqliteAuthService`). Các header giả mạo danh tính cũ (`x-actor-id`, `x-actor-role`, `x-tenant-id`) bị từ chối hoàn toàn (`401 MISSING_CREDENTIALS`).
   - Áp dụng ma trận bộ ba danh tính hợp lệ (`persona × tenantType × role`) và kiểm soát chia sẻ liên đơn vị gắn mục đích (`Purpose-Bound Share Grants 5A-3`) kèm lọc bỏ trường nhạy cảm thương mại (`Redaction 5A-5`).
2. **Sổ cái kiểm toán chuỗi băm (SHA-256 Hash Chain)**:
   - Mọi thay đổi trạng thái và xác minh con người được ghi nhận bất biến theo mô hình append-only.
   - Mỗi bản ghi chứa `previousHash` liên kết ngược về khối khởi thủy (`GENESIS-000...`).
   - *Phân định kỹ thuật quan trọng*: Chuỗi băm SHA-256 cung cấp khả năng phát hiện sửa đổi dữ liệu (Tamper Detection) khi đối chiếu với một mốc tham chiếu tin cậy. Chuỗi băm **không** biến cơ sở dữ liệu thành phần cứng chống ghi (WORM) nếu quản trị viên có quyền truy cập toàn bộ đĩa để tính lại chuỗi. Hệ thống phát hiện lập tức khi phát hiện payload bị sửa đổi, bản ghi bị xóa hoặc sai thứ tự và từ chối xuất gói hồ sơ.

---

## 6. Tuyên bố pháp lý & Quy tắc an toàn quy chuẩn / Regulatory Disclaimers

1. **Không phải phê duyệt của chính phủ**:
   - DuriOS là công cụ hỗ trợ chuẩn bị kỹ thuật và kiểm tra logic nội bộ. Việc hệ thống thông báo trạng thái `PASSED` **không đồng nghĩa** với việc lô hàng được cơ quan hải quan (GACC) hay cơ quan kiểm dịch thông quan pháp lý.
2. **Quy chuẩn Cadmium (GB 2762-2022 vs. Ngưỡng nội bộ `RUL-INT-CD-WARN`)**:
   - **Giới hạn luật định (`CN`)**: Ngưỡng hàm lượng Cadmium theo quy chuẩn Trung Quốc GB 2762-2022 là **0.050 mg/kg**. Vượt quá ngưỡng này cấu thành vi phạm quy chuẩn nghiêm trọng (`CRITICAL_BLOCKER`).
   - **Ngưỡng cảnh báo hành động nội bộ (`RUL-INT-CD-WARN`)**: Ngưỡng **0.040 mg/kg** (`0.040 mg/kg` internal Cadmium action buffer) được hệ thống dán nhãn rõ ràng là **CẢNH BÁO NỘI BỘ (INTERNAL ADVISORY)** nhằm mục đích an toàn, không được phép coi là vi phạm pháp luật nếu hàm lượng $\le 0.050\text{ mg/kg}$.
3. **Quy tắc trích xuất giả lập**:
   - Bộ giải mã hiện tại sử dụng fixture mẫu (`synthetic fixture extractor`) để phát triển cục bộ, không phải hệ thống thị giác máy tính OCR trực tiếp trên môi trường thực tế.
4. **Bắt buộc xác minh con người (HITL)**:
   - Mọi trường dữ liệu trích xuất tự động phải được chuyên viên xác nhận (`HUMAN_VERIFIED`) trước khi hệ thống cho phép hoàn thành thẩm định và phê duyệt xuất hồ sơ.

---

## 7. Cấu trúc gói xuất khẩu / Export Manifest Bundle

Gói xuất khẩu bao gồm:
- Định danh và thông tin container (`dossierCode`, `containerNumber`, `sealNumber`).
- Bảng kê các chứng từ kèm mã băm SHA-256 độc lập.
- Tóm tắt dữ liệu đã được chuyên viên con người xác thực.
- Mã băm tổng hợp liên kết (`compositeManifestSha256`).
- Lịch sử kiểm toán và khuyến cáo pháp lý bắt buộc.

---

## 8. Kiến trúc Open-Core & Phân tầng Dịch vụ SaaS / Open-Core & SaaS Editions

- **Trạng thái chương trình / Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING` (Xem kế hoạch chi tiết tại `/Users/macbook/durios/plans/261017-open-core-hardening/plan.md`).

DuriOS được phát hành theo mô hình **Open-Core Dual-License** (`LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`, `TRADEMARK-POLICY.md`):
- **MIT Specification & Verifier SDK** (`src/domain/iso-6346.ts`, `src/ingestion/document-hasher.ts`, `src/export/manifest-compiler.ts`, `src/export/standalone-manifest-verifier.ts`, cùng `src/domain/types.ts` khi dùng làm định nghĩa kiểu cho 4 module độc lập này).
- **Community Core (`AGPL-3.0-only`)**: Cho phép sử dụng thương mại, tự vận hành một hoặc nhiều trạm (multi-site self-hosting), và triển khai qua mạng tuân thủ điều khoản `AGPL-3.0-only` (bao gồm Điều 13 về cung cấp mã nguồn tương ứng khi vận hành bản sửa đổi qua mạng).

### 8.1 Phân định rõ: Đã hiện thực trong Khung Cục bộ vs. Cổng Phụ thuộc Bên ngoài Đang chờ

1. **Đã hiện thực trong Khung Open-Core Cục bộ (Implemented in Local Open-Core Scaffold):**
   - Kiểm tra chữ ký số bất đối xứng **Ed25519** cho khóa thuê bao `DURIOS_SAAS_LICENSE_KEY` (`DURIOS_SAAS_LICENSE_PUBLIC_KEY`) gắn chặt với `expectedTenantId` và tự động hạ cấp an toàn (`Graceful Downgrade` về `COMMUNITY_OPEN_CORE`) khi thiếu khóa, sai chữ ký, lệch tenant hoặc hết hạn.
   - Đối soát quy chuẩn xuất khẩu thị trường Trung Quốc (`CN`: ISO 6346, KDTV, mã vùng trồng/CSĐG, ngưỡng luật định Cadmium GB 2762-2022 `0.050 mg/kg` và ngưỡng cảnh báo hành động nội bộ `0.040 mg/kg` — `RUL-INT-CD-WARN`).
   - Bộ kiểm tra độc lập `standalone-manifest-verifier.ts` (`"DuriOS Local Manifest Hash Check Passed (MIT Verifier)"`), bộ nhận diện webhook đối tác xác thực HMAC-SHA256 trước khi kiểm tra chống phát lại (`PartnerWebhookIngestor`), hàng đợi đồng bộ ngoại tuyến lưu bền vững trên SQLite (`edge_sync_queue`), và mã hóa phong bì metadata sao lưu bằng `scrypt` + AES-256-GCM có ràng buộc AAD theo tenant (`MANIFEST_METADATA_ONLY_NOT_BLOBS`).
   - Toàn bộ adapter SaaS (`CloudVisionOcrExtractorAdapter`, `ManagedSaasZnsAlertRelay`, `GaccRegistryWatchService`, `CloudLedgerAnchor`, `multi-market-pack-registry`) được thiết kế **fail-closed** (từ chối thực thi hoặc trả về trạng thái chưa cấu hình khi thiếu transport/snapshot thực tế, tuyệt đối không tạo biên lai mạng giả).

2. **Các Cổng Phụ thuộc Bên ngoài Đang chờ (External Gates Pending — Cloud Gateway, eSMS/ZNS Telecom Contract, Official Legal/GACC Feed, Counsel Review):**
   - **Cloud Gateway & AI Vision OCR:** Chưa kết nối máy chủ OCR đám mây thực tế; `CloudVisionOcrExtractorAdapter` cần được nạp `OcrTransport` thực tế và mọi trường trích xuất luôn giữ trạng thái `DRAFT` chờ người vận hành xác nhận (`HUMAN_VERIFIED`).
   - **Hợp đồng Viễn thông eSMS / Zalo ZNS (Telecom Contract):** Chưa tích hợp cổng nhà mạng trực tiếp; cần hợp đồng Zalo OA / eSMS thương mại và nạp `ZnsTransportAdapter`.
   - **Nguồn Dữ liệu Pháp lý / GACC Chính thức (Official Legal/GACC Feed):** `GaccRegistryWatchService` yêu cầu caller truyền `feedSnapshot` tham chiếu rõ ràng (không tự ý coi dữ liệu mẫu là danh sách GACC đang hiệu lực); `CloudLedgerAnchor` hiện tạo biên lai HMAC cục bộ (`LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA`), chờ tích hợp tổ chức cấp dấu thời gian chuẩn RFC 3161.
   - **Thẩm định Pháp lý Đa thị trường & Nhãn hiệu (Counsel Review):** Các gói thị trường `JP`, `KR`, `EU` được khóa ở trạng thái `UNVERIFIED_EXTERNAL_LEGAL_COUNSEL_REQUIRED` cho đến khi có văn bản thẩm định pháp lý chính thức về ngưỡng MRL/kiểm dịch; hoàn tất đăng ký nhãn hiệu và CLA bot.

### 8.2 Ma trận Phân tầng Kiến trúc / Edition Matrix

| Hạng mục | Community Open-Core (`AGPL-3.0-only` + `MIT` SDK) | Packhouse Pro SaaS (`DURIOS_SAAS_LICENSE_KEY`) | Exporter Enterprise (Hợp đồng năm) |
|---|---|---|---|
| **Đối soát quy tắc `CN` (ISO 6346, Cadimi `0.050`/`0.040 mg/kg` `RUL-INT-CD-WARN`, KDTV)** | Mở 100% tại máy cục bộ (`127.0.0.1`) | Có + `GaccRegistryWatchService` (yêu cầu nạp snapshot nguồn GACC; live feed đang chờ cổng ngoài) | Mở rộng đa thị trường `JP`, `KR`, `EU` (hiện fail-closed chờ thẩm định pháp lý) |
| **Bóc tách chứng từ (`DocumentExtractorAdapter`)** | `LocalHeuristicTextExtractorAdapter` (Regex UTF-8/PDF) + HITL | `CloudVisionOcrExtractorAdapter` (luôn xuất `DRAFT` + HITL; chờ kết nối Cloud OCR Gateway) | Mẫu biểu tùy chỉnh theo phòng Lab |
| **Kênh OTP & Cảnh báo** | `FakeOtpProvider` (Thử nghiệm nội bộ) | `ManagedSaasZnsAlertRelay` (fail-closed khi thiếu transport; chờ hợp đồng Zalo ZNS/eSMS) | Tích hợp SSO & Phân quyền đa chi nhánh |
| **Sao lưu & Niêm phong** | Sao lưu ổ cứng cục bộ (`site-backup-manager`) | Phong bì mã hóa `scrypt` + AES-256-GCM (`MANIFEST_METADATA_ONLY_NOT_BLOBS`) & biên lai HMAC cục bộ (chờ Cloud Storage & RFC 3161 TSA) | Lưu trữ đám mây dài hạn & kiểm toán độc lập |
| **Chia sẻ cho Buyer (`5A-3`)** | Xem trong mạng nội bộ (`127.0.0.1`) | `CrossBorderBuyerRoomLink` (yêu cầu cấu hình `DURIOS_BUYER_PORTAL_BASE_URL`; chờ hạ tầng cổng HTTPS) | Cổng dữ liệu riêng + B2B Escrow Dual-Locked (`Prompt 6A`) |

- **Đảm bảo Không Khóa Dữ Liệu (Zero Lock-In & Graceful Downgrade):** Khi không cấu hình `DURIOS_SAAS_LICENSE_KEY` hoặc khi thuê bao hết hạn, hệ thống tự động hạ cấp an toàn về `COMMUNITY_OPEN_CORE`, giữ nguyên 100% quyền truy cập đọc và xuất dữ liệu SQLite cục bộ của vựa.

### 8.3 Các Endpoint Open-Core Portability & Onboarding
- **`GET /api/v1/open-core/edition-manifest`**: Truy vấn danh mục module Open-Core, phân tầng giấy phép và thông số kinh tế thực chứng.
- **`GET /api/v1/open-core/portability`**: Xuất gói `SignedWorkspacePortabilityBundle` (kèm `VerifiedOrganizationProfile` và chữ ký HMAC-SHA256, không chứa khóa bí mật) để nâng cấp liền mạch từ bản tự lưu trữ lên Pro/Enterprise.
- **`POST /api/v1/open-core/portability/verify`**: Xác minh tính toàn vẹn SHA-256 và chữ ký HMAC của gói chuyển đổi.
- **Tài liệu Onboarding chi tiết**: Xem `docs/pilot-readiness/06_OPERATOR_AND_DEVELOPER_ONBOARDING.md`.


