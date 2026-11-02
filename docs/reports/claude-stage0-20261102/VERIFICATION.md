# Bằng Chứng Nghiệm Thu Thực Thi Độc Lập (Verification Log) — DuriOS Stage 0

- **Ngày thực thi:** `2026-11-02`
- **Máy thực thi:** macOS (`Darwin 27.0.0`, Apple Silicon)
- **Runtime:** Bun + TypeScript Strict (`tsc --noEmit`) + Google Chrome Headless (`Playwright Core`)
- **Nguyên tắc:** Mọi kết quả dưới đây đều được chạy thực tế trong phiên làm việc này trên các thư mục tạm cô lập (`/tmp/durios-stage0-verify-20261102/`), không dùng dữ liệu khách hàng thật và không làm thay đổi fingerprint của cây bàn giao gốc.

---

## 1. Xác Minh Toàn Vẹn Gói Bàn Giao (`durios-stage0-handover-20261030.tar.gz`)

### Lệnh đã chạy
```bash
shasum -a 256 /Users/macbook/Downloads/durios-stage0-handover-20261030.tar.gz
stat -f "%z" /Users/macbook/Downloads/durios-stage0-handover-20261030.tar.gz
cd /tmp/durios-stage0-verify-20261102/archive-check/extracted && shasum -a 256 -c SHA256SUMS.txt
```

### Kết quả thực tế
- **Kích thước:** `18930266` bytes (khớp 100%).
- **SHA-256:** `ce97836cf4f24a3b1b6b1b21a862d613c3a13dd9133ea4dfb7c9e2350744d38e` (khớp 100%).
- **Kiểm tra `SHA256SUMS.txt`:** `184/184` tệp bên trong khớp SHA-256 (`0` lỗi).
- **Tree Fingerprint của `delivered-20261030` (613 tệp):**
  `a9c5043ce01672ed44241a018b134149ec13dd04036701fd3f81b206d5ac69aa` — kiểm tra trước và sau khi chạy 10 bước acceptance harness đều giữ nguyên tuyệt đối.

---

## 2. Kết Quả Typecheck, Unit/Integration Tests & Socratic 15-Turn Introspector

### 2.1. Trên Tree A (`/tmp/durios-stage0-verify-20261102/delivered-20261030` — nền `2f1538e8`)
- `bun run typecheck`: `0 errors` (`tsc --noEmit` exit code `0`).
- `bun test`: **`286 pass`, `0 fail`, `4,484 expect()` calls** trên **`67` files**.

### 2.2. Trên Tree B (`/Users/macbook/durios/.claude/worktrees/stage0-arena-integration` — nhánh `stage0/arena-integration-20261102` tách từ `08992f6`)
- `bun run typecheck`: `0 errors` (`tsc --noEmit` exit code `0`).
- `bun test`: **`294 pass`, `0 fail`, `4,460 expect()` calls** trên **`66` files** (`[15.51s]`).
  - Trong đó bao gồm 2 bộ kiểm thử hồi quy mới cho **F-16** và **F-17**:
    - `test/rehearsal-account-operational-guard.test.ts` (`7/7 pass`, `99` LOC)
    - `test/pilot-cli-db-isolation.test.ts` (`7/7 pass`, `96` LOC)
- `bun run src/saas/blueprint-cli.ts --deep`:
  - `Idea Verdict`: `GO_OPEN_CORE_SAAS`
  - `UI/UX 2027 Verdict`: `GO_2027_UI_UX_STANDARDIZED (26/26 HTML Surfaces, 0 Dead Links)`
  - `Modularity Verdict`: `GO_MODULAR_ZERO_ANY_VERIFIED (maxSrcLoc=100, maxTestLoc=100 <= 100, any=0)`
  - `All 15 Socratic Turns Passed`: `YES (15/15)`
  - `25-Step Blueprint Passed`: `YES (25/25)`

---

## 3. Kết Quả Chạy 10 Bước Acceptance Harness (`acceptance-harness.sh`) Trên Cả 2 Cây

### 3.1. Bảng tổng hợp 10 bước
| Bước | Nội dung kiểm chứng | Tree A (`delivered-20261030`) | Tree B (`stage0/arena-integration-20261102`) |
|---|---|---|---|
| `step-01` | `verify-checksums-and-list-archive` (SHA256SUMS + archive check) | **PASS** | **PASS** |
| `step-02` | `install-dependencies-per-lockfile` (`bun install --frozen-lockfile`) | **PASS** | **PASS** |
| `step-03` | `typecheck-and-full-test-suite` (`tsc --noEmit` + `bun test`) | **PASS** (`286/286`) | **PASS** (`294/294`) |
| `step-04` | `http-walkthrough-on-loopback-server` (E2E vòng đời hồ sơ qua HTTP `127.0.0.1`) | **PASS** | **PASS** |
| `step-05` | `permissions-and-tenant-isolation` (F-02 RBAC, chặn Clerk approve/export/override, chặn cross-tenant) | **PASS** | **PASS** |
| `step-06` | `synthetic-fixture-mode-is-explicit` (F-04 chặn regex giả khi tắt flag; bật flag khi seed) | **PASS** | **PASS** |
| `step-07` | `provenance-adversarial-attacks` (`7a..7f`: F-06, F-07 chống giả mạo biên bản cổng & chuỗi băm) | **PASS** | **PASS** |
| `step-08` | `gate-cli-matrix-expected-exit-codes` (`8a..8e`: mã thoát `0/1/2` của evaluator, verifier, seeder) | **PASS** | **PASS** |
| `step-09` | `backup-verify-restore-recheck` (F-13 sao lưu -> xác minh -> xóa -> khôi phục -> kiểm tra manifest) | **PASS** | **PASS** |
| `step-10` | `manifest-tampering-detection` (F-05 sửa 1 byte PDF hoặc sửa SQLite -> `409 MANIFEST_INTEGRITY_VIOLATION`) | **PASS** | **PASS** |
| **Tổng cộng** | **Tổng số phép kiểm tra tự động trong Harness** | **`89/89 PASS` (`0` fail, `0` skip)** | **`89/89 PASS` (`0` fail, `0` skip)** |

Log chi tiết được lưu ngoài cây nguồn tại:
- Tree A: `/tmp/durios-stage0-verify-20261102/logs/tree-a-acceptance/HARNESS-SUMMARY.txt`
- Tree B: `/tmp/durios-stage0-verify-20261102/logs/tree-b-acceptance/HARNESS-SUMMARY.txt`

---

## 4. Nghiệm Thu Giao Diện Trên Trình Duyệt Google Chrome Thật & DOM Probe

### 4.1. DOM Render Probe (`ui-render-probe.mjs`)
Chạy tại `/tmp/durios-stage0-verify-20261102/ui-probe`:
- `Probe A` (Topbar, role selector, auth dialog, create dialog, skip link): **PASS**
- `Probe B` (Empty state KPI cards: `0/5 CỔNG ĐỦ BẰNG CHỨNG`, `Kiểm tra tự động (máy chấm được): 2/5`, `TỔNG HỢP (SYNTHETIC)`): **PASS**
- `Probe C` (5 container diễn tập hiển thị trong sidebar): **PASS**
- `Probe D` (Chi tiết hồ sơ, 4 bước quy trình, bảng trường HITL, thẩm định GACC, kiểm toán chuỗi băm): **PASS**
- `Probe E` (RBAC theo vai trò: `CLERK` bị khóa nút phê duyệt/override/cấp quyền chia sẻ; `MANAGER` mở khóa): **PASS**
- `Probe F` (Kiểm tra định dạng container ISO 6346 trực tiếp trên form tạo mới): **PASS**
- `Probe G` (Thu gọn/mở rộng danh sách hồ sơ ở màn hình hẹp): **PASS**
- **Tổng kết:** `7/7 PASS`, `0 runtime errors`.

### 4.2. Kiểm thử trình duyệt Google Chrome thật (`browser-ui-verify.mjs`)
Khởi chạy máy chủ thật `src/server/server.ts` trên `http://127.0.0.1:3123` với DB diễn tập `/tmp/durios-stage0-verify-20261102/ui-db-fresh/durios-ui.db` (tắt `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=false` để kiểm tra chặn 403), điều khiển bằng Google Chrome Headless qua `playwright-core`:

| Mã Check | Hạng mục kiểm tra | Kết quả | Chi tiết đo đạc thực tế |
|---|---|---|---|
| `UI-K-12` | Thuộc tính `<html lang="vi">` và dấu tiếng Việt | **PASS** | `lang=vi` |
| `UI-N-01-META` | Thẻ `<meta name="viewport">` chuẩn responsive | **PASS** | `width=device-width, initial-scale=1.0` |
| `UI-D-01` | Thanh điều hướng trên cùng hiển thị trạng thái kết nối, vai trò, nút diễn tập và đăng nhập | **PASS** | `Máy chủ cục bộ: đã kết nối`, `CLERK`, `Diễn tập 5 Cont`, `Đăng nhập Pilot` |
| `UI-D-03` | Không tràn ngang ở Desktop `1280x800` | **PASS** | `scrollWidth (1280) <= clientWidth (1280)` |
| `UI-K-01-02` | Phím `Tab` đầu tiên focus đúng vào `.skip-link` | **PASS** | `activeElement.classList.contains("skip-link") === true` |
| `UI-E-10` | Bấm nút `"Diễn tập 5 Cont"` khi tắt `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP` bị chặn `403` và báo lỗi rõ ràng | **PASS** | Hiển thị thông báo từ chối `Rehearsal bootstrap is disabled on this instance...` |
| `UI-E-01` | Nhập sai mật khẩu giữ nguyên `#auth-dialog[open]` và báo lỗi xác thực | **PASS** | `modalOpen: true`, thông báo `Đăng nhập thất bại: Invalid username or password.` |
| `UI-D-07` | Đăng nhập `clerk.cailay` hợp lệ đóng modal, đồng bộ vai trò `CLERK` và nạp `5` hồ sơ | **PASS** | `modalOpen: false`, `roleSelectValue: "CLERK"`, `dossierCount: "5"` |
| `UI-D-02` | Nút thu gọn/mở rộng danh sách hồ sơ (`#dossier-nav-toggle`) hoạt động đúng | **PASS** | Nhãn chuyển đổi `Thu gọn -> Hiện danh sách` |
| `UI-D-04-05` | Hiển thị đồng thời 2 bộ đếm cổng độc lập (`0/5 CỔNG ĐỦ BẰNG CHỨNG` và `Kiểm tra tự động (máy chấm được): 2/5`) | **PASS** | Khớp cả 2 chuỗi trên vùng KPI chính |
| `UI-S-01-06` | Nhãn trạng thái dữ liệu `TỔNG HỢP (SYNTHETIC)` và cảnh báo bằng chứng diễn tập không thay thế xác nhận thực địa | **PASS** | Hiển thị rõ ràng trên thẻ KPI và vùng cổng |
| `UI-D-06` | Danh sách điều kiện xuất có `aria-label="Điều kiện phê duyệt và xuất"` | **PASS** | `ul.gate-list[aria-label="Điều kiện phê duyệt và xuất"]` |
| `UI-E-04` | Mở hồ sơ container chi tiết với vai trò `CLERK` không bị tràn ngang | **PASS** | `hasDossierHeader: true`, `horizontalOverflow: false` |
| `UI-E-02` | Nhập mã container sai chuẩn ISO 6346 (`MSKU123456`) bị chặn ngay tại form với thông báo lỗi tiếng Việt | **PASS** | `Số container cần gồm 4 chữ cái và 7 chữ số (ISO 6346).` |
| `UI-K-04` | Nhấn phím `Escape` đóng hộp thoại `<dialog>` | **PASS** | `closedOnEsc: true` |
| `UI-N-09` | Giao diện Tablet `768x1024` không bị tràn ngang | **PASS** | `scrollWidth (768) === clientWidth (768)` |
| `UI-N-01` | Giao diện Mobile `360x640` không bị tràn ngang | **PASS** | `scrollWidth (360) === clientWidth (360)` |
| `UI-N-03` | Ô chọn vai trò ở `360x640` đạt kích thước chạm (`height: 30px`, `width: 282px`) và nằm gọn trong khung nhìn | **PASS** | `roleFitsViewport: true` |
| `UI-D-09` | Không có bất kỳ lỗi JavaScript không bắt được (`pageerror`) nào trong suốt phiên thao tác | **PASS** | `pageErrors = 0` |

### 4.3. Danh sách ảnh chụp màn hình nghiệm thu (`docs/reports/claude-stage0-20261102/screenshots/`)
1. `01-desktop-1280x800-anonymous-initial.png` — Màn hình khởi đầu `1280x800` khi chưa đăng nhập.
2. `02-desktop-login-modal-error-state.png` — Hộp thoại đăng nhập giữ mở và hiển thị lỗi khi nhập sai mật khẩu.
3. `03-desktop-1280x800-kpi-and-dual-gate-counters.png` — Bảng KPI hiển thị rõ `0/5 CỔNG ĐỦ BẰNG CHỨNG`, `Kiểm tra tự động (máy chấm được): 2/5` và `TỔNG HỢP (SYNTHETIC)`.
4. `04-desktop-1280x800-dossier-detail-clerk.png` — Giao diện chi tiết hồ sơ container với phân quyền `CLERK`.
5. `05-desktop-iso6346-validation-error.png` — Bắt lỗi định dạng số container ISO 6346 trực tiếp trên hộp thoại tạo hồ sơ.
6. `06-tablet-768x1024-dossier-detail.png` — Bố cục Tablet `768x1024` (`scrollWidth = 768`).
7. `07-mobile-360x640-dossier-detail.png` — Bố cục Mobile `360x640` (`scrollWidth = 360`).
8. `08-mobile-360x640-sidebar-collapsed.png` — Trạng thái thu gọn danh sách hồ sơ trên màn hình `360x640`.
