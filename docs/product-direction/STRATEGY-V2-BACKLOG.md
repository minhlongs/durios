# DuriOS Danh Mục Hạng Mục Thực Thi Chiến Lược V2 (Backlog v2.0)

**Mã tài liệu:** `docs/product-direction/STRATEGY-V2-BACKLOG.md`  
**Ngày cập nhật:** 2026-10-17  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW**  
**Căn cứ phân loại:** Theo 4 nhóm ưu tiên nghiêm ngặt (`NOW` / `NEXT` / `LATER` / `NOT_AUTHORIZED`).

---

## 1. Nhóm Hạng Mục Thực Hiện Ngay (NOW — Stage 0 Pilot Readiness)

| Mã ID | Hạng mục công việc | Stage | Owner Role | Phụ thuộc bằng chứng (Evidence Dependency) | Tiêu chí nghiệm thu (Acceptance Criteria) | Quyền phê duyệt |
|---|---|---|---|---|---|---|
| **NOW-01** | Trình duyệt văn bản lựa chọn địa điểm vựa Cai Lậy | Stage 0 | Founder / CEO | Báo cáo khảo sát vựa Cai Lậy (`01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`) | Founder ký duyệt văn bản chọn vựa chính thức và giao tiếp cận | Founder |
| **NOW-02** | Ký văn bản chấp thuận xử lý dữ liệu (DPA) | Stage 0 | Legal & Ops | Bản dự thảo DPA tuân thủ Nghị định 13/2023/NĐ-CP và Luật 91/2025/QH15 | Vựa ký văn bản đồng ý bằng văn bản có dấu đỏ hoặc chữ ký số | Legal Counsel & Founder |
| **NOW-03** | Diễn tập phục hồi dữ liệu SQLite và mã hóa ổ cứng | Stage 0 | Engineering | Runbook an ninh bảo mật (`03_SECURITY_AND_ONPREM_RUNBOOK.md`) | Phục hồi thành công cơ sở dữ liệu từ bản backup trong $< 10$ phút | Engineering Lead |
| **NOW-04** | Hoàn tất nạp credential staging nhà mạng OTP (ZNS/SMS) | Stage 0 | Engineering | Báo cáo đánh giá nhà mạng OTP (`02_OTP_PROVIDER_EVALUATION.md`) | Gửi và xác thực thành công mã OTP test trên môi trường staging | Product Lead |
| **NOW-05** | Diễn tập hai kịch bản blind test bằng dữ liệu tổng hợp | Stage 0 | Ops & Eng | Giao thức blind test (`VALIDATION-AND-ECONOMICS-V2.md`) | Phát hiện 100% lỗi gài số container và số seal, mean $<5$ phút | Product Lead |
| **NOW-06** | Đo lường 4 chỉ số thực địa từ container đầu tiên | Stage 0 | Engineering | Bộ đánh giá KPI mở rộng (`pilot-kpi-evaluator.ts`) | Xuất đầy đủ: phút tiết kiệm, điểm chạm, ngoại lệ phát hiện, thiệt hại ngăn chặn | Product Lead |

---

## 2. Nhóm Hạng Mục Kế Tiếp (NEXT — Stage 1 Cluster Việt Nam & Verified Profile)

| Mã ID | Hạng mục công việc | Stage | Owner Role | Phụ thuộc bằng chứng (Evidence Dependency) | Tiêu chí nghiệm thu (Acceptance Criteria) | Quyền phê duyệt |
|---|---|---|---|---|---|---|
| **NEXT-01** | Đóng gói bộ cài đặt vựa tự động (Single-Command Installer) | Stage 1 | Engineering | Nghiệm thu pilot 5 container tại Cai Lậy thành công | Cài đặt và cấu hình hoàn tất vựa mới trên máy tính nội bộ trong $\le 2$ giờ | Engineering Lead |
| **NEXT-02** | Xây dựng công cụ đồng bộ cập nhật phần mềm offline an toàn | Stage 1 | Engineering | NEXT-01 và quy trình kiểm thử phiên bản | Cập nhật bản vá mã nguồn qua USB/LAN có kiểm tra chữ ký băm SHA-256 | Engineering Lead |
| **NEXT-03** | Trình biên dịch DuriOS Verified Profile (Federated Trust) | Stage 1 | Engineering | Dữ liệu đối soát container tích lũy | Xuất hồ sơ uy tín không để lộ supplier, giá mua hay margin của vựa | Engineering Lead |
| **NEXT-04** | Xây dựng Cluster dày đặc ĐBSCL (8 vựa + 3 exporter + 2 lab) | Stage 1 | Sales & Ops | Thành công pilot Cai Lậy | Tạo mật độ mạng lưới liên kết giữa các tổ chức đối tác chung | Founder |

---

## 3. Nhóm Hạng Mục Tương Lai (LATER — Stage 2 & 3 Closed Network & ASEAN Adapters)

| Mã ID | Hạng mục công việc | Stage | Owner Role | Phụ thuộc bằng chứng (Evidence Dependency) | Tiêu chí nghiệm thu (Acceptance Criteria) | Quyền phê duyệt |
|---|---|---|---|---|---|---|
| **LATER-01** | Phòng Giao Dịch Xác Minh Kín (Verified Trade Rooms) | Stage 2 | Product & Eng | Vượt qua cổng `PLATFORM-01` (ít nhất 3 vựa trả phí) | Bên mua và bên bán tạo RFQ máy đọc được, đối soát chứng từ trong phòng kín | Founder & Product Lead |
| **LATER-02** | Country Compliance Adapter: Malaysia $\rightarrow$ China (`MY_CN`) | Stage 2 | Engineering | Nghiên cứu Nghị định thư Malaysia-TQ 2024 (52 cơ sở) | Module thích ứng quy chuẩn kiểm dịch và đóng gói sầu riêng tươi Malaysia | Engineering Lead |
| **LATER-03** | Tích hợp điều phối trạng thái ký quỹ với Ngân hàng thương mại | Stage 3 | Eng & Legal | Vượt qua cổng `PLATFORM-03`; rà soát NĐ 52/2024/NĐ-CP | Ngân hàng giải ngân khi nhận tín hiệu container đã `EXPORTED` | Founder & Legal Counsel |
| **LATER-04** | Country Compliance Adapter: Thái Lan $\rightarrow$ China (`TH_CN`) | Stage 3 | Engineering | Mở rộng thị phần nhu cầu từ thương nhân nhập khẩu TQ | Kiểm soát độ khô (dry matter), sâu bọ và mã DOAVN | Founder |

---

## 4. Nhóm Hạng Mục Cấm Tuyệt Đối (NOT_AUTHORIZED — Out of Scope)

*Bất kỳ việc phát triển nào thuộc nhóm này đều bị nghiêm cấm trong giai đoạn hiện tại; cờ tính năng (Feature Flag) tắt cũng không được phép xây dựng trước trong mã nguồn.*

1. **NOT-AUTH-01: Mở sàn thương mại điện tử công khai (Open Public Marketplace):** Không tạo giao diện cho người lạ tự đăng ký bán sầu riêng công khai khi chưa có giấy phép sàn giao dịch TMĐT theo quy định của Bộ Công Thương.
2. **NOT-AUTH-02: Giữ tiền hoặc cung cấp dịch vụ trung gian thanh toán (Holding Funds / Custody):** DuriOS tuyệt đối không mở tài khoản thu hộ, không giữ tiền cọc, không phát hành ví điện tử hay token. Mọi giao dịch tiền bạc thuộc thẩm quyền của các tổ chức tài chính được Ngân hàng Nhà nước cấp phép.
3. **NOT-AUTH-03: Tự động hóa phê duyệt bằng AI không có con người:** Không cho phép AI tự động ký duyệt hồ sơ xuất khẩu, tự động giải ngân hay tự động thông quan mà không có xác nhận bằng tay của con người có thẩm quyền.
4. **NOT-AUTH-04: Đẩy dữ liệu khách hàng thật lên đám mây công cộng (Public Cloud / LLM Training):** Tuyệt đối không đưa chứng từ thật của vựa vào các mô hình học máy công cộng hoặc lưu trữ trên các máy chủ không có mã hóa tại chỗ.
