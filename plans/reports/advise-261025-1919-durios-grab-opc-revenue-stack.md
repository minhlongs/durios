# Báo Cáo Tư Vấn Chiến Lược: DuriOS — Kiến Trúc Doanh Thu Đa Tầng Theo Mô Hình OPC Công Ty 1 Người

- **Mã báo cáo:** `/Users/macbook/durios/plans/reports/advise-261025-1919-durios-grab-opc-revenue-stack.md`
- **Ngày lập:** 2026-10-25
- **Chế độ thẩm định:** `--ultra` (Best-of-5 Verifier với mô hình Verifier Kongming trên Fable)
- **Tình trạng:** Khuyến nghị chính thức (Winning Candidate Selected: Candidate C / Slot 5)

---

## 0. Needs from you

Không có.

---

## 1. Verdict

Ý tưởng biến DuriOS thành "Grab của ngành sầu riêng xuất khẩu" thông qua thang doanh thu 8 tầng (8-layer revenue stack) vận hành bởi công ty 1 người (OPC) **mạnh ở kiến trúc phòng thủ pháp lý – mật mã học, nhưng cực kỳ nguy hiểm ở chỗ đang xây tầng 5–8 trên giấy trong khi tầng 1 chưa thu được 1 đồng nào và kênh phân phối chính lại đặt cược vào một tập đoàn không hề buôn sầu riêng.**

- **Điểm mạnh thật sự (đã có trong code):** Kho mã nguồn `/Users/macbook/durios` rất kỷ luật (Bun 1.3.14, TypeScript strict, không `:any`, trần 100 LOC/file, 230 test pass trên 51 file). Hệ thống đã giải đúng bài toán toán học của thị trường: `src/saas/open-core-edition-manifest.ts` và `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md` ghi rõ Việt Nam chỉ có **281 cơ sở đóng gói đang hoạt động** (số liệu Bộ NN&MT tháng 9/2026); nếu thu 60.000.000 VND/vựa/năm thì trần SaaS thuần túy tại Việt Nam chỉ đạt **16,86 tỷ VND (~$657.643 ARR)**, trong khi muốn chạm $1M ARR bằng SaaS đơn thuần cần tới **428 vựa** (> 281 vựa hiện có). Vì vậy, việc thiết kế mô hình Open-Core (`COMMUNITY_OPEN_CORE` miễn phí + `PACKHOUSE_PRO_SAAS` ký khóa Ed25519 offline trong `src/saas/saas-tier-policy.ts` + `EXPORTER_ENTERPRISE`) kết hợp Zero-Custody (`src/marketplace/marketplace-guard.ts`) và ràng buộc HITL là hoàn toàn đúng hướng để một người vận hành mà không bị sập bẫy pháp lý (Nghị định 52/2024/NĐ-CP, Luật DLCN 91/2025/QH15).
- **Điểm yếu chí mạng (nói thẳng):**
  1. **Có bộ đếm tiền nhưng không có đường thu tiền:** `src/saas/usage-metering-service.ts` tính được `PER_CONTAINER_RATE_VND = 150000` và `DEMURRAGE_RISK_PER_CATCH_VND = 15000000`, nhưng toàn bộ `src/` không có lấy một dòng tích hợp thanh toán, hóa đơn, VietQR hay đối soát chuyển khoản; `src/server/http-router.ts` cũng không có bất kỳ route billing hay checkout nào.
  2. **5 cổng an toàn (GATE-01..05) đang chặn cứng dữ liệu thật:** Trong `src/auth/pilot-launch-gate-verifier.ts`, toàn bộ 5 cổng đều chưa PASS thực địa (`goForLiveCustomerData === false`), và GATE-05 mới chỉ chạy trên dữ liệu mô phỏng (`pilot-rehearsal-seeder.ts`).
  3. **Rủi ro lệch pha đối tác (Partner Mismatch):** Bạn đang đặt trọng tâm kênh mở rộng vào Hùng Hậu Holdings (mạnh về thủy sản/cá tra, điều VIETNUT, cà phê HARVEST, thực phẩm Happy Food và có quan hệ thương mại lâu năm với đối tác Trung Quốc), nhưng bản thân Hùng Hậu **không kinh doanh sầu riêng và không sở hữu vựa đóng gói sầu riêng tại Cai Lậy**. Nếu vựa đầu tiên ở Cai Lậy chưa chạy xong và chưa chứng minh được giá trị thật, cuộc gặp Hùng Hậu rất dễ biến thành buổi nói chuyện xã giao hoặc bị ép làm dự án gia công phần mềm (white-label/outsource) — thứ sẽ giết chết mô hình OPC 1 người ngay lập tức.

---

## 2. Nên làm gì

Các bước dưới đây được sắp xếp theo đúng trình tự nhân quả để đạt 6 điều kiện "Done means" trong khuôn khổ 0–5 giờ/tuần thực địa và thứ tự vốn **A (tự bỏ vốn) → B (vay/đầu tư nhỏ) → C (đối tác chiến lược) → D (Hùng Hậu khi đã có PMF)**:

1. **Khóa chặt quy trình thu tiền tối giản "Zero-Code Billing" trước khi ra vựa (Tuần 1):**
   - Với quy mô 1–10 vựa đầu tiên và mô hình OPC 1 người, **không viết thêm cổng thanh toán tự động vào code**. Thay vào đó, chuẩn hóa quy trình: Hợp đồng/Phiếu thu Pilot 1 trang (5.000.000 VND / 5 container) + mã VietQR tài khoản ngân hàng công ty/hộ kinh doanh + xuất hóa đơn/biên lai hợp lệ + dùng chính hàm `createSignedSaasLicenseKey()` trong `src/saas/saas-tier-policy.ts` để ký khóa `DURIOS.<payload>.<sig>` bằng Ed25519 private key của bạn và cấp cho vựa. Cách này tốn 0 giờ code, giữ nguyên kiến trúc `127.0.0.1` offline, và lấy được "biên lai thu tiền hợp lệ đầu tiên".

2. **Mở khóa 5 cổng GATE-01..05 cho địa điểm `SITE-CAILAY-TIENGIANG-01` (Tháng 1–2):**
   - **GATE-01 (Pháp lý dữ liệu):** Soạn Biên bản Chấp thuận Xử lý Dữ liệu (DPA) song ngữ VI+EN theo Luật Bảo vệ Dữ liệu Cá nhân 91/2025/QH15 (1 trang, ngôn ngữ đời thường cho chủ vựa), ký sống với chủ vựa Cai Lậy, scan lưu vào đường dẫn `DURIOS_GATE01_CONSENT_FILE`.
   - **GATE-02 (OTP thật):** Đăng ký tài khoản Zalo ZNS / SMS Brandname thật, điền biến môi trường `DURIOS_OTP_PROVIDER` và khóa API để thoát trạng thái fail-closed `503` trong `src/auth/otp-provider.ts`.
   - **GATE-03 & GATE-04 (On-prem & Sao lưu):** Giữ nguyên cấu hình loopback `DURIOS_HOST=127.0.0.1`, chạy diễn tập sao lưu ra thư mục `DURIOS_BACKUP_DIR` và xác minh bằng `verifySiteBackup()` trong `src/auth/site-backup-manager.ts`.
   - **GATE-05 (Diễn tập 5 container):** Chạy `bun run pilot:verify-gates` tại `/Users/macbook/durios` cho đến khi `passedCount === 5` và `goForLiveCustomerData === true`.

3. **Chạy Pilot trả phí 5.000.000 VND trên 5 container thật tại Cai Lậy + gài 2 lỗi mù (Tháng 3–4):**
   - Yêu cầu chủ vựa thanh toán hoặc ký cam kết thanh toán gói Pilot **5.000.000 VND / 5 container** trước/ngay khi nghiệm thu (kiểm chứng trực tiếp Kill Criterion #1 – WTP Failure).
   - Chạy thực tế 5 bộ hồ sơ container thật (`PACKING_LIST`, `LAB_TEST_REPORT`, `PHYTOSANITARY_CERTIFICATE`) với nhân viên vựa trực tiếp bấm xác nhận HITL.
   - Cài cắm **2 lỗi gài mù (planted blind faults)** (ví dụ: lệch số seal container hoặc ngưỡng Cadimi > 0.05 mg/kg / trường chưa `HUMAN_VERIFIED`). Hệ thống bắt buộc phải chặn 100% (`zeroMissGate === true`) và đạt **Arithmetic Mean < 5.0 phút (< 300 giây)** trên cả 5 container trong `src/auth/pilot-kpi-evaluator.ts`.
   - Xuất gói hồ sơ niêm phong SHA-256 (`DossierExportManifest`) cho cả 5 container và kiểm chứng độc lập bằng `bun run verify:manifest` (`src/export/standalone-manifest-verifier.ts`).

4. **Đóng gói "Bộ Bằng Chứng Thực Địa" (Field Proof Kit) và họp với lãnh đạo Hùng Hậu (Tháng 5):**
   - Không đến gặp Hùng Hậu bằng slide ý tưởng. Mang theo: (a) 5 gói manifest SHA-256 đã ẩn danh thông tin nhạy cảm, (b) báo cáo `Gate05KpiEvaluationReport` chứng minh Mean < 5 phút và bắt 100% lỗi, (c) biên lai thu 5.000.000 VND thật từ vựa Cai Lậy.
   - Đặt lên bàn **Bản ghi nhớ hợp tác giới thiệu (Referral MOU)** với 3 nguyên tắc bất di bất dịch:
     1. Hùng Hậu giới thiệu mạng lưới thương nhân/nhà nhập khẩu Trung Quốc (vốn đã làm ăn lâu năm với Hùng Hậu ở mảng cá tra/nông sản) hoặc các đối tác cung ứng có liên kết vùng nguyên liệu sầu riêng.
     2. DuriOS ký hợp đồng trực tiếp với khách hàng và giữ 100% quyền sở hữu sản phẩm/thương hiệu (không white-label, không chuyển giao IP).
     3. Cơ chế chia sẻ doanh thu giới thiệu rõ ràng: **10–15% doanh thu thuần thu được từ khách do Hùng Hậu giới thiệu trong năm đầu, giảm dần về 5% từ năm thứ hai**, chỉ trả khi DuriOS đã thực thu tiền từ khách.

5. **Kích hoạt Nhánh Dự Phòng 90 Ngày song song hoặc ngay sau cuộc gặp Hùng Hậu (Tháng 5–6):**
   - Vì Hùng Hậu không làm sầu riêng, bạn **không được chờ** Hùng Hậu mang khách về. Dùng ngay kết quả của vựa Cai Lậy số 1 cùng tính năng `Standalone Manifest Verifier SDK` (MIT) và `Workspace Portability Bundle` (`src/saas/workspace-portability-bundle.ts`) để kích hoạt hiệu ứng lan truyền tại cụm Cai Lậy – Tiền Giang: mỗi khi vựa số 1 gửi bộ hồ sơ có đính kèm mã kiểm tra SHA-256 cho thương lái/đối tác xuất khẩu và phòng Lab kiểm nghiệm Cadimi, đối tác nhận hồ sơ sẽ thấy con dấu xác thực của DuriOS. Dùng đòn bẩy đó để chốt trực tiếp vựa số 2 và số 3 tại Cai Lậy chuyển sang gói **60.000.000 VND/vựa/năm** hoặc **150.000 VND/container pay-go**.

---

## 3. Không nên làm gì

1. **Đừng viết bất kỳ route thanh toán tự động (`/api/billing`, SePay, VietQR webhook, NOWPayments) nào vào `src/server/http-router.ts` trước khi thu được tiền từ ít nhất 3 vựa bằng chuyển khoản ngân hàng thủ công.** Với trần 100 LOC/file và mô hình 1 người, việc xây hệ thống webhook thanh toán khi chưa có khách trả tiền là sự lãng phí thời gian lớn nhất.
2. **Đừng bật cờ `DURIOS_FEATURE_B2B_MARKETPLACE="enabled"` trong `src/marketplace/marketplace-guard.ts` và đừng nối `NonCustodialEscrowCoordinator` (`src/marketplace/escrow-state-machine.ts`) vào `src/server/http-router.ts` trong 12 tháng tới.** Class `NonCustodialEscrowCoordinator` hiện chỉ lưu trữ trong bộ nhớ (`new Map()`), chưa có persistence xuống SQLite và chưa có ngân hàng đối tác cấp phép thật; mở ra lúc này vừa vi phạm Non-goals vừa tạo rủi ro pháp lý theo Nghị định 52/2024/NĐ-CP.
3. **Đừng đụng vào hay mở rộng thêm `src/rules/asean-corridor-adapters.ts` (MY_CN, TH_CN, PH_CN) hay `src/rules/multi-market-pack-registry.ts` (JP, KR, EU).** Qua kiểm tra mã nguồn, `ASEAN_CORRIDOR_REGISTRY` hiện chỉ là bảng hằng số tĩnh được gọi bởi `listSupportedAseanCorridors()` trong màn hình rehearsal và test, **chưa hề được bất kỳ bộ đánh giá quy tắc (rule evaluator) thực tế nào trong `src/rules/deterministic-engine.ts` hay `src/rules/cadmium-evaluators.ts` đọc để chặn lỗi**. Viết thêm rule cho Thái Lan hay Malaysia khi chưa có 1 vựa Việt Nam trả 60 triệu VND là tự đánh lừa mình bằng "độ phủ code".
4. **Đừng nhận lời làm dự án tùy chỉnh (custom software / white-label / ERP riêng) cho Hùng Hậu ở mảng cá tra, hạt điều hay cà phê.** Nếu Hùng Hậu đề nghị "em làm riêng cho anh một bản quản lý cá tra/hạt điều rồi anh trả tiền dự án", hãy từ chối. Với quỹ thời gian 0–5 giờ/tuần của công ty 1 người, nhận một dự án gia công sẽ biến bạn thành nhân viên IT thuê ngoài và khai tử DuriOS.
5. **Đừng chuyển kiến trúc từ SQLite on-prem (`127.0.0.1`) sang Multi-Tenant Cloud SaaS** để "tiện quản lý từ xa". Chủ vựa sầu riêng cực kỳ nhạy cảm với danh sách khách hàng Trung Quốc, giá mua tại vườn và biên bản xét nghiệm Cadimi; chính cam kết dữ liệu nằm 100% tại máy tính của vựa (`zeroLockInPolicy` trong `src/saas/open-core-edition-manifest.ts`) mới là vũ khí giúp bạn vượt qua nỗi sợ lộ bí mật kinh doanh của chủ vựa (Kill Criterion #4).

---

## 4. Có thể tốt hơn / hiệu quả hơn

Xếp theo tỷ lệ **Công sức bỏ ra thấp nhất / Tác động tạo doanh thu cao nhất (Effort-to-Impact)** cho công ty 1 người:

1. **Tận dụng khóa ngoại tuyến Ed25519 có sẵn thay vì xây hệ thống quản lý thuê bao (Effort: Rất thấp | Impact: Rất cao):**
   - Trong `src/saas/saas-tier-policy.ts`, hàm `createSignedSaasLicenseKey()` và `resolveSaasSubscriptionStatus()` đã hoạt động hoàn hảo 100% offline: chỉ cần chuỗi `DURIOS.<base64url(edition|tenantId|expiresAt)>.<base64url(sig)>` đặt vào biến môi trường `DURIOS_SAAS_LICENSE_KEY`. Khi khách chuyển khoản 5 triệu (Pilot) hoặc 60 triệu (Pro Annual), bạn chỉ cần chạy 1 script CLI 10 dòng trên máy cá nhân để sinh mã license có hạn 30 ngày hoặc 365 ngày gửi qua Zalo cho vựa. Nếu hết hạn mà chưa đóng tiền tiếp, phần mềm tự động hạ cấp êm ái (`EXPIRED_SUBSCRIPTION_GRACEFUL_DOWNGRADE`) về bản `COMMUNITY_OPEN_CORE` mà không làm mất dữ liệu của khách.

2. **Sửa điểm mù trong `src/auth/pilot-kpi-evaluator.ts` để đo đủ 4 chỉ số giá trị cho cả 5 container thay vì chỉ container đầu tiên (Effort: Thấp – 5 dòng code khi vào pha thực thi | Impact: Cao):**
   - Hiện tại ở dòng 49 của `src/auth/pilot-kpi-evaluator.ts`:
     `const firstContainerMetrics = dossiers.length > 0 ? evaluateFirstContainerValueMetrics(dossiers[0]!) : undefined;`
     Hệ thống chỉ tính 4 chỉ số giá trị kinh tế (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`) cho đúng `dossiers[0]`, và hàm `calculateActualDuration()` trong `src/auth/pilot-kpi-extended-types.ts` đang lấy `updatedAt - createdAt` với sàn cứng `Math.max(0.5, ...)` hoặc trả về `4.0` phút mặc định nếu thiếu timestamp. Khi bước sang pha triển khai thực địa, việc tổng hợp 4 chỉ số này trên toàn bộ $N=5$ container sẽ tạo ra bảng báo cáo ROI đắt giá nhất để thuyết phục chủ vựa rút ví trả 60.000.000 VND/năm.

3. **Biến "Phòng Kiểm nghiệm Cadimi (Lab)" và "Đơn vị Logistics/Khai thuê Hải quan" thành kênh bán hàng 0 đồng (Effort: Thấp | Impact: Cao hơn Hùng Hậu trong ngắn hạn):**
   - Một chủ vựa chỉ làm việc với 1 vựa của họ, nhưng 1 phòng Lab kiểm nghiệm Cadimi/Vàng O hoặc 1 đại lý khai thuê hải quan tại cửa khẩu Hữu Nghị / Tân Thanh làm việc với **30–50 vựa đóng gói sầu riêng mỗi ngày**. Khi vựa Cai Lậy số 1 xuất gói hồ sơ có kèm `standalone-manifest-verifier.ts`, hãy gửi trực tiếp cho đơn vị khai thuê hải quan của vựa đó và đề xuất chia sẻ phí giới thiệu (10–15% giống hệt cơ chế Hùng Hậu) nếu họ giới thiệu các vựa khác đang bị kẹt hồ sơ GACC. Đây là kênh dự phòng 90 ngày sát sườn ngành sầu riêng hơn nhiều so với mảng cá tra của Hùng Hậu.

4. **Bán gói trả theo lượt (Pay-as-you-go 150.000 VND/container qua gói cước trả trước 10–20 container) cho các vựa nhỏ theo mùa vụ (Effort: Không cần code thêm | Impact: Trung bình – Cao):**
   - Sầu riêng mang tính mùa vụ rất mạnh (miền Tây nghịch vụ, Tây Nguyên chính vụ). Nhiều vựa sẽ ngại chi ngay 60.000.000 VND/năm sau khi hết pilot 5 triệu. Thay vì cho nợ hoặc giảm giá làm hỏng cấu trúc giá, bạn dùng ngay mức `PER_CONTAINER_RATE_VND = 150_000` đã khai báo trong `src/saas/usage-metering-service.ts` để bán "Gói 20 container mùa vụ = 3.000.000 VND (hạn dùng 3 tháng)" cấp qua license key có thời hạn.

---

## 5. Quan điểm của tôi và đường tới đó

**Quan điểm thẳng thắn của tôi:** Muốn trở thành "Grab của ngành sầu riêng xuất khẩu" khi chỉ có 1 người và 0–5 giờ/tuần thực địa, bạn **tuyệt đối không được bắt đầu như một sàn giao dịch (marketplace), mà phải bắt đầu như một "Con Dấu Kiểm Toán Chống Giả Mạo" (Cryptographic Compliance Stamp) tại bàn cân đóng gói.**

Grab không bắt đầu bằng việc bán bảo hiểm hay cho vay tài chính; Grab bắt đầu bằng việc điều phối cuốc xe an toàn và đúng giờ. Tương tự, trong ngành sầu riêng xuất khẩu chính ngạch sang Trung Quốc (chiếm 95% kim ngạch), nỗi sợ lớn nhất của chủ vựa và thương nhân Trung Quốc không phải là "thiếu chợ để tìm nhau", mà là **một container trị giá 1,5 – 2 tỷ VND bị quay đầu hoặc nằm chờ tại cửa khẩu mất 15–50 triệu VND/lần vì sai số seal, sai mã vùng trồng/cơ sở đóng gói GACC, hoặc thiếu chữ ký kiểm chứng Cadimi**. Khi con dấu SHA-256 của DuriOS trở thành thứ mà người mua Trung Quốc yêu cầu phải có trước khi giải ngân tiền cọc, bạn nghiễm nhiên nắm quyền điều phối giao dịch (tầng 4, 5, 6) mà không cần tốn một đồng làm sàn thương mại điện tử công khai.

**Lộ trình thực thi từng bước từ trạng thái hiện tại tới mục tiêu:**

- **Giai đoạn 1 (Tháng 1–2): Mở khóa 5 cổng an toàn (`GATE-01..05`) tại Cai Lậy (Vốn giai đoạn A – Tự bỏ vốn).**
  - Hoàn tất DPA song ngữ (`GATE-01`), cấu hình Zalo ZNS/SMS OTP thật (`GATE-02`), xác nhận loopback `127.0.0.1` + sổ cái băm (`GATE-03`), chạy diễn tập sao lưu/khôi phục (`GATE-04`), và vượt qua bài kiểm tra 5 container chuẩn (`GATE-05`) để bật `goForLiveCustomerData = true`.
- **Giai đoạn 2 (Tháng 3–4): Chốt vựa Cai Lậy số 1 + Thu 5.000.000 VND Pilot + Vượt 3 Kill Criteria đầu tiên.**
  - Đưa 5 container thật của vựa Cai Lậy qua hệ thống (với 0–5 giờ/tuần hỗ trợ từ xa qua Zalo/UltraViewer và nhân viên vựa tự thao tác HITL).
  - Chứng minh trung bình số học thời gian đối soát `< 5.0 phút/container` và bắt sống `100% (2/2)` lỗi gài mù.
  - Xuất 5 gói hồ sơ niêm phong SHA-256 và thu 5.000.000 VND (có biên lai hợp lệ). Nếu vi phạm bất kỳ tiêu chí nào trong Kill Criteria #1 (không trả tiền), #2 (nhân viên quay về Excel/Zalo), hoặc #3 (lọt lỗi gài mù), lập tức dừng mở rộng để sửa đúng điểm nghẽn đó.
- **Giai đoạn 3 (Tháng 5–6): Đòn bẩy Hùng Hậu + Nhánh Dự Phòng 90 Ngày để lên Tầng Doanh Thu 1–3.**
  - Dùng hồ sơ thắng lợi của vựa số 1 để họp với lãnh đạo Hùng Hậu, ký biên bản cơ chế **Referral Fee 10–15% năm đầu, giảm về 5%** (không white-label, giữ nguyên quyền sở hữu khách hàng).
  - Song song kích hoạt Nhánh Dự Phòng 90 Ngày qua đại lý hải quan / phòng Lab kiểm nghiệm Cadimi tại Tiền Giang để nhân bản lên 5–8 vựa trong cụm Dense Cluster (`60.000.000 VND/vựa/năm` hoặc `150.000 VND/container` + gói OCR/ZNS/Backup tầng 2–3).
- **Giai đoạn 4 (Tháng 7–12+): Chạm ngưỡng PMF & mở khóa Tầng 4 (Buyer Verification Room) + Gọi vốn/Hợp tác chiến lược (Vốn B → C → D).**
  - Khi đã có 10–20 vựa trả phí định kỳ và dòng tiền dương cho OPC 1 người, mở cổng xác thực một lần cho người mua Trung Quốc / ngân hàng (`MOD-PRO-04` và `MOD-ENT-03` trong `src/saas/open-core-edition-manifest.ts`), từ đó tiến dần lên mục tiêu $1M ARR mà không phá vỡ ràng buộc Zero-Custody.

---

## 6. Lợi ích

- **Bảo toàn tuyệt đối mô hình Công ty 1 Người (OPC) với 0–5 giờ/tuần thực địa:** Cài đặt on-prem `127.0.0.1` + tự động hạ cấp êm ái bằng khóa chữ ký số Ed25519 (`src/saas/saas-tier-policy.ts`) + nhân viên vựa tự duyệt HITL giúp bạn không phải trực vận hành 24/7 và không tốn chi phí nuôi đội DevOps hay đội nhập liệu.
- **Tạo doanh thu thật ngay từ container thứ nhất đến thứ năm:** Lộ trình pilot 5.000.000 VND → 60.000.000 VND/năm → 150.000 VND/container kiểm chứng ngay lập tức khả năng chi trả (WTP) của chủ vựa Cai Lậy mà không cần viết thêm bất kỳ module thanh toán phức tạp nào.
- **Giữ trọn quyền sở hữu trí tuệ, thương hiệu và khách hàng trước tập đoàn lớn:** Cơ chế Referral MOU (10–15% giảm dần về 5%) biến mối quan hệ lãnh đạo cấp cao tại Hùng Hậu thành kênh dẫn khách Trung Quốc/đối tác nông sản mà không bị biến thành công ty gia công phần mềm (white-label) hay mất quyền kiểm soát cổ phần khi chưa có PMF (đúng thứ tự vốn A → B → C → D).
- **Loại bỏ hoàn toàn rủi ro pháp lý hình sự/hành chính cho cá nhân Founder:** Tuân thủ nghiêm ngặt 5 cổng `GATE-01..05` (Luật DLCN 91/2025/QH15), cơ chế Zero-Custody không giữ tiền (Nghị định 52/2024/NĐ-CP) và bắt buộc con người ký duyệt HITL (không để AI tự phê duyệt xuất khẩu) giúp bạn an toàn tuyệt đối khi xảy ra tranh chấp thương mại biên mậu.

---

## 7. Đánh đổi

1. **Đánh đổi lớn nhất từ quyết định giữ On-Prem SQLite (`127.0.0.1`) kết hợp với trần 0–5 giờ/tuần làm việc thực địa (điểm tôi không hoàn toàn tán thành về mặt chi phí vận hành khi nhân rộng):**
   - Với 1–3 vựa đầu tiên, chạy hoàn toàn tại chỗ trên `127.0.0.1` là ưu thế bán hàng tuyệt đối vì chủ vựa yên tâm không lộ dữ liệu. Nhưng khi bạn vượt quá **8–10 vựa** tại Cai Lậy / ĐBSCL, việc cập nhật phiên bản Bun/SQLite, xử lý lỗi máy tính Windows tại vựa bị nhiễm virus, mất điện, hoặc hỏng ổ cứng khi bạn chỉ có **0–5 giờ/tuần** sẽ trở thành cổ chai bóp nghẹt công ty 1 người. Bạn đang đánh đổi **chi phí hỗ trợ kỹ thuật đầu cuối (on-site IT support)** để lấy **sự an tâm dữ liệu của chủ vựa**. Để sống sót qua đánh đổi này mà không vi phạm ràng buộc on-prem, bạn bắt buộc phải bán kèm tầng 3 (`MOD-PRO-03: E2EE Cloud Backup Vault` trong `src/saas/open-core-edition-manifest.ts`) và tự động hóa việc cập nhật qua script từ xa ngay từ vựa thứ 3.
2. **Đánh đổi từ việc đặt cuộc gặp Hùng Hậu vào đường găng (Done means #5) dù Hùng Hậu không làm sầu riêng:**
   - Chuẩn bị tài liệu, đi lại và đàm phán cơ chế referral với một tập đoàn đa ngành như Hùng Hậu sẽ tiêu tốn một phần đáng kể trong quỹ 0–5 giờ/tuần của bạn, trong khi tỷ lệ chuyển đổi ra khách hàng vựa sầu riêng trực tiếp từ Hùng Hậu có thể bằng 0. Bạn chấp nhận chi phí cơ hội này để đổi lấy **cơ hội tiếp cận mạng lưới thương nhân Trung Quốc và uy tín thương hiệu Quốc gia của Hùng Hậu**.
3. **Đánh đổi từ việc khóa cứng các tầng doanh thu 5–7 (Marketplace, Escrow, Trade Finance, mở rộng MY/TH/PH) trong 12 tháng đầu:**
   - Như đã chứng minh trong `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, trần thị trường SaaS thuần túy tại Việt Nam chỉ đạt tối đa **$657.643 ARR** (281 vựa × 60M VND). Khóa các tầng 5–7 và khóa mở rộng ASEAN trong 12 tháng đầu đồng nghĩa với việc **trong năm đầu tiên, theo định nghĩa toán học, bạn không thể chạm mốc $1M ARR**. Bạn đánh đổi tốc độ chạm $1M ARR trên giấy để lấy sự sống còn thực tế của 10–30 vựa trả tiền thật ở tầng 1–4.
4. **Điều kiện làm khuyến nghị này hết đúng và cái giá phải trả nếu đổi hướng:**
   - **Khi nào khuyến nghị hết đúng:**
     - *Trường hợp A (Thất bại tại vựa):* Vựa Cai Lậy đạt KPI `< 5.0 phút` và bắt 100% lỗi gài mù, nhưng từ chối trả 5.000.000 VND phí pilot hoặc 60.000.000 VND/năm (vi phạm **Kill Criterion #1 – WTP Failure**), hoặc nhân viên vựa vẫn quay về dùng Zalo/Excel làm nguồn sự thật (**Kill Criterion #2**).
     - *Trường hợp B (Thất bại kênh đối tác):* Sau 90 ngày kể từ khi ký biên bản Referral với Hùng Hậu, kênh Hùng Hậu mang về **0 khách hàng sầu riêng trả tiền**.
   - **Cái giá phải trả nếu lúc đó đổi hướng:**
     - Nếu xảy ra *Trường hợp A*: Bạn mất khoảng 6–8 tuần chuẩn bị pilot và vài triệu đồng chi phí thiết lập OTP/đi lại (vốn tự có nhóm A), nhưng **mất 0 đồng nợ nần và 0 dòng code thừa** vì chưa xây cổng thanh toán hay marketplace. Lúc đó, bạn phải chuyển hướng sang bán trực tiếp cho **Doanh nghiệp Xuất khẩu (Exporter) hoặc Thương nhân Trung Quốc (Buyer)** — những người chịu thiệt hại trực tiếp 1,5–2 tỷ VND khi container bị trả về — và yêu cầu họ ép ngược vựa đóng gói phải dùng DuriOS.
     - Nếu xảy ra *Trường hợp B*: Nhờ đã cài sẵn **Nhánh Dự Phòng 90 Ngày** từ tháng thứ 5, chi phí chuyển hướng gần như bằng 0; bạn chỉ việc cắt thời gian họp với Hùng Hậu và dồn 100% quỹ 0–5 giờ/tuần vào kênh đại lý hải quan, phòng Lab kiểm nghiệm Cadimi và chuỗi vựa lân cận tại Cai Lậy.

---

## 8. Unverified

Dưới đây là ranh giới rõ ràng giữa **bằng chứng đã xác minh trong kho mã** và **những điều chưa thể kiểm chứng** (kèm nơi đã kiểm tra và cách kiểm chứng):

1. **Chưa kiểm chứng được bất kỳ cổng `GATE-01..05` nào đạt trạng thái PASS với dữ liệu thực địa:**
   - *Nơi đã xem:* `src/auth/pilot-launch-gate-verifier.ts` (dòng 38–65) và `.mekong/company.json` (dòng 34–44).
   - *Bằng chứng hiện tại:* Code kiểm tra sự tồn tại của tệp `DURIOS_GATE01_CONSENT_FILE`, cấu hình `DURIOS_OTP_PROVIDER`, loopback `127.0.0.1`, thư mục `DURIOS_BACKUP_DIR` và kết quả KPI; nhưng trên môi trường thực tế hiện chưa có biên bản DPA đã ký của vựa Cai Lậy và chưa cấu hình OTP thật.
   - *Cái gì sẽ kiểm chứng được:* Chạy `bun run pilot:verify-gates` với biến môi trường trỏ tới file DPA đã ký thật và thư mục backup thật, kết quả trả về JSON có `"goForLiveCustomerData": true` và `"passedCount": 5`.
2. **Chưa kiểm chứng được phép đo 4 chỉ số giá trị mở rộng (`FirstContainerValueMetrics`) trên toàn bộ 5 container thực địa:**
   - *Nơi đã xem:* `src/auth/pilot-kpi-extended-types.ts` (dòng 17–68) và `src/auth/pilot-kpi-evaluator.ts` (dòng 49).
   - *Bằng chứng hiện tại:* Hàm `evaluateFirstContainerValueMetrics()` đã được gọi trong `computeGate05KpiFromDossiers()`, nhưng **chỉ được gọi cho phần tử đầu tiên `dossiers[0]!`**, và thời gian thực tế (`calculateActualDuration`) đang tính từ `updatedAt - createdAt` với hằng số giả định `MANUAL_BASELINE_MINUTES = 35` và `PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION = 35_000_000`.
   - *Cái gì sẽ kiểm chứng được:* Nhật ký bấm giờ thực địa trên 5 container thật tại vựa Cai Lậy và đầu ra của `bun run pilot:evaluate-kpi` sau khi nạp 5 container đó.
3. **Chưa kiểm chứng được các bộ quy tắc ASEAN (`MY_CN`, `TH_CN`, `PH_CN`) có thực sự chạy trong luồng kiểm tra hồ sơ (validation engine) hay không:**
   - *Nơi đã xem:* `src/rules/asean-corridor-adapters.ts`, `src/rules/deterministic-engine.ts`, và chạy lệnh `grep -rn "getAseanCorridorProtocol\|ASEAN_CORRIDOR_REGISTRY" src/`.
   - *Bằng chứng hiện tại:* `ASEAN_CORRIDOR_REGISTRY` định nghĩa đúng các thông số (như `minimumDryMatterPct: 32` cho `TH_CN`), nhưng **không có hàm evaluator nào trong `src/rules/` gọi `getAseanCorridorProtocol()` khi chạy `handleRunValidation`**. Đây hiện mới là danh mục dữ liệu tĩnh (catalog), chưa phải bộ chặn lỗi thực thi.
   - *Cái gì sẽ kiểm chứng được:* Chỉ kiểm chứng được khi nối `getAseanCorridorProtocol()` vào `src/rules/deterministic-engine.ts` và có bộ hồ sơ mẫu của Thái Lan / Malaysia (nằm ngoài phạm vi 12 tháng đầu).
4. **Chưa kiểm chứng được thiện chí hợp tác, mạng lưới khách hàng liên quan đến sầu riêng và sự đồng thuận về mức phí referral 10–15% của Hùng Hậu Holdings:**
   - *Nơi đã xem:* Dữ kiện do người dùng cung cấp trong gói bằng chứng (Hùng Hậu thành lập 2010, Chủ tịch Trần Văn Hậu, Thương hiệu Quốc gia 6 lần, mảng nông nghiệp cá tra/điều/cà phê/Happy Food, không có sầu riêng).
   - *Bằng chứng hiện tại:* Đây là thông tin và mối quan hệ cá nhân do bạn cung cấp, hoàn toàn chưa có văn bản, email hay biên bản làm việc nào trong kho lưu trữ.
   - *Cái gì sẽ kiểm chứng được:* Biên bản cuộc họp (Meeting Minutes / MOU) có chữ ký hoặc xác nhận qua email/tin nhắn chính thức của đại diện có thẩm quyền phía Hùng Hậu sau buổi gặp ở Tháng 5.
5. **Chưa kiểm chứng được sự sẵn sàng chi trả (WTP) của chủ vựa Cai Lậy ở cả 3 mức giá (5M VND pilot, 60M VND/năm, 150k VND/container):**
   - *Nơi đã xem:* `.mekong/company.json` (dòng 30) và `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`.
   - *Bằng chứng hiện tại:* Tài liệu ghi rõ đây là giả thuyết giá ("pricing hypotheses"), chưa có hợp đồng hay hóa đơn thực tế nào.
   - *Cái gì sẽ kiểm chứng được:* Sao kê ngân hàng / biên lai thu tiền 5.000.000 VND đầu tiên từ chủ vựa `SITE-CAILAY-TIENGIANG-01`.

---

## 9. Work checklist, success metrics & handoff brief

### Work Checklist (Theo đúng thứ tự thực thi 6 tháng)

- [ ] **Bước 1 (Tuần 1–2): Chuẩn bị pháp lý & kênh thu tiền thủ công (Zero-Code Billing).** Soạn bộ DPA song ngữ VI+EN (1 trang) theo Luật DLCN 91/2025/QH15, Phiếu đề nghị Pilot 5.000.000 VND / 5 container kèm mã VietQR ngân hàng, và tạo cặp khóa Ed25519 thương mại lưu ngoại tuyến an toàn để cấp `DURIOS_SAAS_LICENSE_KEY`.
- [ ] **Bước 2 (Tuần 3–6): Mở khóa `GATE-01` đến `GATE-04` cho `SITE-CAILAY-TIENGIANG-01`.** Ký DPA với chủ vựa Cai Lậy và đặt vào `DURIOS_GATE01_CONSENT_FILE`; cấu hình Zalo ZNS/SMS OTP thật (`DURIOS_OTP_PROVIDER`); xác nhận máy tại vựa chạy `DURIOS_HOST=127.0.0.1`; chạy sao lưu ra `DURIOS_BACKUP_DIR` và kiểm tra khôi phục thành công.
- [ ] **Bước 3 (Tuần 7–8): Mở khóa `GATE-05` & xác nhận `goForLiveCustomerData === true`.** Chạy diễn tập với `bun run pilot:verify-gates` và `bun run pilot:audit-pack`, đảm bảo đủ 5/5 cổng PASS trước khi chạm vào bất kỳ tờ chứng từ thật nào của khách hàng.
- [ ] **Bước 4 (Tháng 3–4): Thực thi Pilot 5 container thật + 2 lỗi gài mù tại vựa Cai Lậy.** Đưa 5 container thật vào DuriOS, để nhân viên vựa trực tiếp bấm xác minh HITL, gài 2 lỗi mù (sai số chì seal / sai ngưỡng Cadimi hoặc thiếu xác minh), đo thời gian đối soát trung bình số học `< 5.0 phút` và bắt `100%` lỗi gài mù.
- [ ] **Bước 5 (Cuối Tháng 4): Xuất gói niêm phong SHA-256 & Thu 5.000.000 VND đầu tiên.** Xuất 5 bộ `DossierExportManifest` ở trạng thái `EXPORTED` (`isImmutable === true`), kiểm tra bằng `bun run verify:manifest`, xuất biên lai thu tiền hợp lệ 5.000.000 VND và cấp khóa `PACKHOUSE_PRO_SAAS` nếu vựa nâng cấp lên gói năm (60M VND) hoặc gói pay-go (150k VND/container).
- [ ] **Bước 6 (Tháng 5): Họp với lãnh đạo Hùng Hậu Holdings cùng Bộ Bằng Chứng Thực Địa.** Trình bày kết quả thực tế từ 5 container tại Cai Lậy, chốt và ký biên bản ghi nhận cơ chế **Referral Fee (10–15% năm đầu, giảm dần về 5%)**, giữ nguyên quyền sở hữu khách hàng và thương hiệu DuriOS (không white-label).
- [ ] **Bước 7 (Tháng 5–6): Kích hoạt Nhánh Dự Phòng 90 Ngày tại cụm Cai Lậy.** Gửi gói kiểm chứng `standalone-manifest-verifier` cho phòng Lab và đại lý hải quan phục vụ vựa số 1, đề xuất chia sẻ phí giới thiệu tương đương để tiếp cận thêm 3–5 vựa đóng gói sầu riêng tại Cai Lậy mà không phụ thuộc vào tiến độ của Hùng Hậu.

### Success Metrics (Kiểm chứng được bằng lệnh, con số hoặc trạng thái)

| Hạng mục | Cách kiểm chứng (Lệnh / Tệp / Bằng chứng) | Giá trị mục tiêu bắt buộc |
|---|---|---|
| **Toàn vẹn mã nguồn & Test** | Chạy `bun test && bun run typecheck` tại `/Users/macbook/durios` | `0 fail` (230+ tests pass), `0 TypeScript errors`, `0` file vượt 100 LOC |
| **Cổng an toàn trước Go-Live** | Chạy `bun run pilot:verify-gates` (`src/auth/pilot-launch-gate-verifier.ts`) | `"passedCount": 5`, `"totalGates": 5`, `"goForLiveCustomerData": true` (`GATE-01..05` đều `"PASS"`) |
| **Tốc độ đối soát 5 container thật** | Chạy `bun run pilot:evaluate-kpi` (`src/auth/pilot-kpi-evaluator.ts`) | `"reconciledCount": 5`, `"meanDeltaSeconds" < 300` (Arithmetic Mean < 5.0 phút), `"underFiveMinuteGate": true` |
| **Tỷ lệ bắt lỗi gài mù** | Trường `blindFaultsCaught / blindFaultCount` trong `Gate05KpiEvaluationReport` | `"blindFaultCount" >= 2`, `"blindFaultsCaught" === "blindFaultCount"` (100%), `"zeroMissGate": true` |
| **Gói niêm phong SHA-256** | Chạy `bun run verify:manifest` trên 5 file manifest xuất từ 5 container thật | `5/5` container ở trạng thái `EXPORTED`, `isImmutable: true`, khớp 100% `compositeManifestSha256` |
| **Doanh thu thực thu đầu tiên** | Biên lai thu tiền / Sao kê ngân hàng + trạng thái `GET /api/v1/saas/status` | Thu thực tế `>= 5.000.000 VND` (phí pilot) hoặc `60.000.000 VND/năm`; `licenseValid: true` với khóa Ed25519 |
| **Thỏa thuận Hùng Hậu & Dự phòng 90 ngày** | Biên bản họp / MOU đã ký + Nhật ký kênh dự phòng Cai Lậy | `1` biên bản ghi rõ Referral Fee `10–15% → 5%` (0 white-label) + tiếp cận tối thiểu `3` vựa mới tại Cai Lậy trong 90 ngày |

### Handoff Brief

```text
Objective:
Đưa DuriOS tại /Users/macbook/durios vượt qua toàn bộ 5 cổng an toàn thực địa (GATE-01..05) tại vựa sầu riêng Cai Lậy (SITE-CAILAY-TIENGIANG-01), hoàn thành đối soát và niêm phong SHA-256 cho 5 container thật với thời gian trung bình số học < 5.0 phút và bắt 100% lỗi gài mù, thu khoản tiền hợp lệ đầu tiên (5.000.000 VND pilot -> 60.000.000 VND/năm hoặc 150.000 VND/container), đồng thời chốt biên bản hợp tác giới thiệu (Referral Fee 10-15% giảm về 5%, không white-label) với Hùng Hậu kèm phương án dự phòng 90 ngày để tiến tới mục tiêu $1M ARR theo mô hình công ty 1 người (OPC).

Done means:
1. GATE-01 đạt PASS thông qua Biên bản Chấp thuận Xử lý Dữ liệu (DPA) đã ký hợp lệ theo Luật DLCN 91/2025/QH15 (và toàn bộ GATE-01..05 đạt PASS với goForLiveCustomerData === true).
2. Xử lý hoàn chỉnh 5 container sầu riêng thật của vựa tại Cai Lậy trên hệ thống on-prem SQLite.
3. Thời gian đối soát trung bình số học (Arithmetic Mean) trên 5 container < 5.0 phút (meanDeltaSeconds < 300) và bắt được 100% lỗi gài mù (zeroMissGate === true).
4. Xuất đủ 5 gói hồ sơ niêm phong mật mã SHA-256 (DossierExportManifest) hợp lệ cho 5 container đó, kiểm chứng độc lập thành công qua standalone-manifest-verifier.
5. Buổi gặp với lãnh đạo Hùng Hậu diễn ra và có biên bản ghi rõ cơ chế phí giới thiệu (referral fee 10-15% năm đầu giảm dần về 5%), DuriOS giữ 100% quyền sở hữu khách hàng và sản phẩm (không white-label).
6. Có biên lai thu tiền hợp lệ đầu tiên từ khách hàng (tối thiểu 5.000.000 VND từ gói Pilot 5 container).

Out of scope:
- Không mở sàn giao dịch B2B công khai (public marketplace) và không nối NonCustodialEscrowCoordinator vào HTTP router trong 12 tháng đầu.
- Không giữ tiền hộ hay trung gian thanh toán (strictly Zero-Custody theo Nghị định 52/2024/NĐ-CP).
- Không chuyển đổi sang kiến trúc Multi-Tenant Cloud SaaS.
- Không cho phép AI tự động phê duyệt xuất khẩu (bắt buộc HITL sign-off).
- Không triển khai mở rộng sang Malaysia (MY_CN), Thái Lan (TH_CN), Philippines (PH_CN) hay các thị trường JP/KR/EU trong giai đoạn này.
- Không xây dựng các tầng doanh thu 5-7 (Escrow fee, Trade-Finance API, Logistics/Lab API integration) trước khi hoàn thành 6 tiêu chí Done means.

Constraints:
- Vận hành theo mô hình Công ty 1 Người (OPC), quỹ thời gian làm việc thực địa 0-5 giờ/tuần, tự chủ vốn (bootstrap theo thứ tự A -> B -> C -> D).
- Giữ nguyên máy chủ lắng nghe trên loopback 127.0.0.1 với bun:sqlite (WAL + FK).
- Tuân thủ kỷ luật mã nguồn: Bun 1.3.14, TypeScript strict, không dùng kiểu :any, trần tối đa 100 LOC/file, ESM import có đuôi .js, tên file kebab-case.
- Không nạp bất kỳ dữ liệu khách hàng thật nào khi chưa đạt đủ 5/5 cổng GATE-01..05.
- Tài liệu và giao diện hướng tới khách hàng/người vận hành phải song ngữ Việt - Anh (VI+EN) dễ hiểu.
- Không bao giờ lưu trữ hoặc commit khóa bí mật (Ed25519 private key, API tokens, dữ liệu cá nhân) vào git.

Stop and ask only if:
1. Vựa Cai Lậy từ chối ký DPA (GATE-01) hoặc từ chối trả phí Pilot 5.000.000 VND ngay cả khi hệ thống chứng minh đối soát < 5.0 phút và bắt 100% lỗi gài mù (chạm Hard Kill Criterion #1 hoặc #4).
2. Phát hiện lỗi gài mù bị lọt qua bộ quy tắc kiểm định (zeroMissGate === false, chạm Hard Kill Criterion #3) hoặc thời gian đối soát trung bình số học >= 5.0 phút sau khi đã tối ưu thao tác.
3. Đối tác Hùng Hậu hoặc vựa khách hàng yêu cầu điều khoản độc quyền, chuyển giao mã nguồn, white-label, hoặc yêu cầu DuriOS đứng ra nhận/giữ tiền đặt cọc giao dịch hàng hóa.
```

---

## Phụ Lục Thẩm Định Độc Lập (--ultra Best-of-5 Verifier)

Quy trình thẩm định đa mẫu `--ultra` đã tiến hành tạo song song 5 bản dự thảo tư vấn độc lập (Candidate A..E) từ cùng một gói bằng chứng bất biến (gồm 6 điều kiện Done means, 9 Hard Kill Criteria, và các ràng buộc pháp lý/kỹ thuật của DuriOS). Verifier độc lập `kongming` (vận hành trên mô hình `fable`) đã chấm điểm chi tiết trên thang 1–20 cho 4 tiêu chí cốt lõi (tối đa 80 điểm):

1. **Tiêu chí 1: Tuân thủ tuyệt đối khung yêu cầu đã xác nhận** (Faithfulness to Confirmed Reframing).
2. **Tiêu chí 2: Căn cứ bằng chứng mã nguồn & thực địa** (Evidence Grounding).
3. **Tiêu chí 3: Tính trung thực của các đánh đổi** (Honesty of Trade-offs).
4. **Tiêu chí 4: Tính khả thi của Checklist, Success Metrics & Handoff Brief** (Actionability).

### Bảng Xếp Hạng 5 Ứng Viên

| Ứng viên (Mã hóa ẩn danh) | Tiêu chí 1 (20) | Tiêu chí 2 (20) | Tiêu chí 3 (20) | Tiêu chí 4 (20) | Tổng điểm (80) | Xếp hạng | Trạng thái |
|---|---|---|---|---|---|---|---|
| **Candidate C (Slot 5)** | **20** | **20** | **19** | **20** | **79 / 80** | **Hạng 1 (Winner)** | **CHỌN DUY NHẤT** |
| Candidate E (Slot 4) | 17 | 18 | 18 | 18 | 71 / 80 | Hạng 2 | Loại (Runner-up) |
| Candidate A (Slot 3) | 19 | 15 | 18 | 18 | 70 / 80 | Hạng 3 | Loại |
| Candidate B (Slot 1) | 14 | 13 | 16 | 15 | 58 / 80 | Hạng 4 | Loại |
| Candidate D (Slot 2) | 12 | 12 | 16 | 13 | 53 / 80 | Hạng 5 | Loại |

### Lý Do Candidate C Chiến Thắng Tuyệt Đối (Unanimous Winner)

- **Độ sâu và độ chuẩn xác về mã nguồn:** Candidate C là ứng viên duy nhất phân tích chính xác từng dòng code then chốt: chỉ ra dòng 49 trong `src/auth/pilot-kpi-evaluator.ts` chỉ tính toán cho `dossiers[0]!`, phát hiện `calculateActualDuration()` trong `src/auth/pilot-kpi-extended-types.ts` có giá trị fallback `4.0` phút, và xác minh `ASEAN_CORRIDOR_REGISTRY` trong `src/rules/asean-corridor-adapters.ts` là bảng tĩnh không có caller nào trong `src/rules/deterministic-engine.ts`. Các ứng viên khác hoặc bỏ sót, hoặc nhầm lẫn rằng 4 chỉ số KPI chưa từng được viết vào file evaluator.
- **Tuân thủ đúng tôn chỉ OPC 1 người & Zero-Code Billing:** Candidate C đưa ra giải pháp thực tế nhất: không viết thêm dòng code thanh toán tự động nào vào `http-router.ts`, mà dùng chuyển khoản VietQR + hàm `createSignedSaasLicenseKey()` Ed25519 có sẵn trong `src/saas/saas-tier-policy.ts` để cấp quyền cho vựa.
- **Kênh đối tác trung thực:** Chỉ rõ Hùng Hậu không buôn sầu riêng và thiết kế ngay cơ chế chia sẻ phí giới thiệu Referral MOU (10–15% giảm dần về 5%) cùng Nhánh Dự Phòng 90 Ngày qua phòng kiểm nghiệm Cadimi và đại lý hải quan tại cửa khẩu.

ultra: picked=5/5 margin=high unanimous=yes rejected_all=no
