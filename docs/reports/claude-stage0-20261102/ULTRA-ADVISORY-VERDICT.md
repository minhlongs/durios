# Phán Quyết Best-of-5 (`--ultra` Verifier Verdict) — DuriOS Stage 0

- **Ngày thực thi:** `2026-11-02`
- **Phương thức:** Chạy 5 ứng viên tư vấn độc lập ở chế độ chỉ đọc (`Candidate 1..5`) từ cùng bản reframing đã được người dùng xác nhận, sau đó đối chiếu chéo với bằng chứng mã nguồn, lịch sử Git, và kết quả chạy thực nghiệm trên macOS (`Darwin 27.0.0`).
- **Ứng viên chiến thắng (Winning Candidate):** **Candidate 4 (`acc6fffa2ebfa7d7f`)** — kết hợp bổ sung bảng mã kiểm thử từng `it()` từ **Candidate 5 (`a114fa62949c20941`)** và mã nguồn mẫu `F-16`/`F-17` từ **Candidate 3 (`a4649c6b2c117fbbd`)**.

---

## 1. Bảng Chấm Điểm & So Sánh 5 Ứng Viên (`Candidate 1..5`)

| Ứng viên | Mã Agent | Điểm mạnh nổi bật | Điểm yếu / Thiếu sót | Xếp hạng |
|---|---|---|---|---|
| **Candidate 1** | `a7f12b6f24159a7d3` | Trình bày công thức toán học đối soát số lượng test rất sáng sủa; nêu rõ 2 điểm giao thoa `src/server/http-router.ts` và `src/server/static-ui.ts`; phân loại đầy đủ `N-01..N-12`. | Ghi nhầm tiền tố ID tài khoản diễn tập là `USR-CAILAY-CLERK-01` thay vì `ACC-CAILAY-CLERK-01` thực tế trong `pilot-rehearsal-accounts.ts`; chưa chỉ ra lỗi `cat -A` (`gate-cli-matrix.sh:163`) và `/home/user/durios/data` (`http-walkthrough.sh:105`) trên macOS. | Hạng 4 |
| **Candidate 2** | `a792368f2fa4107de` | Cấu trúc 4 kết luận tách biệt rất chuẩn; đối chiếu rõ `08992f6` vs `2f1538e8` (`022dd41`). | Chưa liệt kê chi tiết từng dòng lệnh BSD/Linux gây gãy script trong `http-walkthrough.sh` và `gate-cli-matrix.sh`. | Hạng 5 |
| **Candidate 3** | `a4649c6b2c117fbbd` | Cung cấp đúng mã nguồn mẫu cho `src/auth/rehearsal-account-guard.ts` (với đúng `ACC-CAILAY-CLERK-01`, `ACC-CAILAY-MGR-01`, `+84901000111`, `+84901000222`) và `src/auth/cli-db-args.ts` giữ trần `<= 100 LOC`. | Đề xuất dùng shim `sha256sum` cho `acceptance-harness.sh` nhưng chưa phát hiện 2 lỗi BSD/Linux nằm sâu trong `http-walkthrough.sh:105` và `gate-cli-matrix.sh:163`. | Hạng 2 |
| **Candidate 4 (WINNER)** | `acc6fffa2ebfa7d7f` | **Chính xác tuyệt đối về thực nghiệm trên macOS:** Là ứng viên duy nhất phát hiện và kiểm chứng thực nghiệm cả 3 điểm không tương thích Linux/macOS trong bộ script của Arena (`gate-cli-matrix.sh:163` dùng `cat -A`, `http-walkthrough.sh:105` gắn cứng `/home/user/durios/data`, và `acceptance-harness.sh:142` gọi `sha256sum --version`); đồng thời giải mã đầy đủ công thức test `236 -> 242 -> 258 -> 280 / 286 -> 294 / 300` và phân tích chính xác `F-16`, `F-17`, `N-01..N-12`, `TD-01..TD-13`. | Không liệt kê tên tiếng Anh của từng hàm `it()` dài như Candidate 5 (đã được hợp nhất bổ sung vào bản tổng hợp bên dưới). | **Hạng 1 (Chiến thắng)** |
| **Candidate 5** | `a114fa62949c20941` | Liệt kê đầy đủ tên của toàn bộ `50` bài kiểm thử mới (`6` test AEO/Showroom + `44` test Stage 0) trong bảng đối soát; giải thích rất kỹ lý do không xóa `bunfig.toml`. | Chưa chỉ ra lỗi `cat -A` và `/home/user/durios/data` khi chạy `acceptance-harness.sh` trên macOS. | Hạng 3 |

---

## 2. Nội Dung Khuyến Nghị Chiến Thắng Đã Hợp Nhất & Xác Minh Thực Thi

### Needs from you (Các quyết định và hiện vật cần Founder phê duyệt / cung cấp)

1. **Quyết định xử lý gói `durios-stage0-handover-20261101-r4.tar.gz` đang thiếu trên ổ đĩa:**
   - **Hiện trạng đã xác minh:** Trên toàn bộ máy macOS (`Darwin 27.0.0`), chỉ tồn tại gói `/Users/macbook/Downloads/durios-stage0-handover-20261030.tar.gz` (`18,930,266` bytes, SHA-256: `ce97836cf4f24a3b1b6b1b21a862d613c3a13dd9133ea4dfb7c9e2350744d38e`). Cả hai gói `durios-stage0-handover-20261101-r4.tar.gz` (kỳ vọng `21,111,062` bytes, SHA-256: `57157c34b4d73526c04273b68337d80d2b82143415018cb71106c77e75513287`) và `20261031-r4.tar.gz` (`5ad207c7...251d3`) đều **không tồn tại trên đĩa**.
   - **Khuyến nghị (Đã thực thi theo quyết định của bạn):** Nghiệm thu độc lập trên gói `20261030.tar.gz` đã kiểm chứng checksum `184/184` và `128/128`, ghi nhận chính thức `20261101-r4.tar.gz` là `MISSING_ON_DISK`, không bịa nội dung báo cáo `r4` chưa từng đọc, đồng thời kiểm toán và đóng trực tiếp `F-16` + `F-17` kèm `+14` bài kiểm thử hồi quy ngay trên nhánh tích hợp `stage0/arena-integration-20261102` (Tree B).

2. **Phê duyệt của Founder cho đề xuất tách `GATE-05` thành `GATE-05A` (Pre-Cutover) và `GATE-05B` (Live Pilot Graduation):**
   - **Hiện trạng xung đột tài liệu:** `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` (dòng 14, 39–47) cấm nạp bất kỳ dữ liệu khách hàng thật nào cho tới khi cả 5 cổng `GATE-01..GATE-05` đều đạt `PASS`, trong khi `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` (dòng 58) định nghĩa tiêu chí đạt `GATE-05` là thời gian đối soát trung bình `< 5 phút trên 5 container thật`.
   - **Khuyến nghị:** Founder ký duyệt tách `GATE-05` thành:
     - **`GATE-05A` (Pre-Cutover Operational Readiness):** Đạt `< 5 phút` (`300s`) và bắt `100%` lỗi gài mù (`2/2` blind faults) trên bộ 5 hồ sơ diễn tập tại máy vựa với nhân sự vựa thật thao tác — mở khóa bước nạp 5 container thật đầu tiên sau khi `GATE-01..GATE-04` đã có đủ bằng chứng vận hành.
     - **`GATE-05B` (Live Cohort Graduation):** Đạt `< 5 phút` (`HUMAN_STOPWATCH_ATTESTED`), `100%` bắt lỗi nghiêm trọng, `0` lỗi P0 trên đúng 5 container thật đầu tiên tại vựa Cai Lậy trước khi đóng đợt pilot.

3. **Bằng chứng bên ngoài bắt buộc cho `GATE-01..GATE-04` trước khi nạp dữ liệu khách hàng thật:**
   - **`GATE-01`:** Văn bản chấp thuận xử lý dữ liệu (PDPL) và biên bản xác nhận điểm vựa `SITE-CAILAY-TIENGIANG-01` có chữ ký của Chủ vựa Cai Lậy và Founder (`DURIOS_GATE01_CONSENT_FILE`, `DURIOS_GATE01_EVIDENCE_FILE`).
   - **`GATE-02`:** Quyết định chọn nhà cung cấp OTP (Zalo ZNS / SMS) hoặc biên bản cấp phát tài khoản vận hành cá nhân bằng mật khẩu mạnh riêng biệt qua `pilot-ops-cli.ts` (`DURIOS_GATE02_EVIDENCE_FILE`).
   - **`GATE-03`:** Biên bản xác nhận hạ tầng máy chủ tại vựa (`NODE_ENV=production`, reverse proxy HTTPS nội bộ trỏ về `127.0.0.1:3000`, mã hóa ổ đĩa FileVault/LUKS, phân quyền tệp bí mật `0600`, `DURIOS_GATE03_EVIDENCE_FILE`).
   - **`GATE-04`:** Biên bản diễn tập `backup-site -> verify-backup -> restore-site` trên ổ đĩa gắn ngoài đã mã hóa tại máy vựa (`DURIOS_BACKUP_DIR`, `DURIOS_GATE04_EVIDENCE_FILE`) kèm chữ ký người vận hành (`DURIOS_GATE_EVIDENCE_ATTESTED_BY`).

---

### 1. Verdict (Kết Luận 4 Phần Tách Biệt)

1. **Kỹ thuật Stage 0 Core (`Technical Readiness`):** **`PASS — 100% VERIFIED ON BOTH TREES`**
   - Gói `durios-stage0-handover-20261030.tar.gz` khớp `100%` SHA-256 (`184/184` trong `CHECKSUMS.txt`, `128/128` trong `package/SHA256SUMS.txt`).
   - Chứng minh thực nghiệm: commit cơ sở `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494` của Arena trùng khớp `0 byte diff` trên toàn bộ `523` tệp tracked với commit `022dd41` (tiến trước `main` `08992f6` đúng 4 commit AEO/Showroom/CMO).
   - Trên nhánh tích hợp sạch `stage0/arena-integration-20261102` (Tree B, tách từ `08992f6` và loại bỏ 21 tệp AEO/Showroom/CMO), toàn bộ `F-01..F-15` (`+F-14b`) cùng bản sửa tại chỗ cho **`F-16`** và **`F-17`** đều đã hoàn tất: `bun run typecheck` đạt `0 errors`, `bun test` đạt **`294 pass / 0 fail`** trên **`66` tệp**, `15/15` Socratic Turns PASS (`maxSrcLoc=100`, `maxTestLoc=100`, `0 :any`), và `acceptance-harness.sh` đạt **`10/10 bước PASS (89/89 checks)`** trên cả Tree A lẫn Tree B.
2. **Giao diện người dùng (`UI Acceptance`):** **`PASS — VERIFIED ON REAL CHROME HEADLESS + DOM PROBE`**
   - Đã chạy kiểm chứng trên trình duyệt Google Chrome thật (`playwright-core`) ở cả 3 độ phân giải Desktop (`1280×800`), Tablet (`768×1024`), và Mobile (`360×640`) cùng `ui-render-probe.mjs` (`7/7 PASS`): đạt **`19/19 checks PASS`**, `0` lỗi console/pageerror, và **đã sửa dứt điểm lỗi tràn ngang responsive ở `768px` và `360px`** (`scrollWidth === clientWidth` trên cả 3 khung nhìn) kèm 8 ảnh chụp màn hình trong `docs/reports/claude-stage0-20261102/screenshots/`.
3. **Sẵn sàng Cutover cài đặt máy trạm tại vựa (`Site Cutover Readiness`):** **`READY FOR STAGING / REHEARSAL INSTALL — HOLD FOR LIVE CUTOVER UNTIL GATE-01..05A SIGNED`**
   - Phần mềm, CLI vận hành, cơ chế sao lưu/khôi phục (`backup-site`, `verify-backup`, `restore-site`), và checklist cutover/rollback đã sẵn sàng 100% để cài đặt ở chế độ staging/diễn tập tại máy trạm vựa Cai Lậy.
4. **Sẵn sàng chạy Pilot với dữ liệu khách hàng thật (`Live Customer Data Pilot`):** **`BLOCKED (HOLD_PENDING_EXTERNAL_EVIDENCE)`**
   - Máy chấm tự động đạt `2/5`, nhưng bằng chứng vận hành bên ngoài đạt **`0/5`** (`operationalGatesEvidencedCount = 0/5`, `goForLiveCustomerData = false`). Tuyệt đối chưa nạp dữ liệu khách hàng thật cho đến khi Founder ký duyệt `GATE-05A`/`GATE-05B` và ghi nhận đủ bằng chứng thực địa `GATE-01..GATE-05`.

---

### 2. Công Thức Đối Soát Chính Xác 100% Số Lượng Kiểm Thử

$$\begin{aligned}
\text{Base }\mathtt{08992f6}\ (\text{local }\mathtt{main}) &= \mathbf{54\text{ tệp}} \;/\; \mathbf{236\text{ tests}} \\
+\ \text{3 tệp AEO/Showroom trong }\mathtt{2f1538e8}\ (\equiv \mathtt{022dd41}) &= +3\text{ tệp} \;/\; +6\text{ tests}\ (3 + 2 + 1) \\
=\ \text{Base Arena }\mathtt{2f1538e8} &= \mathbf{57\text{ tệp}} \;/\; \mathbf{242\text{ tests}} \\
+\ \text{10 tệp Stage 0 mới trong }\mathtt{delivered\text{-}20261030} &= +10\text{ tệp} \;/\; +44\text{ tests}\ (16\text{ Đợt 1} + 28\text{ Đợt 2}) \\
=\ \textbf{Tree A (}\mathtt{delivered\text{-}20261030}\textbf{ trên }\mathtt{2f1538e8}\textbf{)} &= \mathbf{67\text{ tệp}} \;/\; \mathbf{286\text{ tests}}\ (4,484\ \mathtt{expect()}) \\
-\ \text{Loại bỏ 3 tệp AEO/Showroom khi tích hợp về }\mathtt{08992f6} &= -3\text{ tệp} \;/\; -6\text{ tests} \\
=\ \textbf{Tree B trước khi vá }\mathtt{F\text{-}16/F\text{-}17}\textbf{ (trên }\mathtt{08992f6}\textbf{)} &= \mathbf{64\text{ tệp}} \;/\; \mathbf{280\text{ tests}}\ (4,418\ \mathtt{expect()}) \\
+\ \text{2 tệp kiểm thử hồi quy }\mathtt{F\text{-}16}\text{ và }\mathtt{F\text{-}17} &= +2\text{ tệp} \;/\; +14\text{ tests}\ (7 + 7) \\
=\ \textbf{Tree B hoàn chỉnh (}\mathtt{stage0/arena\text{-}integration\text{-}20261102}\textbf{)} &= \mathbf{66\text{ tệp}} \;/\; \mathbf{294\text{ tests}}\ (4,460\ \mathtt{expect()},\ \text{tương đương }\mathbf{300\text{ tests}}\text{ trên }\mathtt{2f1538e8})
\end{aligned}$$
