# Báo Cáo Đối Chiếu Hai Kho Mã Nguồn DuriOS (Repo Crosswalk)
**Mã tài liệu:** `docs/product-direction/REPO-CROSSWALK.md`  
**Ngày thực hiện:** 2026-10-13  
**Cơ chế thực thi:** Prompt 1 — Khảo sát đối chiếu Read-Only theo `CLAUDE-CODE-PROMPT-CAMPAIGN.md`  
**Hai kho mã nguồn khảo sát:**
1. **Core Repository:** `/Users/macbook/durios` (Nguồn sự thật cho nghiệp vụ, API, dữ liệu, bảo mật)
2. **Demo Presentation Repository:** `/Users/macbook/durios-frontend-demo` (Kho mô phỏng thuyết trình, giao diện nhà đầu tư)

---

## 1. Ghi Nhận Trạng Thái Git & Các Thay Đổi Chưa Commit (Dirty Tree Audit)

Trước khi thực hiện khảo sát, toàn bộ trạng thái Git và diff chưa commit tại cả hai repository đã được ghi nhận nguyên trạng. Không có thao tác `git reset`, `git clean`, `git stash`, `git checkout` hay ghi đè nào được thực hiện.

### 1.1. Core Repository (`/Users/macbook/durios`)
- **Git Branch:** `main` (commit cơ sở `f621b4733b809d3f871340383031e060ea8f7ae9`)
- **Các file theo dõi đã chỉnh sửa (Tracked Modified Files):**
  1. `src/domain/dossier-fsm.ts`: Bổ sung kiểm tra quyền vai trò khi chuyển trạng thái sang `EXPORTED` (chặn `CLERK`, chỉ cho phép `MANAGER` hoặc `ADMIN`) và hàm `assertCanValidate` (chặn re-validation trên dossier đã niêm phong `EXPORTED`/`CLOSED`/`CANCELLED` hoặc immutable, chặn khác `tenantId`).
  2. `src/rules/evaluator-helpers.ts`: Chuẩn hóa văn bản miễn trừ trách nhiệm phân định rõ cảnh báo nội bộ và giới hạn luật định.
  3. `src/rules/rule-catalog.ts`: Đặt cờ cách ly luật định `isStatutoryVerified: false` và vô hiệu hóa `RUL-GB2762-CD` (Cadmium GB 2762-2022) do chưa có công báo gốc; chuyển `RUL-INT-CD-WARN` (0.040 mg/kg) thành cảnh báo nội bộ vựa.
  4. `src/server/actor-resolver.ts`: Xử lý phân giải actor qua header `x-actor-role` hoặc URL query parameter `?role=`.
  5. `src/server/dossier-handlers.ts`: Bắt lỗi `CROSS_TENANT_FORBIDDEN` trả về mã lỗi 403 Forbidden thay vì 400 Bad Request; kiểm tra quyền export.
  6. `src/server/public/index.html`: Giao diện HTML kiểm thử vertical slice cục bộ với chức năng tải tài liệu mẫu.
  7. `src/server/server.ts`: Cấu hình cổng server linh hoạt qua biến môi trường.
  8. `src/workspace/container-dossier-workspace.ts`: Tích hợp rollback đĩa bù trừ khi ghi DB thất bại; vô hiệu hóa kết quả validation cũ khi chỉnh sửa trường; kiểm tra `assertCanValidate`.
  9. `test/http-api.test.ts`: Bổ sung kịch bản kiểm thử API phân quyền vai trò và chặn vi phạm tenant.
  10. `test/security-and-export.test.ts`: Bổ sung test suite kiểm tra ranh giới bảo mật export và validation dossier niêm phong.
- **Các file và thư mục chưa theo dõi (Untracked Files):**
  1. `docs/`: Chứa toàn bộ hồ sơ kiểm toán (`docs/audits/`), tài liệu thực địa (`docs/field-discovery/`), checklist tiếp cận và chỉ dẫn chiến dịch (`docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md`).
  2. `test/adversarial-verification.test.ts`: Bộ kiểm thử đối kháng (rollback đĩa, hủy kết quả kiểm tra khi sửa trường, tính toàn vẹn chuỗi hash).
  3. `test/process-restart-persistence.test.ts`: Bộ kiểm thử độ bền bỉ dữ liệu SQLite qua khởi động lại tiến trình (`Bun.spawn`, `SIGTERM`).
  4. `test/static-ui-contract.test.ts`: Kiểm thử hợp đồng giao diện tĩnh.
  5. `test/ui-sample-upload.test.ts`: Kiểm thử tải tài liệu mẫu từ UI.

### 1.2. Demo Presentation Repository (`/Users/macbook/durios-frontend-demo`)
- **Git Branch:** `HEAD` (detatched worktree)
- **Các file theo dõi đã chỉnh sửa (Tracked Modified Files):**
  1. `plans/plan.md`: Đánh dấu hoàn thành Phase 1-16.
  2. `src/server/public/js/components/dossier-table.js`: Tích hợp hiển thị bảng dossier modular.
  3. `src/server/public/js/components/home-view.js`: Phân rã view trang chủ.
  4. `src/server/public/js/components/home-visuals.js`: Facade đồ họa trực quan hóa.
  5. `src/server/public/js/components/system-boundaries.js`: Tách dữ liệu tĩnh sang submodule `< 200 LOC`.
  6. `src/server/public/js/i18n-strings.js`: Tách chuỗi song ngữ.
  7. `src/server/public/js/state-store.js`: Lưu trữ trạng thái mô phỏng.
  8. `src/server/public/js/state/claims-register.js`: Tách danh mục luận điểm sang `claims-dataset.js`.
  9. `src/server/public/js/state/synthetic-dataset.js`: Tách bộ hồ sơ sang `synthetic-dossier-002.js` và `003.js`.
- **Các file và thư mục chưa theo dõi (Untracked Files):**
  - Các tài liệu thiết kế và wireframe: `docs/design-guidelines-enterprise-scale.md`, `docs/tech-stack-enterprise-scale.md`, `docs/wireframe/wireframe-enterprise-federation.html`.
  - Kế hoạch Phase 16: `plans/phase-16-deep-modularization-and-national-federation.md`, các báo cáo nghiên cứu trong `plans/reports/`.
  - Các submodule giao diện và trạng thái (< 200 LOC): `dossier-completeness.js`, `home-deep-sections.js`, `home-hero-section.js`, `home-visuals-*.js`, `system-boundaries-data.js`, `audit-manager.js`, `claims-dataset.js`, `synthetic-dossier-002.js`, `synthetic-dossier-003.js`, `tour-steps.js`.

---

## 2. Khảo Sát Chi Tiết Từng Kho Mã Nguồn (Stack, Kiến Trúc, Dữ Liệu, API, Bảo Mật, Test)

### 2.1. Core Repository (`/Users/macbook/durios`)
- **Mục đích:** Backend lõi, máy trạng thái (FSM) hồ sơ container xuất khẩu, công cụ thẩm định quy tắc tuân thủ (deterministic compliance rules engine), kho lưu trữ kiểm toán bất biến (tamper-evident audit ledger).
- **Entrypoints:**
  - CLI: `src/cli.ts` (quản trị dòng lệnh cho dossier, tài liệu, xác minh).
  - HTTP Server: `src/server/server.ts` chạy trên runtime native Bun (`Bun.serve`).
- **Tech Stack:**
  - Runtime: Bun v1.3.14.
  - Ngôn ngữ: TypeScript (Strict mode, `tsc --noEmit` đạt 0 lỗi).
  - Database: SQLite native (`bun:sqlite`), WAL mode, khóa ngoại kích hoạt (`PRAGMA foreign_keys = ON`).
  - Phụ thuộc ngoài (NPM dependencies): **0 runtime dependencies**, thuần standard library và Bun APIs.
- **Mô hình dữ liệu (Domain Models):**
  - `ContainerDossier`: Mã hồ sơ, số container (ISO 6346), số seal, thị trường đích (GACC/CN), cửa khẩu, nhiệt độ reefer, trọng lượng net, số thùng, trạng thái vòng đời, cờ bất biến `isImmutable`.
  - `DossierLifecycleState`: `DRAFT` → `DOCUMENTS_PENDING` → `PROCESSING` → `HUMAN_VERIFICATION_REQUIRED` → `VALIDATION_BLOCKED` | `REVIEW_REQUIRED` | `READY_FOR_REVIEW` → `APPROVED_FOR_EXPORT` → `EXPORTED` → `CLOSED` | `CANCELLED`.
  - `IngestedDocument`: 5 loại chứng từ (`LAB_TEST_REPORT`, `PACKING_LIST`, `PHYTOSANITARY_CERTIFICATE`, `CUSTOMS_DECLARATION`, `BILL_OF_LADING`), mã băm SHA-256, cờ `isSuperseded`.
  - `ExtractedField`: Tọa độ bounding box, giá trị thô, giá trị chuẩn hóa, điểm tin cậy, trạng thái xác minh con người (`DRAFT`, `HUMAN_VERIFIED`, `REJECTED`).
  - `ComplianceRule`: 7 quy tắc trong catalog (`RUL-DOC-001`, `RUL-DOC-002`, `RUL-GB2762-CD`, `RUL-INT-CD-WARN`, `RUL-ISO6346-CHK`, `RUL-CROSS-CONT`, `RUL-CROSS-SEAL`).
  - `AuditEvent`: Chuỗi hash liên kết (`previousHash` → `eventHash`), lưu trước và sau của payload.
  - `DossierExportManifest`: Bản lược khai tổng hợp định dạng JSON kèm mã băm SHA-256 tổng thể khi niêm phong xuất khẩu.
- **Lưu trữ & Hệ thống tệp:**
  - SQLite: Bảng `dossiers`, `documents`, `extracted_fields`, `audit_events`, `schema_migrations`.
  - File Storage: Tách biệt trong thư mục làm việc, tính toán mã băm SHA-256 ngay khi tiếp nhận tài liệu, có cơ chế rollback bù trừ nếu ghi DB thất bại.
- **Cơ chế phân quyền & Bảo mật hiện tại:**
  - 3 vai trò: `CLERK`, `MANAGER`, `ADMIN`.
  - **Lỗ hổng bảo mật P0 (Đã ghi nhận trong Audit/Freeze):** Phân giải vai trò người dùng qua header `x-actor-role` hoặc URL query parameter `?role=`. Chưa có hệ thống xác thực mật mã (JWT/Session tokens).
  - Phân tách tenant: Dựa trên so khớp trường `tenantId` giữa actor và dossier. Đã có test chặn cross-tenant trong HTTP handler và FSM.
  - Phân quyền export: Chỉ `MANAGER` hoặc `ADMIN` mới được phê duyệt và xuất manifest; `CLERK` bị FSM chặn lỗi `INSUFFICIENT_ROLE`.
- **Tình trạng kiểm thử:**
  - Chạy `bun test`: **48/48 tests PASS**, 330 assertions, thời gian chạy ~590ms.
  - Bao phủ: FSM lifecycle, đối kháng tampering, rollback thất bại đĩa, cách ly tenant, xác minh con người, tính toàn bẹn chuỗi hash kiểm toán, hợp đồng API.

### 2.2. Demo Presentation Repository (`/Users/macbook/durios-frontend-demo`)
- **Mục đích:** Bản trình diễn giao diện tương tác (Interactive Pitch Deck, Executive One-Pager, Clerical Reconciliation Workspace) phục vụ gọi vốn và khảo sát thực địa.
- **Entrypoints:**
  - HTTP Server: `src/server/server.ts` & `src/demo/demo-server.ts`.
  - Giao diện web: `src/server/public/index.html` (Bàn làm việc đối chiếu chứng từ), `home.html`, `deck.html` (12 slide thuyết trình), `one-pager.html`.
- **Tech Stack:**
  - Runtime: Bun server phục vụ static assets tĩnh.
  - Frontend: Vanilla JavaScript ES Modules (zero-build, không bundler, tải native trên trình duyệt), kiến trúc tách file nghiêm ngặt `< 200 LOC`.
  - CSS: Vanilla CSS token hóa (`tokens.css`, `base.css`, `components.css`, `split-screen.css`, `dossier-view.css`).
  - I18n: Song ngữ Anh - Việt (EN/VI) chuyển đổi thời gian thực.
- **Mô hình dữ liệu & State Store:**
  - State Store: `src/server/public/js/state-store.js` và `src/demo/state-store.ts`. Lưu trữ in-memory trong phiên duyệt web của trình duyệt (Browser session state).
  - Dữ liệu tổng hợp (Synthetic Data): 3 bộ hồ sơ container giả định (`DEMO-DOS-001`, `002`, `003` với container `DEMO-TCLU-4182901`, `DEMO-OOLU-7729104`).
  - Claims Register: Danh mục 14 luận điểm kinh doanh và thị trường kèm trạng thái kiểm chứng (`assumption`, `reported`, `sourced`).
  - Demo Engines: Mô phỏng chỉ số kinh doanh SaaS (`arr-metrics-calculator.ts`), mô phỏng thỏa thuận dịch vụ (`sla-orchestrator.ts`), hợp đồng thí điểm (`paid-pilot-engine.ts`), đồng hồ đo thao tác nhân viên chứng từ (`stopwatch-audit.ts`), hàng đợi ngoại tuyến (`offline-audit-queue.ts`), liên hiệp vựa (`hub-federation-engine.ts`).
- **Cơ chế phân quyền & Bảo mật:**
  - **Hoàn toàn là mô phỏng phía client (Pure Client-side Simulation):** Chuyển đổi vai trò người dùng (Admin / Manager / Clerk) bằng nút bấm UI trên thanh điều hướng. Không có xác thực phía server, không có phiên làm việc an toàn.
  - Dữ liệu và sự kiện kiểm toán sinh ra chỉ tồn tại trong bộ nhớ JavaScript của tab trình duyệt, tự động biến mất khi tải lại trang nếu không bật lưu tạm.
- **Tình trạng kiểm thử:**
  - Chạy `bun test`: **113/113 tests PASS**, 1,794 assertions, thời gian chạy ~141ms.
  - Bao phủ: Kiểm thử token CSS, các hàm tính toán tài chính, danh mục luận điểm claims, phân tích so sánh tài liệu giả định, cấu trúc HTML và kiểm tra chuỗi dịch thuật i18n.

---

## 3. Bảng Đối Chiếu Năng Lực Giữa Hai Kho Mã Nguồn

Dưới đây là ma trận đối chiếu 7 nhóm năng lực theo 5 nhãn định danh bắt buộc:
- `[ĐÃ CÓ TRONG CODE]`: Tính năng đã được lập trình thực tế, có logic xử lý và kiểm thử tự động.
- `[CHỈ CÓ TRONG DEMO]`: Tính năng chỉ tồn tại dưới dạng giao diện mô phỏng hoặc kịch bản giả lập trên frontend, không có backend thực thi.
- `[CHỈ ĐƯỢC ĐỀ XUẤT TRONG TÀI LIỆU]`: Có trong các tài liệu thiết kế, nghiên cứu, kế hoạch nhưng chưa hề có code hay UI.
- `[MÂU THUẪN / LỖI THỜI]`: Các số liệu, giả định hoặc thiết kế cũ đã bị bác bỏ hoặc mâu thuẫn với định hướng hiện tại.
- `[CHƯA CÓ]`: Hoàn toàn chưa xuất hiện trong cả code, demo lẫn tài liệu.

| Nhóm Năng Lực | Hiện trạng tại Core (`durios`) | Hiện trạng tại Demo (`durios-frontend-demo`) | Phân loại đánh giá | Nhận xét chi tiết & Ranh giới kỹ thuật |
|---|---|---|---|---|
| **1. Hộ chiếu lô / Container Traceability** | FSM vòng đời hồ sơ, kiểm tra số container ISO 6346 modulo-11, kiểm tra trùng khớp số seal, xuất manifest SHA-256 | Bảng danh sách dossier, chi tiết container, chế độ màn hình kép (split-screen) đối chiếu tài liệu và trích xuất OCR giả lập | `[ĐÃ CÓ TRONG CODE]` (Core) & `[CHỈ CÓ TRONG DEMO]` (UI split-screen) | Core quản lý tính toàn vẹn và khóa bất biến sau khi export; Demo mô phỏng trải nghiệm người dùng đối chiếu chứng từ. |
| **2. Dữ liệu nhà vườn / HTX (PUC)** | Kiểm tra định dạng mã vùng trồng sơ khai, chưa có bảng liên kết thực thể nhà vườn / hợp tác xã | Trường dữ liệu tĩnh `pucCode: VN-DL-012-DEMO` trong fixture dossier, không có cơ sở dữ liệu nhà vườn | `[CHỈ CÓ TRONG DEMO]` / `[CHỈ ĐƯỢC ĐỀ XUẤT TRONG TÀI LIỆU]` | Chưa có bảng dữ liệu riêng cho nhà vườn/HTX; chưa có cơ chế xác minh tính hợp lệ của mã PUC từ cơ quan có thẩm quyền. |
| **3. Bằng chứng hữu cơ / Chuyển đổi (Organic Evidence)** | Chưa có mô hình dữ liệu cho chứng nhận hữu cơ (chỉ có `LAB_TEST_REPORT`, `PHYTOSANITARY_CERTIFICATE`) | Chưa có màn hình hoặc hồ sơ chứng nhận hữu cơ chuyên biệt; chỉ đề cập gián tiếp trong slide và luận điểm | `[CHỈ ĐƯỢC ĐỀ XUẤT TRONG TÀI LIỆU]` | Đây là năng lực cốt lõi mới theo định hướng của founder. DuriOS chỉ đóng vai trò kho lưu trữ bằng chứng từ tổ chức chứng nhận độc lập, không tự cấp chứng nhận. |
| **4. B2B Marketplace, Đơn hàng & Thanh toán** | Không có mã nguồn nào về sàn giao dịch, chào hàng, đơn hàng hay tích hợp cổng thanh toán | Không có màn hình giao dịch; có mô hình tính toán ARR/SaaS/Pilot engine nhưng chỉ là tính toán tài chính | `[CHỈ ĐƯỢC ĐỀ XUẤT TRONG TÀI LIỆU]` | Đã có trong định hướng sản phẩm mới của founder; tuyệt đối không để DuriOS giữ tiền, không đóng vai trò trung gian tài chính. |
| **5. Cô lập đa tổ chức (Multi-Tenant)** | So khớp trường `tenantId` cơ bản giữa actor và dossier; có mã lỗi `CROSS_TENANT_FORBIDDEN` | Bộ chọn tổ chức giả định (Krông Pắc #01, #02, #03) trên giao diện; không có bảo vệ server-side | `[ĐÃ CÓ TRONG CODE]` (Sơ khai ở Core) & `[CHỈ CÓ TRONG DEMO]` (Mock ở Demo) | Core mới kiểm tra `tenantId` trên từng lệnh gọi riêng lẻ, chưa có bảng quản lý Organization/Tenant, chưa có mã hóa hay khóa phân vùng session. |
| **6. Quyền sở hữu & Phân quyền dữ liệu** | 3 vai trò `CLERK`, `MANAGER`, `ADMIN`; giải quyết qua header `x-actor-role` (Insecure) | Chuyển đổi vai trò qua nút bấm UI; chưa có phân quyền theo lô hoặc mục đích chia sẻ | `[ĐÃ CÓ TRONG CODE]` (FSM Core) & `[CHỈ CÓ TRONG DEMO]` (UI Switcher) | Thiếu hệ thống phân quyền chi tiết (RBAC/ABAC) theo bên tạo dữ liệu (Data Creator Ownership) và cơ chế chia sẻ/thu hồi quyền theo lô. |
| **7. Bất biến kiểm toán & Xuất khẩu (Audit / Export)** | Bảng SQLite `audit_events` liên kết chuỗi băm SHA-256; manifest export tổng hợp SHA-256 | Hàng đợi ngoại tuyến giả lập (`offline-audit-queue.ts`), bảng nhật ký kiểm toán trong session trình duyệt | `[ĐÃ CÓ TRONG CODE]` (Core) & `[CHỈ CÓ TRONG DEMO]` (Demo queue) | Core có chuỗi hash phát hiện can thiệp nhưng chưa chống được can thiệp vật lý file DB; Demo có UI hiển thị audit trail nhưng chỉ lưu in-memory. |

---

## 4. Đối Chiếu Tài Liệu Lịch Sử (Freeze & Field Discovery) Với Code Hiện Tại

### 4.1. Lịch sử Freeze (Command #09, #10)
- **Tài liệu tham chiếu:** `docs/audits/COMMAND-09-*.md` và `docs/audits/COMMAND-10-REPOSITORY-FREEZE.md`.
- **Nội dung đã chốt:**
  - Đóng băng toàn bộ việc sửa code sản phẩm để tránh lãng phí nguồn lực khi chưa kiểm chứng thực địa.
  - Nhận diện 5 lỗ hổng bảo mật nghiêm trọng (VULN-01 Actor Spoofing, VULN-02 Cross-Tenant Boundary, VULN-04 Audit Tampering, VULN-06 Unauthenticated HTTP Ingress, RUL-GB2762-CD Statutory Quarantine).
  - Khống chế trần ngân sách thực địa Tranche 1 ở mức **7.500.000 VNĐ** cho 5 ngày tại Cai Lậy và Krông Pắc.
- **Hiện trạng code so với tài liệu Freeze:**
  - Code trong `durios` đã thực hiện đúng việc cách ly luật định: `RUL-GB2762-CD` bị tắt (`isActive: false`), không cho phép tự động kết luận vi phạm pháp luật khi thiếu công báo chuẩn của Trung Quốc.
  - Các sửa đổi chưa commit trong `durios` (kiểm tra vai trò khi export, hàm `assertCanValidate`, mã lỗi 403) là những cải thiện bảo mật phòng thủ hợp lệ nhằm giải quyết một phần VULN-01 và VULN-02 mà không phá vỡ trạng thái freeze.

### 4.2. Quyết Định Sản Phẩm Mới Của Founder So Với Định Hướng Ban Đầu
- **Định hướng ban đầu (Cũ):** DuriOS thuần túy là phần mềm đối chiếu chứng từ bàn giấy nội bộ tại trạm đóng gói (Clerical Reconciliation Tool) nhằm giảm thời gian soát hồ sơ của nhân viên chứng từ từ 18 phút xuống 3 phút.
- **Định hướng mới của Founder (Chiến dịch mới):** Mở rộng thành nền tảng toàn diện chuỗi giá trị sầu riêng với **Ba Năng Lực Trọng Tâm**:
  1. **Hộ chiếu lô / container (Container/Lot Traceability Passport):** Truy xuất nguồn gốc và liên kết chứng từ kỹ thuật số từ vườn đến cửa khẩu.
  2. **Hồ sơ bằng chứng hữu cơ / chuyển đổi (Independent Organic Certification Evidence):** Lưu trữ và quản lý chứng nhận độc lập từ bên thứ ba có thẩm quyền, giải quyết bài toán kiểm tra dư lượng và chuyển đổi canh tác bền vững.
  3. **Sàn kết nối B2B & Điều phối đơn hàng / thanh toán (B2B Marketplace & Coordination):** Kết nối nhà vườn/HTX, vựa xuất khẩu và thương nhân thu mua quốc tế; điều phối trạng thái thanh toán qua đối tác trung gian được cấp phép mà **DuriOS không giữ tiền**.
- **Nguyên tắc bảo toàn lịch sử:** Các tài liệu phân tích rủi ro, kiểm toán và freeze cũ được giữ nguyên vẹn làm bằng chứng lịch sử và ranh giới an toàn; tài liệu định hướng mới sẽ được lập thành các văn bản riêng biệt có đánh dấu mốc thời gian rõ ràng.

---

## 5. Danh Sách Rủi Ro & Câu Hỏi Cần Giải Quyết Trước Giai Đoạn Pilot

Trước khi được phép bước vào giai đoạn Pilot có người dùng thực tế, các vấn đề kỹ thuật và pháp lý sau đây bắt buộc phải được giải quyết:

### 5.1. Rủi ro kỹ thuật & Bảo mật (Server-side Security)
1. **Xác thực danh tính Actor phía Server (VULN-01):**
   - *Hiện trạng:* Đang dùng header `x-actor-role` hoặc tham số URL. Bất kỳ ai cũng có thể giả mạo làm `ADMIN` hoặc `MANAGER`.
   - *Yêu cầu trước Pilot:* Bắt buộc triển khai phiên làm việc bảo mật (Session Tokens hoặc Signed JWT) và kiểm tra xác thực thực tế trên mọi API route.
2. **Cô lập dữ liệu tổ chức (Multi-Tenant Isolation - VULN-02):**
   - *Hiện trạng:* Dữ liệu các vựa dùng chung một bảng SQLite, lọc bằng mệnh đề `WHERE tenantId = ?`.
   - *Rủi ro:* Rò rỉ dữ liệu thương mại nhạy cảm (giá thu mua, danh sách nhà vườn, số lượng hàng) giữa các vựa cạnh tranh.
   - *Yêu cầu trước Pilot:* Kiểm tra quyền sở hữu tổ chức ở tầng cơ sở dữ liệu và middleware trước khi trả dữ liệu.
3. **Quyền Export và Validation trên Dossier đã Niêm Phong:**
   - *Hiện trạng:* FSM đã có `assertCanValidate` và chặn Clerk export trong uncommitted diff của Core.
   - *Yêu cầu trước Pilot:* Đảm bảo không có bất kỳ API nào cho phép chỉnh sửa tài liệu, trích xuất lại trường, hoặc thay đổi kết quả kiểm tra sau khi hồ sơ đã ở trạng thái `EXPORTED` hoặc `CLOSED`.
4. **Chia sẻ và thu hồi quyền xem bằng chứng (Access Grant & Revoke):**
   - *Hiện trạng:* Chưa có cơ chế cấp quyền tạm thời cho bên thứ ba (như cơ quan kiểm dịch, ngân hàng, hoặc đối tác thu mua).
   - *Yêu cầu trước Pilot:* Thiết kế mô hình phân quyền theo mục đích (purpose-based access control) với thời hạn hết hiệu lực (expiration time) và khả năng thu hồi quyền ngay lập tức.

### 5.2. Rủi ro tài chính, pháp lý & Ranh giới trách nhiệm (Legal & Financial Boundaries)
1. **Ranh giới xử lý tiền (Payment & Fund Custody Boundary):**
   - *Nguyên tắc cốt tử:* DuriOS **không có giấy phép trung gian thanh toán** tại Việt Nam (theo Nghị định 52/2024/NĐ-CP) và không có giấy phép tài chính tại Trung Quốc.
   - *Giải pháp:* DuriOS chỉ nhận webhook cập nhật trạng thái đơn (ESCROW_LOCKED, RELEASED) từ ngân hàng hoặc tổ chức trung gian thanh toán được cấp phép; tuyệt đối không thu tiền hộ, không giữ tiền tạm ứng và không can thiệp vào tài khoản thanh toán.
2. **Ranh giới chứng nhận hữu cơ (Organic Certification Boundary):**
   - *Nguyên tắc cốt tử:* DuriOS là nền tảng phần mềm, **không phải tổ chức đánh giá sự phù hợp** (Conformity Assessment Body) theo Nghị định 107/2016/NĐ-CP và không cấp chứng nhận hữu cơ TCVN 11041 hay USDA/EU Organic.
   - *Giải pháp:* Mọi hiển thị trên giao diện và báo cáo phải nêu rõ: DuriOS chỉ lưu trữ bản sao điện tử chứng chỉ do tổ chức độc lập cấp; trách nhiệm pháp lý về tính xác thực của chứng chỉ thuộc về bên cấp và chủ hàng.
3. **Giới hạn quy tắc kiểm nghiệm Cadmium & Phyto:**
   - *Rủi ro:* Tự động gắn mác "Không đạt tiêu chuẩn xuất khẩu" có thể dẫn đến việc khách hàng kiện DuriOS nếu container bị giữ lại hoặc bán tháo sai lệch.
   - *Giải pháp:* Giữ nguyên trạng thái cách ly `isStatutoryVerified: false` và hiển thị cảnh báo dưới dạng "Khuyến cáo nội bộ cần chuyên viên kiểm tra lại" (Human-in-the-loop review).

---

## 6. Tổng Hợp Các Thay Đổi Chưa Commit (Uncommitted Diffs)

Để các prompt sau (Prompt 2, Prompt 3, Prompt 4A/B) không làm mất dữ liệu hoặc xung đột mã nguồn, dưới đây là bảng kiểm kê các thay đổi dở dang cần được tôn trọng và tích hợp an toàn:

| Kho mã nguồn | File bị ảnh hưởng | Loại thay đổi | Mục đích & Lưu ý tích hợp |
|---|---|---|---|
| `durios` | `src/domain/dossier-fsm.ts` | Modified | Chặn Clerk export; hàm `assertCanValidate` chặn sửa hồ sơ niêm phong. CẦN GIỮ NGUYÊN. |
| `durios` | `src/rules/rule-catalog.ts` | Modified | Vô hiệu hóa `RUL-GB2762-CD` theo yêu cầu an toàn pháp lý. CẦN GIỮ NGUYÊN. |
| `durios` | `src/server/dossier-handlers.ts` | Modified | Trả về 403 Forbidden cho lỗi cross-tenant. CẦN GIỮ NGUYÊN. |
| `durios` | `src/workspace/container-dossier-workspace.ts` | Modified | Rollback tệp tin và vô hiệu hóa validation cũ. CẦN GIỮ NGUYÊN. |
| `durios` | `src/server/public/index.html` | Modified | Giao diện kiểm thử cục bộ. CẦN GIỮ NGUYÊN. |
| `durios` | `test/*.test.ts` (10 files) | Modified / Untracked | 48 tests đang xanh 100%. Bắt buộc giữ pass toàn bộ. |
| `durios-frontend-demo` | `src/server/public/js/**/*.js` | Modified / Untracked | Toàn bộ 53 submodule đã được phân rã nghiêm ngặt `< 200 LOC`. CẦN BẢO TOÀN. |
| `durios-frontend-demo` | `plans/plan.md` | Modified | Lưu vết tiến độ refactor 16 phase. CẦN GIỮ NGUYÊN. |

---

## 7. Kết Luận: Sự Thật Đã Xác Minh, Giả Định, Câu Hỏi Mở & Cam Kết

### 7.1. Sự thật đã xác minh (Verified Facts)
1. Cả hai repository đang hoạt động độc lập, không có phụ thuộc chéo trong cấu hình package: `durios` sở hữu logic miền nghiệp vụ và FSM; `durios-frontend-demo` sở hữu bản trình diễn tĩnh zero-build ES Modules.
2. Toàn bộ các bộ kiểm thử hiện có trên cả hai repository đều đạt trạng thái màu xanh (48/48 tests tại `durios`, 113/113 tests tại `durios-frontend-demo`).
3. Core backend chưa hề có code cho phân hệ Marketplace, Đơn hàng, Thanh toán hay Quản lý chứng nhận hữu cơ độc lập. Mọi nội dung này hiện mới dừng ở mức tài liệu định hướng chiến lược.
4. Core backend chưa có hệ thống xác thực mật mã; tính năng đa tổ chức mới ở mức kiểm tra `tenantId` thủ công trên FSM và HTTP handler.
5. Chưa có bất kỳ dòng source code, test, file cấu hình hay tài liệu cũ nào bị sửa đổi hay xóa bỏ trong quá trình thực hiện Prompt 1 này.

### 7.2. Giả định cần kiểm chứng (Assumptions to Test)
1. Giả định rằng nhà vườn và hợp tác xã có sẵn chứng nhận hữu cơ hợp lệ hoặc hồ sơ chuyển đổi số hóa để tải lên hệ thống.
2. Giả định rằng các bên mua (Buyers) tại Trung Quốc sẵn sàng chấp nhận một hộ chiếu điện tử do DuriOS tổng hợp thay vì chỉ dựa vào bản giấy truyền thống.
3. Giả định rằng các tổ chức tài chính hoặc cổng thanh toán được cấp phép sẵn sàng cung cấp API webhook để DuriOS điều phối trạng thái thanh toán ký quỹ mà không cần giữ tiền.

### 7.3. Câu hỏi mở cần Founder giải quyết tại Cổng phê duyệt
1. **Phạm vi Pilot đầu tiên:** Có nên giới hạn pilot chỉ ở **Năng lực 1 (Hộ chiếu lô/container)** trước để chứng minh tính khả thi tại vựa, sau đó mới tích hợp **Năng lực 2 (Hồ sơ hữu cơ)** và **Năng lực 3 (Marketplace)** ở các giai đoạn sau không?
2. **Cơ chế xác thực cho Pilot:** Trong đợt pilot kín, founder dự định dùng phương thức xác thực nào (ví dụ: Session Cookie đơn giản kèm mã PIN gửi qua Zalo/Email hay JWT)?
3. **Đối tác thanh toán mục tiêu:** Đã có thỏa thuận hoặc thảo luận sơ bộ với ngân hàng hoặc cổng thanh toán nào tại Việt Nam (được cấp phép theo Nghị định 52) để kết nối API ký quỹ (escrow coordination) chưa?

---
*Xác nhận: Báo cáo được khởi tạo mới hoàn toàn tại `docs/product-direction/REPO-CROSSWALK.md`. Không có bất kỳ source code, test hay tài liệu lịch sử nào bị can thiệp.*
