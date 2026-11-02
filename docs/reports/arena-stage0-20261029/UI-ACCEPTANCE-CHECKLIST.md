# UI-ACCEPTANCE-CHECKLIST — Stage 0

**Trạng thái: UI CHƯA NGHIỆM THU.**

Môi trường tạo ra bàn giao này **không có trình duyệt**: không mở được trang, không chụp được ảnh
màn hình, không quan sát được bằng mắt. Thứ duy nhất đã chạy là `evidence/ui-render-probe.mjs`
— một đầu dò DOM (happy-dom, `disableJavaScriptEvaluation` rồi tự `window.eval`), tức là đọc cây DOM
sau khi script dựng xong. **Đầu dò DOM không thay thế ảnh chụp và không thay thế mắt người**: nó
không thấy được bố cục, tràn ngang, tương phản, thứ tự Tab thật,focus thật hay animation. Vì vậy mọi
mục trong danh sách này vẫn ở trạng thái CHƯA NGHIỆM THU cho tới khi một người có trình duyệt tích
vào ô kết quả và đính kèm ảnh.

Không có mục nào dưới đây được tự ký. Cột "Người kiểm tra / Ngày / Ảnh" để trống là có chủ đích.

---

## 0. Cách dựng UI để kiểm tra (chỉ loopback, dữ liệu tổng hợp)

Mọi lệnh chạy từ gốc cây đã bàn giao. `bun` theo đúng `bun.lock`.

| # | Lệnh | Kết quả mong đợi |
|---|------|------------------|
| 0.1 | `bun install --frozen-lockfile` | exit **0**, `bun.lock` không đổi |
| 0.2 | `mkdir -p /tmp/ui-check && DURIOS_DB_PATH=/tmp/ui-check/durios.db DURIOS_DATA_DIR=/tmp/ui-check/uploads bun src/auth/pilot-rehearsal-seeder.ts` | exit **0**, in ra JSON chứa `tenantId` + mật khẩu diễn tập (tài liệu công khai, chỉ dùng cho diễn tập) |
| 0.3 | `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true DURIOS_HOST=127.0.0.1 DURIOS_PORT=3123 DURIOS_DB_PATH=/tmp/ui-check/durios.db DURIOS_DATA_DIR=/tmp/ui-check/uploads bun src/server/server.ts` | exit **0** khi chạy; log phải ghi `127.0.0.1:3123`, **không** được ghi `0.0.0.0` |
| 0.4 | `curl -fsS http://127.0.0.1:3123/api/health` | exit **0**, `{"status":"healthy",...}` |
| 0.5 | Mở `http://127.0.0.1:3123/` trong trình duyệt | trang workspace tiếng Việt, không lỗi console |
| 0.6 | `curl -fsS http://127.0.0.1:3123/api/health` từ một máy khác trong mạng LAN | **phải thất bại** (không có ingress công khai); nếu được nghĩa là cấu hình sai |

Cờ `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true` ở 0.3 là **bắt buộc** cho diễn tập: nó cho phép
nút "Tải bản mẫu" gửi `fixtureFields`. Không có cờ đó, luồng thường chỉ trích xuất những gì có thật
trong bytes tài liệu, và nút nạp bản mẫu bị từ chối bằng HTTP 400 `SYNTHETIC_EXTRACTION_DISABLED`
(đó là hành vi đúng, không phải lỗi — xem `VERIFICATION.md` §9.5B).

Không bao giờ trỏ UI vào một cơ sở dữ liệu có hồ sơ khách hàng thật trong vòng nghiệm thu này.

---

## 1. Desktop (≥ 1280 × 800, thu phóng 100%)

| ID | Kiểm tra | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|----------|------------------|----------------|------|-----|
| UI-D-01 | Thanh lệnh trên cùng (`#durios-unified-top-nav`) | Trạng thái máy chủ `#system-status-text`, bộ chọn vai trò `#actor-role`, nút "Diễn tập", nút "Đăng nhập Pilot" nằm trên một hàng, không chồng lấn | | | |
| UI-D-02 | Sidebar `#dossier-nav` | Tiêu đề "Hồ sơ (N)" với `#dossier-count` đúng bằng số hồ sơ trong CSDL; nút "Thu gọn" (`#dossier-nav-toggle`) thu/mở được và nhãn đổi theo | | | |
| UI-D-03 | Vùng làm việc `#workspace-main` | Không có thanh cuộn ngang ở 1280 px; bảng hồ sơ không cắt cột | | | |
| UI-D-04 | Lưới KPI `div.kpi-grid` (trạng thái rỗng) | Các thẻ tự xếp `repeat(auto-fit,minmax(180px,1fr))`, chữ không tràn khỏi thẻ, căn giữa | | | |
| UI-D-05 | **Hai bộ đếm** (xem §6) | Cả hai số xuất hiện đồng thời, phân biệt rõ bằng nhãn, không có chỗ nào gộp thành một con số | | | |
| UI-D-06 | Danh sách cổng `ul.gate-list` | Mỗi dòng GATE-01..05 có icon đạt/chưa đạt + phần chữ; `aria-label="Điều kiện phê duyệt và xuất"` | | | |
| UI-D-07 | Hộp thoại `<dialog>` (Tạo hồ sơ, Đăng nhập, Nạp tài liệu) | `showModal()` thật: có nền mờ, hộp thoại nằm giữa, không cuộn nền phía sau | | | |
| UI-D-08 | Chủ đề sáng/tối (`#btn-workspace-theme`) | Nếu nút hiện ra thì đổi được nhãn `#workspace-theme-label` và toàn bộ màu đổi theo, không còn chữ mất tương phản | | | |
| UI-D-09 | Console trình duyệt | Không có lỗi JS chưa bắt; cảnh báo 404 cho tài nguyên tuỳ chọn (nếu có) phải được ghi nhận, không bỏ qua | | | |

## 2. Màn hình hẹp (360 × 640 và 768 × 1024)

| ID | Kiểm tra | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|----------|------------------|----------------|------|-----|
| UI-N-01 | 360 px, trang workspace | **Không có thanh cuộn ngang** trên `<body>`; `<meta name="viewport" content="width=device-width, initial-scale=1.0">` có hiệu lực | | | |
| UI-N-02 | Thanh lệnh trên cùng ở 360 px | Các nút xuống hàng gọn, không đè lên `#system-status`; chữ không bị cắt giữa dòng | | | |
| UI-N-03 | Bộ chọn vai trò `#actor-role` | Vẫn chạm/bấm được (`min-height:30px; min-width:175px`), không tràn khỏi thanh lệnh | | | |
| UI-N-04 | Sidebar ở 360 px | Thu gọn được bằng `#dossier-nav-toggle`; khi thu gọn vẫn mở lại được bằng chính nút đó | | | |
| UI-N-05 | Lưới KPI ở 360 px | Mỗi thẻ một dòng (minmax 180 px), không có thẻ nào bị ép tới mức mất chữ | | | |
| UI-N-06 | Hộp thoại ở 360 px | Vừa chiều ngang, nội dung cuộn bên trong hộp thoại, nút bấm không ra ngoài viền | | | |
| UI-N-07 | Vùng chạm | Mọi nút/bấm được bằng ngón tay, không có mục tiêu nhỏ hơn ~30 px chiều cao | | | |
| UI-N-08 | Bảng chi tiết hồ sơ | Bảng cuộn ngang **bên trong** khối của nó, không kéo cả trang trôi theo | | | |
| UI-N-09 | 768 px (tablet dọc) | Bố cục trung gian hợp lý: sidebar còn chỗ, lưới KPI 2 cột | | | |

## 3. Bàn phím & trợ năng

| ID | Kiểm tra | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|----------|------------------|----------------|------|-----|
| UI-K-01 | Nhấn Tab từ đầu trang | Khung focus thấy rõ ở mọi phần tử; thứ tự: skip link → thanh lệnh → sidebar → vùng làm việc | | | |
| UI-K-02 | Skip link `.skip-link` | Ẩn khi chưa focus, hiện khi Tab tới, kích hoạt thì nhảy tới `#workspace-main` (`tabindex="-1"`) | | | |
| UI-K-03 | Mở hộp thoại rồi nhấn Tab nhiều vòng | Focus **không thoát ra** nền phía sau (native `<dialog>`), Shift+Tab cũng vậy | | | |
| UI-K-04 | Nhấn Esc khi hộp thoại mở | Hộp thoại đóng, focus trả về nút vừa mở nó | | | |
| UI-K-05 | Sau một hành động (thẩm định / xác nhận trường / xuất) | Focus trả về đúng nút theo `data-focus-key` tương ứng, không rơi về đầu trang | | | |
| UI-K-06 | Toàn bộ luồng chính chỉ bằng bàn phím | Tạo hồ sơ → nạp tài liệu → xác nhận từng trường (HITL) → thẩm định → (manager) phê duyệt → xuất: không bước nào bắt buộc dùng chuột | | | |
| UI-K-07 | `#live-status` (`role="status"`, `aria-live="polite"`) | Đọc trình đọc màn hình: kết quả hành động được thông báo, không đọc dồn hàng loạt | | | |
| UI-K-08 | `#live-alert` (`role="alert"`, `aria-live="assertive"`) | Lỗi nghiêm trọng (401/403/409/mất kết nối) được đọc ngay | | | |
| UI-K-09 | Nhãn ẩn `.visually-hidden` | `#actor-role-hint` giải thích rằng khi chưa đăng nhập vai trò chỉ mô phỏng giao diện; dòng "Đạt:/Chưa đạt:" trước mỗi cổng được đọc nhưng không hiện | | | |
| UI-K-10 | `prefers-reduced-motion: reduce` | Bật giảm chuyển động ở hệ điều hành: không còn animation/transition gây khó chịu | | | |
| UI-K-11 | Trạng thái bận `button[aria-busy="true"]` | Nhãn thường ẩn, nhãn bận (`btn__busy`, ví dụ "Đang thẩm định…") hiện; con trỏ `progress`; **không bấm đôi được** để gửi hai lần | | | |
| UI-K-12 | `lang="vi"` và dấu tiếng Việt | Toàn bộ dấu hiển thị đúng, không lỗi font, không hiện ký tự thay thế | | | |

## 4. Trạng thái lỗi

| ID | Cách tạo ra lỗi | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|-----------------|------------------|----------------|------|-----|
| UI-E-01 | Đăng nhập sai mật khẩu | Thông báo lỗi rõ ràng trong hộp thoại, hộp thoại **không** đóng, ô nhập mật khẩu được xoá/đánh dấu `aria-invalid="true"` kèm `#err-*` | | | |
| UI-E-02 | Nhập container sai ISO 6346 (ví dụ `MSKU123456`) | `#err-container-num` báo lỗi số kiểm tra kèm gợi ý `#hint-container-num`; form không gửi đi | | | |
| UI-E-03 | Phiên hết hạn (xoá cookie `durios_session`) rồi bấm một hành động | HTTP 401 → thông báo "phiên hết hạn/đăng nhập lại", UI trở về trạng thái chưa đăng nhập, **không** giữ vai trò MANAGER giả | | | |
| UI-E-04 | Đăng nhập CLERK rồi bấm "Phê duyệt xuất" | HTTP 403 `INSUFFICIENT_ROLE` → thông báo đúng vai trò bị thiếu; nút đó ẩn hoặc bị vô hiệu hoá kèm lý do (`reasonId`) | | | |
| UI-E-05 | Hồ sơ đã seal (`EXPORTED`) rồi thử nạp thêm tài liệu | HTTP 409 → thông báo "hồ sơ đã khoá, không thể sửa"; các nút sửa bị vô hiệu hoá | | | |
| UI-E-06 | Mở hồ sơ trong hai tab, sửa ở tab A rồi lưu ở tab B | Xung đột phiên bản (optimistic concurrency) → thông báo rõ "dữ liệu đã thay đổi, tải lại", **không** ghi đè âm thầm | | | |
| UI-E-07 | Tắt server (`kill`) rồi bấm một hành động | Lỗi mạng được báo bằng câu chữ người dùng hiểu, UI không treo ở trạng thái bận vĩnh viễn, `aria-busy` được gỡ | | | |
| UI-E-08 | Điền form rồi gặp lỗi, đóng hộp thoại và mở lại | Dữ liệu chưa lưu được khôi phục hoặc được cảnh báo trước khi mất — không mất âm thầm | | | |
| UI-E-09 | Hồ sơ thẩm định ra BLOCKED (ví dụ thiếu LAB_TEST_REPORT) | Danh sách blocker hiện đủ `criticalBlockers`, phân biệt được blocker với advisory, kèm căn cứ pháp lý | | | |
| UI-E-10 | Bấm nút "Diễn tập" khi `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP` không bật | HTTP 403 `FEATURE_DISABLED` → thông báo giải thích đúng như nội dung lỗi máy chủ, không hiện nút như thể đã thành công | | | |

## 5. Nhãn dữ liệu tổng hợp / diễn tập (chống nhầm lẫn diễn tập với vận hành)

| ID | Kiểm tra | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|----------|------------------|----------------|------|-----|
| UI-S-01 | Thẻ "Trạng thái dữ liệu" | Giá trị đúng chữ `TỔNG HỢP (SYNTHETIC)`, ghi chú nêu Stage 0 chưa nạp dữ liệu khách hàng thật và GATE-01 cần biên bản có chữ ký | | | |
| UI-S-02 | Nhãn provenance khi chạy trên CSDL diễn tập (`gateProvenanceLabel`) | Đúng chữ `DIỄN TẬP TỔNG HỢP` | | | |
| UI-S-03 | Nhãn provenance trên CSDL vận hành, chuỗi băm hợp lệ | Đúng chữ `VẬN HÀNH` | | | |
| UI-S-04 | Nhãn provenance khi sổ kiểm toán không xác minh được (`UNPROVEN_LEDGER_INTEGRITY`) | Đúng chữ `SỔ KIỂM TOÁN KHÔNG XÁC MINH ĐƯỢC`, kèm ghi chú yêu cầu khôi phục sổ trước | | | |
| UI-S-05 | Provenance không xác định | `KHÔNG XÁC ĐỊNH` — không được suy đoán thành "VẬN HÀNH" | | | |
| UI-S-06 | Đoạn văn provenance trong panel cổng (dòng có `Bằng chứng cổng:`) | Khi `evidenceProvenance === "SYNTHETIC_REHEARSAL"` phải hiện đúng câu "…do lệnh diễn tập tự tạo, không có giá trị phê duyệt khai trương." | | | |
| UI-S-07 | Toast sau khi chạy diễn tập | Nội dung lấy từ phản hồi máy chủ (số cổng, provenance), **không** phải câu "5/5" cứng; trên CSDL diễn tập phải nói rõ là diễn tập | | | |
| UI-S-08 | Tài liệu nạp bằng nút "Tải bản mẫu" | Trường trích xuất ở trạng thái `DRAFT` chờ người xác nhận (HITL), không tự chuyển sang đã xác minh | | | |
| UI-S-09 | Mọi nơi hiển thị số cổng | Không có chỗ nào biến "kiểm tra máy đạt" thành "cổng đã đủ bằng chứng"; không có nhãn "PASS" trần trên dữ liệu diễn tập | | | |
| UI-S-10 | Gói xuất / báo cáo tải về từ UI (nếu có nút) | Nội dung mang disclaimer diễn tập khi provenance không phải `VẬN HÀNH` | | | |

## 6. Hai bộ đếm (điểm dễ nhầm nhất của Stage 0)

Hai con số này **khác nhau về bản chất** và UI phải cho thấy điều đó ở mọi nơi chúng xuất hiện:

- `machineChecksPassedCount` — tiêu chí **máy chấm được** (tệp chấp thuận có tồn tại, OTP đã cấu hình,
  host loopback + chuỗi băm hợp lệ, backup xác minh được, KPI ≥ 5 container cùng tenant…).
- `operationalGatesEvidencedCount` — cổng **đủ bằng chứng khai trương**: máy chấm đạt **VÀ** có tệp
  bằng chứng thật do một người có tên ghi nhận **VÀ** provenance là `VẬN HÀNH`.

| ID | Kiểm tra | Kết quả mong đợi | Người kiểm tra | Ngày | Ảnh |
|----|----------|------------------|----------------|------|-----|
| UI-C-01 | Thẻ cổng ở trạng thái rỗng | Giá trị dạng `N/5 CỔNG ĐỦ BẰNG CHỨNG` (lấy từ `operationalGatesEvidencedCount`), **không** phải số kiểm tra máy | | | |
| UI-C-02 | Ghi chú dưới thẻ đó | Nêu rõ "Kiểm tra tự động (máy chấm được): X/5 tiêu chí." rồi giải thích cổng chỉ mở khi **cả hai** điều kiện đạt | | | |
| UI-C-03 | Trên CSDL diễn tập chưa có gì | `0/5 CỔNG ĐỦ BẰNG CHỨNG` và `Kiểm tra tự động … 2/5 tiêu chí` — hai số phải khác nhau và cùng hiện ra | | | |
| UI-C-04 | Bất biến | Không bao giờ thấy `operationalGatesEvidencedCount > machineChecksPassedCount` | | | |
| UI-C-05 | Dòng trạng thái cổng chi tiết | Mỗi cổng trình bày **tách bạch** ba phần: kiểm tra máy, bằng chứng con người (`PENDING_OPERATOR_EVIDENCE` / `RECORDED_BY_OPERATOR`), và verdict (`PENDING` / `MACHINE_CHECK_ONLY` / `EVIDENCED_FOR_LAUNCH`) | | | |
| UI-C-06 | Ngôn từ | Không có chữ nào ngụ ý hệ thống tự cấp phép khai trương (ví dụ "đã sẵn sàng chạy thật"); quyết định là của Founder | | | |
| UI-C-07 | Khi máy chấm đạt 5/5 nhưng chưa có bằng chứng | UI vẫn phải hiển thị `0/5 CỔNG ĐỦ BẰNG CHỨNG` và không đổi màu thành "đã đạt toàn bộ" | | | |

## 7. Đầu dò DOM đã phủ tới đâu (và không phủ được gì)

`evidence/ui-render-probe.mjs` — log: `evidence/rerun-20261030/UI-RENDER-PROBE-LOG.txt` (7/7 PASS, exit 0).

| Đầu dò | Đã chứng minh | Liên quan mục | Còn lại phải dùng mắt |
|--------|---------------|---------------|------------------------|
| A | Trạng thái rỗng không có dữ liệu cổng/KPI thì đọc là `PENDING`, không khẳng định kết quả | UI-C-03, UI-D-04 | Bố cục, tương phản, tràn chữ |
| B | Trạng thái rỗng sau diễn tập tổng hợp có nhãn rehearsal | UI-S-01, UI-S-02, UI-S-06 | Cách nhãn trông thật trên màn hình |
| C | Chạy vận hành với 2 kiểm tra máy không bị gọi là "2 cổng đã đạt" | UI-C-01..04, UI-S-09 | Diễn đạt thị giác (màu, icon) |
| D | Huy hiệu KPI hiện **cả hai** bộ đếm và callout giải thích khác biệt | UI-C-01, UI-C-02, UI-D-05 | Hai số có dễ nhầm khi nhìn nhanh không |
| E | `currentRole()`: anonymous=MANAGER (mô phỏng cục bộ), phiên CLERK=CLERK, phiên AUDITOR=AUDITOR và `select` không tự đổi vai trò | UI-E-03, UI-E-04 | Focus, thứ tự Tab, thông báo aria-live |
| F | Toast diễn tập sinh ra từ phản hồi máy chủ, không phải câu "5/5" cứng | UI-S-07 | Toast có đọc được, có tự mất hợp lý không |
| G | Mỗi dòng cổng nêu riêng kiểm tra máy / bằng chứng / verdict | UI-C-05 | Đọc thật bằng trình đọc màn hình |

**Không mục nào ở §1, §2, §3, §4 được coi là đạt nhờ đầu dò DOM.** Đầu dò chỉ chứng minh script dựng
đúng chuỗi HTML; nó không chứng minh trang hiển thị đúng, không chứng minh dùng được bằng bàn phím,
và không thay thế ảnh chụp.

## 8. Quy tắc ghi bằng chứng UI

1. Mỗi mục đạt phải có: ảnh chụp màn hình (desktop **và** 360 px với các mục §2), tên người kiểm tra,
   ngày, và trình duyệt + phiên bản. Ảnh lưu vào `evidence/ui-acceptance/<ID>.png`.
2. Mục không đạt phải ghi lại: ID, cách tái hiện, ảnh, mức ảnh hưởng (P0/P1/P2), và tiêu chí đóng.
   Không gộp nghi ngờ chưa tái hiện được vào danh sách lỗi đã xác nhận (12 nghi ngờ N-01..N-12 trong
   `FINDINGS.md` §4 vẫn ở trạng thái backlog).
3. Không tự nâng trạng thái: chừng nào §1–§6 chưa có ảnh và người ký, kết luận bàn giao vẫn phải ghi
   **"UI CHƯA NGHIỆM THU"**. Nghiệm thu UI là việc của người nhận, không phải của bên tạo ra mã.
4. Chỉ kiểm tra trên dữ liệu tổng hợp ở thư mục tạm. Không trỏ UI vào CSDL có hồ sơ khách hàng thật,
   không mở cổng ra ngoài `127.0.0.1` trong vòng nghiệm thu này.

## 9. Kết luận của tài liệu này

- Danh sách kiểm tra UI: **đã cung cấp** — 57 mục có ID, chia 6 nhóm: desktop 9 (UI-D), màn hình hẹp 9
  (UI-N), bàn phím & trợ năng 12 (UI-K), trạng thái lỗi 10 (UI-E), nhãn tổng hợp/diễn tập 10 (UI-S),
  hai bộ đếm 7 (UI-C); cộng 6 lệnh dựng UI ở §0 và bảng đối chiếu phạm vi đầu dò DOM ở §7.
- Thực thi danh sách bằng trình duyệt: **CHƯA THỰC HIỆN** — môi trường bàn giao không có trình duyệt.
- Bằng chứng thay thế đã có: đầu dò DOM 7/7 (không phải ảnh), hợp đồng UI tĩnh
  (`test/static-ui-contract.test.ts`) và toàn bộ hành vi máy chủ đứng sau UI đã được kiểm chứng bằng
  HTTP thật ở bước 4 của `evidence/acceptance-harness.sh`.
- Trạng thái bàn giao: **UI CHƯA NGHIỆM THU.**
