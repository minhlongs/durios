# Pilot Kín Một Vựa — Hồ Sơ Sẵn Sàng & Cổng Khai Trương (Single-Site Readiness & Launch Gate)

**Mã tài liệu:** `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`  
**Ngày phát hành:** 2026-10-14  
**Trạng thái:** **READY FOR SINGLE-SITE LAUNCH GATE REVIEW**  
**Tài liệu nguồn sự thật:** `docs/product-direction/PRODUCT-PRD-V1.md` & `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (**APPROVED — Founder approval, 2026-10-14**)

---

## 1. Mục Đích & Phạm Vi Đợt Pilot Đầu Tiên

Tài liệu này quy định các cổng kiểm soát bắt buộc để đưa DuriOS từ trạng thái **đạt nghiệm thu kỹ thuật Prompt 5A** (`5A-1` đến `5A-6`) sang **chạy Pilot thực tế tại đúng 01 vựa đóng gói (Single-Site On-Premise)**.

- **Nguyên tắc cốt lõi:** Chưa cài đặt lên máy chủ khách hàng và chưa nạp bất kỳ chứng từ khách hàng thật nào cho đến khi toàn bộ 5 cổng chặn ở Mục 3 được đánh dấu **PASS**.
- **Ranh giới thương mại:** Mọi mức phí nêu trong `PRODUCT-PRD-V1.md` (phí Pilot 5 container, phí thuê bao năm, phí thiết lập) tiếp tục là **giả thuyết kiểm chứng thương mại (pricing hypothesis)**, không được trình bày như bảng giá thương mại cố định.
- **Ranh giới pháp lý & sản phẩm:**
  - Không mở B2B Marketplace hay Escrow (thuộc Cổng 3 / Prompt 6A).
  - Không triển khai lên Cloud công cộng và không mở rộng sang vựa thứ hai trong đợt đầu.
  - Không đưa ra bất kỳ cam kết thông quan hải quan (GACC / kiểm dịch cửa khẩu) và không tự nhận cấp hay xác minh chứng nhận hữu cơ (`duriosRecordStatus = "EVIDENCE_STORED_NOT_CERTIFIED"`).

---

## 2. Phương Án Chọn Địa Điểm Vựa Đầu Tiên (Trình Founder Phê Duyệt)

> **Quy tắc kiểm soát:** Xác nhận khả năng tiếp cận thực tế tại 01 vựa trước, sau đó trình Founder chốt; tuyệt đối **không tự ý đặt lịch hẹn chính thức hay chi tiêu ngân sách** trước khi Founder ký duyệt.

| Tiêu chí đối chiếu | **Phương án 1 (Đề xuất ưu tiên): Cai Lậy, Tiền Giang** | **Phương án 2 (Dự phòng / Đợt sau): Krông Pắc, Đắk Lắk** |
|---|---|---|
| **Mùa vụ đóng hàng thực tế (Tháng 10 – Tháng 12)** | **Đang vào vụ nghịch miền Tây (tháng 10 đến tháng 3 năm sau):** Có luồng container đóng hàng thực tế hàng tuần để đo KPI 5 container liên tục. | **Đã cuối/hết chính vụ Tây Nguyên (tháng 8 đến tháng 10):** Sản lượng đóng mới giảm mạnh sau tháng 10, rủi ro chờ đợi lâu mới đủ 5 container. |
| **Khả năng hỗ trợ kỹ thuật On-Prem tại chỗ** | Cách TP.HCM $\sim 1.5\text{–}2$ giờ đường bộ; Founder có thể trực tiếp cài đặt máy chủ, cấu hình mạng riêng, kiểm tra sao lưu và xử lý sự cố trong ngày. | Khoảng cách xa (cần di chuyển hàng không + đường bộ); chi phí đi lại và thời gian phản ứng khi có sự cố mạng/phần cứng cao hơn nhiều. |
| **Mật độ vựa xuất khẩu** | Tập trung nhiều cơ sở đóng gói có mã số PHC xuất chính ngạch qua cửa khẩu Hữu Nghị / Tân Thanh. | Tập trung các vựa lớn mùa chính vụ nhưng hoạt động theo đợt thu hoạch tập trung. |

**Đề xuất trình Founder:** Ưu tiên xác nhận tiếp cận **01 vựa tại Cai Lậy (Tiền Giang)** cho đợt Pilot đầu tiên; giữ **Krông Pắc (Đắk Lắk)** làm phương án dự phòng hoặc mở rộng ở giai đoạn tiếp theo.

---

## 3. Năm Cổng Chặn Khai Trương Pilot 01 Vựa (Go-Live Blocking Gates)

Pilot chỉ được phép chuyển sang trạng thái **GO FOR LIVE CUSTOMER DATA** khi cả 5 cổng dưới đây đều hoàn tất:

| Mã cổng | Hạng mục kiểm soát | Tiêu chí đạt (Pass Criteria) | Hồ sơ / Bằng chứng nghiệm thu | Trạng thái hiện tại |
|---|---|---|---|---|
| **GATE-01** | **Tiếp cận Vựa & Chấp thuận Dữ liệu** | 01 vựa xác nhận tiếp cận; Founder phê duyệt chọn site; chủ vựa ký Biểu mẫu Chấp thuận Sử dụng Dữ liệu trước khi nạp chứng từ thật. | `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` | **PENDING SITE & FOUNDER SIGN-OFF** |
| **GATE-02** | **Kênh OTP Thật (Zalo ZNS / SMS)** | Founder chọn nhà cung cấp từ báo cáo đánh giá; cấu hình `DURIOS_OTP_*` và gửi/nhận thành công OTP thật trên môi trường staging cho tài khoản thật. | `docs/pilot-readiness/02_OTP_PROVIDER_EVALUATION.md` + `src/auth/otp-provider.ts` (`HttpGatewayOtpProvider`) | **ADAPTER READY — PENDING PROVIDER CREDENTIALS** |
| **GATE-03** | **Bảo mật On-Prem, TLS & Giới hạn Mạng** | Ứng dụng bind `127.0.0.1:3000`; truy cập qua Reverse Proxy HTTPS (`NODE_ENV=production`); mạng riêng giới hạn; ổ đĩa và bản sao lưu được mã hóa; secrets lưu quyền `0600`. | `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` | **RUNBOOK & CONFIG VERIFIED** |
| **GATE-04** | **Chứng minh Sao lưu & Khôi phục (Backup/Restore Drill)** | Chạy `backup-site`, `verify-backup` và `restore-site` thành công trên môi trường staging; `verifyIntegrity() === true` và 100% blob khớp SHA-256 sau khôi phục. | `src/auth/site-backup-manager.ts` + `test/process-restart-persistence.test.ts` | **VERIFIED IN STAGING TESTS** |
| **GATE-05** | **Quy trình Đo KPI & Kiểm thử Staging Toàn trình** | Chốt quy trình bấm giờ (`< 5 phút/container` đạt, `< 3 phút/container` mục tiêu); kiểm thử staging qua đủ 3 phương thức đăng nhập, bắt 100% lỗi Container/Seal, 0 lỗi P0, `bun run typecheck` và `bun test` xanh 100%. | `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` + `bun test` | **VERIFIED IN STAGING TESTS** |

---

### 3.1. Cách đọc bảng tiêu chí: "máy chấm được" khác "cổng đã mở" (bổ sung 2026-10-30, không đổi tiêu chí)

Bảng ở mục 3 giữ nguyên. Phần bổ sung này chỉ nói rõ **hai nửa của mỗi tiêu chí**, vì bộ kiểm tra tự động (`src/auth/pilot-launch-gate-verifier.ts`) chỉ chứng minh được nửa thứ nhất:

| Mã cổng | Nửa MÁY CHẤM ĐƯỢC (hệ thống tự kiểm tra) | Nửa BẰNG CHỨNG VẬN HÀNH (con người phải ghi nhận) |
|---|---|---|
| **GATE-01** | Tệp tại `DURIOS_GATE01_CONSENT_FILE` **tồn tại** (không xác minh chữ ký) | Biên bản tiếp cận vựa do chủ vựa xác nhận; phê duyệt chọn site của Founder; Biểu mẫu chấp thuận dữ liệu (91/2025/QH15) **đã ký** |
| **GATE-02** | `DURIOS_OTP_*` đủ khởi tạo provider (`isConfigured`); **chưa gửi OTP thật** | Quyết định chọn nhà cung cấp của Founder; biên bản gửi/nhận OTP thật trên staging cho tài khoản thật |
| **GATE-03** | `DURIOS_HOST` là loopback (`assertLoopbackHostname`) && `auditLedger.verifyIntegrity() === true` | Reverse proxy HTTPS với `NODE_ENV=production`; giới hạn mạng riêng tại vựa; mã hóa ổ đĩa và bản sao lưu; secrets quyền `0600` |
| **GATE-04** | `verifySiteBackup(DURIOS_BACKUP_DIR).valid === true` (100% blob khớp SHA-256) | Diễn tập backup/verify/restore trên **máy vựa thật**; biên bản có người thực hiện ký; lịch sao lưu định kỳ đã chốt |
| **GATE-05** | ≥ 5 container && `meanDeltaSeconds < 300` && bắt 100% lỗi gài mù (`zeroMissGate`) | Biên bản bấm giờ của người vận hành (`HUMAN_STOPWATCH_ATTESTED`); ≥ 2 ca gài lỗi mù do người khác chuẩn bị; xác nhận 0 lỗi P0 còn mở |

Quy tắc suy ra, đã cài đặt trong mã nguồn và có kiểm thử hồi quy:

1. **Một cổng chỉ được coi là MỞ** khi **cả hai nửa** đúng. Báo cáo vì thế in **hai con số tách rời**: `machineChecksPassedCount` (số tiêu chí máy chấm đạt) và `operationalGatesEvidencedCount` (số cổng đủ bằng chứng). Chỉ con số thứ hai quyết định `goForLiveCustomerData`. Nhãn từng cổng: `EVIDENCED_FOR_LAUNCH` · `MACHINE_CHECK_ONLY` · `PENDING`.
2. **Ghi nhận bằng chứng là việc của con người; hệ thống chỉ lưu và nêu tên người ghi:** `DURIOS_GATE0X_EVIDENCE_FILE` (X = 1..5) kèm `DURIOS_GATE_EVIDENCE_ATTESTED_BY`, hoặc `gateEvidence: {"GATE-0X": {filePath, attestedBy}}` khi gọi qua code. Thiếu tên người ghi nhận thì tệp không được tính. Hệ thống **không** xác minh chữ ký, **không** xác nhận hiện trường, **không** tự ký thay ai; `EVIDENCED_FOR_LAUNCH` nghĩa là "đã có người ghi nhận bằng chứng", không phải "bằng chứng đã được thẩm định".
   - **Ai khai báo được:** không có endpoint HTTP nào nhận bằng chứng cổng (`handleGetPilotGates` gọi `evaluateWorkspaceLaunchGates(workspace, actor)` không truyền `gateEvidence`), nên chỉ (i) **môi trường của tiến trình server on-prem** — tức người có quyền shell trên máy chủ vựa — hoặc (ii) **người chạy CLI** `pilot:verify-gates` / `pilot:audit-pack` trong shell của họ. Một request API, dù mang token `MANAGER`/`ADMIN`/`AUDITOR`, không khai báo hay đính kèm được bằng chứng.
   - **Máy kiểm tra gì trên tệp khai báo:** đường dẫn phải **tồn tại** và là **tệp thường**; kích thước + **SHA-256** của bytes được ghi vào `externalEvidence.artifact` (tệp > 25 MB → `NOT_HASHED_FILE_TOO_LARGE`); phải có **tên người ghi nhận**. Đường dẫn bịa, thư mục, hoặc tệp vô danh ⇒ `PENDING_OPERATOR_EVIDENCE`. **Nội dung** tệp không bao giờ được máy thẩm định — SHA-256 chỉ để người soát sau này chứng minh tệp không bị tráo. Bảng đầy đủ: `docs/reports/arena-stage0-20261029/GATE-MATRIX.md` mục 0.3.
3. **Bằng chứng khai báo không nâng được nửa máy chấm chưa đạt:** cổng có `machineCheck.passed === false` giữ `gateVerdict: "PENDING"`.
4. **Dữ liệu tổng hợp/diễn tập không bao giờ mở cổng** — và nguồn gốc dữ liệu được xác định bằng **sổ kiểm toán**, không bằng tên hồ sơ: `src/auth/gate-cohort-provenance.ts` đọc các sự kiện `SYNTHETIC_DOCUMENT_INGESTED` (orchestrator ghi mỗi lần nạp tài liệu thành công khi chế độ tổng hợp bật) và `REHEARSAL_DOSSIER_SEEDED` (seeder diễn tập ghi cho từng hồ sơ) gắn theo `dossierId` của cohort đang đo; tiền tố `DOS-CAILAY-R*` chỉ là **tín hiệu phụ** cho cơ sở dữ liệu cũ. Vì vậy đổi mã hồ sơ bằng SQL thô không làm mất tín hiệu, còn xoá các dòng kiểm toán thì làm vỡ chuỗi băm ⇒ `verifyIntegrity()` false ⇒ GATE-03 fail ⇒ `evidenceProvenance: "UNPROVEN_LEDGER_INTEGRITY"` và không cổng nào được ghi nhận bằng chứng. Ở cả hai trạng thái đó: nhãn cổng `PASS_SYNTHETIC_REHEARSAL`, `operationalGatesEvidencedCount = 0`, `goForLiveCustomerData = false`, gói hồ sơ chỉ ra `READY_FOR_PILOT_GO_LIVE` hoặc `HOLD_BLOCKERS_REMAIN`, không bao giờ `GO FOR LIVE CUSTOMER DATA`. Trước khi đánh giá cổng trên cơ sở dữ liệu thật, phải tách/dọn hồ sơ diễn tập ra khỏi cơ sở dữ liệu đó. Bằng chứng đối kháng (6 ca tấn công): `docs/reports/arena-stage0-20261029/evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`; giới hạn còn lại: `FINDINGS.md` F-14b.
5. Cột **"Trạng thái hiện tại"** trong bảng mục 3 (ví dụ `RUNBOOK & CONFIG VERIFIED`, `VERIFIED IN STAGING TESTS`) mô tả trạng thái **ở mức kiểm thử staging/máy chấm** tại thời điểm viết tài liệu, **không phải** nghiệm thu cổng. Trạng thái cổng có giá trị bàn giao nằm ở `docs/reports/arena-stage0-20261029/GATE-MATRIX.md` (cập nhật 2026-10-30): cả 5 cổng đều **chưa đủ bằng chứng vận hành** → pilot với dữ liệu khách hàng thật là **BLOCKED**.
