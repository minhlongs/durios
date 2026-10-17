# Danh Mục Rà Soát Bảo Mật & Sổ Tay Vận Hành On-Premise Một Vựa

**Mã tài liệu:** `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`  
**Ngày phát hành:** 2026-10-14  
**Phạm vi:** Triển khai máy chủ cục bộ tại 01 vựa đóng gói (Single-Site Local-First On-Premise)

---

## 1. Danh Mục Rà Soát Bảo Mật Trước Pilot (Pre-Pilot Security Checklist)

Mọi mục dưới đây phải đạt trước khi nạp dữ liệu thật tại vựa:

| Hạng mục | Yêu cầu kiểm soát | Cách xác minh |
|---|---|---|
| **1. Xác thực & Cô lập Tenant** | - Không tin tưởng bất kỳ header/query định danh nào từ client (`x-actor-*`, `?role=`, `?tenantId=`).<br>- Mọi tài khoản phải thuộc đúng 1 trong 5 bộ ba `(ProductPersona, TenantType, UserRole)` hợp lệ.<br>- Hồ sơ của vựa chỉ hiển thị cho nhân sự cùng `tenantId` hoặc đối tác được cấp `ShareAccessGrant` còn hạn. | Chạy `bun test test/server-auth-5a1.test.ts test/rbac-and-tuples-5a2.test.ts` (đạt 100%). |
| **2. Loopback Bind & Lớp HTTPS Reverse Proxy** | - Tiến trình Bun chỉ lắng nghe tại `127.0.0.1:3000` (`DURIOS_HOST=127.0.0.1`).<br>- Chạy với `NODE_ENV=production` để cookie phiên luôn bật cờ `HttpOnly; SameSite=Strict; Secure`.<br>- Người dùng trong vựa truy cập qua Reverse Proxy (Caddy/Nginx) lắng nghe HTTPS (cổng `443`) với chứng chỉ TLS nội bộ (mkcert / Internal CA hoặc Tailscale HTTPS). | Kiểm tra `lsof -i :3000` chỉ hiển thị `127.0.0.1:3000`; kiểm tra header `Set-Cookie` có `Secure; HttpOnly; SameSite=Strict`. |
| **3. Giới hạn Mạng Riêng (Network ACL)** | - Máy chủ chỉ cho phép kết nối tới cổng `443` từ dải IP LAN bàn giấy của vựa hoặc mạng VPN riêng (WireGuard/Tailscale ACL).<br>- Chặn toàn bộ truy cập trái phép từ Wi-Fi khách hoặc Internet công cộng. | Kiểm tra cấu hình tường lửa (`pf` trên macOS / `ufw` trên Linux) chỉ mở `443/tcp` cho subnet nội bộ. |
| **4. Bảo vệ Secrets** | - Không truyền mật khẩu qua tham số dòng lệnh `--password` (CLI tự động chặn).<br>- Tệp biến môi trường (`/etc/durios/pilot.env` hoặc tương đương) được đặt quyền `chmod 0600`, thuộc sở hữu riêng của user chạy dịch vụ. | Kiểm tra `stat` trên tệp `.env` xác nhận quyền `0600`; không có secret trong Git hoặc log. |
| **5. Mã hóa Thiết bị & Bản sao lưu** | - Bật mã hóa toàn bộ ổ đĩa máy chủ đặt tại vựa (**FileVault** trên macOS Mini hoặc **LUKS** trên Linux).<br>- Mỗi bản sao lưu xuất ra ngoài thư mục máy chủ phải được đóng gói và mã hóa đối xứng (`openssl enc -aes-256-cbc -pbkdf2` hoặc `age`) trước khi lưu sang ổ cứng dự phòng. | Kiểm tra `fdesetup status` (`FileVault is On`) hoặc `cryptsetup status`. |

---

## 2. Cấu Hình Máy Chủ & Reverse Proxy Mẫu Tại Vựa

### 2.1. Biến môi trường dịch vụ (`/etc/durios/pilot.env`, quyền `0600`)
```ini
NODE_ENV=production
DURIOS_HOST=127.0.0.1
DURIOS_PORT=3000
DURIOS_DB_PATH=/var/lib/durios/data/durios.db
DURIOS_DATA_DIR=/var/lib/durios/data/uploads
```

### 2.2. Cấu hình Caddy Reverse Proxy (HTTPS nội bộ $\rightarrow$ Loopback)
```caddyfile
durios-pilot.local {
    tls internal
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-Proto https
    }
}
```

---

## 3. Quy Trình Khởi Tạo Tài Khoản & Onboarding Tại Vựa

Sử dụng công cụ nội bộ `src/auth/pilot-ops-cli.ts` trực tiếp trên máy chủ tại vựa (không mở trang đăng ký công khai):

1. **Tạo tài khoản Quản lý vựa (`PACKHOUSE_MANAGER`):**
   ```bash
   DURIOS_PILOT_PASSWORD='<mật_khẩu_mạnh>' bun run src/auth/pilot-ops-cli.ts provision-account \
     --db /var/lib/durios/data/durios.db \
     --username mgr_cailay01 \
     --name "Quản lý Vựa Cai Lậy 01" \
     --phone "+84901000111" \
     --tenant TENANT-CAILAY-01 \
     --tenant-type PACKHOUSE_EXPORTER \
     --role MANAGER \
     --persona PACKHOUSE_MANAGER
   ```
2. **Tạo tài khoản Thư ký chứng từ (`PACKHOUSE_CLERK`):**
   ```bash
   DURIOS_PILOT_PASSWORD='<mật_khẩu_mạnh>' bun run src/auth/pilot-ops-cli.ts provision-account \
     --db /var/lib/durios/data/durios.db \
     --username clerk_cailay01 \
     --name "Thư ký Chứng từ 01" \
     --phone "+84901000222" \
     --tenant TENANT-CAILAY-01 \
     --tenant-type PACKHOUSE_EXPORTER \
     --role CLERK \
     --persona PACKHOUSE_CLERK
   ```
3. **Cấp Managed Pilot Token cho máy trạm cố định tại bàn giấy:**
   ```bash
   bun run src/auth/pilot-ops-cli.ts issue-token \
     --db /var/lib/durios/data/durios.db \
     --account-id <ID_TÀI_KHOẢN> \
     --device "PC-BAN-GIAY-01" \
     --expires-at "2026-12-31T23:59:59.000Z"
   ```

---

## 4. Quy Trình Sao Lưu, Kiểm Tra & Khôi Phục Thảm Họa (Backup & Restore SOP)

### 4.1. Sao lưu nóng hàng ngày (cuối mỗi ca đóng container)
Lệnh `backup-site` sử dụng `VACUUM INTO` để chụp nóng SQLite WAL cùng toàn bộ `storage/blobs/{sha256}.bin` và tự động kiểm tra chuỗi băm kiểm toán:
```bash
bun run src/auth/pilot-ops-cli.ts backup-site \
  --db /var/lib/durios/data/durios.db \
  --data-dir /var/lib/durios/data/uploads \
  --backup-dir /var/backups/durios/backup-$(date +%Y%m%d-%H%M%S)
```

### 4.2. Xác minh tính toàn vẹn của bản sao lưu
```bash
bun run src/auth/pilot-ops-cli.ts verify-backup \
  --backup-dir /var/backups/durios/backup-YYYYMMDD-HHMMSS
```

### 4.3. Quy trình khôi phục khi gặp sự cố (Restore SOP)
1. Dừng tiến trình máy chủ DuriOS để đóng các kết nối vào file DB đích.
2. Chạy lệnh khôi phục có xác minh trước và sau khi ghi:
   ```bash
   bun run src/auth/pilot-ops-cli.ts restore-site \
     --backup-dir /var/backups/durios/backup-YYYYMMDD-HHMMSS \
     --target-db /var/lib/durios/data/durios.db \
     --target-data-dir /var/lib/durios/data/uploads
   ```
3. Khởi động lại dịch vụ DuriOS và kiểm tra `GET /api/auth/me` + `GET /api/v1/dossiers`.

---

## 5. Xử Lý Sự Cố Tại Chỗ (Incident Response Playbook)

- **Sự cố 1 — Mất đường truyền Internet ra ngoài tại vựa (không gửi được OTP Zalo/SMS):**
  - Mạng LAN nội bộ tại vựa vẫn hoạt động bình thường. Nhân viên chuyển sang đăng nhập bằng **Password + Session Cookie** hoặc sử dụng máy trạm đã cài **Managed Pilot Token** để không gián đoạn việc đóng container.
- **Sự cố 2 — Thất lạc thiết bị hoặc nghi ngờ lộ phiên/token:**
  - Chạy ngay lệnh thu hồi tức thì trên máy chủ:
    - Thu hồi thiết bị: `bun run src/auth/pilot-ops-cli.ts revoke-token --db ... --token-id <MPT_ID> --reason "Lost device"`
    - Thu hồi phiên: `bun run src/auth/pilot-ops-cli.ts revoke-session --db ... --session-id <SES_ID> --reason "Security rotation"`
- **Sự cố 3 — Lỗi ổ đĩa hoặc hỏng tệp dữ liệu:**
  - Thực hiện khôi phục từ bản sao lưu gần nhất theo Mục 4.3 (mục tiêu RPO $\le 1$ ca làm việc, RTO $\le 15$ phút).
