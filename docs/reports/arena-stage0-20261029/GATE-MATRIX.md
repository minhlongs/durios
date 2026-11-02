# GATE-MATRIX — trạng thái 5 cổng khai trương (`GATE-01..GATE-05`), cập nhật 2026-10-30

Nguồn yêu cầu: `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` (bảng tiêu chí) và `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md` (phân công).
Nguồn kiểm tra tự động: `src/auth/pilot-gate-report-builder.ts` (được `src/auth/pilot-launch-gate-verifier.ts` gọi; `pilot:verify-gates` in báo cáo và thoát `1` khi chưa đạt).
Bằng chứng thực thi: `evidence/rerun-20261030/` (đo lại 2026-10-30 sau chỉnh sửa: `GATE-CLI-MATRIX-LOG.txt`, `DRILL-STAGE0-LOG.txt`, `BACKUP-RESTORE-DRILL-LOG.txt`, `HTTP-WALKTHROUGH-LOG.txt`, `TEST-SUITE-LOG.txt`, `TYPECHECK-LOG.txt`, `MODULARITY-LOG.txt`, `UI-RENDER-PROBE-LOG.txt`); log đợt 2026-10-29 vẫn giữ nguyên trong `evidence/`.

## 0. Kết quả tại thời điểm bàn giao (đo lại 2026-10-30, sau toàn bộ chỉnh sửa)

### 0.1. "2/5" nghĩa là gì — hai con số, hai câu hỏi khác nhau

| Con số trong báo cáo | Câu hỏi nó trả lời | Ai tạo ra | Có mở cổng không |
|---|---|---|---|
| `machineChecksPassedCount` — "KIỂM TRA TỰ ĐỘNG (máy chấm được)" | Bao nhiêu **tiêu chí máy chấm được** đã đạt (tệp tồn tại, host loopback, chuỗi băm hợp lệ, backup verify, ngưỡng KPI)? | Máy, tự động | **Không.** Chỉ là điều kiện cần. |
| `operationalGatesEvidencedCount` — "LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ)" | Bao nhiêu **cổng khai trương** có **cả** máy chấm đạt **và** bằng chứng vận hành do con người ghi nhận? | Con người ghi nhận, máy lưu lại và nêu tên người ghi | **Có.** Con số duy nhất quyết định `goForLiveCustomerData`. |

Nhãn của từng cổng (`gateVerdict`): `EVIDENCED_FOR_LAUNCH` (máy đạt + người ghi bằng chứng) · `MACHINE_CHECK_ONLY` (máy đạt, thiếu bằng chứng → nhãn `MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE`) · `PENDING` (máy chưa đạt). Nguồn: `src/auth/pilot-gate-evidence.ts`, `src/auth/pilot-gate-summary.ts`.

Nguồn gốc dữ liệu của cả lần đánh giá (`evidenceProvenance`) có **ba** giá trị, và chỉ một giá trị cho phép mở cổng: `OPERATIONAL` (không có tín hiệu tổng hợp trong sổ kiểm toán **và** chuỗi băm kiểm toán xác minh đạt) · `SYNTHETIC_REHEARSAL` (cohort có chứa dữ liệu tổng hợp/diễn tập → `operationalGatesEvidencedCount` luôn `0`) · `UNPROVEN_LEDGER_INTEGRITY` (chuỗi băm kiểm toán **không** xác minh được → không chứng minh nổi dữ liệu từ đâu tới, nên cũng `0` và `goForLiveCustomerData: false`). Nguồn: `src/auth/gate-cohort-provenance.ts`, `src/auth/pilot-gate-report-builder.ts`.

Tiêu chí máy chấm và bằng chứng vận hành của từng cổng, đúng như code khai báo (`GATE_MACHINE_CRITERIA` / `GATE_EXTERNAL_EVIDENCE_REQUIREMENTS`):

| Cổng | Máy chấm được (điều kiện cần) | Bằng chứng vận hành phải có (điều kiện đủ) |
|---|---|---|
| `GATE-01` | Tệp tại `DURIOS_GATE01_CONSENT_FILE` tồn tại (**chỉ kiểm tra tồn tại, không xác minh chữ ký**) | Biên bản tiếp cận vựa do chủ vựa xác nhận; phê duyệt chọn site của Founder; Biểu mẫu chấp thuận dữ liệu (91/2025/QH15) đã ký |
| `GATE-02` | `DURIOS_OTP_*` đủ khởi tạo provider (`isConfigured`); **chưa gửi OTP thật** | Quyết định chọn nhà cung cấp OTP của Founder; biên bản gửi/nhận OTP thật trên staging cho tài khoản thật |
| `GATE-03` | `DURIOS_HOST` là loopback (`assertLoopbackHostname`) && `verifyIntegrity() === true` | Reverse proxy HTTPS với `NODE_ENV=production`; giới hạn mạng riêng tại vựa; mã hóa ổ đĩa và bản sao lưu; secrets quyền `0600` |
| `GATE-04` | `verifySiteBackup(DURIOS_BACKUP_DIR).valid === true` (100% blob khớp SHA-256) | Diễn tập backup/verify/restore trên máy vựa thật; biên bản có người thực hiện ký; lịch sao lưu định kỳ đã chốt |
| `GATE-05` | Ít nhất 5 container && `meanDeltaSeconds < 300` && `zeroMissGate === true` | Biên bản bấm giờ của người vận hành (`HUMAN_STOPWATCH_ATTESTED`); tối thiểu 2 ca gài lỗi mù do người khác chuẩn bị; xác nhận 0 lỗi P0 còn mở |

Hệ thống **ghi nhận** bằng chứng, **không tự xác minh** nó: khai báo `DURIOS_GATE0X_EVIDENCE_FILE` (X = 1..5) kèm `DURIOS_GATE_EVIDENCE_ATTESTED_BY` (tên người ghi nhận) — hoặc `gateEvidence: {"GATE-0X": {filePath, attestedBy}}` khi gọi qua code. Thiếu tên người ghi nhận thì tệp bị coi như chưa có bằng chứng. Giá trị của bằng chứng là trách nhiệm của người ký và của Founder, không phải của máy.

### 0.2. Ma trận kết quả đo được (log: `evidence/rerun-20261030/GATE-CLI-MATRIX-LOG.txt`)

| Ca | Dữ liệu | Máy chấm | Cổng đủ bằng chứng | `evidenceProvenance` | `goForLiveCustomerData` | EXIT |
|---|---|---|---|---|---|---|
| A1 | DB diễn tập (`pilot:seed-rehearsal`), chỉ host loopback | 2/5 | 0/5 | SYNTHETIC_REHEARSAL | false | 1 |
| A2 | DB diễn tập, đủ 5 tiêu chí máy | 5/5 | 0/5 | SYNTHETIC_REHEARSAL | false | 1 |
| A3 | DB diễn tập + khai báo đủ 5 tệp bằng chứng | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false | 1 |
| B1 | Cohort fixture vận hành (`DOS-CAILAY-OP*`), đủ 5 tiêu chí máy, chưa có bằng chứng | 5/5 | 0/5 | OPERATIONAL | false | 1 |
| B2 | B1 + 1 cổng có tệp bằng chứng và tên người ghi nhận | 5/5 | 1/5 | OPERATIONAL | false | 1 |
| B3 | B1 + khai báo bằng chứng cho cổng có **máy chấm FAIL** (thiếu tệp consent) | 4/5 | 4/5 | OPERATIONAL | false | 1 |
| B4 | B1 + đủ 5 máy chấm **và** đủ 5 bằng chứng khai báo | 5/5 | 5/5 | OPERATIONAL | **true** | 0 |

Ba điều rút ra, mỗi điều có kiểm thử hồi quy:

1. **Ca A3 — dữ liệu tổng hợp không mở được cổng.** Cohort chứa hồ sơ đi qua đường tổng hợp/diễn tập bị nhận diện và báo `SYNTHETIC_REHEARSAL`; dù khai báo đủ 5 tệp bằng chứng thì `operationalGatesEvidencedCount` vẫn `0/5` và EXIT vẫn `1`. Tín hiệu nhận diện **không** nằm ở tên hồ sơ mà ở sổ kiểm toán append-only có chuỗi băm: `SYNTHETIC_DOCUMENT_INGESTED` (ghi lúc nạp tài liệu khi chế độ tổng hợp đang bật) và `REHEARSAL_DOSSIER_SEEDED` (ghi lúc seeder tạo hồ sơ); tiền tố `DOS-CAILAY-R*` chỉ còn là tín hiệu phụ cho DB cũ (`src/auth/gate-cohort-provenance.ts`). Cohort **trộn** (vừa hồ sơ tổng hợp vừa hồ sơ vận hành) cũng bị coi là tổng hợp — phải tách hoặc dọn dữ liệu diễn tập trước khi đánh giá cổng trên DB thật. Đã kiểm bằng tấn công thật: đổi mã hồ sơ bằng SQL thô, trộn 1 container tổng hợp mã `DOS-TG-CUSTOMER-77`, xoá dòng sổ kiểm toán, khai báo 5 "tệp bằng chứng" không tồn tại → cả bốn ca đều `0/5` (`test/gate-provenance-adversarial.test.ts`, `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`, chi tiết ở mục 0.3 và `FINDINGS.md` F-14b).
2. **Ca B3 — bằng chứng không nâng được tiêu chí máy.** Cổng có `machineCheck.passed: false` giữ nguyên `gateVerdict: "PENDING"` dù có tệp bằng chứng và người ghi nhận.
3. **Ca B4 — chỉ là fixture.** Container và các "tệp bằng chứng" đều do `evidence/gate-cohort-site.ts` tạo ra trong `/tmp`. Ca này chứng minh cơ chế (đủ hai nửa thì cổng mở, EXIT=0), **không phải** một quyết định khai trương; chạy thật vẫn cần hiện vật thật và phê duyệt của Founder.

Trên luồng HTTP thật (`evidence/rerun-20261030/HTTP-WALKTHROUGH-LOG.txt`, DB diễn tập + 1 hồ sơ tạo qua API): máy chấm **2/5**, cổng đủ bằng chứng **0/5**, `evidenceProvenance: SYNTHETIC_REHEARSAL`, `goForLiveCustomerData: false`. Gói kiểm toán CLI (`pilot:audit-pack`) trên cùng DB: `Verdict=HOLD_BLOCKERS_REMAIN MachineChecks=2/5 LaunchGatesEvidenced=0/5 Integrity=true`.

**Kết luận: Pilot với dữ liệu khách hàng thật = BLOCKED.** Agent không tự ký cổng nào, không đổi tiêu chí, và không dùng kết quả tổng hợp để mở cổng.

### 0.3. Bằng chứng vận hành: ai được ghi nhận, máy kiểm tra gì, dữ liệu tổng hợp bị chặn thế nào

**(a) Ai được ghi nhận `externalEvidence`.** Không có endpoint HTTP nào nhận bằng chứng cổng. `handleGetPilotGates` gọi `evaluateWorkspaceLaunchGates(workspace, actor)` **không truyền** `gateEvidence`, nên một request — dù mang token hợp lệ của `MANAGER`/`ADMIN`/`AUDITOR` — không thể khai báo hay đính kèm bằng chứng, và luôn chỉ thấy các biến môi trường của tiến trình server. Chỉ hai đường vào:

| Đường vào | Ai dùng được | Bằng chứng được khai báo thế nào |
|---|---|---|
| Môi trường của **tiến trình server on-prem** | Người có quyền shell trên máy chủ vựa (Founder / người vận hành on-prem) | `DURIOS_GATE0X_EVIDENCE_FILE` (X = 1..5) + `DURIOS_GATE_EVIDENCE_ATTESTED_BY` |
| **CLI** `bun run pilot:verify-gates` / `bun run pilot:audit-pack` | Người chạy lệnh trên máy on-prem, trong shell của họ | Cùng hai biến môi trường đó; hoặc `gateEvidence: {"GATE-0X": {filePath, attestedBy}}` khi gọi `compilePilotGoLiveDossierPack(...)` từ code nội bộ |

Danh tính người ghi nhận đến từ `DURIOS_GATE_EVIDENCE_ATTESTED_BY`; thiếu tên thì tệp không được tính. Agent/AI không có đường nào để tự ký: không có endpoint, không có cờ `--yes`, không có tham số "bỏ qua nguồn gốc dữ liệu", và `goForLiveCustomerData` chỉ `true` khi cả 5 cổng vừa máy chấm đạt vừa có bằng chứng do con người ghi trên cohort không tổng hợp với sổ kiểm toán toàn vẹn.

**(b) Máy kiểm tra gì trên tệp bằng chứng** (`src/auth/gate-evidence-artifact.ts`, `src/auth/pilot-gate-evidence.ts`):

| Kiểm tra | Không đạt thì sao |
|---|---|
| Đường dẫn khai báo **tồn tại** | `PENDING_OPERATOR_EVIDENCE`, ghi chú "Đường dẫn khai báo không tồn tại" |
| Là **tệp thường**, không phải thư mục | `PENDING_OPERATOR_EVIDENCE`, ghi chú "Đường dẫn khai báo không phải là tệp" |
| Ghi lại **kích thước + SHA-256** của bytes | lưu vào `externalEvidence.artifact`; tệp > 25 MB → `NOT_HASHED_FILE_TOO_LARGE` (khai báo vẫn được ghi, nhưng không có băm để đối chiếu sau này) |
| Có **tên người ghi nhận** | thiếu → `PENDING_OPERATOR_EVIDENCE` ("một tệp vô danh không chứng minh ai đã ghi") |
| **Máy chấm của chính cổng đó** đạt | không đạt → `PENDING`; bằng chứng không nâng được cổng (ca B3) |
| **Nguồn gốc cohort** không tổng hợp và **chuỗi băm sổ kiểm toán** toàn vẹn | không đạt → `MACHINE_CHECK_ONLY`, `operationalGatesEvidencedCount = 0` |

Máy **không** thẩm định nội dung tệp: một trang trắng cũng cho ra SHA-256 hợp lệ. SHA-256 có mặt để người soát sau này chứng minh tệp trong hồ sơ không bị tráo, không phải để thay chữ ký hay thay việc đọc biên bản.

**(c) Bằng chứng tổng hợp không bao giờ được tính là bằng chứng vận hành.** Nguồn gốc cohort được ghi **tại nơi dữ liệu sinh ra**, vào sổ kiểm toán append-only có chuỗi băm, chứ không suy ra từ tên:

| Tín hiệu | Ghi ở đâu | Khi nào |
|---|---|---|
| `SYNTHETIC_DOCUMENT_INGESTED` | `src/workspace/document-ingestion-orchestrator.ts` | mỗi lần nạp tài liệu **thành công** khi `isSyntheticExtractionEnabled()` (kèm `fileName`, `fieldsExtracted`, `fixtureOverrideRequested`) |
| `REHEARSAL_DOSSIER_SEEDED` | `src/server/ecosystem-rehearsal-seeder.ts` | seeder diễn tập tạo mỗi hồ sơ |
| `REHEARSAL_DOSSIER_CODE:<mã>` | `src/auth/gate-cohort-provenance.ts` | tín hiệu phụ cho DB cũ có mã `DOS-CAILAY-R*` |

`resolveCohortProvenance(containerMetrics, auditEvents)` lọc sự kiện theo `dossierId` của cohort đang đo và trả `{synthetic, signals[], cohortSize}`; `synthetic ⇒ rehearsalMode ⇒ resolveGateVerdict` không bao giờ trả `EVIDENCED_FOR_LAUNCH`. Kết quả đo được khi bị tấn công thật (`evidence/gate-provenance-adversarial.ts` → `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`):

| Ca | Tấn công | Máy chấm | Cổng đủ bằng chứng | `evidenceProvenance` | `goForLiveCustomerData` |
|---|---|---|---|---|---|
| A0 | (cơ sở) DB diễn tập + 5 tệp bằng chứng do script tự tạo | 5/5 | 0/5 | SYNTHETIC_REHEARSAL | false |
| A1 | `UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-…'` (SQL thô, không qua code) | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| B0 | (cơ sở) cohort vận hành fixture, không có ingest tổng hợp | 5/5 | 5/5 | OPERATIONAL | true — **chỉ là fixture**, không phải quyết định khai trương |
| B1 | trộn 1 container tổng hợp mã `DOS-TG-CUSTOMER-77` vào cohort B0 (thành 6 container) | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| C1 | `DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')` | 4/5 (GATE-03 fail) | **0/5** | UNPROVEN_LEDGER_INTEGRITY | false |
| D1 | khai báo 5 "tệp bằng chứng" không tồn tại (một đường dẫn là thư mục) trên site vận hành xanh | 5/5 | **0/5** | OPERATIONAL | false |

**Giới hạn còn lại, nói rõ:** (1) cơ chế này phát hiện dữ liệu đi qua đường tổng hợp/fixture hoặc seeder diễn tập — hồ sơ do con người gõ tay từ một chứng từ bịa thì **không** kiểm tra máy nào ở đây phân biệt được với dữ liệu thật, phải dựa vào rà soát bằng chứng của người vận hành và chữ ký Founder trên gói niêm phong; (2) nội dung tệp bằng chứng không bao giờ được máy thẩm định; (3) `SYNTHETIC_DOCUMENT_INGESTED` chỉ được ghi khi chế độ tổng hợp đang bật — một tiến trình chạy **không** bật chế độ đó thì không có đường nạp fixture, nên không có gì để đánh dấu.

---

## GATE-01 — Tiếp cận vựa & Chấp thuận dữ liệu (Luật DLCN 91/2025/QH15)

| Mục | Nội dung |
|---|---|
| **Yêu cầu (tài liệu)** | 01 vựa xác nhận tiếp cận; Founder phê duyệt chọn site; chủ vựa **ký** Biểu mẫu Chấp thuận Sử dụng Dữ liệu **trước khi** nạp chứng từ thật. |
| **Máy kiểm tra gì** | `consentPath = options.consentSignedFilePath ?? env.DURIOS_GATE01_CONSENT_FILE` rồi kiểm tra sự tồn tại/nội dung tệp (`pilot-gate-report-builder.ts:17,28`). |
| **Bằng chứng hiện có** | Tài liệu protocol đã viết sẵn: `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`. Quyết định chọn điểm Cai Lậy: `DECISION-01-CAI-LAY-SITE-SELECTION.md`. Kịch bản diễn tập chỉ tạo tệp đồng ý **tổng hợp** trong thư mục tạm (`src/server/ecosystem-rehearsal-drill.ts:19-25`) và nay bị dán nhãn `PASS_SYNTHETIC_REHEARSAL`, không có giá trị pháp lý. |
| **Phần còn thiếu** | (1) Biên bản tiếp cận vựa do chủ vựa Cai Lậy xác nhận; (2) phê duyệt chọn site của Founder; (3) Biểu mẫu chấp thuận dữ liệu **đã ký** (bản quét/tệp) đặt tại đường dẫn `DURIOS_GATE01_CONSENT_FILE`; (4) ghi rõ phạm vi dữ liệu, mục đích, thời hạn, người nhận, cách rút lại đồng ý. |
| **Ai phải cung cấp** | Founder (phê duyệt site) + chủ vựa/người vận hành Cai Lậy (ký biên bản). **Hệ thống và agent không được tự ký.** |
| **Trạng thái** | **PENDING — BLOCKING.** Đây là cổng chặn hoàn toàn việc nạp dữ liệu thật. |
| **Tái kiểm tra** | `DURIOS_GATE01_CONSENT_FILE=/đường/dẫn/bien-ban-da-ky.pdf bun run pilot:verify-gates` → kỳ vọng **máy chấm** lên `3/5` (`GATE-01.machineCheck.passed: true`), còn `operationalGatesEvidencedCount` vẫn `0/5` cho tới khi có người ghi nhận bằng chứng: thêm `DURIOS_GATE01_EVIDENCE_FILE=/đường/dẫn/bien-ban.pdf DURIOS_GATE_EVIDENCE_ATTESTED_BY="Tên người ghi nhận"`. Nhãn trung gian là `MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE`. |

---

## GATE-02 — Kênh OTP thật (Zalo ZNS / SMS)

| Mục | Nội dung |
|---|---|
| **Yêu cầu (tài liệu)** | Founder chọn nhà cung cấp từ báo cáo đánh giá; cấu hình `DURIOS_OTP_*`; **gửi/nhận thành công OTP thật** trên staging cho tài khoản thật. |
| **Máy kiểm tra gì** | Sự hiện diện của cấu hình nhà cung cấp (`DURIOS_OTP_PROVIDER`, `DURIOS_OTP_API_URL`, `DURIOS_OTP_API_KEY`); khi thiếu, `HttpGatewayOtpProvider` **fail-closed** (từ chối đăng nhập, `503`) thay vì cho qua. |
| **Bằng chứng hiện có** | Adapter sẵn sàng và hành vi fail-closed đã được kiểm thử tự động; diễn tập S6 chứng minh đăng nhập giả mạo bị chặn (`401`); đánh giá nhà cung cấp: `docs/pilot-readiness/02_OTP_PROVIDER_EVALUATION.md`. |
| **Phần còn thiếu** | (1) Quyết định chọn nhà cung cấp của Founder; (2) thông tin cấu hình thật (URL, khóa API) nạp qua môi trường, **không commit vào kho**; (3) biên bản gửi/nhận OTP thật trên staging với tài khoản thật (ngày giờ, số điện thoại đã che, kết quả); (4) phương án dự phòng khi kênh OTP lỗi (ai được cấp quyền ngoại lệ, ghi nhận thế nào). |
| **Ai phải cung cấp** | Founder (chọn vendor, duyệt chi phí) + người vận hành (chạy thử và lập biên bản). Trong Stage 0 **cấm** gửi OTP thật, cấm dùng dịch vụ trả phí → phần này chỉ có thể làm khi Founder cho phép. |
| **Trạng thái** | **PENDING — BLOCKING** (adapter sẵn sàng, thiếu thông tin + biên bản). |
| **Tái kiểm tra** | `DURIOS_OTP_PROVIDER=… DURIOS_OTP_API_URL=… DURIOS_OTP_API_KEY=… bun run pilot:verify-gates` → kỳ vọng **máy chấm** `GATE-02.machineCheck.passed: true`; cổng chỉ mở (`EVIDENCED_FOR_LAUNCH`) khi khai báo thêm `DURIOS_GATE02_EVIDENCE_FILE` (biên bản gửi/nhận OTP thật) và `DURIOS_GATE_EVIDENCE_ATTESTED_BY`. |

---

## GATE-03 — Bảo mật On-Prem, TLS & Giới hạn mạng

| Mục | Nội dung |
|---|---|
| **Yêu cầu (tài liệu)** | (a) ứng dụng bind `127.0.0.1:3000`; (b) truy cập qua Reverse Proxy HTTPS (`NODE_ENV=production`); (c) mạng riêng giới hạn; (d) ổ đĩa và bản sao lưu được mã hóa; (e) secrets lưu quyền `0600`. Runbook: `docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md`. |
| **Máy kiểm tra gì** | **Chỉ (a) + toàn vẹn chuỗi kiểm toán**: `assertLoopbackHostname(env.DURIOS_HOST ?? "127.0.0.1")` và `workspace.auditLedger.verifyIntegrity()` (`pilot-gate-report-builder.ts:32-37`). |
| **Bằng chứng hiện có** | (a) đã kiểm chứng: guard loopback ném lỗi với host không loopback (không thể khởi động server ra ngoài `127.0.0.1`); chuỗi kiểm toán hash-chain từ `GENESIS` được diễn tập S11 đọc lại thành công sau restore; giới hạn tốc độ (đăng nhập + 30 req/phút/tenant) có kiểm thử tự động; runbook đã viết và được cập nhật trong đợt bàn giao này. |
| **Phần còn thiếu** | (b) Chưa dựng/kiểm chứng reverse proxy HTTPS thật (`NODE_ENV=production`) tại vựa; (c) chưa có biên bản giới hạn mạng nội bộ (VLAN/firewall, ai truy cập được); (d) chưa có bằng chứng mã hóa ổ đĩa + mã hóa bản sao lưu trên máy thật; (e) chưa kiểm tra quyền `0600` của tệp secrets trên máy thật. |
| **Ai phải cung cấp** | Người vận hành triển khai Mini PC tại vựa + Founder duyệt cấu hình mạng. Phần (a) và toàn vẹn sổ cái đã do hệ thống tự chứng minh. |
| **Trạng thái** | **PARTIAL.** Máy chấm đạt **2/5** tiêu chí tài liệu → nhãn `MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE`, `gateVerdict: MACHINE_CHECK_ONLY` → **không** được coi là đạt toàn bộ. Đây là chỗ tài liệu `01_…` đang ghi "RUNBOOK & CONFIG VERIFIED" trong khi bằng chứng hiện trường chưa có. |
| **Tái kiểm tra** | Trên máy vựa: `NODE_ENV=production DURIOS_HOST=127.0.0.1 bun run pilot:verify-gates`, kèm `ls -l` tệp secrets, `lsblk`/trạng thái mã hóa đĩa, và ảnh chụp cấu hình reverse proxy; đính kèm vào thư mục báo cáo này. |

---

## GATE-04 — Chứng minh Sao lưu & Khôi phục

| Mục | Nội dung |
|---|---|
| **Yêu cầu (tài liệu)** | Chạy `backup-site`, `verify-backup`, `restore-site` thành công trên staging; `verifyIntegrity() === true` và **100% blob khớp SHA-256** sau khôi phục. |
| **Máy kiểm tra gì** | `backupDir` (từ `options` hoặc `DURIOS_BACKUP_DIR`) phải tồn tại và `verifySiteBackup(backupDir).valid === true` (`pilot-gate-report-builder.ts:39-46`). |
| **Bằng chứng hiện có (DRILL S11 — dữ liệu tổng hợp)** | Backup: 12 hồ sơ / 35 chứng từ / 32 blob (`VACUUM INTO` + sao blob). `verifySiteBackup` chạy **2 lần cho kết quả giống hệt** (idempotent, ổn định băm). `restoreSiteBackup` hợp lệ. **SHA-256 của tệp DB sau restore bằng bản gốc.** Sau restore đọc được: hồ sơ, manifest đã xuất, chuỗi kiểm toán. **32/32 blob băm lại đúng.** Lật 1 byte trong 1 blob → `verify` trả 3 lỗi, nêu đích danh tệp và băm kỳ vọng/băm thực tế. Cộng thêm AUTO-TEST `test/process-restart-persistence.test.ts`. |
| **Phần còn thiếu** | (1) Bản sao lưu **thật** trên máy vựa (ổ gắn ngoài, có mã hóa theo `DECISION-01`) và `DURIOS_BACKUP_DIR` trỏ tới đó để máy chấm `PASS`; (2) biên bản diễn tập khôi phục do **người vận hành** thực hiện, có ngày giờ, người làm, kết quả; (3) lịch sao lưu định kỳ (ai chạy, tần suất, kiểm tra tự động thế nào); (4) thử khôi phục sau sự cố thật (mất điện/đĩa lỗi) chứ không chỉ khôi phục chủ động. |
| **Ai phải cung cấp** | Người vận hành tại vựa (chạy + ký biên bản), Founder duyệt lịch sao lưu và thiết bị lưu trữ. |
| **Trạng thái** | **PARTIAL — cơ chế đã kiểm chứng kỹ thuật đầy đủ trên dữ liệu tổng hợp; thiếu bằng chứng hạ tầng thật.** Máy hiện chấm `PENDING_VERIFIED_BACKUP` (máy FAIL → `gateVerdict: PENDING`) vì chưa có `DURIOS_BACKUP_DIR` hợp lệ; khi có backup hợp lệ mà chưa có biên bản diễn tập được ghi nhận thì nhãn là `MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE`. Tài liệu `01_…` ghi "VERIFIED IN STAGING TESTS" — đúng ở mức staging test, **chưa** đúng ở mức hiện trường. |
| **Tái kiểm tra** | `DURIOS_BACKUP_DIR=/đường/dẫn/sao-lưu-thật bun run pilot:verify-gates` → kỳ vọng máy chấm `GATE-04` đạt với chi tiết "100% blob khớp SHA-256"; sau đó khai báo `DURIOS_GATE04_EVIDENCE_FILE` (biên bản diễn tập có người ký) + `DURIOS_GATE_EVIDENCE_ATTESTED_BY` để cổng mở. |

---

## GATE-05 — Quy trình đo KPI & Kiểm thử staging toàn trình

| Mục | Nội dung |
|---|---|
| **Yêu cầu (tài liệu)** | Chốt quy trình bấm giờ (`< 5 phút/container` đạt, `< 3 phút/container` mục tiêu); staging test đủ **3 phương thức đăng nhập**; bắt **100%** lỗi Container/Seal; **0 lỗi P0**; `bun run typecheck` và `bun test` xanh 100%. |
| **Máy kiểm tra gì** | `computeGate05KpiFromDossiers`: `totalContainers ≥ 5`, `meanDeltaSeconds < 300`, `zeroMissGate` (bắt hết lỗi gài mù) → `gate05Passed` (`pilot-gate-report-builder.ts:47`). |
| **Bằng chứng hiện có** | **AUTO-TEST (đo lại 2026-10-30, sau khi viết lại cơ chế nguồn gốc dữ liệu):** 286 pass / 0 fail / 4.484 expect / 67 tệp; `typecheck` exit 0; modularity `GO_MODULAR_ZERO_ANY_VERIFIED` (maxSrc 100, maxTest 100, `: any` = 0 trên 296 tệp TypeScript; 167 tệp `src/`, 129 tệp `test/`). **DRILL:** 55/55 kiểm tra, trong đó S4 (7/7 ca giả mạo manifest bị phát hiện), S5 (niêm phong bất biến, thay chứng từ sau thẩm định bị chặn), S6 (sai tenant `404`, thiếu quyền `403`, giả mạo header `401`), S10 (thiếu dữ liệu → `BLOCKED`, không bao giờ `PASSED`). **CLI:** 5 container seed, bắt 2/2 lỗi gài mù → `zeroMissGate: true`, `meanDeltaSeconds: 0.03`. **0 lỗi P0 còn mở** (F-03, lỗi P0 duy nhất tìm thấy, đã sửa và có kiểm thử hồi quy). |
| **Phần còn thiếu** | (1) **Bấm giờ của con người**: `timingEvidenceSource` hiện là `SYSTEM_TIMESTAMPS` — `meanDeltaSeconds = 0.03` là thời gian máy seed, **không phải** thời gian Thư ký đối soát. Cần biên bản bấm giờ 5 container thật với `HUMAN_STOPWATCH_ATTESTED`; (2) lỗi gài mù hiện lấy từ nhãn của bộ seed (`blindFaultsCaught`) → cần ca gài lỗi thật do người khác chuẩn bị mà Thư ký không biết trước; (3) hai giả định kinh tế (35 phút baseline, 35.000.000 VND/lỗi) vẫn là `UNVALIDATED_ASSUMPTION` → cần dữ liệu đo tại vựa (danh sách ở `RUNBOOK-STAGE0-REHEARSAL.md` mục 6); (4) staging test "đủ 3 phương thức đăng nhập" mới được kiểm chứng ở mức kiểm thử tự động + diễn tập, chưa có biên bản người thật đăng nhập trên máy vựa. |
| **Ai phải cung cấp** | Thư ký + Quản lý vựa (bấm giờ, ký biên bản); Founder duyệt ngưỡng và cách đo; người chuẩn bị lỗi gài mù độc lập với người đối soát. |
| **Trạng thái** | **PARTIAL — máy chấm đạt, bằng chứng thời gian của con người chưa có** → `gateVerdict: MACHINE_CHECK_ONLY`. Không được trình bày `meanDeltaSeconds` của hệ thống như thành tích vận hành. Khi `timingEvidenceSource` chuyển sang `HUMAN_STOPWATCH_ATTESTED`, biên bản bấm giờ được tự ghi vào phần bằng chứng của GATE-05 (vẫn cần `DURIOS_GATE_EVIDENCE_ATTESTED_BY`). |
| **Tái kiểm tra** | Sau khi có biên bản bấm giờ: nhập thời gian thật rồi chạy `bun run pilot:evaluate-kpi` → kỳ vọng `timingEvidenceSource: "HUMAN_STOPWATCH_ATTESTED"`, `valueMetricsProvenance: "FIELD_MEASURED"`, `meanDeltaSeconds < 300` từ số đo con người. |

---

## Tổng hợp: ai nợ bằng chứng gì

| Cổng | Trạng thái | Chặn go-live? | Người nợ bằng chứng | Bằng chứng cụ thể cần nộp |
|---|---|---|---|---|
| `GATE-01` | PENDING | **Có** | Founder + chủ vựa Cai Lậy | Biên bản tiếp cận vựa, phê duyệt site, Biểu mẫu chấp thuận dữ liệu đã ký, đường dẫn `DURIOS_GATE01_CONSENT_FILE` |
| `GATE-02` | PENDING | **Có** | Founder + người vận hành | Quyết định chọn nhà cung cấp OTP, cấu hình thật (ngoài kho), biên bản gửi/nhận OTP trên staging |
| `GATE-03` | PARTIAL (máy chấm đạt 2/5 tiêu chí; `MACHINE_CHECK_ONLY`) | **Có** | Người vận hành triển khai | Biên bản reverse proxy HTTPS, giới hạn mạng, mã hóa đĩa + bản sao lưu, quyền `0600` của secrets |
| `GATE-04` | PARTIAL | **Có** | Người vận hành tại vựa | Bản sao lưu thật + `DURIOS_BACKUP_DIR`, biên bản diễn tập khôi phục có người ký, lịch sao lưu |
| `GATE-05` | PARTIAL | **Có** | Thư ký + Quản lý vựa | Biên bản bấm giờ 5 container thật, ca gài lỗi mù độc lập, số liệu thay 2 giả định kinh tế |

**Cả 5 cổng đều đang thiếu bằng chứng bên ngoài.** Vì vậy trạng thái pilot dữ liệu thật là **BLOCKED**, và phần kỹ thuật độc lập vẫn được hoàn thiện tiếp (đã hoàn thành trong đợt này).

### Lệnh tái đánh giá toàn bộ (một dòng)

```bash
DURIOS_DB_PATH=/đường/dẫn/db-vận-hành.không-chứa-hồ-sơ-diễn-tập.db \
DURIOS_DATA_DIR=/đường/dẫn/uploads \
DURIOS_BACKUP_DIR=/đường/dẫn/sao-lưu \
DURIOS_GATE01_CONSENT_FILE=/đường/dẫn/bien-ban-da-ky.pdf \
DURIOS_OTP_PROVIDER=… DURIOS_OTP_API_URL=… DURIOS_OTP_API_KEY=… \
DURIOS_GATE01_EVIDENCE_FILE=/đường/dẫn/bien-ban-tiep-can-vua.pdf \
DURIOS_GATE02_EVIDENCE_FILE=/đường/dẫn/bien-ban-otp-that.pdf \
DURIOS_GATE03_EVIDENCE_FILE=/đường/dẫn/bien-ban-mang-va-ma-hoa.pdf \
DURIOS_GATE04_EVIDENCE_FILE=/đường/dẫn/bien-ban-dien-tap-restore.pdf \
DURIOS_GATE05_EVIDENCE_FILE=/đường/dẫn/bien-ban-bam-gio-5-container.pdf \
DURIOS_GATE_EVIDENCE_ATTESTED_BY="Họ tên + vai trò + ngày ghi nhận" \
bun run pilot:verify-gates ; echo "EXIT=$? (0 = cả 5 cổng ĐỦ BẰNG CHỨNG vận hành)"
```

Lệnh in ra **hai** dòng số (bản tóm tắt tiếng Việt ở stderr, JSON đầy đủ ở stdout): `KIỂM TRA TỰ ĐỘNG (máy chấm được): x/5 tiêu chí đạt` và `LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): y/5 cổng được mở`, kèm từng cổng thiếu gì.

Chỉ khi lệnh thoát `0` **và** `goForLiveCustomerData: true` **và** `operationalGatesEvidencedCount: 5` **và** `evidenceProvenance: "OPERATIONAL"` **và** `pilotLifecycleState: "PILOT_COMPLETED"` thì mới được nạp dữ liệu khách hàng thật đại trà — và khi đó vẫn cần Founder phê duyệt. Mọi chế độ diễn tập, cũng như mọi cơ sở dữ liệu còn chứa hồ sơ do `pilot:seed-rehearsal` tạo ra, đều cho `goForLiveCustomerData: false` (F-07 và F-14).

### 0.4. Đồng bộ Runtime `GATE-05A` / `GATE-05B` & Máy Trạng Thái 5 Bước (Cập nhật 2026-11-02)

Để hóa giải thế khóa vòng trên DB vận hành sạch (`0` container) mà không nới lỏng bất kỳ chốt chặn nào, runtime (`src/auth/pilot-lifecycle-policy.ts`, `src/auth/founder-pilot-authorization.ts`, `src/workspace/pilot-quota-guard.ts`) đã tách rõ `gate05Split.gate05A` (diễn tập trước cutover) và `gate05Split.gate05B` (nghiệm thu 5 container thật) cùng 5 trạng thái vòng đời (`PilotLifecycleState`):
1. `BLOCKED` (`policyStatus: "PREREQUISITES_INCOMPLETE"`): Thiếu `GATE-01..04`, thiếu `GATE-05A`, hoặc đang chạy trên DB diễn tập (`SYNTHETIC_REHEARSAL`).
2. `READY_FOR_FOUNDER_REVIEW` (`policyStatus: "PENDING_FOUNDER_APPROVAL"`): DB vận hành sạch (`0` container) + `GATE-01..04` đạt `EVIDENCED_FOR_LAUNCH` + có biên bản `DURIOS_GATE05A_EVIDENCE_FILE` hợp lệ, đang chờ quyết định của Founder (`canStartLimitedFiveContainerPilot: false`, `goForLiveCustomerData: false`).
3. `LIMITED_PILOT_AUTHORIZED` (`policyStatus: "LIMITED_PILOT_AUTHORIZED"`): Đạt `READY_FOR_FOUNDER_REVIEW` + có tệp quyết định `DURIOS_FOUNDER_PILOT_AUTH_FILE` hợp lệ (`maxContainers: 5`, khớp `siteCode`/`tenantId`, chưa hết hạn, chưa thu hồi). Mở `canStartLimitedFiveContainerPilot: true` với trần cứng tối đa `5` container trong `ContainerDossierWorkspace.createDossier()`, trong khi `goForLiveCustomerData` vẫn giữ `false`.
4. `PILOT_COMPLETED` (`policyStatus: "PILOT_GRADUATED"`): Đạt `LIMITED_PILOT_AUTHORIZED` + hoàn tất 5 container thật đạt KPI `GATE-05B` kèm biên bản bấm giờ `DURIOS_GATE05B_EVIDENCE_FILE`. Chỉ tại đây `goForLiveCustomerData` mới chuyển sang `true`.
5. `PILOT_HOLD` (`policyStatus: "HOLD_ACTIVE"`): Phanh khẩn cấp khi đứt chuỗi băm kiểm toán (`UNPROVEN_LEDGER_INTEGRITY`), phát hiện trộn chứng từ synthetic vào DB vận hành, `DURIOS_PILOT_HOLD=true`, hoặc tệp ủy quyền Founder hết hạn/bị thu hồi/sai phạm vi.

Chi tiết đề xuất chính sách trình Founder: `docs/pilot-readiness/08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md` (trạng thái: `PENDING_FOUNDER_APPROVAL`).
