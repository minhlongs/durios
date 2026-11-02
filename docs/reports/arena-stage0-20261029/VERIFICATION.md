# VERIFICATION — bằng chứng thực thi, DuriOS Stage 0 (2026-10-29; đo lại toàn bộ 2026-10-30 ở mục 9)

Mọi mục dưới đây là **kết quả chạy thật** trong sandbox `/home/user/durios`, nhánh `arena/e0ece0a7-durios`. Không có kết quả nào được suy ra từ việc đọc mã nguồn; chỗ nào chỉ đọc mã nguồn thì ghi rõ "đọc mã nguồn".

Phân loại bằng chứng (bắt buộc phân biệt, theo yêu cầu đề bài):

| Loại | Nghĩa là | Ở đâu |
|---|---|---|
| **AUTO-TEST** | Kiểm thử tự động trong `bun test`, dữ liệu tổng hợp trong bộ nhớ/thư mục tạm | `test/` (67 tệp, 286 test) |
| **DRILL** | Kịch bản diễn tập tổng hợp viết riêng cho đợt này, chạy trên tiến trình thật + SQLite thật | `evidence/drill-stage0.ts` → `evidence/DRILL-STAGE0-LOG.txt` |
| **HTTP** | Luồng chính chạy qua **máy chủ HTTP thật** (tiến trình `bun run src/server/server.ts`, bind `127.0.0.1:3111`), client là `curl` | `evidence/http-walkthrough.sh` → `evidence/HTTP-WALKTHROUGH-LOG.txt` |
| **CLI** | Lệnh vận hành thật chạy trên cơ sở dữ liệu diễn tập riêng trong `/tmp` | `evidence/CLI-*.txt`, `evidence/MANIFEST-TAMPER-LOG.txt` |
| **DOM-PROBE** | Render HTML thật trong happy-dom (headless). **Không phải** kiểm thử bằng mắt, **không phải** ảnh chụp | `evidence/ui-render-probe.mjs` → `evidence/rerun-20261030/UI-RENDER-PROBE-LOG.txt` |
| **FIELD** | Bằng chứng hiện trường do con người/hạ tầng thật cung cấp | **CHƯA CÓ** — xem `GATE-MATRIX.md` |

> **Thời gian máy ≠ thời gian người.** Mọi con số "giây/phút" trong tài liệu này là thời gian tiến trình xử lý, không phải thời gian thao tác của Thư ký tại vựa.

---

## 1. Môi trường đo được

```
OS            : Debian 12, x86_64
node -v       : v22.22.3
npm -v        : 10.9.8
bun --version : 1.4.4        (package.json yêu cầu >= 1.3.0)
tsc           : 5.9.3 (tsc --noEmit, tsconfig strict + NodeNext + exactOptionalPropertyTypes)
HEAD          : 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494 (clone nông)
cây làm việc  : sạch trước khi bắt đầu
```

`curl` tải Bun từ GitHub release thất bại (exit 35, lỗi SSL trong sandbox) → cài bằng `npm install -g bun`; `bun install` cài 5 gói. Đây là khác biệt môi trường, không phải lỗi của kho.

**Tái lập từ sandbox sạch:** giữa đợt bàn giao, sandbox bị reset (mất `bun` và `node_modules`, mất toàn bộ `/tmp`). Đã dựng lại từ đầu — `npm install -g bun` (1.4.4) → `bun install` (5 gói) → `bun run typecheck` exit `0` → `bun test` **258 pass / 0 fail / 4.282 expect / 61 tệp** → `drill-stage0.ts` **55/0** → `backup-restore-drill.ts` **11/0** → `http-walkthrough.sh` chạy đủ 17 bước. Toàn bộ log trong `evidence/` là của lần chạy trên sandbox sạch đó, tức là **có thể tái lập từ kho sạch**.

Artefact không được theo dõi mà đề bài nhắc tới (`.claude/`, `DURIOS_CONTAINER_DOSSIER_MASTER_PROMPT.txt`) **không có** trong bản clone này → không có gì bị ghi đè hay xóa.

---

## 2. Lệnh kiểm tra và mã thoát

| Lệnh | Trước khi sửa | Sau khi sửa (trạng thái bàn giao) |
|---|---|---|
| `bun run typecheck` | exit `0`, 0 lỗi | exit `0`, 0 lỗi |
| `bun test` | exit `0` — **242 pass / 0 fail / 4.027 expect / 57 tệp** | exit `0` — **258 pass / 0 fail / 4.282 expect / 61 tệp** (~17 s) |
| `bun docs/reports/arena-stage0-20261029/evidence/drill-stage0.ts` | (chưa tồn tại) | exit `0` — **55 PASS / 0 FAIL** |
| `bun run pilot:verify-gates` | exit `0`, **không in gì** (F-12) | exit **`1`**, in báo cáo JSON: `passedCount: 2`, `goForLiveCustomerData: false` |
| `bun run pilot:audit-pack -- --verify` | **crash ENOENT** + stack thô (F-11) | in hướng dẫn sử dụng, exit **`2`** |
| `bun run pilot:audit-pack -- --output-dir … --markdown` | (chưa chạy) | exit `0`, `Verdict=HOLD_BLOCKERS_REMAIN Gates=2/5 Integrity=true` |
| `bun run verify:manifest <manifest>` | (chưa chạy trên manifest diễn tập) | exit `0`, `valid: true`, `integrityCoverage: "FULL"` |
| modularity introspector | `GO_MODULAR_ZERO_ANY_VERIFIED` | `GO_MODULAR_ZERO_ANY_VERIFIED` (`maxSrc 100`, `maxTest 100`, `any 0`) |

**Không xóa, không skip, không nới tiêu chí** kiểm thử nào để đạt màu xanh. Hai kiểm thử cũ (`test/stitch-static-route.test.ts`, `test/ecosystem-rehearsal-and-modularity.test.ts`) từng khẳng định hành vi bootstrap mở mặc định đã được **cập nhật để khẳng định ngữ nghĩa đã sửa** (đặt/xóa `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP` trong hook) — số lượng khẳng định tăng, không giảm.

---

## 3. Diễn tập hợp nhất Stage 0 — `evidence/DRILL-STAGE0-LOG.txt`

Lệnh: `bun docs/reports/arena-stage0-20261029/evidence/drill-stage0.ts` → **55 kiểm tra, 0 thất bại, exit 0**. Root diễn tập: `/tmp/drill-stage0-rPn6JK`.

Cô lập: SQLite riêng (`$root/durios.db`), blob riêng (`$root/uploads`), backup riêng (`$root/backup`), khôi phục riêng (`$root/restored`), 4 tenant tổng hợp. Kịch bản **tự khẳng định** `/home/user/durios/data/durios.db` không tồn tại (`PASS | repository ./data untouched by the drill`) — dữ liệu vận hành không bị đọc hay ghi.

| Mục | Nội dung | Kết quả chính (trích log) |
|---|---|---|
| S1 | Môi trường tổng hợp | root/db/blob/backup tách rời; `./data` kho không bị tạo |
| S2 | 4 actor / 4 tenant | `manager`+`clerk` (TENANT-DRILL-A), `buyer` (B), `intruder` (C) qua `seedTestPilotActor` |
| S3 | Hồ sơ hợp lệ → `PASSED` → duyệt → xuất | `validation=PASSED blockers=0`; manifest `isImmutable: true`, có `compositeManifestSha256` + `manifestIntegritySha256` (64 hex) |
| S4 | **7 ca giả mạo manifest** | 7/7 bị phát hiện, thông điệp phân biệt được: `Composite SHA-256 mismatch`; `Manifest integrity SHA-256 mismatch`; `not in a sealed, immutable EXPORTED state`; lỗi chữ số kiểm tra ISO 6346; manifest legacy thiếu trường mới → `valid` + `integrityCoverage: "PARTIAL_LEGACY"` |
| S5 | Seal không khớp / thiếu chứng từ / hồ sơ đã niêm phong / thay chứng từ sau thẩm định | sealed → `409 "Dossier is sealed and immutable…"`; thay chứng từ sau khi thẩm định → xóa `latestValidationResult` và **chặn** phê duyệt |
| S6 | Sai tenant / thiếu quyền | hồ sơ & manifest của tenant khác → `404`; không xuất hiện trong danh sách; `clerk` duyệt → `403`; `buyer` nạp chứng từ → `403`; giả mạo `x-actor-role` không phiên → `401` |
| S7 | Lọc manifest cho bên nhận chia sẻ | giữ `containerNumber/sealNumber/targetMarket/borderGate/temperature`; ẩn `92000`, `4.85`, trọng lượng khai báo; `redaction.applied = true` + notice nhắc `compositeManifestSha256`; `TRADE_FINANCE` → `403` |
| S8 | KPI/cổng theo tenant | grantee `totalContainers = 0`, owner `4`; owner KPI `timingEvidenceSource: "SYSTEM_TIMESTAMPS"`, `valueMetricsProvenance: "UNVALIDATED_ASSUMPTION"`, 2 giả định kèm nhãn |
| S9 | Bootstrap diễn tập | mặc định: `403 FEATURE_DISABLED`, **không** `set-cookie`, **không** token `dpt_`, **không** tenant diễn tập; opt-in: 5/5 `PASS_SYNTHETIC_REHEARSAL` nhưng `goForLiveCustomerData: false`, `evidenceProvenance: "SYNTHETIC_REHEARSAL"` |
| S10 | Trích xuất & thiếu dữ liệu | 3 ảnh scan → `0` trường + 3×`RUL-DOC-UNREADABLE` → `BLOCKED`; phiếu thiếu Cadmi → blocker `observedValue: "NOT_EXTRACTED"`; luật cách ly `RUL-GB2762-CD` **không** nổ; Cadmi 0.900 mg/kg → `BLOCKED` → override → blocker **vẫn còn** trong manifest (`criticalBlockers: 1`) → zero số đó bằng tay thì bộ kiểm chứng phát hiện |
| S11 | Backup → verify → restore | backup 12 hồ sơ / 35 chứng từ / 32 blob; `verify` 2 lần cho kết quả **giống hệt**; restore hợp lệ; **SHA-256 của tệp DB sau restore bằng bản gốc**; hồ sơ + manifest + chuỗi kiểm toán đọc được sau restore; **32/32 blob băm lại đúng**; lật 1 byte trong 1 blob → `verify` trả 3 lỗi (`Corrupted blob for document 'DOC-…': expected 'b5f126eb…', got '6817c431…'` + `Manifest blob integrity mismatch`) |

---

## 3B. Luồng chính qua máy chủ HTTP thật — `evidence/HTTP-WALKTHROUGH-LOG.txt`

Khởi động tiến trình server thật trên cơ sở dữ liệu diễn tập riêng:

```
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads DURIOS_PORT=3111 bun run src/server/server.ts
→ 🚀 DuriOS Local Core Server running at: http://127.0.0.1:3111     (assertLoopbackHostname: không có ingress công khai)
```

Rồi chạy `bash docs/reports/arena-stage0-20261029/evidence/http-walkthrough.sh` (17 bước, `curl` → `127.0.0.1:3111`). Kết quả đo được:

| Bước | Đo được |
|---|---|
| 1 | `GET /api/health` → `{"status":"healthy","service":"durios-core-api"}` |
| 2 | `POST /api/auth/login` (`clerk.cailay`) → `200`, `authMethod: "PASSWORD_SESSION"`, `actor.role: "CLERK"` |
| 3 | `GET /api/auth/me` → `role: "CLERK"`, `tenantId: "TENANT-CAILAY-PILOT-01"` (server quyết định) |
| 4 | Gửi kèm `x-actor-role: MANAGER` → server vẫn thấy `role seen by server = CLERK` |
| 5 | Không có phiên → `401` |
| 6 | `POST /api/dossiers` (`CSQU3054383`) → `DRAFT`, `version: 1` |
| 7 | Nạp 3 chứng từ tổng hợp (PACKING_LIST, LAB_TEST_REPORT, PHYTOSANITARY_CERTIFICATE) → mỗi tệp một `sha256` |
| 8 | Trích xuất **10 trường**; xác nhận từng trường (HITL) → `version` tăng dần tới 14 |
| 9 | `POST /validate` → `{"status":"PASSED","blockers":0,"version":15}` |
| 10 | `CLERK` approve → `403 {"errorCode":"INSUFFICIENT_ROLE","error":"Clerk role is unauthorized for manager export sign-off."}` |
| 11 | `MANAGER` approve → `APPROVED_FOR_EXPORT` (v16); export → `EXPORTED`, `isImmutable: true` |
| 12 | Nạp chứng từ vào hồ sơ đã niêm phong → `409 "Dossier is sealed and immutable…"` |
| 13 | `GET /manifest` có **cả hai** mã băm; `verify:manifest` → `valid: true`, `integrityCoverage: "FULL"`, exit `0` |
| 14 | `GET /audit` → 17 sự kiện, `DOSSIER_CREATED` → `DOSSIER_SEALED_EXPORTED` |
| 15 | `GET /api/pilot/kpi` → `totalContainers: 6`, `meanDeltaSeconds: 0.09`, `timingEvidenceSource: "SYSTEM_TIMESTAMPS"`, `valueMetricsProvenance: "UNVALIDATED_ASSUMPTION"`; `GET /api/pilot/gates` → `2/5`, `goForLiveCustomerData: false`, `evidenceProvenance: "OPERATIONAL"` |
| 16 | `POST /api/auth/pilot-rehearsal-bootstrap?role=MANAGER` (không xác thực) → `403 FEATURE_DISABLED` kèm thông báo giải thích vì sao bị từ chối và cách cấp tài khoản đúng (`src/auth/pilot-ops-cli.ts`) |
| 17 | `./data` của kho vẫn chỉ có `uploads/` — không có `durios.db` |

## 3C. Diễn tập backup/restore standalone — `evidence/BACKUP-RESTORE-DRILL-LOG.txt`

`bun docs/reports/arena-stage0-20261029/evidence/backup-restore-drill.ts` (tự seed 5 container tổng hợp vào thư mục tạm nếu không truyền đường dẫn) → **11 kiểm tra / 0 thất bại / exit 0**:

```
backup manifest : dossiers=5 documents=15 blobs=15 auditChainValid=true databaseSha256=<64 hex>
verify × 2      : valid=true, kết quả giống hệt (idempotent)
restore         : valid=true
sha DB restore  : ab06be7ae9c742d6…  == databaseSha256 trong manifest
                  (khác liveSource a1a5bc5a0236a12c… vì backup là ảnh VACUUM INTO của DB đang ở chế độ WAL)
blob            : 15/15 băm lại đúng
đọc lại SQLite  : container_dossiers=5, documents=15, audit_events=76,
                  firstEvent=DOSSIER_CREATED
chuỗi kiểm toán : 75/75 link liền mạch, genesis previous_hash=GENESIS-00000000
lật 1 byte blob : verifySiteBackup → invalid, lỗi nêu đích danh tài liệu + băm kỳ vọng/thực tế
```

## 3D. Công thức giả mạo manifest trong runbook — `evidence/MANIFEST-TAMPER-LOG.txt`

Ba ca giả mạo chạy trên manifest thật lấy từ bước 13 ở mục 3B:

| Ca | Sửa gì | Bộ kiểm chứng độc lập trả về |
|---|---|---|
| 1 | `regulatoryDisclaimers` → *"official GACC customs clearance approval"*; `complianceFindingsCount` → `{0,0}` (đều **ngoài** composite hash) | `valid: false`, `"Manifest integrity SHA-256 mismatch: a field outside the composite hash was altered"`, exit `1` |
| 2 | `containerNumber` → chữ số kiểm tra ISO 6346 sai (trong composite hash) | `valid: false`, **hai** lỗi: `"Composite SHA-256 mismatch"` + `"Manifest integrity SHA-256 mismatch"`, exit `1` |
| 3 | Xóa `manifestIntegritySha256` (giả lập manifest cũ trước khi sửa F-06) | `valid: true` nhưng `integrityCoverage: "PARTIAL_LEGACY"` + cảnh báo stderr: *"Compliance counts and disclaimers are NOT protected"*, exit `0` |

Ca 1 chính là ca mà **trước khi sửa F-06** bộ kiểm chứng trả `valid: true` (probe2). Ca 3 cho thấy tương thích ngược: manifest cũ không bị coi là hỏng, nhưng phạm vi bảo vệ bị hạ cấp và nói rõ cho người đọc.

## 4. Bằng chứng CLI (chạy trên cơ sở dữ liệu diễn tập riêng trong `/tmp`)

### 4.1 `pilot:seed-rehearsal` → `evidence/CLI-KPI-GATES-PROOFKIT-LOG.txt`
Seed `TENANT-CAILAY-PILOT-01` + 5 container + 2 lỗi gài mù + token `clerk.cailay`/`manager.cailay` vào `$TMPD/durios.db` (không phải `./data`).

### 4.2 `pilot:evaluate-kpi`
```
totalContainers        : 5
meanDeltaSeconds       : 0.03      ← THỜI GIAN MÁY, không phải thao tác người
underFiveMinuteGate    : true
blindFaultsCaught      : 2 / blindFaultCount: 2 → zeroMissGate: true
gate05Passed           : true
timingEvidenceSource   : "SYSTEM_TIMESTAMPS"
valueMetricsProvenance : "UNVALIDATED_ASSUMPTION"
assumptions            : MANUAL_BASELINE_MINUTES = 35 (phút/container, chưa kiểm chứng)
                         PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION = 35.000.000 (VND, chưa kiểm chứng)
                         noteVi: "KHÔNG phải số liệu đã kiểm chứng; không được trình bày như doanh thu, ROI
                                  hay thiệt hại tránh được thực tế."
```

### 4.3 `pilot:verify-gates` (đã sửa F-12) — **output đợt 2026-10-29; định dạng đã đổi, xem mục 9.4**
```
EXIT=1 (1 = chưa được nạp dữ liệu khách hàng thật)
goForLiveCustomerData : false      passedCount: 2      evidenceProvenance: "OPERATIONAL"
GATE-01: passed=false  PENDING_SITE_AND_CONSENT_SIGN_OFF
GATE-02: passed=false  PENDING_PROVIDER_CREDENTIALS
GATE-03: passed=true   PASS
GATE-04: passed=false  PENDING_VERIFIED_BACKUP
GATE-05: passed=true   PASS
```

### 4.4 `pilot:audit-pack` (đã sửa F-11) → `evidence/CLI-AUDIT-PACK-LOG.txt` — **output đợt 2026-10-29; dòng `Gates=2/5` đã được thay bằng hai bộ đếm, xem mục 9.4**
```
[DuriOS Field Auditor] Site=SITE-CAILAY-TIENGIANG-01 Verdict=HOLD_BLOCKERS_REMAIN Gates=2/5
                       SHA256=02cb9a6afe1a43155d8ee3a3d930a4f538093661ff7054e30735309471c4bd75 Integrity=true
Saved pack to: /tmp/cli-drill-na4i/pack/GOLIVE-SITE-CAILAY-TIENGIANG-01-2026-10-29.json
compiledByActorRole   : "AUDITOR"
goForLiveCustomerData : false
kpiSnapshot           : { totalContainers: 5, meanDeltaSeconds: 0.03, blindFaultsCaught: 2,
                          gate05Passed: true, timingEvidenceSource: "SYSTEM_TIMESTAMPS",
                          valueMetricsProvenance: "UNVALIDATED_ASSUMPTION" }
mandatoryDisclaimers  : "Hồ sơ chuẩn bị nội bộ … không thay thế quyết định thông quan hoặc chứng nhận nhà nước."
                        "Nghiêm cấm nạp dữ liệu khách hàng thật trước khi toàn bộ 5 cổng đều đạt."
--verify <pack.json>  : Integrity=true, EXIT=0
--verify (thiếu tệp)  : stderr "--verify expects the path of an exported go-live pack JSON file, but
                        '--output-dir' does not exist. Usage: …" EXIT=2
```

### 4.5 `verify:manifest` trên manifest do diễn tập sinh ra
`valid: true`, `integrityCoverage: "FULL"`, exit `0`.

### 4.6 `pilot:proof-kit` — cách ly tenant → `evidence/CLI-PROOFKIT-TENANT-ISOLATION-LOG.txt`
Chạy trên **cơ sở dữ liệu của diễn tập** (4 tenant), mỗi lần một `--tenant-id`:

| `--tenant-id` | `exportedManifestCount` | Manifest thuộc tenant nào | Verdict |
|---|---|---|---|
| `TENANT-DRILL-A` (chủ sở hữu) | **2** (`DOS-DRILL-OK`, `DOS-DRILL-HICD`) | chỉ `TENANT-DRILL-A` | `HOLD_BLOCKERS_REMAIN`, `goForLiveCustomerData: false` |
| `TENANT-DRILL-B` (được chia sẻ) | **0** | — | `HOLD_BLOCKERS_REMAIN`, `goForLiveCustomerData: false` |
| `TENANT-DRILL-C` (không liên quan) | **0** | — | `HOLD_BLOCKERS_REMAIN`, `goForLiveCustomerData: false` |

→ **Cách ly tenant đã kiểm chứng ở cả ba chỗ yêu cầu: export (S7), KPI/cổng (S8) và proof kit (bảng trên).** Bên được chia sẻ hồ sơ **không** nhận được manifest của chủ sở hữu trong bộ proof kit.

### 4.7 Ghi chú kỹ thuật khi chạy CLI
`bun run <npm-script>` in thêm dòng banner `$ bun run src/…` vào stdout, làm hỏng việc parse JSON. Muốn lấy JSON sạch: gọi thẳng `bun run src/…` (đã làm trong toàn bộ log trên) hoặc bỏ dòng đầu. Đây là đặc tính của Bun, không phải lỗi kho.

---

## 5. UI — `evidence/UI-RENDER-PROBE-LOG.txt` (**DOM-PROBE, không phải ảnh chụp**)

`src/server/public/index.html` (~192 KB) là giao diện được phục vụ. Đã sửa các phần phục vụ luồng Stage 0 (F-09, F-10). Kiểm chứng bằng cách nạp HTML thật vào `happy-dom` 21.0.4, trích `<script>` nội tuyến, `disableJavaScriptEvaluation: true` rồi `window.eval(scriptText + ";globalThis.__h = {…}")` để lấy handle các hàm UI:

```
PASS  A. empty state with no gate/KPI data reads PENDING instead of asserting results
PASS  B. empty state after a synthetic rehearsal labels the evidence as rehearsal
PASS  C. empty state with an operational 2/5 run says live data is not authorised
PASS  D. KPI section states timing and value-metric provenance
PASS  E. currentRole(): anonymous=MANAGER, CLERK session=CLERK (select synced to CLERK),
                       AUDITOR session=AUDITOR (select kept CLERK)
PASS  F. rehearsal toast is derived from the server response, not a fixed 5/5 claim
no runtime error events
```

Diễn giải ca E: `currentRole()` (`index.html:1294-1302`) **ưu tiên vai trò do server trả về** (`ui.actor.role`) và đồng bộ thẻ `<select>` theo nó; khi chưa đăng nhập thì trả về giá trị mặc định của select (`MANAGER`) — yêu cầu đó bị server từ chối `401`, và header `x-actor-role` vẫn được gửi vì `test/static-ui-contract.test.ts:44` khóa chuỗi `"x-actor-role": role` như hợp đồng tĩnh. Khi session là `AUDITOR` mà select đang để `CLERK`, hàm trả `AUDITOR` (select không ghi đè server).

**Giới hạn phải nói rõ:** sandbox không có trình duyệt đồ họa; `startLocalServer` gọi `assertLoopbackHostname` và **ném lỗi** với host không loopback (guard này cố ý không bị nới lỏng), nên không mở live preview và **không thể chụp ảnh màn hình desktop hay màn hẹp**. Do đó **không** khẳng định "UI đã được kiểm thử bằng mắt". Thay thế: checklist kiểm tra thủ công trong `RUNBOOK-STAGE0-REHEARSAL.md` mục 5.

---

## 6. Bảng yêu cầu V1 → tính năng hiện có → kiểm thử/bằng chứng → khoảng trống

| # | Yêu cầu (Phase B/C) | Tính năng hiện có (đường dẫn) | Bằng chứng | Khoảng trống còn lại |
|---|---|---|---|---|
| 1 | Actor/quyền phân giải phía server, client không tự nâng quyền | `src/auth/*`, `x-actor-role` bị bỏ qua; `currentRole()` (`index.html:1294`) | DRILL S6 (`401`/`403`/`404`), AUTO-TEST `test/auth-*`, DOM-PROBE E | — |
| 2 | Cách ly tenant ở đọc/ghi/chia sẻ/xuất | `listDossierRowsForActor`, `findById` lọc tenant | DRILL S6 | N-02 (oracle `404`/`403`) |
| 3 | Cách ly tenant ở **export** | `src/server/export-manifest-handler.ts:8`, `src/sharing/export-manifest-redactor.ts:26` | DRILL S7, AUTO-TEST 4 ca (F-01) | Manifest vẫn còn trường doc-level (`net_weight_kg`) theo chính sách 5A-5 hiện hành — quan sát, không sửa (xem mục 7) |
| 4 | Cách ly tenant ở **KPI/cổng** | `src/auth/pilot-kpi-cohort.ts:23`, `pilot-launch-gate-verifier.ts:17` | DRILL S8, AUTO-TEST (F-02), CLI 4.2/4.3 | — |
| 5 | Cách ly tenant ở **proof kit** | `src/export/field-proof-kit-cli.ts --tenant-id` | CLI 4.6 (2 vs 0 vs 0 manifest) | — |
| 6 | ≥ 2 tenant cho các sửa lỗi export/KPI gần đây | `test/helpers/two-tenant-sealed-dossier.ts` (99 dòng) | AUTO-TEST + DRILL (4 tenant) | — |
| 7 | Sửa trường/thay chứng từ làm mất thẩm định | `latestValidationResult` bị xóa → `HUMAN_VERIFICATION_REQUIRED` | DRILL S5, AUTO-TEST lifecycle | — |
| 8 | Thiếu dữ liệu/không trích xuất được/lỗi xử lý **không bao giờ** `PASSED` | `src/rules/extraction-completeness.ts`, `cadmium-evaluators.ts:38` | DRILL S10, AUTO-TEST (F-04/F-05) | Tệp **chữ** vẫn nhận giá trị fixture (phần dư F-05) |
| 9 | Phân biệt ngưỡng nội bộ vs quy chuẩn đã kiểm chứng; không kích hoạt luật cách ly | `src/rules/deterministic-engine.ts` (`RUL-INT-CD-WARN` 0.040 vs GB 2762-2022 0.050, `RUL-GB2762-CD` cách ly) | DRILL S10 (luật cách ly không nổ) | Quy chuẩn cần nguồn pháp lý được xác nhận ở Stage sau |
| 10 | Hữu cơ = bằng chứng lưu trữ, không phải chứng nhận DuriOS cấp | `EVIDENCE_STORED_NOT_CERTIFIED` | AUTO-TEST 5A-4 (đọc mã nguồn + kiểm thử có sẵn) | — |
| 11 | DB + blob nhất quán khi lỗi ghi/khởi động lại/khôi phục; không "thành công giả" | `document-persistence-flow.ts` (temp → sha256 → rename, `resolveSafePath`) | DRILL S11 (32/32 blob, sha DB khớp, lật 1 byte bị phát hiện) | N-04 (lỗi blob bị nuốt — chưa tái hiện được) |
| 12 | Upload/download/đường dẫn/xuất không thoát phạm vi được cấp | `resolveSafePath`, blob content-addressed | DRILL S6/S11, AUTO-TEST 5A-5 | N-01 (`tenant_id` lưu theo actor đọc) |
| 13 | Manifest giả mạo bị phát hiện bởi bộ kiểm chứng độc lập | `src/export/manifest-integrity.ts`, `standalone-manifest-verifier.ts:75,85` | DRILL S4 (7/7), AUTO-TEST 5 ca (F-06) | Manifest cũ chỉ được `PARTIAL_LEGACY` (có nhãn) |
| 14 | Backup → verify → restore có xác minh **sau** restore | `src/auth/site-backup-manager.ts` | DRILL S11 (đọc lại hồ sơ/manifest/chuỗi kiểm toán + băm lại 32 blob) | Chưa chạy trên hạ tầng thật của vựa (`GATE-04`) |
| 15 | Diễn tập không tạo ra `PASS`/sẵn sàng giả | `pilot-gate-report-builder.ts:18-23,55`, `pilot-dossier-pack-compiler.ts:57-74` | DRILL S9, AUTO-TEST (F-07), CLI 4.3/4.4 | — |
| 16 | KPI/cổng tổng hợp không hiển thị như kết quả thật | `index.html:1482,1499,2121-2127,3116` | DOM-PROBE A-D, F | **Chưa có ảnh chụp màn hình** |
| 17 | Bàn giao để người khác tự dựng môi trường tổng hợp | `RUNBOOK-STAGE0-REHEARSAL.md`, `evidence/drill-stage0.ts`, README/`docs/pilot-readiness` đã sửa | Chạy lại được từ thư mục báo cáo (55/0) | Cần người thật đọc và xác nhận runbook (`GATE-03`) |

---

## 7. Quan sát không sửa (có lý do)

- **`net_weight_kg` ở mức chứng từ vẫn lộ cho bên nhận chia sẻ**: đây là chính sách 5A-5 hiện hành, được khóa bởi `test/helpers/redaction-and-blobs-5a5-*`. Mở rộng `QUANTITY_KEYS` sẽ đổi hành vi lọc ở luồng **xem hồ sơ** (không chỉ manifest) → ngoài phạm vi được phép; đã ghi nhận làm quan sát.
- **`src/server/http-router.ts` đúng 99 dòng**: không còn dư địa; mọi logic mới phải nằm ở module riêng (`src/server/export-manifest-handler.ts`, `src/server/rehearsal-bootstrap-guard.ts`). Đây là lý do các module mới ra đời, không phải refactor tùy hứng.
- **`pilot:seed-rehearsal` mặc định ghi vào `./data/durios.db`** với mật khẩu cố định công khai: hành vi Stage 0 **đã được tài liệu hóa**, không đổi mặc định (tránh đổi hành vi vận hành ngoài phạm vi); thay vào đó thêm cảnh báo trong `README.md` §3.4 và `docs/pilot-readiness/06_…` dòng 1, kèm lệnh khuyến nghị dùng `DURIOS_DB_PATH` riêng.
- **`--verify` ở chế độ kiểm chứng vẫn in `Saved pack to: <tệp vừa kiểm chứng>`**: gây nhầm nhẹ về chữ nghĩa, không sai dữ liệu; không sửa để tránh rủi ro cho đường CLI đang được tài liệu.

---

## 8. Những gì **chưa** kiểm chứng được

1. Ảnh chụp màn hình desktop/màn hẹp (yêu cầu của `AGENTS.md` khi đổi `src/ui/`) — không có trình duyệt trong sandbox, và server cố ý chỉ bind loopback nên không có live preview. **Hạng mục UI vì thế vẫn ở trạng thái CHƯA ĐẠT (not accepted)**; bằng chứng thay thế là DOM-PROBE 7/7 và checklist thủ công 23 mục (`RUNBOOK-STAGE0-REHEARSAL.md` §7).
2. Thao tác bàn phím thực tế, focus visible, trình đọc màn hình — chỉ mới xác nhận bằng đọc mã nguồn (`skip link`, `aria-live`, nhãn nút) và checklist thủ công; **chưa chạy** với assistive technology thật.
3. Hành vi trên hạ tầng thật của vựa: đĩa thật, lịch backup thật, OTP thật, mạng thật (`GATE-01/02/04`).
4. Thời gian thao tác của con người (`GATE-05` cần `HUMAN_STOPWATCH_ATTESTED`).
5. Đối chiếu với commit `08992f6` mà đề bài nhắc tới — **không truy cập được** trong clone nông, nên **không thể chứng minh** quan hệ giữa cây làm việc này và commit đó. Để người nhận vẫn đối chiếu được, đợt bàn giao kèm `package/`: commit cơ sở thật (`2f1538e…`), danh sách tệp, checksum SHA-256, patch đã kiểm `git apply --check` trên bản clone sạch, và **snapshot toàn bộ nội dung tệp bị ảnh hưởng** (mục 9.6).
6. Độ chính xác trích xuất trên chứng từ thật (Stage 0 chỉ có fixture extractor).

---

## 9. Đo lại sau chỉnh sửa cuối cùng (2026-10-30) — `evidence/rerun-20261030/`

Toàn bộ số liệu dưới đây chạy **sau** khi mọi thay đổi mã nguồn của đợt này hoàn tất (chế độ synthetic có điều kiện, guard đích seed diễn tập, tách hai bộ đếm cổng, nhận diện cohort tổng hợp). Môi trường: sandbox `/home/user/durios`, nhánh `arena/e0ece0a7-durios`, commit cơ sở `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494`, bun 1.4.4, node v22.22.3. Không có thay đổi nào ở mục này được suy ra từ đọc mã nguồn.

### 9.1 Kiểm tra tĩnh, bộ test, chuẩn modular — `TYPECHECK-LOG.txt`, `TEST-SUITE-LOG.txt`, `MODULARITY-LOG.txt`

| Lệnh | Kết quả | EXIT |
|---|---|---|
| `bun run typecheck` (`tsc --noEmit`, strict + `exactOptionalPropertyTypes`) | không lỗi | **0** |
| `bun test` | **286 pass / 0 fail**, 4.484 `expect()`, 67 tệp, ~20,0 s | **0** |
| `evaluateCodebaseModularityDeep(process.cwd())` | `GO_MODULAR_ZERO_ANY_VERIFIED`; maxSrc 100, maxTest 100, ceiling 100, `: any` = **0**, 164 tệp `src/`, 5/5 lượt Socratic pass | **0** |

**Ghi chú kỹ thuật (đo được, không suy đoán):** gói bàn giao `package/snapshot/` chứa **bản sao nguyên văn** các tệp bị ảnh hưởng, trong đó có các tệp `test/*.test.ts`. Khi chưa giới hạn thư mục quét, `bun test` đã chạy luôn các bản sao đó: **290 test / 77 tệp / 12 fail** (các bản sao import `../src/…` trong snapshot và giành nhau thư mục dữ liệu `./data/test-*`). Đã sửa bằng `bunfig.toml` → `[test] root = "./test"`; sau đó bộ test trở lại **278 pass / 0 fail / 65 tệp** (số liệu tại thời điểm đó; đợt đo cuối 2026-10-30 là **286 / 0 / 67**), và việc gọi một tệp kiểm thử theo đường dẫn (`bun test test/<tệp>`) vẫn hoạt động.

So với đợt 2026-10-29 (258 pass / 61 tệp): thêm 20 test và 4 tệp kiểm thử mới — `test/synthetic-extraction-mode.test.ts`, `test/rehearsal-seed-target-guard.test.ts`, `test/pilot-gate-evidence-split.test.ts`, `test/gate-cohort-provenance.test.ts` — cùng 2 helper (`test/helpers/gate-operator-evidence.ts`, `test/helpers/operational-cohort-fixture.ts`).

### 9.2 Diễn tập — `DRILL-STAGE0-LOG.txt`, `BACKUP-RESTORE-DRILL-LOG.txt`

| Diễn tập | Kết quả | EXIT |
|---|---|---|
| `evidence/drill-stage0.ts` (S1–S11) | **55 kiểm tra, 0 thất bại** | 0 |
| `evidence/backup-restore-drill.ts` | **11 kiểm tra, 0 thất bại** | 0 |

Cả hai chạy với `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true` (bắt buộc, vì kịch bản nạp `fixtureFields`); nếu không có cờ này, bước nạp chứng từ bị từ chối `400 SYNTHETIC_EXTRACTION_DISABLED` — đó là hành vi đúng của luồng thường, không phải lỗi diễn tập. S10 vẫn khẳng định: diễn tập "đủ 5 cổng" cho nhãn `PASS_SYNTHETIC_REHEARSAL`, `evidenceProvenance: SYNTHETIC_REHEARSAL` và `goForLiveCustomerData: false`.

### 9.3 Luồng chính qua HTTP thật — `HTTP-WALKTHROUGH-LOG.txt`

Server `bun src/server/server.ts` bind `127.0.0.1:3111` (không mở public), DB diễn tập riêng trong `/tmp`, client `curl`: **17 bước, EXIT=0**. Điểm khác biệt so với log 2026-10-29:

- Bước 15 in **hai** bộ đếm: `machine checks: 2 / 5 | launch gates evidenced: 0 / 5 | goForLiveCustomerData: False | provenance: SYNTHETIC_REHEARSAL`, kèm trạng thái từng cổng `(machine=…, externalEvidence.status, gateVerdict)`.
- `provenance` là `SYNTHETIC_REHEARSAL` vì cohort của DB này gồm 5 hồ sơ seed + 1 hồ sơ tạo qua API (cohort **trộn** vẫn bị coi là tổng hợp — F-14).
- Các đường từ chối vẫn đúng: clerk approve → `403 INSUFFICIENT_ROLE`; bootstrap diễn tập không khai báo cờ → `403 FEATURE_DISABLED`; upload sau niêm phong → `409`.

### 9.4 Ma trận CLI cổng khai trương — `GATE-CLI-MATRIX-LOG.txt`

Bảy ca trên hai cơ sở dữ liệu (script tái hiện: `evidence/gate-cli-matrix.sh` + `evidence/gate-cohort-site.ts`):

| Ca | Dữ liệu / bằng chứng khai báo | Máy chấm | Cổng đủ bằng chứng | provenance | go-live | EXIT |
|---|---|---|---|---|---|---|
| A1 | DB diễn tập, chỉ host loopback | 2/5 | 0/5 | SYNTHETIC_REHEARSAL | false | 1 |
| A2 | DB diễn tập, đủ 5 tiêu chí máy, **không** bằng chứng | 5/5 | 0/5 | SYNTHETIC_REHEARSAL | false | 1 |
| A3 | DB diễn tập + **khai báo đủ 5 tệp bằng chứng** | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false | 1 |
| B1 | Cohort fixture vận hành, đủ 5 tiêu chí máy, không bằng chứng | 5/5 | 0/5 | OPERATIONAL | false | 1 |
| B2 | B1 + bằng chứng cho 1 cổng (có tên người ghi nhận) | 5/5 | 1/5 | OPERATIONAL | false | 1 |
| B3 | B1 + khai báo bằng chứng cho cổng có **máy chấm FAIL** | 4/5 | 4/5 | OPERATIONAL | false | 1 |
| B4 | B1 + đủ 5 máy chấm và đủ 5 bằng chứng khai báo | 5/5 | 5/5 | OPERATIONAL | **true** | **0** |

Ba kết luận kiểm chứng được: (i) dữ liệu do seeder diễn tập tạo ra **không** mở được cổng dù khai báo đủ bằng chứng (A3, F-14); (ii) bằng chứng khai báo **không** nâng được tiêu chí máy chưa đạt (B3: `GATE-01` vẫn `PENDING` dù `externalEvidence.status = RECORDED_BY_OPERATOR`); (iii) chỉ ca B4 — một **fixture** do script tự tạo, không phải hiện trường — mới cho `EXIT=0`. Dòng CLI kiểm toán nay in `MachineChecks=2/5 LaunchGatesEvidenced=0/5` thay vì một con số `Gates=2/5` (F-15).

### 9.5 Giao diện — `UI-RENDER-PROBE-LOG.txt` (**DOM-PROBE, không phải ảnh chụp**)

`node evidence/ui-render-probe.mjs` với `happy-dom` (cài riêng, không phải dependency của dự án): **7/7 PASS**, không có lỗi runtime trong DOM. Các ca: A trạng thái rỗng PENDING · B kết quả diễn tập có nhãn tổng hợp và `0/5 CỔNG ĐỦ BẰNG CHỨNG` + ghi chú máy chấm `5/5` · C ca vận hành nói rõ chưa được nạp dữ liệu thật · D huy hiệu KPI in `LAUNCH GATE: 0/5 cổng đủ bằng chứng · MÁY CHẤM: 5/5` + callout giải thích hai con số · E vai trò lấy từ phiên server · F toast suy ra từ phản hồi server · G từng dòng cổng in riêng máy chấm / bằng chứng / kết luận. **Hạng mục ảnh chụp màn hình vẫn CHƯA ĐẠT** (mục 8.1).

### 9.5B Luồng trích xuất thường so với chế độ tổng hợp — `EXTRACTION-MODE-LOG.txt`

`evidence/extraction-mode-demo.ts` chạy cả hai luồng trên byte tổng hợp, trong thư mục tạm: **19 kiểm tra, 0 thất bại, EXIT=0**.

| Đầu vào | Luồng thường (không có cờ) | Chế độ tổng hợp (bật cờ tường minh) |
|---|---|---|
| `text/plain` (PACKING_LIST) | chỉ giá trị **có thật trong byte**: container `MSKU1234565`, seal `SEAL-ORD-77`, net weight `17500`, boxes `880` | — |
| `text/plain` (LAB_TEST_REPORT) | `cadmium_mg_kg = 0.062` đúng như trong tệp; **không** có `0.028` của template | — |
| `application/pdf` (stub không đọc được) | **0** trường | 4 trường template (`MSKU1234567`, `SL-998822`, `960`, `18240.00`) — có nhãn tổng hợp |
| `application/json` không chứa dữ liệu chứng từ | **0** trường | — |
| `application/json` khai `container_number` trong payload | 1 trường, giá trị **đúng bằng chuỗi có trong payload** (không phải giá trị mẫu) | — |
| `image/png`, `image/jpeg`, `image/tiff` | **0** trường | — |
| upload qua API: ảnh scan + PDF stub | 2 chứng từ, **0** trường, thẩm định `BLOCKED` với `criticalBlockers=4` và 2 × `RUL-DOC-UNREADABLE` | — |
| upload tệp `.txt` qua API | **bị từ chối ngay ở cửa**: `Supported formats: PDF, PNG, JPEG, TIFF` + sự kiện kiểm toán `DOC_UPLOAD_REJECTED` | hành vi giống nhau (kiểm tra tệp không phụ thuộc chế độ) |
| upload kèm `fixtureFields` | `SyntheticExtractionDisabledError`, **0** trường được ghi, sự kiện `DOC_UPLOAD_REJECTED` với `reason = SYNTHETIC_EXTRACTION_DISABLED` | được chấp nhận; các trường vẫn ở trạng thái `DRAFT` (chưa `HUMAN_VERIFIED`) nên HITL vẫn bắt buộc |

Không giá trị canary nào của template (`TEMPLATE_CANARY_VALUES`, 8 giá trị) xuất hiện trong bất kỳ đầu ra nào của luồng thường.

### 9.6 Ánh xạ 6 hạng mục bắt buộc → bằng chứng

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Kết luận cổng chỉ dựa trên bằng chứng hợp lệ; không tự đổi tiêu chí, không tự ký, không dùng kết quả synthetic để mở cổng | **ĐẠT (đã kiểm chứng, cơ chế nguồn gốc viết lại — xem §9.7)** | F-14 + F-14b, `src/auth/gate-cohort-provenance.ts`, `gate-evidence-artifact.ts`, `gate-criteria.ts`, `test/gate-cohort-provenance.test.ts`, `test/gate-provenance-adversarial.test.ts`, `test/gate-evidence-artifact.test.ts`, ma trận A3/B3, `GATE-PROVENANCE-ADVERSARIAL-LOG.txt`, `GATE-MATRIX.md` §0.1–0.3 |
| 2 | Đóng phần dư F-05 không cần OCR: fixture chỉ chạy trong chế độ synthetic bật tường minh; luồng thường trả trạng thái không trích xuất và không đưa giá trị mẫu ra như dữ liệu chứng từ | **ĐẠT (đã kiểm chứng)** | `test/synthetic-extraction-mode.test.ts` (text/plain, application/pdf, application/json, ảnh), diễn tập S10, `src/extraction/synthetic-extraction-mode.ts` |
| 3 | Seeder diễn tập không âm thầm dùng DB vận hành; đòi đích tường minh; từ chối ghi vào dữ liệu không phải diễn tập; cập nhật hướng dẫn | **ĐẠT (đã kiểm chứng)** | `test/rehearsal-seed-target-guard.test.ts`, `src/auth/rehearsal-seed-target-guard.ts`, `RUNBOOK-STAGE0-REHEARSAL.md` §2 |
| 4 | Nói rõ "2/5" là gì; CLI/UI không diễn đạt hai khái niệm như nhau; báo cáo riêng kết quả máy chấm và trạng thái từng cổng | **ĐẠT (đã kiểm chứng)** | `test/pilot-gate-evidence-split.test.ts`, `GATE-CLI-MATRIX-LOG.txt`, `UI-RENDER-PROBE-LOG.txt` (ca D, G), `GATE-MATRIX.md` §0.1 |
| 5 | Đóng gói đầy đủ: commit cơ sở, danh sách tệp, checksum, patch qua `git apply --check`, snapshot toàn bộ tệp bị ảnh hưởng, và nêu rõ không chứng minh được quan hệ với `08992f6` | **ĐẠT — bổ sung cây cơ sở đầy đủ + archive bàn giao (xem §9.8)** | `package/MANIFEST.txt`, `package/stage0-full.patch`, `package/snapshot/`, `package/base-2f1538e….tar.gz`, `package/delivered-tree-20261030.tar.gz`, `package/APPLY-VERIFY-LOG.txt`, `delivery/durios-stage0-handover-20261030.tar.gz` |
| 6 | Chạy lại typecheck, toàn bộ test và các diễn tập sau chỉnh sửa cuối; đính kèm log + checksum; happy-dom không được tính là ảnh chụp | **ĐẠT một phần** | mục 9.1–9.5 + `package/MANIFEST.txt`; **ảnh chụp màn hình: KHÔNG ĐẠT** (không có trình duyệt) → hạng mục UI giữ nguyên trạng thái chưa nghiệm thu |

### 9.7 Kiểm tra đối kháng nguồn gốc dữ liệu cổng khai trương — `GATE-PROVENANCE-ADVERSARIAL-LOG.txt`

**Câu hỏi của Founder:** nếu nguồn gốc cohort chỉ dựa vào tiền tố mã hồ sơ thì một câu `UPDATE` là qua mặt được; phải nói rõ giới hạn và sửa cơ chế trước khi đóng F-14.

**Xác nhận giới hạn:** đúng. Bản sửa F-14 đầu tiên chỉ kiểm tra `dossier_code.startsWith("DOS-CAILAY-R")`. Đã **thay cơ chế**: tín hiệu nguồn gốc được ghi **lúc dữ liệu sinh ra** vào sổ kiểm toán append-only có chuỗi băm (`SYNTHETIC_DOCUMENT_INGESTED` do `src/workspace/document-ingestion-orchestrator.ts` ghi khi nạp tài liệu thành công trong chế độ tổng hợp; `REHEARSAL_DOSSIER_SEEDED` do `src/server/ecosystem-rehearsal-seeder.ts` ghi cho từng hồ sơ diễn tập), và `resolveCohortProvenance(containerMetrics, auditEvents)` lọc theo `dossierId`. Tiền tố mã hồ sơ chỉ còn là tín hiệu phụ cho DB cũ.

**Kịch bản:** `evidence/gate-provenance-adversarial.ts` (chạy trên SQLite thật, tấn công bằng SQL thô) → log `evidence/rerun-20261030/GATE-PROVENANCE-ADVERSARIAL-LOG.txt`, `EXIT=0`.

| Ca | Tấn công | Máy chấm | Cổng đủ bằng chứng | `evidenceProvenance` | `goForLiveCustomerData` |
|---|---|---|---|---|---|
| A0 | (cơ sở) DB diễn tập + 5 tệp bằng chứng do script tự tạo, có `attestedBy` | 5/5 | 0/5 | SYNTHETIC_REHEARSAL | false |
| A1 | `UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-' || substr(id,-6)` | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| B0 | (cơ sở) cohort vận hành fixture, không có ingest tổng hợp | 5/5 | 5/5 | OPERATIONAL | true — **fixture, không phải quyết định khai trương** |
| B1 | trộn 1 container tổng hợp mã `DOS-TG-CUSTOMER-77` vào cohort B0 (6 container) | 5/5 | **0/5** | SYNTHETIC_REHEARSAL | false |
| C1 | `DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')` | 4/5 (GATE-03 fail) | **0/5** | **UNPROVEN_LEDGER_INTEGRITY** | false |
| D1 | khai báo 5 "tệp bằng chứng" không tồn tại (một đường dẫn là thư mục) trên site vận hành xanh | 5/5 | **0/5** | OPERATIONAL | false |

Ở ca A1, `cohortProvenance.signals` **không còn** tín hiệu `REHEARSAL_DOSSIER_CODE:*` mà vẫn còn `REHEARSAL_DOSSIER_SEEDED:<dossierId>` và `SYNTHETIC_DOCUMENT_INGESTED:<dossierId>` — bằng chứng trực tiếp rằng sổ kiểm toán, không phải tên hồ sơ, đang giữ cổng. Ở ca C1, gói kiểm toán biên dịch từ DB đó ra `HOLD_BLOCKERS_REMAIN` kèm tuyên bố miễn trừ `UNPROVEN LEDGER INTEGRITY` và `verifyPilotGoLiveDossierPackIntegrity(pack) === true`.

**Kiểm thử hồi quy:** `test/gate-provenance-adversarial.test.ts` (3 kiểm tra: đổi tên, trộn cohort, xoá dòng kiểm toán + gói), `test/gate-cohort-provenance.test.ts` (4 kiểm tra, gồm ca phân loại đơn vị theo tín hiệu sổ kiểm toán và ca cohort trộn 10 container), `test/gate-evidence-artifact.test.ts` (5 kiểm tra: tệp thật + SHA-256 đúng bằng `node:crypto`, đường dẫn không tồn tại, thư mục, tệp vô danh, tệp > 25 MB, và ca khai báo tệp khống trên site vận hành xanh → `0/5`).

**Giới hạn còn lại (nêu rõ, không giấu):** (1) dữ liệu do con người gõ tay từ chứng từ bịa không phân biệt được với dữ liệu nhập thật bằng kiểm tra máy; (2) nội dung tệp bằng chứng không được máy thẩm định; (3) `SYNTHETIC_DOCUMENT_INGESTED` chỉ ghi khi chế độ tổng hợp bật — tiến trình không bật thì không có đường nạp `fixtureFields` (bị chặn bởi `SyntheticExtractionDisabledError` + `DOC_UPLOAD_REJECTED`).

### 9.8 Đóng gói bàn giao và kiểm gói — `package/APPLY-VERIFY-LOG.txt`

| Bước | Câu lệnh | Kết quả đo được |
|---|---|---|
| Kiểm checksum của chính artefact người soát nhận được | `sha256sum -c` (trong `verify-package.sh`) | patch + base archive + delivered-tree archive: `OK`; toàn bộ tệp `snapshot/`: `OK` (số tệp: `package/APPLY-VERIFY-LOG.txt`) |
| Cây cơ sở đầy đủ tại commit rẽ nhánh | `git archive --format=tar.gz --prefix=durios-base-2f1538e/ 2f1538e…` | 523 tệp = đúng `git ls-tree -r --name-only 2f1538e… | wc -l` (590 mục tar kể cả thư mục) |
| Áp patch lên cây cơ sở vừa giải nén | `git apply --check` rồi `git apply` | cả hai `exit 0` (patch = 35 tệp sửa + toàn bộ tệp mới; số dòng/byte ghi trong `MANIFEST.txt` vì patch chứa chính các báo cáo này; 3 cảnh báo whitespace trong log là của nội dung log bằng chứng, không phải lỗi áp) |
| So kết quả với snapshot | `cmp -s` từng tệp | **mismatch=0** trên toàn bộ tệp snapshot (số `identical=` ghi trong `package/APPLY-VERIFY-LOG.txt`) |
| So cây đã bàn giao với cây làm việc | giải nén `delivered-tree-20261030.tar.gz` rồi `cmp -s` | **differ=0** trên toàn bộ cây (số `identical=` ghi trong `package/APPLY-VERIFY-LOG.txt`) (loại trừ có chủ đích: `.git`, `node_modules`, `data/`, `package/`, `delivery/`) |
| Kết luận của log | — | **`PACKAGE_VERIFIED`** |
| Archive bàn giao duy nhất | `build-handover-archive.sh` | `delivery/durios-stage0-handover-20261030.tar.gz` — mọi tệp bên trong có SHA-256 trong `CHECKSUMS.txt`, kèm `<tên>.tar.gz.sha256` cho chính archive; SHA-256 của archive được nêu trong tin nhắn bàn giao (không nhúng vào tài liệu bên trong, vì tài liệu ấy nằm trong archive nên sẽ tự làm đổi băm) |

### 9.9 Ánh xạ 5 hạng mục bàn giao mới nhất → bằng chứng

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Archive tải được (gồm `package/`, báo cáo, `evidence/rerun-20261030/`) + SHA-256 | **ĐẠT** | §9.8 dòng cuối; `delivery/…tar.gz` + `.sha256` + `CHECKSUMS.txt`; `README-HANDOVER.md` |
| 2 | Snapshot/đế đầy đủ tại `2f1538e`; patch để riêng để so với `08992f6` | **ĐẠT** | `package/base-2f1538e….tar.gz` (523 tệp), `package/delivered-tree-20261030.tar.gz` (toàn bộ cây đã bàn giao), `package/stage0-full.patch` (để riêng), `package/APPLY-VERIFY-LOG.txt`; tuyên bố **không chứng minh được** quan hệ với `08992f6` giữ nguyên trong `MANIFEST.txt` |
| 3 | Kiểm tra đối kháng F-14 (đổi tên, cohort tổng hợp mã tuỳ ý, trộn cohort); sửa cơ chế nếu chỉ dựa tiền tố | **ĐẠT** | §9.7 (6 ca + kiểm thử hồi quy), `FINDINGS.md` F-14b |
| 4 | Ai được ghi `externalEvidence`, kiểm tra thế nào, chặn bằng chứng tổng hợp ra sao | **ĐẠT** | `GATE-MATRIX.md` §0.3(a)(b)(c), §9.7 ca D1, `test/gate-evidence-artifact.test.ts`, `docs/pilot-readiness/01_…` quy tắc 2 và 4 |
| 5 | UI chưa nghiệm thu cho tới khi có kiểm tra trình duyệt thật + ảnh chụp | **GIỮ NGUYÊN: CHƯA NGHIỆM THU** | §9.5 (DOM probe 7/7, không phải ảnh chụp), §9.11, `UI-ACCEPTANCE-CHECKLIST.md` (57 mục), `REPORT.md` §1.5 dòng 5 và §1.6 dòng 5 |

### 9.10 Nghiệm thu tuần tự 10 bước — `evidence/acceptance-harness.sh`

Một lệnh duy nhất cho người soát, đúng yêu cầu "bộ nghiệm thu phải tái hiện được":

```bash
bash docs/reports/arena-stage0-20261029/evidence/acceptance-harness.sh --archive <handover.tar.gz>
```

| Bước | Script/lệnh được gọi | Kết quả mong đợi được assert |
|---|---|---|
| 1 | `sha256sum -c` (archive + `.sha256`), `tar -tzf`, giải nén vào **thư mục tạm**, `sha256sum -c CHECKSUMS.txt`, `package/SHA256SUMS.txt` nếu có | mọi `sha256sum -c` exit **0**; listing đủ 5 báo cáo + checklist UI + `evidence/` + `package/`; `CHECKSUMS.txt` khớp từng tệp; **không** giải nén đè lên cây |
| 2 | `bun install --frozen-lockfile` | exit **0** và SHA-256 của `bun.lock` không đổi |
| 3 | `bun run typecheck`, `bun test` | cả hai exit **0**, log test có `0 fail` |
| 4 | seeder diễn tập → `src/server/server.ts` trên `127.0.0.1:<port>` → `http-walkthrough.sh` | server log có `127.0.0.1:<port>`, không có `0.0.0.0`; walkthrough exit **0** và đủ 10 marker (vai trò giả bị bỏ qua, 401, 403 `INSUFFICIENT_ROLE`, seal 409, `integrityCoverage: FULL`, chuỗi audit, `machine checks: 2 / 5 | launch gates evidenced: 0 / 5 … SYNTHETIC_REHEARSAL`, 403 `FEATURE_DISABLED`); server dừng, cổng đóng; không có `data/durios.db` trong cây |
| 5 | `drill-stage0.ts` → `permission-tenant-isolation.sh` | drill exit **0** (55 kiểm tra, gồm 404/403/redaction); script tenant exit **0** (23 kiểm tra: proof kit A chỉ chứa manifest của A, B/C/D = 0 manifest, override vẫn giữ 1 blocker, 9 tệp test RBAC/tenant/redaction `0 fail`) |
| 6 | `extraction-mode-demo.ts` với cờ synthetic **bị gỡ** | exit **0**, `failures=0`, "no template canary value appeared anywhere in the ordinary flow", có `SYNTHETIC_EXTRACTION_DISABLED` và `RUL-DOC-UNREADABLE` |
| 7 | `gate-provenance-adversarial.ts` | exit **0** và `== summary == checks=54 failures=0`; A1/B1/C1/D1 đều `0/5`, C1 = `UNPROVEN_LEDGER_INTEGRITY`, D1 = 0 bằng chứng được ghi |
| 8 | `gate-cli-matrix.sh` | exit **0** và `cases=7 auditorCalls=2 failures=0`; A1–B3 **exit 1** (BLOCKED là kết quả đúng), chỉ B4 exit 0; B3 = 4 máy / 4 bằng chứng; 2 lần auditor in `HOLD_BLOCKERS_REMAIN MachineChecks=2/5 LaunchGatesEvidenced=0/5` |
| 9 | `backup-restore-drill.ts` + đọc lại `drill-log.txt` | exit **0**, `failures=0`; hash CSDL sau khôi phục bằng hash trong manifest backup; mọi blob băm lại đúng; lật 1 byte bị phát hiện; chuỗi audit sau khôi phục hợp lệ |
| 10 | `standalone-manifest-verifier.ts` trên manifest của drill | nguyên vẹn exit **0** + `FULL`; sửa 1 giá trị kiểm nghiệm exit **1**; thiếu `manifestIntegritySha256` exit **0** + `PARTIAL_LEGACY`; drill phát hiện **7/7** ca giả mạo |

Ba tính chất cố ý có trong harness:

1. **Không `set -e`, không `|| true`.** Mỗi lệnh được bắt mã thoát rồi so với giá trị kỳ vọng bằng
   `assert_exit`, nên exit 1 của một CLI cổng BLOCKED được ghi là PASS-đúng-kỳ-vọng thay vì bị che.
2. **Trạng thái bước suy ra từ kết quả thật.** `end_step` đếm số FAIL/SKIP sinh ra trong bước đó; một
   bước không thể được báo PASS khi có assertion bên trong sai.
3. **Log gắn với đúng snapshot.** Mỗi step log ghi `tree fingerprint` (SHA-256 trên danh sách
   `đường-dẫn: sha256` đã sắp xếp của mọi tệp trong cây, loại trừ `.git/`, `node_modules/`, `data/`,
   `package/`, `delivery/` và thư mục log), cùng `TREE-FINGERPRINT.txt`, `ENVIRONMENT.txt` và
   `HARNESS-SUMMARY.txt`. `HARNESS-SUMMARY.txt` ghi luôn `sha256` + số byte của bản archive đã được
   kiểm ở bước 1, vì archive chứa log của lượt chạy nên chỉ có thể kiểm bản đóng gói ngay trước nó.

Mã thoát: **0** = 10/10 bước và mọi assertion khớp; **1** = có assertion sai; **3** = có bước không chạy
được (thiếu artefact) ⇒ lượt nghiệm thu chưa trọn vẹn; **2** = sai cú pháp hoặc thiếu `bun`.

**Lượt chạy được giao kèm** — `evidence/acceptance-20261030T095617Z/`:

| Chỉ số | Kết quả đo |
|---|---|
| Nơi chạy | `/tmp/arena-tree` — cây giải nén từ `package/delivered-tree-20261030.tar.gz` **lấy ra từ chính archive bàn giao**, không phải cây làm việc trong sandbox |
| Trạng thái 10 bước | **10/10 PASS** (step-01 … step-10) |
| Assertion | **89 khớp / 0 fail / 0 bước bị bỏ qua** |
| Mã thoát harness | **0** |
| Archive đã kiểm ở bước 1 | SHA-256 và số byte ghi trong `HARNESS-SUMMARY.txt` (bản đóng gói ngay trước bản chứa log này — xem "vấn đề bootstrap" ở `README-HANDOVER.md` mục 2) |
| Fingerprint của cây tại thời điểm chạy | `TREE-FINGERPRINT.txt` (kèm số tệp, git HEAD nếu có) |
| Công cụ đã dùng | `ENVIRONMENT.txt` (bun 1.4.4, node v22.22.3, python 3.11.2, git 2.39.5) |

Không chép thêm số đo vào tài liệu này vì tài liệu nằm trong chính archive và trong chính cây mà
fingerprint đo: mọi con số phải đọc từ ba tệp trên.

### 9.11 Danh sách nghiệm thu UI — `UI-ACCEPTANCE-CHECKLIST.md`

| Nhóm | Số mục | Phạm vi | Trạng thái |
|---|---|---|---|
| UI-D | 9 | desktop ≥ 1280 px: thanh lệnh, sidebar, lưới KPI, hai bộ đếm, `gate-list`, `<dialog>`, theme, console | CHƯA NGHIỆM THU |
| UI-N | 9 | 360 × 640 và 768 × 1024: không tràn ngang, thu gọn sidebar, hộp thoại vừa màn hình, vùng chạm | CHƯA NGHIỆM THU |
| UI-K | 12 | bàn phím + trợ năng: thứ tự Tab, skip link, focus trap, Esc, trả focus theo `data-focus-key`, `aria-live` polite/assertive, `aria-busy`, `prefers-reduced-motion`, `lang="vi"` | CHƯA NGHIỆM THU |
| UI-E | 10 | trạng thái lỗi: 401/403/409, sai ISO 6346, xung đột phiên bản, mất kết nối, form chưa lưu, BLOCKED, bootstrap bị tắt | CHƯA NGHIỆM THU |
| UI-S | 10 | nhãn tổng hợp/diễn tập: `TỔNG HỢP (SYNTHETIC)`, `DIỄN TẬP TỔNG HỢP` / `VẬN HÀNH` / `SỔ KIỂM TOÁN KHÔNG XÁC MINH ĐƯỢC` / `KHÔNG XÁC ĐỊNH`, đoạn văn provenance, toast sinh từ phản hồi máy chủ | CHƯA NGHIỆM THU |
| UI-C | 7 | hai bộ đếm: `N/5 CỔNG ĐỦ BẰNG CHỨNG` vs "Kiểm tra tự động (máy chấm được): X/5 tiêu chí", bất biến evidenced ≤ machine, ba phần tách bạch trên mỗi dòng cổng | CHƯA NGHIỆM THU |

Cộng 57 mục có ID, 6 lệnh dựng UI ở §0 (kèm mã thoát kỳ vọng) và bảng đối chiếu 7 ca của DOM probe với
các mục checklist ở §7. **DOM probe không được dùng để đánh dấu đạt bất kỳ mục nào ở trên**: nó chỉ
chứng minh script dựng đúng chuỗi HTML, không chứng minh trang hiển thị đúng, không chứng minh dùng
được bằng bàn phím và không thay thế ảnh chụp. Quy tắc ghi bằng chứng (ảnh vào
`evidence/ui-acceptance/<ID>.png`, tên người kiểm tra, ngày, trình duyệt) ở §8 của checklist; không mục
nào được tự ký.
