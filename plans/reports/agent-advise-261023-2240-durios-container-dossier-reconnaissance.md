# Báo cáo tư vấn — Khảo sát trước thực thi DuriOS Container Dossier Workspace

**Ngày:** 2026-10-23
**Nhánh:** `main` — HEAD `8208092`
**Chế độ:** đọc-only (read-only reconnaissance). Không có mã nguồn nào bị thay đổi ở repo core.

> Lưu ý: báo cáo này chỉ ghi nhận những gì đã đọc và đo được từ mã nguồn,
> kiểm thử và cấu hình. Không có màn hình nào được chụp hoặc xác minh trực quan.

---

## 1. Xác minh workspace và trạng thái thực tế

- `/Users/macbook/durios` — checkout chính (core), nhánh `main`, HEAD `8208092`. Có quyền ghi.
- `/Users/macbook/durios-frontend-demo` — git worktree **cùng một repository**, nhánh `feat/frontend-investor-demo`, HEAD `f37667a`.
- Còn có `/Users/macbook/durios/.claude/worktrees/gate-hardening`, nhánh `hardening/launch-gate-evidence`.
- Cả ba dùng chung một `.git`. Remote: `origin` → `https://github.com/minhlongs/durios.git`.

Prompt giả định core đã bị "đóng băng" (frozen) tại `f621b47`. Điều này **không còn đúng**:

- `f621b4733b809d3f871340383031e060ea8f7ae9` là **merge-base** của `main` và `feat/frontend-investor-demo`, không phải HEAD hiện tại của core.
- `docs/audits/COMMAND-10-REPOSITORY-FREEZE.md` chứa ghi chú hiệu lực ghi rõ lệnh "DEVELOPMENT FROZEN" và việc tạm dừng Pilot **không còn hiệu lực thi hành**, được thay thế ngày 2026-10-14 theo phê duyệt của Founder, vì các hạng mục bảo mật và lưu trữ của Prompt 5A đã đạt nghiệm thu kỹ thuật.
- Vì vậy core **không** frozen; nó là nhánh đã phát triển xa hơn.

Không có thao tác `reset`, `stash`, `clean` hay ghi đè nào được thực hiện trên bất kỳ workspace.

---

## 2. Phát hiện then chốt — phân kỳ trạng thái cách ly luật định

Đây là phát hiện quan trọng nhất, vì nó chạm vào an toàn thực phẩm.

- Trên worktree `feat/frontend-investor-demo`, quy tắc `RUL-GB2762-CD` (GB 2762-2022, cadmi, ngưỡng 0.050 mg/kg, mức `CRITICAL_BLOCKER`) có `isActive: true` **và** `isStatutoryVerified: true`.
- Trên core `main`, commit `d6ca29e` — nằm sau merge-base — đã thay đổi trạng thái cách ly của quy tắc này. Worktree demo **chưa nhận** commit đó, nên hai nhánh không đồng ý về việc cơ sở pháp lý của quy tắc này đã được thẩm định hay chưa.
- `RUL-INT-CD-WARN` (0.040 mg/kg, `ADVISORY_WARNING`) đúng là `isStatutoryVerified: false` và mang tên "Internal Packhouse Advisory Cadmium Warning" ở cả hai nhánh.

**Cơ chế fail-closed (an toàn) của engine:** `src/rules/deterministic-engine.ts` không bao giờ cho qua một quy tắc chưa thẩm định:

- Một trường chưa được người xác minh sẽ chặn ngay bằng `HUMAN_VERIFICATION_REQUIRED`, với `ruleId: "RUL-GATE-UNVERIFIED"`.
- Một quy tắc đang hoạt động nhưng chưa thẩm định cơ sở pháp lý, với mức `CRITICAL_BLOCKER`, sẽ tạo một finding `CRITICAL_BLOCKER` với `observedValue: "UNVERIFIED_STATUTORY_RULE"` và thông điệp: *"Quy tắc `<id>` chưa được thẩm định cơ sở pháp lý, không thể áp dụng kết luận pháp lý."*

**Khuyết thiếu cụ thể bị phát hiện:** tầng giao diện trình duyệt (`src/server/public/js`) **không đọc và không hiển thị** `isStatutoryVerified`. Hệ quả: một blocker không thể mang kết luận pháp lý trông y hệt một blocker thật, dù engine đã fail closed. Đây chính là khiếm khuyết cần sửa.

---

## 3. Hợp đồng thực sự tồn tại trong workspace có thể chỉnh sửa

Trên worktree `feat/frontend-investor-demo`:

- `ExtractedField` (`src/domain/types.ts`) có `boundingBox`, `confidenceScore`, `verifiedBy`, `verifiedAt` — tức là có provenance thật, không phải thuần hiển thị.
- `BoundingBox` được định nghĩa `{pageNumber, x, y, width, height}` — tức là tọa độ vùng và số trang có sẵn để làm việc highlight sau này.
- `HitlVerificationService` (`src/verification/hitl-service.ts`) ghi nhận **actor** (`verifiedBy`/`verifiedAt`) và **lý do** (`clerkNote`) — đây là bằng chứng con người, không phải điểm tin cậy tự động.
- Lưu trữ SQLite WAL (`src/storage/sqlite-dossier-repository.ts`) cộng sổ cái kiểm toán chuỗi băm (`src/audit/audit-ledger.ts`).
- Xuất khẩu: manifest JSON hợp nhất, kèm tóm tắt dữ liệu đã xác minh và cảnh báo pháp lý.

**Nhưng:** giao diện trình duyệt hiển thị từ **fixture tổng hợp** trong `src/server/public/js/state/`. `js/api-client.js` có tồn tại (`checkServerHealth`, `fetchDossiers`, `fetchDossierById`) nhưng UI không gọi nó. Do đó mọi thứ hiển ra trên màn trình duyệt **không** là đã tích hợp thật với backend.

---

## 4. Khoảng cách so với đặc tả trong prompt

Tất cả đều đã kiểm tra và **không tồn tại**:

| Yêu cầu | Trạng thái |
|---|---|
| Xem trước PDF/hình ảnh, phân trang, zoom, vẽ vùng highlight | Không có ở bất kỳ đâu trong `src/server/public` |
| Sáu nhãn trạng thái tiếng Việt yêu cầu | Không có: "Cần rà soát", "Cần bổ sung bằng chứng", "Có sai lệch", "Đã xác nhận dữ liệu", "Nguồn đã thay đổi", "Cần đánh giá lại" |
| Hiển thị `isStatutoryVerified` | Không có |
| Kiểm soát phiên bản/tranh chấp ghi đồng thời | Không có cột version, không có từ chối ghi lỗi thời (409) |

Thêm nữa: `STATUS_META` trong `js/utils/formatters.js` chỉ có nhãn tiếng Anh (ví dụ `AWAITING_REVIEW` → "Awaiting review"), nên trạng thái hồ sơ hiển thị bằng tiếng Anh dù tiếng Việt là ngôn ngữ mặc định.

---

## 5. Kiểm thử nền đã đo (không suy đoán)

| Workspace | Lệnh | Kết quả |
|---|---|---|
| `durios-frontend-demo` | `bun test` | **123 pass, 0 fail**, 2023 `expect()`, 19 file, 233 ms |
| `durios` (core) | `bun test` | **162 pass, 3 fail**, 3534 `expect()`, 165 test, 39 file |

Ba lỗi của core là **pre-existing** (do môi trường), không phải hồi quy: `test/adversarial-verification.test.ts` và `test/process-restart-persistence.test.ts` gán cứng cổng và gặp `EADDRINUSE`. Tái hiện được khi chạy riêng lẻ.

Môi trường: Bun 1.3.14, Node 22.23.2, **0 phụ thuộc npm runtime**.

---

## 6. Chặn ngoài — không thể ship trong phiên này

`gh auth status` báo token keyring cho `github.com` không hợp lệ. `api.github.com` bị sandbox từ chối. Nên **không thể tạo PR hoặc push** trong phiên này. Công việc commit và tạo nhánh nội bộ không bị ảnh hưởng.

---

## 7. Quyết định đã chốt

- Người dùng trả lời câu hỏi chọn workspace gốc là *"cả 3"*. Đọc theo hướng khả thi: triển khai bề mặt rà soát ở **cả ba** workspace, bắt đầu từ worktree demo (workspace UI biệt lập mà prompt chỉ định), sau đó tới core `main`; và điều này cũng cho phép căn chỉnh catalog quy tắc.
- Các cổng giới hạn được giữ theo prompt: không mở rộng ra mạng công cộng, không đa người dùng, không đồng bộ đám mây, không telemetry, không thêm phụ thuộc, không migration DB, không chạm dữ liệu khách hàng thật, không gọi OCR/LLM bên ngoài.

---

## 8. Đề xuất các bước tiếp theo

1. **Xác minh trực quan bằng trình duyệt** (bước chặn lớn nhất): với DevTools tại cổng 9333, chạy `bun run demo:e2e` và `bun run l10n:check`, rồi kiểm tại 1440 / 768 / 375 px.
2. **Căn chỉnh catalog quy tắc** giữa hai nhánh — quyết định tuân thủ, cần bằng chứng, không phải sửa UI. Xem phần 2.
3. **Nối UI vào API thật** (`api-client.js` đã có sẵn nhưng chưa dùng), để dữ liệu SQLite thay fixture. Đây mới là "tích hợp thật".
4. **Thêm kiểm soát phiên bản** cho ghi đồng thời nếu phạm vi đa người dùng được mở.
5. **Xem trước chứng từ và highlight vùng** — hợp đồng `BoundingBox` đã sẵn, còn thiếu dữ liệu ảnh trang.
6. **Ship**: cần token `gh` hợp lệ hoặc mở quyền mạng cho `api.github.com`.

---

## Câu hỏi chưa giải quyết

1. Phân kỳ `RUL-GB2762-CD` giữa hai nhánh: worktree demo hiện đang mang quy tắc active + statutory-verified, core `main` đã thay đổi trong `d6ca29e`. Cần merge/rebase từ core, hay đây chủ đích là behavior của nhánh demo? Đây là quyết định tuân thủ, không tự suy diễn được.
2. Có cần xác nhận backend thật? Kiểm thử hiện chạy trên fixture. Chưa có bằng chứng nào cho thấy các module này hành xử đúng khi gặp dữ liệu SQLite thật.
3. Ship đi đường nào khi `gh` không dùng được trong sandbox?

---

## 9. Đã thực thi trên core `main` (bổ sung sau khảo sát)

Sau khi người dùng chọn "cả 3", phần rà soát đã được chuyển sang core `main`.

**Đã thêm** (tất cả đều ≤100 dòng theo cổng modularity của repo):

| File | LOC | Nội dung |
|---|---:|---|
| `src/ui/review-state.ts` | 90 | Sáu trạng thái, nhãn tiếng Việt làm chuẩn, `classifyField()` |
| `src/ui/review-legal-basis.ts` | 56 | `legalBasisOf()`, `ruleCarriesLegalConclusion()`, `reviewProgress()` |
| `test/review-state.test.ts` | 95 | Phân loại trạng thái |
| `test/review-legal-basis.test.ts` | 76 | Cơ sở pháp lý + mẫu số rà soát |
| `test/review-claims-boundary.test.ts` | 63 | Không khẳng định chứng nhận/thông quan |

**Đã sửa** `src/server/public/index.html` (+36/−4): nhãn `FIELD_STATUS_META` dùng đúng sáu trạng thái tiếng Việt; dòng trường hiển thị trạng thái vận hành, kể cả "Nguồn đã thay đổi" khi chứng từ thuộc về `isSuperseded`, và "cần bổ sung bằng chứng" khi giá trị rỗng.

**Kiểm thử đo được ở core:** `bun test` → **188 pass, 3 fail** (nền trước thay đổi: 162 pass, 3 fail). Ba lỗi là `EADDRINUSE`/timeout của hai test gán cứng cổng, **tái hiện được khi chạy riêng**, không phải hồi quy. `bun run typecheck` → **0 lỗi**. Cổng modularity ≤100 dòng: pass.

**Ràng buộc phát sinh:** core chỉ phục vụ `index.html` (không có thư mục tĩnh cho JS), nên module TS không thể được trình duyệt tải trực tiếp. Script nội bộ trong `index.html` phải tự mang bản sao quy tắc, và hai bên được giữ đồng bộ bằng ghi chú chung. Đây là điểm cần cải thiện: nên cho `static-ui.ts` phục vụ thư mục `src/ui/` để bỏ bản sao.

**Worktree thứ ba không được áp dụng** — `gate-hardening` (HEAD `e194de8`) là công việc auth/launch-gate, 0 commit liên quan UI, và phân kỳ khỏi `main`. Đưa bề mặt rà soát vào đó sẽ đặt công việc UI lên một nhánh không liên quan đang được thực hiện dang dở.
