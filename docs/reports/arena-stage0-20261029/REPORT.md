# BÁO CÁO HOÀN THIỆN DuriOS STAGE 0 — CÓ BẰNG CHỨNG

- **Ngày bàn giao:** 2026-10-29 (UTC) — **cập nhật hoàn thiện 2026-10-30 (UTC)** sau 6 hạng mục bắt buộc
- **Nhánh làm việc:** `arena/e0ece0a7-durios` (rẽ từ `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494` của `main`)
- **Phạm vi:** Stage 0, một vựa duy nhất `SITE-CAILAY-TIENGIANG-01`. Không mở rộng sang Stage 1 / V2.
- **Tài liệu kèm theo:** `README-HANDOVER.md` (hướng dẫn đọc bộ artefact + cách tái dựng), `FINDINGS.md` (phát hiện + nghi ngờ), `VERIFICATION.md` (bằng chứng thực thi), `GATE-MATRIX.md` (`GATE-01..05`, mục 0.3 = ai được ghi bằng chứng vận hành), `RUNBOOK-STAGE0-REHEARSAL.md` (bàn giao vận hành), `evidence/` (8 log thô đợt 2026-10-29 + 10 kịch bản chạy lại được: `drill-stage0.ts`, `backup-restore-drill.ts`, `http-walkthrough.sh`, `verify-fields.py`, `ui-render-probe.mjs`, `gate-cli-matrix.sh`, `gate-cohort-site.ts`, `extraction-mode-demo.ts`, `gate-provenance-adversarial.ts`, `rerun-all.sh`), `evidence/rerun-20261030/` (10 log đo lại trên cây đã bàn giao, mỗi log có câu lệnh + HEAD + EXIT), `package/` (commit cơ sở, danh sách từng tệp bị ảnh hưởng, checksum SHA-256, **patch để riêng**, snapshot nguyên văn, **toàn bộ cây cơ sở tại `2f1538e`**, **toàn bộ cây đã bàn giao**, log kiểm `git apply` + so byte) và `delivery/durios-stage0-handover-20261030.tar.gz` (+ tệp `.sha256`) — một archive duy nhất chứa tất cả những thứ trên.

---

## 1. Kết luận (hai kết luận tách rời)

### 1.1. Kỹ thuật: **PARTIAL**

**Đã đạt (có bằng chứng thực thi, không suy đoán):**

- Toàn bộ dòng chảy Stage 0 chạy được đầu-cuối trên môi trường tổng hợp: đăng nhập → tạo hồ sơ → nạp chứng từ → trích xuất → chỉnh/xác nhận trường → đối soát → thẩm định có thẩm quyền → niêm phong → phê duyệt → xuất manifest → kiểm chứng độc lập.
- **15 phát hiện (F-01..F-15) đã xác nhận bằng đường thực thi thật, tất cả ĐÃ SỬA và có kiểm thử hồi quy hoặc log**: **1 lỗi P0** (F-03 — bootstrap tự cấp token `MANAGER` không cần đăng nhập), **9 lỗi P1** (F-01 manifest chưa lọc cho bên nhận chia sẻ; F-02 KPI/cổng trộn dữ liệu giữa các tenant; F-04 Cadmi rỗng vẫn `PASSED`; F-05 bộ trích xuất giả lập bịa số; F-06 mã băm manifest bỏ hở trường; F-07 diễn tập tự cấp `PASS` giả; F-09 UI trình bày kết quả tổng hợp như thật; **F-13 seeder diễn tập mặc định ghi vào DB vận hành với tài khoản mật khẩu công khai**; **F-14 cohort tổng hợp vẫn có thể cho ra `goForLiveCustomerData: true`**), và **5 lỗi P2** (F-08 số kinh tế bịa; F-10 UI cho chọn vai trò; F-11 `audit-pack --verify` đổ stack; F-12 `verify-gates` không in gì; **F-15 một con số "2/5" cho hai khái niệm khác nhau**). F-13, F-14, F-15 là ba phát hiện mới của đợt 2026-10-30.
- Bộ kiểm thử tự động (đo lại 2026-10-30 sau mọi chỉnh sửa, kể cả lần viết lại cơ chế nguồn gốc dữ liệu): **286 pass / 0 fail / 4.484 `expect()` / 67 tệp** (đợt 2026-10-29: 258 / 0 / 4.282 / 61; trước khi sửa: 242 / 0 / 4.027 / 57). **Không xóa, không bỏ qua, không nới tiêu chí** bất kỳ kiểm thử nào; hai kiểm thử cũ mã hóa ngữ nghĩa diễn tập không an toàn đã được viết lại để khẳng định ngữ nghĩa đã sửa.
- `bun run typecheck` thoát `0`. Bất biến module của kho được giữ: mọi tệp `.ts` trong `src/` và `test/` ≤ 99 dòng, không `any` → `GO_MODULAR_ZERO_ANY_VERIFIED`.
- Luồng chính được chứng minh **qua máy chủ HTTP thật** (tiến trình `bun run src/server/server.ts`, bind `127.0.0.1:3111`, client `curl`): 17 bước từ đăng nhập → tạo hồ sơ → nạp 3 chứng từ → trích xuất 10 trường → xác nhận từng trường → `PASSED` → clerk approve bị `403 INSUFFICIENT_ROLE` → manager approve → export → `EXPORTED`/`isImmutable` → nạp thêm bị `409` → manifest có 2 mã băm → `verify:manifest` `valid:true`/`FULL` → chuỗi kiểm toán 17 sự kiện → bootstrap ẩn danh `403 FEATURE_DISABLED` (`evidence/HTTP-WALKTHROUGH-LOG.txt`).
- Diễn tập hợp nhất Stage 0 (`evidence/drill-stage0.ts`): **55 kiểm tra / 0 thất bại / exit 0**, gồm 7 ca giả mạo manifest bị phát hiện, truy cập sai tenant bị chặn, quyền không đủ bị chặn, bootstrap từ chối mặc định, trích xuất fail-closed, và chu trình backup → verify → restore → kiểm tra lại toàn bộ 32 blob.
- **Tái lập được từ sandbox sạch:** giữa đợt bàn giao sandbox bị reset (mất `bun`, `node_modules`, toàn bộ `/tmp`); đã dựng lại từ đầu (`npm install -g bun` 1.4.4 → `bun install` 5 gói) và chạy lại toàn bộ: `typecheck` exit `0`, `bun test` **258/0**, `drill-stage0.ts` **55/0**, `backup-restore-drill.ts` **11/0**, `http-walkthrough.sh` đủ 17 bước, `ui-render-probe.mjs` **6/6**. Toàn bộ log trong `evidence/` là của lần chạy trên sandbox sạch đó. Đợt 2026-10-30 chạy lại toàn bộ trên sandbox sạch một lần nữa và lưu ở `evidence/rerun-20261030/`: `typecheck` exit `0`, `bun test` **286/0**, modularity `GO_MODULAR_ZERO_ANY_VERIFIED`, `drill-stage0.ts` **55/0**, `backup-restore-drill.ts` **11/0**, `http-walkthrough.sh` đủ **17 bước**, `ui-render-probe.mjs` **7/7**, ma trận CLI cổng **7 ca**.
- Backup/restore có bằng chứng xác minh **sau** khi khôi phục: băm SHA-256 của tệp cơ sở dữ liệu khớp bản gốc, hồ sơ + manifest + chuỗi kiểm toán đọc được, 32/32 blob băm lại đúng, và lật 1 byte trong một blob bị phát hiện (3 lỗi).

**Còn thiếu khiến kết luận là PARTIAL chứ không phải PASS:**

1. **Không có OCR thật — nhưng phần dư F-05 đã đóng:** toàn bộ đường trích xuất giả lập chỉ hoạt động khi chế độ tổng hợp được bật tường minh (`DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true`). Luồng thường: `text/plain` chỉ còn giá trị suy ra từ byte thật của tệp (regex theo đúng loại chứng từ), `application/pdf` stub / `application/json` / ảnh → `0` trường → `RUL-DOC-UNREADABLE`, yêu cầu nạp `fixtureFields` → `400 SYNTHETIC_EXTRACTION_DISABLED` + sự kiện kiểm toán `DOC_UPLOAD_REJECTED`, và không giá trị mẫu nào của template xuất hiện như dữ liệu chứng từ. Chế độ tổng hợp vẫn chạy được khi bật (diễn tập + bộ test). **Giới hạn còn lại:** hệ thống vẫn không đọc được chứng từ thật (không có OCR/tích hợp phòng thí nghiệm) — nằm ngoài phạm vi Stage 0.
2. **11 nghi ngờ mức P2 chưa tái hiện được thành lỗi** (xem `FINDINGS.md` mục 4): ví dụ `storage/sqlite-export-manifest.ts:8` lưu `tenant_id` của actor đang đọc thay vì của chủ sở hữu hồ sơ; oracle tồn tại qua khác biệt `404`/`403`; đồng thời hóa phiên bản là tùy chọn ở luồng multipart; blob lưu hỏng thì luồng ghi vẫn tiếp tục âm thầm. Không có cái nào chứng minh được mất mát/rò rỉ dữ liệu trong phạm vi Stage 0, nên **không được tính là đã sửa**, chỉ ghi nhận là việc cần quyết định.
3. **Không kiểm chứng được giao diện bằng trình duyệt thật**: sandbox không có trình duyệt và máy chủ bị ràng buộc loopback (`assertLoopbackHostname`), nên **không có ảnh chụp màn hình** — hạng mục UI vì vậy ở trạng thái **CHƯA NGHIỆM THU (not accepted)**, không được tính là đã đạt. Đã thay bằng headless DOM probe (`evidence/ui-render-probe.mjs`, **7/7 PASS**; output của happy-dom **không** phải ảnh chụp màn hình) + checklist kiểm tra thủ công trong `RUNBOOK-STAGE0-REHEARSAL.md`. Theo `AGENTS.md`, thay đổi trong `src/ui/` (ở đây là `src/server/public/index.html`) **yêu cầu ảnh chụp desktop + màn hẹp** — yêu cầu này **chưa được đáp ứng**.
4. **Ngữ cảnh đề bài không khớp kho thực tế**: đề bài nhắc `/Users/macbook/durios` và HEAD `08992f6`. Sandbox này là `/home/user/durios`, clone nông (shallow) tại `2f1538e`; commit `08992f6` không truy cập được nên **không thể đối chiếu diff của các thay đổi FieldProofKit/tenant đã nhắc** — chỉ có thể xác nhận hành vi hiện tại bằng thực thi (đã xác nhận: proof kit phân lập đúng theo tenant, xem `VERIFICATION.md`).
5. Tài liệu `README.md` từng công bố sai số kiểm thử (79/17/3.439) — đã sửa thành số đo thực tế kèm khuyến cáo lấy `bun test` trên máy làm chuẩn.

### 1.2. Pilot dùng dữ liệu khách hàng thật: **BLOCKED**

**Agent không cấp phép go-live.** Lệnh `bun run pilot:verify-gates` trên cơ sở dữ liệu diễn tập thoát **`1`** và in **hai con số tách rời**: `KIỂM TRA TỰ ĐỘNG (máy chấm được): 2/5 tiêu chí đạt` và `LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): 0/5 cổng được mở`, `goForLiveCustomerData: false`, `evidenceProvenance: "SYNTHETIC_REHEARSAL"` (vì cohort là hồ sơ do lệnh seed diễn tập tạo). Gói kiểm toán CLI tự biên soạn ra `Verdict=HOLD_BLOCKERS_REMAIN MachineChecks=2/5 LaunchGatesEvidenced=0/5 Integrity=true`.

**"2/5" nghĩa là gì (câu trả lời chính xác, hạng mục 4):** đó là **2 tiêu chí máy chấm được** trong 5 bộ tiêu chí (`GATE-03`: host loopback + chuỗi kiểm toán toàn vẹn; `GATE-05`: ≥5 container + `meanDeltaSeconds < 300` + bắt hết lỗi gài mù). Nó **không** có nghĩa 2 cổng khai trương đã mở. Một cổng chỉ mở (`gateVerdict: EVIDENCED_FOR_LAUNCH`) khi **cả hai** đúng: máy chấm đạt **và** có bằng chứng vận hành do con người ghi nhận (tệp hiện vật + tên người ghi). Tại thời điểm bàn giao: **0/5 cổng đủ bằng chứng**. CLI và UI nay trình bày hai khái niệm bằng hai con số, hai nhãn và hai câu khác nhau; bảng tiêu chí máy chấm đối chiếu với bằng chứng vận hành của từng cổng nằm ở `GATE-MATRIX.md` §0.1.

| Cổng | Trạng thái | Ai phải cung cấp |
|---|---|---|
| `GATE-01` Đồng ý dữ liệu & xác nhận điểm vựa | **PENDING** — không có tệp đồng ý (`DURIOS_GATE01_CONSENT_FILE`), không có chữ ký người vận hành/Founder | Founder + chủ vựa Cai Lậy (ký trên giấy/tệp, không được tự ký bởi hệ thống) |
| `GATE-02` Kênh OTP/định danh | **PENDING** — adapter sẵn sàng và fail-closed (trả `503` khi không có cấu hình), nhưng chưa có thông tin nhà cung cấp thật | Founder quyết định nhà cung cấp + cấp thông tin; cấm gửi OTP thật trong Stage 0 |
| `GATE-03` Runbook & cấu hình | **PARTIAL** — **máy chấm đạt** 2/5 tiêu chí (loopback + chuỗi kiểm toán) nhưng thiếu bằng chứng vận hành cho 3 tiêu chí còn lại → `MACHINE_CHECK_ONLY` | Người vận hành triển khai: reverse proxy HTTPS (`NODE_ENV=production`), giới hạn mạng, mã hóa đĩa + bản sao lưu, secrets quyền `0600` |
| `GATE-04` Backup/restore | **PARTIAL** — máy chấm `PENDING` vì chưa có `DURIOS_BACKUP_DIR` hợp lệ; cơ chế đã kiểm chứng kỹ thuật đầy đủ trên dữ liệu tổng hợp (diễn tập S11) nhưng **chưa có** biên bản trên hạ tầng thật của vựa | Người vận hành chạy trên máy của vựa và nộp biên bản |
| `GATE-05` KPI vận hành | **PARTIAL** — **máy chấm đạt** (`meanDeltaSeconds` < 300, `zeroMissGate` true) nhưng `timingEvidenceSource: "SYSTEM_TIMESTAMPS"` → `MACHINE_CHECK_ONLY`; **thiếu** biên bản bấm giờ của con người trên 5 container thật | Thư ký/Quản lý vựa bấm giờ + ký biên bản |

Chi tiết từng cổng, bằng chứng hiện có, phần thiếu và lệnh tái kiểm tra: xem `GATE-MATRIX.md`.

**Không được suy ra doanh thu/ROI/thiệt hại tránh được từ dữ liệu tổng hợp.** Các chỉ số giá trị hiện mang nhãn `UNVALIDATED_ASSUMPTION` (35 phút/container và 35.000.000 VND/lỗi nghiêm trọng chỉ là giả định chưa kiểm chứng); danh sách dữ liệu cần thu thập tại vựa nằm ở `RUNBOOK-STAGE0-REHEARSAL.md` mục 6.

**Ba chốt chặn mới, để kết luận cổng không thể bị "tự ký" (hạng mục 1):**
1. **Dữ liệu tổng hợp không mở được cổng** (F-14): cohort chứa hồ sơ do `pilot:seed-rehearsal` tạo (`DOS-CAILAY-R*`) — kể cả cohort trộn — bị nhận diện (`src/auth/gate-cohort-provenance.ts`) và báo `SYNTHETIC_REHEARSAL`; khi đó không cổng nào đạt `EVIDENCED_FOR_LAUNCH`, `operationalGatesEvidencedCount = 0/5`, `goForLiveCustomerData = false`, và gói kiểm toán chỉ có thể ra `READY_FOR_PILOT_GO_LIVE` (mô tả cuộc diễn tập) chứ không phải `GO_FOR_LIVE_CUSTOMER_DATA`. Đã tái hiện lỗ hổng này trước khi sửa (khai báo 5 tệp bằng chứng trên DB diễn tập → `EXIT=0`) và có kiểm thử hồi quy `test/gate-cohort-provenance.test.ts`.
2. **Bằng chứng khai báo không nâng được tiêu chí máy** (ma trận ca B3): cổng có `machineCheck.passed: false` giữ `gateVerdict: "PENDING"` dù `externalEvidence.status = "RECORDED_BY_OPERATOR"`.
3. **Hệ thống ghi nhận, không tự xác minh, không tự ký:** bằng chứng là đường dẫn tệp + tên người ghi nhận do con người khai báo (`DURIOS_GATE0X_EVIDENCE_FILE` + `DURIOS_GATE_EVIDENCE_ATTESTED_BY`, hoặc `gateEvidence` khi gọi qua code); thiếu tên người ghi nhận thì tệp bị coi như chưa có bằng chứng. Agent không tạo ra bất kỳ tệp bằng chứng "thật" nào; các tệp trong log đều nằm trong `/tmp` và được ghi rõ là fixture.

---

## 1.3. Bốn nhóm kết luận (tách rời theo yêu cầu)

### (a) ĐÃ SỬA VÀ KIỂM CHỨNG — có đường thực thi + kiểm thử hồi quy/log
F-01 manifest chưa lọc cho bên nhận chia sẻ · F-02 KPI/cổng trộn tenant · F-03 bootstrap tự cấp đặc quyền (P0) · F-04 Cadmi rỗng vẫn `PASSED` · F-05 bộ trích xuất bịa số (ảnh **và** phần dư tệp chữ, đóng bằng chế độ synthetic bật tường minh) · F-06 mã băm manifest bỏ hở trường · F-07 diễn tập tạo `PASS` giả · F-08 số kinh tế bịa (gắn nhãn `UNVALIDATED_ASSUMPTION`) · F-09 UI trình bày kết quả tổng hợp như thật · F-10 UI cho chọn vai trò · F-11 `audit-pack --verify` ENOENT · F-12 `verify-gates` không in gì · **F-13 seeder diễn tập đòi đích tường minh + từ chối ghi vào dữ liệu không phải diễn tập** · **F-14 cohort tổng hợp không thể mở cổng** · **F-15 hai bộ đếm cổng tách rời trong report/CLI/UI**.
Kiểm chứng bằng: 286 test (67 tệp) xanh, `typecheck` exit 0, modularity `GO_MODULAR_ZERO_ANY_VERIFIED`, diễn tập 55/0 và 11/0, HTTP walkthrough 17 bước exit 0, ma trận CLI 7 ca, DOM probe 7/7 — log ở `evidence/rerun-20261030/`.

### (b) KHÔNG TÁI HIỆN ĐƯỢC THÀNH LỖI — không tính là đã sửa
12 nghi ngờ mức P2 ở `FINDINGS.md` mục 4 (N-01..N-12), ví dụ: `storage/sqlite-export-manifest.ts` lưu `tenant_id` của actor đang đọc thay vì của chủ sở hữu hồ sơ; oracle tồn tại qua khác biệt `404`/`403`; đồng thời hóa phiên bản là tùy chọn ở luồng multipart; blob lưu hỏng thì luồng ghi tiếp tục âm thầm. Không cái nào chứng minh được mất mát/rò rỉ dữ liệu trong phạm vi Stage 0 → **giữ nguyên trạng thái "chưa tái hiện"**, cần quyết định của Founder/kiến trúc sư ở giai đoạn sau.

### (c) KHÔNG KIỂM CHỨNG ĐỘC LẬP ĐƯỢC TRONG MÔI TRƯỜNG NÀY
1. **Giao diện bằng mắt người / ảnh chụp màn hình desktop + màn hẹp** — không có trình duyệt, server chỉ bind loopback (guard cố ý không nới). **Hạng mục UI: CHƯA NGHIỆM THU.** DOM probe (happy-dom) chỉ chứng minh markup/hàm render, **không** phải ảnh chụp.
2. **Độ chính xác trích xuất trên chứng từ thật** — không có tài liệu thật nào được nạp (đúng ràng buộc); hệ thống cũng không có OCR.
3. **Quan hệ với commit `08992f6`** mà đề bài nhắc — clone nông không có commit đó → **không thể chứng minh**; thay bằng gói đóng gói `package/` (commit cơ sở thật `2f1538e…`, checksum, patch đã kiểm `git apply --check`, snapshot toàn bộ tệp bị ảnh hưởng).
4. **Hành vi trên hạ tầng thật** (đĩa thật, mã hóa đĩa, mạng vựa, OTP thật, backup định kỳ) và **thời gian thao tác của con người** (`HUMAN_STOPWATCH_ATTESTED`) — chỉ đo được trên máy vựa.
5. Assistive technology thật (trình đọc màn hình, điều hướng bàn phím đầy đủ) — mới xác nhận bằng đọc mã nguồn + checklist thủ công.

### (d) PHỤ THUỘC FOUNDER / HẠ TẦNG — agent không được và không thể tự làm
`GATE-01`: phê duyệt chọn site + biên bản tiếp cận vựa + Biểu mẫu chấp thuận dữ liệu đã ký (Founder + chủ vựa). `GATE-02`: quyết định nhà cung cấp OTP, thông tin cấu hình thật, biên bản gửi/nhận OTP thật (Founder; Stage 0 cấm gửi OTP thật). `GATE-03`: reverse proxy HTTPS production, giới hạn mạng, mã hóa đĩa, quyền `0600` của secrets (người vận hành triển khai). `GATE-04`: bản sao lưu thật trên máy vựa + biên bản diễn tập khôi phục có người ký + lịch sao lưu (người vận hành). `GATE-05`: bấm giờ 5 container thật, 2 ca gài lỗi mù độc lập, xác nhận 0 lỗi P0, số liệu thay 2 giả định kinh tế (Thư ký + Quản lý vựa). Ngoài ra: quyết định về 12 nghi ngờ P2 ở nhóm (b), và việc nghiệm thu UI sau khi có ảnh chụp.

---

## 1.4. Trạng thái 6 hạng mục bắt buộc của đợt này

| # | Hạng mục | Trạng thái | Bằng chứng / nơi xem |
|---|---|---|---|
| 1 | Kết luận cổng chỉ dựa trên bằng chứng hợp lệ; không tự đổi tiêu chí, không tự ký, không dùng kết quả synthetic để mở cổng | **HOÀN THÀNH — đã kiểm chứng, cơ chế nguồn gốc dữ liệu viết lại ngày 2026-10-30** | F-14 + **F-14b** + `src/auth/gate-cohort-provenance.ts` (tín hiệu từ sổ kiểm toán, không từ tên hồ sơ), `gate-evidence-artifact.ts`, `gate-criteria.ts`, `test/gate-cohort-provenance.test.ts` (4 kiểm tra), `test/gate-provenance-adversarial.test.ts` (3 kiểm tra tấn công), `test/gate-evidence-artifact.test.ts` (5 kiểm tra), ma trận A3/B3, 6 ca tấn công trong `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`, `GATE-MATRIX.md` §0.1–0.3. Tiêu chí cổng **không** bị đổi: chỉ tách "máy chấm" và "bằng chứng vận hành" vốn đã nằm trong tài liệu `docs/pilot-readiness/01_…` |
| 2 | Đóng phần dư F-05 không cần OCR: fixture chỉ chạy trong chế độ synthetic bật tường minh; luồng thường trả trạng thái không trích xuất, không đưa giá trị mẫu ra như dữ liệu chứng từ; kiểm thử hồi quy cho `text/plain`, `application/pdf`, `application/json`, ảnh; chứng minh luồng synthetic vẫn chạy và luồng thường không sinh giá trị giả | **HOÀN THÀNH — đã kiểm chứng** | `src/extraction/synthetic-extraction-mode.ts`, `fixture-template-fields.ts`, `local-text-extractor.ts`, `src/workspace/document-ingestion-orchestrator.ts`, `src/server/server-types.ts`; `test/synthetic-extraction-mode.test.ts` (6 kiểm tra: text/plain chỉ ra giá trị từ byte thật; pdf stub/json/png/jpeg/tiff → 0 trường; `fixtureFields` → 400 + `DOC_UPLOAD_REJECTED`; chế độ synthetic vẫn nhận override và template; canary không xuất hiện ở luồng thường); diễn tập S10; **demo hai luồng `evidence/extraction-mode-demo.ts` → `evidence/rerun-20261030/EXTRACTION-MODE-LOG.txt`, 19 PASS / 0 FAIL** (bảng đối chiếu ở `VERIFICATION.md` §9.5B); `bunfig.toml` + `test/preload-synthetic-extraction.ts` |
| 3 | Seeder diễn tập không âm thầm dùng DB vận hành; đòi đích tường minh; có cơ chế từ chối ghi vào dữ liệu không phải diễn tập; cập nhật hướng dẫn | **HOÀN THÀNH — đã kiểm chứng** | F-13 + `src/auth/rehearsal-seed-target-guard.ts`, `src/auth/pilot-rehearsal-seeder.ts`, `test/rehearsal-seed-target-guard.test.ts` (6 kiểm tra), `RUNBOOK-STAGE0-REHEARSAL.md` §2 |
| 4 | Nói chính xác "2/5" là gì; CLI/UI không diễn đạt hai khái niệm như nhau; báo cáo riêng kết quả kiểm tra tự động và trạng thái từng cổng | **HOÀN THÀNH — đã kiểm chứng** | F-15 + `src/auth/pilot-gate-types.ts`, `pilot-gate-evidence.ts`, `pilot-gate-summary.ts`, `pilot-gate-report-builder.ts`, `pilot-launch-gate-verifier.ts`, `src/export/field-auditor-cli.ts`, `pilot-dossier-pack-compiler.ts`, `src/server/ecosystem-rehearsal-handler.ts`, `src/server/public/index.html`; `test/pilot-gate-evidence-split.test.ts`, `test/pilot-launch-gate-verifier.test.ts`; DOM probe ca D và G; `GATE-MATRIX.md` §0.1 |
| 5 | Đóng gói đầy đủ mã nguồn, kiểm thử, tài liệu, bằng chứng (mọi tệp mới): commit cơ sở, danh sách tệp, checksum, patch qua `git apply --check`, kèm snapshot toàn bộ tệp bị ảnh hưởng, và nêu rõ không chứng minh được quan hệ với `08992f6` | **HOÀN THÀNH — bổ sung cây cơ sở đầy đủ + archive tải được (2026-10-30)** | `package/MANIFEST.txt` (commit cơ sở `2f1538e…`, **danh sách mọi tệp bị ảnh hưởng = 35 sửa + toàn bộ tệp mới**, SHA-256 + byte + dòng từng tệp, tuyên bố về `08992f6`), `package/stage0-full.patch` (**để riêng**; số dòng/byte ghi trong `package/MANIFEST.txt` — patch chứa chính các báo cáo này nên kích thước đổi mỗi lần dựng lại), `package/snapshot/` (bản sao nguyên văn của mọi tệp bị ảnh hưởng), **`package/base-2f1538e….tar.gz`** (toàn bộ **523 tệp** của cây cơ sở tại `2f1538e`, bằng đúng `git ls-tree -r` của commit đó), **`package/delivered-tree-20261030.tar.gz`** (toàn bộ cây đã bàn giao), `package/APPLY-VERIFY-LOG.txt` (**`PACKAGE_VERIFIED`**: giải nén base archive → `git apply --check` EXIT=0 → `git apply` EXIT=0 → mọi tệp snapshot khớp byte-for-byte; delivered-tree khớp 100% với cây làm việc), `package/verify-package.sh`, và **`delivery/durios-stage0-handover-20261030.tar.gz`** — một archive duy nhất chứa `README-HANDOVER.md` + `reports/` (5 báo cáo) + `evidence/` (10 kịch bản + 8 log đợt 1 + 10 log `rerun-20261030/`) + `package/`, kèm `CHECKSUMS.txt` bên trong (SHA-256 của mọi tệp) và tệp `<tên>.tar.gz.sha256` kế bên (SHA-256 của chính archive; không nhúng vào tài liệu bên trong vì tài liệu ấy nằm trong archive) |
| 6 | Chạy lại typecheck, toàn bộ test và các diễn tập sau chỉnh sửa cuối; đính kèm log + checksum của snapshot bàn giao; happy-dom không được tính là ảnh chụp | **HOÀN THÀNH MỘT PHẦN** | `evidence/rerun-20261030/` (10 log: TYPECHECK, TEST-SUITE, MODULARITY, DRILL-STAGE0, BACKUP-RESTORE-DRILL, HTTP-WALKTHROUGH, GATE-CLI-MATRIX, EXTRACTION-MODE, **GATE-PROVENANCE-ADVERSARIAL**, UI-RENDER-PROBE — tất cả EXIT=0) + `evidence/rerun-all.sh` (sinh lại cả 10 log bằng một lệnh) + checksum trong `package/MANIFEST.txt` (khối số liệu đọc thẳng từ log nên không thể lệch). **Ảnh chụp màn hình desktop/màn hẹp: KHÔNG ĐẠT** (môi trường không có trình duyệt) → **hạng mục UI giữ trạng thái chưa nghiệm thu** |

## 1.5. Năm hạng mục bàn giao để soát xét độc lập (đợt 2026-10-30, yêu cầu mới nhất của Founder)

| # | Yêu cầu | Trạng thái | Bằng chứng / nơi xem |
|---|---|---|---|
| 1 | Một **archive tải được** chứa `package/`, các báo cáo và `evidence/rerun-20261030/`, kèm **SHA-256 của archive**; đường dẫn trong sandbox hay khung xem trước **không** được tính là đã bàn giao | **HOÀN THÀNH** | `delivery/durios-stage0-handover-20261030.tar.gz` (mọi tệp bên trong có SHA-256 trong `CHECKSUMS.txt`) + `delivery/…tar.gz.sha256` + `CHECKSUMS.txt` bên trong; SHA-256 của archive cũng được nêu trong tin nhắn bàn giao. Sinh lại bằng `build-handover-archive.sh` |
| 2 | **Snapshot/đế đầy đủ tại commit `2f1538e`** để người soát tái dựng được — không chỉ bản sao của các tệp bị sửa; **patch để riêng** để so với kho đích `08992f6` | **HOÀN THÀNH** | `package/base-2f1538e….tar.gz` (toàn bộ 523 tệp của cây cơ sở, tạo bằng `git archive`), `package/delivered-tree-20261030.tar.gz` (toàn bộ cây đã bàn giao), `package/stage0-full.patch` (để riêng), `package/snapshot/` (mọi tệp bị ảnh hưởng), `package/APPLY-VERIFY-LOG.txt` → `PACKAGE_VERIFIED`. Quan hệ với `08992f6` vẫn **không chứng minh được** trong sandbox (clone nông) — tuyên bố nguyên văn trong `package/MANIFEST.txt` |
| 3 | **Kiểm tra đối kháng F-14**: đổi mã hồ sơ diễn tập, dựng cohort tổng hợp với mã tuỳ ý, trộn với cohort khác; chứng minh không thể mở cổng bằng cách đổi tên hay khai báo tệp bằng chứng tuỳ ý. Nếu nguồn gốc chỉ dựa vào tiền tố mã hồ sơ thì **nói rõ giới hạn và sửa cơ chế trước khi đóng F-14** | **HOÀN THÀNH — giới hạn có thật và cơ chế đã được viết lại** | Tiền tố `DOS-CAILAY-R*` **đúng là** cơ chế duy nhất của bản sửa đầu tiên, và một câu `UPDATE` SQL thô xoá được nó (`FINDINGS.md` F-14b). Cơ chế mới ghi tín hiệu vào sổ kiểm toán append-only có chuỗi băm (`SYNTHETIC_DOCUMENT_INGESTED`, `REHEARSAL_DOSSIER_SEEDED`) và coi chuỗi băm không xác minh được là `UNPROVEN_LEDGER_INTEGRITY`. 6 ca tấn công đo được: `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`; kiểm thử hồi quy `test/gate-provenance-adversarial.test.ts`, `test/gate-evidence-artifact.test.ts`, `test/gate-cohort-provenance.test.ts`. **Giới hạn còn lại được nêu rõ, không giấu** (dữ liệu gõ tay từ chứng từ bịa; nội dung tệp bằng chứng không được máy thẩm định) |
| 4 | Tài liệu hoá **ai được ghi `externalEvidence`**, **bằng chứng được kiểm tra thế nào**, và **bằng chứng tổng hợp bị chặn ra sao** để không được tính là bằng chứng vận hành | **HOÀN THÀNH** | `GATE-MATRIX.md` mục **0.3(a)(b)(c)** (bảng đường vào, bảng kiểm tra, bảng tín hiệu + 6 ca tấn công + giới hạn); code: `src/auth/pilot-gate-evidence.ts`, `gate-evidence-artifact.ts`, `gate-criteria.ts`, `gate-cohort-provenance.ts`; `docs/pilot-readiness/01_…` §3.1 |
| 5 | UI giữ trạng thái **chưa nghiệm thu** cho tới khi có kiểm tra trên trình duyệt thật và ảnh chụp | **GIỮ NGUYÊN — CHƯA NGHIỆM THU** | Sandbox không có trình duyệt ⇒ không có ảnh chụp màn hình; chỉ có DOM probe headless 7/7 (`evidence/rerun-20261030/UI-RENDER-PROBE-LOG.txt`, ghi rõ "KHÔNG phải ảnh chụp màn hình") |

**Không đổi trong đợt này:** không push, không merge, không mở PR, không deploy, không dùng dữ liệu khách hàng thật, không gửi OTP thật, server chỉ bind `127.0.0.1`, agent không tự ký bất cứ xác nhận nào. Kết luận tổng thể vẫn là **PARTIAL / Pilot BLOCKED**.

---

## 1.6. Đợt chốt bàn giao kỹ thuật (2026-10-30) — bảy yêu cầu → bằng chứng

| # | Yêu cầu của Founder | Trạng thái | Bằng chứng / nơi xem |
|---|---|---|---|
| 1 | Giao **artefact thật** (tệp đính kèm/link tải được), kèm tên, kích thước, **SHA-256 thật** của archive cuối | **XONG** | `delivery/durios-stage0-handover-<ngày>.tar.gz` + tệp `.sha256` kế bên; SHA-256 và kích thước nêu trong tin nhắn bàn giao (không nhúng vào tài liệu nằm trong archive); nếu cơ chế đính kèm không hoạt động thì phải nói thẳng "CHƯA CHUYỂN GIAO ĐƯỢC ARTIFACT" và chỉ cách lấy tệp |
| 2 | Kèm base commit đầy đủ, base archive, delivered tree, patch (kể cả tệp mới), checksum bên trong, báo cáo và log; hướng dẫn dựng lại kèm **mã thoát kỳ vọng**; danh sách công cụ; không credential/CSDL khách hàng/`node_modules`/cache | **XONG** | `README-HANDOVER.md` mục 1, 4, 5, 8; `package/{MANIFEST.txt,SHA256SUMS.txt,stage0-full.patch,snapshot/,base-2f1538e….tar.gz,delivered-tree-….tar.gz,APPLY-VERIFY-LOG.txt}`; `CHECKSUMS.txt` trong archive; harness bước 1 assert mọi checksum |
| 3 | **Bảo vệ kho đích** ở `08992f6…`: không hướng dẫn giải nén đè; dựng cây Arena trong thư mục riêng; quan hệ tổ tiên ghi **UNKNOWN** kèm đủ hash để người nhận tự đối chiếu; không khẳng định patch áp được lên `08992f6` | **XONG** | `README-HANDOVER.md` mục 3 (5 quy tắc bắt buộc + 7 lệnh đối chiếu + bảng hash); `package/MANIFEST.txt`; không có dòng nào trong bộ artefact khẳng định patch áp lên `08992f6` |
| 4 | Bộ nghiệm thu **tái hiện được**: MỘT quy trình tuần tự 10 bước, thư mục tạm riêng cho CSDL/blob, mỗi kịch bản có kết quả mong đợi và **trả nonzero khi assertion fail**; cổng BLOCKED ⇒ exit 1 là kết quả đúng và phải được assert chứ không che bằng `\|\| true`; log gắn đúng snapshot/checksum cuối | **XONG** | `evidence/acceptance-harness.sh` (10 bước, exit 0/1/3/2, không `set -e`, không `\|\| true` trong lệnh); log `evidence/acceptance-*/` (10 step log + `HARNESS-SUMMARY.txt` + `TREE-FINGERPRINT.txt` + `ENVIRONMENT.txt`); các script con cũng tự assert: `gate-provenance-adversarial.ts` 54 assertion, `gate-cli-matrix.sh` 7 ca + 2 auditor, `permission-tenant-isolation.sh` 23 kiểm tra, `drill-stage0.ts` 55, `backup-restore-drill.ts`, `extraction-mode-demo.ts`; `VERIFICATION.md` §9.10. **Đã chạy thật trên cây giải nén từ archive** (không phải cây sandbox): `/tmp/arena-tree` ← `package/delivered-tree-20261030.tar.gz`, kết quả **10/10 bước PASS, 89 assertion / 0 fail, exit 0**; log giao kèm `evidence/acceptance-20261030T095617Z/` |
| 5 | Checklist UI (desktop, màn hình hẹp, bàn phím, trạng thái lỗi, nhãn tổng hợp, hai bộ đếm); có trình duyệt thì chạy và đính kèm ảnh, không thì giữ **"UI CHƯA NGHIỆM THU"**; đầu dò DOM không thay thế ảnh/mắt người | **XONG phần checklist — UI vẫn CHƯA NGHIỆM THU** | `UI-ACCEPTANCE-CHECKLIST.md` (57 mục có ID: UI-D 9, UI-N 9, UI-K 12, UI-E 10, UI-S 10, UI-C 7 + 6 lệnh dựng UI + bảng đối chiếu phạm vi DOM probe); sandbox không có trình duyệt ⇒ không ảnh chụp, cột người ký để trống |
| 6 | Điều kiện chốt vòng: artefact đã giao, checksum khớp, typecheck/test/diễn tập bắt buộc đạt, **không còn P0/P1 đã xác nhận chưa xử lý**, giới hạn còn lại (gồm UI chưa thử) được nêu, không tự nâng trạng thái cổng; 12 nghi ngờ chưa tái hiện giữ ở backlog | **XONG** | `FINDINGS.md` F-01…F-15 + F-14b (không còn P0/P1 đã xác nhận), §4 N-01…N-12 giữ backlog và **không** mở rộng điều tra; giới hạn còn lại: `VERIFICATION.md` §7, §9.7 (3 giới hạn của cơ chế provenance), `GATE-MATRIX.md` §0.3; trạng thái cổng giữ nguyên `2/5` máy và `0/5` bằng chứng |
| 7 | Báo cáo cuối **ngắn, đúng 7 điểm**: artefact, SHA-256 + kích thước, base commit và tương thích với `08992f6`, lệnh tái hiện kèm kết quả đo, những gì chưa nghiệm thu, trạng thái commit/push/PR/deploy, **hai kết luận riêng** (kỹ thuật vs pilot dữ liệu thật) | **XONG — trong tin nhắn bàn giao** | Tin nhắn trả lời cuối của lượt này theo đúng thứ tự 7 điểm; kết luận kỹ thuật: **SẴN SÀNG CHO NGHIỆM THU ĐỘC LẬP**; kết luận pilot dữ liệu thật: **BLOCKED** (chưa cổng nào trong GATE-01..05 có bằng chứng hợp lệ, chưa có quyết định Founder). Không tuyên bố nghiệm thu độc lập đã diễn ra |


## 2. Đường cơ sở (Phase A)

| Mục | Giá trị đo được |
|---|---|
| Hệ điều hành / kiến trúc | Debian 12, x86_64 |
| Node.js / npm | v22.22.3 / 10.9.8 |
| Bun (đang chạy) | 1.4.4 — `package.json` yêu cầu ≥ 1.3.0 |
| TypeScript | 5.9.3 (`tsc --noEmit`) |
| Nhánh / HEAD trước khi sửa | `arena/e0ece0a7-durios` / `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494` (shallow, cây làm việc sạch) |
| Cài đặt | `curl` tải Bun từ GitHub thất bại (exit 35, SSL) → dùng `npm install -g bun`; `bun install` → 5 gói |
| `bun run typecheck` trước sửa | exit **0**, không lỗi |
| `bun test` trước sửa | exit **0**, **242 pass / 0 fail / 4.027 expect / 57 tệp** |
| `bun run typecheck` sau sửa | exit **0** |
| `bun test` sau sửa | exit **0**, **258 pass / 0 fail / 4.282 expect / 61 tệp** (~17 s) |
| Bất biến module | `GO_MODULAR_ZERO_ANY_VERIFIED` (mọi `.ts` trong `src/`, `test/` ≤ 100 dòng theo `split("\n")`, không `: any` / `as any`) |

Tệp artefact không được theo dõi mà đề bài nhắc tới (`.claude/`, `DURIOS_CONTAINER_DOSSIER_MASTER_PROMPT.txt`) **không tồn tại** trong bản clone này; không có gì bị ghi đè.

---

## 3. Việc đã làm theo gói công việc

### A. Đường cơ sở & backlog thật
Đọc `AGENTS.md`, `README.md`, `package.json`, `tsconfig.json`, toàn bộ `src/` liên quan Stage 0, 14 tệp kiểm thử + helper, và `docs/pilot-readiness/`. Viết 4 probe độc lập (`probe1..probe4`) chạy trên thư mục tạm để lấy bằng chứng **trước khi sửa**; kết quả thô được chép vào `FINDINGS.md` và `VERIFICATION.md`. Bảng V1 → tính năng hiện có → kiểm thử/bằng chứng → khoảng trống nằm ở `VERIFICATION.md` mục 6.

### B. Đúng đắn & an toàn của luồng hồ sơ
Sửa F-01..F-06 (xem `FINDINGS.md`). Đã chứng minh bằng thực thi: định danh chỉ lấy từ `Authorization: Bearer` / `x-pilot-token` / cookie `durios_session`, header `x-actor-role` do client gửi bị bỏ qua (giả mạo mà không có phiên → `401`); cách ly tenant ở đọc/ghi/chia sẻ/xuất/KPI/cổng; sửa trường hoặc thay chứng từ làm mất `latestValidationResult` → `HUMAN_VERIFICATION_REQUIRED`; hồ sơ đã niêm phong → `409`; thiếu dữ liệu/không trích xuất được → chặn, không bao giờ `PASSED`; luật cách ly `RUL-GB2762-CD` không nổ trong diễn tập; hữu cơ chỉ là `EVIDENCE_STORED_NOT_CERTIFIED`; ghi blob theo temp → sha256 → rename với `resolveSafePath`; chuỗi kiểm toán hash-chain từ `GENESIS`.

### C. Diễn tập Stage 0 + đánh giá cổng
`evidence/drill-stage0.ts` — 55 kiểm tra / 0 thất bại, 11 mục (S1..S11), toàn bộ trong `mkdtempSync`, có khẳng định `./data` của kho **không** bị tạo. Sửa F-07/F-08 để diễn tập không thể tạo ra `PASS` giả và không bịa số kinh tế. Thêm `import.meta.main` cho `src/auth/pilot-launch-gate-verifier.ts` để `pilot:verify-gates` thực sự in báo cáo và trả mã thoát đúng nghĩa. Sửa F-11 để `pilot:audit-pack -- --verify` không còn đổ stack thô.

### D. UX vận hành
Chỉ sửa những phần UI phục vụ luồng Stage 0 trong `src/server/public/index.html`: nhãn nguồn bằng chứng (`SYSTEM_TIMESTAMPS` / `UNVALIDATED_ASSUMPTION` / `SYNTHETIC_REHEARSAL`), cảnh báo rõ "diễn tập tổng hợp — không có giá trị phê duyệt khai trương", trạng thái rỗng nói rõ bước kế tiếp, loại bỏ nhãn vai trò bịa trong hộp thoại introspection, chọn vai trò ở F-10 không còn tự nâng quyền (server vẫn là nguồn quyết định). Không screenshot được → checklist thủ công trong runbook.

### E. Bàn giao
`RUNBOOK-STAGE0-REHEARSAL.md` (môi trường tổng hợp, luồng chính, kiểm chứng xuất, diễn tập khôi phục, nhận biết cổng chưa đạt, checklist UI thủ công, cách đo phần việc thủ công đã giảm, dữ liệu cần thu thập). Đã sửa `README.md`, `docs/pilot-readiness/06_...md`, `docs/pilot-readiness/04_...md`, `docs/pilot-readiness/DECISION-01-...md`. **Không sửa** `docs/journals/*` (bản ghi lịch sử).

### F. Đợt hoàn thiện 2026-10-30 (6 hạng mục bắt buộc)
1. **Kết luận cổng (hạng mục 1):** tách "máy chấm" khỏi "cổng đủ bằng chứng" trong report/pack; thêm nhận diện cohort tổng hợp (`src/auth/gate-cohort-provenance.ts`) để dữ liệu do lệnh diễn tập seed **không thể** mở cổng kể cả khi khai báo đủ 5 tệp bằng chứng (F-14); bằng chứng khai báo không nâng được tiêu chí máy chưa đạt; hệ thống chỉ ghi nhận và nêu tên người ghi, không tự xác minh, không tự ký.
2. **Đóng phần dư F-05 (hạng mục 2):** chế độ trích xuất tổng hợp bật tường minh (`src/extraction/synthetic-extraction-mode.ts`), giá trị mẫu của template bị cô lập (`fixture-template-fields.ts`), orchestrator từ chối + ghi kiểm toán `DOC_UPLOAD_REJECTED` cho yêu cầu `fixtureFields` ở luồng thường, `400 SYNTHETIC_EXTRACTION_DISABLED` qua HTTP; `bunfig.toml` bật cờ cho bộ test.
3. **Seeder diễn tập (hạng mục 3):** đòi đích tường minh và từ chối ghi vào dữ liệu không phải diễn tập (`src/auth/rehearsal-seed-target-guard.ts`), cảnh báo stderr về mật khẩu công khai, hướng dẫn cập nhật ở runbook §2.
4. **"2/5" nghĩa là gì (hạng mục 4):** hai bộ đếm trong report/pack/HTTP payload, bản tóm tắt tiếng Việt hai dòng (stderr) + JSON (stdout), `audit-pack` in `MachineChecks=x/5 LaunchGatesEvidenced=y/5`, UI in hai con số ở thẻ trạng thái + huy hiệu KPI + từng dòng cổng + đoạn giải thích, `GATE-MATRIX.md` §0.1 liệt kê tiêu chí máy chấm đối chiếu bằng chứng vận hành của từng cổng.
5. **Đóng gói (hạng mục 5):** `package/` — commit cơ sở, danh sách tệp, SHA-256 từng tệp, patch đã kiểm `git apply --check` trên bản clone sạch, snapshot nguyên văn toàn bộ tệp bị ảnh hưởng, và tuyên bố rõ **không chứng minh được** quan hệ với `08992f6`.
6. **Đo lại toàn bộ (hạng mục 6):** typecheck, 286 test, 2 diễn tập, HTTP walkthrough, ma trận CLI 7 ca, DOM probe 7/7, modularity guard — log trong `evidence/rerun-20261030/`. **Ảnh chụp màn hình: không làm được** → hạng mục UI giữ trạng thái chưa nghiệm thu.

### G. Đợt bàn giao artefact 2026-10-30 (5 hạng mục soát xét độc lập — xem §1.5)
1. **Viết lại cơ chế nguồn gốc dữ liệu (F-14b, hạng mục 3):** `src/auth/gate-cohort-provenance.ts` chuyển từ "nhìn tiền tố mã hồ sơ" sang `resolveCohortProvenance(containerMetrics, auditEvents)` đọc tín hiệu trong sổ kiểm toán; orchestrator ghi `SYNTHETIC_DOCUMENT_INGESTED` lúc nạp tài liệu ở chế độ tổng hợp; seeder diễn tập ghi `REHEARSAL_DOSSIER_SEEDED`; builder nhận `auditEvents` + `auditChainValid` và thêm trạng thái `UNPROVEN_LEDGER_INTEGRITY` khi chuỗi băm không xác minh được (kèm `ledgerIntegrityVerified` trong báo cáo và tuyên bố miễn trừ riêng trong gói).
2. **Siết bằng chứng khai báo (hạng mục 4):** `src/auth/gate-evidence-artifact.ts` kiểm tra đường dẫn tồn tại / là tệp thường / kích thước / SHA-256 (giới hạn băm 25 MB) và `src/auth/pilot-gate-evidence.ts` đòi thêm `attestedBy`; tách `src/auth/gate-criteria.ts` (hai bảng tiêu chí) và `src/export/pilot-pack-checklist.ts` để giữ bất biến ≤ 100 dòng/tệp; `pilot-gate-summary.ts` in thêm nguồn gốc cohort, trạng thái chuỗi băm và SHA-256 của tệp bằng chứng.
3. **Kiểm thử + bằng chứng đối kháng:** `test/gate-provenance-adversarial.test.ts` (3), `test/gate-evidence-artifact.test.ts` (5), `test/gate-cohort-provenance.test.ts` viết lại theo API mới (4), 2 helper mới (`gate-site-fixture.ts`, `gate-provenance-fixture.ts`), fixture cohort vận hành không còn nạp tài liệu ở chế độ tổng hợp; kịch bản bằng chứng `evidence/gate-provenance-adversarial.ts` (6 ca) + `evidence/rerun-all.sh`.
4. **Đóng gói lại (hạng mục 1 + 2):** `package/base-<commit>.tar.gz` (toàn bộ cây cơ sở tại `2f1538e`), `package/delivered-tree-<ngày>.tar.gz` (toàn bộ cây đã bàn giao), `package/verify-package.sh` (kiểm lại từ chính artefact người soát nhận được → `PACKAGE_VERIFIED`), `build-handover-archive.sh` + `delivery/…tar.gz` (+ `.sha256`, `CHECKSUMS.txt` bên trong) và `README-HANDOVER.md`.
5. **Tài liệu:** `GATE-MATRIX.md` §0.3 (ai được ghi bằng chứng / máy kiểm tra gì / chặn bằng chứng tổng hợp thế nào + bảng 6 ca tấn công), `FINDINGS.md` F-14b, `VERIFICATION.md` §9.7–§9.8, `docs/pilot-readiness/01_…` quy tắc 2 và 4, `README.md`.
6. **API bổ sung, tương thích ngược:** `evidenceProvenance` có thêm giá trị `UNPROVEN_LEDGER_INTEGRITY`; báo cáo cổng thêm `ledgerIntegrityVerified`; mỗi cổng thêm `externalEvidence.artifact`; báo cáo và gói thêm `cohortProvenance`. Không đổi schema, không migration, không phải xóa cơ sở dữ liệu.

---

## 4. Danh sách tệp đã thay đổi (cập nhật 2026-10-30)

Toàn bộ danh sách kèm **số dòng, kích thước byte và SHA-256 của từng tệp** nằm ở `package/MANIFEST.txt`; bản sao nguyên văn nội dung nằm ở `package/snapshot/`; diff đầy đủ (kể cả tệp mới) nằm ở `package/stage0-full.patch` và đã kiểm bằng `git apply --check` trên bản clone sạch của commit cơ sở (`package/APPLY-VERIFY-LOG.txt`).

**Mã nguồn sửa (25 tệp — đợt 2 thêm `src/server/ecosystem-rehearsal-seeder.ts`):**
`src/auth/pilot-kpi-evaluator.ts`, `src/auth/pilot-kpi-extended-types.ts`, `src/auth/pilot-launch-gate-verifier.ts`, `src/auth/pilot-rehearsal-seeder.ts`, `src/auth/rbac-policy.ts`, `src/domain/export-manifest-types.ts`, `src/domain/pilot-dossier-pack-types.ts`, `src/export/field-auditor-cli.ts`, `src/export/manifest-compiler.ts`, `src/export/pilot-dossier-pack-compiler.ts`, `src/export/standalone-manifest-verifier.ts`, `src/extraction/composite-extractor-registry.ts`, `src/extraction/fixture-extractor.ts`, `src/index.ts`, `src/rules/cadmium-evaluators.ts`, `src/rules/deterministic-engine.ts`, `src/server/dossier-handlers.ts`, `src/server/ecosystem-rehearsal-handler.ts`, `src/server/ecosystem-rehearsal-seeder.ts`, `src/server/http-router.ts`, `src/server/pilot-handlers.ts`, `src/server/public/index.html`, `src/server/server-types.ts`, `src/sharing/dossier-redactor.ts`, `src/workspace/document-ingestion-orchestrator.ts`

**Module mới (21 tệp, tất cả ≤ 100 dòng để giữ bất biến modular):**
`src/auth/gate-cohort-provenance.ts` (50), `src/auth/gate-criteria.ts` (34), `src/auth/gate-evidence-artifact.ts` (39), `src/auth/pilot-gate-evidence.ts` (80), `src/auth/pilot-gate-report-builder.ts` (81), `src/auth/pilot-gate-summary.ts` (63), `src/auth/pilot-gate-types.ts` (93), `src/auth/pilot-kpi-cohort.ts` (40), `src/auth/pilot-kpi-value-assumptions.ts` (32), `src/auth/rehearsal-seed-target-guard.ts` (81), `src/export/manifest-integrity.ts` (51), `src/export/pilot-pack-checklist.ts` (19), `src/export/pilot-report-seal.ts` (44), `src/extraction/extractor-fallback.ts` (21), `src/extraction/fixture-template-fields.ts` (51), `src/extraction/synthetic-extraction-mode.ts` (62), `src/rules/extraction-completeness.ts` (53), `src/server/export-manifest-handler.ts` (38), `src/server/rehearsal-bootstrap-guard.ts` (38), `src/sharing/export-manifest-redactor.ts` (48), `src/sharing/redaction-policy.ts` (92)

**Kiểm thử mới (15 tệp):**
`test/extraction-and-rule-fail-closed.test.ts` (97), `test/gate-cohort-provenance.test.ts` (81), `test/gate-evidence-artifact.test.ts` (97), `test/gate-provenance-adversarial.test.ts` (97), `test/manifest-integrity-tamper.test.ts` (90), `test/manifest-redaction-and-tenant-kpi.test.ts` (93), `test/pilot-gate-evidence-split.test.ts` (84), `test/rehearsal-bootstrap-and-provenance.test.ts` (91), `test/rehearsal-seed-target-guard.test.ts` (96), `test/synthetic-extraction-mode.test.ts` (95), helper `test/helpers/gate-operator-evidence.ts` (48), `test/helpers/gate-provenance-fixture.ts` (24), `test/helpers/gate-site-fixture.ts` (67), `test/helpers/operational-cohort-fixture.ts` (93), `test/helpers/two-tenant-sealed-dossier.ts` (99), và `test/preload-synthetic-extraction.ts` (10, nạp qua `bunfig.toml`)

**Kiểm thử sửa (5 tệp):**
`test/ecosystem-rehearsal-and-modularity.test.ts`, `test/helpers/api-v1-equivalence-5a5-normalizer.ts` (thêm `manifestIntegritySha256` vào `CHAIN_HASH_KEYS`), `test/pilot-go-live-pack.test.ts` (dùng cohort vận hành cho ca `GO_FOR_LIVE_CUSTOMER_DATA`), `test/pilot-launch-gate-verifier.test.ts` (viết lại theo hai bộ đếm), `test/stitch-static-route.test.ts`

**Cấu hình mới (1 tệp):** `bunfig.toml` — (1) preload `test/preload-synthetic-extraction.ts` để bộ test bật tường minh chế độ trích xuất tổng hợp (không ảnh hưởng luồng chạy thật); (2) `[test] root = "./test"` để `bun test` chỉ quét thư mục `test/` — nếu không, nó quét luôn **bản sao** các tệp kiểm thử nằm trong `package/snapshot/` của gói bàn giao (đã đo: 290 test / 77 tệp / 12 fail do trùng đường dẫn dữ liệu, thay vì 278 / 65 / 0 của cùng thời điểm).

**Tài liệu:** sửa `README.md`, `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` (mục giải thích máy chấm vs bằng chứng vận hành), `docs/pilot-readiness/04_...KPI_PROTOCOL.md`, `docs/pilot-readiness/06_...ONBOARDING.md`, `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`; mới `docs/reports/arena-stage0-20261029/{REPORT.md,FINDINGS.md,VERIFICATION.md,GATE-MATRIX.md,RUNBOOK-STAGE0-REHEARSAL.md}` + `evidence/` (kịch bản: `drill-stage0.ts`, `backup-restore-drill.ts`, `http-walkthrough.sh`, `verify-fields.py`, `ui-render-probe.mjs`, `gate-cli-matrix.sh`, `gate-cohort-site.ts`, `extraction-mode-demo.ts`; log đợt 1: 8 tệp `*.txt`; log đo lại: `evidence/rerun-20261030/` 9 tệp) + `package/` (đóng gói bàn giao).

**Không thay đổi:** schema cơ sở dữ liệu, `package.json` (không nâng cấp phụ thuộc, không đổi framework), dữ liệu vận hành (`data/` vẫn chỉ có `uploads/.gitkeep`). Thay đổi API đều là **bổ sung, tương thích ngược**: (1) trường tùy chọn `manifestIntegritySha256` trong manifest — manifest cũ vẫn kiểm chứng được và bị gắn nhãn `integrityCoverage: "PARTIAL_LEGACY"`; (2) báo cáo cổng/gói kiểm toán thêm `machineChecksPassedCount`, `operationalGatesEvidencedCount`, mỗi cổng thêm `machineCheck`, `externalEvidence`, `gateVerdict`, và tùy chọn đầu vào `gateEvidence` — `passedCount`/`passedGateCount` được **giữ nguyên** làm bí danh của bộ đếm máy chấm nên lời gọi cũ không vỡ. Không cần migration, không bao giờ phải xóa cơ sở dữ liệu.

---

## 5. Vấn đề còn mở (không giấu)

1. **Không có OCR / không đọc được chứng từ thật** — phần dư F-05 đã đóng bằng cách buộc đường fixture vào chế độ tổng hợp bật tường minh, nhưng khả năng đọc chứng từ thật vẫn chưa có (ngoài phạm vi Stage 0).
2. **12 nghi ngờ P2 chưa tái hiện** — liệt kê đầy đủ ở `FINDINGS.md` mục 4, kèm lý do chưa coi là lỗi; cần quyết định ở giai đoạn sau.
3. **Thiếu ảnh chụp màn hình** cho thay đổi `src/server/public/index.html` → **hạng mục UI chưa nghiệm thu** (giới hạn môi trường, không phải bỏ qua yêu cầu).
4. **`GATE-01`, `GATE-02` hoàn toàn phụ thuộc bằng chứng bên ngoài** (chữ ký người vận hành/Founder, quyết định và thông tin nhà cung cấp OTP).
5. **`GATE-03`, `GATE-04`, `GATE-05` cần biên bản trên hạ tầng/con người thật** dù phần máy chấm đã đạt (2/5 tiêu chí máy tại thời điểm bàn giao).
6. **Bằng chứng vận hành là khai báo, không phải xác minh tự động:** hệ thống lưu đường dẫn tệp + tên người ghi nhận và in `RECORDED_BY_OPERATOR`; nó **không** kiểm tra chữ ký, không xác nhận nội dung tệp, không thay thế phê duyệt của Founder. Người đọc báo cáo phải hiểu `EVIDENCED_FOR_LAUNCH` nghĩa là "đã có người ghi nhận bằng chứng", không phải "bằng chứng đã được thẩm định".
7. **Dữ liệu diễn tập phải được tách khỏi DB đánh giá cổng:** chừng nào cohort còn chứa hồ sơ đi qua đường tổng hợp/diễn tập (tín hiệu `SYNTHETIC_DOCUMENT_INGESTED` / `REHEARSAL_DOSSIER_SEEDED` trong sổ kiểm toán, hoặc mã `DOS-CAILAY-R*` ở DB cũ), báo cáo cổng sẽ mang nhãn `SYNTHETIC_REHEARSAL` và `goForLiveCustomerData` luôn `false` (đúng theo thiết kế đã sửa F-14/F-14b) — cần dọn/tách trước khi đánh giá trên DB thật. Nếu chuỗi băm kiểm toán không xác minh được thì nhãn là `UNPROVEN_LEDGER_INTEGRITY` và cũng không cổng nào mở.
8. **`pilot:seed-rehearsal` vẫn tạo tài khoản mật khẩu công khai** (`clerk.cailay`, `manager.cailay`) — nay **bắt buộc** khai báo đích và bị từ chối nếu đích không phải dữ liệu diễn tập (F-13), nhưng bản thân mật khẩu công khai vẫn tồn tại trong kho; khi pilot thật bắt đầu phải dùng `src/auth/pilot-ops-cli.ts` để cấp tài khoản riêng.
9. **Đường tuyệt đối cũ `/Users/macbook/durios/...`** còn rải rác trong tài liệu lịch sử (`plans/`, `docs/journals/`) — chỉ sửa ở `README.md`; phần lịch sử giữ nguyên.
10. **Chưa chứng minh được quan hệ với commit `08992f6`** (clone nông) — thay bằng gói đóng gói đầy đủ ở `package/`.

---
## 6. Hướng dẫn tái hiện ngắn (đo lại 2026-10-30)

> **Muốn nghiệm thu trong MỘT lượt?** Chạy harness — nó gộp các lệnh 1–9 dưới đây thành 10 bước tuần tự,
> mỗi bước có kết quả mong đợi được assert (xem §1.6 dòng 4 và `README-HANDOVER.md` mục 2):
>
> ```bash
> bash docs/reports/arena-stage0-20261029/evidence/acceptance-harness.sh --archive <handover.tar.gz>
> # kỳ vọng EXIT=0 (10/10 bước); EXIT=1 nếu có assertion sai; EXIT=3 nếu thiếu artefact; EXIT=2 nếu thiếu bun
> ```
>
> Các lệnh 1–11 bên dưới là bản rời rạc của cùng những kiểm tra đó, giữ lại để soi từng phần.

```bash
# 0. Yêu cầu: Bun >= 1.3.0 (đo trên 1.4.4), node 22
cd /home/user/durios && bun install

# 1. Kiểm tra tĩnh + toàn bộ kiểm thử tự động (bộ test tự bật chế độ synthetic qua bunfig.toml)
bun run typecheck      # kỳ vọng exit 0
bun test               # kỳ vọng 286 pass / 0 fail / 67 tệp

# 2. Diễn tập hợp nhất Stage 0 (toàn bộ trong thư mục tạm, không đụng ./data)
export DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true   # diễn tập nạp fixtureFields: bắt buộc bật tường minh
bun docs/reports/arena-stage0-20261029/evidence/drill-stage0.ts            # kỳ vọng 55 PASS / 0 FAIL, exit 0

# 3. Diễn tập backup -> verify -> restore (tự seed môi trường tổng hợp)
bun docs/reports/arena-stage0-20261029/evidence/backup-restore-drill.ts    # kỳ vọng 11 PASS / 0 FAIL, exit 0

# 4. Luồng chính qua máy chủ HTTP thật (client curl, server bind 127.0.0.1)
TMPD=$(mktemp -d /tmp/durios-rehearsal-XXXX); echo $TMPD > /tmp/tmpd.txt
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:seed-rehearsal   # bắt buộc khai báo đích (F-13)
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads DURIOS_PORT=3111 DURIOS_HOST=127.0.0.1 bun run src/server/server.ts &
BASE_URL=http://127.0.0.1:3111 TMPD_FILE=/tmp/tmpd.txt bash docs/reports/arena-stage0-20261029/evidence/http-walkthrough.sh
# kỳ vọng đủ 17 bước, verify:manifest EXIT=0, và bước 15 in hai bộ đếm:
#   machine checks: 2 / 5 | launch gates evidenced: 0 / 5 | goForLiveCustomerData: False | provenance: SYNTHETIC_REHEARSAL

# 5. Ma trận CLI cổng khai trương (7 ca A1-A3 / B1-B4, tự dựng cả hai cơ sở dữ liệu)
bash docs/reports/arena-stage0-20261029/evidence/gate-cli-matrix.sh        # kỳ vọng chỉ ca B4 có EXIT=0

# 6. Demo hai luồng trích xuất (thường vs synthetic) — bằng chứng đóng phần dư F-05
bun docs/reports/arena-stage0-20261029/evidence/extraction-mode-demo.ts   # kỳ vọng 19 PASS / 0 FAIL, exit 0

# 7. Probe giao diện headless (cần happy-dom; KHÔNG phải ảnh chụp màn hình)
npm install --prefix /home/user/tools happy-dom@15
for m in happy-dom entities webidl-conversions whatwg-mimetype; do ln -sfn /home/user/tools/node_modules/$m node_modules/$m; done
DURIOS_UI_HTML=$PWD/src/server/public/index.html DURIOS_UI_OUT=/tmp/ui-out \
  node docs/reports/arena-stage0-20261029/evidence/ui-render-probe.mjs     # kỳ vọng 7/7 PASS, exit 0

# 8. CLI trên cơ sở dữ liệu diễn tập riêng (không dùng dữ liệu vận hành)
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads DURIOS_HOST=127.0.0.1 bun run pilot:verify-gates; echo "EXIT=$?"
# kỳ vọng: máy chấm 2/5, cổng đủ bằng chứng 0/5, provenance SYNTHETIC_REHEARSAL, EXIT=1
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:audit-pack -- --output-dir $TMPD/pack --markdown
bun run pilot:audit-pack -- --verify $TMPD/pack/GOLIVE-*.json              # kỳ vọng Integrity=true

# 9. Tấn công nguồn gốc dữ liệu (F-14b): đổi tên hồ sơ bằng SQL thô, trộn cohort tổng hợp,
#    xoá dòng kiểm toán, khai báo 5 "tệp bằng chứng" không tồn tại
bun docs/reports/arena-stage0-20261029/evidence/gate-provenance-adversarial.ts /tmp/durios-adv-provenance
# kỳ vọng: A1/B1/C1/D1 đều operationalGatesEvidencedCount=0/5 và goForLiveCustomerData=false;
#          C1 in evidenceProvenance=UNPROVEN_LEDGER_INTEGRITY, integrityGATE03=false

# 10. Sinh lại TOÀN BỘ 10 log trong evidence/rerun-20261030/ bằng một lệnh
bash docs/reports/arena-stage0-20261029/evidence/rerun-all.sh              # kỳ vọng "RERUN COMPLETE"

# 11. Đóng gói bàn giao: patch + snapshot + cây cơ sở + cây đã bàn giao, rồi tự kiểm
bash docs/reports/arena-stage0-20261029/package/build-package.sh
bash docs/reports/arena-stage0-20261029/package/verify-package.sh          # kỳ vọng PACKAGE_VERIFIED
bash docs/reports/arena-stage0-20261029/build-handover-archive.sh          # in ra SHA-256 của archive

# 12. Bước 5 của harness: phân quyền + cách ly tenant trên proof kit / KPI / test hồi quy
#     (cần thư mục drill do lệnh 2 để lại; drill in ra "artifacts kept at /tmp/drill-stage0-XXXX")
bash docs/reports/arena-stage0-20261029/evidence/permission-tenant-isolation.sh /tmp/drill-stage0-XXXX
# kỳ vọng: 23 kiểm tra / 0 fail, exit 0. Trong đó pilot:proof-kit của TENANT-DRILL-A exit 1 là ĐÚNG:
# bundle của tenant này chứa manifest DOS-DRILL-HICD còn 1 blocker chưa xử lý (override không xoá blocker)

# Thứ tự bắt buộc khi sửa bất cứ thứ gì: sửa → build-package.sh → verify-package.sh → chạy harness →
# build-handover-archive.sh. Log sinh ra sau archive nên archive cuối luôn chứa log của lượt chạy trước
# đó (xem "vấn đề bootstrap" trong README-HANDOVER.md mục 2).
```

Log thô đợt 2026-10-30 (chạy sau khi mọi chỉnh sửa hoàn tất, sinh lại bằng `evidence/rerun-all.sh`): `evidence/rerun-20261030/{TYPECHECK-LOG.txt,TEST-SUITE-LOG.txt,MODULARITY-LOG.txt,DRILL-STAGE0-LOG.txt,BACKUP-RESTORE-DRILL-LOG.txt,HTTP-WALKTHROUGH-LOG.txt,GATE-CLI-MATRIX-LOG.txt,EXTRACTION-MODE-LOG.txt,GATE-PROVENANCE-ADVERSARIAL-LOG.txt,UI-RENDER-PROBE-LOG.txt}` — 10/10 log có `EXIT=0`. Log đợt 2026-10-29 vẫn giữ trong `evidence/` (một số định dạng output đã cũ — xem ghi chú ở `VERIFICATION.md` §4.3, §4.4). Hướng dẫn từng bước kèm kỳ vọng và cách xử lý sự cố: `RUNBOOK-STAGE0-REHEARSAL.md`.

---

## 7. Hành động tiếp theo (ưu tiên, tối đa 5)

1. **Lấy chữ ký `GATE-01`**: soạn tệp đồng ý dữ liệu + biên bản xác nhận điểm vựa Cai Lậy cho người vận hành và Founder ký; đặt `DURIOS_GATE01_CONSENT_FILE` trỏ tới tệp đó. Đây là cổng duy nhất chặn hoàn toàn việc nạp dữ liệu thật.
2. **Quyết định nhà cung cấp OTP cho `GATE-02`** (chọn vendor, cấp thông tin cấu hình vào môi trường diễn tập riêng); giữ nguyên hành vi fail-closed `503`.
3. **Chạy `GATE-04` trên máy thật của vựa**: backup → verify → restore trên đĩa thật, có người thật thao tác, nộp biên bản kèm đường dẫn backup và kết quả verify.
4. **Đo `GATE-05` bằng con người**: bấm giờ 5 container thật theo protocol trong `docs/pilot-readiness/04_...KPI_PROTOCOL.md`, ghi `HUMAN_STOPWATCH_ATTESTED`, đồng thời thu dữ liệu thay hai giả định kinh tế (xem runbook mục 6).
5. **Kiểm chứng UI bằng mắt người** theo `UI-ACCEPTANCE-CHECKLIST.md` (57 mục: desktop, màn hình hẹp 360/768 px, bàn phím + trình đọc màn hình, 10 trạng thái lỗi, 10 nhãn tổng hợp/diễn tập, 7 mục về hai bộ đếm). Mỗi mục đạt phải có ảnh chụp trong `evidence/ui-acceptance/<ID>.png`, tên người kiểm tra và ngày. Chừng nào chưa có, kết luận bàn giao vẫn phải ghi **"UI CHƯA NGHIỆM THU"** — đầu dò DOM 7/7 không thay thế được việc này.

---

## 8. Trạng thái commit / push / PR / triển khai

- **Chưa commit, chưa push, chưa mở PR, chưa merge, chưa triển khai bất cứ đâu.** Toàn bộ thay đổi nằm trên cây làm việc của nhánh `arena/e0ece0a7-durios` trong sandbox (Arena tự lưu snapshot sau mỗi lượt).
- Đúng theo ràng buộc của đề bài: **không push, không merge, không phát hành, không thay đổi remote**, không triển khai cloud, không cài đặt trên máy khách hàng, không mở vựa thứ hai, không gửi OTP thật, không dùng dịch vụ trả phí, không liên hệ đối tác, không dùng thông tin đăng nhập production.
- Máy chủ vẫn chỉ gắn kết `127.0.0.1`; `assertLoopbackHostname` **không** bị nới lỏng (do đó không có live preview trong sandbox).
- Không tự ký xác nhận điểm vựa, đồng ý dữ liệu, chọn nhà cung cấp hay bất kỳ cổng khai trương nào.
- Sản phẩm bàn giao để xem xét: **diff trên nhánh `arena/e0ece0a7-durios`** (`git diff` + các tệp mới liệt kê ở mục 4), kèm **gói đóng gói độc lập** `docs/reports/arena-stage0-20261029/package/` để người nhận không cần truy cập sandbox: `MANIFEST.txt` (commit cơ sở `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494`, danh sách tệp, SHA-256 + số byte + số dòng từng tệp, kết quả kiểm patch), `stage0-full.patch` (diff đầy đủ **bao gồm tệp mới**, đã kiểm `git apply --check` trên bản clone sạch của commit cơ sở), `APPLY-VERIFY-LOG.txt` (log của lần kiểm đó), và `snapshot/` (bản sao nguyên văn toàn bộ tệp bị ảnh hưởng để đối chiếu trực tiếp, không cần git). Ghi rõ trong `MANIFEST.txt`: **không thể chứng minh** quan hệ giữa cây làm việc này và commit `08992f6` mà đề bài nhắc tới, vì clone nông không chứa commit đó.
- **Không dùng dữ liệu khách hàng thật** ở bất kỳ bước nào: mọi hồ sơ, chứng từ, blob trong báo cáo này đều tổng hợp.
