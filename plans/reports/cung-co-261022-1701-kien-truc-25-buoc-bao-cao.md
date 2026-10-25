# Báo cáo: Củng cố kiến trúc cho ý tưởng 25 bước DuriOS
**Consolidating the architecture for the DuriOS 25-step idea**

- **Ngày:** 2026-10-22 (Asia/Saigon)
- **Yêu cầu:** `/deep-research cũng cố kiến trúc cho idea 25 bước` (báo cáo tiếng Việt)
- **Phạm vi đã chốt:** lớp mạng/liên kết/tối ưa hóa chéo (các bước 1, 6, 10, 13–15, 18, 23) là nơi blueprint đang ở mức giả thuyết; bằng chứng kết hợp nội bộ (đọc mã thật) và khuyến nghị cho founder phi kỹ thuật.

---

## 🚦 TRẠNG THÁI NGUỒN DỮ LIỆU — ĐỌC TRƯỚC TIÊN

**Hai trong năm góc độ có nguồn ngoài thật, ba góc độ không có.**

Góc **mô hình open-core & giấy phép** và góc **kỹ thuật/vận hành** đã đọc trực tiếp được các trang chính thức và dẫn URL + nhà xuất bản + ngày cho từng khẳng định: W3C REC (DID Core, VC Data Model 2.0), RFC 8032, GitLab, Sentry, Mattermost, HashiCorp, OpenTofu, Trulioo, Croptracker, Bushel, Sourcegraph, sqlite.org, NIST, IETF, GS1, IPPC, WCO, OWASP.

Ba góc độ còn lại — **thị trường, quy định GACC, GTM** — **không có nguồn ngoài nào** vì đường ra mạng bị chặn hoàn toàn trong phiên này: Exa MCP hết quota (lỗi trên mỗi lần gọi), native `WebSearch` không tồn tại, và sandbox từ chối mọi host (`api.github.com`, `google.com`, `thuvienphapluat.vn` đều trả `deny network-outbound … (user denied)`).

**Vì vậy báo cáo này KHÔNG xác nhận và cũng KHÔNG bác bỏ bất kỳ khẳng định nào về thị trường hay quy định** — kể cả những trích dẫn pháp lý mà chính kho mã đang dùng (Nghị định 52/2024/NĐ-CP, Nghị định 248/2026/NĐ-CP, Luật 91/2025/QH15, Luật 122/2025/QH15, yêu cầu GACC, quy mô thị trường 281 vựa). Phần §9 liệt kê đầy đủ những câu hỏi cần một người có internet kiểm chứng.

**Một cảnh báo về cách đọc vai trò của tôi trong báo cáo này:** hai góc có nguồn ngoài vẫn có khẳng định sai, và tôi đã phát hiện khi tự chạy lại. Agent báo cáo góc open-core nói *"mô hình local-core + opt-in federation có tiền lệ trong W3C DID/VC"* — đúng về đặc tả, nhưng chính trang W3C cũng nói rõ *"xác minh được không có nghĩa là các tuyên bố bên trong là đúng"*, nên nó **không** giải quyết vấn đề niềm tin mà DuriOS cần. Còn góc kỹ thuật nói endpoint portability *"tin secret do client cung cấp nên bất kỳ ai cũng tự chứng thực cho payload của mình"* — tôi đã bác bằng chạy mã (trả `false`, chặn đúng); lỗi thật là hạ cấp im lặng khi thiếu secret. Vậy: **nguồn ngoài chỉ là tín hiệu, không phải bằng chứng** — mỗi khẳng định trong báo cáo này đều được tôi đọc lại hoặc chạy lại trước khi ghi.

Mọi phần còn lại suy ra từ **bằng chứng nội bộ đã được đọc trực tiếp từ mã và tài liệu trong kho**, và đã được tôi tự kiểm chứng lại bằng lệnh chạy trên chính kho mã.

---

## 1. Kết luận ngắn cho Founder

**Ý tưởng 25 bước là thật về mặt kỹ thuật phần lớn, nhưng nền kinh tế của nó tự mâu thuẫn, và cổng cho phép nạp dữ liệu khách hàng thật đang yếu hơn mô tả.**

Sáu phát hiện quan trọng nhất, xếp theo rủi ro giảm dần:

1. 🔴 **SaaS thuần túy trong nước không thể đạt $1M ARR** — phép toán đã được tôi kiểm chứng lại: cần **428 vựa**, cả nước chỉ có **281 cơ sở đang hoạt động**, trần doanh thu chỉ **$657.643**. Đây không phải lỗi, mà là kết luận đúng; vấn đề là kiến trúc hiện chưa xây lớp thay thế nào có bằng chứng.
2. 🔴 **Cổng GATE-01 và GATE-02 xanh trên bằng chứng mà mã không hề đọc** — GATE-01 chỉ kiểm tra tệp *tồn tại*, GATE-02 chỉ kiểm tra biến môi trường *khác rỗng*. Không có lần gọi nhà mạng OTP nào được thực hiện.
3. 🟠 **Khóa giấy phép của hai vựa khác nhau có thể giống nhau từng byte** — đã chứng minh bằng cách chạy mã (`key1 === key2 : true`). Chữ ký Ed25519 là xác định, mà payload không có nonce. Hệ quả: không thể thu hồi khóa của một vựa, và khóa của vựa này mở được vựa khác.
4. 🟠 **"Đống doanh thu 8 tầng" được định nghĩa hai lần, hai nội dung khác nhau** — tài liệu và mã mô tả cùng một thứ với các tầng gần như không trùng nhau, và bộ kiểm tra tự động chỉ đọc một cờ boolean nên không phát hiện ra. 7/8 tầng lệch nhau.
5. 🟠 **Chữ ký portability bị bỏ qua im lặng** — đã chạy mã chứng minh: không cấp secret là `valid: true`, không kiểm tra gì. Đây là giá trị cốt lõi của Bước 14 (funnel di cư workspace có chữ ký).
6. 🟡 **Bước 3 tự gán nhãn "đã kiểm thử" nhưng không có test nào**, và không có route HTTP nào gọi tới HITL.

---

## 2. Cái gì là thật (đã kiểm chứng)

| Tuyên bố | Bằng chứng | Kết luận |
|---|---|---|
| 25/25 artifact tồn tại | `bun run blueprint:verify-25-steps` → `Overall Passed: YES (100%)`, exit 0 | ✅ Thật |
| 25/25 artifact có code thật (không stub, không file rỗng) | Đọc từng tệp: 1.891 dòng / 133.608 byte | ✅ Thật |
| `plan.md` và `tasks.md` khớp 1:1 | 25 heading `## N.` ↔ 25 marker `- [x] **Step N:` | ✅ Thật |
| 17/25 bước có test tự động trực tiếp | grep trong `test/` | ✅ Thật |
| Cả 5 câu về GATE-01..05 trong plan.md khớp code | Đối chiếu từng gate | ✅ Thật |

**Nhưng con số 25/25 chỉ đo *độ phủ tệp*.** `plan.md:9` đã tự nói đúng điều này, và đó là tuyên bố trung thực. Nó không chứng minh gì về khách hàng trả tiền, bằng chứng thực địa, hay hợp đồng đã ký.

---

## 3. 🔴 Phát hiện số 1: Trần doanh thu phá vỡ mô hình kinh tế hiện tại

Đây là phát hiện quan trọng nhất, và nó suy ra từ chính số liệu dự án đang khai.

Phép toán tôi đã chạy lại độc lập:

```
281 vựa × 60.000.000 VND = 16.860.000.000 VND ≈ $657.643   (tỷ giá 25.637)
1.000.000 USD cần: 1.000.000 × 25.637 / 60.000.000 = 427,28 → làm tròn lên 428 vựa
428 > 281  →  chiếm 100% thị phần nội địa vẫn không đạt $1M ARR
```

**Hiệu chỉnh so với báo cáo audit nội bộ:** việc tài liệu ghi `427` còn plan.md ghi `428` **không phải lỗi mâu thuẫn**. `427,28` là kết quả thô; `428` là làm tròn lên bắt buộc vì không thể bán một phần vựa. [plan.md:71](plans/company-blueprint/plan.md:71) giải thích đúng điều này và là con số đáng bảo vệ.

**Vậy vấn đề thật là gì:** kết luận "428 > 281" là **đúng**, và nó buộc phải dùng đống doanh thu đa lớp. Nhưng lớp thay thế đó chưa được xây — xem phát hiện số 3.

---

## 4. 🟠 Phát hiện số 2: "Đống doanh thu 8 tầng" mâu thuẫn với chính nó

[plan.md:72](plans/company-blueprint/plan.md:72) khai rằng `economicTruth` trong manifest là *"một nguồn"* cho mọi báo cáo, API và CLI. Thực tế hai bên định nghĩa 8 tầng khác nhau:

| # | Tài liệu chính thức ([VALIDATION-AND-ECONOMICS-V2.md](docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md) dòng 31–44) | Mã nguồn ([open-core-edition-manifest.ts](src/saas/open-core-edition-manifest.ts) dòng 73–80) |
|---|---|---|
| 1 | DuriOS Core SaaS | Packhouse Pro SaaS (60M/năm hoặc 150k/container) |
| 2 | Verification Modules | Cloud Vision OCR + Zalo ZNS packs |
| 3 | Multi-site Enterprise | E2EE Cloud Backup + Lưu trữ 5 năm |
| 4 | Verified Network Rooms | GACC Registry Watch + Buyer Verification Room |
| 5 | Transaction Orchestration (0,1–0,5%) | Zero-Custody Escrow Orchestration Fee |
| 6 | Logistics / Lab Referral | Trade-Finance + Marine Insurance API |
| 7 | Finance / Insurance Share | ASEAN Multi-Origin Corridors |
| 8 | Regional Enterprise (TH, MY) | Enterprise Cluster + ERP/Customs EDI |

**Chỉ tầng 1 gần tương đương. 7/8 tầng còn lại không khớp.**

**Tệ hơn: bộ kiểm tra tự động không phát hiện ra.** [open-core-deep-introspector.ts:62-65](src/saas/open-core-deep-introspector.ts:62) đặt tên cổng là "Unit Economics & **Multi-Revenue Stack Truth**", nhưng điều kiện thật chỉ là:

```
margin 94,67% ≥ 80%  AND  657.643 < 1.000.000  AND  multiRevenueStackRequired === true
```

Cả ba đều là **hằng số**. Cờ `multiRevenueStackRequired` chỉ cần `true`, không cần bất kỳ tầng nào được định nghĩa, nhất quán, hay khác rỗng. Vậy nên:
- Test [open-core-25-step-blueprint-e2e.test.ts:16-18](test/open-core-25-step-blueprint-e2e.test.ts:16) chỉ kiểm tra các **con số** (281, 60M, 657.643, 1M) — không hề đọc danh sách 8 tầng.
- Verdict `GO_OPEN_CORE_SAAS` do đó là **kết quả đã được định sẵn về mặt cấu trúc**, không phải một đánh giá độc lập.

---

## 5. 🔴 Phát hiện số 3: Cổng cho phép nạp dữ liệu khách hàng thật quá yếu

Hai cổng quyết định khi nào được nạp dữ liệu thật đều xanh trên bằng chứng không hề được đọc:

**GATE-01** — [pilot-launch-gate-verifier.ts:38](src/auth/pilot-launch-gate-verifier.ts:38):
```ts
const gate01Passed = Boolean(consentPath && existsSync(consentPath));
```
Chỉ kiểm tra tệp tồn tại. **Nội dung biên bản chấp thuận DPA không bao giờ được đọc.** Tệp rỗng, tệp sai, hoặc tệp chưa ký — miễn là nó nằm ở đường dẫn đó — cổng vẫn mở. Đây chính xác là cổng cho phép nạp dữ liệu cá nhân của khách hàng.

**GATE-02** — [pilot-launch-gate-verifier.ts:41](src/auth/pilot-launch-gate-verifier.ts:41) đọc `otpProvider.isConfigured`, đến từ [createOtpProviderFromEnv](src/auth/http-gateway-otp-provider.ts:77). Đường sản xuất này **fail-closed đúng cách** khi thiếu biến môi trường (trả `UnconfiguredOtpProvider`). Nhưng nó chỉ cần URL + key **hợp lệ về cú pháp** là đã `true`.

**Hiệu chỉnh quan trọng so với audit nội bộ:** `FakeOtpProvider.isConfigured = true` ([otp-provider.ts:21](src/auth/otp-provider.ts:21)) có thật, nhưng **chỉ dùng trong test** — đường production không bao giờ trả về nó. Vậy lỗ hổng hẹp hơn và chính xác hơn: *cổng xanh trên cấu hình chưa được chứng minh gửi thật*, không phải "cổng xanh trên nhà cung cấp giả".

**Bằng chứng từ chính bộ test:** [test/pilot-launch-gate-verifier.test.ts:48](test/pilot-launch-gate-verifier.test.ts:48) đạt `goForLiveCustomerData: true` bằng cách ghi một chuỗn bất kỳ do chính test viết ra, kèm `DURIOS_OTP_API_KEY: "LIVE_KEY_01"`. Không có lần gọi mạng nào. Nếu đọc tín hiệu xanh này là "hệ thống sẵn sàng", nó gây hiểu lầm.

---

## 6. Phát hiện số 4: Bước 3 không có test nào, và không thể gọi từ API

[plan.md:46](plans/company-blueprint/plan.md:46) gán nhãn Bước 3 (Agentic OS & HITL Governance) là `[Đã kiểm thử tổng hợp]` và trích `test/tri-tuple-persona-rbac.test.ts` làm bằng chứng. Thực tế:
- Không có test nào import `hitl-service.ts`.
- Test được trích chỉ import `rbac-policy`, không chạm HITL.
- Không có route HTTP nào gọi `hitlService`.

Nhãn đúng theo tự bảng chú giải của chính plan.md ([plan.md:13-18](plans/company-blueprint/plan.md:13)) là `[Đã có code]`. Quan trọng hơn nhãn: **luật "AI không được tự phê duyệt xuất khẩu" đang được thực thi ở tầng workspace nhưng không thể kiểm chứng từ bề mặt API**, nên không có cách nào chứng minh nó hoạt động trong một phiên làm việc thật.

---

## 6b. 🟠 Phát hiện số 5: Khóa giấy phép của hai vựa khác nhau có thể giống nhau từng byte

**Đây là lỗi kiến trúc cụ thể, được chứng minh bằng cách chạy mã, không phải suy đoán.**

Chữ ký Ed25519 là **xác định (deterministic)** — cùng khóa riêng + cùng dữ liệu đầu vào luôn cho ra cùng một chữ ký. Nhưng payload giấy phép hiện tại không chứa bất kỳ yếu tố duy nhất theo từng vựa:

```ts
// src/saas/saas-tier-policy.ts:6
export interface SaasLicensePayload { readonly tenantId: string; readonly edition: ...; readonly expiresAt: string; }
// src/saas/saas-tier-policy.ts:24
const body = `${payload.edition}|${payload.tenantId}|${payload.expiresAt}`;
```

Không có nonce, không có `issuedAt`. Vậy nên hai vựa có cùng gói quyền và cùng ngày hết hạn sẽ nhận **cùng một chuỗi khóa**.

Tôi đã chạy thử trên chính kho mã:

```
key1 === key2 : true      (cả hai dài 165 ký tự)
```

**Hệ quả thực tế:** (a) khóa của vựa A hoạt động ở vựa B — ranh giới thương mại bị xóa; (b) không thể thu hồi khóa của *một* vựa, vì thu hồi một là thu hồi cả hai; (c) không thể phân biệt hai vựa trong nhật ký kiểm toán viên chỉ bằng khóa.

**Cách sửa:** thêm nonce duy nhất theo vựa và `issuedAt` vào payload trước khi ký (`saas-tier-policy.ts:24`). Đây là thay đổi schema nhỏ, nhưng phải làm trước khi bán khóa thật cho vựa thứ hai.

**Hệ quả thứ hai liên quan tới thu hồi:** `downgradeToCommunity()` chỉ xử lý trường hợp khóa *sai định dạng* hoặc thiếu khóa công khai. Một khóa **vẫn hợp lệ về chữ ký** nhưng nhà cung cấp muốn thu hồi thì không có cách nào chặn khi vựa đang chạy ngoại tuyến. Cần hoặc (1) hạn ngắn + cấp lại định kỳ, hoặc (2) danh sách thu hồi có chữ ký mà vựa phải áp dụng, hoặc (3) chấp nhận khóa đã thu hồi vẫn chạy tới hạn.

## 6c. 🟡 Phát hiện số 6: AGPL là lựa chọn đúng, nhưng không phải là hàng rào bảo vệ

Từ góc độ duy nhất có nguồn ngoài, và đây là phần *có nguồn* đáng tin nhất trong báo cáo:

- **Không có án lệ AGPL nào tồn tại.** Software Freedom Conservancy không kiện trên cơ sở AGPL, và thực thi copyleft mất 3–15 năm. Vậy AGPL của DuriOS là **tài sản uy tín** ("dữ liệu của bạn ở lại máy bạn"), không phải hàng rào pháp lý.
- **Mọi vendor cần bảo vệ lõi rồi đều chuyển sang giấy phép nguồn-mở-thương-mại** — nhưng chính cú chuyển đó (không phải giấy phép gốc) mới tạo ra rủi ro fork và thù địch: HashiCorp 2023-08-10 sang BUSL 1.1, và OpenTofu ra đời như một fork dưới Linux Foundation.
- **60.000.000 VND/vựa/năm (~$2.321) nằm ở đầu cao của dải nông nghiệp nhưng vẫn hợp lý:** 3,9× mức per-farm cao nhất của Bushel ($599/năm), 0,70× mức vào của Croptracker ($3.300/năm), 0,15× mức Enterprise tối thiểu của Sourcegraph ($16.000/năm).
- **Lỗ hổng cấu trúc lớn nhất về kinh doanh:** SDK xác minh độc lập được cấp phép **MIT**, nghĩa là bên nhập khẩu nước ngoài *có thể xác minh mà không cần DuriOS*. Tầng 6 (thu tiền từ ngân hàng/bảo hiểm) nếu bán "xác minh" thì đang bán đúng thứ mà bản MIT cho miễn phí. Tầng 6 buộc phải bán thứ bản miễn phí không thể cung cấp: **chứng nhận bên phát hành, danh sách bên phát hành được công nhận, trạng thái thu hồi**.
- **Mẫu giá đáng copy nhất** là Mitti: "một giá mỗi site", "không giới hạn người dùng", giá theo báo giá — cùng hình dạng đơn vị kinh tế với DuriOS.

**Khuyến nghị cho Bước 18:** giữ AGPL-3.0, nhưng gỡ bỏ vai trò "hàng rào" của nó khỏi mọi tài liệu trình khách hàng; đồng thời chuyển ranh giới MIT/AGPL từ "quét import bằng tay" sang quy ước tên tệp cơ khí (kiểu `.ee` của n8n) để không phụ thuộc vào kỷ luật con người.

---

## 6d. 🟠 Phát hiện số 7: Chữ ký portability có thể bị bỏ qua im lặng, và audit ledger không chứng minh được "không thể sửa"

Hai lỗi kỹ thuật đến từ góc độ có nguồn ngoài thứ hai (kỹ thuật/vận hành), đã được tôi chạy lại trên mã.

**7a — Chữ ký HMAC bị bỏ qua khi không cấp secret** ([workspace-portability-bundle.ts:58](src/saas/workspace-portability-bundle.ts:58)):
```ts
if (portabilitySecret && bundle.hmacSignatureSha256) { /* kiểm tra */ }
return { valid: true };
```
Nếu secret không được cấp, hàm trả `valid: true` **mà không kiểm tra chữ ký**. Tôi đã chạy thử:

```
1) ký bằng secret thật, xác minh bằng secret kẻ tấn công  → false  ← chặn đúng
2) payload nguyên vẹn, KHÔNG cấp secret                    → true   ← không kiểm tra gì cả
3) cấp secret ngắn (<16 ký tự)                             → false
```

**Hiệu chỉnh quan trọng:** agent báo cáo khẳng định đầu tiên là "endpoint tin secret do client cung cấp nên bất kỳ ai cũng tự chứng thực cho payload của mình". Tôi đã phản biện bằng chạy mã: trường hợp 1 trả `false` — **không** thể tự chứng thực bằng secret khác. Nhưng [open-core-portability-handler.ts](src/server/open-core-portability-handler.ts) cũng chấp nhận `portabilitySecret` từ **thân request**, nên bản chất vẫn sai: chữ ký trở nên **tư vấn (advisory)**, không cưỡng chế. Đường thật bị lỗ hổng là trường hợp 2: người gọi **đã xác thực** (route yêu cầu `assertValidActor`) chỉ cần không gửi secret là nhận `valid: true` cho một bundle chưa hề được kiểm tra chữ ký. Đây là *hạ cấp im lặng*, không phải "giả mạo tự do" — nhưng nó phá vỡ chính giá trị của Bước 14 (funnel di cư workspace có chữ ký).

**7b — "Chống sửa" chỉ chống sửa một dòng** ([sqlite-audit-ledger.ts:5](src/storage/sqlite-audit-ledger.ts:5), `:68`):
`GENESIS_HASH` là **hằng số nằm cùng tệp với bộ xác minh**. Sửa *một* sự kiện sẽ bị phát hiện, nhưng kẻ tấn công có quyền ghi CSDL có thể **xây lại toàn bộ chuỗi** từ genesis do họ chọn và vẫn đạt. Chuỗi chỉ có ý nghĩa với một bên kiểm toán bên ngoài nếu hash cuối được neo (anchor) ở nơi kẻ tấn công không kiểm soát.

---

## 7. Các phát hiện còn lại

| Vấn đề | Chi tiết | Vị trí | Ưu tiên |
|---|---|---|---|
| 🟠 **Chính số liệu nền mâu thuẫn với chính nó** | Kim ngạch 8T/2026: `plan.md:39` ghi **1,95**, nhưng `VALIDATION-AND-ECONOMICS-V2.md:16` và `DURIOS-STRATEGY-V2.json:31` ghi **1,97** | hai con số cùng sống trong kho | **Cao** |
| 🟠 **427 vẫn còn trong JSON** | `DURIOS-STRATEGY-V2.json:40` ghi `sites_required_for_one_million_arr_saas_only: 427`, trong khi `plan.md:71` và `tasks.md:222` đã sửa đúng thành **428** | con số sai chưa được đồng bộ | **Cao** |
| 🟡 **5 số liệu thị trường chỉ tồn tại một nơi** | `DURIOS-STRATEGY-V2.json:30-36` mang `china_import_market_2024_usd: 6,99 tỷ`, `thailand_share: 57%`, `malaysia_packhouses: 52`, `vietnam_registered_puc_orchards: 1.599` — không nguồn trong kho, không xuất hiện ở tài liệu nào khác | nguồn độc nhất, không đối chiếu | Trung bình |
| 🟡 **`281` chưa rõ phạm vi** | Tài liệu khai "cơ sở đóng gói đang hoạt động", nhưng chưa rõ đây là số riêng sầu riêng hay tổng mọi cây ăn quả. Đây là nền của cả chuỗi suy luận $657.643 | plan.md:39, manifest:63 | **Cao** |
| 🟡 **`MOD-PRO-04` mô tả thứ không có** | Manifest khai "GACC Live Registry Watch" và "Real-time GACC **2,408-code** suspension monitor", nhưng JSON không hề có khẳng định registry GACC, và service thật chỉ xác thực URL *buyer portal*, không phải GACC | manifest:47-48 | Trung bình |
| 🟡 **4 corridor ASEAN mang ngưỡng pháp lý không rõ nguồn** | `maxCadmiumMgKg: 0,05`, `minTemperatureC: 12/13`, `minimumDryMatterPct: 32`, `statutoryFramework` cho `VN/MY/TH/PH → GACC` đều là hằng số do người gõ vào registry TypeScript, không có nguồn trong kho | [asean-corridor-adapters.ts:28-63](src/rules/asean-corridor-adapters.ts:28) | **Cao** |
| 2 đường dẫn bằng chứng không tồn tại | `src/server/pilot-launch-gate-view.ts` (Bước 12), `src/server/pilot-kpi-evaluator.ts` (Bước 16, 22). File thật ở `src/auth/` | plan.md:124, plan.md:203 | Trung bình |
| 3 artifact chết trong production | `dense-cluster-readiness.ts`, `pilot-rehearsal-seeder.ts`, `verified-org-profile.ts` — không route nào gọi | — | Trung bình |
| Rate limit chỉ bảo vệ 1 endpoint | Đúng duy nhất `handleUploadDocument`, không phải toàn hệ thống như plan.md mô tả | [document-handlers.ts:16](src/server/document-handlers.ts:16) | Trung bình |
| KPI Bước 11 có fallback ngầm | `?? d.updatedAt` trái với tuyên bố "không suy đoán dữ liệu" | [pilot-kpi-evaluator.ts:35](src/auth/pilot-kpi-evaluator.ts:35) | Thấp |
| `expectedLossAvoidedVnd` là ước tính phạm vi bị mã hóa thành số đơn | Code chọn `35.000.000` trong khoảng "20–50 triệu" rồi nhân trực tiếp vào báo cáo cho chủ vựa | [pilot-kpi-extended-types.ts:15,47](src/auth/pilot-kpi-extended-types.ts:15) | Trung bình |

**Lưu ý pháp lý (không xác nhận được từ bên ngoài):** Bước 23 trích hai nghị định — `52/2024/NĐ-CP` (thanh toán không dùng tiền mặt) và `248/2026/NĐ-CP` (thương mại điện tử) — cùng Luật `122/2025/QH15`. Audit nội bộ coi đây là mâu thuẫn; **tôi đã đọc lại và đây là hai căn cứ khác nhau, liệt kê riêng** trong [pilot-dossier-pack-compiler.ts:15-16](src/export/pilot-dossier-pack-compiler.ts:15). Không phải mã tự mâu thuẫn. **Nhưng cả bốn văn bản này đều chưa được xác minh với nguồn chính thức**, và chúng đang là căn cứ của một tuyên bố tuân thủ trình ra khách hàng. Cần Pháp chế đối chiếu.

---

## 8. 🎯 Việc cần làm để củng cố kiến trúc (xếp theo rủi ro)

**Trước khi nạp bất kỳ dữ liệu khách hàng thật nào:**
1. Sửa **GATE-01** để đọc và kiểm tra nội dung biên bản chấp thuận, không chỉ `existsSync`.
2. Sửa **GATE-02** để chứng minh gửi-nhận OTP thật với provider stub, thay vì placeholder.
3. Gỡ bỏ assertion `goForLiveCustomerData: true` trong test khi nó dựa trên credential giả — nó đang phát tín hiệu xanh gây hiểu lầm.
4. **Bắt chữ ký portability phải thực sự được kiểm tra** — hiện không cấp secret là `valid: true`. Cần fail-closed khi thiếu secret, và bỏ việc nhận `portabilitySecret` từ thân request (§6d/7a).

**Để nền kinh tế khớp với kiến trúc (khẩn cấp nhất về chiến lược):**
5. Làm một bản định nghĩa **duy nhất** cho đống doanh thu đa lớp, và bắt manifest đọc từ đó thay vì nhân bản.
6. Thay `multiRevenueStackRequired` (cờ boolean) bằng kiểm tra thật: mỗi tầng phải có mô hình kinh tế, ngưỡng mở, và trạng thái bằng chứng.
7. Vì trần nội địa là $657.643, **phải chốt lớp thay thế có số liệu nào là bến đỗ cho $1M ARR** — ASEAN (Thái Lan/Malaysia) hay take-rate giao dịch. Hiện cả hai đều `[Mục tiêu]` / `[Đang chờ điều kiện]`.

**Sửa nhãn và đường dẫn (thấp rủi nhưng nên làm ngay):**
8. **Thêm nonce theo vựa và `issuedAt` vào payload khóa giấy phép** trước khi bán khóa cho vựa thứ hai (§6b). Đây là lỗi đã được chứng minh bằng chạy mã.
9. Gán lại nhãn Bước 3 thành `[Đã có code]`, và thêm test thật cho `verifyOrCorrectField` / `areAllFieldsVerified`.
10. Sửa 2 đường dẫn bằng chứng sai ở plan.md:124 và plan.md:203.
11. **Đồng bộ số liệu nền** — kho hiện có **1,95** (`plan.md:39`) vs **1,97** (`VALIDATION-AND-ECONOMICS-V2.md:16`, `DURIOS-STRATEGY-V2.json:31`), và **427** (`DURIOS-STRATEGY-V2.json:40`) vs **428** (`plan.md:71`). Mỗi nguồn chọn một con số.
12. Gỡ hoặc nguồn hóa **3 số chỉ tồn tại trong JSON** (`china_import_market_2024_usd`, `thailand_share_pct`, `malaysia_packhouses`) — chúng không có nguồn trong kho và không xuất hiện ở tài liệu nào khác.
13. **Gỡ khỏi `MOD-PRO-04` những gì nó mô tả nhưng không làm** — manifest khai "Real-time GACC 2,408-code suspension monitor", nhưng service không hề chạm registry GACC. Nếu đây là tầm nhìn, nó phải mang nhãn `[Mục tiêu]`, không phải mô tả tính năng đang có.
14. **Nguồn hóa 4 corridor ASEAN** — mọi ngưỡng pháp lý gõ tay (`cadmium 0,05`, `12–15°C`, `dry matter 32%`, mã cơ quan `PPD-VN`/`DOA-MY`/`DOA-TH`/`BPI-PH`) phải có trích dẫn, hoặc bị đổi tên ra khỏi `AseanCorridorProtocolSpec` sang một interface mang tên "ước tính thực hành".

---

## 9. ❓ Câu hỏi cần một người có internet kiểm chứng

Những khẳng định này đang được dự án coi là đúng nhưng **không thể xác minh trong phiên này**. Nếu để nguyên không kiểm chứng, kiến trúc đang dựa trên nền chưa thử thách.

**Kinh tế & thị trường**
1. VN có đúng **281 cơ sở đóng gói sầu riêng đang hoạt động** không — và đây là số **riêng sầu riêng** hay **tổng mọi cây ăn quả**? Nguồn Bộ NN&MTNT nào, ngày nào? *(Nếu sai, toàn bộ phép tính $657.643 sụp.)*
2. Kim ngạch 8T/2026 trong kho có hai con số — **1,95** (`plan.md:39`) và **1,97** (`VALIDATION-AND-ECONOMICS-V2.md:16`, `DURIOS-STRATEGY-V2.json:31`). Con số nào là đúng?
3. **Con số nào trong JSON là đúng?** `china_import_market_2024_usd: 6,99 tỷ`, `thailand_share_of_china_imports_2024_pct: 57`, `malaysia_approved_fresh_durian_packhouses_2025: 52` — ba con số này không có nguồn trong kho và không xuất hiện ở tài liệu nào khác.
2. Mức **60.000.000 VND/vựa/năm** có nằm trong khoảng giá thật của phần mềm quản lý chất lượng/truy xuất nguồn gốc cho nông sản VN không?
3. Kim ngạch xuất khẩu sầu riêng **3,85 tỷ USD (2025)** và **Trung Quốc chiếm >95%** từ nguồn nào? *(Con số 8T/2026 đã xử lý ở mục 2 phía trên.)*
4. Có đối thủ tên thật nào (vendor VN, phần mềm khai hải quan TQ, dịch vụ làm chứng từ) đang phục vụ phân khúc này, và họ thu bao nhiêu?
5. Mức **60.000.000 VND/vựa/năm** có nằm trong khoảng giá thật của phần mềm quản lý chất lượng/truy xuất nguồn gốc cho nông sản VN không? *(Góc ngoài đã xác nhận nó ở đầu cao của dải quốc tế, nhưng **không** có nguồn nào về khả năng chi trả của chủ vựa Việt.)*

**Quy định (ưu tiên cao nhất — 4 corridor ASEAN đang dựa trên ngưỡng gõ tay)**
10. Nghị định **52/2024/NĐ-CP** có đúng là văn bản về thanh toán không dùng tiền mặt, và có phải là căn cứ phù hợp cho quy tắc zero-custody không?
11. Nghị định **248/2026/NĐ-CP** có tồn tại, có hiệu lực 2026-07-01, và có liên quan đến Luật TMĐT 122/2025/QH15 không?
12. Luật **91/2025/QH15** (bảo vệ dữ liệu cá nhân) có hiệu lực 2026-01-01 như kho mã khai?
13. Ngưỡng **cadmium ≤ 0,05 mg/kg (GB 2762-2022)** và **nhiệt độ 12–15°C** mà code mã hóa thành ràng buộc fail-closed có phải là quy định thật trong nghị định thư VN–TQ không?
14. **TAS 3-2013** của Thái Lan có thực sự quy định **độ khô ≥ 32%** không, hay corridor `TH_CN` đang dựa trên một ngưỡng không tồn tại?
15. Yêu cầu đăng ký GACC cho vựa/cây ăn quả VN xuất sầu riêng tươi hiện hành là gì, chu kỳ tái kiểm tra kéo dài bao lâu?
16. Bộ **3 chứng từ bắt buộc** (`PACKING_LIST`, `LAB_TEST_REPORT`, `PHYTOSANITARY_CERTIFICATE`) có đủ cho cả 4 corridor không, hay mỗi nước cần thêm (CO, kiểm dịch riêng)?
17. Có thống kê công bố nào về container bị từ chối/trả hàng cho sầu riêng VN ở cửa khẩu TQ năm 2025–2026?

**Mô hình & kỹ thuật**
18. Mô hình local-core + opt-in federation có tiền lệ thật trong phần mềm B2B bị quản chế (supply chain, y tế, tài chính) không? Họ xử lý cold-start và danh tính tin cậy thế nào? *(Góc ngoài đã trả lời một phần: W3C DID/VC 2.0 có tiền lệ kiến trúc, nhưng **không** giải quyết cold-start — bản thân đặc tả nói rõ "xác minh được không có nghĩa là các tuyên bố bên trong là đúng".)*
19. Tỷ lệ chuyển đổi open-source → paid cho sản phẩm open-core vertical đã được công bố bao giờ?
20. Mức chính xác đã công bố (2025–2026) cho trích xuất trường có cấu trúc từ chứng từ/biên lai bằng LLM/OCR là bao nhiêu? Mức sai lệch nào được chấp nhận trong hồ sơ bị quản chế?
21. **SDK xác minh MIT đang "ăn mòn" Tầng 6 như thế nào?** Nếu bên nhập khẩu nước ngoài xác minh miễn phí, Tầng 6 phải bán gì — chứng nhận bên phát hành, danh sách bên phát hành được công nhận, hay trạng thái thu hồi? *(Cần quyết định kiến trúc, không chỉ giá cả.)*

---

## 10. Những điều KHÔNG nên kết luận từ báo cáo này

- Báo cáo này **không** nói ý tưởng 25 bước là xấu — 25/25 artifact có code thật là kết quả thật.
- Báo cáo này **không** xác nhận hay bác bỏ bất kỳ yếu tố thị trường, quy định, hay đối thủ nào.
- Con số 25/25 **không** phải là đánh giá thực thi, và báo cáo này không dùng nó như vậy.

---

## Trạng thái

**Phương pháp:** audit nội bộ đọc trực tiếp 25 artifact + đối chiếu từng tuyên bố trong plan.md/tasks.md với mã nguồn, mọi kết luận đã được tôi chạy lại độc lập bằng lệnh trên chính kho mã. 5 góc độ nghiên cứu bên ngoài không thực hiện được do mạng bị chặn hoàn toàn — xem khối TRẠNG THÁI NGUỒN ở đầu.

**Chưa làm:** mọi mục trong §9 (cần internet); chưa sửa bất kỳ tệp mã hay tài liệu hiện hữu nào. Báo cáo này chỉ đọc và đề xuất.

**Câu hỏi mở cho Founder:** (1) Ai chịu trách nhiệm xác minh 4 văn bản pháp lý ở §9 với nguồn chính thức — bạn, hay Pháp chế? (2) Lớp thay thế cho $1M ARR nên là ASEAN hay take-rate giao dịch, để tôi biết ưu tiên củng cố kiến trúc theo hướng nào?
