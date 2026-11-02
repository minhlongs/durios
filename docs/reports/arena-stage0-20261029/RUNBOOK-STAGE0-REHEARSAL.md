# RUNBOOK STAGE 0 — diễn tập tổng hợp, chạy luồng chính, kiểm chứng xuất, khôi phục, nhận biết cổng chưa đạt

**Người đọc:** kỹ sư hoặc người vận hành tiếp nhận DuriOS sau đợt bàn giao 2026-10-29.
**Mục tiêu:** sau khi làm theo tài liệu này, bạn có thể (1) tự dựng môi trường tổng hợp an toàn, (2) chạy trọn luồng hồ sơ container, (3) kiểm chứng bằng chứng xuất khẩu, (4) diễn tập khôi phục dữ liệu, (5) đọc đúng trạng thái 5 cổng khai trương và biết cổng nào đang thiếu bằng chứng gì, (6) tự kiểm chứng giao diện bằng mắt (việc mà sandbox của đợt bàn giao này **không** làm được).

Mọi lệnh dưới đây đã được chạy thật trong đợt bàn giao; log thô nằm trong `evidence/`.

> **Muốn nghiệm thu trong một lượt thay vì làm tay từng bước?** Chạy
> `bash evidence/acceptance-harness.sh --archive <handover.tar.gz>` — harness gộp 10 bước (checksum →
> cài phụ thuộc → typecheck/test → HTTP trên `127.0.0.1` → phân quyền & cách ly tenant → chế độ trích
> xuất → tấn công nguồn gốc dữ liệu → ma trận cổng → backup/restore → giả mạo manifest), mỗi bước có kết
> quả mong đợi được assert. Kỳ vọng **exit 0**; exit 1 nghĩa là có assertion sai, exit 3 nghĩa là thiếu
> artefact nên lượt nghiệm thu chưa trọn vẹn. Chi tiết: `README-HANDOVER.md` mục 2, `VERIFICATION.md` §9.10.
> Runbook này là bản làm tay của cùng những kiểm tra đó, để hiểu từng phần.

---

## 1. Yêu cầu & ranh giới bắt buộc

- **Bun ≥ 1.3.0** (đợt này chạy 1.4.4), Node 22. Kiểm tra: `bun --version`.
- **Chỉ dùng dữ liệu tổng hợp.** Không nạp chứng từ thật của khách hàng cho tới khi cả 5 cổng đạt.
- **Máy chủ chỉ gắn kết `127.0.0.1`.** `startLocalServer` gọi `assertLoopbackHostname` và **ném lỗi** với host không loopback. Đừng nới guard này để "tiện xem preview": guard chính là một phần bằng chứng `GATE-03`.
- Không tự ký biên bản đồng ý dữ liệu, xác nhận điểm vựa, chọn nhà cung cấp, hay bất kỳ cổng khai trương nào.
- Không gửi OTP thật, không dùng dịch vụ trả phí, không commit secrets vào kho (dùng biến môi trường).
- **Bất biến của kho:** mọi tệp `.ts` trong `src/` và `test/` phải ≤ 99 dòng (`wc -l`) và không chứa `any`. Kiểm tra trước khi commit:
  ```bash
  bun -e 'import { evaluateCodebaseModularityDeep } from "./src/saas/codebase-modularity-deep-introspector.ts";
          const r = evaluateCodebaseModularityDeep(process.cwd()); console.log(r.verdict, r.maxSrcLoc, r.maxTestLoc, r.anyTypeViolationsCount);'
  # kỳ vọng: GO_MODULAR_ZERO_ANY_VERIFIED 100 100 0
  ```
  Lưu ý bộ kiểm tra dò cả cụm `: any` trong **văn xuôi tiếng Anh** trong comment — viết "any process" sau dấu hai chấm cũng bị tính là vi phạm.

---

## 2. Dựng môi trường tổng hợp (không đụng dữ liệu vận hành)

```bash
cd /home/user/durios   # hoặc đường dẫn kho của bạn
bun install

TMPD=$(mktemp -d /tmp/durios-rehearsal-XXXX)
echo $TMPD > /tmp/tmpd.txt   # các kịch bản trong evidence/ đọc đường dẫn từ đây

# Seed 5 container diễn tập + 2 lỗi gài mù + 2 tài khoản, vào DB RIÊNG
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:seed-rehearsal
```

**Bắt buộc phải khai báo đích (F-13, đã sửa):** `pilot:seed-rehearsal` **từ chối chạy** nếu không có `DURIOS_DB_PATH` (hoặc tham số `{dbPath, dataDir}`), với lỗi `REHEARSAL_SEED_TARGET_REFUSED` (HTTP 400). Lý do: lệnh này tạo hai tài khoản **có mật khẩu cố định công khai trong mã nguồn** (`clerk.cailay` / `PilotClerk#2026`, `manager.cailay` / `PilotManager#2026`) và 5 hồ sơ tổng hợp — mặc định cũ `./data/durios.db` là DB vận hành, nên việc im lặng ghi vào đó tương đương thêm một đường đăng nhập công khai vào hệ thống thật.

Ngoài việc đòi đích tường minh, seeder còn **từ chối ghi vào dữ liệu không phải dữ liệu diễn tập** (`src/auth/rehearsal-seed-target-guard.ts`):
- tệp SQLite không có schema DuriOS → từ chối ("not a rehearsal target");
- DB đã chứa hồ sơ **không** bắt đầu bằng `DOS-CAILAY-R`, hoặc tài khoản ngoài `clerk.cailay`/`manager.cailay` → từ chối ("may hold operational or customer data"); hãy sao DB ra chỗ khác và seed một DB diễn tập mới;
- DB rỗng (đường dẫn mới) hoặc DB diễn tập do chính seeder tạo → chấp nhận, và `dataDir` mặc định suy ra là `<thư mục chứa dbPath>/uploads`.

**Cờ chế độ tổng hợp:** các kịch bản diễn tập nạp trường trích xuất có sẵn (`fixtureFields`) — việc này **chỉ** được phép khi bật tường minh `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true` (F-05, phần dư đã đóng). Luồng thường không có cờ này: ảnh/PDF stub/JSON cho `0` trường, và yêu cầu `fixtureFields` bị từ chối `400 SYNTHETIC_EXTRACTION_DISABLED` kèm sự kiện kiểm toán `DOC_UPLOAD_REJECTED`. Bộ test tự bật cờ qua `bunfig.toml` → `test/preload-synthetic-extraction.ts`; `pilot:seed-rehearsal` tự bật cho tiến trình của nó; khi chạy server/diễn tập thủ công thì phải `export` (tiến trình con kế thừa).

**Kiểm tra môi trường đã cô lập:**
```bash
ls -la ./data          # kỳ vọng: chỉ có uploads/ (không có durios.db)
ls $TMPD               # kỳ vọng: durios.db, uploads/
```

**Nếu cần bootstrap không đăng nhập (chỉ để thử UI):**
```bash
DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=true DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run start:server
```
Mặc định tuyến `POST /api/auth/pilot-rehearsal-bootstrap` trả `403 FEATURE_DISABLED` — đây là hành vi đúng (xem `FINDINGS.md` F-03). Chỉ bật cờ khi DB là tổng hợp.

---

## 3. Chạy luồng chính

### 3.1. Cách nhanh: kịch bản HTTP có sẵn (đã kiểm chứng)

```bash
TMPD=$(cat /tmp/tmpd.txt)
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads DURIOS_PORT=3111 bun run src/server/server.ts &
# chờ dòng: 🚀 DuriOS Local Core Server running at: http://127.0.0.1:3111
bash docs/reports/arena-stage0-20261029/evidence/http-walkthrough.sh
```

Kịch bản chạy 17 bước và in kết quả từng bước; log mẫu: `evidence/HTTP-WALKTHROUGH-LOG.txt`. Những gì bạn **phải** thấy:

| Bước | Kỳ vọng |
|---|---|
| 2-3 | Đăng nhập bằng mật khẩu → `role: "CLERK"` do **server** quyết định |
| 4 | Gửi kèm header giả `x-actor-role: MANAGER` → server vẫn thấy `CLERK` |
| 5 | Không có phiên → `401` (không tự nâng quyền được) |
| 6 | Tạo hồ sơ → `DRAFT`, `version: 1` |
| 7-8 | Nạp 3 chứng từ tổng hợp → 10 trường trích xuất → **phải** xác nhận từng trường (HITL) |
| 9 | `POST /validate` → `PASSED`, `blockers: 0` |
| 10 | `CLERK` bấm approve → `403 INSUFFICIENT_ROLE` |
| 11 | `MANAGER` approve → `APPROVED_FOR_EXPORT`; export → `EXPORTED`, `isImmutable: true` |
| 12 | Nạp thêm chứng từ vào hồ sơ đã niêm phong → `409` |
| 13 | `verify:manifest` → `valid: true`, `integrityCoverage: "FULL"`, exit `0` |
| 14 | Chuỗi kiểm toán đọc được: 17 sự kiện, `DOSSIER_CREATED` → `DOSSIER_SEALED_EXPORTED` |
| 15 | KPI mang nhãn `timingEvidenceSource: "SYSTEM_TIMESTAMPS"`, `valueMetricsProvenance: "UNVALIDATED_ASSUMPTION"` |
| 16 | Bootstrap diễn tập → `403 FEATURE_DISABLED` |
| 17 | `./data` của kho vẫn không có `durios.db` |

### 3.2. Cách đầy đủ: diễn tập hợp nhất 55 kiểm tra

```bash
bun docs/reports/arena-stage0-20261029/evidence/drill-stage0.ts   # kỳ vọng: 55 PASS / 0 FAIL, exit 0
```
Kịch bản tự tạo thư mục tạm (DB + blob + backup + restore), tự khẳng định `./data` của kho không bị tạo, và bao phủ 11 mục: môi trường, actor 4 tenant, hồ sơ hợp lệ → xuất, 7 ca giả mạo manifest, các ca lỗi (seal lệch, thiếu chứng từ, hồ sơ đã niêm phong, thay chứng từ sau thẩm định), ủy quyền (sai tenant/thiếu quyền/giả mạo header), lọc manifest cho bên nhận chia sẻ, KPI/cổng theo tenant, bootstrap guard, trích xuất & thiếu dữ liệu, backup/restore. Log mẫu: `evidence/DRILL-STAGE0-LOG.txt`.

### 3.3. Cách thủ công qua giao diện (làm trên máy có trình duyệt)

```bash
TMPD=$(cat /tmp/tmpd.txt)
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run start:server
# mở http://127.0.0.1:3000/  → đăng nhập clerk.cailay / PilotClerk#2026
```
Trình tự thao tác: tạo hồ sơ → nạp chứng từ (dùng tệp **chữ/PDF** tổng hợp; ảnh scan sẽ bị chặn đúng thiết kế) → xác nhận từng trường trích xuất → chạy thẩm định → đăng nhập lại bằng `manager.cailay` để duyệt → xuất → tải manifest.

---

## 4. Kiểm chứng bằng chứng xuất khẩu

```bash
# 1) Manifest thật từ hồ sơ đã xuất
curl -s -b /tmp/walk-cookies-mgr.txt http://127.0.0.1:3111/api/dossiers/<dossierId>/manifest > $TMPD/manifest.json

# 2) Bộ kiểm chứng độc lập (MIT SDK, không cần DB)
bun run verify:manifest $TMPD/manifest.json
```
Kết quả đúng: `valid: true`, `iso6346ContainerValid: true`, `allDocumentsHaveSha256: true`, `zeroCriticalBlockers: true`, `integrityCoverage: "FULL"`.

**Hai lớp băm — cần hiểu đúng:**
- `compositeManifestSha256`: phủ định danh + danh sách chứng từ + tóm tắt dữ liệu đã kiểm chứng.
- `manifestIntegritySha256`: phủ **toàn bộ** các trường còn lại (`complianceFindingsCount`, `regulatoryDisclaimers`, `exportedBy`, `exportedAt`, `lifecycleState`, `isImmutable`). Manifest cũ chưa có trường này vẫn kiểm chứng được nhưng bị gắn nhãn `PARTIAL_LEGACY` kèm cảnh báo stderr — nghĩa là các trường ngoài tập con **không** được bảo vệ.

**Tự kiểm tra khả năng phát hiện giả mạo (đừng bỏ qua bước này):**
```bash
python3 - <<'PY'
import json, pathlib
p = pathlib.Path("/tmp/tampered.json")
d = json.loads(pathlib.Path("/tmp/manifest.json").read_text())
d["regulatoryDisclaimers"] = ["official GACC customs clearance approval"]   # đổi tuyên bố pháp lý
d["complianceFindingsCount"] = {"criticalBlockers": 0, "advisoryWarnings": 0}  # xóa dấu vết blocker
p.write_text(json.dumps(d, ensure_ascii=False))
PY
bun run verify:manifest /tmp/tampered.json ; echo "EXIT=$?"
# kỳ vọng: valid=false, lỗi "Manifest integrity SHA-256 mismatch", EXIT != 0
```
Trước đợt sửa (F-06), ca này trả về `valid = true`. Nếu bạn thấy `valid = true` thì có hồi quy — dừng lại và báo.

**Lưu ý khi đọc manifest đã lọc:** bên nhận chia sẻ (không sở hữu hồ sơ) nhận bản **đã lọc** theo mục đích chia sẻ, kèm khối `redaction.applied = true`. Hai mã băm trong bản đó vẫn trỏ tới bản ghi đầy đủ của chủ sở hữu → băm lại bản đã lọc sẽ **không** khớp, và đó **không** phải dấu hiệu giả mạo. Manifest chỉ được cấp cho mục đích `BUYER_VERIFICATION`, `CUSTOMS_INSPECTION`, `AUDIT`; các mục đích khác → `403`.

---

## 5. Diễn tập khôi phục (backup → verify → restore)

```bash
# Tự seed môi trường tổng hợp rồi backup -> verify -> restore -> kiểm tra lại toàn bộ:
bun docs/reports/arena-stage0-20261029/evidence/backup-restore-drill.ts

# Hoặc diễn tập trên chính DB bạn đã seed ở mục 2:
bun docs/reports/arena-stage0-20261029/evidence/backup-restore-drill.ts "$TMPD"
```
Kỳ vọng: `failures=0`, exit `0`. Log mẫu: `evidence/BACKUP-RESTORE-DRILL-LOG.txt`.

**Hai chi tiết kỹ thuật dễ hiểu nhầm:**
- Bản backup là ảnh `VACUUM INTO`, nên **không** byte-identical với tệp DB đang mở ở chế độ WAL. Phải so `sha256(DB đã restore)` với `databaseSha256` **trong backup manifest**, không so với tệp nguồn đang sống.
- `verifySiteBackup(backupDir)` kiểm tra **cây backup**; muốn chứng minh phát hiện hỏng hóc thì lật 1 byte trong blob **của bản backup** (đường dẫn `<backupDir>/uploads/storage/blobs/<sha>.bin`) rồi verify lại.

**Bằng chứng phải tự kiểm tra sau restore (không chỉ tin `valid: true`):**
1. Băm SHA-256 của tệp DB sau restore **bằng** `databaseSha256` ghi trong backup manifest.
2. Mở lại được: một hồ sơ, manifest đã xuất, và chuỗi kiểm toán (hash chain liền mạch từ `GENESIS`).
3. **100% blob** trong `storage/blobs/` băm lại đúng với `sha256Hash` đã ghi.
4. Thử lật 1 byte trong một blob rồi `verifySiteBackup` lại → **phải** báo lỗi nêu đích danh tệp + băm kỳ vọng/băm thực tế.

Diễn tập S11 trong `evidence/DRILL-STAGE0-LOG.txt` đã làm đúng 4 bước này trên dữ liệu tổng hợp: 12 hồ sơ / 35 chứng từ / 32 blob, verify 2 lần giống hệt, 32/32 blob khớp, lật 1 byte → 3 lỗi. Kịch bản standalone ở mục này bổ sung hai kiểm tra: **chuỗi băm kiểm toán liền mạch sau restore** (75/75 link, genesis `GENESIS-00000000`) và đọc lại được `container_dossiers` / `documents` / `audit_events` bằng SQLite. **Đây là bằng chứng kỹ thuật, chưa phải bằng chứng `GATE-04`**: cổng đó cần bản sao lưu thật trên máy vựa + biên bản do người vận hành ký.

---

## 6. Nhận biết cổng chưa đạt

```bash
TMPD=$(cat /tmp/tmpd.txt)
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:verify-gates ; echo "EXIT=$?"
```

**Đọc kết quả — hai con số, đừng gộp làm một (F-15, đã sửa):**
- `KIỂM TRA TỰ ĐỘNG (máy chấm được): x/5 tiêu chí đạt` = `machineChecksPassedCount`. Máy chỉ chấm được những gì nó tự quan sát: tệp có tồn tại không, host có loopback không, chuỗi kiểm toán có toàn vẹn không, backup có verify không, KPI có đủ 5 container/<300s/bắt hết lỗi gài mù không. **Con số này không mở cổng nào cả.**
- `LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): y/5 cổng được mở` = `operationalGatesEvidencedCount`. Một cổng chỉ được tính khi **cả hai** điều kiện đúng: máy chấm đạt **và** có bằng chứng vận hành do con người ghi nhận. **Chỉ con số này quyết định `goForLiveCustomerData`.**
- Nhãn từng cổng (`gateVerdict`): `EVIDENCED_FOR_LAUNCH` = đã mở · `MACHINE_CHECK_ONLY` (nhãn `MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE`) = máy đạt nhưng thiếu bằng chứng · `PENDING` = máy chưa đạt. Bản tóm tắt còn in dòng `còn thiếu: …` cho mỗi cổng chưa mở.
- `EXIT=1` nghĩa là **chưa** được nạp dữ liệu khách hàng thật; `EXIT=0` chỉ xảy ra khi `goForLiveCustomerData: true` (đủ 5 cổng có bằng chứng trên cohort vận hành).
- `evidenceProvenance` có **ba** giá trị: `"OPERATIONAL"` = đánh giá trên dữ liệu vận hành, sổ kiểm toán toàn vẹn; `"SYNTHETIC_REHEARSAL"` = chế độ diễn tập **hoặc** cohort còn chứa hồ sơ đi qua đường tổng hợp/diễn tập → nhãn cổng `PASS_SYNTHETIC_REHEARSAL`; `"UNPROVEN_LEDGER_INTEGRITY"` = chuỗi băm kiểm toán **không** xác minh được (bị xoá/sửa dòng) → nhãn cổng `PASS_LEDGER_INTEGRITY_UNPROVEN`. Ở cả hai trạng thái sau, `operationalGatesEvidencedCount` luôn `0/5`, `goForLiveCustomerData` luôn `false` (F-14, F-14b). Trước khi đánh giá cổng trên DB thật, hãy tách/dọn hồ sơ diễn tập ra khỏi DB đó; nếu chuỗi kiểm toán hỏng thì khôi phục hoặc điều tra trước, không có cách nào "cho qua".
- Nguồn gốc cohort **không** suy ra từ tên hồ sơ: tín hiệu nằm trong sổ kiểm toán (`SYNTHETIC_DOCUMENT_INGESTED`, `REHEARSAL_DOSSIER_SEEDED`, gắn theo `dossierId`), nên đổi `dossier_code` bằng SQL thô không mở được cổng. Dòng `DỮ LIỆU ĐÁNH GIÁ:` trong bản tóm tắt in ra tín hiệu và trạng thái chuỗi băm để người đọc thấy căn cứ.
- Trạng thái tại thời điểm bàn giao 2026-10-30 (DB diễn tập, log `evidence/rerun-20261030/GATE-CLI-MATRIX-LOG.txt`): **máy chấm 2/5** (`GATE-03`, `GATE-05`), **cổng đủ bằng chứng 0/5**, `goForLiveCustomerData: false`, `EXIT=1`. Chi tiết từng cổng, ai nợ bằng chứng gì: `GATE-MATRIX.md`.

**Ghi nhận bằng chứng vận hành (người làm, máy chỉ lưu):**
```bash
# mỗi cổng một tệp hiện vật + một dòng nêu ai đã ghi nhận (không có tên = chưa có bằng chứng)
export DURIOS_GATE01_EVIDENCE_FILE=/duong/dan/bien-ban-tiep-can-vua-da-ky.pdf
export DURIOS_GATE02_EVIDENCE_FILE=/duong/dan/bien-ban-gui-nhan-otp-that.pdf
export DURIOS_GATE03_EVIDENCE_FILE=/duong/dan/bien-ban-mang-ma-hoa-secrets.pdf
export DURIOS_GATE04_EVIDENCE_FILE=/duong/dan/bien-ban-dien-tap-restore.pdf
export DURIOS_GATE05_EVIDENCE_FILE=/duong/dan/bien-ban-bam-gio-5-container.pdf
export DURIOS_GATE_EVIDENCE_ATTESTED_BY="Họ tên + vai trò + ngày ghi nhận"
```
Qua code: `gateEvidence: { "GATE-01": { filePath, attestedBy }, … }`. Hệ thống **không** xác minh chữ ký, **không** tự xác nhận hiện trường, **không** tự ký thay ai — nó lưu đường dẫn, tên người ghi nhận và in ra `RECORDED_BY_OPERATOR`. Bằng chứng khai báo **không** nâng được cổng có tiêu chí máy chưa đạt (ma trận ca B3).

Ba điều phải biết khi ghi nhận bằng chứng:
- **Đường dẫn phải là một tệp tồn tại thật.** Tệp không tồn tại, hoặc đường dẫn trỏ tới thư mục → cổng giữ `PENDING_OPERATOR_EVIDENCE` và bản tóm tắt in lý do ("Đường dẫn khai báo không tồn tại" / "không phải là tệp"). Kích thước + **SHA-256** của tệp được ghi vào `externalEvidence.artifact` và in rút gọn trong bản tóm tắt; tệp lớn hơn 25 MB không được băm (`NOT_HASHED_FILE_TOO_LARGE`) thì mất khả năng đối chiếu về sau — hãy dùng tệp nhỏ hoặc ghi kèm đường dẫn lưu trữ khác.
- **Chỉ môi trường của tiến trình server on-prem, hoặc người chạy CLI, khai báo được.** Không có endpoint HTTP nào nhận bằng chứng: một request API (kể cả token `MANAGER`/`ADMIN`/`AUDITOR`) chỉ nhìn thấy biến môi trường của tiến trình server. Vì vậy người đặt hai biến trên là người có quyền shell trên máy chủ vựa.
- **SHA-256 không thay việc đọc biên bản.** Máy không thẩm định nội dung tệp (một trang trắng vẫn có SHA-256 hợp lệ); giá trị của băm là để người soát sau này chứng minh tệp trong hồ sơ không bị tráo. Bảng đầy đủ: `GATE-MATRIX.md` mục 0.3.

**Đừng tin `PASS` của máy một cách mù quáng:**
- `GATE-03` máy chỉ kiểm tra host loopback + toàn vẹn chuỗi kiểm toán, **không** kiểm tra reverse proxy HTTPS, giới hạn mạng, mã hóa đĩa, quyền `0600` của secrets.
- `GATE-05` máy chấm bằng dấu thời gian hệ thống; nếu `timingEvidenceSource` là `SYSTEM_TIMESTAMPS` thì đó là **thời gian máy**, không phải thời gian Thư ký.
- `GATE-04` cần `DURIOS_BACKUP_DIR` trỏ tới bản sao lưu đã verify; không có biến này thì cổng là `PENDING_VERIFIED_BACKUP` kể cả khi cơ chế đã được diễn tập.

**Các lệnh còn lại:**
```bash
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:evaluate-kpi
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:audit-pack -- --output-dir $TMPD/pack --markdown
bun run pilot:audit-pack -- --verify $TMPD/pack/GOLIVE-*.json          # --verify BẮT BUỘC kèm đường dẫn tệp
DURIOS_DB_PATH=$TMPD/durios.db DURIOS_DATA_DIR=$TMPD/uploads bun run pilot:proof-kit -- --output-dir $TMPD/proofkit --tenant-id TENANT-CAILAY-PILOT-01
```
Kỳ vọng: audit pack ra `Verdict=HOLD_BLOCKERS_REMAIN MachineChecks=2/5 LaunchGatesEvidenced=0/5 Integrity=true` cho tới khi có bằng chứng vận hành thật (dòng này cố ý in **hai** bộ đếm, không in một con số `Gates=`); proof kit chỉ chứa manifest **của đúng tenant** được chỉ định (đã kiểm chứng: tenant sở hữu thấy 2 manifest, tenant được chia sẻ thấy 0 — `evidence/CLI-PROOFKIT-TENANT-ISOLATION-LOG.txt`).

**Mẹo kỹ thuật:** `bun run <npm-script>` in thêm dòng banner `$ bun run src/…` vào stdout → nếu cần parse JSON, hãy gọi thẳng `bun run src/…` hoặc bỏ dòng đầu.

---

## 7. Checklist kiểm chứng UI bằng mắt (thay cho ảnh chụp màn hình)

> **Bản đầy đủ và là bản dùng để nghiệm thu:** `UI-ACCEPTANCE-CHECKLIST.md` (57 mục có ID: UI-D desktop 9,
> UI-N màn hình hẹp 9, UI-K bàn phím & trợ năng 12, UI-E trạng thái lỗi 10, UI-S nhãn tổng hợp 10, UI-C
> hai bộ đếm 7; kèm 6 lệnh dựng UI và bảng đối chiếu phạm vi DOM probe). Mục 7 dưới đây là bản rút gọn
> giữ lại từ đợt 2026-10-29. Ảnh chụp lưu vào `evidence/ui-acceptance/<ID>.png` theo đúng ID của mục.

**Vì sao cần checklist này:** sandbox của đợt bàn giao không có trình duyệt đồ họa và máy chủ bị ràng buộc loopback, nên **không có ảnh chụp màn hình** nào được tạo. `AGENTS.md` yêu cầu ảnh chụp desktop + màn hẹp khi đổi `src/ui/`; yêu cầu đó **chưa được đáp ứng** và phải do bạn hoàn thành. Bằng chứng thay thế đã có: probe DOM headless **7/7 PASS** (`evidence/rerun-20261030/UI-RENDER-PROBE-LOG.txt`; probe cần `happy-dom`, không phải dependency của dự án: `npm install --prefix /home/user/tools happy-dom@15` rồi symlink vào `node_modules/`) — probe này **không** thay được mắt người và **không** được tính là ảnh chụp màn hình.

Chạy `bun run start:server` với DB diễn tập, mở `http://127.0.0.1:3000/` rồi kiểm tra:

**A. Trạng thái rỗng & bước kế tiếp**
- [ ] Khi chưa có dữ liệu, màn hình nói rõ trạng thái là *chờ* (PENDING), **không** hiển thị số KPI hay "đạt".
- [ ] Thẻ cổng khai trương hiển thị `x/5 CỔNG ĐỦ BẰNG CHỨNG` (số cổng đã mở) và dòng ghi chú nêu riêng `Kiểm tra tự động (máy chấm được): y/5 tiêu chí` — **hai con số khác nhau**, không có chỗ nào viết gọn thành "2/5 cổng đạt".
- [ ] Thẻ "Toàn vẹn sổ cái kiểm toán (máy chấm)" có ghi chú rằng đó chỉ là 1 trong 2 tiêu chí máy chấm của GATE-03, và GATE-03 chỉ mở khi có bằng chứng vận hành.
- [ ] Sau khi chạy diễn tập tổng hợp, có nhãn cho biết đây là **DIỄN TẬP TỔNG HỢP — không có giá trị phê duyệt khai trương**.
- [ ] Với kết quả vận hành máy chấm 2/5 và 0/5 cổng đủ bằng chứng, màn hình nói rõ **chưa được phép nạp dữ liệu thật** và nêu cả hai con số.
- [ ] Mỗi dòng cổng trong phần KPI in thêm `[Máy chấm: PASS/FAIL · Bằng chứng vận hành: … · Kết luận: EVIDENCED_FOR_LAUNCH|MACHINE_CHECK_ONLY|PENDING]`, và với cổng chưa mở có ghi `Còn thiếu: …` (mục bằng chứng đầu tiên còn nợ).
- [ ] Có đoạn giải thích trong callout: "**Hai con số khác nhau, đừng đọc như một**" — máy chấm là tiêu chí hệ thống tự kiểm tra; cổng đủ bằng chứng đòi hỏi con người ghi nhận; chỉ con số thứ hai quyết định việc nạp dữ liệu thật.
- [ ] Toast sau khi chạy diễn tập bootstrap chỉ **màu xanh** khi server trả `goForLiveCustomerData: true`; với diễn tập tổng hợp toast là **cảnh báo** và in `máy chấm x/5 · cổng đủ bằng chứng y/5 · DIỄN TẬP TỔNG HỢP`.

**B. Tính trung thực của số liệu**
- [ ] Bên cạnh KPI có nhãn nguồn thời gian (`SYSTEM_TIMESTAMPS`) và nguồn chỉ số giá trị (`UNVALIDATED_ASSUMPTION`).
- [ ] Không còn chỗ nào mô tả kho dữ liệu là "WORM"/chống ghi tuyệt đối (README mục 5 đã nói rõ đây chỉ là phát hiện sửa đổi).
- [ ] Không có nhãn khả năng/chứng nhận bịa trong hộp thoại introspection.
- [ ] Bằng chứng hữu cơ hiển thị dạng *đã lưu bằng chứng*, **không** phải chứng nhận do DuriOS cấp.

**C. Phản hồi & chống gửi trùng**
- [ ] Mọi hành động dài có trạng thái bận (nhãn + nút `disabled`); không có "loading treo" vô hạn.
- [ ] Lỗi hiện toast/thông báo **nói rõ việc cần làm tiếp** (ví dụ hồ sơ đã niêm phong → không cho sửa).
- [ ] Lỗi có thể phục hồi **không xóa** dữ liệu người dùng đang nhập.
- [ ] Phiên bản cũ (xung đột `409`) → màn hình tự nạp lại và báo cho người dùng, không ghi đè âm thầm.

**D. Vai trò & quyền**
- [ ] Vai trò hiển thị là vai trò **server trả về**; đổi thẻ chọn vai trò không làm tăng quyền (thử: `CLERK` bấm Approve → phải thấy `403 INSUFFICIENT_ROLE`).
- [ ] Đăng nhập ẩn danh không vào được khu vực hồ sơ (`401`).

**E. Bàn phím & trình đọc màn hình** (tham khảo `docs/accessibility/manual-screen-reader-checklist.md`)
- [ ] `Tab` đi được tới mọi hành động chính theo thứ tự hợp lý; focus nhìn thấy rõ.
- [ ] Skip link hoạt động; mọi nút có nhãn đọc được (không chỉ icon).
- [ ] Thông báo động được đọc (vùng `aria-live`); hộp thoại đóng được bằng `Esc`.
- [ ] Thu hẹp cửa sổ xuống ~360 px: không mất nút hành động, không tràn ngang, đọc được trạng thái hồ sơ.
- [ ] Bật "reduce motion" của hệ điều hành → không có hiệu ứng gây khó chịu.

**Sau khi kiểm tra:** chụp ảnh desktop + màn hẹp, lưu vào `docs/reports/arena-stage0-20261029/evidence/screenshots/` và ghi lại ngày giờ, trình duyệt, kích thước màn hình. Chỉ khi đó mới được coi yêu cầu UI của `AGENTS.md` là đã đáp ứng.

---

## 8. Phần việc thủ công nào được giảm, và đo bằng cách nào

Hệ thống **không** tự tuyên bố đã tiết kiệm bao nhiêu phút. Hai con số đang được dùng để tính chỉ số giá trị (`35` phút baseline thủ công, `35.000.000` VND thiệt hại tránh được mỗi lỗi nghiêm trọng) là **giả định chưa kiểm chứng**, luôn được trả về kèm nhãn `UNVALIDATED_ASSUMPTION` và ghi chú tiếng Việt nói rõ không được trình bày như doanh thu/ROI.

**Phần việc thủ công mà hệ thống thay thế (có thể kiểm chứng bằng tính năng, không phải bằng tuyên bố):**

| Việc thủ công trước đây | Hệ thống làm gì | Cách đo trong pilot |
|---|---|---|
| Đối chiếu số container/seal giữa packing list, phyto, vận đơn | Luật chéo chứng từ tự phát hiện lệch và chặn (`VALIDATION_BLOCKED`) | Đếm số ca lệch được phát hiện tự động / tổng số ca; so với số ca con người tự tìm ra |
| Kiểm tra ngưỡng Cadmi so với GB 2762-2022 và ngưỡng nội bộ | `RUL-GB2762-CD` (luật định 0.050) và `RUL-INT-CD-WARN` (nội bộ 0.040) tách bạch, có nhãn | Đếm số ca bị chặn đúng; kiểm tra không có ca nào "thiếu số liệu" mà vẫn đạt |
| Ráp bộ hồ sơ xuất khẩu + tính băm | Export manifest niêm phong, bất biến, kèm 2 lớp SHA-256 | Thời gian từ "duyệt" tới "có bộ hồ sơ gửi đi"; số lần phải in/ráp lại |
| Lưu trữ & tra cứu chứng từ giấy | Blob content-addressed + chuỗi kiểm toán hash chain | Thời gian tìm lại một chứng từ cụ thể khi bị hỏi |
| Sao lưu và kiểm tra toàn vẹn thủ công | `createSiteBackup` / `verifySiteBackup` / `restoreSiteBackup` | Tần suất backup thành công; kết quả verify; thời gian khôi phục thực tế |
| Báo cáo sẵn sàng cho Founder | `pilot:verify-gates`, `pilot:audit-pack`, `pilot:proof-kit` có niêm phong SHA-256 | Thời gian chuẩn bị một bộ báo cáo; số lần phải làm lại vì thiếu bằng chứng |

**Cách đo (bắt buộc, để có bằng chứng `GATE-05` thật):**
1. Bấm giờ bằng đồng hồ/điện thoại cho **tối thiểu 5 container thật**, từ lúc Thư ký nhận bộ chứng từ tới lúc chạy thẩm định xong; ghi `T_start`, `T_end`, ai thực hiện, ngày giờ.
2. Ghi `timingEvidenceSource: "HUMAN_STOPWATCH_ATTESTED"` vào biên bản; đối chiếu với `meanDeltaSeconds` hệ thống và **giải thích chênh lệch** (hệ thống chỉ đo khoảng thời gian xử lý bên trong).
3. Gài **tối thiểu 2 lỗi mù** do người khác chuẩn bị (lệch seal, sai số container, thiếu chứng từ, phiếu kiểm nghiệm không có Cadmi) mà Thư ký không biết trước; ghi nhận có bị chặn hay không.
4. Ghi lại mọi lần hệ thống **chặn sai** (dương tính giả) — đây là chi phí vận hành thật, đừng bỏ qua.

---

## 9. Dữ liệu cần thu thập (thay cho mọi suy luận về doanh thu/ROI)

Không được suy ra doanh thu, ROI, mức sẵn lòng chi trả hay thiệt hại tránh được từ dữ liệu tổng hợp. Hãy thu thập:

1. **Baseline thủ công:** thời gian đối soát 1 bộ hồ sơ hiện tại, đo trên ≥ 10 container, ghi rõ người đo và ngày; số người chạm tay vào bộ hồ sơ; số lần phải in/sao/đi lại.
2. **Chi phí sự cố thật:** mỗi lần lô bị giữ/kiểm hóa/trả lại trong 12 tháng qua — phí lưu cont, phí kiểm hóa, chênh lệch giá, thời gian chậm tàu, kèm chứng từ (hóa đơn, sao kê).
3. **Lỗi bị bỏ sót:** số lỗi container/seal/chứng từ đã lọt trong quá khứ, do vựa tự khai và **ký xác nhận**.
4. **Sau khi dùng DuriOS (cùng kỳ, cùng người đo):** thời gian đối soát, số lỗi bị chặn, số ca chặn sai, số lần phải can thiệp thủ công.
5. **Điều kiện hạ tầng:** cấu hình máy tại vựa, tình trạng mã hóa đĩa, lịch backup thực tế, ai giữ khóa, mạng nội bộ giới hạn thế nào.
6. **Pháp lý/dữ liệu cá nhân:** biên bản đồng ý đã ký, phạm vi dữ liệu, thời hạn lưu, cách rút lại đồng ý, người chịu trách nhiệm.

Chỉ khi có (1)-(4) mới thay được hai giả định kinh tế; lúc đó đặt `valueMetricsProvenance: "FIELD_MEASURED"` và ghi rõ nguồn số liệu trong báo cáo.

---

## 10. Sự cố thường gặp khi chạy lại

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `bun test` báo trùng tài liệu khi nạp cùng một tệp 2 lần | Blob **content-addressed**: cùng nội dung → cùng SHA-256 → coi là trùng | Đổi nội dung (thêm byte ngẫu nhiên) cho mỗi lần nạp |
| `pilot:audit-pack -- --verify` in hướng dẫn sử dụng, exit `2` | `--verify` cần **đường dẫn tệp**; đây là hành vi đã sửa (F-11) | `-- --verify <pack.json>`; hoặc biên soạn gói trước bằng `-- --output-dir …` |
| `pilot:verify-gates` không in gì | Bạn đang chạy bản **trước** khi sửa F-12 | Kiểm tra `src/auth/pilot-launch-gate-verifier.ts` có khối `import.meta.main` |
| `Cannot start server: hostname … is not loopback` | `assertLoopbackHostname` chặn host không loopback | Giữ `DURIOS_HOST=127.0.0.1`; đừng sửa guard |
| Nạp ảnh scan → hồ sơ bị chặn `RUL-DOC-UNREADABLE` | Fixture extractor **không** đọc ảnh (F-05 đã sửa) | Dùng tệp chữ/PDF tổng hợp, hoặc nhập tay rồi xác nhận từng trường |
| `tsc` báo lỗi sau khi thêm code | `strict` + `noUnusedLocals` + `exactOptionalPropertyTypes` | Khai báo `readonly x?: T | undefined` cho trường tùy chọn; xóa biến không dùng |
| Bộ kiểm tra modularity báo vi phạm dù file < 100 dòng | Đếm bằng `raw.split("\n").length` ⇒ `wc -l` phải ≤ 99; và dò cả cụm `: any` trong comment | Tách module mới (xem cách đợt này tách 12 module), sửa câu chữ comment |
| Manifest đã lọc băm lại không khớp | Bản trả về cho bên nhận chia sẻ **đã lọc**; hai mã băm trỏ tới bản đầy đủ | Kiểm chứng trên bản của chủ sở hữu; đọc khối `redaction.notice` |

**`bun test` chạy ra nhiều test hơn 286 / 67 tệp?** Gói bàn giao `package/snapshot/` chứa bản sao các tệp kiểm thử; nếu `bunfig.toml` thiếu `[test] root = "./test"` thì bun quét luôn các bản sao đó và chúng xung đột đường dẫn dữ liệu với bản gốc. Kiểm tra `bunfig.toml` có dòng `root = "./test"` (đã có sẵn trong đợt bàn giao 2026-10-30).
