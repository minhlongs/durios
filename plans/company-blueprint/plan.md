# DuriOS 25-Step Open-Core Company Blueprint (Verified Durian Trade Network)

**Project / Stage:** `STAGE_0_SINGLE_SITE_PROTOTYPE` (stage=`zero` theo `.mekong/company.json`) — 01 vựa duy nhất: `SITE-CAILAY-TIENGIANG-01` (Cai Lậy, Tiền Giang). Địa điểm do Founder chọn và phê duyệt ngày 2026-10-17 theo `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`.

**Dual-license:** `AGPL-3.0-only` cho lõi cộng đồng (Community Core) + `MIT` cho SDK xác minh độc lập (`standalone-manifest-verifier.ts`) + giấy phép thương mại ký số `Ed25519` cho `PACKHOUSE_PRO_SAAS` và `EXPORTER_ENTERPRISE`. Bằng chứng: `src/saas/open-core-edition-manifest.ts`, `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`.

**Cập nhật lần cuối:** 2026-10-22

Bản blueprint này là tài liệu điều hành trung thật (truthful operating blueprint) của DuriOS ở Stage 0. Quy tắc trung thực bắt buộc như sau. Dấu `[x]` trong `tasks.md` chỉ xác nhận **mục blueprint đã được biên soạn** — nghĩa là artifact (tệp mã nguồn, tài liệu hoặc kiểm thử) đã tồn tại trong kho mã, chứ không có nghĩa là bước đó đã thực thi xong tại thực địa. Trạng thái thực thi của mỗi bước được ghi bằng nhãn trạng thái đặt ở cuối đoạn của chính bước đó trong tệp này. Lệnh `bun run blueprint:verify-25-steps` báo kết quả 25/25 chỉ đo **độ phủ artifact**: có đúng dòng tiêu đề `## <N>.`, có đúng dòng đánh dấu `- [x] **Step <N>:` trong `tasks.md`, và tệp artifact có tồn tại trên đĩa. Kết quả 25/25 đó không chứng minh bất kỳ điều gì về bằng chứng thực địa, khách hàng trả tiền, hay hợp đồng đã ký. Mọi tuyên bố vượt quá độ phủ artifact phải mang nhãn `[Chưa được xác minh]`.

### Chú giải nhãn trạng thái

- `[Đã có code]`: Mã nguồn hoặc tệp bằng chứng tồn tại trong kho, chạy được và đã được kiểm thử tổng hợp; chưa được kiểm chứng trong môi trường thực tại của vựa.
- `[Đã kiểm thử tổng hợp]`: Đã vượt qua kiểm thử tự động với dữ liệu tổng hợp (synthetic/seeded) hoặc trên staging; đây là bằng chứng kỹ thuật, chưa phải bằng chứng thực địa với dữ liệu khách hàng thật.
- `[Đang chờ điều kiện]`: Bị chặn bởi một điều kiện tiên quyết nằm ngoài tầm kiểm soát của kỹ thuật (chữ ký DPA, credential nhà mạng OTP, quyết định thương mại, phê duyệt pháp lý); không được trình bày như đã đạt.
- `[Giả thuyết]`: Giả định kinh tế hoặc thị trường chưa được kiểm chứng bằng dữ liệu khách hàng thật; chỉ dùng để ra quyết định, không dùng để tuyên bố ngoài.
- `[Mục tiêu]`: Định hướng dài hạn đã được ghi nhận; chưa có lộ trình đo lường hay dữ liệu hỗ trợ.
- `[Chưa được xác minh]`: Không có bằng chứng nào trong kho mã và không được phép suy diễn; phải ghi rõ là chưa đo, không được trình bày như đã đạt.

### Năm ưu tiên thực thi (tóm tắt — chi tiết cập nhật trong `tasks.md`)

1. Xác minh hồ sơ launch gate bằng bằng chứng thật: chạy `bun run pilot:audit-pack -- --verify` với thư mục dữ liệu và thư mục sao lưu thật, ghi rõ từng cổng `GATE-01` đến `GATE-05` đạt hay chưa đạt.
2. Hoàn tất chấp thuận dữ liệu (`GATE-01`): ký biên bản chấp thuận xử lý dữ liệu (DPA) với chủ vựa Cai Lậy theo Luật Bảo vệ dữ liệu cá nhân `91/2025/QH15`; nếu chưa ký thì nghiêm cấm nạp dữ liệu khách hàng thật.
3. Xác thực OTP thật (`GATE-02`): nạp credential nhà mạng (Zalo ZNS / SMS Brandname) trên staging và chứng minh vòng lặp gửi-nhận OTP thật; trong khi chưa cấu hình, hệ thống giữ chế độ fail-closed trả `503`.
4. Chuẩn bị phép đo 4 chỉ số giá trị thực địa (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`) và nhật ký nhu cầu / mức giá chấp nhận được của chủ vựa.
5. Chỉ chạy pilot với dữ liệu thật khi và chỉ khi cả 5 cổng đạt (`goForLiveCustomerData = true`); sau đó mới kiểm tra các giả thuyết giá và quyết định có tiếp tục hướng V2 hay không.

---

## 1. Open-Core Master Framework (`[Đã có code]`)
- **Business:** Bản Community miễn phí 100% tính năng đối soát hồ sơ container GACC (`VN_CN`), xác minh con người (HITL), sổ cái chuỗi băm SHA-256 (`SqliteAuditLedger`), phân quyền Tri-Tuple RBAC và bộ xác minh manifest độc lập (`MIT`) cho bên nhập khẩu hoặc hải quan Trung Quốc tự kiểm tra tính toàn vẹn mà không cần mua giấy phép.
- **Agentic:** Phần nội dung Pro (Cloud Vision OCR, Zalo ZNS relay, E2EE Cloud Backup Vault, GACC Registry Watch) được mở khóa bằng khóa ký số `Ed25519`; hệ thống ghi nhận 13 module được phân loại rõ ràng theo `MOD-MIT-01..04`, `MOD-PRO-01..04`, `MOD-ENT-01..03`, `MOD-AGPL-01..02` để kiểm toán biên giới bản quyền tự động.
- **Governance:** Tách biệt giấy phép `AGPL-3.0-only` cho lõi và `MIT` cho SDK xác minh độc lập; cam kết zero-lock-in — khi hết hạn giấy phép thương mại, hệ thống tự hạ cấp nhẹ về `COMMUNITY_OPEN_CORE` và chủ vựa vẫn giữ 100% quyền đọc/ghi/xuất dữ liệu SQLite cục bộ.
- **Bằng chứng (Evidence source):** `src/saas/open-core-edition-manifest.ts`, `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`
- **Trạng thái hiện tại:** `[Đã có code]` — `getOpenCoreEditionManifest()` trả manifest phiên bản `1.0.0` với 13 module và khối `economicTruth`; `test/open-core-25-step-blueprint-e2e.test.ts` xác nhận qua HTTP `GET /api/v1/open-core/edition-manifest`. Đây là bằng chứng kỹ thuật về cấu trúc open-core, không phải bằng chứng thương mại: chưa có khách hàng trả tiền nào chứng minh mô hình.
- **Hành động tiếp theo:** Duy trì biên giới `MIT` sạch khỏi import AGPL/SaaS mỗi khi thêm module; chạy lại turn 1 của deep introspector (`MOD-MIT` isolation) sau bất kỳ thay đổi nào ở `src/export/` hoặc `src/ingestion/`.

## 2. 2026 Truthful Plan Refresh (`[Đã kiểm thử tổng hợp]`)
- **Business:** Số liệu thị trường dùng để ra quyết định giá và chiến lược được lấy từ Bộ Nông nghiệp & Môi trường công bố ngày 03/09/2026 tại họp báo thường kỳ của Chính phủ: cả nước có khoảng **1.599 mã số vùng trồng (PUC)** và **281 cơ sở đóng gói sầu riêng đang hoạt động trên toàn quốc**; kim ngạch xuất khẩu 2025 đạt khoảng **3,85 tỷ USD**, 8 tháng đầu năm 2026 ước đạt **1,95 tỷ USD**, trong đó Trung Quốc chiếm trên **95%**. Cùng ngày, Bộ cũng báo cáo GACC đã phê duyệt thêm 401 mã vùng trồng và 166 cơ sở đóng gói.
- **Agentic:** Con số 281 và trần `$657.643` được mã hóa trực tiếp trong `economicTruth` của manifest để mọi báo cáo tự động phải dùng cùng một nguồn sự thật, thay vì để mỗi báo cáo tự nhập số.
- **Governance:** Mọi số liệu thị trường đều ghi rõ ngày công bố (03/09/2026), cơ quan công bố và phạm vi (cơ sở đóng gói sầu riêng đang hoạt động trên toàn quốc). Các tài liệu V2 đều ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW`; căn cứ đã phê duyệt hiện hành là `PRODUCT-PRD-V1.md` và `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (Founder approval 2026-10-14).
- **Bằng chứng (Evidence source):** `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/DURIOS-STRATEGY-V2.json`, `docs/product-direction/PRODUCT-PRD-V1.md`. Nguồn số liệu thị trường (Bộ NN&MT tại họp báo Chính phủ thường kỳ tháng 8, công bố ngày 03/09/2026): [hop-bao-chinh-phu-thuong-ky-thang-8](https://baochinhphu.vn/hop-bao-chinh-phu-thuong-ky-thang-8-dai-dien-bo-cong-an-lam-ro-nhieu-van-de-duoc-quan-tam-102260903170016698.htm)
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — khối `economicTruth` (281 vựa, `proAnnualPriceVnd` 60.000.000, `pureVietnamSaasCeilingUsd` 657.643, `targetArrUsd` 1.000.000) được kiểm thử tự động trong `test/open-core-25-step-blueprint-e2e.test.ts` và hiển thị qua API. Các tài liệu JSON/dịch dữ liệu số đã kiểm thử được; bản thân sự kiện thị trường 03/09/2026 là nguồn ngoài và được trích dẫn chứ không được kiểm chứng lại trong kho mã.
- **Hành động tiếp theo:** Mỗi khi Bộ NN&MT công bố số liệu mới, cập nhật `economicTruth` trong manifest, `VALIDATION-AND-ECONOMICS-V2.md` và `DURIOS-STRATEGY-V2.json` cùng một ngày để ba nguồn không lệch nhau.

## 3. Agentic OS & HITL Governance (`[Đã kiểm thử tổng hợp]`)
- **Business:** Vai trò AI chỉ được phép đề xuất bóc tách (extraction) và phát hiện bất thường; quyết định phê duyệt xuất khẩu cuối cùng bắt buộc thuộc về con người. Khi nhân viên vựa xác nhận hoặc sửa một trường dữ liệu, hệ thống ghi nhận `verifiedBy` là tên con người kèm dấu thời gian, và phân biệt rõ `FIELD_HUMAN_VERIFIED` (xác nhận) với `FIELD_MANUALLY_EDITED` (sửa tay) trên sổ cái.
- **Agentic:** `HitlVerificationService.verifyOrCorrectField()` yêu cầu tham số `AuthenticatedActor` bắt buộc — nghĩa là mọi lần xác minh đều gắn với một danh tính người đã đăng nhập, không tồn tại đường nào để máy tự phê duyệt trường dữ liệu. Trạng thái chỉ có thể là `HUMAN_VERIFIED` hoặc `REJECTED`.
- **Governance:** AI tự phê duyệt xuất khẩu là **nghiêm cấm**. Quyền tải chứng từ chỉ thuộc về vai trò `CLERK`, `MANAGER` hoặc `ADMIN` của tenant `PACKHOUSE_EXPORTER`; chặn upload xuyên tenant (`CROSS_TENANT_FORBIDDEN`) và chặn vai trò chỉ-đọc. Phê duyệt xuất khẩu thuộc về persona Packhouse (Manager), theo kiểm thử `test/tri-tuple-persona-rbac.test.ts`.
- **Bằng chứng (Evidence source):** `src/verification/hitl-service.ts`, `src/auth/rbac-persona-assertions.ts`, `src/auth/rbac-policy.ts`, `test/tri-tuple-persona-rbac.test.ts`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — cơ chế HITL và assertion RBAC được kiểm thử tự động trên danh tính tổng hợp; chưa có bằng chứng từ phiên làm việc thật của nhân viên vựa Cai Lậy vì `GATE-01` (ký DPA) chưa xong nên chưa nạp dữ liệu thật.
- **Hành động tiếp theo:** Sau khi `GATE-01` đạt, ghi log vận hành thật của ít nhất 5 phiên HITL vào data room để làm bằng chứng con người giữ quyền phê duyệt tại thực địa.

## 4. Pilot Readiness & Audit Evidence Baseline (GATE-01 to GATE-05) (`[Đang chờ điều kiện]`)
- **Business:** Hệ thống 5 cổng khai trương quyết định khi nào được nạp dữ liệu khách hàng thật. `GATE-01` cần biên bản chấp thuận đã ký tại đường dẫn `DURIOS_GATE01_CONSENT_FILE`; `GATE-02` cần nhà cung cấp OTP thật đã cấu hình (`isConfigured`); `GATE-03` cần bind loopback (127.0.0.1) cộng chuỗi băm kiểm toán toàn vẹn; `GATE-04` cần thư mục sao lưu tồn tại và hợp lệ (`verifySiteBackup`); `GATE-05` cần ít nhất 5 hồ sơ trong cơ sở dữ liệu thật với trung bình số học dưới 300 giây và ít nhất 2 lỗi gài mù bị bắt toàn bộ.
- **Agentic:** Bộ đánh giá `verifySingleSiteLaunchGates()` hoạt động fail-closed: không suy đoán trạng thái từ sự tồn tại của tệp khi tệp không đủ điều kiện, và biến `goForLiveCustomerData` chỉ là `true` khi cả 5 cổng đạt.
- **Governance:** `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md` mục "Ranh giới an toàn bắt buộc" cấm nạp dữ liệu khách hàng thật cho đến khi toàn bộ 5 cổng được kiểm toán viên ký xác nhận qua `bun run pilot:audit-pack -- --verify`, và yêu cầu giữ nguyên mô hình Zero-Custody và Local Core.
- **Bằng chứng (Evidence source):** `src/auth/pilot-launch-gate-verifier.ts`, `src/export/field-auditor-cli.ts`, `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`, `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — trạng thái hiện tại: `GATE-01` = `PENDING_SITE_AND_CONSENT_SIGN_OFF` (chưa ký DPA), `GATE-02` = `PENDING_PROVIDER_CREDENTIALS` (chưa nạp credential nhà mạng, fail-closed trả `503`), `GATE-03` = `SECURITY_CONFIG_INCOMPLETE` trừ khi loopback và chuỗi kiểm toán đều hợp lệ (runbook và cấu hình đã được kiểm thử tổng hợp trên staging), `GATE-04` = `PENDING_VERIFIED_BACKUP` (chỉ đạt trong kiểm thử staging có thư mục sao lưu hợp lệ 100% blob khớp SHA-256), `GATE-05` = `REHEARSAL_INCOMPLETE` (chỉ chứng minh trên bộ dữ liệu mô phỏng/seeded, chưa phải diễn tập thực địa). `test/pilot-launch-gate-verifier.test.ts` xác nhận đúng hành vi này: khi thiếu `GATE-01` và `GATE-02`, `passedCount = 3` và `goForLiveCustomerData = false`.
- **Hành động tiếp theo:** Ký DPA (`GATE-01`), nạp credential staging Zalo ZNS/SMS (`GATE-02`), tạo thư mục sao lưu mã hóa thật tại vựa (`GATE-04`), sau đó chạy diễn tập 5 container thực địa với 2 lỗi gài mù (`GATE-05`) và in báo cáo có chữ ký kiểm toán viên.

## 5. Conditional 5-Stage Sequencing Roadmap (`[Mục tiêu]`)
- **Business:** Trình tự điều kiện 5 chặng: `System of Record` (một vựa, Cai Lậy) rồi mới tới `System of Verification` (Verified Profile), `Closed Network` (Verified Trade Rooms), `Transaction Network` (các mạch đối tác có giấy phép) và cuối cùng là `ASEAN Regional Infrastructure` (`MY_CN`, `TH_CN`, `PH_CN`). Mỗi chặng có điều kiện mở riêng, không tự động nối tiếp.
- **Agentic:** Mỗi bước chuyển chặng gắn với một phép đo cụ thể (ví dụ: chuyển từ Stage 0 sang Stage 1 cần ít nhất 3 vựa trả phí độc lập, lỗi cài đặt dưới 5%, chi phí hỗ trợ vận hành dưới 15% doanh thu thuê bao) — không có ngưỡng nào được đạt tự động bằng dữ liệu mô phỏng.
- **Governance:** Hướng đi 5 chặng nằm trong `PRODUCT-PRD-V2.md` ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW`; căn cứ vận hành hiện hành vẫn là `PRODUCT-PRD-V1.md` (phê duyệt Founder 2026-10-14). Không được dùng lộ trình V2 để tuyên bố đã đạt chặng tiếp theo.
- **Bằng chứng (Evidence source):** `docs/product-direction/PRODUCT-PRD-V2.md`, `docs/product-direction/PRODUCT-PRD-V1.md`, `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`
- **Trạng thái hiện tại:** `[Mục tiêu]` — trình tự Stage 0 đến 4 đã được tài liệu hóa nhưng mới chỉ có Stage 0 được phê duyệt; chưa có dữ liệu thực địa để xác nhận điều kiện chuyển chặng ở bất kỳ điểm nối nào.
- **Hành động tiếp theo:** Sau pilot trả phí đầu tiên, đo đủ 4 điều kiện chuyển chặng sang Stage 1 và trình bày số đo thật cho Founder trước khi gọi tên chặng tiếp theo.

## 6. Economic Truth First & Multi-Revenue Stack (`[Giả thuyết]`)
- **Business:** Trần doanh thu SaaS thuần túy tại Việt Nam được tính trực tiếp: 281 cơ sở đóng gói đang hoạt động x 60.000.000 VND/năm = 16,86 tỷ VND ≈ **$657.643 ARR** (tỷ giá 25.637 VND/USD) nếu chiếm trọn 100% thị phần. Để đạt $1M ARR bằng tiền bán phần mềm ở mức 60.000.000 VND/năm cần 1.000.000 x 25.637 / 60.000.000 = 427,28 vựa, và vì không thể bán một phần vựa nên phải làm tròn lên **428 vựa**. Vì 428 > 281, ngay cả khi chiếm 100% thị phần nội địa, thuê bao SaaS đơn thuần vẫn không thể đạt $1M ARR. Kết luận bắt buộc: phải dùng Multi-Revenue Stack 8 tầng (Core + Verification Modules + Multi-Site Enterprise + Network Membership + Transaction Orchestration 0,1-0,5% + Lab/Logistics Referral + Trade Finance Share + ASEAN Expansion) hoặc mở rộng khu vực.
- **Agentic:** Các con số 281 / 657.643 / 1.000.000 / 427 nằm trong `economicTruth` của manifest để mọi báo cáo, API và CLI dùng chung một nguồn; phép kiểm tra vi mô 150.000 VND giá / 8.000 VND COGS biến đổi cho biên lợi nhuận gộp 94,67% được tính trong `open-core-deep-introspector.ts` như một phép kiểm tra mô hình (ngưỡng >= 80%), không phải số đo khách hàng.
- **Governance:** Ba mức giá được giữ nguyên là **giả thuyết cần kiểm chứng thực địa** theo quyết định của Founder ghi trong `docs/product-direction/PRODUCT-PRD-V1.md`: pilot **5.000.000 VND / 5 container**, thuê bao **60.000.000 VND/năm**, phí thiết lập **10.000.000 VND/vựa** (một lần). Doanh thu một lần (phí pilot, phí thiết lập) phải được báo cáo **tách riêng** khỏi ARR; ARR chỉ tính doanh thu thuê bao định kỳ.
- **Bằng chứng (Evidence source):** `docs/product-direction/DURIOS-STRATEGY-V2.json`, `src/saas/open-core-edition-manifest.ts`, `src/saas/open-core-deep-introspector.ts`, `docs/product-direction/PRODUCT-PRD-V1.md`
- **Trạng thái hiện tại:** `[Giả thuyết]` — kết luận "428 > 281 nên SaaS nội địa không thể chạm $1M ARR" là phép toán đúng trên các số liệu đã công bố và mô hình giá đã cho; xin coi đó là kết quả có điều kiện của các giả thuyết đó. Chưa có một khách hàng thật nào để hiệu chỉnh mô hình.
- **Hành động tiếp theo:** Dùng 10 cuộc khảo sát thực địa ở Cai Lậy và Tiền Giang để kiểm chứng mức giá trước khi đưa vào hợp đồng; nếu không có vựa nào trả 5.000.000 VND cho gói 5 container thì dừng theo tiêu chí WTP (xem bước 25).

## 7. Tri-Tuple Buyer & Operator Personas (`[Đã có code]`)
- **Business:** Ba nhóm người dùng điều hành được tách riêng trong mã: người vận hành vựa (thao tác hồ sơ), người quản lý vựa (phê duyệt xuất khẩu) và bên mua quan sát. Vai trò chỉ-đọc không được quyền chèn dữ liệu, ngăn việc một vai trò vô tình bị kéo lên quyền cao hơn.
- **Agentic:** `rbac-policy.ts` định nghĩa 5 vai trò điều hành kèm bộ ba hợp lệ `(ProductPersona, TenantType, UserRole)`; mọi xác thực đều phân về một `AuthenticatedActor` do server quản lý, nên việc giả mạo bằng header (`x-actor-role`, `x-tenant-id`) hoặc query (`?role=`) không làm thay đổi danh tính và bị từ chối `401`/`403`.
- **Governance:** Kiểm thử chống tăng quyền: `test/tri-tuple-persona-rbac.test.ts`, `test/server-auth-5a1.test.ts`, `test/rbac-and-tuples-5a2.test.ts` đạt 100%, được ghi nhận trong runbook bảo mật như cách xác minh mục 1.
- **Bằng chứng (Evidence source):** `src/auth/rbac-policy.ts`, `src/auth/rbac-persona-assertions.ts`, `test/tri-tuple-persona-rbac.test.ts`, `test/rbac-and-tuples-5a2.test.ts`
- **Trạng thái hiện tại:** `[Đã có code]` — 5 vai trò và assertion phân quyền tồn tại trong mã và được kiểm thử tự động; chưa có bằng chứng vận hành thật của tài khoản chủ vựa Cai Lậy vì GATE-01 và GATE-02 chưa đạt nên chưa nạp dữ liệu thật.
- **Hành động tiếp theo:** Provisioning tài khoản thật cho CLERK/MANAGER tại Cai Lậy sau khi `GATE-01` hoàn tất, ghi vào data room tài liệu cấp quyền.

## 8. Category Positioning (`[Đã có code]`)
- **Business:** Định vị đúng danh mục: **DuriOS — Operating System for Verified Durian Trade**. Không phải phần mềm truy xuất nguồn gốc bằng mã QR đại trà, không phải chợ/thương mại điện tử tự do, và không cam kết thay thế quyết định kiểm dịch hoặc thông quan của Hải quan Việt Nam / GACC Trung Quốc. Bản thân hồ sơ chỉ được phép gắn nhãn `EVIDENCE_STORED_NOT_CERTIFIED`.
- **Agentic:** Vị thế danh mục được thể hiện trong toàn bộ văn bản đầu ra: từng dòng trong vision V2, disclaimer, tuyên bố API đều cần giữ đúng cách nói "verified trade network" thay vì "chứng nhận" để tránh hiểu nhầm về phạm vi pháp lý.
- **Governance:** Tuyên bố định vị nằm trong `PRODUCT-VISION-V2.md` (`DRAFT_FOR_FOUNDER_REVIEW`) nhưng đi kèm disclaimer đã được điều chỉnh trong `01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md` và `REPO-CROSSWALK.md`.
- **Bằng chứng (Evidence source):** `docs/product-direction/PRODUCT-VISION-V2.md`, `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `docs/product-direction/REPO-CROSSWALK.md`
- **Trạng thái hiện tại:** `[Đã có code]` — các tuyên bố định vị và disclaimer nằm trong tài liệu đã phê duyệt/đang soát; chưa có khách hàng nào xác nhận cách họ định vị sản phẩm, nên mọi lời hứa về nhận diện thương hiệu là `[Chưa được xác minh]`.
- **Hành động tiếp theo:** Chỉ dùng cách diễn đạt định vị chuẩn trong mọi kênh giao tiếp khách hàng; không thêm tuyên bố "chứng nhận hữu cơ" hay "cam kết thông quan" cho tới khi có pháp lý đồng ý.

## 9. Bilingual Open-Source Docs & MIT Verifier (`[Đã kiểm thử tổng hợp]`)
- **Business:** Bất kỳ bên nhập khẩu, môi giới, hải quan hay ngân hàng nào cũng có thể tự kiểm tra tính toàn vẹn hồ sơ xuất khẩu mà không phụ thuộc DuriOS và không cần mua giấy phép, giúp tín hiệu "verified" trở nên kiểm chứng được bởi bên thứ ba.
- **Agentic:** `verifyExportManifest()` chạy ngoại tuyến, không phụ thuộc mạng, kiểm ISO 6346 (check-digit của mã container ISO 6346:1995) và băm SHA-256 của toàn bộ chứng từ, rồi trả về URL xác minh công khai để bên thứ ba tự mở lại. SDK `MIT` không được phép kéo vào bất kỳ thư viện AGPL hay SaaS nào, nếu đưa vào sẽ phá biên giới bản quyền của module này.
- **Governance:** Biên giới `MIT` được kiểm tra tự động bởi turn 1 của deep audit (4/4 module MIT sạch import AGPL/SaaS). Tài liệu cộng đồng giữ song ngữ Việt-Anh để người mua nước ngoài tự đọc hiểu được.
- **Bằng chứng (Evidence source):** `src/export/standalone-manifest-verifier.ts`, `src/export/manifest-compiler.ts`, `src/ingestion/document-hasher.ts`, `README.md`, `AGENTS.md`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — kiểm tra ISO 6346 và SHA-256 trong `test/open-core-25-step-blueprint-e2e.test.ts` và `test/saas-cloud-connectors.test.ts`; biên giới MIT sạch được turn 1 xác nhận với bằng chứng dạng chuỗi (`"4/4 MIT modules clean of AGPL/SaaS imports."`). Chưa có nhà nhập khẩu nước ngoài nào tự kiểm chứng hồ sơ thật nên chưa có bằng chứng chấp nhận của bên thứ ba.
- **Hành động tiếp theo:** Sau mỗi lần thêm sửa, chạy lại turn 1 (biên giới MIT) và `test/blueprint-25-step-auditor.test.ts` trước khi commit để đảm bảo 100% tách biệt bản quyền.

## 10. Federated Privacy-First Narrative (`[Đã có code]`)
- **Business:** Dữ liệu nhạy cảm của vựa (giá mua tại vườn, danh sách nông hộ, biên lợi nhuận) nằm tại chỗ trong SQLite của vựa và không rời máy chủ; chỉ những bằng chứng đã được cấp `ShareAccessGrant` cùng các chỉ số của `VerifiedOrganizationProfile` (số chuyến đã xác minh, thời gian sẵn sàng trung bình) được chia sẻ ra ngoài.
- **Agentic:** `compileVerifiedOrganizationProfile()` đếm số hồ sơ đạt `APPROVED_FOR_EXPORT` hoặc `EXPORTED` và đếm các lệch mismatch seal chưa xử lý xong; nó không trộn giá mua, tên nông hộ hay biên lợi nhuận vào profile, nên việc chạy trên staging với dữ liệu mô phỏng không làm lộ dữ liệu nhạy cảm. `verifyWorkspacePortabilityBundle` chỉ so khớp `payloadSha256` và HMAC, không xem bên trong hồ sơ.
- **Governance:** Phân biệt "share" (chia sẻ chứng cứ được cấp quyền) với "vỡ riêng tư" (rò rỉ dữ liệu thô) là ranh giới bắt buộc trong `test/open-core-workspace-portability.test.ts`.
- **Bằng chứng (Evidence source):** `src/sharing/verified-org-profile.ts`, `src/sharing/share-grant-store.ts`, `src/sharing/dense-cluster-readiness.ts`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`
- **Trạng thái hiện tại:** `[Đã có code]` — `VerifiedOrganizationProfile` và xác minh bọc HMAC được kiểm thử tự động; các bằng chứng kiểm thử chỉ dùng dữ liệu tổng hợp. Không có yêu cầu cấp quyền nào thật từ chủ vựa để kiểm chứng chính sách cụ thể nên mọi thứ này mới chỉ là khả năng kỹ thuật.
- **Hành động tiếp theo:** Thử nghiệm thực địa với chủ vựa (sau `GATE-01`) về những trường họ bằng lòng chia sẻ; nếu họ từ chối toàn bộ việc chia sẻ bất kỳ trường nào, kích hoạt tiêu chí dừng số 4 (Privacy Sharing Refusal).

## 11. Field-First Demo & Blind-Fault Testing (`[Đã kiểm thử tổng hợp]`)
- **Business:** Thể hiện giá trị trước bằng cách bắt 100% lỗi gài mù: 1 sai khác mã container (ISO 6346) sau khi chuẩn hóa check-digit và 1 sai khác số seal, cùng với việc phát hiện chứng từ chưa xác minh đầy đủ. Điều này diễn tả giá trị của DuriOS ngay trên container đầu tiên, không cần chờ thu thập dữ liệu lịch sử.
- **Agentic:** Seeder tạo CLERK/MANAGER cho tenant diễn tập, 5 hồ sơ cho tenant `TENANT-CAILAY-PILOT-01` (1 sạch `CLEAN_READY`, 1 mismatch seal `BLIND_FAULT_SEAL_MISMATCH`, 1 chứng từ chưa xác minh `BLIND_FAULT_UNVERIFIED_EVIDENCE`, 2 trong số đó bị chặn không cho phê duyệt) và phép tính KPI tính trung bình số học `meanDeltaSeconds` trên mô hình không suy đoán dữ liệu; hai hồ sơ lỗi chặn `approve` và hai cột bị chặn được phê duyệt trả về `prepareAggregation`. Phép tính KPI tính trung bình số học của các mốc thời gian, không dùng trung vị; các ca chậm không được lược bỏ.
- **Governance:** Phép đo diễn ra trên cơ sở dữ liệu diễn tập (`seedGate05PilotRehearsal`) có seed synthetic; cơ chế đọc từ workspace thật và dữ liệu thật được đánh giá bởi `test/pilot-rehearsal-seeder.test.ts`.
- **Bằng chứng (Evidence source):** `src/auth/pilot-rehearsal-seeder.ts`, `src/auth/pilot-kpi-evaluator.ts`, `test/pilot-rehearsal-seeder.test.ts`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — seeder phát 5 hồ sơ, KPI báo `meanDeltaSeconds` dưới 300 giây khi bin dữ liệu đủ 5 mốc, `blindFaultCount = 2`, `blindFaultsCaught = 2`, `zeroMissGate = true` và `gate05Passed = true`; trình duyệt/CLI cũng trả về cùng các số. Đây là bằng chứng trên dữ liệu mô phỏng — chưa phải diễn tập thực địa với dữ liệu thật.
- **Hành động tiếp theo:** Lặp lại diễn tập với 5 container thật tại Cai Lậy sau khi đạt `GATE-04`; so số đo thực tế với 5 phút và 100% bắt lỗi, ghi kết quả vào báo cáo kiểm toán viên.

## 12. Case Study Evidence Protocol (`[Đang chờ điều kiện]`)
- **Business:** Bốn chỉ số chứng minh giá trị kinh tế trực tiếp cho chủ vựa đo ngay từ container đầu tiên: (1) số phút tiết kiệm được mỗi container (`minutesSavedPerContainer`), so với ghi chép quét xử lý thủ công khoảng 30-45 phút; (2) số lần chạm tay vào dữ liệu của nhân viên (`humanTouchesPerContainer`); (3) số ngoại lệ/sai lệch phát hiện sớm (`exceptionsDiscoveredPerContainer`) trước khi đóng hàng; (4) thiệt hại dự phòng ngăn chặn được (`expectedLossAvoidedVnd`), ước tính khoảng 20.000.000-50.000.000 VND/container khi sai lệch số seal tại cửa khẩu.
- **Agentic:** `pilot-kpi-extended-types.ts` định nghĩa kiểu dữ liệu cho bốn chỉ số và mã phân loại ghi chép `Scenario`; `pilot-launch-gate-verifier.ts` đọc và tính 4 chỉ số này từ dữ liệu workspace.
- **Governance:** Chưa được kiểm chứng thực địa vì chưa có dữ liệu thật; mọi trần kinh tế (ví dụ 20-50 triệu VND tránh mất) là giả định để hiển thị cho chủ vựa, không phải cam kết pháp lý/doc.
- **Bằng chứng (Evidence source):** `src/auth/pilot-kpi-extended-types.ts`, `src/auth/pilot-kpi-evaluator.ts`, `src/server/pilot-launch-gate-view.ts`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — kiểu dữ liệu (types) và khối tính tồn tại trong mã và được biên dịch/kiểm thử tự động; chưa có bản đo nào từ container thật nào nên bốn chỉ số hiện là `[Chưa được xác minh]` ở cấp giá trị thực.
- **Hành động tiếp theo:** Đo bốn chỉ số đúng cách trên 5 container đầu tiên và ghi nhật ký cách thu thập để bằng chứng sau này tái lập được.

## 13. Community-to-Pro Upgrade Trigger (`[Đã có code]`)
- **Business:** Cổng kích hoạt nâng cấp rõ ràng: bản Community giữ trọn tính năng cục bộ đối soát cơ bản, và chỉ khi chủ vựa cần Cloud Vision OCR, Zalo ZNS relay, E2EE Cloud Backup hoặc GACC Registry Watch thì mới phải mua `PACKHOUSE_PRO_SAAS` hoặc `EXPORTER_ENTERPRISE`.
- **Agentic:** `SaasFeatureEntitlements` chia quyền lợi thành hai nhóm bất biến: bốn trường `localDeterministicCompliance`, `localSqliteAndManifestVerifier`, `localDataAccessGuaranteed` (và một số trường cục bộ khác) luôn `true` bất kể phiên bản; sáu trường phụ thuộc đám mây chỉ mở khi `isProOrAbove`. `downgradeToCommunity()` trả về `licenseValid: false` kèm lý do cụ thể `MALFORMED_LICENSE_KEY_GRACEFUL_DOWNGRADE`, `MISSING_LICENSE_PUBLIC_KEY_GRACEFUL_DOWNGRADE` — không tồn tại khóa bí mật dự phòng nào được hardcode trong mã.
- **Governance:** Chữ ký là `Ed25519` bắt buộc (`Ed25519 PKCS#8 signingPrivateKeyPem is required to sign a SaaS license key.`), cặp khóa tạm sinh `generateEphemeralSaasLicenseKeyPair()` không được lưu vào mã hay commit. Không có bypass `isAi`/`system` hay bất kỳ hành vi nào tự động mở khoá.
- **Bằng chứng (Evidence source):** `src/saas/saas-tier-policy.ts`, `src/saas/open-core-edition-manifest.ts`, `test/pilot-launch-gate-verifier.test.ts`
- **Trạng thái hiện tại:** `[Đã có code]` — interface, hàm ký/giải mã, uniform fail-closed downgrade đều được kiểm thử tự động; turn 3 của deep introspector xác nhận `Ed25519 unlocks PACKHOUSE_PRO_SAAS and downgrades to COMMUNITY_OPEN_CORE with localDataAccessGuaranteed=true`. Chưa có vựa nào mua giấy phép để kiểm chứng hành vi chuyển đổi thương mại, nên tỷ lệ chuyển đổi thực là `[Chưa được xác minh]`.
- **Hành động tiếp theo:** Ghi nhật ký nhu cầu của chủ vựa qua các cuộc khảo sát thực địa để biết tính năng nào thực sự là cổng kích hoạt nâng cấp, thay vì giả định từ nội bộ.

## 14. Signed Workspace Portability Funnel (`[Đã kiểm thử tổng hợp]`)
- **Business:** Một vựa có thể xuất toàn bộ dữ liệu hồ sơ của mình kèm chữ ký để chuyển sang hệ thống khác mà vẫn chứng minh được dữ liệu không bị can thiệp, đồng thời tạo ra một lối vào plug-in cho doanh nghiệp xuat khẩu họ đang dùng.
- **Agentic:** `exportWorkspacePortabilityBundle()` nén `payload` gồm thông tin tenant, `dossiersSummary`, `auditEventsDigestSha256` và hồ sơ, rồi tạo `payloadSha256` và HMAC-SHA-160. `verifyWorkspacePortabilityBundle()` từ chối khi `payloadSha256` khác `SHA-256` của payload, và tách riêng lỗi băm khỏi lỗi xác minh HMAC. Endpoint `test/open-core-25-step-blueprint-e2e.test.ts` chứng minh: bundle gốc xác minh được, bản sửa `totalDossiersCount: 1 -> 999` bị từ chối.
- **Governance:** Vận hành theo cô lập tenant hợp theo `tenantId`: vựa B yêu cầu bundle thì chỉ nhận dữ liệu thuộc về `TEN-B`, không bao giờ thấy hồ sơ `TEN-A`; test so sánh rõ ràng (`tenantId === 'TEN-B' && totalDossiersCount === 0`).
- **Bằng chứng (Evidence source):** `src/saas/workspace-portability-bundle.ts`, `test/open-core-workspace-portability.test.ts`, `test/open-core-25-step-blueprint-e2e.test.ts`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — xác minh HMAC, phát hiện bị sửa và cô lập tenant đều đạt trên cơ sở dữ liệu diễn tập. Chưa có hồ sơ thật nào được xuất bởi chủ vựa nên chưa có bằng chứng rằng họ tự mình chạy được quy trình này.
- **Hành động tiếp theo:** Chạy thử xuất/nhập 1 bộ dữ liệu mô phỏng phía ngoài máy chủ vựa sau khi `GATE-03` xác nhận cấu hình, trước khi mời khách dùng thật.

## 15. Dense Cluster GTM Playbook (`[Đang chờ điều kiện]`)
- **Business:** Chiến lược đi vào thị trường theo cụm dày đặc ở Đồng bằng sông Cửu Long (`MEKONG_DELTA_TIENGIANG_01`), mục tiêu 8 vựa + 3 doanh nghiệp xuất khẩu + 2 lab được cấp phép + 3 đầu mối lạnh + 5 bên nhập khẩu. Mật độ liên kết (`networkDensityScore`, cạnh hợp lệ / n*(n-1)) dùng để nói thay cho mức độ "hiệu ứng mạng lưới" thật thay vì chỉ đếm số tài khoản đăng ký.
- **Agentic:** Hàm `evaluateDenseClusterReadiness()` chỉ tính `expansionAuthorized` khi cả hai điều kiện `beachheadGate05Passed` và `beachheadPaidConversionConfirmed` cùng đúng — nghĩa là phải có một vựa beachhead đã vượt qua GATE-05 và đã chuyển sang trả phí. Không có đường nào để dùng chính dữ liệu mô phỏng để tự mở rộng.
- **Governance:** Ngưỡng mở rộng gắn chặt với hai chỉ số thật (gate 05 đạt + chuyển đổi trả phí được xác nhận). Hiện tại chưa có beachhead trả phí nào nên mọi tính toán cluster chỉ là mô hình.
- **Bằng chứng (Evidence source):** `src/sharing/dense-cluster-readiness.ts`, `docs/pilot-readiness/05_DENSE_CLUSTER_GTM_PLAYBOOK.md`, `test/dense-cluster-gtm.test.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — mục tiêu cụm và hàm tính điểm mật độ được kiểm thử; chưa có tổ chức thật nào đạt `beachheadPaidConversionConfirmed`, do đó `clusterTargetsMet = false` ở thực tế và `[Chưa được xác minh]` về mọi hiệu ứng mạng lưới.
- **Hành động tiếp theo:** Sau khi vựa đầu tiên trả phí, ghi đủ một tháng dữ liệu verified containers để tính lại `networkDensityScore` thay vì ước tính.

## 16. North Star & Funnel Metrics (`[Chưa được xác minh]`)
- **Business:** Không theo dõi mỗi ARR: hệ chỉ số North Star gồm Verified GMV (chỉ tính giao dịch có evidence), Revenue per Verified Container, Gross Profit per Container, CAC Payback mục tiêu dưới 12 tháng, và mật độ mạng giữa các tổ chức. Giai đoạn đầu công ty báo cáo 4 chỉ số giá trị thực địa làm chỉ số điều hướng hàng ngày.
- **Agentic:** Khung định nghĩa Verified GMV, Revenue per Verified Container, Gross Profit per Container, CAC Payback, Network Density đã được code vào kiểu dữ liệu KPI; nhưng chưa có một giao dịch thật, do đó chưa có giá trị nào của các chỉ số này được phép công bố. Phép kiểm tra vi mô `containerGrossMarginPct` 94,67% (150.000 VND giá / 8.000 VND COGS biến đổi) nằm trong `open-core-deep-introspector.ts` là phép kiểm tra tính mô hình, không phải số đo khách hàng.
- **Governance:** Không có khách hàng trả tiền, không có doanh thu, không có retention nên `CAC`, `LTV` và margin thuê bao đều là `[Chưa được xác minh]`; không được suy ra chúng từ mô hình vi mô 150k/8k.
- **Bằng chứng (Evidence source):** `src/auth/pilot-kpi-evaluator.ts`, `src/auth/pilot-kpi-extended-types.ts`, `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/DURIOS-STRATEGY-V2.json`
- **Trạng thái hiện tại:** `[Chưa được xác minh]` — khung định nghĩa đã có; mọi giá trị đo của North Star là `[Chưa được xác minh]` cho tới khi có giao dịch/khách hàng thật để tính.
- **Hành động tiếp theo:** Sau khi container đầu tiên được xếp vào hệ thống, điền đủ các giá trị đo; nếu thấy `CAC Payback > 18 tháng` thì dừng theo tiêu chí 8.

## 17. Strategic & VC Narrative (`[Mục tiêu]`)
- **Business:** Bản tường thuật chiến lược dùng cho gọi vốn nói rõ điểm khác biệt của Verified Durian Trade Network: dựa trên bằng chứng đối soát hồ sơ và audit trail chứ không chỉ trên niềm tin vào hồ sơ giấy.
- **Agentic:** Kiến trúc hệ thống đi kèm tường thuật: 4 tầng sản phẩm (Container Truth Engine, Verified Organization Network, Closed Transaction Network, Transaction Rails) là điều kiện để đánh giá vòng gọi vốn hợp lý.
- **Governance:** Toàn bộ chương V2 (vision, prd, architecture, change-report, econormics, backlog) là `DRAFT_FOR_FOUNDER_REVIEW`; căn cứ hiện hành được phê duyệt ngày 2026-10-14 là `PRODUCT-PRD-V1.md` + `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md`. Không được dùng tài liệu V2 như đã duyệt để tường thuật ngoài.
- **Bằng chứng (Evidence source):** `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`, `docs/product-direction/PRODUCT-VISION-V2.md`, `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md`
- **Trạng thái hiện tại:** `[Mục tiêu]` — bản tường thuật đã được viết nhưng toàn bộ vẫn trong trạng thái dự thảo chờ phê duyệt; không có dữ liệu thực địa trong story nên chưa thể dùng cho gọi vốn nghiêm túc.
- **Hành động tiếp theo:** Chỉ nâng tài liệu V2 lên `APPROVED_BASELINE` sau khi Founder phê duyệt bộ tài liệu; đồng thời hoàn thành bằng chứng thực địa trước khi gọi vốn.

## 18. Dual-License IP, Rate Limiting & Hygiene (`[Đã kiểm thử tổng hợp]`)
- **Business:** Quyền sở hữu trí tuệ được bảo vệ bằng ba lớp: giấy phép nguồn mở cho cộng đồng, giấy phép thương mại ký số cho khách trả tiền, và kiểm soát truy cập hệ thống (rate limit theo tenant để một tenant không làm nghẽn tenant khác).
- **Agentic:** `TenantRateLimitPolicy` mặc định 30 yêu cầu mỗi 60 giây cho upload, thực thi `assertTenantRateLimit` chặn tenant vi phạm; hygienic rules của turn 2 kiểm tra các tệp dual-license, trademark policy, và `.gitignore` chặn `*.db`, `*.env` (7/7 governance files present, ghi nhận trong evidence turn 2 `Public GitHub Governance & Secret Hygiene`).
- **Governance:** không có bí mật trong mã — CLI chặn tham số `--password` và yêu cầu biến môi trường `chmod 0600`; runbook xác minh `stat` không có secret trong Git hoặc log.
- **Bằng chứng (Evidence source):** `src/server/tenant-rate-limiter.ts`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`, `test/tenant-rate-limiter.test.ts`, `test/audit-integrity.test.ts`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — turn 2 của deep audit báo PASS (`7/7 governance files present & .gitignore blocks .db/.env`), rate limiter kiểm thử đạt; vận hành thật tại vựa chưa kiểm chứng nên các mức rate limit chưa được hiệu chỉnh theo thực tế.
- **Hành động tiếp theo:** Hiệu chỉnh rate limit dựa trên phép đo thực tế của 1 vựa (số request tối đa một ca làm việc) trước khi mở cho 8 vựa đồng thời.

## 19. On-Premise Resilience & Backup Runbook (`[Đã kiểm thử tổng hợp]`)
- **Business:** Khả năng chịu đựng của một vựa tự bảo vệ dữ liệu khi mất máy chủ: `GATE-03` yêu cầu bind loopback `127.0.0.1` (`DURIOS_HOST`) phía sau reverse proxy HTTPS nội bộ, `NODE_ENV=production` để cookie có `HttpOnly; SameSite=Strict; Secure`, mã hóa toàn bộ ổ đĩa (FileVault/LUKS) và mỗi bản sao lưu được đóng gói + mã hóa đối xứng trước khi rời thư mục máy chủ (RPO <= 1 ca làm việc, RTO <= 15 phút).
- **Agentic:** `GATE-04` không chấp nhận "thư mục tồn tại" — `verifySiteBackup()` kiểm tra 100% blob khớp SHA-256 rồi mới trả `valid: true`, vì vậy một bản backup hỏng không vượt được cổng; `test/pilot-launch-gate-verifier.test.ts` gọi `createSiteBackup()` để tạo thư mục backup hợp lệ cho diễn tập staging.
- **Governance:** Runbook quy định các việc cấm: không mở port công khai ra Internet, không tin header/query định danh từ client, không nhận secret qua dòng lệnh, không lưu secret trong Git.
- **Bằng chứng (Evidence source):** `src/verification/hitl-service.ts`, `src/storage/sqlite-audit-ledger.ts`, `src/auth/pilot-launch-gate-verifier.ts`, `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — runbook phát hành 2026-10-14 và kiểm thử tự động chứng minh `GATE-03` (`SECURITY_CONFIG_INCOMPLETE` khi không đủ) và `GATE-04` (`PENDING_VERIFIED_BACKUP` khi chưa có backup hợp lệ) hoạt động fail-closed trên staging; tất cả vẫn là kiểm thử trên máy diễn tập, chưa được lắp đặt tại chỗ ở vựa Cai Lậy.
- **Hành động tiếp theo:** Lắp Mini PC on-premise tại vựa, thực hiện diễn tập phục hồi SQLite thật từ ổ sao lưu mã hóa và đo thời gian phục hồi để đối chiếu với ngưỡng dưới 10 phút.

## 20. Competitive & Regional Benchmarks (`[Đã có code]`)
- **Business:** Đối thủ cạnh tranh chính là hệ thống truy xuất nguồn gốc bằng mã QR (chỉ tra được nguồn gốc, không đối soát được số liệu GACC) và phần mềm cũ chỉ xuất PDF; điểm khác biệt của DuriOS là đối soát toàn bộ chứng từ và cấp phép cho bên thứ ba kiểm tra chéo. Thị trường 2024: Trung Quốc nhập 6,99 tỷ USD sầu riêng, Thái Lan chiếm 57% thị phần nhập khẩu từ Trung Quốc; Malaysia có 52 cơ sở đóng gói được cấp phép cho sầu riêng tươi (2025).
- **Agentic:** `ASEAN_CORRIDOR_REGISTRY` định nghĩa bốn hành lang giao dịch (`VN_CN`, `MY_CN`, `TH_CN`, `PH_CN`) kèm thông số protocol tương ứng (nghị định thư sầu riêng tươi Malaysia-Trung Quốc 2024); kiểm thử `test/asean-corridor-and-verified-profile.test.ts` khẳng định cả bốn mục đều có mặt.
- **Governance:** Mở rộng ASEAN vẫn là `[Đang chờ điều kiện]` về kinh doanh: hành lang tồn tại ở cấp mã nhưng không có thị trường nào đã vào (không khách hàng Malaysia/Thái Lan/Philippines). Con số benchmark 52 cơ sở/57% thị phần là nguồn ngoài, được trích dẫn chứ không được kiểm chứng trong kho mã.
- **Bằng chứng (Evidence source):** `src/rules/asean-corridor-adapters.ts`, `test/asean-corridor-and-verified-profile.test.ts`, `docs/product-direction/DURIOS-STRATEGY-V2.json`
- **Trạng thái hiện tại:** `[Đã có code]` — registry hành lang và kiểm thử tự động tồn tại; các mục tiêu thị trường ASEAN là `[Mục tiêu]`/`[Chưa được xác minh]` cho tới khi có kế hoạch vào thị trường thực sự.
- **Hành động tiếp theo:** Chỉ nghiên cứu sâu hành lang thứ hai khi tiêu chí 9 (Model Non-Portability) được đánh giá — nếu phải viết lại toàn bộ mã thì kiến trúc khu vực bị coi là thất bại.

## 21. Evidence-Backed Audit Data Room (`[Đã kiểm thử tổng hợp]`)
- **Business:** Mọi hành động trong hệ thống đều ghi vào sổ cái bất biến (`audit_events`) để kiểm toán viên, đối tác Logistics hay bên mua nước ngoài có thể kiểm chứng ai đã làm gì và khi nào, mà không phụ thuộc vào lời khai.
- **Agentic:** `SqliteAuditLedger` tạo chuỗi băm SHA-256: mỗi hành động ghi `previousHash` lấy từ hash của hành động trước đó (mặc định `GENESIS_HASH`), rồi tính `eventHash`; bất kỳ can thiệp nào vào hàng cũ sẽ làm vỡ chuỗi. Kiểm thử `test/audit-integrity.test.ts` và `test/sqlite-sharing-and-evidence-5a3.test.ts` xác minh tính liên tục.
- **Governance:** Data room chỉ nhận bằng chứng gắn với danh tính `AuthenticatedActor` — mỗi sự kiện có actor name, role, tenant, dấu thời gian. Ghi chú thủ công (edits by human) được phân biệt với xác nhận tự động.
- **Bằng chứng (Evidence source):** `src/storage/sqlite-audit-ledger.ts`, `src/verification/hitl-service.ts`, `test/audit-integrity.test.ts`, `test/sqlite-sharing-and-evidence-5a3.test.ts`
- **Trạng thái hiện tại:** `[Đã kiểm thử tổng hợp]` — chuỗi băm được kiểm thử tự động và dùng trong báo cáo kiểm toán viên; chưa có sự kiện thật nào (do chưa nạp dữ liệu thật) nên data room hiện chứa bằng chứng kỹ thuật, chưa phải bằng chứng thực địa.
- **Hành động tiếp theo:** Sau GATE-01, thử quét 5 sự kiện thật để xác nhận chuỗi băm vẫn liên tục khi có actor tham gia thao tác.

## 22. Quarterly OKRs (`[Đã có code]`)
- **Business:** Bốn quý mục tiêu được ghi trong `.mekong/company.json`: Q4/2026 hoàn tất xác minh launch gate bằng bằng chứng thật (GATE-01 ký DPA theo Luật 91/2025/QH15, GATE-02 OTP thật qua Zalo ZNS/SMS Brandname, GATE-03/04 giữ nguyên trạng thái đã kiểm thử staging, GATE-05 diễn tập 5 container mô phỏng); Q1/2027 đo bốn chỉ số giá trị và kiểm tra giả thuyết giá; Q2-Q4/2027 xây cụm liên kết dày đặc và đo CAC/LTV/margin thuê bao từ khách hàng thật; 2028+ đánh giá mảng Marketplace, tài chính thương mại và mở rộng ASEAN. AI không được tự phê duyệt xuất khẩu.
- **Agentic:** Mỗi OKR gắn với một kiểm thử hoặc bằng chứng đo được cụ thể (`blueprint-refresh`, `blueprint:verify-25-steps`, `pilot:audit-pack`) nên tiến độ được kiểm chứng được bằng câu lệnh, không chỉ bằng báo cáo chữ.
- **Governance:** Mỗi OKR ghi rõ điều kiện chặn và phụ thuộc CSS `stage=zero`; không được phê duyệt mục tiêu tiếp theo khi mục tiêu trước chưa đạt bằng chứng.
- **Bằng chứng (Evidence source):** `.mekong/company.json`, `plans/company-blueprint/tasks.md`, `src/server/pilot-kpi-evaluator.ts`
- **Trạng thái hiện tại:** `[Đã có code]` — danh sách OKR và next_steps được kiểm thử qua `test/pilot-rehearsal-seeder.test.ts` (`stage` = `zero`, `next_steps` có đúng 5 mục) và khối e2e xác nhận `open_core_manifest_api.endpoints` chứa `GET /api/v1/open-core/edition-manifest`. Bản thân các mốc Q4/2026 chưa đạt (GATE-01, GATE-02 đang chờ) nên tiến độ thực tế là `[Đang chờ điều kiện]` ở nhiều mục.
- **Hành động tiếp theo:** Định kỳ quét lại 25 bước bằng `bun run blueprint:verify-25-steps --deep` để bắt vỡ nếu có file vượt 100 dòng, xuất hiện `any`, hoặc turn Socratic nào hỏng.

## 23. Dual-Lock Marketplace & Zero-Custody Governance (`[Đang chờ điều kiện]`)
- **Business:** Sàn B2B và escrow của DuriOS bị chặn bởi hai khóa đồng thời, không phải một. Hệ thống giữ nguyên mô hình Zero-Custody — không giữ tiền của khách hàng. Nếu chỉ bật một trong hai khóa, hệ thống vẫn từ chối mở.
- **Agentic:** `isMarketplaceFeatureUnlocked()` chỉ trả `true` khi `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` **và** `goForLiveCustomerData === true` (strict comparison); `assertMarketplaceFeatureUnlocked()` ném `MarketplaceGuardError` 403 với mã `FEATURE_LOCKED_PENDING_PILOT_SIGN_OFF` hoặc `PILOT_GATES_INCOMPLETE` — không có đường tắt. `goForLiveCustomerData` chỉ đạt đúng khi cả 5 cổng `GATE-01..GATE-05` đã đạt.
- **Governance:** Chặn tuân thủ pháp lý theo Nghị định `52/2024/NĐ-CP` (Zero-Custody) và Luật Thương mại điện tử `122/2025/QH15`; test `test/marketplace-escrow-guard.test.ts` xác nhận hành vi Dual-Lock. Không được bật marketplace trước khi có ít nhất một vựa trả phí.
- **Bằng chứng (Evidence source):** `src/marketplace/marketplace-guard.ts`, `test/marketplace-escrow-guard.test.ts`, `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — mã khóa kép và kiểm thử tồn tại; mọi hướng marketplace đều bị chặn cho đến khi đạt 5/5 gates (tức hiện tại `goForLiveCustomerData = false`) và ít nhất 3 vựa trả phí. Chưa có giao dịch lặp lại nào nên tiêu chí dừng số 6 (No Repeat Trades) chưa được đánh giá.
- **Hành động tiếp theo:** Đánh giá lại điều kiện mở marketplace (cùng tài chính thương mại và ASEAN) trong kỳ 2028+; nếu nới cổng cần nhất trí Founder và pháp lý.

## 24. Personal Data Protection & Statutory Disclaimers (`[Đang chờ điều kiện]`)
- **Business:** DuriOS không chứng nhận, không thay thế cơ quan Hải quan/GACC, không cam kết thông quan; cũng không xác minh chứng nhận hữu cơ (`EVIDENCE_STORED_NOT_CERTIFIED`). Chủ sở hữu dữ liệu nông hộ, giá mua và biên lợi nhuận vẫn là vựa.
- **Agentic:** Không có quyền nào trong RBAC cho phép rò rỉ dữ liệu nhạy cảm ra ngoài `ShareAccessGrant`; dữ liệu được mã hóa toàn bộ ổ đĩa và mọi bản sao lưu được mã hóa riêng trước khi rời máy chủ. Trình duyệt HITL xác nhận từng trường bởi con người trước khi có cờ `HUMAN_VERIFIED`.
- **Governance:** Tuân thủ Luật bảo vệ dữ liệu cá nhân `91/2025/QH15` (đi kèm DPA theo mẫu trong `04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`) và Luật thương mại điện tử `122/2025/QH15`; ranh giới an toàn bắt buộc của `DECISION-01-CAI-LAY-SITE-SELECTION.md` cấm nạp dữ liệu khách hàng thật trước khi 5/5 cổng được kiểm toán viên ký.
- **Bằng chứng (Evidence source):** `src/auth/pilot-launch-gate-verifier.ts`, `src/verification/hitl-service.ts`, `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — văn bản pháp lý, điều khoản disclaimer, cơ chế fail-closed và DPA mẫu đều đã chuẩn bị sẵn; biên bản DPA thật chưa được chủ vựa ký (GATE-01 đang `PENDING_SITE_AND_CONSENT_SIGN_OFF`) nên bất kỳ luận điểm nào về tuân thủ thực tế vẫn là `[Chưa được xác minh]`.
- **Hành động tiếp theo:** Ký DPA với chủ vựa Cai Lậy, xác minh tài liệu đặt quyền `chmod 0600`, và chạy `pilot:audit-pack -- --verify` để có chữ ký kiểm toán viên trước khi đưa bất kỳ dữ liệu thật nào vào hệ thống.

## 25. 9 Hard Kill Criteria & Incident Playbook (`[Đang chờ điều kiện]`)
- **Business:** Chín tiêu chí dừng nghiêm ngặt đã được viết đầy đủ trong `VALIDATION-AND-ECONOMICS-V2.md` (phần 3) để tránh rơi vào bẫy hy vọng: (1) WTP Failure — vựa không chịu trả tiền sau pilot dù đạt KPI; (2) Workflow Rejection — đạt 5 phút nhưng nhân viên vẫn dùng Excel/Zalo làm sự thật; (3) Exception Detection Failure — không bắt được 100% lỗi gài; (4) Privacy Sharing Refusal — vựa không chia sẻ bất kỳ trường nào; (5) Buyer Indifference — người mua không ưu tiên chọn vựa có hồ sơ DuriOS Verified; (6) No Repeat Trades — không có giao dịch lặp lại; (7) Subsidy Dependency — mạng lưới chỉ chạy khi nền tảng bỏ tiền trợ giá; (8) High CAC Payback — thời gian hoàn vốn trên 18 tháng; (9) Model Non-Portability — sang Malaysia phải viết lại toàn bộ mã.
- **Agentic:** Bộ công cụ sẵn sàng cho sự cố: `field-auditor-cli.ts` đóng gói bằng chứng theo 5 cổng; `pilot-launch-gate-verifier.ts` đánh giá từng cổng fail-closed; `blueprint-cli.ts` chạy deep audit với 15 lượt Sokratic và trần 100 dòng để không để kiến trúc trượt khỏi tầm kiểm soát.
- **Governance:** Khi một trong chín tiêu chí xuất hiện, hành động được áp dụng ngay: dừng mở rộng bán hàng (1, 8), sửa rule engine trước khi tuyên bố kiểm định (3), quay lại local tool (4), rút lui khỏi ý định mở sàn B2B (6), không gọi là hiệu ứng mạng (7), cấu trúc lại Country Adapter (9). Không được dùng tiêu chí nào để tuyên bố chiến thắng khi chưa có dữ liệu.
- **Bằng chứng (Evidence source):** `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/STRATEGY-V2-BACKLOG.md`, `src/auth/pilot-launch-gate-verifier.ts`, `src/export/field-auditor-cli.ts`
- **Trạng thái hiện tại:** `[Đang chờ điều kiện]` — chín tiêu chí đã được viết; chưa đủ dữ liệu thực địa để phán quyết **bất kỳ** tiêu chí nào (chưa có khách hàng trả tiền, chưa đo được CAC/LTV, chưa có giao dịch lặp lại, chưa thử WhatsApp nước thứ hai).
- **Hành động tiếp theo:** Ghi lại sự kiện nghi phạm ngay khi diễn tập thực địa đầu tiên đủ 5 cổng; duy trì danh sách 9 tiêu chí trên bảng điều hành để tránh việc vượt quá chu kỳ 1 cổng mà không đối chiếu.

---

**Bằng chứng đồng bộ:** Lệnh `bun run blueprint:verify-25-steps` báo 25/25 xác nhận độ phủ artifact. Lệnh `bun run blueprint:verify-25-steps --deep` kiểm tra kỹ hơn và báo: trần `maxSrcLoc=100` và `maxTestLoc=100` (toàn kho `src/` và `test/`), `anyTypeViolationsCount=0`, 15/15 lượt Socratic turn đạt, và phép kiểm tra kinh tế `containerGrossMarginPct` 94,67% (với mô hình giá 150.000 VND/container và COGS biến đổi 8.000 VND/container). Các con số trên là bằng chứng kỹ thuật về kiểm soát chất lượng mã và mô hình kinh tế, không phải bằng chứng thực địa hoặc thương mại — chúng không chứng minh có khách hàng, có doanh thu hay có thị trường. Trạng thái thực thi nằm ở nhãn trạng thái của từng bước trong tệp này, và `tasks.md` cập nhật các mốc thực thi chi tiết.

---

### Trạng thái 5 Cổng Khai Trương Tính Đến 2026-10-22

Bảng dưới đây dùng câu chữ tóm tắt (không dùng bảng markdown) để tránh làm sai lệch hợp đồng kiểm thử, và phản ánh đúng những gì `src/auth/pilot-launch-gate-verifier.ts` hiện báo.

- **GATE-01 — Tiếp cận vựa & chấp thuận dữ liệu (Luật DSCN `91/2025/QH15`):** `PENDING_SITE_AND_CONSENT_SIGN_OFF`. Điều kiện cần là biên bản chấp thuận xử lý dữ liệu đã ký tồn tại tại đường dẫn `DURIOS_GATE01_CONSENT_FILE`. Hiện chưa có tệp này, nên cổng chưa đạt và nghiêm cấm nạp dữ liệu khách hàng thật.
- **GATE-02 — Kênh OTP thật (Zalo ZNS / SMS):** `PENDING_PROVIDER_CREDENTIALS`. Điều kiện cần là nhà cung cấp OTP khởi tạo từ môi trường có `isConfigured = true`. Hiện hệ thống ở chế độ fail-closed (`UnconfiguredOtpProvider` trả `503`) và cần nạp `DURIOS_OTP_PROVIDER` cùng khóa API trên staging.
- **GATE-03 — Bảo mật On-Prem, loopback `127.0.0.1` & toàn vẹn sổ cái:** `SECURITY_CONFIG_INCOMPLETE` nếu thiếu một trong hai điều kiện. Cổng chỉ đạt khi `DURIOS_HOST` là loopback hợp lệ **và** chuỗi băm kiểm toán hợp lệ. Runbook và cấu hình mẫu đã được soát và kiểm thử tổng hợp trên staging; bản thân việc lắp đặt tại vựa chưa thực hiện.
- **GATE-04 — Chứng minh sao lưu & khôi phục:** `PENDING_VERIFIED_BACKUP` nếu chưa có thư mục sao lưu hợp lệ. Điều kiện cần là `DURIOS_BACKUP_DIR` tồn tại và `verifySiteBackup()` trả `valid: true` (100% blob khớp SHA-256). Mức VERIFIED này chỉ đạt trong **các bài kiểm thử staging** có thư mục sao lưu dựng sẵn; chưa có bản kiểm chứng từ ổ sao lưu mã hóa lắp đặt thật tại vựa.
- **GATE-05 — Diễn tập 5 container & bắt 100% lỗi gài mù:** `REHEARSAL_INCOMPLETE` nếu chưa đạt. Điều kiện cần là ít nhất 5 hồ sơ trong cơ sở dữ liệu, trung bình số học dưới 300 giây, và ít nhất 2 lỗi gài mù bị phát hiện toàn bộ. Kết quả hiện tại chỉ được chứng minh trên **bộ dữ liệu diễn tập tổng hợp (seeded rehearsal)**: `src/auth/pilot-rehearsal-seeder.ts` tạo 5 hồ sơ cho tenant `TENANT-CAILAY-PILOT-01`, `test/pilot-rehearsal-seeder.test.ts` xác nhận `meanDeltaSeconds` dưới 300 giây, `blindFaultCount = 2`, `blindFaultsCaught = 2`, `zeroMissGate = true` và `gate05Passed = true`. Đây chưa phải diễn tập thực địa với dữ liệu thật.

Biến `goForLiveCustomerData` chỉ là `true` khi cả 5 cổng đồng thời đạt, tham chiếu `src/marketplace/marketplace-guard.ts` dòng 28 và mục "Ranh giới an toàn bắt buộc" trong `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`. Hiện chưa đạt cổng nào trong số `GATE-01` và `GATE-02`, nên biến này đang là `false` và việc nạp dữ liệu khách hàng thật bị nghiêm cấm về mặt quy trình.

### Giả Thuyết Giá và Cách Báo Cáo Doanh Thu

Ba mức giá được giữ nguyên là giả thuyết cần kiểm chứng thực địa theo quyết định của Founder ghi trong `docs/product-direction/PRODUCT-PRD-V1.md` (phê duyệt 2026-10-14), gồm: gói pilot trả phí 5.000.000 VND cho 5 container thực tế, thuê bao hàng năm 60.000.000 VND cho mỗi vựa, và phí cài đặt một lần 10.000.000 VND cho mỗi vựa. Không được trích dẫn các mức này dưới dạng "giá đã duyệt cố định" trong giao tiếp khách hàng hay tài liệu ngoài, bởi chính PRD-V1 khẳng định chúng chỉ là giả thuyết cần kiểm chứng tại thực địa.

Nguyên tắc kế toán doanh thu: doanh thu một lần (phí pilot 5.000.000 VND và phí thiết lập 10.000.000 VND) phải được báo cáo **tách biệt hoàn toàn** khỏi ARR; ARR chỉ gồm doanh thu thuê bao định kỳ đang hoạt động. Việc cộng phí một lần vào ARR sẽ vượt trần 281 vựa một cách giả tạo và phá vỡ bài toán `657.643 USD` đã được kiểm chứng bằng số học.

### Kịch Bản Bear / Base / Bull (tuyển tập giả thuyết, chưa kiểm chứng)

Ba kịch bản được công bố cùng nhau để tránh tự lừa mình bằng một con số duy nhất và để biết chính xác điều kiện dừng. Mỗi kịch bản phải mang đồng thời các hạng mục chi phí: chi phí triển khai (deployment/setup effort), chi phí hỗ trợ (support), chi phí phần cứng (Mini PC on-premise cộng ổ sao lưu mã hóa, ngân sách staging ước tính 3–5 triệu VND đã được Founder chấp thuận theo `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md` quyết định 3), và chi phí OTP/OCR (tài khoản Zalo ZNS / SMS Brandname cộng Cloud Vision OCR). Mọi con số dưới đây đều ở nhãn giả thuyết và chưa có một khách hàng thật nào để hiệu chỉnh.

- **Kịch bản Bear — 3 vựa đạt (toàn bộ `giả thuyết`):** ARR thuê bao 3 x 60.000.000 VND = 180.000.000 VND, xấp xỉ 7.021 USD theo tỷ giá 25.637 (180.000.000 / 25.637 = 7.021,1). Doanh thu một lần 0 VND nếu áp dụng chính sách miễn phí thiết lập để chốt vựa đầu tiên. Chi phí triển khai, chi phí hỗ trợ, chi phí phần cứng và chi phí OTP/OCR đều là `giả thuyết` — chưa có đơn giá thực tế vì chưa có lần triển khai thật nào được ghi chép. Trong kịch bản Bear, dòng tiền `giả thuyết` vẫn chưa thể kết luận dương hay âm do thiếu dữ liệu chi phí.
- **Kịch bản Base — 10 vựa đạt (toàn bộ `giả thuyết`):** ARR thuê bao 10 x 60.000.000 VND = 600.000.000 VND, xấp xỉ 23.404 USD (600.000.000 / 25.637 = 23.403,7). Doanh thu một lần 100.000.000 VND, xấp xỉ 3.901 USD (100.000.000 / 25.637 = 3.900,6), nếu thu phí thiết lập 10.000.000 VND cho 10 vựa. Các hạng mục chi phí vẫn là `giả thuyết`, trong đó phần cứng lấy mốc 3–5 triệu VND mỗi vựa làm ngân sách dự phòng. Dòng tiền `giả thuyết` vẫn chưa đủ dữ liệu để kết luận.
- **Kịch bản Bull — 40 vựa đạt (toàn bộ `giả thuyết`):** ARR thuê bao 40 x 60.000.000 VND = 2.400.000.000 VND, xấp xỉ 93.615 USD (2.400.000.000 / 25.637 = 93.614,7). Doanh thu một lần 400.000.000 VND, xấp xỉ 15.602 USD (400.000.000 / 25.637 = 15.602,4). Các hạng mục chi phí vẫn là `giả thuyết`. Dù dương, mức ARR này vẫn chỉ bằng 9,36% mục tiêu 1.000.000 USD (93.615 / 1.000.000), nghĩa là ngay trong kịch bản Bull, SaaS thuần túy vẫn không chạm được mục tiêu và phải dựa vào Multi-Revenue Stack hoặc mở rộng khu vực.

Cách đọc ba kịch bản: Bear, Base và Bull khác nhau ở tỷ lệ đạt được (3, 10, 40 vựa) và ở chính sách có thu phí thiết lập hay không. Các con số là giả định hoạch định, không phải dự báo, và không được dùng để tuyên bố tiến độ ra bên ngoài. Ngưỡng chi phí hỗ trợ vận hành dùng làm tiêu chí chuyển giai đoạn không phải là ngân sách đã duyệt mà là ràng buộc so sánh: chi phí hỗ trợ vận hành phải dưới 15% doanh thu thuê bao.

---

### Chỉ Số Giá Trị Thực Địa Phải Đo (chưa có số liệu)

Bốn chỉ số dưới đây là điều kiện để nói "DuriOS tạo ra giá trị" mà không phải tuyên bố marketing. Kiểu dữ liệu và khối tính đã có trong `src/auth/pilot-kpi-extended-types.ts`, và `src/auth/pilot-launch-gate-verifier.ts` đọc các chỉ số này từ dữ liệu workspace; tuy nhiên hiện chưa có một bản đo nào từ container thật nên cả bốn chỉ số đều ở trạng thái `[Chưa được xác minh]` ở cấp giá trị.

- **`minutesSavedPerContainer` — số phút tiết kiệm được mỗi container:** so sánh thời gian xử lý thủ công (ghi chép thực địa khoảng 30–45 phút/container) với thời gian xử lý trên DuriOS. Phép đo chỉ có nghĩa khi cùng một bộ chứng từ, cùng một người thao tác, đo cả hai lần.
- **`humanTouchesPerContainer` — số lần nhân viên phải gõ phím hoặc can thiệp chỉnh sửa dữ liệu trên một container:** đếm qua sổ cái kiểm toán, không hỏi cảm nhận; chỉ số này đo chi phí lao động ẩn của việc nhập liệu tay.
- **`exceptionsDiscoveredPerContainer` — số ngoại lệ bất thường được phát hiện trước khi đóng hàng:** gồm lỗi mã container (ISO 6346), lỗi số seal, và chứng từ quá hạn kiểm nghiệm. Đây là chỉ số liên quan trực tiếp tới tiêu chí dừng số 3.
- **`expectedLossAvoidedVnd` — thiệt hại tài chính dự phòng ngăn chặn được:** ước tính dải 20.000.000–50.000.000 VND mỗi container nếu sai số seal tại cửa khẩu, dùng để trình bày giá trị cho chủ vựn. Đây là giả định mô hình, không phải số đã thu, và không được cộng vào doanh thu hay báo cáo tài chính.

Cách thu thập: đo ngay trên container đầu tiên, cùng một ca làm việc, ghi cả nhật ký thời gian thô lẫn kết quả cuối, để kiểm toán viên tái lập được phép đo. Không được thay trung bình số học bằng trung vị, và không được lược các ca chậm.

### Những Gì Kho Mã Không Chứng Minh Được

Danh sách dưới đây được ghi rõ để tránh hiểu nhầm khi đọc tệp này. Không có một dòng nào trong kho mã chứng minh được những mục sau, vì vậy mọi tuyên bố về chúng đều là `[Chưa được xác minh]`: đã có hợp đồng được ký, đã có doanh thu, đã có khách hàng trả tiền, đã có dữ liệu retention, đã đo được CAC, đã đo được LTV, đã đo được biên lợi nhuận trên thuê bao, đã có giao dịch lặp lại trên mạng lưới, đã có nhà nhập khẩu nước ngoài tự kiểm chứng hồ sơ, và đã có lần triển khai thật nào được ghi chép tại vựa Cai Lậy.

Riêng phép kiểm tra vi mô trong `src/saas/open-core-deep-introspector.ts` — giá 150.000 VND mỗi container đối lại COGS biến đổi 8.000 VND mỗi container, cho `containerGrossMarginPct` 94,67% — là phép kiểm tra **mô hình kinh tế** (ngưỡng chấp nhận >= 80%). Nó không được phép dùng làm bằng chứng cho biên lợi nhuận thật, cho CAC, cho LTV hay cho dòng tiền của bất kỳ kịch bản Bear/Base/Bull nào ở trên.

### Ranh Giới Bị Chặn Hay Có Điều Kiện (giữ nguyên `[Đang chờ điều kiện]`)

Bốn hướng dưới đây có mã trong kho nhưng bị chặn bởi điều kiện tiên quyết rõ ràng, và phải luôn được trình bày kèm điều kiện đó.

- **B2B marketplace và escrow:** bị khóa kép bởi `DURIOS_FEATURE_B2B_MARKETPLACE === "enabled"` **và** `goForLiveCustomerData === true`, đồng thời giữ nguyên nguyên tắc Zero-Custody theo Nghị định `52/2024/NĐ-CP` và Luật Thương mại điện tử `122/2025/QH15`. Vì `goForLiveCustomerData` yêu cầu 5/5 cổng và hiện `GATE-01` chưa đạt, hướng này đang đóng hoàn toàn.
- **AI tự phê duyệt xuất khẩu:** **nghiêm cấm**. Quyền cuối cùng thuộc về con người qua `src/verification/hitl-service.ts` (mỗi lần xác minh đều yêu cầu `AuthenticatedActor` và ghi tên người ký) và `src/auth/rbac-persona-assertions.ts` (chỉ vai trò `CLERK`, `MANAGER`, `ADMIN` trong tenant `PACKHOUSE_EXPORTER` mới được thực hiện thao tác; persona Packhouse Manager giữ quyền phê duyệt). Không tồn tại đường vòng qua vai trò hệ thống.
- **Mở rộng ASEAN (`MY_CN`, `TH_CN`, `PH_CN`):** các bộ điều hợp hành lang chỉ tồn tại ở cấp mã trong `src/rules/asean-corridor-adapters.ts`, không có thị trường nào đã được vào. Mọi tuyên bố về tốc độ mở rộng khu vực là `[Mục tiêu]`. Nếu bước sang nước thứ hai bắt buộc viết lại toàn bộ mã, tiêu chí dừng số 9 sẽ kích hoạt.
- **Tầng doanh thu 6 — chứng thực hồ sơ tài chính thương mại và bảo hiểm hàng hải:** mã đang được xây dựng ở `src/saas/financial-attestation-codec.ts`, `src/saas/financial-attestation-service.ts`, `src/saas/financial-attestation-token.ts`, `src/server/financial-verification-context.ts`, `src/server/financial-verification-handler.ts`, `src/server/financial-verification-request.ts`, `src/server/financial-verification-view.ts`. Hướng này chưa có pilot trả phí nào, nên xem kế hoạch chi tiết tại `plans/261021-1821-financial-verification-room/` và đối chiếu với hàng rào trung thực trong `tasks.md` trước khi trình bày là một nguồn doanh thu.

### Phạm Vi Tài Liệu V1 và V2

Hai bộ tài liệu có trạng thái khác nhau và không được dùng lẫn. `docs/product-direction/PRODUCT-PRD-V1.md` và `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (đều phát hành 2026-10-13) là **căn cứ đã phê duyệt**, có trạng thái `APPROVED — Founder approval, 2026-10-14`, và tiếp tục là căn cứ vận hành duy nhất. Các tài liệu V2 ký hiệu đều ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW`: `PRODUCT-PRD-V2.md`, `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`, `PRODUCT-VISION-V2.md`, `STRATEGY-V2-BACKLOG.md`, `STRATEGY-V2-CHANGE-REPORT.md`, `DURIOS-STRATEGY-V2.json` (phiên bản `2.1.0-draft`) và `VALIDATION-AND-ECONOMICS-V2.md`. Chính tài liệu V2 thừa nhận điều này: `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md` dòng 6 ghi V1 là "baseline phê duyệt hiện hành", và dòng 7 ghi thứ bậc bằng chứng của chính nó là `PROPOSAL` / `DRAFT`. Do đó, khi hai bộ xung đột, V1 thắng; và mọi con số kinh tế của V2 phải mang nhãn giả thuyết.

---

### Kiểm Soát Kỹ Thuật: Trần 100 Dòng và 15 Lượt Sokratic

Kho mã tự áp các ràng buộc kỹ thuật để tránh trượt khỏi tầm kiểm soát khi Stage 0 còn có ít người làm. Mọi tệp TypeScript trong `src/` và trong `test/` đều phải ở mức 100 dòng trở xuống (`locCeiling = 100`, là hằng số không cấu hình được qua biến môi trường hay cờ dòng lệnh), và không được chứa bất kỳ kiểu `any` hay ép kiểu không an toàn nào. Các con số hiện tại được đo bởi `bun run blueprint:verify-25-steps --deep` (`src/saas/blueprint-cli.ts`, chạy `evaluateOpenCoreDeepBrainstorm()`), gồm `maxSrcLoc = 100`, `maxTestLoc = 100` và `anyTypeViolationsCount = 0`.

Bộ 15 lượt Sokratic của deep audit chia làm ba nhóm chín cột, mỗi nhóm 5 lượt, và yêu cầu **cả 15 lượt đạt** thì CLI mới cho exit code 0:

- **Nhóm 1 — Open-Core (5 lượt):** biên giới `MIT` sạch khỏi import AGPL/SaaS; vệ sinh kho công khai (dual-license, trademark policy, `.gitignore` chặn `.db`/`.env`); khóa `Ed25519` mở Pro và hạ cấp nhẹ về Community mà không khóa dữ liệu; tính đúng của kinh tế đơn vị so với trần 281 vựa (`containerGrossMarginPct` 94,67% >= 80%); đồng bộ 25 bước và cả 3 phiên bản (Community/Pro/Enterprise).
- **Nhóm 2 — Modularity (5 lượt):** trần 100 dòng áp cho `src/`; trần 100 dòng áp cho `test/`; không có `any` trên toàn bộ tệp TypeScript; hệ thống thiết kế phân cấp (`design-system/MASTER.md` cộng 4 bản ghi đè theo miền) đầy đủ; tài sản `site/public` và `queue/` đồng bộ kèm 25 ảnh xem trước PNG.
- **Nhóm 3 — UI/UX (5 lượt):** 26 bề mặt HTML (workspace gốc + 25 màn Stitch) cân bằng DOM (`openDivs === closeDivs`) và nạp đúng App Shell 44px; không có liên kết chết (`href="#"`) và bộ ủy quyền tương tác làm ẩm bảng/dữ liệu nhập; thanh Command Bar 44px gộp điều hướng và đồng bộ hai chủ đề (Emerald Ops / Daylight Field) trên mọi trang; bố cục 3 vùng cộng bộ lọc 4 bước và lối tắt upload/verify một chạm; token thiết kế 2027 với `tabular-nums`, tương phản cao, `prefers-reduced-motion`, vùng ARIA live và không có `alert()` chặn.

Điểm cần lưu ý khi đọc các con số trên: phép đo số dòng dùng `raw.split("\n").length`, tức là một tệp có đúng 100 dòng nội dung cộng ký tự xuống dòng cuối sẽ bị tính là 101. Nghĩa là trần thực tế cho nội dung là 99 dòng, và con số `maxSrcLoc = 100` cho biết các tệp hiện có 99 dòng nội dung. Đây là độ lệch off-by-one trong cách đo, không phải lỗi logic, nhưng mọi người thêm mã mới nên nhớ nó.

### Quy Trình Cập Nhật Blueprint Này

Khi một bước chuyển trạng thái (ví dụ `GATE-01` từ `PENDING_SITE_AND_CONSENT_SIGN_OFF` sang `PASS`), phải sửa ba chỗ cùng một lần: nhãn trạng thái ở cuối đoạn bước tương ứng trong tệp này, dòng `*Trạng thái thực thi:*` trong `tasks.md`, và các mục liên quan trong `.mekong/company.json` (nếu ảnh hưởng tới OKR). Sau đó chạy `bun run blueprint:verify-25-steps` để xác nhận 25/25 độ phủ chưa vỡ, và chạy `bun run blueprint:verify-25-steps --deep` để xác nhận trần 100 dòng, không có `any` và 15/15 lượt Sokratic vẫn đạt.

Nếu một bước được nâng nhãn lên `[Đã kiểm thử tổng hợp]` hoặc cao hơn, bắt buộc phải ghi thêm bằng chứng nào cụ thể làm cơ sở và bằng chứng đó có phải dữ liệu mô phỏng hay không. Không được nâng nhãn dựa trên "mã đã viết xong", vì "mã đã viết xong" là điều kiện của nhãn `[Đã có code]`, không phải điều kiện của nhãn bền vững hơn.

---

### Vai Trò Điều Hành và Ranh Giới Quyết Định

Năm vai trò điều hành được định nghĩa trong `.mekong/company.json` và mỗi vai có một ranh giới quyết định rõ ràng, tránh việc một tác nhân AI tự quyết định vượt quyền.

- **Founder / CEO:** chịu trách nhiệm về 5 cổng khai trương (`GATE-01` đến `GATE-05`), tiếp cận vựa thực địa Cai Lậy, ký DPA, quyết định điều kiện thương mại sau pilot, và phê duyệt mọi tuyên bố đối ngoại. Không một tuyên bố đối ngoại nào được phát nếu chưa qua vai trò này, đặc biệt khi nội dung liên quan tới phê duyệt V2 hoặc cam kết thương mại.
- **Product & Operations:** ghi nhận quy trình thực của vựa, cấu hình pilot, lưu bằng chứng chấp thuận, đo 4 chỉ số giá trị thực địa theo từng container, và ghi nhật ký nhu cầu và mức giá chấp nhận được. Vai trò này không được phép điền số liệu đo bằng ước tính thay cho phép đo thật.
- **Engineering & Security:** duy trì Local Core (Bun + SQLite chế độ WAL), sổ cái kiểm toán có chuỗi băm, bộ xác minh giấy phép `Ed25519`, bọc Workspace Portability, và Open-Core Edition Manifest qua `/api/v1/open-core/...`, đồng thời giữ trần 100 dòng mỗi tệp và không có `any`. Vai trò này không mở khóa thương mại và không tự nâng cấp trang thái cổng.
- **Revenue & Customer Discovery:** kiểm tra thẩm quyền chi trả (willingness-to-pay) và ba giả thuyết giá — 5.000.000 VND cho 5 container, 60.000.000 VND mỗi năm, 10.000.000 VND phí thiết lập — đồng thời phụ trách luồng plug-in qua Open-Core Portability. File `company.json` ghi rõ: **chưa có hợp đồng, doanh thu hay dữ liệu retention nào được xác minh**. Vai trò này không được báo cáo ARR có gộp doanh thu một lần.
- **Governance & Legal:** rà soát tuân thủ Luật `91/2025/QH15`, Luật `122/2025/QH15`, Nghị định `52/2024/NĐ-CP` (Zero-Custody) và chín tiêu chí dừng, đồng thời **chặn AI tự phê duyệt xuất khẩu** (HITL bắt buộc). Vai trò này có quyền chặn bất kỳ tuyên bố tuân thủ nào không có văn bản pháp lý làm căn cứ.

Ranh giới chung: AI trong hệ thống này đóng vai trò đề xuất bóc tách và phát hiện bất thường, không bao giờ đóng vai trò phê duyệt. Mọi lớp AI đều phải đi qua `HitlVerificationService` với một `AuthenticatedActor` cụ thể trước khi dữ liệu được coi là đã xác minh.

### Theo Dõi Từng Cỗng: Chuỗi Bằng Chứng Của GATE-03 và GATE-04

`GATE-03` và `GATE-04` thường bị đọc nhầm là "đã xong" vì chỉ cần cấu hình, nên cần ghi rõ điều kiện đạt và bằng chứng cụ thể.

`GATE-03` yêu cầu hai điều kiện đồng thời: (a) tên host được khai báo trong `DURIOS_HOST` phải vượt qua `assertLoopbackHostname()` (chỉ chấp nhận loopback như `127.0.0.1`), và (b) chuỗi băm kiểm toán phải hợp lệ. Nếu chỉ có một trong hai, cổng trả `SECURITY_CONFIG_INCOMPLETE`. Bằng chứng kỹ thuật là runbook `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md` (phát hành 2026-10-14), liệt kê yêu cầu lắng nghe tại `127.0.0.1:3000` sau reverse proxy HTTPS nội bộ, cookie `Secure; HttpOnly; SameSite=Strict` khi `NODE_ENV=production`, mã hóa toàn ổ (FileVault/LUKS), và kiểm soát mạng chỉ mở `443/tcp` cho subnet nội bộ. Cách xác minh ghi trong chính runbook: `lsof -i :3000` chỉ hiện một dòng `127.0.0.1:3000`, và kiểm tra header `Set-Cookie`. Các bước xác minh này đã được kiểm thử tổng hợp trên staging nhưng chưa chạy trên máy thật đặt tại vựa, nên nhãn đúng là `[Đã kiểm thử tổng hợp]` ở tầng kỹ thuật, không phải `[Đã kiểm thử thực địa]`.

`GATE-04` yêu cầu thư mục sao lưu tồn tại (`DURIOS_BACKUP_DIR`) và `verifySiteBackup()` phải trả `valid: true` với toàn bộ blob khớp SHA-256; nếu blob lệch, cổng thu chi tiết lỗi cụ thể và không đạt. Bằng chứng kỹ thuật là `test/pilot-launch-gate-verifier.test.ts` gọi `createSiteBackup()` để dựng một thư mục sao lưu hợp lệ cho diễn tập staging, và xác nhận `GATE-04` đạt trong điều kiện đó. Nhưng thư mục đó do quy trình kiểm thử tạo ra, không phải ổ sao lưu mã hóa lắp đặt thật tại vựa, nên phải ghi rõ mức VERIFIED chỉ đạt trong **các bài kiểm thử staging**.

### Cách Dùng Lệnh `pilot:audit-pack` Để Có Bằng Chứng Ký

Lệnh `bun run pilot:audit-pack -- --verify` (nối tới `src/export/field-auditor-cli.ts`) là công cụ duy nhất được phép dùng để công bố một cổng đã đạt. Nó đánh giá cả 5 cổng từ cơ sở dữ liệu được chỉ định, thư mục dữ liệu, thư mục sao lưu và biến môi trường, rồi xuất báo cáo. Điểm quan trọng là nó **không** tự nâng một cổng lên PASS dựa trên sự tồn tại của tệp: nếu `DURIOS_GATE01_CONSENT_FILE` không trỏ tới biên bản đã ký, cổng sẽ báo `PENDING_SITE_AND_CONSENT_SIGN_OFF`, và nếu nhà cung cấp OTP chưa cấu hình, cổng sẽ báo `PENDING_PROVIDER_CREDENTIALS`. Mỗi báo cáo được niêm phong bằng SHA-256 (kênh xuất của `field-auditor-cli.ts`) để kiểm toán viên ký xác nhận trên chính tệp output. Ranh giới an toàn trong `DECISION-01-CAI-LAY-SITE-SELECTION.md` yêu cầu toàn bộ 5 cổng đều phải được ký xác nhận bằng công cụ này trước khi nạp dữ liệu khách hàng thật.

---

### Mô Tả Các Hạng Mục Chi Phí Phải Báo Cáo Kèm Kịch Bản

Bốn hạng mục chi phí dưới đây phải xuất hiện cùng mỗi kịch bản Bear/Base/Bull, và cho tới khi có dữ liệu đo chúng phải để trống hoặc để nhãn `giả thuyết`.

- **Chi phí triển khai (deployment/setup effort):** thời gian kỹ thuật cài Mini PC, cấu hình SQLite WAL, dựng reverse proxy HTTPS nội bộ, tạo tài khoản, nạp chứng từ mẫu và đào tạo người dùng tại bàn cân. Chưa có đơn giá thực tế vì chưa có lần triển khai thật nào được ghi chép, nên con số phải để trống và ghi rõ là chưa có dữ liệu.
- **Chi phí hỗ trợ (support):** nỗ lực chăm sóc sau bán — xử lý lỗi nhập liệu, lỗi seal, đổi mật khẩu, xử lý sự cố cục bộ. Đây không phải ngân sách đã duyệt mà là ràng buộc so sánh: chi phí hỗ trợ vận hành phải dưới 15% doanh thu thuê bao để đủ điều kiện chuyển giai đoạn, cùng với lỗi cài đặt dưới 5%.
- **Chi phí phần cứng:** Mini PC chạy on-premise tại bàn cân của vựa, cộng ổ sao lưu mã hóa. Founder đã chấp thuận một ngân sách staging nhỏ ước tính 3–5 triệu VND cho mục này và cho đăng ký tài khoản Zalo ZNS, theo Quyết định 3 trong `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md`. Đây là ngân sách staging dùng chung cho hai hạng mục (ZNS + phần cứng), không phải đơn giá riêng cho phần cứng hay cho OTP.
- **Chi phí OTP/OCR:** tài khoản Zalo ZNS / SMS Brandname để gửi mã xác thực, và dịch vụ Cloud Vision OCR cho tính năng Pro. Các khoản này chỉ phát sinh khi chức năng Pro được kích hoạt ở gói trả phí, nên phải báo cáo theo mức sử dụng thực tế chứ không theo ước tính cố định.

Kèm theo đó, ngân sách staging 3–5 triệu VND đã được Founder phê duyệt trong `STRATEGY-V2-CHANGE-REPORT.md` (tài liệu DRAFT_FOR_FOUNDER_REVIEW), dùng để đăng ký tài khoản doanh nghiệp Zalo ZNS và mua sắm thiết bị Mini PC. Không được tách ngân sách này thành ba khoản chi riêng lẻ không có căn cứ, cũng không được dùng nó làm bằng chứng cho chi phí triển khai hay hỗ trợ.

### Ràng Buộc Tuân Thủ Pháp Lý Đã Biết

Ba văn bản pháp lý chi phối trực tiếp thiết kế của hệ thống và phải được trích dẫn đúng khi nói tới chúng.

- **Luật Bảo vệ dữ liệu cá nhân `91/2025/QH15`:** là căn cứ cho `GATE-01`. Biên bản chấp thuận xử lý dữ liệu (DPA) dựa trên mẫu trong `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`, và chủ vựa phải ký trước khi bất kỳ dữ liệu khách hàng thật nào vào hệ thống. Trước mức này, `goForLiveCustomerData` là `false`.
- **Luật Thương mại điện tử `122/2025/QH15`:** là một trong hai căn cứ của khóa kép trên marketplace. Bản thân file `company.json` và cơ chế guard ghi rõ marketplace bị chặn bởi luật này cho tới khi có chữ ký Founder và pháp lý, và bản chất Zero-Custody là bắt buộc chứ không tùy chọn.
- **Nghị định `52/2024/NĐ-CP`:** quy định mô hình không giữ tiền của khách hàng (Zero-Custody). Điều này ảnh hưởng tới khả năng thu phí điều phối giao dịch: DuriOS có thể chứng thực và chứng nhận sự kiện, nhưng không được nắm giữ tiền — luồng ký quỹ với ngân hàng phụ thuộc `PLATFORM-03` và được liệt kê ở trạng thái `LATER` trong `STRATEGY-V2-BACKLOG.md`.

Ngoài ra, hệ thống tuyệt không tự nhận quyền cấp hay xác minh chứng nhận hữu cơ (`duriosRecordStatus = "EVIDENCE_STORED_NOT_CERTIFIED"`), và không thay thế quyết định kiểm dịch hay thông quan của Hải quan Việt Nam, GACC Trung Quốc hay bất kỳ cơ quan nhà nước nào. Các tuyên bố trong luồng hiển thị và trong API đều phải giữ đúng ranh giới này.

---

### Đối chiếu bằng chứng còn lại trong kho mã

Các file dưới đây là nguồn đối chiếu khi cần kiểm chứng một khẳng định trong blueprint. Chúng không tạo ra kháng nghị mới, chỉ củng cố rằng mỗi phát biểu đều có thể truy được nguồn: `src/saas/open-core-edition-manifest.ts` (13 module và `economicTruth`), `src/saas/saas-tier-policy.ts` (bốn quyền lợi cục bộ bất biến, sáu quyền lợi đám mây theo bậc, và ba đường hạ cấp nhẹ), `src/saas/workspace-portability-bundle.ts` (payload, băm SHA-256, HMAC và xác minh khớp blob), `src/verification/hitl-service.ts` (xác minh từng trường theo danh tính con người), `src/storage/sqlite-audit-ledger.ts` (chuỗi băm `previous_hash` / `event_hash` với điểm khởi `GENESIS_HASH`), `src/server/tenant-rate-limiter.ts` (mặc định 30 request mỗi 60 giây cho upload), `src/marketplace/marketplace-guard.ts` (khóa kép cho marketplace), `src/auth/pilot-launch-gate-verifier.ts` (đánh giá 5 cổng fail-closed), `src/auth/pilot-rehearsal-seeder.ts` (diễn tập 5 container mô phỏng), `src/auth/pilot-kpi-evaluator.ts` (trung bình số học và bốn chỉ số mở rộng), `src/rules/asean-corridor-adapters.ts` (bốn hành lang `VN_CN` / `MY_CN` / `TH_CN` / `PH_CN`), `src/sharing/dense-cluster-readiness.ts` (cụm 8/3/2/3/5 và hai điều kiện mở rộng), `src/sharing/verified-org-profile.ts` (profile không lộ dữ liệu nhạy cảm), `src/export/standalone-manifest-verifier.ts` (kiểm ISO 6346 và SHA-256 ngoại tuyến), và `src/export/field-auditor-cli.ts` (báo cáo kiểm toán kèm niêm phong SHA-256).

Bộ kiểm thử tương ứng dùng để chứng minh trạng thái hiện hành: `test/blueprint-25-step-auditor.test.ts` (25/25 artifact coverage và endpoint HTTP), `test/open-core-25-step-blueprint-e2e.test.ts` (manifest, cô lập tenant isolation, export/verify portability, và đồng bộ 25 bước), `test/pilot-rehearsal-seeder.test.ts` (diễn tập 5 container mô phỏng và 2 lỗi gài mù bị bắt), `test/pilot-launch-gate-verifier.test.ts` (cổng fail-closed và Dual-Lock marketplace), `test/tri-tuple-persona-rbac.test.ts` (phân quyền 5 vai trò), `test/marketplace-escrow-guard.test.ts` (khóa kép marketplace), `test/open-core-workspace-portability.test.ts` (cô lập tenant và phát hiện can thiệp), `test/dense-cluster-gtm.test.ts` và `test/ecosystem-rehearsal-and-modularity.test.ts` (cụm dày đặc), `test/tenant-rate-limiter.test.ts` (giới hạn tần suất theo tenant), `test/audit-integrity.test.ts` và `test/sqlite-sharing-and-evidence-5a3.test.ts` (chuỗi băm và chia sẻ), `test/asean-corridor-and-verified-profile.test.ts` (bốn hành lang), cùng `test/open-core-deep-introspector.test.ts` cho phép kiểm tra vi mô 150.000/8.000 VND.

Khi một bước trong blueprint được nâng trạng thái, phải chỉ ra chính xác kiểm thử nào làm bằng chứng, và kiểm thử đó chạy trên dữ liệu mô phỏng hay dữ liệu thật. Nếu bằng chứng chỉ đến từ dữ liệu mô phỏng thì nhãn chỉ được là `[Đã kiểm thử tổng hợp]` và phải ghi rõ tính chất mô phỏng ngay trong dòng trạng thái.

---

### Thứ Tự Ưu Tiên Khi Có Xung Đột

Khi 25 bước trong blueprint tranh giành nguồn lực hoặc khi hai yêu cầu có vẻ mâu thuẫn, thứ tự ưu tiên sau đây áp dụng, từ cao xuống thấp.

1. **An toàn dữ liệu và ranh giới pháp lý:** bất kỳ yêu cầu nào đẩy dữ liệu khách hàng thật vào hệ thống trước khi 5/5 cổng đạt đều bị từ chối ngay, kể cả khi việc đó giúp đạt một mốc doanh thu. Ranh giới này nằm trong `DECISION-01-CAI-LAY-SITE-SELECTION.md` mục "Ranh giới an toàn bắt buộc" và không được thương lượng bằng lập luận kỹ thuật.
2. **Quyền phê duyệt cuối thuộc về con người (HITL):** không có tính năng nào, kể cả tính năng tiện lợi nhất, được phép tự phê duyệt xuất khẩu. Nếu một yêu cầu đòi tự động hóa quyết định cuối, nó bị từ chối ở tầng kiến trúc.
3. **Tính trung thực của nhãn trạng thái:** thà báo chậm còn hơn báo sai. Một bước được nâng nhãn phải có bằng chứng kèm theo; không có bằng chứng thì giữ nguyên nhãn thấp hơn dù công việc đã hoàn thành về mặt viết mã.
4. **Kiểm soát chất lượng mã:** trần 100 dòng, không có `any`, 15/15 lượt Sokratic. Nếu nâng một bước trạng thái làm vỡ một trong ba ràng buộc này, bước nâng phải chờ cho tới khi ràng buộc được phục hồi.
5. **Tốc độ mở rộng:** cụm dày đặc, ASEAN, marketplace và tầng doanh thu 6 chỉ được xem sau khi bốn ưu tiên trên ổn định. Việc đuổi theo các hướng này trước thời hạn chính là cách phá vỡ các ưu tiên cao hơn.

Nếu một quyết định buộc phải đảo ngược thứ tự này (ví dụ vì áp lực thương mại), nó phải được ghi thành quyết định Founder có văn bản, kèm lý do và rủi ro được chấp nhận, và phải ghi rõ trong `tasks.md` rằng nhãn trạng thái liên quan không được nâng vì quyết định đó.

---

### Danh Mục Thuật Ngữ Dùng Chung Trong Blueprint

Để tránh phép dịch sai, mọi thuật ngữ kỹ thuật được giữ nguyên bằng tiếng Anh. ARR là doanh thu thuê bao định kỳ đang hoạt động, không gồm phí một lần. Verified GMV là tổng giá trị hàng hóa được chứng thực qua chuỗi bằng chứng DuriOS, không tính giao dịch không có bằng chứng. DPA là Văn bản/Thỏa thuận xử lý dữ liệu cá nhân. HITL là Human-in-the-Loop, bắt buộc con người xác minh trước khi dữ liệu được gắn cờ `HUMAN_VERIFIED`. Zero-Custody là nguyên tắc không nắm giữ tiền của khách hàng. Local Core là mô hình dữ liệu và xử lý nằm tại chỗ trong SQLite của vựa. Graceful downgrade là việc hạ cấp về bản Community khi giấy phép hết hạn mà vẫn giữ toàn quyền đọc/ghi cục bộ. Seeded rehearsal là bộ dữ liệu diễn tập do code dựng sẵn, không phải dữ liệu thực. Fail-closed là hành vi từ chối thao tác khi thiếu điều kiện, thay vì cho phép theo mặc định.

Thuật ngữ trạng thái đọc nhanh: PASS là cổng đạt; `PENDING_SITE_AND_CONSENT_SIGN_OFF` là chỉ còn chờ chữ ký địa điểm và DPA; `PENDING_PROVIDER_CREDENTIALS` là chỉ còn nạp credential nhà mạng OTP; `SECURITY_CONFIG_INCOMPLETE` là cổng bảo mật còn thiếu loopback hoặc chuỗi kiểm toán; `PENDING_VERIFIED_BACKUP` là chưa có bản sao lưu hợp lệ được xác minh; `REHEARSAL_INCOMPLETE` là diễn tập chưa đủ 5 container hoặc chưa bắt đủ lỗi gài mù trên dữ liệu thật. Biến `goForLiveCustomerData` chỉ là `true` khi cả 5 cổng đồng thời PASS.

Thuật ngữ pháp lý đọc nhanh: Luật `91/2025/QH15` là luật bảo vệ dữ liệu cá nhận, căn cứ cho `GATE-01`. Luật `122/2025/QH15` là luật thương mại điện tử, căn cứ chặn marketplace trước khi có đủ điều kiện. Nghị định `52/2024/NĐ-CP` quy định mô hình không giữ tiền. Luật TMĐT (`122/2025/QH15`) và Nghị định `248/2026/NĐ-CP` cùng được trích dẫn trong guard của marketplace như căn cứ fail-closed khi tính năng B2B chưa được ký duyệt; mỗi khi dùng tới chúng phải ghi rõ phạm vi áp dụng thay vì dùng chung chung cho toàn hệ thống.

---

### Cách Dùng Tệp Này Trong Giao Tiếp

- **Nội bộ:** dùng nhãn trạng thái ở mỗi bước để quyết định ưu tiên công việc tuần; không dùng "mã viết xong" thay cho nhãn, vì `[Đã có code]` là nhãn đúng cho tình trạng đó.
- **Với chủ vựa / đối tác:** chỉ trích những gì đang ở nhãn `[Đã có code]` hoặc `[Đã kiểm thử tổng hợp]`, và phải nói rõ phần nào mới chỉ chạy trên dữ liệu mô phỏng. Không trích bất kỳ con số nào từ phần Kịch bản Bear/Base/Bull như thể đã đo được.
- **Với nhà đầu tư / bên thứ ba:** dùng đúng phạm vi tài liệu — V1 (phê duyệt 2026-10-14) là căn cứ, V2 là bản dự thảo. Không tuyên bố về ARR, doanh thu, khách hàng, CAC, LTV hay retention vì chúng đều `[Chưa được xác minh]`.
- **Khi cập nhật:** sửa nhãn ở tệp này trước, rồi tới `tasks.md` và `.mekong/company.json`, và chạy lại hai lệnh kiểm tra. Nếu chỉ sửa một trong ba chỗ, bộ ba sẽ lệch nhau và báo cáo sau này sẽ sai.

Điểm kết thúc cần nhớ: bản blueprint này tồn tại để giữ cho mọi người trong đội nói đúng sự thật về những gì đã làm được. Kết quả 25/25 từ `bun run blueprint:verify-25-steps` là tín hiệu tốt về tính đầy đủ của artifact, nhưng bản thân nó không phải là bằng chứng thị trường. Bằng chứng thị trường chỉ bắt đầu khi vựa Cai Lậy ký DPA, chạy 5 container thật với 2 lỗi gài mù, và đồng ý trả tiền.
