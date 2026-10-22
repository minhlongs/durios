# DuriOS 25-Step Company Blueprint Task Checklist

- **Dự án / Project:** DuriOS (`durios-core`) — Operating System for Verified Durian Trade
- **Baseline Date:** 2026-10-22
- **Last Updated:** 2026-10-22 (làm mới toàn bộ 25 bước theo bằng chứng tại ngày 22/10/2026; sửa phép tính Bear/Base/Bull và bổ sung nguồn trích dẫn số liệu thị trường)

**Chú giải trạng thái (Status Key):**
- `[COMPLETED]` — Hạng mục blueprint đã được **biên soạn** (marker checklist đã đánh dấu và artifact tồn tại).
- `[IN_PROGRESS]` — Đang triển khai thực tế, chưa đóng.
- `[BLOCKED_BY_GATE]` — Bị chặn bởi một launch gate chưa đạt (GATE-01..05).
- `[PENDING]` — Chưa bắt đầu hoặc chờ điều kiện tiên quyết.

**Nhãn trạng thái thực thi (dùng trong từng bước):**
`[Đã có code]` (mã nguồn tồn tại) | `[Đã kiểm thử tổng hợp]` (qua test tự động / staging, chưa phải thực địa) | `[Đang chờ điều kiện]` (chặn bởi phê duyệt, hợp đồng hoặc năng lực pháp lý) | `[Giả thuyết]` (chưa kiểm chứng thị trường) | `[Mục tiêu]` (định hướng dài hạn) | `[Chưa được xác minh]` (không có bằng chứng trong repo).

**Cam kết trung thực — đọc trước khi dùng tệp này:**
Dấu `[x]` trong checklist chỉ xác nhận **mục blueprint đã được biên soạn**. Nó KHÔNG có nghĩa là bước đó đã thực thi xong. Trạng thái thực thi nằm ở dòng *Trạng thái thực thi* của từng bước và trong `plan.md`. Lệnh `bun run blueprint:verify-25-steps` báo 25/25 chỉ đo **độ phủ artifact** (có marker heading `## N.` trong `plan.md`, có marker `- [x] **Step N:` tại đây, và tệp artifact tồn tại) — nó không chứng minh bằng chứng thực địa, hợp đồng hay doanh thu.

**Bối cảnh bằng chứng tại 2026-10-22:** Địa điểm `SITE-CAILAY-TIENGIANG-01` (Cai Lậy, Tiền Giang) đã được Founder chọn và phê duyệt ngày 17/10/2026. Tài liệu V1 (`PRODUCT-PRD-V1.md`, `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md`) là baseline đã duyệt ngày 14/10/2026; tài liệu V2 ở trạng thái `DRAFT_FOR_FOUNDER_REVIEW`. Trạng thái cổng: GATE-01 `PENDING SIGN-OFF`; GATE-02 `ADAPTER READY / PENDING CREDENTIALS` (fail-closed, trả 503 khi chưa cấu hình); GATE-03 `RUNBOOK & CONFIG VERIFIED`; GATE-04 `VERIFIED IN STAGING TESTS ONLY`; GATE-05 `PROVEN ONLY ON SEEDED/SYNTHETIC REHEARSAL` (`src/auth/pilot-rehearsal-seeder.ts` + `test/pilot-rehearsal-seeder.test.ts`). Hiện chưa tồn tại dữ liệu hợp đồng, doanh thu, khách hàng hay retention nên mọi tuyên bố tương ứng mang nhãn `[Chưa được xác minh]`.

---

## Phase 1 — Foundation & Open-Core Architecture (Bước 1–5)

- [x] **Step 1: Khung Open-Core Master Framework**
  - *Artifacts:* `src/saas/open-core-edition-manifest.ts`, `src/saas/saas-tier-policy.ts`, `LICENSE`, `LICENSE-MIT`, `COMMERCIAL-LICENSE.md`
  - *Trạng thái thực thi:* `[Đã có code]` — Bảng edition (`COMMUNITY_OPEN_CORE`, `PACKHOUSE_PRO_SAAS`, `EXPORTER_ENTERPRISE`) và các module đã được mã hoá; đã qua kiểm thử tổng hợp 15/15 lượt deep audit. Đây là bằng chứng kỹ thuật, không phải bằng chứng thương mại.
  - *Việc tiếp theo:* Đối chiếu module trong manifest với bản đồ dependency thực tế, loại module không có caller production.

- [x] **Step 2: Làm mới kế hoạch trung thực & thực trạng thị trường 2026**
  - *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/DURIOS-STRATEGY-V2.json`
  - *Trạng thái thực thi:* `[Đã có code]` — Số liệu thị trường và trần ARR đã được ghi có nguồn, có ngày công bố. Xem mục "Nguồn số liệu thị trường" ở cuối tệp.
  - *Việc tiếp theo:* Đối chiếu lại số liệu mỗi khi Bộ NN&MT công bố báo cáo mới; ghi ngày công bố kèm mọi trích dẫn.

- [x] **Step 3: Hệ điều hành Agentic & quản trị Human-in-the-Loop**
  - *Artifacts:* `src/verification/hitl-service.ts`, `src/auth/rbac-policy.ts`, `AGENTS.md`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — Phê duyệt của con người bắt buộc trên hành động nhạy cảm đã có unit test; AI không được tự phê duyệt xuất khẩu. Chưa có bằng chứng vận hành thực địa.
  - *Việc tiếp theo:* Chứng minh ràng buộc HITL trên một chuỗi thủ tục đầy đủ tại staging.

- [x] **Step 4: Sẵn sàng pilot & baseline bằng chứng kiểm toán (GATE-01 đến GATE-05)**
  - *Artifacts:* `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `src/export/field-auditor-cli.ts`, `src/auth/pilot-launch-gate-verifier.ts`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Công cụ lập báo cáo niêm phong SHA-256 đã có và fail-closed; nhưng GATE-01 và GATE-02 chưa đạt, GATE-04 và GATE-05 mới chỉ kiểm thử staging/mô phỏng.
  - *Việc tiếp theo:* Chạy `bun run pilot:audit-pack -- --verify` trên thư mục dữ liệu/backup thật và ghi rõ PASS/FAIL từng cổng kèm bằng chứng.

- [x] **Step 5: Lộ trình tuần tự 5 chặng có điều kiện**
  - *Artifacts:* `docs/product-direction/PRODUCT-PRD-V2.md`, `docs/product-direction/PRODUCT-PRD-V1.md`
  - *Trạng thái thực thi:* `[Mục tiêu]` — Trình tự Stage 0 → 4 đã được tài liệu hoá; điều kiện chuyển chặng (3 vựa thanh toán độc lập, lỗi cài đặt <5%, chi phí hỗ trợ <15% doanh thu thuê bao) chưa có số liệu đo.
  - *Việc tiếp theo:* Gắn tiêu chí thoát định lượng cho từng chặng; đánh giá lại sau kết quả pilot.

---

## Phase 2 — Business Model & Unit Economics (Bước 6–7)

- [x] **Step 6: Sự thật kinh tế trước & đống doanh thu đa lớp**
  - *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/DURIOS-STRATEGY-V2.json`, `src/saas/open-core-deep-introspector.ts`
  - *Trạng thái thực thi:* `[Giả thuyết]` — Trần ~$657.643 ARR và kết luận bắt buộc đa doanh thu là suy luận đúng trên số liệu đã công bố; ba mức giá (5.000.000 VND/5 container, 60.000.000 VND/năm, 10.000.000 VND thiết lập) là giả thuyết chờ kiểm chứng. Doanh thu một lần được ghi riêng, không cộng vào ARR. Kịch bản Bear/Base/Bull là giả thuyết, chưa đo.
  - *Việc tiếp theo:* Mở nhật ký nhu cầu và mức giá chấp nhận được tại thực địa để kiểm chứng ba mức giá.

- [x] **Step 7: Ba nhóm người mua & người vận hành (Tri-Triple Personas)**
  - *Artifacts:* `src/auth/rbac-policy.ts`, `test/tri-tuple-persona-rbac.test.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Năm vai trò đã mã hoá và có test; chưa có phép đo trên người dùng thật.
  - *Việc tiếp theo:* Xác nhận ba nhóm persona bằng trao đổi với chủ vựa trong tuần đầu pilot.

---

## Phase 3 — Brand, Open-Source Community & Content (Bước 8–12)

- [x] **Step 8: Định vị danh mục (Category Positioning)**
  - *Artifacts:* `docs/product-direction/PRODUCT-VISION-V2.md`
  - *Trạng thái thực thi:* `[Đã có code]` — Định vị "Operating System for Verified Durian Trade" đã được ghi nhất quán trong tài liệu.
  - *Việc tiếp theo:* Giữ định vị thống nhất trong mọi tài liệu đối ngoại và gọi vốn.

- [x] **Step 9: Tài liệu mã nguồn mở song ngữ & MIT Verifier**
  - *Artifacts:* `README.md`, `src/export/standalone-manifest-verifier.ts`, `test/saas-cloud-connectors.test.ts`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — SDK xác minh độc lập (MIT) đã có test; chưa có đối tác nước ngoài dùng thử thật.
  - *Việc tiếp theo:* Xin bằng chứng một bên nhập khẩu/hải quan dùng thử SDK.

- [x] **Step 10: Tường thuật liên minh, ưu tiên quyền riêng tư**
  - *Artifacts:* `src/sharing/verified-org-profile.ts`, `src/sharing/dossier-redactor.ts`, `src/storage/schema-migrations-share-purposes.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Cơ chế `ShareAccessGrant` và che trường nhạy cảm đã mã hoá; chưa kiểm thử rò rỉ trên dữ liệu thật.
  - *Việc tiếp theo:* Kiểm tra rò rỉ trường nhạy cảm trên dữ liệu pilot.

- [x] **Step 11: Chứng minh thực địa trước & kiểm thử gài lỗi mù**
  - *Artifacts:* `src/auth/pilot-rehearsal-seeder.ts`, `test/pilot-rehearsal-seeder.test.ts`, `src/auth/pilot-kpi-evaluator.ts`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — Hai kịch bản gài lỗi mù đã bị bắt 100% và Arithmetic Mean < 5.0 phút **trên dữ liệu mô phỏng (seeded rehearsal)**; chưa phải diễn tập với chứng từ thật.
  - *Việc tiếp theo:* Lặp lại đúng quy trình trên chứng từ thật ở GATE-05.

- [x] **Step 12: Giao thức bằng chứng case study**
  - *Artifacts:* `src/auth/pilot-kpi-extended-types.ts`, `src/auth/pilot-kpi-evaluator.ts`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Bốn chỉ số giá trị (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`) đã có kiểu dữ liệu; **chưa có phép đo thực địa nào**.
  - *Việc tiếp theo:* Hoàn thiện phép đo và nhật ký nhu cầu trước khi chạy pilot.

---

## Phase 4 — Revenue & Conversion Engine (Bước 13–15)

- [x] **Step 13: Tín hiệu nâng cấp Community lên Pro**
  - *Artifacts:* `src/saas/saas-tier-policy.ts`, `src/saas/open-core-edition-manifest.ts`, `test/open-core-saas-monetization.test.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Tín hiệu nâng cấp khi vựa Community cần Zalo ZNS tự động, sao lưu đám mây E2EE hoặc đối soát đa thị trường (`JP`, `KR`, `EU`) đã mã hoá và có test.
  - *Việc tiếp theo:* Đo tỷ lệ chuyển đổi thực tế sau pilot; hiện chưa có dữ liệu.

- [x] **Step 14: Phễu chuyển đổi có chữ ký Workspace Portability**
  - *Artifacts:* `src/saas/workspace-portability-bundle.ts`, `src/server/open-core-portability-handler.ts`, `test/open-core-workspace-portability.test.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Xuất và xác minh gói portability qua API đã có test; không rò rỉ bí mật.
  - *Việc tiếp theo:* Thử chuyển một vựa thật lên Pro khi có hợp đồng.

- [x] **Step 15: Sách chơi GTM theo cụm dày đặc (Dense Cluster)**
  - *Artifacts:* `src/sharing/dense-cluster-readiness.ts`, `docs/pilot-readiness/05_DENSE_CLUSTER_GTM_PLAYBOOK.md`, `test/dense-cluster-gtm.test.ts`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Cổng fail-closed kéo từ vựa Cai Lậy: chưa đủ vựa đạt chuẩn thì không mở cụm 8 vựa + 3 exporter + 2 lab + 3 logistics + 5 nhà nhập khẩu.
  - *Việc tiếp theo:* Sau khi pilot 1 vựa thành công mới khảo sát vựa thứ hai.

---

## Phase 5 — Operations, Security & Readiness (Bước 16–21)

- [x] **Step 16: Chỉ số North Star & phễu**
  - *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `src/auth/pilot-kpi-evaluator.ts`, `src/server/ecosystem-rehearsal-handler.ts`
  - *Trạng thái thực thi:* `[Chưa được xác minh]` — Khung định nghĩa Verified GMV, Revenue per Verified Container, Gross Profit per Container, CAC Payback, Network Density đã có; **chưa có số liệu nào từ khách hàng thật** (không có doanh thu, GMV thực hay retention).
  - *Việc tiếp theo:* Thu thập chỉ số từ container đầu tiên sau GATE-05.

- [x] **Step 17: Tường thuật chiến lược & huy động vốn**
  - *Artifacts:* `docs/product-direction/PRODUCT-VISION-V2.md`, `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`
  - *Trạng thái thực thi:* `[Mục tiêu]` — Thang 6 bậc Moat (Workflow → Evidence → Outcome → Reputation → Network → ASEAN Regulatory Adapter) đã được viết.
  - *Việc tiếp theo:* Cập nhật câu chuyện khi có case study đầu tiên có số liệu.

- [x] **Step 18: IP bản quyền kép, giới hạn tốc độ & vệ sinh bí mật**
  - *Artifacts:* `src/server/tenant-rate-limiter.ts`, `.github/workflows/ci.yml`, `LICENSE-MIT`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — `TenantRateLimiter` 30 req/phút/tenant, phân tách `LICENSE`/`LICENSE-MIT`, quét `gitleaks` không rò rỉ, CI chặn tệp nhạy cảm.
  - *Việc tiếp theo:* Giữ nguyên quy tắc không commit secret, không commit tệp `.env`/`.db`/khóa.

- [x] **Step 19: Khả năng chống chịu on-premise & runbook sao lưu**
  - *Artifacts:* `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`, `src/auth/site-backup-manager.ts`, `test/process-restart-persistence.test.ts`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — Sao lưu SQLite WAL, khôi phục < 10 phút, ổ gắn ngoài mã hoá, secrets quyền `0600` đã kiểm thử trên staging; **chưa chứng minh trên Mini PC thật tại vựa**.
  - *Việc tiếp theo:* Chạy backup/restore trên phần cứng thật ở GATE-03 và GATE-04.

- [x] **Step 20: Đối chiếu cạnh tranh & chuẩn mực khu vực**
  - *Artifacts:* `src/rules/asean-corridor-adapters.ts`, `test/asean-corridor-and-verified-profile.test.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — Adapter `VN_CN`, `MY_CN`, `TH_CN`, `PH_CN` đã mã hoá; **chưa có thâm nhập thị trường nào** ngoài Việt Nam.
  - *Việc tiếp theo:* Không mở rộng ASEAN trước khi chứng minh được mô hình tại Việt Nam.

- [x] **Step 21: Phòng dữ liệu kiểm toán có bằng chứng**
  - *Artifacts:* `src/storage/sqlite-audit-ledger.ts`, `src/export/pilot-dossier-pack-compiler.ts`, `src/export/pilot-dossier-pack-formatter.ts`
  - *Trạng thái thực thi:* `[Đã kiểm thử tổng hợp]` — Sổ cái chuỗi băm SHA-256 và bộ dịch báo cáo niêm phong đã có test; báo cáo thật sẽ phát sinh khi chạy kiểm toán trên môi trường thật.
  - *Việc tiếp theo:* Niêm phong và lưu trữ từng báo cáo cổng sau khi có bằng chứng thật.

---

## Phase 6 — Execution, Legal Guardrails & Governance (Bước 22–25)

- [x] **Step 22: OKR theo quý**
  - *Artifacts:* `.mekong/company.json`, `src/saas/blueprint-25-step-auditor.ts`
  - *Trạng thái thực thi:* `[Đã có code]` — OKR Q4/2026 – 2028+ đã đồng bộ với company.json và phản ánh đúng trạng thái cổng hiện tại.
  - *Việc tiếp theo:* Rà soát OKR mỗi quý theo bằng chứng cổng, không theo cảm giác.

- [x] **Step 23: Quản trị sàn giao dịch khoá kép & zero-custody**
  - *Artifacts:* `src/marketplace/marketplace-guard.ts`, `src/marketplace/escrow-state-machine.ts`, `test/marketplace-escrow-guard.test.ts`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Bị khóa kép bởi `DURIOS_FEATURE_B2B_MARKETPLACE=enabled` VÀ `goForLiveCustomerData === true`; tuân thủ Nghị định `52/2024/NĐ-CP` và Luật Thương mại điện tử `122/2025/QH15`, không giữ tiền khách hàng.
  - *Việc tiếp theo:* Không mở cho đến khi có phê duyệt pháp lý và nhu cầu được chứng minh.

- [x] **Step 24: Bảo vệ dữ liệu cá nhân & tuyên bố pháp lý**
  - *Artifacts:* `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md`, `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`, `src/domain/pilot-types.ts`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Tuân thủ Luật `91/2025/QH15`; tách biệt `issuerClaimedStatus` và `duriosRecordStatus` (DuriOS không tự cấp chứng nhận hữu cơ). Quyết định chọn địa điểm đã được Founder phê duyệt ngày 17/10/2026, kèm 5 cổng và ranh giới an toàn bắt buộc.
  - *Việc tiếp theo:* Ký DPA (GATE-01) rồi chạy lại bộ kiểm tra cổng để xác nhận PASS.

- [x] **Step 25: Chin tiêu chí dừng cứng & sổ tay xử lý sự cố**
  - *Artifacts:* `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`, `docs/product-direction/STRATEGY-V2-BACKLOG.md`
  - *Trạng thái thực thi:* `[Đang chờ điều kiện]` — Chin tiêu chí (WTP failure, workflow rejection, missed blind faults, privacy refusal, buyer indifference, no repeat trades, subsidy dependency, CAC > 18 tháng, non-portable model) đã được viết; **chưa đủ dữ liệu để phán quyết bất kỳ tiêu chí nào**.
  - *Việc tiếp theo:* Đánh giá từng tiêu chí bằng số liệu thực địa sau pilot.

---

## Năm Ưu Tiên Thực Thi (Execution Priorities)

Thứ tự dưới đây là ưu tiên sáu tháng tới. Các sửa chữa công cụ nằm ở mục riêng phía sau, không phải ưu tiên.

| STT | Ưu tiên | Owner | Phụ thuộc | Tiêu chí hoàn thành |
|---|---|---|---|---|
| 1 | Xác minh hồ sơ launch gate bằng bằng chứng thật: chạy `bun run pilot:audit-pack -- --verify` trên dữ liệu/backup thật, ghi rõ từng cổng GATE-01..05 đạt hay chưa đạt, không suy đoán từ sự tồn tại của tệp | Engineering & Security | Quyền truy cập môi trường staging | Báo cáo niêm phong SHA-256 ghi rõ PASS/FAIL của cả 5 cổng kèm bằng chứng |
| 2 | Hoàn tất chấp thuận dữ liệu (GATE-01): ký biên bản chấp thuận xử lý dữ liệu (DPA) với chủ vựa Cai Lậy theo Luật `91/2025/QH15`, lưu tại đường dẫn `DURIOS_GATE01_CONSENT_FILE`, chạy lại bộ kiểm tra cổng | Governance & Legal | Đã có quyết định chọn site; tiếp cận được chủ vựa | `src/auth/pilot-launch-gate-verifier.ts` trả GATE-01 = PASS kèm biên bản đã ký |
| 3 | Xác thực OTP thật (GATE-02): đăng ký và cấu hình nhà cung cấp (Zalo ZNS / SMS Brandname), chứng minh vòng lặp gửi–nhận OTP thật trên staging cho tài khoản thật; hiện hệ thống fail-closed trả 503 | Engineering & Security | Ngân sách staging 3–5 triệu VND đã được Founder phê duyệt | GATE-02 = PASS và có log OTP thật cho một tài khoản thật |
| 4 | Chuẩn bị phép đo và nhật ký nhu cầu: hoàn thiện phép đo bốn chỉ số giá trị thực địa và mở nhật ký ghi nhận nhu cầu cùng mức giá chấp nhận được của chủ vựa | Product & Operations | Ưu tiên 1 và 2 (biết cổng nào còn hở) | Bảng phép đo chạy được trên dữ liệu mô phỏng; nhật ký nhu cầu đã mở |
| 5 | Chạy pilot sau khi đủ 5 cổng rồi quyết định thương mại/V2: chỉ nạp dữ liệu khách hàng thật khi `goForLiveCustomerData = true`; chạy đối soát 5 container thực địa với 2 lỗi gài mù, đo Arithmetic Mean < 5.0 phút, bắt 100% lỗi, xuất báo cáo niêm phong | Founder/CEO và Revenue & Customer Discovery | Ưu tiên 2, 3, 4 | GATE-05 = PASS trên dữ liệu thực địa; Founder có cơ sở để quyết định điều kiện thương mại và tiếp tục V2 |

---

## Công Việc Tiếp Theo (Tool Fixes & Follow-ups)

Các hạng mục dưới đây là việc kỹ thuật cần làm nhưng **không** thuộc năm ưu tiên trên.

- **Rà soát lại chuỗi migration V4→V6** trong `src/storage/schema-migrations.ts`: tại ngày 22/10/2026, lời gọi `applyMigrationV6` trong `src/storage/schema-migrations-share-purposes.ts` đã được nối đúng, `bun run typecheck` chạy sạch và `test/organic-and-purpose-5a4.test.ts` đạt 3/3 — nên ghi chú lỗi "có sẵn trước" trong bản trước đã lỗi thời và đã được gỡ. Việc cần làm chỉ còn là giữ nguyên thứ tự `V5` rồi `V6` khi thêm migration mới.
- **Hoàn tất Revenue Layer 6 (Trade-Finance & Marine Insurance Verified Dossier API):** `src/saas/financial-attestation-token.ts`, `src/saas/financial-attestation-service.ts`, `src/saas/financial-attestation-codec.ts`, `src/server/financial-verification-request.ts`, `src/server/financial-verification-view.ts`; đăng ký module `MOD-ENT-03` cho edition `EXPORTER_ENTERPRISE`. Vẫn giữ nhãn `[Giả thuyết]` cho đến khi có pilot trả tiền và phê duyệt pháp lý.
- **Kiểm chứng OTP và sao lưu/khôi phục trên phần cứng Mini PC thật**: hiện chỉ mô phỏng staging, chưa chạy trên thiết bị tại vựa.
- **Đo tỷ lệ chuyển đổi Community → Pro**: cần dữ liệu người dùng thật sau pilot.

---

## Điều Kiện Chặn (Blocking Conditions)

- **Không nạp dữ liệu khách hàng thật** cho đến khi cả 5 cổng GATE-01..05 đạt và `goForLiveCustomerData = true`.
- **Sàn B2B và ký quỹ vẫn bị khóa** (`DURIOS_FEATURE_B2B_MARKETPLACE` và quyết định go-live của con người).
- **Zero-custody tuyệt đối** theo Nghị định `52/2024/NĐ-CP` và Luật Thương mại điện tử `122/2025/QH15`: không giữ tiền của khách hàng ở bất kỳ hình thức nào.
- **AI không được tự phê duyệt xuất khẩu**: quyết định cuối cùng thuộc về con người (`HUMAN_VERIFIED` + sign-off của quản lý).
- **Mở rộng ASEAN và Revenue Layer 6 tiếp tục chờ điều kiện**: phụ thuộc bằng chứng thực địa tại Việt Nam và phê duyệt tương ứng.
- **$1M ARR là mục tiêu dài hạn**, không phải dự báo gần hạn; thuê bao SaaS đơn thuần trong nước không thể đạt mốc đó (xem mục nguồn số liệu bên dưới).

---

## Nguồn Số Liệu Thị Trường

| Chỉ số | Giá trị | Nguồn & thời điểm |
|---|---|---|
| Mã số vùng trồng sầu riêng | 1.599 | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 tại họp báo Chính phủ thường kỳ |
| Cơ sở đóng gói sầu riêng **đang hoạt động** | 281 | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 tại họp báo Chính phủ thường kỳ tháng 8 (phạm vi: cơ sở đóng gói sầu riêng đang hoạt động trên toàn quốc) — [nguồn](https://baochinhphu.vn/hop-bao-chinh-phu-thuong-ky-thang-8-dai-dien-bo-cong-an-lam-ro-nhieu-van-de-duoc-quan-tam-102260903170016698.htm) |
| Phê duyệt của GACC (mốc riêng) | 401 vùng trồng, 166 cơ sở đóng gói | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 — **trích dẫn riêng, KHÔNG cộng dồn vào 281 và 1.599** (khác mốc tham chiếu và cách thức đếm) |
| Kim ngạch xuất khẩu 2025 | ~3,85 tỷ USD | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 |
| Kim ngạch 8 tháng 2026 | ~1,97 tỷ USD | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 |
| Thị phần Trung Quốc | > 95% | Bộ Nông nghiệp & Môi trường, công bố ngày 03/09/2026 |
| Tỷ giá giả định | 25.637 VND/USD | Giả định kế hoạch (không phải tỷ giá niêm yết chính thức) |

**Phép tính trần doanh thu (giả thuyết giá):**
- Trần thuê bao trong nước: $281 \times 60.000.000\ \text{VND} = 16,86\ \text{tỷ VND} \approx \$657.643\ \text{ARR}$ ở tỷ giá 25.637 VND/USD.
- Số cơ sở cần thiết để đạt $1M ARR ở mức 60.000.000 VND/năm: $1.000.000 \times 25.637 / 60.000.000 = 427,28$ → làm tròn lên **428 cơ sở** (không thể bán nửa cơ sở).
- **428 > 281**: ngay cả chiếm 100% thị phần trong nước, thuê bao SaaS đơn thuần không đạt $1M ARR. Do đó phải dùng đống doanh thu đa lớp.

**Giả thuyết giá (theo quyết định của Founder, ghi trong `PRODUCT-PRD-V1.md`):** phí pilot 5.000.000 VND/5 container, thuê bao 60.000.000 VND/năm, phí thiết lập 10.000.000 VND/vựa (một lần). Phí một lần (pilot, thiết lập) được ghi riêng và **không** cộng vào ARR.

**Chưa đo được:** CAC, LTV và margin thuê bao — chưa có khách hàng trả tiền nên không có dữ liệu. Giữ tách biệt với phép kiểm tra vi mô 150.000 VND giá / 8.000 VND COGS biến đổi trong `src/saas/open-core-deep-introspector.ts` (đó là mô hình, không phải số đo khách hàng).
