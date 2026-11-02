# FINDINGS — DuriOS Stage 0 (2026-10-29, bổ sung F-13..F-15 ngày 2026-10-30)

Quy ước: một mục chỉ được gọi là **phát hiện (finding)** khi nêu đủ ba thứ: **đường thực thi** (tệp/dòng + luồng gọi), **điều kiện kích hoạt** và **tác động**. Những gì không chứng minh được bằng thực thi nằm ở mục 4 (**nghi ngờ chưa tái hiện**). Mọi bằng chứng thô nằm trong `evidence/` và `VERIFICATION.md`.

Mức độ: **P0** = mất quyền kiểm soát truy cập/dữ liệu; **P1** = sai lệch tính đúng đắn của hồ sơ hoặc rò rỉ giữa các tenant; **P2** = suy giảm độ tin cậy/vận hành, chưa chứng minh được mất dữ liệu.

---

## 1. Bảng tóm tắt

| ID | Mức | Tiêu đề | Trạng thái | Kiểm thử hồi quy |
|---|---|---|---|---|
| F-01 | P1 | Manifest xuất khẩu trả về **không lọc** cho bên nhận chia sẻ | **ĐÃ SỬA** | `test/manifest-redaction-and-tenant-kpi.test.ts` |
| F-02 | P1 | KPI và cổng khai trương **trộn hồ sơ của tenant khác** | **ĐÃ SỬA** | `test/manifest-redaction-and-tenant-kpi.test.ts` |
| F-03 | P0 | `POST /api/auth/pilot-rehearsal-bootstrap` tự cấp token `MANAGER` **không cần đăng nhập** | **ĐÃ SỬA** | `test/rehearsal-bootstrap-and-provenance.test.ts` |
| F-04 | P1 | Phiếu kiểm nghiệm **không có Cadmi** vẫn đi tới `PASSED` | **ĐÃ SỬA** | `test/extraction-and-rule-fail-closed.test.ts` |
| F-05 | P1 | Bộ trích xuất giả lập **bịa số** cho ảnh scan (`image/png`, `image/jpeg`, `image/tiff`) | **ĐÃ SỬA; phần dư đã ĐÓNG** (chế độ synthetic bật tường minh) | `test/extraction-and-rule-fail-closed.test.ts`, `test/synthetic-extraction-mode.test.ts` |
| F-06 | P1 | Mã băm manifest **bỏ hở** trường phát hiện/tuyên bố/người xuất/thời điểm | **ĐÃ SỬA** | `test/manifest-integrity-tamper.test.ts` |
| F-07 | P1 | Diễn tập 5 cổng tạo ra **`PASS` giả** có vẻ như bằng chứng vận hành | **ĐÃ SỬA** | `test/rehearsal-bootstrap-and-provenance.test.ts` |
| F-08 | P2 | KPI trình bày **số kinh tế bịa** như kết quả đo | **ĐÃ SỬA** | `test/manifest-redaction-and-tenant-kpi.test.ts` (nhãn nguồn) |
| F-09 | P1 | UI hiển thị kết quả tổng hợp **không nhãn**, có chỗ tự nhận là `WORM` | **ĐÃ SỬA** | `evidence/ui-render-probe.mjs` (6/6) |
| F-10 | P2 | UI cho **chọn vai trò** khi gọi API (gợi ý tự nâng quyền) | **ĐÃ SỬA** | `evidence/ui-render-probe.mjs` |
| F-11 | P2 | `bun run pilot:audit-pack -- --verify` **đổ stack ENOENT** (tài liệu hướng dẫn sai) | **ĐÃ SỬA** | log `evidence/CLI-AUDIT-PACK-LOG.txt` |
| F-12 | P2 | `bun run pilot:verify-gates` **không in gì** (thiếu `import.meta.main`) | **ĐÃ SỬA** | log `evidence/CLI-KPI-GATES-PROOFKIT-LOG.txt` |
| F-13 | P1 | `pilot:seed-rehearsal` **mặc định ghi vào DB vận hành** `./data/durios.db` và tạo tài khoản mật khẩu công khai | **ĐÃ SỬA** | `test/rehearsal-seed-target-guard.test.ts` |
| F-14 | P1 | Cohort **tổng hợp** (hồ sơ do lệnh seed diễn tập tạo) vẫn có thể cho ra `goForLiveCustomerData: true` nếu khai báo tệp bằng chứng | **ĐÃ SỬA — cơ chế nguồn gốc viết lại 2026-10-30** (bản sửa đầu tiên chỉ nhìn tiền tố mã hồ sơ ⇒ đổi tên bằng SQL là qua mặt được; xem F-14b) | `test/gate-cohort-provenance.test.ts`, `test/gate-provenance-adversarial.test.ts`, `test/gate-evidence-artifact.test.ts`, `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt` |
| F-15 | P2 | CLI/UI diễn đạt **hai khái niệm khác nhau bằng một con số** ("2/5 cổng") — tiêu chí máy chấm được vs cổng khai trương đủ bằng chứng | **ĐÃ SỬA** | `test/pilot-gate-evidence-split.test.ts`, `evidence/ui-render-probe.mjs` (7/7) |

---

## 2. Chi tiết từng phát hiện

### F-01 (P1) — Manifest xuất khẩu không lọc cho bên nhận chia sẻ
- **Đường thực thi (trước khi sửa):** `src/server/dossier-handlers.ts` → `GET /api/dossiers/:id/manifest` trả nguyên bản ghi từ kho manifest cho **mọi** actor có quyền đọc hồ sơ, không xét `scope`/`purpose` của quyền chia sẻ.
- **Kích hoạt:** tenant B được cấp quyền chia sẻ với `purpose: "BUYER_VERIFICATION"` rồi gọi `GET /api/dossiers/:id/manifest`.
- **Tác động (đo được bằng probe3):** tenant B nhận `200` với **manifest đầy đủ chưa lọc**: `declaredNetWeightKg: 18240`, `invoice_value: "USD 92000"`, `unit_price: "4.85"`. Đây là rò rỉ dữ liệu thương mại xuyên tenant, vi phạm chính sách 5A-5 mà luồng xem hồ sơ (`redactDossierForActor`) đang áp dụng.
- **Sửa (gốc rễ, không đổi schema):** tách `src/server/export-manifest-handler.ts` (chỉ cho phép `MANIFEST_PURPOSES = ["BUYER_VERIFICATION","CUSTOMS_INSPECTION","AUDIT"]`, dòng 8), thêm `src/sharing/export-manifest-redactor.ts:26` (`redactExportManifestForActor`) tái dùng `src/sharing/redaction-policy.ts` (đã trích từ `dossier-redactor.ts`, hành vi hồ sơ không đổi). Các mục đích không biện minh cho việc giữ manifest (ví dụ `TRADE_FINANCE`) → `403`. Bản trả về cho bên nhận kèm khối `redaction { applied: true, notice }` giải thích rằng hai mã băm vẫn trỏ tới bản ghi đầy đủ của chủ sở hữu.
- **Bằng chứng sau sửa:** diễn tập S7 — bên nhận vẫn thấy `containerNumber/sealNumber/targetMarket/borderGate/temperature`, bị ẩn `92000`/`4.85`/trọng lượng khai báo; `TRADE_FINANCE` → `403`; kiểm thử 4 ca trong `test/manifest-redaction-and-tenant-kpi.test.ts`.

### F-02 (P1) — KPI/cổng trộn hồ sơ tenant khác
- **Đường thực thi (trước khi sửa):** `src/auth/pilot-kpi-evaluator.ts` và `src/auth/pilot-launch-gate-verifier.ts` lấy `workspace.listDossiers(actor)` rồi tính trên **toàn bộ** kết quả, gồm cả hồ sơ mà actor chỉ nhìn thấy nhờ quyền chia sẻ.
- **Kích hoạt:** tenant B có quyền chia sẻ trên một hồ sơ đã xuất của tenant A, gọi `GET /api/pilot/kpi` và `GET /api/pilot/gates`.
- **Tác động (probe3):** KPI của tenant B báo `totalContainers: 1` và `passedCount: 1` — tức là năng lực vận hành của tenant A bị tính vào báo cáo sẵn sàng của tenant B. Sai lệch số liệu ra quyết định khai trương + oracle thông tin xuyên tenant.
- **Sửa:** thêm `src/auth/pilot-kpi-cohort.ts:23` (`selectOwnTenantDossiers`) và dùng tại 5 điểm gọi (evaluator, gate verifier `src/auth/pilot-launch-gate-verifier.ts:17`, pack compiler, CLI). KPI/cổng chỉ tính trên hồ sơ `tenantId` **thuộc về** actor.
- **Bằng chứng sau sửa:** diễn tập S8 — grantee `totalContainers = 0`, owner `4`; kiểm thử "keeps a shared dossier out of the grantee tenant's KPI and launch gates".

### F-03 (P0) — Bootstrap diễn tập tự cấp đặc quyền không cần đăng nhập
- **Đường thực thi (trước khi sửa):** `src/server/ecosystem-rehearsal-handler.ts` → `POST /api/auth/pilot-rehearsal-bootstrap?role=MANAGER` tạo tenant diễn tập + actor + Pilot Token và trả về cookie/token **không kiểm tra bất kỳ phiên nào**.
- **Kích hoạt:** một POST không xác thực tới máy chủ. Gắn kết loopback không phải là ranh giới an toàn: tiến trình khác trên cùng máy, một trang web gửi POST chéo nguồn (đơn giản, không cần đọc phản hồi), hoặc reverse proxy chuyển tiếp `Host: 127.0.0.1:3000` đều tới được.
- **Tác động (probe3):** phản hồi `200` kèm `managerPilotToken dpt_...`; `GET /api/auth/me` với token đó trả `role: "MANAGER"`. Đây là **tự nâng quyền từ ẩn danh lên vai trò phê duyệt/xuất hồ sơ** — vi phạm tiêu chí "client không thể tự nâng quyền".
- **Sửa:** thêm `src/server/rehearsal-bootstrap-guard.ts` (`REHEARSAL_BOOTSTRAP_ENV_FLAG = "DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP"`, dòng 18). Mặc định → `403 FEATURE_DISABLED` (dòng 36), không tạo tài khoản, không cấp token, không đặt cookie. Chỉ bật khi người vận hành khai báo rõ đây là sandbox diễn tập.
- **Bằng chứng sau sửa:** diễn tập S6 — giả mạo `x-actor-role` mà không có phiên → `401`; S9 — bootstrap bị từ chối `403 FEATURE_DISABLED`, không `set-cookie`, không token `dpt_`, không tenant diễn tập; khi opt-in thì 5/5 cổng `PASS_SYNTHETIC_REHEARSAL` nhưng `goForLiveCustomerData: false`. Kiểm thử "is refused by default and provisions no account, token or dossier".
- **Tương thích:** hai kiểm thử cũ (`test/stitch-static-route.test.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`) từng dựa vào hành vi mở mặc định đã được cập nhật để **đặt cờ trong hook** — không xóa, không nới khẳng định.

### F-04 (P1) — Thiếu Cadmi vẫn `PASSED`
- **Đường thực thi (trước khi sửa):** `src/rules/cadmium-evaluators.ts` chỉ đánh giá khi `cadmium_mg_kg` là số; khi trường vắng/không phải số, hàm **trả về rỗng** → không có blocker nào được sinh ra.
- **Kích hoạt:** nạp phiếu kiểm nghiệm không có dòng Cadmi (hoặc OCR không đọc ra), rồi chạy thẩm định.
- **Tác động (probe4):** hồ sơ chỉ có `sample_code` vẫn đạt `PASSED` — tức là "thiếu dữ liệu bắt buộc" trở thành "đạt", đi ngược yêu cầu B ("missing data ... never become PASS") và làm vô hiệu kiểm soát an toàn thực phẩm quan trọng nhất của luồng.
- **Sửa:** giá trị không đọc được → `CRITICAL_BLOCKER` với `observedValue: "NOT_EXTRACTED"` (`src/rules/cadmium-evaluators.ts:38`); thêm `src/rules/extraction-completeness.ts` (53 dòng) sinh `RUL-DOC-UNREADABLE` khi một chứng từ hoạt động không có trường nào trích xuất được. `src/rules/deterministic-engine.ts` ghép cả hai, vẫn phân biệt ngưỡng nội bộ (`RUL-INT-CD-WARN` 0.040) và quy chuẩn luật định (GB 2762-2022 0.050), và **không** kích hoạt luật đang cách ly.
- **Bằng chứng sau sửa:** diễn tập S10 — phiếu thiếu Cadmi → `VALIDATION_BLOCKED` với `observedValue: "NOT_EXTRACTED"`; luật cách ly `RUL-GB2762-CD` không nổ; kiểm thử "blocks a lab report whose cadmium result is absent instead of passing it silently".

### F-05 (P1) — Fixture extractor bịa số cho ảnh scan
- **Đường thực thi (trước khi sửa):** `src/extraction/fixture-extractor.ts` khai `supports()` cho **mọi** loại MIME, nên `src/extraction/composite-extractor-registry.ts` chọn nó làm bộ giải mã cho cả `image/png`, `image/jpeg`, `image/tiff`.
- **Kích hoạt:** Thư ký chụp/scan chứng từ bằng điện thoại rồi nạp lên.
- **Tác động (probe4):** hệ thống sinh các giá trị hoàn toàn bịa — `cadmium_mg_kg = 0.028` (dưới ngưỡng luật định!), `sample_code = EF-2026-VN-9081`, `sampling_date = 2026-10-06` với độ tin cậy 0.96, cùng số container/seal/số kiện/trọng lượng/phyto bịa cho ảnh khác. Người dùng có thể `HUMAN_VERIFY` các số đó mà không có gì để đối chiếu → hồ sơ "đạt" trên dữ liệu không tồn tại.
- **Sửa:** `supports(_docType, mimeType)` chỉ nhận định dạng có nội dung chữ (`src/extraction/fixture-extractor.ts:43-47`, kèm chú thích lý do); thêm `src/extraction/extractor-fallback.ts` (20 dòng) để registry chọn fallback có điều kiện thay vì mặc định bịa. Ảnh → `0` trường → chặn bởi `RUL-DOC-UNREADABLE`.
- **Bằng chứng sau sửa:** diễn tập S10 — 3 ảnh scan → `0` trường + 3×`RUL-DOC-UNREADABLE` → `VALIDATION_BLOCKED`; kiểm thử "extracts nothing from an image this build cannot read".
- **Phần dư — ĐÃ ĐÓNG (2026-10-30) mà không cần OCR:** toàn bộ đường fixture nay chỉ hoạt động khi chế độ tổng hợp được bật tường minh (`DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true`, `src/extraction/synthetic-extraction-mode.ts`). Luồng thường:
  - `text/plain` → chỉ còn giá trị **suy ra từ byte thật** của tệp (regex theo đúng loại chứng từ trong `src/extraction/local-text-extractor.ts`), không còn giá trị mẫu;
  - `application/pdf` (stub không đọc được), `application/json`, ảnh (`png`/`jpeg`/`tiff`) → `0` trường, hồ sơ bị chặn bởi `RUL-DOC-UNREADABLE`;
  - yêu cầu nạp `fixtureFields` qua API → `400 SYNTHETIC_EXTRACTION_DISABLED`, **0** chứng từ được ghi, sự kiện kiểm toán `DOC_UPLOAD_REJECTED` ghi rõ lý do;
  - không giá trị mẫu nào của template (`TEMPLATE_CANARY_VALUES`) xuất hiện trong luồng thường.
  Chế độ tổng hợp vẫn hoạt động khi được bật (diễn tập, kiểm thử): `bunfig.toml` nạp `test/preload-synthetic-extraction.ts` cho cả bộ test, và `pilot:seed-rehearsal` tự bật cho tiến trình của nó.
- **Hai chi tiết đo được khi làm demo hai luồng (`evidence/extraction-mode-demo.ts`, 19 kiểm tra / 0 thất bại):** (1) qua đường **upload API**, tệp `.txt` bị từ chối ngay từ bước kiểm tra tệp (`Supported formats: PDF, PNG, JPEG, TIFF`) kèm sự kiện `DOC_UPLOAD_REJECTED` — tức `text/plain` chỉ tới được bộ trích xuất khi gọi thẳng registry (đường kiểm thử/diễn tập), không qua cửa nạp chứng từ; (2) `application/json` **có** chứa dữ liệu dạng trường (ví dụ `{"container_number":"MSKU1234565"}`) thì giá trị trả về **đúng bằng chuỗi có trong payload** — đó là nội dung tệp, không phải giá trị mẫu; JSON không chứa dữ liệu chứng từ cho `0` trường. Không giá trị canary nào của template xuất hiện ở luồng thường.

### F-06 (P1) — Mã băm manifest bỏ hở nhiều trường
- **Đường thực thi (trước khi sửa):** `src/export/manifest-compiler.ts` chỉ băm tập con (định danh + danh sách chứng từ + tóm tắt dữ liệu đã kiểm chứng) thành `compositeManifestSha256`; `src/export/standalone-manifest-verifier.ts` chỉ kiểm tra đúng tập con đó.
- **Kích hoạt:** mở tệp manifest JSON đã xuất và sửa tay các trường ngoài tập con, rồi chạy bộ kiểm chứng độc lập.
- **Tác động (probe2):** sửa `complianceFindingsCount` → `{0,0}`, đổi `exportedBy`, đổi `exportedAt`, và thay `regulatoryDisclaimers` bằng *"official GACC customs clearance approval"* — bộ kiểm chứng vẫn trả **`valid = true`**. Tức là bằng chứng xuất khẩu có thể bị "rửa" thành tuyên bố thông quan chính thức mà công cụ kiểm chứng độc lập không phát hiện.
- **Sửa:** thêm `src/export/manifest-integrity.ts` (`MANIFEST_INTEGRITY_FIELD = "manifestIntegritySha256"`, băm chính tắc toàn bản ghi, loại trừ chính trường đó); compiler phát hành trường mới; verifier bắt buộc khớp khi có và trả `integrityCoverage: "FULL"`; manifest cũ vẫn kiểm chứng được nhưng bị gắn nhãn `"PARTIAL_LEGACY"` kèm cảnh báo ra stderr (`src/export/standalone-manifest-verifier.ts:11,75,85-86`).
- **Tương thích dữ liệu:** trường **tùy chọn** → không đổi schema, không cần migration, không phải xóa DB. Caller bị ảnh hưởng: `test/helpers/api-v1-equivalence-5a5-normalizer.ts` (thêm khóa vào `CHAIN_HASH_KEYS` để chuẩn hóa 5A-5/V1).
- **Bằng chứng sau sửa:** diễn tập S4 — 7/7 ca giả mạo bị phát hiện với thông điệp phân biệt được (`Composite SHA-256 mismatch`, `Manifest integrity SHA-256 mismatch`, `not in a sealed, immutable EXPORTED state`, lỗi chữ số kiểm tra ISO 6346); manifest legacy → `valid` + `PARTIAL_LEGACY`; 5 kiểm thử trong `test/manifest-integrity-tamper.test.ts` (gồm ca "manifest bị zero số blocker sau override").

### F-07 (P1) — Diễn tập tạo ra `PASS` giả
- **Đường thực thi:** `src/server/ecosystem-rehearsal-drill.ts:15-45` tạo thư mục tạm, **tự ghi tệp đồng ý PDPL tổng hợp** (`rehearsal-pdpl-consent-cailay.pdf`, nội dung tự nhận "Signed by Packhouse Owner"), **tự đặt biến môi trường OTP giả** (`DURIOS_OTP_PROVIDER/URL/API_KEY`), rồi gọi bộ kiểm cổng. `GATE-01` được chấm chỉ bằng `existsExists(consentPath)` (nay: `src/auth/pilot-gate-report-builder.ts:17`).
- **Kích hoạt:** chạy kịch bản diễn tập "5 cổng đầy đủ".
- **Tác động:** báo cáo 5/5 cổng đạt, đọc lên **không phân biệt được** với bằng chứng vận hành thật → có thể bị dùng làm căn cứ khai trương với dữ liệu thật, đúng điều mà `DECISION-01` cấm.
- **Sửa:** `src/auth/pilot-gate-report-builder.ts:18-23,55` — khi `rehearsalMode === true`, nhãn đạt là `PASS_SYNTHETIC_REHEARSAL` (không phải `PASS`), `evidenceProvenance: "SYNTHETIC_REHEARSAL"`, mỗi cổng kèm ghi chú diễn tập, và `goForLiveCustomerData = passedCount === 5 && !rehearsalMode` → **diễn tập không bao giờ cấp phép go-live**. `src/export/pilot-dossier-pack-compiler.ts:57-74` lan truyền nhãn này vào gói kiểm toán và thêm tuyên bố miễn trừ bắt buộc; `src/export/pilot-report-seal.ts` niêm phong báo cáo. Kiểu `rehearsalMode: true` (bắt buộc theo kiểu) trong `FullGatesRehearsalOptions` khiến người gọi không thể quên khai báo.
- **Bằng chứng sau sửa:** diễn tập S9 — bootstrap opt-in: 5/5 `PASS_SYNTHETIC_REHEARSAL`, `goForLiveCustomerData: false`, `evidenceProvenance: "SYNTHETIC_REHEARSAL"`; kiểm thử "runs in a declared rehearsal sandbox and never claims go-live authority" và "labels an operational gate run OPERATIONAL and keeps its go-live decision honest".

### F-08 (P2) — Số kinh tế bịa trong KPI
- **Đường thực thi (trước khi sửa):** `src/auth/pilot-kpi-evaluator.ts` nhân số container/lỗi chặn với hằng số 35 phút và 35.000.000 VND, trả về như chỉ số giá trị đã đo.
- **Kích hoạt:** gọi `GET /api/pilot/kpi` hoặc `bun run pilot:evaluate-kpi`.
- **Tác động:** báo cáo chứa "thời gian tiết kiệm"/"thiệt hại tránh được" không có nguồn đo — vi phạm ràng buộc "không suy ra doanh thu/ROI/thiệt hại tránh được từ dữ liệu tổng hợp".
- **Sửa:** tách `src/auth/pilot-kpi-value-assumptions.ts` (32 dòng) mang nhãn `UNVALIDATED_ASSUMPTION` + ghi chú tiếng Việt nói rõ đây **không** phải số liệu đã kiểm chứng; thêm `timingEvidenceSource` (`SYSTEM_TIMESTAMPS` | `HUMAN_STOPWATCH_ATTESTED`) và `valueMetricsProvenance` (`UNVALIDATED_ASSUMPTION` | `FIELD_MEASURED`) vào `src/auth/pilot-kpi-extended-types.ts`.
- **Bằng chứng sau sửa:** `evidence/CLI-KPI-GATES-PROOFKIT-LOG.txt` — đầu ra thực tế mang `timingEvidenceSource: "SYSTEM_TIMESTAMPS"`, `valueMetricsProvenance: "UNVALIDATED_ASSUMPTION"`, và mỗi giả định kèm `noteVi` cảnh báo.

### F-09 (P1) — UI trình bày kết quả tổng hợp như kết quả thật
- **Đường thực thi:** `src/server/public/index.html` — khối KPI/cổng (`renderPilotKpiSection`, vùng ~2100-2130) và hộp thoại bootstrap (~3095-3120) in số liệu không kèm nguồn bằng chứng; một số nhãn tự mô tả kho dữ liệu là chống ghi (`WORM`), trái với chính README mục 5 (băm SHA-256 là **phát hiện sửa đổi**, không phải phần cứng chống ghi).
- **Kích hoạt:** mở `http://127.0.0.1:3000/` sau khi chạy diễn tập/seed.
- **Tác động:** người vận hành đọc màn hình và tin rằng KPI/cổng là kết quả kiểm định thật → quyết định sai ở đúng khâu khai trương.
- **Sửa (chỉ UI phục vụ luồng Stage 0):** gắn nhãn nguồn bằng chứng ngay cạnh số liệu (`index.html:1499, 2121-2127`), dòng cảnh báo "Bằng chứng cổng: DIỄN TẬP TỔNG HỢP — do lệnh diễn tập tự tạo, không có giá trị phê duyệt khai trương" (`:1482, 2127, 3116`), bỏ nhãn `WORM` tự nhận, sửa trạng thái rỗng nói rõ bước kế tiếp, loại bỏ các nhãn khả năng bịa trong hộp thoại introspection. Giữ nguyên cơ chế sẵn có: toast + `aria-live`, `busyLabel`/`disabled` chống gửi trùng, khôi phục nội dung chưa lưu khi lỗi, `escapeHtml`, skip link, tôn trọng reduced-motion.
- **Bằng chứng:** `evidence/ui-render-probe.mjs` chạy trên happy-dom — **6/6 PASS**, không có lỗi runtime (`error` event = 0). **Đây không phải ảnh chụp màn hình** — xem giới hạn ở mục 5.

### F-10 (P2) — UI cho chọn vai trò khi gọi API
- **Đường thực thi:** `src/server/public/index.html:1158` — `fetchApi` chèn `"x-actor-role": role` lấy từ lựa chọn trên màn hình.
- **Kích hoạt:** người dùng đổi vai trò trong UI.
- **Tác động:** gợi ý rằng client quyết định quyền; nếu sau này có mã server nào tin header này thì thành tự nâng quyền. (Hiện tại server **không** tin header — định danh chỉ từ token/cookie — nên tác động là gây nhầm lẫn, không phải lỗ hổng đang khai thác được.)
- **Sửa:** `currentRole()` nay lấy vai trò **do server trả về** (`/api/auth/me`) để điền header; header vẫn được gửi vì `test/static-ui-contract.test.ts:44` khóa chuỗi `"x-actor-role": role` như hợp đồng tĩnh — không sửa kiểm thử để hợp thức hóa thay đổi. UI hiển thị vai trò server quyết định, không cho tự chọn.
- **Bằng chứng:** probe UI ca 5-6; diễn tập S6 (header giả mạo không phiên → `401`).

### F-11 (P2) — `pilot:audit-pack -- --verify` đổ stack ENOENT
- **Đường thực thi:** `src/export/field-auditor-cli.ts:29` — `--verify` được phân tích như **cờ nhận đường dẫn**, nên lệnh `... -- --verify` (không kèm tệp) nuốt luôn token kế tiếp (`--output-dir`) làm đường dẫn.
- **Kích hoạt:** chạy đúng cú pháp mà tài liệu hướng dẫn: `docs/pilot-readiness/06_OPERATOR_AND_DEVELOPER_ONBOARDING.md:32` và `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md:31` đều ghi `bun run pilot:audit-pack -- --verify`.
- **Tác động (đo được):** `error: ENOENT: no such file or directory, open '--output-dir'` + stack thô; người vận hành mới không biết mình thiếu đối số, dễ hiểu nhầm công cụ hỏng.
- **Sửa:** thêm kiểm tra `existsSync` với thông báo hướng dẫn sử dụng, và `runCliOrExit()` bọc `runFieldAuditorCli` — lỗi dùng sai in ra stderr và thoát mã `2` thay vì stack thô. Đồng thời sửa hai tài liệu trên thành `-- --verify <pack.json>` và tách rõ hai chế độ (4a biên soạn / 4b kiểm chứng). **Không sửa** `docs/journals/*` (bản ghi lịch sử).
- **Bằng chứng:** `evidence/CLI-AUDIT-PACK-LOG.txt` — lệnh đúng chạy ra gói `GOLIVE-SITE-CAILAY-TIENGIANG-01-2026-10-29.json`, `Integrity=true`; lệnh sai in `[DuriOS Field Auditor] --verify expects the path of an exported go-live pack JSON file, but '--output-dir' does not exist. Usage: ...` và `EXIT=2`.

### F-12 (P2) — `pilot:verify-gates` không in gì
- **Đường thực thi:** `src/auth/pilot-launch-gate-verifier.ts` là module thuần, **không có** khối `import.meta.main`, trong khi `package.json` trỏ `pilot:verify-gates` vào chính tệp đó.
- **Kích hoạt:** chạy `bun run pilot:verify-gates`.
- **Tác động:** lệnh thoát `0`, **không in gì** — người vận hành không nhận được trạng thái cổng nào, và mã thoát `0` dễ bị hiểu nhầm là "đã đạt".
- **Sửa:** thêm khối `import.meta.main` (tệp 35 → 47 dòng) in báo cáo JSON đầy đủ và `process.exit(goForLiveCustomerData ? 0 : 1)`; tách phần dựng báo cáo sang `src/auth/pilot-gate-report-builder.ts` + `src/auth/pilot-gate-types.ts` để giữ giới hạn 99 dòng.
- **Bằng chứng:** `evidence/CLI-KPI-GATES-PROOFKIT-LOG.txt` — `EXIT=1 (1 = not go-for-live)`, `passedCount: 2`, `goForLiveCustomerData: false`, kèm nhãn từng cổng.

---

### F-13 (P1) — Seeder diễn tập mặc định ghi vào cơ sở dữ liệu vận hành
- **Đường thực thi (trước khi sửa):** `src/auth/pilot-rehearsal-seeder.ts` gọi `createWorkspaceApp({})` khi không có tham số → `dbPath` mặc định `./data/durios.db` (DB vận hành) và tự tạo 2 tài khoản `clerk.cailay` / `manager.cailay` với mật khẩu **công khai trong kho** (`PilotClerk#2026`, `PilotManager#2026`) cùng 5 hồ sơ tổng hợp.
- **Kích hoạt:** chạy `bun run pilot:seed-rehearsal` trên máy đã có dữ liệu thật, không khai báo biến môi trường nào.
- **Tác động:** thêm một đường đăng nhập bằng mật khẩu công khai vào DB vận hành, trộn dữ liệu tổng hợp vào cohort KPI/cổng, và ghi blob vào thư mục uploads thật — tức là tự tạo lỗ hổng truy cập mà không ai yêu cầu.
- **Sửa:** `src/auth/rehearsal-seed-target-guard.ts` — (1) `resolveRehearsalSeedTarget` **từ chối** khi không khai báo đích (`RehearsalSeedTargetError`, `code = REHEARSAL_SEED_TARGET_REFUSED`, HTTP 400) và nêu đích danh các tài khoản mật khẩu công khai; (2) `assertTargetIsRehearsalData` từ chối DB không phải schema DuriOS, và từ chối DB đã chứa hồ sơ **không** bắt đầu bằng `DOS-CAILAY-R` hoặc tài khoản ngoài `clerk.cailay`/`manager.cailay`; (3) seeder in cảnh báo ra stderr trước khi seed và tự bật chế độ tổng hợp. Hướng dẫn cập nhật ở `RUNBOOK-STAGE0-REHEARSAL.md` mục 2.
- **Bằng chứng sau sửa:** `test/rehearsal-seed-target-guard.test.ts` — gọi trần `seedGate05PilotRehearsal()` ném lỗi với thông điệp chứa "published", "clerk.cailay", "DURIOS_DB_PATH"; DB chứa `DOS-CUSTOMER-REAL-001` bị từ chối ("may hold operational or customer data"); DB diễn tập của chính nó được chấp nhận (5 hồ sơ `DOS-CAILAY-R*`).

### F-14 (P1) — Dữ liệu tổng hợp có thể mở cổng khai trương
- **Đường thực thi (trước khi sửa):** `verifySingleSiteLaunchGates` (`src/auth/pilot-launch-gate-verifier.ts`) chỉ phân biệt "diễn tập" qua tham số `rehearsalMode` do người gọi truyền. Chạy CLI trên DB do `pilot:seed-rehearsal` tạo ra mà không truyền tham số nào → `evidenceProvenance: "OPERATIONAL"`.
- **Kích hoạt (đã tái hiện, log cũ):** DB diễn tập + đủ biến môi trường cho 5 tiêu chí máy + khai báo 5 tệp "bằng chứng" → `machineChecksPassedCount: 5`, `operationalGatesEvidencedCount: 5`, `goForLiveCustomerData: true`, `EXIT=0`, gói kiểm toán in `GO_FOR_LIVE_CUSTOMER_DATA`.
- **Tác động:** một quyết định khai trương ("được nạp dữ liệu khách hàng thật") sinh ra hoàn toàn từ container tổng hợp và các tệp bằng chứng do chính người chạy tạo ra — đúng dạng lỗi F-07/F-09 nhưng ở tầng CLI, và là vi phạm trực tiếp điều kiện "không dùng kết quả synthetic để mở cổng".
- **Sửa:** `src/auth/gate-cohort-provenance.ts` nhận diện cohort theo mã hồ sơ (`DOS-CAILAY-R*` = do seeder diễn tập tạo). Cả hai đường vào (`evaluateWorkspaceLaunchGates` và `verifySingleSiteLaunchGates`) tự chuyển sang chế độ diễn tập khi cohort **có chứa** hồ sơ seed — kể cả cohort trộn. Ở chế độ đó `resolveGateVerdict` không bao giờ trả `EVIDENCED_FOR_LAUNCH`, nhãn giữ `PASS_SYNTHETIC_REHEARSAL`, `operationalGatesEvidencedCount = 0`, `goForLiveCustomerData = false`, và gói kiểm toán chỉ có thể ra `READY_FOR_PILOT_GO_LIVE` (mô tả cuộc diễn tập) chứ không phải `GO_FOR_LIVE_CUSTOMER_DATA`.
- **Bằng chứng sau sửa:** `test/gate-cohort-provenance.test.ts` (4 kiểm tra, gồm ca cohort trộn 10 container vẫn `SYNTHETIC_REHEARSAL`); ma trận A1–A3 trong `evidence/rerun-20261030/GATE-CLI-MATRIX-LOG.txt` (khai báo đủ 5 tệp bằng chứng trên DB diễn tập → `0/5`, `EXIT=1`).

#### F-14b (bổ sung 2026-10-30) — Bản sửa đầu tiên chỉ dựa vào tiền tố mã hồ sơ; đã thay bằng tín hiệu trong sổ kiểm toán
- **Giới hạn được xác nhận (đúng như câu hỏi của Founder):** bản sửa F-14 đầu tiên nhận diện cohort tổng hợp **duy nhất** bằng tiền tố `DOS-CAILAY-R*`. Một câu SQL `UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-…'` — không cần đi qua bất kỳ dòng code ứng dụng nào — xoá sạch tín hiệu đó, và trên DB diễn tập đã đổi tên thì 5 máy chấm vẫn đạt, 5 tệp bằng chứng vẫn được ghi nhận ⇒ cổng mở. Đây là lỗ hổng thật đối với bất kỳ ai có quyền shell trên máy on-prem, nên F-14 **không** được đóng ở bản sửa đó.
- **Cơ chế thay thế (không đổi schema, không đổi API hiện có, không cần migration):** nguồn gốc dữ liệu được ghi **tại nơi dữ liệu sinh ra**, vào sổ kiểm toán append-only có chuỗi băm:
  - `src/workspace/document-ingestion-orchestrator.ts` — mỗi lần nạp tài liệu **thành công** khi `isSyntheticExtractionEnabled()` thì ghi `SYNTHETIC_DOCUMENT_INGESTED` (payload `fileName`, `fieldsExtracted`, `fixtureOverrideRequested`) gắn với `dossierId`;
  - `src/server/ecosystem-rehearsal-seeder.ts` — seeder diễn tập ghi `REHEARSAL_DOSSIER_SEEDED` cho từng hồ sơ nó tạo;
  - `src/auth/gate-cohort-provenance.ts` — `resolveCohortProvenance(containerMetrics, auditEvents)` trả `{synthetic, signals[], cohortSize}`, lọc sự kiện theo `dossierId` của cohort đang đo; tiền tố mã hồ sơ chỉ còn là **tín hiệu phụ** (`REHEARSAL_DOSSIER_CODE:…`) để nhận diện DB cũ.
  - `src/auth/pilot-gate-report-builder.ts` nhận `auditEvents` từ `auditLedger.getAllEvents()` và `auditChainValid` từ `verifyIntegrity()`; `synthetic ⇒ rehearsalMode ⇒ resolveGateVerdict` không bao giờ trả `EVIDENCED_FOR_LAUNCH`. Sự kiện gắn theo `dossierId` nên đổi `dossier_code` không làm mất tín hiệu; còn xoá sự kiện thì vỡ chuỗi băm ⇒ GATE-03 fail ⇒ `evidenceProvenance: UNPROVEN_LEDGER_INTEGRITY` và **không cổng nào** được ghi nhận bằng chứng.
- **Bằng chứng đối kháng (mới, chạy trên DB thật bằng SQL thô):** `evidence/gate-provenance-adversarial.ts` → `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`; kiểm thử hồi quy `test/gate-provenance-adversarial.test.ts` (3 kiểm tra) và `test/gate-evidence-artifact.test.ts` (5 kiểm tra).

| Ca | Tấn công | Máy chấm | Cổng đủ bằng chứng | `evidenceProvenance` | `goForLiveCustomerData` |
|---|---|---|---|---|---|
| A0 | (cơ sở) DB diễn tập + 5 tệp bằng chứng do script tự tạo | 5/5 | 0/5 | SYNTHETIC_REHEARSAL | false |
| A1 | đổi toàn bộ `dossier_code` sang `DOS-TG-CUSTOMER-…` bằng SQL thô | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| B0 | (cơ sở) cohort vận hành fixture, không có ingest tổng hợp | 5/5 | 5/5 | OPERATIONAL | true — **chỉ là fixture** |
| B1 | trộn 1 container tổng hợp mã `DOS-TG-CUSTOMER-77` vào cohort B0 (6 container) | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| C1 | `DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')` | 4/5 (GATE-03 fail) | **0/5** | UNPROVEN_LEDGER_INTEGRITY | false |
| D1 | khai báo 5 "tệp bằng chứng" không tồn tại (một đường dẫn là thư mục) trên site vận hành xanh | 5/5 | **0/5** | OPERATIONAL | false |

- **Bằng chứng khai báo cũng bị siết:** đường dẫn khai báo phải là **tệp tồn tại** (`inspectEvidenceArtifact`), kích thước + SHA-256 của nó được ghi vào `externalEvidence.artifact` (tệp > 25 MB → `NOT_HASHED_FILE_TOO_LARGE`), và phải có `attestedBy`. Đường dẫn bịa, thư mục, hoặc tệp vô danh ⇒ `PENDING_OPERATOR_EVIDENCE`.
- **Giới hạn còn lại (nói rõ, không giấu):**
  1. Cơ chế phát hiện dữ liệu đi qua **đường tổng hợp/fixture hoặc seeder diễn tập**. Hồ sơ do con người **gõ tay từ một chứng từ bịa** không phân biệt được với dữ liệu nhập thật bằng bất kỳ kiểm tra máy nào ở đây ⇒ phải rà soát bằng chứng vận hành và cần chữ ký Founder trên gói niêm phong.
  2. **Nội dung** tệp bằng chứng không bao giờ được máy thẩm định: một trang trắng cũng có SHA-256 hợp lệ. SHA-256 chỉ giúp người soát sau này chứng minh tệp không bị tráo.
  3. `SYNTHETIC_DOCUMENT_INGESTED` chỉ được ghi khi chế độ tổng hợp đang bật. Tiến trình chạy không bật chế độ đó thì không có đường nạp `fixtureFields` (bị `SyntheticExtractionDisabledError` chặn và ghi `DOC_UPLOAD_REJECTED`), nên không có gì để đánh dấu — nhưng điều đó cũng có nghĩa cơ chế này là **một lớp** phòng vệ, không phải bằng chứng tuyệt đối về nguồn gốc dữ liệu.
- **Trạng thái:** **ĐÃ SỬA (cơ chế mới)** — còn mở ở mức quy trình: mục 1 và 2 ở trên chỉ đóng được bằng con người (rà soát biên bản, Founder ký), không đóng được bằng code.

### F-15 (P2) — Một con số cho hai khái niệm ("2/5")
- **Đường thực thi (trước khi sửa):** `SingleSiteLaunchGateReport.passedCount` đếm số cổng có **tiêu chí máy chấm được** đạt; CLI in `Gates=2/5`, UI in `2/5 CỔNG ĐẠT`, tài liệu và báo cáo dẫn lại "2/5 cổng". Không có trường nào cho biết cổng đã có bằng chứng vận hành hay chưa.
- **Kích hoạt:** đọc báo cáo cổng trên máy staging — "2/5 cổng đạt" nghe như 2 cổng khai trương đã mở.
- **Tác động:** nhầm lẫn giữa "máy chấm được 2 tiêu chí" và "2 cổng đã đủ bằng chứng để nạp dữ liệu thật"; GATE-03 được ghi là `PASS` trong khi chỉ phủ 2/5 tiêu chí tài liệu.
- **Sửa:** tách bạch trong kiểu dữ liệu và trong mọi bề mặt trình bày — mỗi cổng có `machineCheck: {passed, criteria}`, `externalEvidence: {required, recorded, status, attestedBy?, note}` và `gateVerdict`; báo cáo có **cả hai** bộ đếm `machineChecksPassedCount` và `operationalGatesEvidencedCount` (giữ `passedCount`/`passedGateCount` như bí danh của bộ đếm máy để không phá lời gọi cũ); `pilot:verify-gates` in bản tóm tắt tiếng Việt hai dòng (stderr) + JSON (stdout) và thoát `0` chỉ khi đủ bằng chứng; `pilot:audit-pack` in `MachineChecks=x/5 LaunchGatesEvidenced=y/5`; UI hiển thị hai con số ở thẻ trạng thái, huy hiệu KPI, từng dòng cổng và một đoạn giải thích "hai con số khác nhau, đừng đọc như một".
- **Bằng chứng sau sửa:** `test/pilot-gate-evidence-split.test.ts` (4 kiểm tra), `test/pilot-launch-gate-verifier.test.ts`, probe UI 7/7 (ca D và G), log `evidence/rerun-20261030/GATE-CLI-MATRIX-LOG.txt` + `HTTP-WALKTHROUGH-LOG.txt`.

## 3. Đã kiểm tra và xác nhận ĐÚNG (không sửa, tránh "sửa" thứ không hỏng)

- Định danh chỉ lấy từ `Authorization: Bearer`, `x-pilot-token`, cookie `durios_session`; `x-actor-role` do client gửi **bị bỏ qua**.
- Nạp chứng từ thay thế (supersede) và chỉnh trường đều xóa `latestValidationResult` → `HUMAN_VERIFICATION_REQUIRED`; luật chặn trừ khi mọi trường của chứng từ đang hoạt động là `HUMAN_VERIFIED`.
- Xuất hồ sơ từ chối khi `verifyIntegrity()` false; hồ sơ đã niêm phong là bất biến (diễn tập S5: `409`).
- Override blocker chỉ dành cho `PACKHOUSE_EXPORTER`/`PACKHOUSE_MANAGER`, **giữ nguyên** blocker trong manifest (diễn tập S10: manifest sau override vẫn `criticalBlockers: 1`, và việc zero số đó bị bộ kiểm chứng phát hiện).
- `findById`/`listDossierRowsForActor` lọc theo tenant; sai tenant → `404` (không lộ tồn tại).
- Blob: temp → sha256 → rename, đường dẫn qua `resolveSafePath`; tải/xuất không thoát khỏi phạm vi được cấp.
- Chuỗi kiểm toán hash-chain từ `GENESIS`; OTP fail-closed; giới hạn tốc độ đăng nhập; 30 req/phút theo tenant.
- Bằng chứng hữu cơ chỉ là `EVIDENCE_STORED_NOT_CERTIFIED` — không phải chứng nhận do DuriOS cấp.
- Đồng thời hóa lạc quan: một câu `UPDATE` so sánh `version` → `StaleDossierVersionError`.
- `verifySiteBackup` / `restoreSiteBackup` **idempotent và ổn định băm** (kiểm chứng 2 lần cho kết quả giống hệt) — nghi ngờ ban đầu về WAL làm sai băm là **sai**, không sửa.
- Gói go-live chỉ biên soạn cho `ADMIN`/`AUDITOR`/`MANAGER`.

---

## 4. Nghi ngờ chưa tái hiện được thành lỗi (không được tính là phát hiện)

| # | Vị trí | Mô tả | Vì sao chưa coi là lỗi | Cần gì để kết luận |
|---|---|---|---|---|
| N-01 | `src/storage/sqlite-export-manifest.ts:8` | Lưu `tenant_id = actor.tenantId` của người **đọc/xuất** thay vì chủ sở hữu hồ sơ | Chưa tìm được đường thực thi khiến dữ liệu bị gán sai tenant gây rò rỉ (mọi đường đọc đều lọc theo hồ sơ trước) | Cần ca tái hiện: actor tenant B lưu được manifest của hồ sơ tenant A |
| N-02 | `src/server/dossier-handlers.ts` | Khác biệt `404`/`403` có thể tạo oracle tồn tại hồ sơ giữa các tenant | Chưa chứng minh được tác động; `404` nhất quán là lựa chọn có chủ đích | Quyết định chính sách: luôn `404` cho tài nguyên ngoài tenant |
| N-03 | luồng multipart upload | `version` không được đọc → đồng thời hóa lạc quan là **tùy chọn** | Chưa tái hiện được mất ghi trong điều kiện Stage 0 (một người dùng, một phiên) | Ca kiểm thử 2 phiên ghi song song cùng một hồ sơ |
| N-04 | `src/workspace/document-persistence-flow.ts:30-34` | Lỗi lưu blob bị nuốt → luồng ghi tiếp tục "thành công" một phần | Chưa tái hiện được bằng lỗi đĩa thật trong sandbox | Cần mô phỏng lỗi `ENOSPC`/quyền ghi và kiểm tra phản hồi |
| N-05 | `src/server/document-handlers.ts:40` | Sinh stub `%PDF-1.5\n` 9 byte khi cần PDF | Là hành vi fixture có chủ đích; chưa chứng minh tác động ngoài diễn tập | Xác nhận không dùng ở đường sản xuất |
| N-06 | dedupe theo băm nội dung | Trùng băm → trả bản ghi cũ, "nạp trùng" im lặng | Đúng với thiết kế content-addressed; chỉ gây nhầm cho kịch bản kiểm thử | Ghi chú vận hành (đã ghi trong runbook) |
| N-07 | `/api/open-core/verify-iso-and-manifest`, `/financial-verification` | Endpoint không yêu cầu xác thực | Chỉ nhận dữ liệu do người gọi tự đưa, không đọc kho tenant → chưa thấy rò rỉ | Rà soát lại khi mở ra ngoài loopback |
| N-08 | `src/auth/pilot-kpi-evaluator.ts` | "Blind fault" được đếm từ nhãn seed → có thể thổi phồng `blindFaultsCaught` | Là đặc tính của bộ seed diễn tập; KPI đã gắn nhãn nguồn | Đo bằng lỗi gài thật trong pilot |
| N-09 | `src/auth/pilot-rehearsal-seeder.ts` | Mật khẩu cố định công khai (`clerk.cailay`, `manager.cailay`) + mặc định ghi vào `./data/durios.db` | Hành vi Stage 0 **đã được tài liệu hóa**; chưa có dữ liệu thật để bị hại | Bắt buộc đổi trước pilot thật (đã ghi ở hành động tiếp theo) |
| N-10 | FSM vòng đời | Cạnh `EXPORTED → CLOSED` không reachable | Không gây sai lệch dữ liệu | Dọn khi chạm tới FSM |
| N-11 | `restoreSiteBackup` | Không dọn blob mồ côi sau khôi phục | Chưa chứng minh được tác động toàn vẹn (verify vẫn khớp) | Thêm bước đối soát blob sau restore |
| N-12 | `serveIndexHtml` | HTML được cache suốt vòng đời tiến trình | Chỉ ảnh hưởng việc phát triển (cần khởi động lại sau khi sửa UI) | Ghi chú vận hành |

---

## 5. Giới hạn của chính báo cáo này

1. **Không có ảnh chụp màn hình** nào: sandbox không có trình duyệt đồ họa, và `startLocalServer` gọi `assertLoopbackHostname` (ném lỗi với host không loopback) nên không mở live preview được. Guard này **cố ý không bị nới lỏng**. Mọi khẳng định về UI đến từ probe DOM headless + đọc mã nguồn, và **không** được coi là "đã kiểm thử UI bằng mắt".
2. Commit `08992f6` mà đề bài nhắc tới **không truy cập được** (clone nông) → **không thể chứng minh** quan hệ giữa cây làm việc này và commit đó; chỉ xác minh hành vi hiện tại bằng thực thi. Vì vậy đợt bàn giao 2026-10-30 kèm **gói đóng gói đầy đủ** (`package/`): commit cơ sở, danh sách tệp, checksum SHA-256, patch đã kiểm `git apply --check` trên bản clone sạch, và **bản snapshot toàn bộ tệp bị ảnh hưởng** để đối chiếu trực tiếp — xem `package/MANIFEST.txt`.
3. Không có chứng từ thật nào được nạp; mọi bằng chứng là tổng hợp. Vì vậy không có kết luận nào về độ chính xác trích xuất trên tài liệu thật.
4. Thời gian đo được trong KPI là **thời gian máy**, không phải thời gian thao tác của con người (đã gắn nhãn `SYSTEM_TIMESTAMPS`).
