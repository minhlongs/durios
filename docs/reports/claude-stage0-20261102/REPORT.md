# Báo Cáo Tiếp Nhận Arena, Kiểm Chứng Độc Lập, Tích Hợp & Hoàn Tất Stage 0 — DuriOS

- **Ngày thực hiện:** `2026-11-02`
- **Kỹ sư tiếp nhận:** Claude Code (`Opus 5.5` + Best-of-5 `--ultra` Verifier)
- **Repository gốc:** `/Users/macbook/durios` (nhánh `main` tại `08992f60d2338f9b95649fa23415112b0fcbf94d` — được bảo toàn nguyên trạng 100%, bao gồm `.claude/` và `DURIOS_CONTAINER_DOSSIER_MASTER_PROMPT.txt`)
- **Worktree tích hợp:** `/Users/macbook/durios/.claude/worktrees/stage0-arena-integration` (nhánh `stage0/arena-integration-20261102`)
- **Môi trường kiểm chứng cô lập:** `/tmp/durios-stage0-verify-20261102/`
- **Quyết định vận hành hiện tại:** **STAGE 0 ENGINEERING COMPLETE (`HOLD_PENDING_EXTERNAL_EVIDENCE` cho dữ liệu khách hàng thật)** — Toàn bộ mã nguồn, bộ kiểm thử (`294/294 pass` trên Tree B; `286/286 pass` trên Tree A), 10 bước acceptance harness (`89/89 checks PASS` trên cả 2 cây), giao diện trình duyệt thật (`19/19 checks PASS`, `7/7 DOM probes PASS`) và diễn tập sao lưu/phục hồi đã xanh 100%. Hệ thống sẵn sàng cho **diễn tập dữ liệu tổng hợp (synthetic rehearsal)** và **chờ Founder ký mở 5 cổng vận hành thực địa (`GATE-01..GATE-05`: `0/5 evidenced`, `2/5 machine checks`)** trước khi nạp chứng từ khách hàng thật.

---

## 1. Kiểm Chứng Artifact & Đối Chiếu Lịch Sử Git

### 1.1. Kiểm chứng gói bàn giao vật lý trên máy
| Tên Artifact | Đường dẫn kiểm tra | Trạng thái trên đĩa | Kích thước (bytes) | SHA-256 thực đo | Kết luận |
|---|---|---|---|---|---|
| `durios-stage0-handover-20261030.tar.gz` | `/Users/macbook/Downloads/durios-stage0-handover-20261030.tar.gz` | **CÓ TRÊN ĐĨA** | `18,930,266` | `ce97836cf4f24a3b1b6b1b21a862d613c3a13dd9133ea4dfb7c9e2350744d38e` | Khớp 100% thông số bàn giao; `184/184` checksum nội bộ trong `SHA256SUMS.txt` khớp tuyệt đối. |
| `durios-stage0-handover-20261101-r4.tar.gz` | Đã quét toàn bộ `/Users/macbook`, `/tmp`, `/var/folders`, git stash/reflog | **KHÔNG TỒN TẠI TRÊN ĐĨA** | *(Báo cáo: `21,111,062`)* | *(Báo cáo: `57157c34b4d73526c04273b68337d80d2b82143415018cb71106c77e75513287`)* | Tuân thủ đúng Quy tắc Mục 3: Ghi nhận trung thực không có tệp trên máy, **không bịa đặt** nội dung báo cáo `r4`, tự kiểm tra và vá trực tiếp `F-16`, `F-17` cùng bộ regression tests trên nhánh tích hợp. |

### 1.2. Cấu trúc bên trong `durios-stage0-handover-20261030.tar.gz`
Giải nén cô lập tại `/tmp/durios-stage0-verify-20261102/archive-check/extracted/`:
- **Gói nền `durios-stage0-2f1538e8.tar.gz`:** `13,803,504` bytes, SHA-256 `4aa1ca33fe27292bfbe743b2c6626a55f2e61d34efde0a5faef769221bb28cf8`, gồm **523 tệp** tại commit `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494`.
- **Cây bàn giao `delivered-tree/`:** gồm **613 tệp**, tree fingerprint SHA-256:
  `a9c5043ce01672ed44241a018b134149ec13dd04036701fd3f81b206d5ac69aa` (khớp 100% với `TREE-FINGERPRINT.txt` của Arena).
- **Bản vá `durios-stage0-changes.patch`:** `688,187` bytes (`13,200` dòng).

### 1.3. Đối chiếu phả hệ Git: `08992f6` vs `2f1538e8` (`022dd41`)
Kiểm chứng độc lập bằng Git object comparison giữa `/Users/macbook/durios` (`08992f6`) và cây nền `2f1538e8` trong archive:
- Commit `2f1538e80ac97dc1efb9d9b52b14782d9bfb2494` có nội dung cây (tree SHA) trùng khớp với nhánh `origin/feat/homepage-flagship-showroom-and-agent-aeo-geo` (`022dd41`).
- `08992f60d2338f9b95649fa23415112b0fcbf94d` (`fix(export): enforce tenantId parity across FieldProofKit readiness and KPI queries (#12)`) là commit trên `main`.
- Giữa `08992f6` và `2f1538e8` có **25 tệp khác biệt**:
  - **21 tệp thuộc tính năng AEO / Flagship Showroom / CMO** (`src/aeo/*`, `src/server/aeo-*`, `.claude/agents/cmo.md`, `.claude/skills/marketing-*`, và 3 tệp test AEO/Showroom) — **vượt phạm vi Stage 0 V1** (vốn nghiêm cấm public showroom/marketplace trong gói on-premise một vựa).
  - **4 tệp thuộc PR #12 (`08992f6`):** `src/export/field-proof-kit-cli.ts`, `src/export/field-proof-kit-service.ts`, `src/server/ecosystem-rehearsal-handler.ts`, `test/field-proof-kit.test.ts` — bảo đảm cô lập `tenantId` trên `FieldProofKit`. (Lưu ý: bản vá Stage 0 của Arena cũng đã tích hợp lại phần sửa `tenantId` này trong `delivered-tree`).

---

## 2. Chiến Lược Đối Chứng Song Song Hai Cây (Tree A & Tree B)

Theo đúng quyết định đã xác nhận với Founder, chúng tôi dựng và kiểm chứng song song cả hai cây:

1. **Tree A (`/tmp/durios-stage0-verify-20261102/delivered-20261030`):**
   - Nguyên bản `delivered-tree` từ `durios-stage0-handover-20261030.tar.gz` trên nền `2f1538e8` (`613` tệp).
   - Bảo toàn nguyên vẹn tree fingerprint `a9c5043ce01672ed44241a018b134149ec13dd04036701fd3f81b206d5ac69aa`.
2. **Tree B (`/Users/macbook/durios/.claude/worktrees/stage0-arena-integration`, nhánh `stage0/arena-integration-20261102`):**
   - Nhánh sạch tách từ `08992f60d2338f9b95649fa23415112b0fcbf94d` (`main`).
   - Tích hợp toàn bộ thay đổi Stage 0 (`F-01..F-15`) từ `20261030`, **loại bỏ hoàn toàn 21 tệp AEO/Showroom/CMO ngoài phạm vi**, giữ nguyên bảo mật PR #12, và bổ sung đầy đủ **F-16 + F-17 + bản sửa tương thích macOS/BSD cho acceptance scripts + bản sửa responsive CSS 360px/768px**.

### Công thức đối chiếu số lượng bài kiểm thử (Reconciliation Formula)
Mọi con số đều được đo trực tiếp bằng `bun test`:
- **`08992f6` (`main` hiện tại):** `54` tệp test / **`236` tests**.
- **3 tệp test AEO/Showroom có trong `2f1538e8` nhưng không có trong `08992f6`:**
  - `test/agent-aeo-dual-view-injection.test.ts` (`3` tests)
  - `test/agent-aeo-geo-discovery.test.ts` (`2` tests)
  - `test/homepage-showroom-injection.test.ts` (`1` test)
  - Cộng thêm = **`+3` tệp / `+6` tests** -> Nền `2f1538e8` có `57` tệp / **`242` tests**.
- **10 tệp test Stage 0 mới trong `delivered-20261030` (`F-01..F-15`):** **`+10` tệp / `+44` tests**.
  - Do đó, trên **Tree A (`2f1538e8` + Stage 0 `20261030`):** `57 + 10 = 67` tệp / `242 + 44 =` **`286` tests** (`4,484` `expect()` calls).
  - Trên **Tree B trước khi thêm F-16/F-17 (`08992f6` + Stage 0 `20261030`, không có 3 tệp AEO/Showroom):** `54 + 10 = 64` tệp / `236 + 44 =` **`280` tests** (`4,418` `expect()` calls).
- **2 tệp test mới cho F-16 & F-17:** **`+2` tệp / `+14` tests** (`test/rehearsal-account-operational-guard.test.ts`: `7` tests; `test/pilot-cli-db-isolation.test.ts`: `7` tests).
  - Do đó, trên **Tree B hoàn chỉnh (`stage0/arena-integration-20261102`):** `64 + 2 = 66` tệp / `280 + 14 =` **`294` tests** (`4,460` `expect()` calls) — tương ứng chính xác với mức tăng `+14` tests (`286 -> 300`) được báo cáo trong bản `r4` trên nền `2f1538e8`.

---

## 3. Rà Soát Độc Lập & Xác Minh Từng Hạng Mục `F-01` .. `F-17`

| Mã | Mô tả lỗ hổng / yêu cầu kỹ thuật | Tập tin chính chịu trách nhiệm | Trạng thái trên Tree B | Bằng chứng xác minh |
|---|---|---|---|---|
| **F-01** | Tách biệt rõ `machineCheck` (máy chấm `2/5`) và `externalEvidence` (`0/5` khi chưa có chữ ký/bằng chứng con người); không báo `5/5 PASS` giả tạo | `src/auth/pilot-launch-gate-verifier.ts`, `src/auth/pilot-gate-evidence-verifier.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/pilot-gate-evidence-split.test.ts`, `test/gate-evidence-artifact.test.ts` |
| **F-02** | Chặn leo thang đặc quyền qua header `X-DuriOS-Actor-Role` khi không có cờ `DURIOS_ALLOW_HEADER_ACTOR_OVERRIDE=true` hoặc khi đi kèm Bearer token | `src/server/actor-resolver.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/http-server-e2e.test.ts`, `step-05` của acceptance harness |
| **F-03** | Khóa endpoint `POST /api/auth/pilot-rehearsal-bootstrap` mặc định (`403 FEATURE_DISABLED`) trừ khi bật `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=true` | `src/server/ecosystem-rehearsal-handler.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/rehearsal-bootstrap-and-provenance.test.ts`, kiểm thử UI `UI-E-10` |
| **F-04** | Chặn tự sinh dữ liệu trích xuất giả (synthetic regex fallback) khi `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION` tắt -> trả `EXTRACTION_MANUAL_ENTRY_REQUIRED` | `src/extraction/extraction-pipeline.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/synthetic-extraction-mode.test.ts`, `step-06` của acceptance harness |
| **F-05** | Phát hiện giả mạo (tampering) trên tệp chứng từ vật lý hoặc trường dữ liệu SQLite sau khi niêm phong khi gọi `GET /api/dossiers/:id/manifest` (`409 MANIFEST_INTEGRITY_VIOLATION`) | `src/export/manifest-integrity-verifier.ts`, `src/server/export-manifest-handler.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/manifest-integrity-tamper.test.ts`, `step-10` của acceptance harness |
| **F-06** | Cấm ghi nhận chứng cứ cổng (`recordGateEvidence`) từ tài khoản `CLERK` hoặc mạo danh `FOUNDER` qua CLI/API | `src/auth/pilot-gate-evidence-cli.ts`, `src/auth/pilot-gate-evidence-verifier.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/gate-provenance-adversarial.test.ts`, `step-07` của acceptance harness |
| **F-07** | Phát hiện đứt gãy chuỗi băm kiểm toán (`UNPROVEN_LEDGER_INTEGRITY`) hoặc sự kiện `SYNTHETIC_REHEARSAL` trong lịch sử DB, hạ `operationalGatesEvidencedCount` về `0` | `src/auth/pilot-launch-gate-verifier.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/gate-provenance-adversarial.test.ts`, `step-07` (`7a..7f`) |
| **F-08** | Redact thông tin nhạy cảm theo `ShareScope` (`SUMMARY_ONLY`, `COMPLIANCE_ONLY`, `FULL_DOSSIER`) trên manifest xuất cho bên thứ ba | `src/sharing/export-manifest-redactor.ts`, `src/sharing/redaction-policy.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/manifest-redaction-and-tenant-kpi.test.ts` |
| **F-09** | Cô lập `tenantId` tuyệt đối trong `PilotKpiEvaluator` và `FieldProofKitService` | `src/auth/pilot-kpi-evaluator.ts`, `src/export/field-proof-kit-service.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/manifest-redaction-and-tenant-kpi.test.ts`, `test/field-proof-kit.test.ts` |
| **F-10** | Bắt buộc cổng `127.0.0.1` / `localhost` / `::1` (`assertLoopbackHostname`), từ chối bind `0.0.0.0` | `src/server/server.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/pilot-auth-hardening.test.ts` |
| **F-11** | Quy tắc thẩm định tuân thủ GACC fail-closed khi thiếu trường bắt buộc hoặc chưa `HUMAN_VERIFIED` | `src/validation/validation-engine.ts`, `src/validation/rules/*` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/extraction-and-rule-fail-closed.test.ts` |
| **F-12** | Bảo vệ chống ghi đè DB vận hành khi chạy `pilot-rehearsal-seeder` (`assertSafeRehearsalSeedTarget`) | `src/auth/rehearsal-seed-guard.ts`, `src/auth/pilot-rehearsal-seeder.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/rehearsal-seed-target-guard.test.ts` |
| **F-13** | Quy trình `backup-site`, `verify-backup`, `restore-site` kiểm tra `PRAGMA integrity_check`, SHA-256 của DB và từng blob đính kèm, từ chối path traversal | `src/storage/backup-recovery-service.ts` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `test/backup-recovery.test.ts`, `step-09` của acceptance harness |
| **F-14** | Hiển thị trung thực trên UI hai bộ đếm độc lập (`0/5 CỔNG ĐỦ BẰNG CHỨNG` vs `Kiểm tra tự động (máy chấm được): 2/5`) và cảnh báo nguồn gốc dữ liệu `SYNTHETIC` | `src/server/public/index.html` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `ui-render-probe.mjs` (`7/7 PASS`) & Chrome `browser-ui-verify.mjs` (`19/19 PASS`) |
| **F-15** | Trần mô-đun nghiêm ngặt `<= 100 LOC` trên toàn bộ `src/` (161 tệp) và `test/` (126 tệp), `0` `:any` | Toàn bộ `src/` và `test/` | **ĐÃ KHẮC PHỤC & XÁC MINH** | `bun run src/saas/blueprint-cli.ts --deep` (`15/15 Socratic Turns PASS`) |
| **F-16** | **Chặn tài khoản diễn tập công khai (`clerk.cailay`, `manager.cailay`, `ACC-CAILAY-CLERK-01`, `ACC-CAILAY-MGR-01`, `+84901000111`, `+84901000222`) trong chế độ vận hành** (khi cả `DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION` và `DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP` đều tắt) trên cả 6 điểm vào: `provisionPilotAccount`, `loginWithPassword`, `requestOtpChallenge`, `verifyOtpChallenge`, `issueManagedPilotToken`, `authenticateToken` | `src/auth/rehearsal-account-guard.ts`, `src/auth/sqlite-auth-service.ts` | **ĐÃ CÀI ĐẶT MỚI & XÁC MINH** | `test/rehearsal-account-operational-guard.test.ts` (`7/7 pass`) |
| **F-17** | **Cô lập DB trong CLI vận hành:** (1) `backup-site`, `verify-backup`, `restore-site` không khởi tạo `SqliteClient` hay `SqliteAuthService` và không tạo `./data/durios.db` ngầm; (2) lệnh tài khoản/token đòi hỏi `--db`/`--db-path` hoặc `DURIOS_DB_PATH` tường minh; (3) đồng bộ `--db` và `--db-path` trên toàn bộ CLI pilot | `src/auth/cli-db-args.ts`, `src/auth/pilot-ops-cli.ts`, `src/auth/pilot-kpi-evaluator.ts`, `src/auth/pilot-launch-gate-verifier.ts`, `src/auth/pilot-rehearsal-seeder.ts`, `src/export/field-auditor-cli.ts` | **ĐÃ CÀI ĐẶT MỚI & XÁC MINH** | `test/pilot-cli-db-isolation.test.ts` (`7/7 pass`) |

---

## 4. Các Cải Tiến Bổ Sung Đã Thực Hiện Trong Đợt Tiếp Nhận Này

1. **Tương thích đa nền tảng macOS/BSD & Linux/GNU cho bộ kịch bản nghiệm thu (`docs/reports/arena-stage0-20261029/evidence/`):**
   - Trong `acceptance-harness.sh`, `http-walkthrough.sh`, và `gate-cli-matrix.sh`, Arena từng gọi trực tiếp `sha256sum`, `base64 -w0`, `cat -A`, kiểm tra `[ -d "$TREE/.git" ]` (lỗi trên git worktree vì `.git` là file trỏ tới gitdir), và hardcode `/home/user/durios/data` trong bài test `8e`.
   - Đã cập nhật shim tương thích POSIX/macOS/Linux: tự động dò `sha256sum` -> `gsha256sum` -> `shasum -a 256`, dùng `base64 < "$file" | tr -d '\r\n'`, `cat -e -t`, `[ -e "$TREE/.git" ]`, và đường dẫn tương đối `./data` trong bài test `8e`.
2. **Sửa lỗi tràn ngang (Horizontal Overflow) trên màn hình Tablet (`768x1024`) và Mobile (`360x640`):**
   - Khi kiểm chứng bằng trình duyệt Google Chrome thật (`browser-ui-verify.mjs`), phát hiện thanh điều hướng `.durios-top-command-bar` (trong `site/public/durios-design-system.css` và `queue/durios-design-system.css`) cùng thanh `.workflow-step-filter-bar` (trong `src/server/public/index.html`) tràn sang phải ở độ rộng `768px` (`scrollWidth = 903px`) và `360px` (`scrollWidth = 569px`).
   - Đã bổ sung quy tắc responsive `@media (max-width: 1024px)` và `@media (max-width: 640px)` ẩn các nút phụ trên thanh 44px ở màn hình hẹp và cho phép `.workflow-step-filter-bar` xuống dòng (`flex-wrap: wrap; white-space: normal`), đồng bộ byte-identical giữa `site/public/durios-design-system.css` và `queue/durios-design-system.css`.
   - Kết quả đo lại trên Chrome thật: `scrollWidth === clientWidth` ở cả `1280x800` (`1280 === 1280`), `768x1024` (`768 === 768`), và `360x640` (`360 === 360`).

---

## 5. Danh Mục Tệp Đã Tạo Mới / Chỉnh Sửa Trên Nhánh Tích Hợp

- **Mã nguồn bảo mật & vận hành mới (`F-16`, `F-17`):**
  - `src/auth/rehearsal-account-guard.ts` (`48` LOC)
  - `src/auth/cli-db-args.ts` (`36` LOC)
  - `src/auth/sqlite-auth-service.ts` (`96` LOC)
  - `src/auth/pilot-ops-cli.ts` (`92` LOC)
  - `src/auth/pilot-kpi-evaluator.ts`, `src/auth/pilot-launch-gate-verifier.ts`, `src/auth/pilot-rehearsal-seeder.ts`, `src/export/field-auditor-cli.ts`
- **Giao diện & Responsive CSS:**
  - `src/server/public/index.html`
  - `site/public/durios-design-system.css` & `queue/durios-design-system.css` (byte-identical)
- **Kiểm thử hồi quy mới:**
  - `test/rehearsal-account-operational-guard.test.ts` (`99` LOC, `7` tests)
  - `test/pilot-cli-db-isolation.test.ts` (`96` LOC, `7` tests)
- **Kịch bản nghiệm thu tương thích macOS/Linux:**
  - `docs/reports/arena-stage0-20261029/evidence/acceptance-harness.sh`
  - `docs/reports/arena-stage0-20261029/evidence/http-walkthrough.sh`
  - `docs/reports/arena-stage0-20261029/evidence/gate-cli-matrix.sh`
- **Bộ báo cáo nghiệm thu & bàn giao Stage 0:**
  - `docs/reports/claude-stage0-20261102/REPORT.md` (tệp này)
  - `docs/reports/claude-stage0-20261102/VERIFICATION.md`
  - `docs/reports/claude-stage0-20261102/REMAINING-WORK.md`
  - `docs/reports/claude-stage0-20261102/CUTOVER-CHECKLIST.md`
  - `docs/reports/claude-stage0-20261102/ULTRA-ADVISORY-VERDICT.md`
  - `docs/reports/claude-stage0-20261102/screenshots/*.png` (`8` ảnh chụp màn hình từ Chrome thật)
