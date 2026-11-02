# Các Hạng Mục Còn Lại & Blocker Thực Địa Trước Khi Nạp Dữ Liệu Khách Hàng Thật (`REMAINING-WORK.md`)

- **Ngày cập nhật:** `2026-11-02`
- **Trạng thái kỹ thuật phần mềm (Engineering Stage 0):** **100% HOÀN TẤT (`294/294 tests pass`, `89/89 acceptance checks pass`, `19/19 browser UI checks pass`)**
- **Trạng thái cổng vận hành khai trương (`GATE-01..GATE-05`):** **`0/5 CỔNG ĐỦ BẰNG CHỨNG` (`HOLD_PENDING_EXTERNAL_EVIDENCE`)** — `2/5` tiêu chí máy chấm tự động đạt (`GATE-01` tài liệu mẫu tồn tại, `GATE-05` ngưỡng diễn tập đạt trên DB tổng hợp).

> **Nguyên tắc bất di bất dịch:** Máy chấm (`machineCheck`) không bao giờ thay thế bằng chứng thực địa (`externalEvidence`). Trước khi cả 5 cổng có biên bản/chữ ký thật của con người và được **Founder** trực tiếp ghi nhận bằng lệnh `pilot-gate-evidence-cli.ts` trên cơ sở dữ liệu vận hành sạch (không chứa bất kỳ sự kiện `SYNTHETIC_REHEARSAL` nào), **tuyệt đối không nạp chứng từ thương mại, PII hoặc con dấu thật của khách hàng vào hệ thống.**

---

## 1. Bảng Blocker Thực Địa Theo Từng Cổng (`GATE-01` .. `GATE-05`)

| Cổng | Tên Cổng | Trạng thái Máy Chấm | Trạng thái Bằng Chứng Vận Hành | Người Chịu Trách Nhiệm Thực Hiện | Hành Động Cụ Thể Cần Con Người Thực Hiện |
|---|---|---|---|---|---|
| **GATE-01** | Văn bản chấp thuận xử lý dữ liệu & bảo mật (Data Permission & Consent) | `PASS` *(mẫu văn bản đã có trong `docs/pilot-readiness/04_...`)* | `PENDING_OPERATOR_EVIDENCE` | **Founder + Chủ vựa Cai Lậy** | In, điền thông tin pháp nhân vựa Cai Lậy, ký tươi + đóng dấu hai bên vào biên bản chấp thuận xử lý dữ liệu theo Nghị định 13/2023/NĐ-CP; scan PDF lưu trữ và lấy mã băm SHA-256 của bản scan để Founder ghi nhận vào DB vận hành. |
| **GATE-02** | Xác thực người dùng & Kênh OTP vận hành (Identity, RBAC & OTP) | `FAIL` *(khi chưa tạo tài khoản vận hành thật trên DB sạch)* | `PENDING_OPERATOR_EVIDENCE` | **Founder / Kỹ sư triển khai tại vựa** | Khởi tạo DB vận hành mới hoàn toàn (không chạy `pilot:seed-rehearsal`); tạo tài khoản thật cho Clerk và Manager của vựa bằng mật khẩu riêng biệt (không dùng `clerk.cailay` / `manager.cailay` — đã bị chặn bởi `F-16`); cấu hình kênh OTP hoặc ghi biên bản bàn giao thông tin đăng nhập trực tiếp tại vựa. |
| **GATE-03** | An ninh hạ tầng On-Premise & Chuỗi băm kiểm toán (Host Security & Loopback) | `FAIL` *(yêu cầu kiểm tra thực tế trên máy trạm vựa)* | `PENDING_OPERATOR_EVIDENCE` | **Kỹ sư hạ tầng / Founder** | Trên máy chủ đặt tại vựa Cai Lậy: (1) Bật mã hóa ổ đĩa (FileVault trên macOS hoặc LUKS trên Linux); (2) Cấu hình Caddy/Nginx reverse proxy TLS nội bộ trỏ về `127.0.0.1:3000`; (3) Đặt quyền tệp `chmod 0600` cho tệp `.env` và tệp SQLite; (4) Chụp/xuất biên bản cấu hình hạ tầng. |
| **GATE-04** | Sao lưu dự phòng & Diễn tập khôi phục trên máy đích (Backup & Restore Drill) | `FAIL` *(trên DB mới khi chưa có gói backup đầu tiên)* | `PENDING_OPERATOR_EVIDENCE` | **Kỹ sư vận hành tại vựa** | Trên máy trạm đặt tại vựa: chạy `backup-site`, `verify-backup`, và `restore-site` sang một thư mục kiểm chứng độc lập + đồng bộ bản sao lưu ra ổ cứng gắn ngoài/kho lưu trữ ngoại vi đã mã hóa; lưu nhật ký thực thi làm bằng chứng `GATE-04`. |
| **GATE-05** | Nghiệm thu thực địa 5 Container & Bấm giờ độc lập (5-Container Stopwatch & Blind-Fault Drill) | `PASS` *(trên DB tổng hợp)* / `FAIL` *(trên DB mới)* | `PENDING_OPERATOR_EVIDENCE` | **Nhân viên chứng từ vựa (Clerk) + Quản lý vựa (Manager) + Người bấm giờ độc lập** | Nhân viên vựa trực tiếp thao tác 5 bộ hồ sơ diễn tập (trong đó có 2 lỗi gài mù: lệch khối lượng > 2.5% và thiếu chứng thư kiểm dịch thực vật) dưới sự giám sát bấm giờ bằng đồng hồ bấm giây độc lập (`HUMAN_STOPWATCH_ATTESTED`), ký biên bản xác nhận thời gian trung bình `< 300s/cont` và bắt đúng `2/2` lỗi gài mù. |

---

## 2. Những Việc Cần Founder Quyết Định Hoặc Cấp Quyền Tiếp Theo

1. **Phê duyệt hợp nhất nhánh `stage0/arena-integration-20261102` vào `main` local (và có push lên remote hay không):**
   - Hiện tại mọi thay đổi đã được commit sạch sẽ trên nhánh `stage0/arena-integration-20261102` tại worktree `/Users/macbook/durios/.claude/worktrees/stage0-arena-integration`.
   - Nhánh `main` tại `/Users/macbook/durios` vẫn giữ nguyên tại `08992f6` theo đúng quy tắc bảo toàn.
2. **Xác nhận có cần thu thập lại tệp `durios-stage0-handover-20261101-r4.tar.gz` từ máy xuất của Arena hay không:**
   - Về mặt kỹ thuật, toàn bộ nội dung sửa lỗi của `r4` (`F-16` và `F-17` cùng `+14` bài test hồi quy) đã được chúng tôi cài đặt và kiểm chứng xanh 100% trên `stage0/arena-integration-20261102`. Tuy nhiên, nếu Founder muốn lưu trữ bản tarball vật lý `r4` (`SHA-256: 57157c34...`) vào kho lưu trữ đối chiếu lịch sử, cần chép tệp đó từ môi trường xuất của Arena về máy.
3. **Ký và ghi nhận bằng chứng mở cổng (`GATE-01..GATE-05`) tại vựa Cai Lậy:**
   - Theo thiết kế bảo mật `F-06`/`F-07`, chỉ tài khoản có vai trò `FOUNDER` trên cơ sở dữ liệu vận hành sạch mới được phép chạy `pilot-gate-evidence-cli.ts` để chuyển trạng thái các cổng sang `EVIDENCED_FOR_LAUNCH`.
