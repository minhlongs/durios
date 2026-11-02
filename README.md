# DuriOS — Container Dossier Workspace (Local Prototype)

> Hệ điều hành quản lý hồ sơ kỹ thuật số và kiểm tra tuân thủ xuất khẩu sầu riêng (Bản thử nghiệm cục bộ)  
> Digital technical dossier workspace and export compliance verification system for Vietnamese durian (Local development prototype).

---

## 0. Định hướng chiến lược V2 / Strategic Realignment v2.0
- **Tầm nhìn dài hạn:** *DuriOS — Nền tảng điều phối giao dịch sầu riêng dựa trên hồ sơ và bằng chứng có thể kiểm tra* (Ẩn dụ "Grab" điều phối mạng lưới đa bên trong chuỗi giá trị sầu riêng xuất khẩu Đông Nam Á).
- **Hiện trạng vận hành (Baseline):** Dự án hiện ở **STAGE ZERO** (Phần mềm B2B chuyên ngành, chạy tại chỗ trên máy chủ nội bộ, phục vụ đối soát hồ sơ container cho 01 vựa đóng gói tại Cai Lậy, Tiền Giang).
- **Tài liệu chiến lược V2:** Đang ở trạng thái **`DRAFT_FOR_FOUNDER_REVIEW`** (`docs/product-direction/PRODUCT-VISION-V2.md`, `PRODUCT-PRD-V2.md`, `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`, `DURIOS-STRATEGY-V2.json`). Bản `V1` tiếp tục là baseline thực thi cho đến khi Founder phê duyệt chính thức.
- **Ranh giới an toàn:** Tuyệt đối không mở sàn giao dịch công khai, không giữ tiền khách hàng (Zero-Custody), không nạp dữ liệu thật trước khi vượt qua đủ 5 cổng khai trương (`GATE-01..GATE-05`).
- **Đọc trạng thái cổng cho đúng:** báo cáo cổng in **hai con số khác nhau** — `machineChecksPassedCount` (bao nhiêu tiêu chí hệ thống **máy chấm được**) và `operationalGatesEvidencedCount` (bao nhiêu **cổng khai trương** có cả máy chấm đạt **và** bằng chứng vận hành do con người ghi nhận). Chỉ con số thứ hai quyết định `goForLiveCustomerData`; hệ thống ghi nhận bằng chứ không tự xác minh chữ ký, không tự ký thay ai, và không bao giờ mở cổng dựa trên dữ liệu diễn tập. Chi tiết: `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` §3.1 và `docs/reports/arena-stage0-20261029/GATE-MATRIX.md` (mục 0.3: ai được ghi nhận bằng chứng, máy kiểm tra gì trên tệp khai báo, và dữ liệu tổng hợp bị chặn ra sao). Bộ artefact bàn giao để soát xét độc lập — báo cáo, log, patch, cây cơ sở tại `2f1538e`, cây đã bàn giao, archive tải được kèm SHA-256 — mô tả trong `docs/reports/arena-stage0-20261029/README-HANDOVER.md`.

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
*Tại thời điểm bàn giao 2026-10-30 (đợt cuối, sau khi viết lại cơ chế nguồn gốc dữ liệu cổng khai trương): `286` bài kiểm thử trên `67` tệp (`4.484` `expect()` assertions: Auth 5A-1, RBAC Tuples 5A-2, Share Grants 5A-3, Organic Evidence 5A-4, Redaction & Content-Addressed Blobs 5A-5, Staging Rehearsal 5A-6, Adversarial Verification, v.v.). Số liệu này thay đổi theo mỗi lần bổ sung kiểm thử — hãy lấy kết quả `bun test` trên máy bạn làm chuẩn, không lấy con số trong tài liệu.*

### 3.4 Khởi tạo dữ liệu diễn tập GATE-05 (5 container + 2 lỗi gài mù) / Seed GATE-05 Pilot Rehearsal
```bash
# Khuyến nghị: trỏ vào một cơ sở dữ liệu diễn tập riêng, KHÔNG dùng dữ liệu vận hành
DURIOS_DB_PATH=./data/rehearsal.db DURIOS_DATA_DIR=./data/rehearsal-uploads bun run pilot:seed-rehearsal
```
- **Bắt buộc khai báo đích (từ 2026-10-30):** lệnh này **từ chối chạy** nếu không có `DURIOS_DB_PATH` (hoặc tham số `{dbPath, dataDir}`) — lỗi `REHEARSAL_SEED_TARGET_REFUSED`. Lý do: nó tạo tài khoản `clerk.cailay` / `manager.cailay` với **mật khẩu cố định công khai trong mã nguồn**, nên mặc định cũ `./data/durios.db` (cơ sở dữ liệu vận hành) là một đường đăng nhập công khai không ai yêu cầu.
- **Từ chối ghi vào dữ liệu không phải dữ liệu diễn tập:** nếu đích là tệp SQLite không có schema DuriOS, hoặc đã chứa hồ sơ **không** bắt đầu bằng `DOS-CAILAY-R`, hoặc tài khoản ngoài hai tài khoản diễn tập trên → lệnh từ chối (`src/auth/rehearsal-seed-target-guard.ts`). Hãy seed vào một cơ sở dữ liệu mới, và khi pilot với dữ liệu thật thì cấp tài khoản bằng `src/auth/pilot-ops-cli.ts`, không dùng lại mật khẩu công khai.
- **Hồ sơ diễn tập làm bẩn đánh giá cổng:** chừng nào cohort còn chứa hồ sơ đi qua đường tổng hợp/diễn tập, báo cáo cổng khai trương mang nhãn `SYNTHETIC_REHEARSAL` và `goForLiveCustomerData` luôn `false`, kể cả khi khai báo đủ bằng chứng. Nguồn gốc được xác định bằng **sổ kiểm toán** (`SYNTHETIC_DOCUMENT_INGESTED`, `REHEARSAL_DOSSIER_SEEDED` gắn theo `dossierId`), không bằng tên hồ sơ, nên đổi `dossier_code` bằng SQL thô không mở được cổng; nếu chuỗi băm kiểm toán không xác minh được thì nhãn là `UNPROVEN_LEDGER_INTEGRITY` và cũng không cổng nào mở (`src/auth/gate-cohort-provenance.ts`, bằng chứng đối kháng: `docs/reports/arena-stage0-20261029/evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`). Phải tách/dọn dữ liệu diễn tập trước khi đánh giá cổng trên cơ sở dữ liệu thật.
- Tạo tài khoản `clerk.cailay` (`PACKHOUSE_CLERK`) và `manager.cailay` (`PACKHOUSE_MANAGER`) kèm Pilot Token thiết bị (`dpt_...`) và 5 container mẫu tại Cai Lậy (`DOS-CAILAY-R01`..`R05`), bao gồm 2 container gài lỗi mù (`BLIND_FAULT_SEAL_MISMATCH` và `BLIND_FAULT_UNVERIFIED_EVIDENCE`).

### 3.5 Khởi động máy chủ HTTP & Giao diện trình duyệt / Start Local Server & Web Workspace
```bash
bun run start:server
```
- Máy chủ gắn kết cục bộ độc quyền tại: `http://127.0.0.1:3000` (hoặc cổng cấu hình qua `PORT`).
- Giao diện người dùng Web tiếng Việt có sẵn trực tiếp tại: `http://127.0.0.1:3000/` (hỗ trợ đăng nhập phiên Pilot `durios_session` / `x-pilot-token`, đính kèm bằng chứng hữu cơ `5A-4` và cấp/thu hồi quyền chia sẻ `5A-3`).

### 3.6 Bootstrap diễn tập không cần đăng nhập (chỉ bật khi chấp nhận rủi ro)
```bash
DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=true bun run start:server
```
- Tuyến `POST /api/auth/pilot-rehearsal-bootstrap` cấp tài khoản diễn tập và trả về Pilot Token `MANAGER` **mà không cần thông tin đăng nhập**, nên mặc định bị từ chối (`403 FEATURE_DISABLED`). Chỉ bật cờ trên khi máy chủ chạy trên một cơ sở dữ liệu diễn tập tổng hợp. Gắn kết loopback `127.0.0.1` một mình không đủ chứa rủi ro: tiến trình khác trên cùng máy, một trang web gửi POST chéo nguồn, hoặc reverse proxy chuyển tiếp `Host: 127.0.0.1:3000` đều tới được tuyến này.

### 3.7 Chạy kịch bản dòng lệnh mô phỏng đầy đủ / Run CLI End-to-End Simulation
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
3. **Quy tắc trích xuất giả lập — và nguyên tắc thất bại an toàn (fail-closed)**:
   - Bộ giải mã hiện tại sử dụng fixture mẫu (`synthetic fixture extractor`) để phát triển cục bộ, không phải hệ thống thị giác máy tính OCR trực tiếp trên môi trường thực tế.
   - **Đường fixture chỉ hoạt động khi chế độ tổng hợp được bật tường minh** bằng `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true` (`src/extraction/synthetic-extraction-mode.ts`) — dành cho diễn tập và kiểm thử. Bộ test bật cờ này qua `bunfig.toml` → `test/preload-synthetic-extraction.ts`; `pilot:seed-rehearsal` tự bật cho tiến trình của nó.
   - **Luồng thường (không bật cờ):** `text/plain` chỉ cho ra giá trị **suy từ byte thật của tệp** (regex theo đúng loại chứng từ, `src/extraction/local-text-extractor.ts`); `application/pdf` không đọc được, `application/json` và ảnh chụp/scan (`image/png`, `image/jpeg`, `image/tiff`) cho `0` trường trích xuất → hồ sơ bị chặn bởi `RUL-DOC-UNREADABLE` (`CRITICAL_BLOCKER`) cho đến khi nạp tệp đọc được hoặc nhập tay và kiểm chứng từng trường. Yêu cầu nạp `fixtureFields` qua API bị từ chối `400 SYNTHETIC_EXTRACTION_DISABLED` và được ghi vào sổ kiểm toán (`DOC_UPLOAD_REJECTED`).
   - **Không có giá trị mẫu nào của template được trình bày như dữ liệu chứng từ** ở luồng thường (các giá trị canary nằm trong `src/extraction/fixture-template-fields.ts` và chỉ xuất hiện khi chế độ tổng hợp được bật).
   - Phiếu kiểm nghiệm có trong hồ sơ nhưng **không đọc được hàm lượng Cadmi** (trường `cadmium_mg_kg` trống/không phải số) cũng bị chặn với `observedValue = NOT_EXTRACTED`. Thiếu dữ liệu không bao giờ trở thành `PASSED`.
4. **Bắt buộc xác minh con người (HITL)**:
   - Mọi trường dữ liệu trích xuất tự động phải được chuyên viên xác nhận (`HUMAN_VERIFIED`) trước khi hệ thống cho phép hoàn thành thẩm định và phê duyệt xuất hồ sơ.

---

## 7. Cấu trúc gói xuất khẩu / Export Manifest Bundle

Gói xuất khẩu bao gồm:
- Định danh và thông tin container (`dossierCode`, `containerNumber`, `sealNumber`).
- Bảng kê các chứng từ kèm mã băm SHA-256 độc lập.
- Tóm tắt dữ liệu đã được chuyên viên con người xác thực.
- Mã băm tổng hợp liên kết (`compositeManifestSha256`) — bao phủ định danh, bảng kê chứng từ và tóm tắt dữ liệu đã kiểm chứng.
- Mã băm toàn bản ghi (`manifestIntegritySha256`) — bao phủ **mọi** trường còn lại (`complianceFindingsCount`, `regulatoryDisclaimers`, `exportedBy`, `exportedAt`, `lifecycleState`, `isImmutable`). Bộ kiểm chứng độc lập bắt buộc khớp mã băm này khi có; manifest cũ chưa có trường này vẫn kiểm chứng được nhưng bị gắn nhãn `integrityCoverage: "PARTIAL_LEGACY"`.
- Lịch sử kiểm toán và khuyến cáo pháp lý bắt buộc.
- Khi một đơn vị **không sở hữu** hồ sơ đọc manifest qua `/api/dossiers/:id/manifest`, nội dung trả về đã lọc theo chính sách 5A-5 (mục đích chia sẻ) và kèm khối `redaction` giải thích rằng hai mã băm vẫn trỏ tới bản ghi đầy đủ của đơn vị sở hữu — băm lại bản đã lọc sẽ không khớp và đó không phải dấu hiệu giả mạo. Manifest chỉ được cấp cho mục đích `BUYER_VERIFICATION`, `CUSTOMS_INSPECTION`, `AUDIT`.

---

## 8. Kiến trúc Open-Core & Phân tầng Dịch vụ SaaS / Open-Core & SaaS Editions

- **Trạng thái chương trình / Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING` (Xem kế hoạch chi tiết tại `plans/261017-open-core-hardening/plan.md`).

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
- **`GET /api/v1/open-core/blueprint-status` (`?deep=true`)**: Kiểm tra tự động 25 bước tái cấu trúc Open-Core & 5 vòng đối chiếu Socratic (`--deep`: cách ly SDK `MIT`, vệ sinh bảo mật GitHub, Ed25519 Zero-Lock-In, biên lợi nhuận gộp `94.67%`).
- **`GET /api/v1/open-core/portability`**: Xuất gói `SignedWorkspacePortabilityBundle` (kèm `VerifiedOrganizationProfile` và chữ ký HMAC-SHA256, không chứa khóa bí mật) để nâng cấp liền mạch từ bản tự lưu trữ lên Pro/Enterprise.
- **`POST /api/v1/open-core/portability/verify`**: Xác minh tính toàn vẹn SHA-256 và chữ ký HMAC của gói chuyển đổi.
- **Tài liệu Onboarding chi tiết**: Xem `docs/pilot-readiness/06_OPERATOR_AND_DEVELOPER_ONBOARDING.md`.


