# README-HANDOVER — Bộ artefact bàn giao để soát xét độc lập (2026-10-30)

**Kho:** `minhlongs/durios` · **Nhánh:** `arena/e0ece0a7-durios` · **HEAD / commit cơ sở:** `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494`
**Kết luận của đợt làm việc:** **PARTIAL — Pilot với dữ liệu khách hàng thật = BLOCKED** (máy chấm `2/5`, cổng đủ bằng chứng vận hành `0/5` trên staging; chi tiết trong `reports/GATE-MATRIX.md` mục 0.1–0.3).
**Bộ artefact này không phải là một quyết định khai trương.** Nó là bằng chứng để người khác kiểm tra lại.
**Trạng thái kỹ thuật:** sẵn sàng cho **nghiệm thu độc lập** — người nhận tự chạy, tự kết luận. Agent không tự tuyên bố đã được nghiệm thu.

---

## 1. Bên trong có gì

```
durios-stage0-handover-<ngày>/
├── README-HANDOVER.md          tệp này
├── CHECKSUMS.txt               SHA-256 của MỌI tệp bên trong archive (kiểm bằng: sha256sum -c CHECKSUMS.txt)
├── reports/                    5 báo cáo + 1 danh sách nghiệm thu UI
│   ├── REPORT.md               báo cáo chính: đã làm gì, đã kiểm chứng gì, còn nợ gì
│   ├── FINDINGS.md             F-01…F-15 + F-14b (cơ chế nguồn gốc dữ liệu viết lại) + N-01…N-12 (nghi ngờ chưa tái hiện)
│   ├── GATE-MATRIX.md          GATE-01..05: tiêu chí máy chấm, bằng chứng vận hành, ma trận ca, mục 0.3 (ai được ghi bằng chứng)
│   ├── VERIFICATION.md         bằng chứng thực thi, câu lệnh, kết quả đo, những gì KHÔNG sửa
│   ├── RUNBOOK-STAGE0-REHEARSAL.md  quy trình diễn tập + lệnh tái đánh giá
│   └── UI-ACCEPTANCE-CHECKLIST.md   57 mục kiểm tra UI (desktop, màn hình hẹp, bàn phím, lỗi, nhãn tổng hợp, hai bộ đếm)
├── evidence/                   kịch bản chạy lại được + log thô
│   ├── acceptance-harness.sh   MỘT quy trình nghiệm thu tuần tự 10 bước, mỗi bước có kết quả mong đợi được assert
│   ├── acceptance-<UTC>/       log của lượt chạy harness được giao kèm (10 step log + HARNESS-SUMMARY + TREE-FINGERPRINT + ENVIRONMENT)
│   ├── rerun-all.sh            CHẠY MỘT LỆNH → sinh lại toàn bộ log trong rerun-20261030/
│   ├── rerun-20261030/         10 log đo lại trên cây đã bàn giao (mỗi log có câu lệnh, HEAD, EXIT)
│   ├── permission-tenant-isolation.sh  bước 5: proof kit/KPI/test hồi quy theo từng tenant
│   ├── *.ts / *.sh / *.py / *.mjs   kịch bản bằng chứng (diễn tập, backup/restore, HTTP walkthrough,
│   │                            ma trận CLI cổng, chế độ trích xuất, tấn công nguồn gốc dữ liệu, DOM probe…)
│   └── *-LOG.txt               log đợt 2026-10-29 (giữ nguyên để đối chiếu lịch sử)
└── package/                    đóng gói để so sánh với kho đích
    ├── MANIFEST.txt            commit cơ sở, phiên bản công cụ, danh sách MỌI tệp bị ảnh hưởng (SHA-256 + byte + dòng),
    │                           tuyên bố rõ KHÔNG chứng minh được quan hệ với commit 08992f6
    ├── stage0-full.patch       PATCH RIÊNG: 35 tệp sửa + toàn bộ tệp mới, áp lên commit cơ sở bằng `git apply`
    ├── snapshot/               bản sao nguyên văn mọi tệp bị ảnh hưởng (để diff không cần git)
    ├── base-2f1538e….tar.gz    TOÀN BỘ cây cơ sở tại commit 2f1538e (523 tệp) — không chỉ các tệp bị sửa
    ├── delivered-tree-….tar.gz TOÀN BỘ cây đã bàn giao (src, test, docs, evidence), dựng từ danh sách
    │                           tệp tường minh: mọi tệp tracked + mọi tệp mới bị ảnh hưởng. Không có
    │                           .git, node_modules, CSDL/blob runtime, package/, delivery/. Có giữ
    │                           `data/uploads/.gitkeep` (tệp tracked) vì đường dẫn mặc định của SQLite
    │                           client cần thư mục đó — thiếu nó thì 26 test fail khi giải nén
    ├── SHA256SUMS.txt          SHA-256 của patch, 2 archive và từng tệp trong snapshot/
    ├── APPLY-VERIFY-LOG.txt    log: giải nén base archive → `git apply --check` → `git apply` →
    │                           so byte-for-byte với snapshot/ (khớp 100%) và so delivered-tree với
    │                           cây làm việc (khớp 100%) → `PACKAGE_VERIFIED`; số tệp cụ thể ghi trong log này
    ├── build-package.sh        sinh lại package/
    └── verify-package.sh       kiểm lại package/ từ chính các artefact người soát nhận được
```

## 2. Nghiệm thu độc lập — MỘT quy trình tuần tự duy nhất

`evidence/acceptance-harness.sh` chạy **10 bước theo đúng thứ tự**, mỗi bước dùng thư mục tạm riêng cho
CSDL và blob, và **mỗi bước đều có kết quả mong đợi được assert**. Script cố tình **không** dùng
`set -e` và **không** dùng `|| true`: mã thoát của từng lệnh được bắt lại rồi so với giá trị kỳ vọng,
nên một CLI cổng ở trạng thái BLOCKED trả exit 1 được ghi nhận là **đúng**, không bị che đi.

```bash
# Chạy trên cây đã bàn giao (giải nén delivered-tree vào một thư mục RIÊNG trước — xem mục 3):
bash docs/reports/arena-stage0-20261029/evidence/acceptance-harness.sh \
     --archive /đường/dẫn/durios-stage0-handover-<ngày>.tar.gz
```

Mã thoát của harness:

| Exit | Ý nghĩa |
|---|---|
| **0** | cả 10 bước đã chạy và mọi assertion khớp kết quả mong đợi |
| **1** | có ít nhất một assertion sai — đọc các dòng `FAIL \|` trong log của bước đó |
| **3** | có bước **không chạy được** (thiếu artefact, thường là quên `--archive`) ⇒ lượt nghiệm thu chưa trọn vẹn, không được tính là đạt |
| **2** | sai cú pháp, hoặc thiếu công cụ bắt buộc (ví dụ không có `bun` trên PATH) |

10 bước và kết quả mong đợi:

| Bước | Nội dung | Kết quả mong đợi (được assert, không chỉ in ra) |
|---|---|---|
| 1 | Kiểm checksum và liệt kê nội dung archive **trước khi** giải nén | `sha256sum -c` tệp `.sha256` kế bên exit 0; listing đọc được và có đủ 5 báo cáo + checklist UI + `evidence/` + `package/`; giải nén vào **thư mục tạm** rồi `sha256sum -c CHECKSUMS.txt` exit 0; nếu cây có `package/SHA256SUMS.txt` thì nó cũng phải khớp |
| 2 | Cài phụ thuộc theo lockfile | `bun install --frozen-lockfile` exit 0 và SHA-256 của `bun.lock` **không đổi** |
| 3 | Typecheck + toàn bộ test | `bun run typecheck` exit 0; `bun test` exit 0 và log có `0 fail` |
| 4 | Walkthrough HTTP trên server thật, chỉ bind `127.0.0.1` | log server ghi `127.0.0.1:<port>` và không có `0.0.0.0`; 17 bước exit 0; header vai trò giả bị bỏ qua (vẫn CLERK); ẩn danh 401; clerk ký xuất 403 `INSUFFICIENT_ROLE`; hồ sơ đã seal 409; manifest đạt `integrityCoverage: FULL`; chuỗi audit đọc được; cổng báo **máy 2/5, bằng chứng 0/5**, `SYNTHETIC_REHEARSAL`, không go-live; bootstrap diễn tập 403 `FEATURE_DISABLED`; server dừng và cổng đóng lại; **không** có `data/durios.db` trong cây |
| 5 | Phân quyền + cách ly tenant cho export / KPI / proof kit | `drill-stage0.ts` exit 0 (55 kiểm tra: tenant chưa được cấp quyền nhận 404, grantee TRADE_FINANCE nhận 403, manifest của grantee bị redact **và nói rõ** đã redact); `permission-tenant-isolation.sh` exit 0 (23 kiểm tra: proof kit của tenant A chỉ chứa manifest của A, tenant B/C/D nhận 0 manifest, override vẫn giữ blocker, 9 tệp test hồi quy về RBAC/tenant/redaction đều `0 fail`) |
| 6 | Fixture chỉ chạy khi chế độ tổng hợp được bật tường minh | `extraction-mode-demo.ts` (chạy với cờ bị gỡ) exit 0; luồng thường 0 fail; **0/8** giá trị canary của template lọt vào hồ sơ; `fixtureFields` bị từ chối bằng `SYNTHETIC_EXTRACTION_DISABLED`; tài liệu không đọc được ⇒ 0 trường và `RUL-DOC-UNREADABLE` |
| 7 | Nguồn gốc dữ liệu: đổi tên, trộn cohort, phá sổ cái, khai tệp khống | `gate-provenance-adversarial.ts` exit 0 với **54 assertion / 0 fail**; A1 (đổi mã hồ sơ bằng SQL thô), B1 (trộn 1 container tổng hợp), C1 (xoá dòng sổ cái), D1 (khai 5 "tệp bằng chứng" không phải tệp) đều cho `0/5` cổng đủ bằng chứng và `goForLiveCustomerData=false`; chỉ B0 (fixture vận hành) được `5/5` |
| 8 | Cổng khai trương: tiêu chí máy không thay được bằng chứng ngoài | `gate-cli-matrix.sh` exit 0; A1–A3 và B1–B3 **exit 1** (BLOCKED là kết quả đúng, được assert chứ không che); chỉ B4 exit 0 và chỉ trên fixture; B3 chứng minh bằng chứng không nâng được cổng có kiểm tra máy fail (4/4 chứ không phải 5/5); 2 lần gọi `pilot:audit-pack` phải in `Verdict=HOLD_BLOCKERS_REMAIN`, `MachineChecks=2/5`, `LaunchGatesEvidenced=0/5` |
| 9 | Backup → verify → restore → kiểm lại CSDL/blob/audit | `backup-restore-drill.ts` exit 0 với 0 fail; hash CSDL sau khôi phục **bằng** hash trong manifest backup; mọi blob băm lại đúng SHA-256 đã ghi; lật 1 byte trong blob bị phát hiện; chuỗi băm audit sau khôi phục vẫn hợp lệ; hồ sơ đã seal và manifest vẫn đọc được |
| 10 | Giả mạo manifest | verifier độc lập chấp nhận manifest nguyên vẹn (exit 0, `FULL`); **từ chối** bản đã sửa một giá trị kiểm nghiệm (exit **1**); báo `PARTIAL_LEGACY` (không phải `FULL`) khi thiếu `manifestIntegritySha256`; drill phát hiện **7/7** ca giả mạo |

Log của từng bước nằm trong `evidence/acceptance-<UTC>/step-NN-*.log`. Mỗi log ghi: đường dẫn cây,
**tree fingerprint** (SHA-256 tính trên danh sách đã sắp xếp của `đường-dẫn: sha256` cho mọi tệp trong
cây, loại trừ `.git/`, `node_modules/`, `data/`, `package/`, `delivery/` và chính thư mục log), thư mục
làm việc tạm, thời điểm bắt đầu, **kết quả mong đợi**, câu lệnh thật, mã thoát thật và từng dòng
`PASS |` / `FAIL |`. Kèm theo là `HARNESS-SUMMARY.txt`, `TREE-FINGERPRINT.txt`, `ENVIRONMENT.txt` — để
mọi log gắn với đúng snapshot/checksum cuối cùng, đúng yêu cầu bàn giao.

Chạy harness trên một cây khác mà không phải sửa script:

```bash
HARNESS_TREE=/đường/cây/khác bash evidence/acceptance-harness.sh --archive <archive.tar.gz>
```

Khi `HARNESS_TREE` được đặt, harness dùng **script trong cây đó**, nên kết quả chứng minh chính artefact
đang được soát chứ không phải bản trong sandbox.

**Vấn đề bootstrap, nói thẳng:** archive chứa log của lượt chạy harness, nên lượt chạy được giao kèm chỉ
có thể kiểm bản archive của **lần đóng gói ngay trước nó**. Vì vậy `HARNESS-SUMMARY.txt` ghi rõ
`sha256` và số byte của đúng bản archive đã được kiểm. SHA-256 của archive **cuối cùng** nằm trong tin
nhắn bàn giao và trong tệp `<tên>.tar.gz.sha256` kế bên archive. Người soát chạy lại harness với
`--archive` trỏ vào bản mình đang cầm sẽ kiểm chính bản đó; log của lượt chạy ấy sinh ra sau archive
nên nằm ngoài archive — đó là trình tự bình thường, không phải mâu thuẫn.

## 3. Bảo vệ kho đích (`08992f6…`) — đọc trước khi giải nén bất cứ thứ gì

Kho của người nhận đang ở commit `08992f60d2338f9b95649fa23415112b0fcbf94d`. Cây trong bộ artefact này
được làm trên commit cơ sở `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494`. **Quan hệ tổ tiên giữa hai
commit là UNKNOWN — không xác minh được từ môi trường tạo ra bàn giao** (clone nông: `git cat-file -t
08992f6…` báo invalid, chỉ 1 commit reachable). Điều này được ghi trong `package/MANIFEST.txt` và không
được suy đoán thêm ở bất cứ đâu trong bộ artefact.

Quy tắc bắt buộc:

1. **KHÔNG** giải nén `package/snapshot/` hoặc `package/delivered-tree-*.tar.gz` **đè lên** checkout của
   kho đích. Làm vậy ghi đè thay đổi chưa commit của người khác và trộn hai gốc commit khác nhau thành
   một cây không còn truy vết được.
2. Dựng cây Arena trong một **thư mục riêng trước**, rồi mới so sánh:

   ```bash
   mkdir -p ~/durios-review && cd ~/durios-review
   # (a) cây đã bàn giao, hoàn chỉnh, chạy được ngay:
   mkdir -p delivered && tar -xzf <handover>/package/delivered-tree-<ngày>.tar.gz -C delivered
   # (b) HOẶC cây cơ sở + patch, để thấy đúng phần thay đổi:
   mkdir -p base && tar -xzf <handover>/package/base-2f1538e80ac97dc1efb9d9b52b14782d9bfb2494.tar.gz -C base
   cd base && git init -q . && git add -A && git -c user.email=review@local -c user.name=review commit -qm base
   git apply --check <handover>/package/stage0-full.patch && git apply <handover>/package/stage0-full.patch
   ```

3. Chỉ so sánh bằng `git diff` / `git merge-base` giữa hai cây, **không** bằng cách chép tệp qua lại.
4. **Không** được kết luận "patch áp được lên `08992f6`" chỉ vì nó áp được lên `2f1538e`. Hai gốc có
   thể khác nhau ở bất kỳ tệp nào; phải kiểm bằng lệnh dưới đây trên máy có cả hai commit.
5. Nếu `08992f6` không reachable trong clone của bạn, hãy ghi **UNKNOWN** và dừng ở đó.

Lệnh đối chiếu (chạy nơi có cả hai commit):

```bash
git cat-file -t 08992f60d2338f9b95649fa23415112b0fcbf94d       # kỳ vọng: commit
git cat-file -t 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494       # kỳ vọng: commit
git merge-base --is-ancestor 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494 08992f60d2338f9b95649fa23415112b0fcbf94d; echo "exit=$? (0 = 2f1538e là tổ tiên của 08992f6)"
git merge-base --is-ancestor 08992f60d2338f9b95649fa23415112b0fcbf94d 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494; echo "exit=$? (0 = ngược lại)"
git merge-base 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494 08992f60d2338f9b95649fa23415112b0fcbf94d
git diff --stat 2f1538e80ac97dc1efb9d9b52b14782d9bfb2494 08992f60d2338f9b95649fa23415112b0fcbf94d
cd <checkout của 08992f6> && git apply --check <handover>/package/stage0-full.patch; echo "exit=$? (0 = patch áp sạch lên kho đích)"
```

Số liệu để đối chiếu, đo trên sandbox (không phải ước lượng):

| Mốc | Giá trị |
|---|---|
| Commit cơ sở của nhánh Arena | `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494` |
| Số tệp tại commit cơ sở (`git ls-tree -r`) | **523** |
| Commit kho đích do người nhận cung cấp | `08992f60d2338f9b95649fa23415112b0fcbf94d` |
| Quan hệ tổ tiên giữa hai commit | **UNKNOWN** (không kiểm được trong clone nông) |
| Số tệp trong cây đã bàn giao | `package/APPLY-VERIFY-LOG.txt` (mục 5) |
| Tệp bị ảnh hưởng bởi patch | 35 tệp sửa + toàn bộ tệp mới — danh sách và số lượng: `package/MANIFEST.txt` |
| SHA-256 của patch, của snapshot, của 2 archive | `package/SHA256SUMS.txt` |
| Danh sách từng tệp kèm SHA-256 + byte + dòng | `package/MANIFEST.txt` |
| Kết quả áp patch + so byte-for-byte | `package/APPLY-VERIFY-LOG.txt` (`PACKAGE_VERIFIED`) |
| Fingerprint của cây tại thời điểm đo | `evidence/acceptance-*/TREE-FINGERPRINT.txt` |

## 4. Tái dựng — ba cách, chọn một

**Cách nhanh nhất (chạy được ngay):**
```bash
mkdir -p /tmp/durios-delivered
tar -xzf package/delivered-tree-20261030.tar.gz -C /tmp/durios-delivered
cd /tmp/durios-delivered && bun install --frozen-lockfile && bun run typecheck && bun test
# kỳ vọng: install EXIT=0; typecheck EXIT=0; bun test 286 pass / 0 fail / 67 tệp, EXIT=0
bash docs/reports/arena-stage0-20261029/evidence/acceptance-harness.sh --archive <handover.tar.gz>
# kỳ vọng: EXIT=0 (10/10 bước) — xem mục 2
bash docs/reports/arena-stage0-20261029/evidence/rerun-all.sh   # sinh lại toàn bộ log rời rạc
```

**Cách so sánh với kho đích (`08992f6`) — patch để riêng đúng yêu cầu, và chỉ làm trong thư mục riêng:**
```bash
# làm đúng các bước ở mục 3 (b). Không bao giờ giải nén đè lên checkout của kho đích.
```

**Nếu `bun test` fail hàng loạt với lỗi mở CSDL** (`unable to open database file`, các test fail trong
dưới 1 ms): cây đang thiếu thư mục `data/`. Bản `delivered-tree` hiện tại đã kèm `data/uploads/.gitkeep`;
với bản dựng trước đó chỉ cần `mkdir -p data/uploads` rồi chạy lại — không phải lỗi mã nguồn.

**Cách không cần git:** giải nén `base-…tar.gz` vào một thư mục **riêng** rồi chép đè
`package/snapshot/` lên cây đó (đường dẫn trong `snapshot/` phản chiếu đúng cấu trúc kho — bỏ tiền tố
`snapshot/`). Kiểm tra bằng `bash package/verify-package.sh` (kỳ vọng in `PACKAGE_VERIFIED`, exit 0).

## 5. Công cụ và phụ thuộc cần có

| Loại | Cần gì | Ghi chú |
|---|---|---|
| Runtime chính | **bun** đúng theo `bun.lock` (đã đo bằng **1.4.4**) | `bun install --frozen-lockfile`; cần mạng tới registry hoặc cache bun đã ấm. Thiếu `bun` thì harness dừng ngay với exit 2 |
| Runtime phụ | **node** (đã đo bằng **v22.22.3**) | chỉ `evidence/ui-render-probe.mjs` cần |
| Script | **python3** (đã đo bằng **3.11.2**) | các assertion JSON trong evidence scripts và trong harness |
| VCS | **git** | `git apply --check` / `git apply`, `git archive`, đối chiếu commit |
| Công cụ shell | `bash`, `tar` (hỗ trợ `--format=pax`), `gzip`, `sha256sum`, `awk`, `grep`, `sed`, `curl`, `mktemp`, `find`, `sort`, `xargs`, `wc`, `cut`, `date` | harness cần `curl` để chờ server ở bước 4 |
| Phụ thuộc npm của dự án | **không có phụ thuộc runtime**; chỉ 3 devDependencies: `@types/bun`, `@types/node`, `typescript` | không nâng cấp, không thêm gói; `bun.lock` phải không đổi sau khi cài |
| Ngoài dự án | `happy-dom@15` | **chỉ** phục vụ DOM probe, **không** phải dependency của dự án: `npm install --prefix ~/tools happy-dom@15` rồi symlink vào `node_modules/` (`evidence/rerun-all.sh` tự làm nếu thiếu) |
| Không cần | trình duyệt, Docker, dịch vụ trả phí, nhà cung cấp OTP thật, credential production, máy của khách hàng | vì không có trình duyệt nên UI **chưa nghiệm thu được** ở môi trường này |
| Cờ môi trường hay dùng | `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true` (chỉ cho diễn tập), `DURIOS_HOST=127.0.0.1`, `DURIOS_PORT`, `DURIOS_DB_PATH`, `DURIOS_DATA_DIR` | không có cờ "bỏ qua cổng"; bằng chứng cổng chỉ khai được qua env của tiến trình server on-prem hoặc qua CLI |

## 6. Số liệu kiểm chứng (đọc từ log, không chép tay)

| Hạng mục | Kết quả | Log |
|---|---|---|
| Nghiệm thu tuần tự 10 bước (chạy trên cây giải nén từ archive, không phải trên cây sandbox) | **10/10 bước PASS, 89 assertion / 0 fail, EXIT=0**; bước 1 kiểm đúng bản archive có SHA-256 ghi trong summary | `evidence/acceptance-20261030T095617Z/` (10 step log + `HARNESS-SUMMARY.txt` + `TREE-FINGERPRINT.txt` + `ENVIRONMENT.txt`) |
| `bun run typecheck` | EXIT=0 | `rerun-20261030/TYPECHECK-LOG.txt` |
| `bun test` | **286 pass / 0 fail**, 4.484 `expect()`, 67 tệp, ~20 s | `TEST-SUITE-LOG.txt` |
| Modularity guard | `GO_MODULAR_ZERO_ANY_VERIFIED`, maxSrc 100, maxTest 100, `: any` = 0 (296 tệp TS) | `MODULARITY-LOG.txt` |
| Diễn tập Stage 0 (S1–S11) | 55 kiểm tra / 0 fail | `DRILL-STAGE0-LOG.txt` |
| Backup / restore / tamper | 0 fail, khôi phục xong manifest vẫn đạt, lật 1 byte bị phát hiện | `BACKUP-RESTORE-DRILL-LOG.txt` |
| HTTP walkthrough (server thật, `127.0.0.1:3111`) | 17 bước, EXIT=0 | `HTTP-WALKTHROUGH-LOG.txt` |
| Phân quyền / cách ly tenant / proof kit | 23 kiểm tra / 0 fail | `acceptance-*/step-05-*.log` |
| Ma trận CLI cổng khai trương | 7 ca (A1–A3 diễn tập, B1–B4 fixture vận hành); A1–B3 EXIT=1, chỉ B4 EXIT=0; 2 lần gọi auditor in `HOLD_BLOCKERS_REMAIN` | `GATE-CLI-MATRIX-LOG.txt` |
| **Tấn công nguồn gốc dữ liệu (F-14)** | 6 ca A0/A1/B0/B1/C1/D1, **54 assertion / 0 fail** — không ca nào mở được cổng bằng đổi tên, trộn, xoá sổ cái hay khai tệp khống | `GATE-PROVENANCE-ADVERSARIAL-LOG.txt` |
| Chế độ trích xuất thường vs tổng hợp | 0 fail; 0/8 giá trị canary của template lọt vào luồng thường | `EXTRACTION-MODE-LOG.txt` |
| DOM probe (headless) | 7/7 PASS — **KHÔNG phải ảnh chụp màn hình** | `UI-RENDER-PROBE-LOG.txt` |

## 7. Năm hạng mục bàn giao — trạng thái

| # | Hạng mục | Trạng thái | Ở đâu |
|---|---|---|---|
| 1 | Archive tải được + SHA-256 | **XONG** | archive này; SHA-256 ở tệp `<tên>.tar.gz.sha256` kế bên và trong tin nhắn bàn giao |
| 2 | Snapshot đầy đủ tại `2f1538e` + patch để riêng | **XONG** | `package/base-2f1538e….tar.gz` (523 tệp = đúng `git ls-tree -r` của commit cơ sở) + `package/stage0-full.patch` + `package/delivered-tree-….tar.gz` (toàn bộ cây đã bàn giao) |
| 3 | Kiểm tra đối kháng F-14 (đổi tên hồ sơ, cohort tổng hợp mã tuỳ ý, trộn cohort) | **XONG — cơ chế đã viết lại** | `reports/FINDINGS.md` F-14b, `reports/GATE-MATRIX.md` 0.3, `evidence/gate-provenance-adversarial.ts`, `test/gate-provenance-adversarial.test.ts` |
| 4 | Ai được ghi `externalEvidence`, kiểm tra thế nào, chặn bằng chứng tổng hợp ra sao | **XONG (tài liệu + code)** | `reports/GATE-MATRIX.md` mục 0.3(a)(b)(c), `test/gate-evidence-artifact.test.ts` |
| 5 | UI chỉ nghiệm thu khi có kiểm tra trình duyệt thật + ảnh chụp | **CHƯA NGHIỆM THU** | danh sách 57 mục đã giao: `reports/UI-ACCEPTANCE-CHECKLIST.md`; sandbox không có trình duyệt ⇒ không có ảnh chụp; chỉ có DOM probe headless |

**Giới hạn còn lại của F-14, nói rõ:** cơ chế mới phát hiện dữ liệu đi qua đường tổng hợp/fixture hoặc
seeder diễn tập (tín hiệu nằm trong sổ kiểm toán append-only có chuỗi băm, không nằm ở tên hồ sơ). Nó
**không** phân biệt được hồ sơ do con người gõ tay từ một chứng từ bịa với dữ liệu nhập thật, và **không**
thẩm định nội dung tệp bằng chứng (một trang trắng vẫn có SHA-256 hợp lệ). Hai khoảng trống đó chỉ đóng
được bằng rà soát của người vận hành và chữ ký Founder trên gói niêm phong. Ngoài ra: không có endpoint
HTTP nào nhận bằng chứng cổng, và quản trị viên máy/CLI được xem là **đáng tin** theo đúng ranh giới
Stage 0 — người có shell cố tình sửa CSDL rồi băm lại toàn bộ chuỗi nằm ngoài phạm vi phòng vệ.

## 8. Những gì bộ artefact này KHÔNG chứa và KHÔNG làm

- Không push, không merge, không mở PR, không deploy, không đổi remote. Toàn bộ nằm trong cây làm việc của nhánh `arena/e0ece0a7-durios`; **chưa có commit nào được tạo** cho phần việc này.
- **Không có credential** (không token, không mật khẩu thật, không `.env`, không khoá API). Mật khẩu trong CSDL diễn tập là mật khẩu công khai của fixture, chỉ có giá trị trong thư mục tạm.
- **Không có cơ sở dữ liệu khách hàng**: không có `data/durios.db`, không có blob tài liệu thật. Mọi hồ sơ, tài liệu, biên bản, "tệp bằng chứng" đều là fixture tổng hợp trong `/tmp` hoặc thư mục tạm.
- **Không có `node_modules`** và **không có cache** không cần thiết trong archive; `delivered-tree` loại trừ `.git`, `node_modules`, CSDL và blob runtime trong `data/`, `package/`, `delivery/` (chỉ giữ `data/uploads/.gitkeep` là tệp tracked để cây chạy được ngay).
- Không gửi OTP thật, không gọi dịch vụ trả phí, không liên hệ đối tác, không dùng credential production.
- Server chỉ bind `127.0.0.1`; không mở ingress công cộng; bước 4 của harness assert điều này.
- Agent không tự ký xác nhận địa điểm, không tự ký consent, không tự chọn nhà cung cấp, không tự mở cổng khai trương, không tự nâng trạng thái GATE-01..05.
- Không có ảnh chụp màn hình (không có trình duyệt trong sandbox) ⇒ hạng mục UI giữ trạng thái **CHƯA NGHIỆM THU**; đầu dò DOM không được dùng để thay thế.
- Không tuyên bố đã được nghiệm thu độc lập: việc đó thuộc về người nhận bộ artefact này.
