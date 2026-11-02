# Quy Trình Cutover, Kiểm Tra Trước Giờ G & Rollback Cho 1 Vựa Cai Lậy (`CUTOVER-CHECKLIST.md`)

- **Phạm vi áp dụng:** Triển khai On-Premise cho đúng **01 vựa đóng gói tại Cai Lậy, Tiền Giang (`SITE-CAILAY-TIENGIANG-01`)** theo chuẩn Stage 0 V1.
- **Điều kiện tiên quyết:** Tuyệt đối chỉ chuyển sang Bước 3 (Nạp dữ liệu vận hành thật) sau khi lệnh `bun run src/auth/pilot-launch-gate-verifier.ts --db "$DURIOS_DB_PATH"` trả về `goForLiveCustomerData: true` (`5/5` cổng đạt `EVIDENCED_FOR_LAUNCH`).

---

## 1. Cấu Hình Biến Môi Trường Chuẩn Vận Hành (Production On-Premise `.env`)

Trên máy trạm đặt tại vựa Cai Lậy, tạo tệp cấu hình riêng biệt (ví dụ `/var/lib/durios/config/durios.env`, quyền truy cập `chmod 0600`):

```bash
# 1. Ràng buộc mạng nội bộ (GATE-03: chỉ lắng nghe trên loopback)
DURIOS_HOST=127.0.0.1
DURIOS_PORT=3000

# 2. Đường dẫn cơ sở dữ liệu & thư mục lưu trữ chứng từ tách biệt khỏi thư mục mã nguồn
DURIOS_DB_PATH=/var/lib/durios/prod/durios-cailay.db
DURIOS_DATA_DIR=/var/lib/durios/prod/uploads
DURIOS_BACKUP_DIR=/var/lib/durios/backups

# 3. Cờ bảo mật vận hành (BẮT BUỘC TẮT toàn bộ cờ diễn tập & giả lập)
DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=false
DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=false
DURIOS_ALLOW_HEADER_ACTOR_OVERRIDE=false
```

> **Kiểm tra an toàn (`F-16`):** Với cấu hình trên, mọi nỗ lực tạo hoặc đăng nhập bằng tài khoản diễn tập công khai (`clerk.cailay`, `manager.cailay`, `ACC-CAILAY-CLERK-01`, `ACC-CAILAY-MGR-01`, `+84901000111`, `+84901000222`) sẽ bị `SqliteAuthService` chặn ngay lập tức.

---

## 2. Quy Trình Cutover Từng Bước (Step-by-Step Cutover)

### Bước 1: Kiểm tra mã nguồn & khóa phụ thuộc trên máy đích
```bash
bun install --frozen-lockfile
bun run typecheck
bun test
```
- **Tiêu chí đạt:** `0` lỗi biên dịch TypeScript, `294/294` bài kiểm thử xanh (`0 fail`).

### Bước 2: Khởi tạo cơ sở dữ liệu vận hành sạch & tài khoản thật (`GATE-02`)
> **CẢNH BÁO:** Không bao giờ chạy `pilot:seed-rehearsal` trên `$DURIOS_DB_PATH` của môi trường vận hành! Nếu chạy nhầm, chuỗi kiểm toán sẽ mang dấu vết `SYNTHETIC_REHEARSAL` (`F-07`) và khóa vĩnh viễn quyền `goForLiveCustomerData` trên tập dữ liệu đó.

```bash
# Tạo thư mục dữ liệu với quyền 0700
mkdir -p /var/lib/durios/prod/uploads /var/lib/durios/backups
chmod 0700 /var/lib/durios/prod /var/lib/durios/prod/uploads /var/lib/durios/backups

# Tạo tài khoản thật cho Nhân viên chứng từ (CLERK), Quản lý vựa (MANAGER) và Founder
# (Sử dụng tên đăng nhập, số điện thoại và mật khẩu mạnh riêng của vựa)
bun run src/auth/pilot-ops-cli.ts provision-account \
  --db /var/lib/durios/prod/durios-cailay.db \
  --account-id ACC-PROD-CLERK-01 \
  --username <ten_dang_nhap_clerk_that> \
  --display-name "<Ho Ten Clerk>" \
  --role CLERK \
  --tenant SITE-CAILAY-TIENGIANG-01 \
  --phone <so_dien_thoai_that> \
  --password "<MatKhauManhRiengBiet>"
```

### Bước 3: Thực hiện sao lưu đầu tiên & xác minh gói sao lưu (`GATE-04`)
```bash
bun run src/auth/pilot-ops-cli.ts backup-site \
  --db /var/lib/durios/prod/durios-cailay.db \
  --data-dir /var/lib/durios/prod/uploads \
  --out /var/lib/durios/backups/initial-cutover-backup \
  --actor-id ACC-PROD-MGR-01 \
  --tenant SITE-CAILAY-TIENGIANG-01

bun run src/auth/pilot-ops-cli.ts verify-backup \
  --backup /var/lib/durios/backups/initial-cutover-backup
```
- **Tiêu chí đạt:** `isValid: true`, `sqliteIntegrityOk: true`.

### Bước 4: Ghi nhận bằng chứng 5 cổng bởi Founder (`GATE-01` .. `GATE-05`)
Sau khi hoàn tất ký kết biên bản `GATE-01`, kiểm tra hạ tầng `GATE-03`, sao lưu `GATE-04` và bấm giờ thực địa `GATE-05`, Founder chạy lệnh ghi nhận chứng cứ cho từng cổng và kiểm tra lại trạng thái tổng thể:
```bash
bun run src/auth/pilot-launch-gate-verifier.ts \
  --db /var/lib/durios/prod/durios-cailay.db \
  --backup-dir /var/lib/durios/backups \
  --tenant SITE-CAILAY-TIENGIANG-01 \
  --require-go
```
- **Tiêu chí đạt:** Mã thoát `0`, `overallVerdict: "GO_STAGE_0_SINGLE_SITE"`, `goForLiveCustomerData: true`.

### Bước 5: Khởi chạy dịch vụ DuriOS sau Reverse Proxy nội bộ
```bash
set -a && source /var/lib/durios/config/durios.env && set +a
bun run src/server/server.ts
```
Kiểm tra nhanh trạng thái máy chủ:
```bash
curl -sSf http://127.0.0.1:3000/api/health
```

---

## 3. Quy Trình Rollback & Khôi Phục Khẩn Cấp (Emergency Rollback)

Nếu phát hiện bất kỳ lỗi phần mềm, sai lệch cấu hình hoặc đứt gãy chuỗi băm kiểm toán (`isChainValid: false`) trong quá trình vận hành tại vựa:

### Bước 1: Cô lập và dừng nhận yêu cầu ghi mới
Dừng tiến trình máy chủ `src/server/server.ts` đang chạy trên cổng `3000` (dùng đúng PID của tiến trình DuriOS, không dùng lệnh kill diện rộng).

### Bước 2: Bảo toàn hiện trường để phục vụ điều tra (Forensic Snapshot)
```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "/var/lib/durios/forensics/$TS"
cp -p /var/lib/durios/prod/durios-cailay.db* "/var/lib/durios/forensics/$TS/" 2>/dev/null || true
cp -Rp /var/lib/durios/prod/uploads "/var/lib/durios/forensics/$TS/uploads" 2>/dev/null || true
```

### Bước 3: Xác minh gói sao lưu gần nhất và khôi phục (`restore-site`)
```bash
# 1. Xác minh tính toàn vẹn của bản sao lưu trước khi bung
bun run src/auth/pilot-ops-cli.ts verify-backup \
  --backup /var/lib/durios/backups/<goi_backup_hop_le_gan_nhat>

# 2. Khôi phục sang thư mục đích sạch
bun run src/auth/pilot-ops-cli.ts restore-site \
  --backup /var/lib/durios/backups/<goi_backup_hop_le_gan_nhat> \
  --target-db /var/lib/durios/prod/durios-cailay.db \
  --target-data-dir /var/lib/durios/prod/uploads \
  --overwrite
```
- Nhờ bản sửa **`F-17`**, các lệnh `verify-backup` và `restore-site` chạy hoàn toàn độc lập với `SqliteAuthService` và không bao giờ tạo nhầm tệp `./data/durios.db` trong thư mục làm việc hiện hành.

### Bước 4: Tái kiểm tra toàn vẹn chuỗi băm và manifest trước khi mở lại dịch vụ
Khởi động lại máy chủ trên `127.0.0.1:3000`, gọi `GET /api/dossiers/:id/audit` (`isChainValid: true`) và `GET /api/dossiers/:id/manifest` trên các hồ sơ đã niêm phong để xác nhận không có lỗi `409 MANIFEST_INTEGRITY_VIOLATION` trước khi bàn giao lại cho nhân viên chứng từ vựa.
