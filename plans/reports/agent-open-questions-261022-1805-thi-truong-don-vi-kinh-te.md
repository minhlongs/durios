# Câu Hỏi Cần Kiểm Chứng — Góc Thị Trường & Đơn Vị Kinh Tế

**TRẠNG THÁI NGUỒN / SOURCE STATUS: KHÔNG CÓ NGUỒN NGOÀI — không có bằng chứng internet nào trong tài liệu này. Chỉ chứa danh sách câu hỏi cần kiểm chứng và bằng chứng nội bộ từ kho mã.**

**Ghi chép va chạm tệp (file collision):** Đường dẫn được giao — `plans/reports/agent-open-questions-261022-1701-thi-truong-don-vi-kinh-te.md` — đã bị một agent song song chiếm giữ trước, với một bản hoàn chỉnh 15 câu hỏi cho *cùng một góc* (ghi lúc 17:53, đã đúng định dạng). Bản đó KHÔNG bị ghi đè. Bản này được ghi ra đường dẫn riêng để không mất dữ liệu của agent kia. Hai bản có độ phủ lớn lặp lại do cùng một góc và cùng một kho mã; điểm khác biệt duy nhất có giá trị là **mục A4 bên dưới hiệu đính lại một phát hiện sai trong câu hỏi priority-cao của bản kia** (xem A4).

**Phạm vi góc nghiên cứu:** Số liệu thị trường sầu riêng (số lượng cơ sở đóng gói, mã vùng trồng, kim ngạch xuất khẩu, thị phần, tỷ giá) và đơn vị kinh tế kể cả các phép tính doanh thu dựa trên những số liệu đó. Bốn góc còn lại (quy định GACC/xuất khẩu, mô hình open-core/giấy phép, kiến trúc kỹ thuật/vận hành, GTM/mạng lưới/rui ro) thuộc agent khác.

---

## A. Câu hỏi cần kiểm chứng

### A1. Con số 281 cơ sở đóng gói có đúng phạm vi "đang hoạt động" không?

Câu hỏi đơn nhất: Tại họp báo Chính phủ thường kỳ tháng 8 ngày 03/09/2026, Bộ Nông nghiệp & Môi trường có công bố con số **281** là số cơ sở đóng gói sầu riêng **đang hoạt động** trên toàn quốc (không phải số đã cấp mã/đã đăng ký, và không phải tổng cơ sở đóng gói mọi loại cây ăn quả), đúng không?

- Cần kiểm tra thêm: 281 là số riêng của sầu riêng, hay là tổng số cơ sở đóng gói nhiều loại cây ăn quả mà sầu riêng chỉ chiếm một phần?
- Bằng chứng nội bộ: `plans/company-blueprint/tasks.md:213` khẳng định phạm vi; `plans/company-blueprint/plan.md:39` lặp lại; `src/saas/open-core-edition-manifest.ts:63` mã hóa `vietnamActivePackhouses: 281` như hằng số kiểu (không thể thay đổi vô tình); `docs/product-direction/DURIOS-STRATEGY-V2.json:28`.
- Rủi ro nếu bỏ qua: đây là con số nền của toàn bộ chuỗi suy luận "trần SaaS Việt Nam = $657.643 nên không thể đạt $1M ARR chỉ bằng thuê bao". Nếu 281 là số đã đăng ký hoặc là tổng mọi cây ăn quả, địa chỉ thị trường và kết luận kinh tế đều sai hướng.

### A2. Số liệu 8 tháng 2026 là 1,95 hay 1,97 tỷ USD?

Câu hỏi đơn nhất: Bộ Nông nghiệp & Môi trường tại cùng buổi họp báo 03/09/2026 công bố kim ngạch xuất khẩu sầu riêng **8 tháng đầu năm 2026** là **1,95 tỷ USD**, và con số 1,97 tỷ USD trong `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:16` và `docs/product-direction/DURIOS-STRATEGY-V2.json:31` là sai chính tả chưa được đồng bộ, đúng không?

- Cần kiểm tra thêm: con số đó là "ước tính" hay "tính toán cuối cùng", vì phép tính 8 tháng có thể chưa chốt.
- Bằng chứng nội bộ: commit `6ab5244` đã sửa 1,97 → 1,95 trong `plan.md`/`tasks.md`, lời giải thích "1,97 was a transcription error, confirmed against two independent same-day reports quoting the briefing". Ba nguồn trong kho vẫn không khớp: `plan.md:39` ghi 1,95; `VALIDATION-AND-ECONOMICS-V2.md:16` ghi 1,97; `DURIOS-STRATEGY-V2.json:31` là `vietnam_durian_export_8m_2026_usd: 1970000000`.
- Rủi ro nếu bỏ qua: con số sẽ được dùng ra ngoài (nhà đầu tư, đối tác ngân hàng) từ hai nguồn nội bộ khác nhau.

### A3. Thị phần Trung Quốc là "khoảng 95%" hay "trên 95%"?

Câu hỏi đơn nhất: Tại buổi họp báo 03/09/2026, Bộ dùng cụm từ **"chiếm khoảng 95%"** (khoảng), không dùng "trên 95%" hay "hơn 95%", đúng không?

- Bằng chứng nội bộ: commit `8208092` đã sửa "trên 95%" → "khoảng 95%" trong `plan.md` và "> 95%" → "~95%" trong `tasks.md`, lý do "over 95% overstated the source". Tuy nhiên `VALIDATION-AND-ECONOMICS-V2.md:16` vẫn ghi "Trung Quốc chiếm trên 95%".
- Ghi chú: đây là văn bản duy nhất trong kho mang nhãn `ECONOMIC_TRUTH_FIRST` (`VALIDATION-AND-ECONOMICS-V2.md:7`), nên bản chỉnh sửa của `8208092` chưa chạm tới tệp quan trọng nhất trong chuỗi bằng chứng.
- Rủi ro nếu bỏ qua: hai bộ commit riêng biệt (`6ab5244`, `8208092`) đã được thực hiện vì cùng mối quan tâm; nếu tệp nguồn vẫn giữ phát ngôn quá mức, kho mã sẽ mang một văn bản "nguồn sự thật kinh tế" mà chính nó đã được sửa ở nơi khác.

### A4. URL được trích dẫn có ssống trình tự ngày 03/09/2026 không?

Câu hỏi đơn nhất: Bài báo được trích dẫn duy nhất bằng liên kết — `https://baochinhphu.vn/hop-bao-chinh-phu-thuong-ky-thang-8-dai-dien-bo-cong-an-lam-ro-nhieu-van-de-duoc-quan-tam-102260903170016698.htm` — có thực sự là bài họp báo Chính phủ tháng 8 ngày 03/09/2026 có chứa cả sáu con số (281, 1.599, 3,85 tỷ USD, 1,95 tỷ USD, ~95%, 401/166), đúng không?

- Bằng chứng nội bộ: cùng một URL được trích hai lần — `plans/company-blueprint/tasks.md:213` và `plans/company-blueprint/plan.md:42`. Không có nguồn dự phòng nào được liệt kê ở bất kỳ đâu trong repo.
- Câu hỏi phụ: bài báo này có phải là bài gốc của Bộ NN&MT, hay là bài phóng sự tổng hợp của Báo Chính phủ đăng lại báo cáo của Bộ? Vì repo đang dẫn nguồn thứ nhất (Bộ NN&MT) nhưng trích dẫn nguồn thứ hai (báo của Văn phòng Chính phủ).
- Rủi ro nếu bỏ qua: nếu liên kết không chứa các con số này, toàn bộ mảng 281/1.599/3,85/1,95/95% hiện không còn trích dẫn nào; đó chính là nền cho mọi quyết định giá và chiến lược khu vực.

**Hiệu đính một phát hiện sai trong bản agent kia (quan trọng):** Bản tại đường dẫn `...-1701-...` xếp câu hỏi về URL này ở mức ưu tiên **"Cao"** với lập luận "đuôi mã của liên kết đọc là 03/09/**2022** nếu theo quy ước `1YYMMDD`". Lập luận đó **không đúng**. Đuôi mã là `102260903170016698`, gồm 18 chữ số. Tách từ ký tự thứ 4: `26|09|03|17|00|16698`, tức YY=26, MM=09, DD=03, giờ 17, phút 00 — hoàn toàn **khớp** với ngày 03/09/2026. Giả thuyết 2022 của bản kia còn tự mâu nhau: dưới chính quy ước `1YYMMDD` mà bản đó nêu, tách ra là `1|02|26|09`, tức là tháng `26` — không phải là một tháng hợp lệ, nên nó cũng không cho ra 03/09/2022. Vậy (i) chuỗi số thực tế ủng hộ ngày được khai báo, và (ii) không có cơ sở nào cho cảnh báo 2022. Người kiểm chứng không nên lãng phí thời gian truy đuổi một sai lệch không tồn tại; mấu chốt của câu hỏi vẫn là *nội dung* của trang có thực sự chứa sáu con số kia không (xem câu hỏi phụ trên), chứ không phải ngày gắn trong liên kết.

### A5. Bốn con số khác trong DURIOS-STRATEGY-V2.json có nguồn nào?

Câu hỏi đơn nhất: Bốn con số sau trong khối `market_facts_official_sep_2026` có nguồn đã công bố và ngày công bố xác định không: `china_import_market_2024_usd: 6990000000`, `thailand_share_of_china_imports_2024_pct: 57`, `malaysia_approved_fresh_durian_packhouses_2025: 52`, và `vietnam_durian_export_8m_2026_usd: 1970000000`?

- Chúng được đặt tên là `market_facts_official_sep_2026` nhưng không có nguồn nào được trích trong JSON.
- Bằng chứng nội bộ: `docs/product-direction/DURIOS-STRATEGY-V2.json:27-34`; `plans/company-blueprint/plan.md:186` lặp lại 6,99 tỷ USD / 57% / 52 và tự thừa nhận là "nguồn ngoài, được trích dẫn chứ không được kiểm chứng trong kho mã".
- Rủi ro nếu bỏ qua: các kỳ vọng địa chỉ thị trường Thái Lan/Malaysia đang không có cơ sở hiển thị. `STRATEGY-V2-BACKLOG.md:39` chọn Malaysia làm hành lang thứ hai và `plan.md:38` chọn Thái Lan có "57% thị phần" — nên các con số này trực tiếp dẫn dắt ưu tiên mở rộng, trong khi hiện chúng là các khẳng định không thể truy nguyên.

---

## B. Câu hỏi cần kiểm chứng (mô hình giá và mô hình doanh thu)

### B1. Mức giá 60.000.000 VND/năm có được chấp nhận ở thị trường Cai Lậy / Tiền Giang không?

Câu hỏi đơn nhất: Có chủ vựa sầu riêng thật ở vùng Đồng bằng sông Cửu Long nào chấp nhận trả **60 triệu VND/năm** cho phần mềm quản lý vựa, dựa trên ít nhất một cuộc khảo sát sẵn có hoặc mức giá niêm yết công khai tương đương, không?

- Bằng chứng nội bộ: `docs/product-direction/PRODUCT-PRD-V1.md:296` ghi ba mức giá **đều** là "giả thuyết cần kiểm chứng", chưa có mức giá nào được chốt là giá thương mại. `plans/company-blueprint/plan.md:76` (Hành động tiếp theo) dự định dùng 10 cuộc khảo sát thực địa ở Cai Lậy và Tiền Giang. `src/saas/open-core-edition-manifest.ts:66` mã hóa 60.000.000 như một hằng số.
- Rủi ro nếu bỏ qua: toàn bộ mô hình Bear/Base/Bull (`plan.md:254-262`) và mọi ngưỡng `$657.643 ARR` đều được nhân lên từ mức giá này. Nếu WTP thật thấp hơn, mô hình sai từ gốc chứ không chỉ sai ở tham số.

### B2. Mức tỷ giá 25.637 VND/USD nên ghi là "tham khảo NHNN" hay "giả định kế hoạch"?

Câu hỏi đơn nhất: 25.637 VND/USD có phải là tỷ giá **niêm yết chính thức** đã công bố của Ngân hàng Nhà nước Việt Nam vào một ngày xác định, không?

- Hệ quả phủ định: nếu đây chỉ là "giả định kế hoạch", thì mọi giá trị USD trong repo chỉ đúng tại mức giả định đó; phép tính trần doanh thu sẽ dịch chuyển theo tỷ giá thực.
- Bằng chứng nội bộ: hai tệp dùng hai cách ghi khác nhau về cùng một con số — `VALIDATION-AND-ECONOMICS-V2.md:7` ghi "tỷ giá tham khảo NHNN (~25.637 VND/USD)" và `:19` ghi "Tỷ giá Ngân hàng Nhà nước tham khảo: 25.637 VND / USD", trong khi `plans/company-blueprint/tasks.md:218` ghi "Giả định kế hoạch (không phải tỷ giá niêm yết chính thức)". Không có ngày nào được gắn với con số ở bất kỳ tệp nào.
- Chịu ảnh hưởng: `pureVietnamSaasCeilingUsd: 657_643` (`open-core-edition-manifest.ts:68`), `sites_required_for_one_million_arr_saas_only: 427` (`DURIOS-STRATEGY-V2.json:41`), và Bear/Base/Bull (`plan.md:258-260`).
- Rủi ro nếu bỏ qua: kỳ vọng địa chỉ doanh thu được dựa trên một tỷ giá có thể không phải tỷ giá niêm yết.

### B3. Vòng xoay 400 triệu USD Verified GMV có phải là bằng chứng, hay chỉ là giả thuyết?

Câu hỏi đơn nhất: Liệu DuriOS đã có bất kỳ bằng chứng công bố nào cho thấy một nền tảng phần mềm có thể điều phối ~10,4% kim ngạch xuất khẩu sầu riêng của Việt Nam (~400 triệu USD Verified GMV) với take rate 0,25%, không — hoặc có tiền lệ nào cho một nền tảng đạt ~10% thị phần điều phối giao dịch của một ngành xuất khẩu nông sản không?

- Tại sao cần hỏi: đây là một phát biểu dự báo về mức độ áp dụng chưa từng có, chứ không phải một phép toán.
- Bằng chứng nội bộ: `VALIDATION-AND-ECONOMICS-V2.md:40` trình bày con số này như một kỳ vọng, không phải một thí điểm; repo đang ở `STAGE_0_SINGLE_SITE_PROTOTYPE` (`DURIOS-STRATEGY-V2.json:19`).
- Rủi ro nếu bỏ qua: nếu được trình bày cho nhà đầu tư như một lập luận ("chỉ cần 10% là đạt mục tiêu"), nó là lập luận vòng không có bằng chứng áp dụng.

### B4. Một phần doanh thu "Transaction Take Rate 0,1–0,5%" có thực sự áp dụng được không?

Câu hỏi đơn nhất: Theo Nghị định 52/2024/NĐ-CP và Luật Thương mại điện tử 122/2025/QH15 (hai văn bản được ghi đúng trong repo), một nền tảng phần mềm không giữ tiền của khách hàng có thể thu take rate trên giao dịch nối mạng được không, và mức thu đó có thuộc phạm vi cần giấy phép trung gian thanh toán không?

- Bằng chứng nội bộ: `plans/company-blueprint/tasks.md:200-201` khẳng định "Zero-custody tuyệt đối" và "Sàn B2B và ký quỹ vẫn bị khóa" như một ràng buộc hiện hành; `src/saas/open-core-edition-manifest.ts:76` ghi một tầng doanh thu có tên "Zero-Custody Dual-Lock Trade Escrow Orchestration Fee".
- Rủi ro nếu bỏ qua: nếu take rate mâu thuẫn với ràng buộc đã khẳng định, tầng 5/6 của 8 tầng doanh thu không khả thi, làm cho cấu trúc "428 > 281 nên..." yếu đi chính xác ở điểm vốn dựa vào các tầng đó.

### B5. Hai đơn giá trong cùng một manifest cần có cách đối sánh.

Câu hỏi đơn nhất: `proAnnualPriceVnd` (60.000.000 VND/năm) và `perContainerPayGoVnd` (150.000 VND/container) trong cùng một `OpenCoreEconomicTruth` có cách đối sánh công bố nào để một khách hàng không thể có cùng quyền truy cập qua hai con đường với hai mức giá khác nhau không?

- Bằng chứng nội bộ: `src/saas/open-core-edition-manifest.ts:19-20,66-67` — cả hai là hằng số kiểu, nhưng không có tài liệu nào trong kho mô tả điểm hòa vốn giữa hai mô hình.
- Rủi ro nếu bỏ qua: hai đơn giá cùng tồn tại trong cùng một "economic truth" duy nhất mà `plan.md:40` xác định là nguồn dùng chung để tránh việc mỗi báo cáo tự nhập số. Nếu không đối sánh được, trần `$657.643` chỉ đúng ở một trong hai mô hình.

---

## C. Câu hỏi cần kiểm chứng (nhất quán nội bộ — kiểm được trong repo, cần quyết định)

### C1. 427 hay 428 cơ sở là đầu ra chính thức?

Câu hỏi đơn nhất: Số lượng vựa tối thiểu để đạt 1.000.000 USD ARR ở mức 60 triệu VND/năm, tỷ giá 25.637 là **428** (làm tròn lên) hay **427** (chia chính xác)? Cả hai hiện đang được dùng như đầu ra chính thức ở hai nơi khác nhau.

- Bằng chứng nội bộ — bốn vị trí, hai kết luận:
  - `plans/company-blueprint/plan.md:71`: "**428 vựa**" (kèm lập luận "không thể bán một phần vựa").
  - `plans/company-blueprint/tasks.md:222`: "**428 cơ sở**".
  - `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md:23`: "~**427 vựa**".
  - `docs/product-direction/DURIOS-STRATEGY-V2.json:41`: `sites_required_for_one_million_arr_saas_only: 427` và "**427 vựa** > 281 vựa thực tế".
- Trích dẫn chuỗi phủ định: `plans/reports/agent-audit-261022-1554-25-buoc-noi-bo.md:29` ghi nhận mâu thuẫn này là "Minor but real inconsistency." Hơn nữa `test/asean-corridor-and-verified-profile.test.ts:89` đang **assert con số 427** trong JSON — nên đổi JSON sang 428 sẽ làm hỏng một bài kiểm thử.
- Rủi ro nếu bỏ qua: kết luận 428 > 281 đúng trong cả hai trường hợp nên rủi ro tài chính bằng không, nhưng đây là số sẽ được đọc trước tiên trong mọi bài trình bày chiến lược. Cần khắc phục trước khi dùng số 427/428 ra bên ngoài.

### C2. Con số 1,97 tỷ USD cần được xoá ở mọi nơi.

Câu hỏi đơn nhất: Sau commit `6ab5244`, ai chịu trách nhiệm đồng bộ `VALIDATION-AND-ECONOMICS-V2.md:16` và `DURIOS-STRATEGY-V2.json:31`, trước khi bất kỳ con số 8 tháng nào được dùng ra bên ngoài?

- Rủi ro nếu bỏ qua: một bộ duy nhất trong kho giữ số đã được commit sửa đi là "transcription error".

### C3. Con số "trên 95%" cần nhất quán.

Câu hỏi đơn nhất: Sau commit `8208092`, ai đồng bộ `VALIDATION-AND-ECONOMICS-V2.md:16` (vẫn còn "trên 95%") với `plan.md`/`tasks.md` (đã là "~95%")?

- Rủi ro nếu bỏ qua: tương tự C2 — tệp mang nhãn `ECONOMIC_TRUTH_FIRST` là văn bản duy nhất trong kho vẫn giữ phát ngôn đã được sửa ở nơi khác.

### C4. Hai trường trong manifest là chết và cần quyết định.

Câu hỏi đơn nhất: `registeredVietnamDurianPackhouses` (`open-core-edition-manifest.ts:17`, giá trị 281) và `annualProSubscriptionVnd` (`:19`, giá trị 60.000.000) có nên bị xoá khỏi `OpenCoreEconomicTruth` không, khi chúng là bản trùng lặp của `vietnamActivePackhouses` và `proAnnualPriceVnd` và không được tham chiếu ở bất kỳ đâu ngoài định nghĩa?

- Bằng chứng nội bộ: grep toàn repo chỉ tìm thấy `open-core-edition-manifest.ts:17,19,64,66`; không có bài kiểm thử hay đoạn mã nào đọc hai trường này.
- Rủi ro nếu bỏ qua: hai con số trùng lặp dễ dẫn tới một nơi được cập nhật còn nơi khác không — chính xác là loại lỗi mà `plan.md:40` nói rằng việc mã hóa `economicTruth` được tạo ra để tránh.

---

## D. Câu hỏi cần kiểm chứng (khái niệm đơn vị)

### D1. 1.599 mã vùng trồng có phải là con số sầu riêng riêng không?

Câu hỏi đơn nhất: Tại buổi họp báo 03/09/2026, Bộ NN&MT công bố **1.599 mã số vùng trồng** là mã *dành cho sầu riêng xuất khẩu sang Trung Quốc* (không phải mã vùng trồng tất cả cây ăn quả), đúng không?

- Bằng chứng nội bộ: `plans/company-blueprint/tasks.md:212`; `DURIOS-STRATEGY-V2.json:29` đặt tên khóa JSON là `vietnam_registered_puc_orchards` trong phạm vi khối `market_facts_official_sep_2026`.
- Rủi ro nếu bỏ qua: nếu 1.599 bao gồm nhiều loại sản phẩm khác, bất kỳ suy luận nào về "thị trường vùng trồng sẵn có cho DuriOS" đều bị thổi phồng, làm sai lệch các quyết định mở rộng sản phẩm Stage 1.

### D2. 401 vùng trồng và 166 cơ sở đóng gói phê duyệt GACC có phải là con số mới trong kỳ không?

Câu hỏi đơn nhất: Con số "phê duyệt GACC" 401 vùng trồng và 166 cơ sở đóng gói là các phê duyệt **mới trong một kỳ báo cáo** hay là **tổng tích lũy**? Repo đang khẳng định chúng không được cộng vào 281/1.599.

- Bằng chứng nội bộ: `plans/company-blueprint/tasks.md:214` ghi "trích dẫn riêng, KHÔNG cộng dồn vào 281 và 1.599 (khác mốc tham chiếu và cách thức đếm)". Đây là quyết định xử lý đúng, nhưng cần xác minh ngữ nghĩa nguồn để khỏi bị nhầm về hướng.
- Rủi ro nếu bỏ qua: nếu chúng là tích lũy, lượng vùng/vựa khả thi cho DuriOS có thể khác biệt lớn, làm sai lệch thứ tự ưu tiên mở rộng.

### D3. "Vựa" và "cơ sở đóng gói" là cùng một đơn vị không?

Câu hỏi đơn nhất: Khi tính "281 × 60 triệu VND/năm", 281 cơ sở đóng gói mà Bộ công bố có bao gồm những cơ sở mà DuriOS có thể bán hàng được trong thực tế (có kho mã, quản lý, khối lượng đủ để biện minh cho phần mềm) không, hay là một đơn vị thống kê khác?

- Bằng chứng nội bộ: toàn bộ mô hình 657.643 USD ARR dựa trên đồng nhất 1:1 giữa "cơ sở đóng gói" và "vựa mục tiêu" (`tasks.md:221`, `plan.md:71`, `VALIDATION-AND-ECONOMICS-V2.md:20-21`).
- Rủi ro nếu bỏ qua: đây là ẩn số lớn nhất giấu trong phép nhân. Nếu một "cơ sở đóng gói" là một doanh nghiệp vận hành nhiều địa điểm, một cơ sở nhỏ không cần phần mềm, hoặc một cơ sở không xuất khẩu sang Trung Quốc, cả địa chỉ thị trường và kỳ vọng ARR đều lệch lên.

---

## E. Rủi ro nếu bỏ qua

| # | Nếu không kiểm chứng | Hậu quả |
|---|---|---|
| A1 | 281 là con số sai phạm vi (ví dụ: tất cả cơ sở đóng gói cây ăn quả, chỉ một phần là sầu riêng) | Toàn bộ bằng chứng "trần SaaS Việt Nam không thể đạt 1 triệu USD" sụp đổ. Đây là con số nền cho cả 8 tầng doanh thu và cho lựa chọn mở rộng ASEAN. |
| A2 | 1,95 tỷ USD là con số cuối cùng chứ không phải "ước tính" | Báo cáo thị trường ra bên ngoài có thể trích sai con số giữa hai văn bản nội bộ; nhà đầu tư hoặc đối tác ngân hàng sẽ phát hiện ra. |
| A3 | Bộ dùng cụm từ mạnh hơn "khoảng 95%" | Hai bộ git commit tách biệt (`6ab5244`, `8208092`) đã được tạo ra vì cùng mối quan tâm; nếu xử lý sai lần thứ ba, tệp `ECONOMIC_TRUTH_FIRST` sẽ không còn khớp với các tệp đã được chỉnh. |
| A4 | Liên kết không chứa sáu con số được khai báo | Toàn bộ mảng 281/1.599/3,85/1,95/95% hiện không có trích dẫn xác minh nào; tổ chức nhận bản kế hoạch có thể yêu cầu chứng minh nguồn ngay lập tức. *(Lưu ý: không phải vì vấn đề ngày trong đuôi mã — xem hiệu đính tại A4.)* |
| A5 | 4 con số trong `market_facts_official_sep_2026` không có nguồn | Các kỳ vọng địa chỉ thị trường Thái Lan/Malaysia được dùng để chọn hành lang mở rộng ưu tiên hiện không có cơ sở hiển thị. |
| B1 | Không có vựa nào trả 60 triệu VND | Toàn bộ mô hình ARR (Bear/Base/Bull) và mục tiêu $1M ARR được tính trên một mức giá ít khả năng được chấp nhận. |
| B2 | 25.637 được gán nhầm là tỷ giá NHNN | Mọi giá trị USD trong repo bị đặt sai địa chỉ nguồn; kỳ vọng địa chỉ doanh thu sẽ sai. |
| B3 | 400 triệu USD Verified GMV | Các kỳ vọng take-rate 0,25% được trình bày như một lập luận định lượng thay vì một dự báo mức độ áp dụng. |
| B4 | Zero-custody mâu thuẫn với transaction take rate | Nếu take rate mâu thuẫn với ràng buộc đã khẳng định (`tasks.md:200-201`), tầng 5/6 của 8 tầng doanh thu không khả thi, làm yếu chính xác ở điểm dựa vào các tầng đó. |
| B5 | Hai đơn giá không đối sánh được | Khách hàng có thể có cùng quyền truy cập qua hai con đường với hai mức giá khác nhau; trần `$657.643` chỉ đúng ở một trong hai. |
| C1 | 427 ↔ 428 | Mâu thuẫn đã được `agent-audit-261022-1554-25-buoc-noi-bo.md:29` ghi nhận; chỉ là sự rõ ràng, không ảnh hưởng vào kết luận (cả hai > 281). Nhưng cần khắc phục trước khi dùng số này ở tài liệu bên ngoài. |
| C2 | 1,97 không được đồng bộ | Số liệu thị trường sai được dùng trong tệp tự gọi là `ECONOMIC_TRUTH_FIRST`. |
| C3 | "trên 95%" không được đồng bộ | Tương tự C2 — một bộ duy nhất giữ phát ngôn đã được công bố là quá mức. |
| C4 | Trường chết dễ dẫn tới trùng lặp giá trị | Rủi ro nguồn sự thật kép, chính xác là thứ mà `plan.md:40` khẳng định là đang phòng chống. |
| D1 | 1.599 bao gồm nhiều loại, không chỉ sầu riêng | Địa chỉ thị trường vùng trồng bị thổi phồng; các quyết định mở rộng sản phẩm Stage 1 dựa trên địa chỉ rộng hơn thực tế. |
| D2 | 401/166 được hiểu sai là tích lũy | Nếu tích lũy, có thể nhân đôi lượng hồ sơ khả thi cho các vùng GACC mới; nếu không tích lũy, con số sai có thể dẫn tới lạc quan sai. |
| D3 | "Vựa" không ánh xạ 1:1 với "cơ sở đóng gói" | Địa chỉ thị trường 281 cao hơn mức thực, kỳ vọng ARR cao hơn mức thực, và các mô hình Bear/Base/Bull đều lệch lên. |

---

## F. Có gì bị giới hạn ở báo cáo này

- **Không có nguồn ngoài nào.** Không có câu trả lời nào cho bất kỳ câu hỏi A1–A5 hay B1–B4; chúng vẫn đang mở. Không có một liên kết, giá, thống kê, quy định hay tên công ty ngoài repo nào được nêu trong tài liệu này.
- **Không ghi đè tệp của agent song song.** Bản đầy đủ cho cùng góc này nằm tại `plans/reports/agent-open-questions-261022-1701-thi-truong-don-vi-kinh-te.md`; cả hai bản nên được xem là đầu vào của orchestrator, và phần giá trị duy nhất bản này thêm vào là hiệu đính URL ở **A4** và các trích dẫn `file:line` đã kiểm lại từng dòng.
- **Chưa kiểm lại chéo bằng toán.** Các phép tính nội bộ trong repo đã được kiểm lại bằng tay: 281 × 60.000.000 = 16,86 tỷ VND; 1.000.000 × 25.637 / 60.000.000 = 427,28; 180.000.000 / 25.637 = 7.021,1; 600.000.000 / 25.637 = 23.403,7; 2.400.000.000 / 25.637 = 93.614,7; 400.000.000 / 25.637 = 15.602,4; 93.615 / 1.000.000 = 9,3615%. Tất cả khớp với `plan.md`/`tasks.md`. Các phép tính nội bộ này **không** được liệt kê là câu hỏi — chỉ có khẳng định nguồn mới là câu hỏi.
- **Mọi trích dẫn `file:line` trong bản này đã được đối chiếu trực tiếp** với nội dung dòng tương ứng trong phiên chạy này.
- **Bốn góc còn lại** (GACC/quy định, open-core/giấy phép, kiến trúc kỹ thuật/vận hành, GTM/mạng lưới/ruiro) chưa được xem xét, nằm ngoài phạm vi góc thị trường & đơn vị kinh tế.

---

## G. Câu hỏi mở

1. Xác nhận rằng hai bản (bản `1701` của agent song song và bản `1805` này) đều nằm trong phạm vi chấp nhận được, và chọn cách xử lý merge: hợp nhất thành một bản duy nhất, hay giữ cả hai. Hiện cả hai đều ở đúng định dạng được yêu cầu nên không có bản nào bị lỗi.
2. Định hướng ưu tiên giữa xác minh nguồn thực địa (A1–A5) so với xác minh WTP thực (B1): nếu 60 triệu VND không được chấp nhận ở thực tế, việc xác minh 281 sẽ ít giá trị hơn.
3. Xác nhận xem A4 (hiệu đính giả thuyết URL năm 2022) có nên được chuyển cho agent đã tạo ra bản `1701` để họ tự sửa, hay do orchestrator xử lý trước khi hợp nhất.
