# DuriOS — Chiến dịch prompt cho Claude Code

Tài liệu này là bộ lệnh thực thi theo cổng duyệt. Chạy từng prompt theo đúng thứ tự; Claude Code phải dừng ở cuối mỗi prompt và chờ founder xác nhận trước khi sang chặng kế tiếp. Mở Claude Code tại repo được chỉ định trong prompt. Repo lõi là `/Users/macbook/durios`; repo demo là `/Users/macbook/durios-frontend-demo`.

## Hợp đồng chung

### Nguồn sự thật và trạng thái repo

- `durios` là repo lõi, nguồn sự thật cho sản phẩm, quy tắc nghiệp vụ, API và dữ liệu.
- `durios-frontend-demo` chỉ là demo trình bày; dữ liệu và luồng mô phỏng không được coi là nghiệp vụ thật hoặc đưa ngược vào core.
- Cả hai repo đang có thay đổi chưa commit, gồm cả file mới chưa được Git theo dõi. Trước mỗi chặng, đọc `git status` và diff của đúng repo. Không reset, checkout, clean, stash, xóa, ghi đè hoặc hoàn tác thay đổi có sẵn. Có thể xây tiếp trên thay đổi hiện tại khi quan hệ rõ ràng; nếu xung đột không thể giải quyết an toàn, dừng và báo chính xác file cùng nội dung xung đột.
- Không commit, push, deploy, gọi dịch vụ thật, tạo giao dịch thật hoặc đưa dữ liệu thật vào demo.
- Báo cáo phải tách bạch: **đã có trong code**, **chỉ có trong demo**, **được ghi trong tài liệu nhưng chưa xác minh**, **mâu thuẫn/lỗi thời**, **chưa có**. Mọi nhận định về repo phải dẫn đường dẫn file và dòng nếu xác định được.
- Không xem tài liệu freeze, kế hoạch, wireframe hoặc báo cáo nghiên cứu là bằng chứng code đã có. Giữ chúng làm lịch sử; tạo tài liệu định hướng mới có ngày và liên kết tới tài liệu được thay thế về mặt định hướng.

### Quyết định sản phẩm đã chốt

- Đối tượng: nhà vườn/HTX, packhouse/exporter và buyer.
- Thị trường mục tiêu: Việt Nam và Trung Quốc. Quy định thị trường phải được xác minh từ nguồn chính thức hiện hành; nếu Claude không truy cập được nguồn, ghi thành câu hỏi mở, không khẳng định tuân thủ.
- Ba năng lực sản phẩm theo lộ trình: hộ chiếu truy xuất lô từ vườn tới container; lưu bằng chứng chuyển đổi/chứng nhận hữu cơ do đơn vị chứng nhận độc lập cấp; marketplace B2B kết nối buyer-seller và điều phối đơn/thanh toán.
- DuriOS điều phối danh tính, quy trình, quyền truy cập, bằng chứng và matching; không sở hữu sầu riêng, tồn kho hoặc tiền giao dịch. Hợp đồng mua bán hàng hóa vẫn thuộc buyer và seller. Thanh toán dùng đối tác được cấp phép; DuriOS không giữ tiền.
- Mỗi tổ chức giữ quyền với dữ liệu mình tạo. Chia sẻ phải giới hạn theo tổ chức, lô, vai trò và mục đích; buyer chỉ xem bằng chứng được cấp quyền. Không mặc định chia sẻ giá mua, danh sách khách hàng hoặc dữ liệu nhạy cảm.
- DuriOS quản lý bằng chứng hữu cơ, không tự kết luận hoặc cấp chứng nhận hữu cơ.
- Doanh thu mục tiêu ban đầu từ packhouse/exporter và buyer; nhà vườn/HTX có gói cơ bản miễn phí.
- Rollout: demo cục bộ với dữ liệu giả → pilot kín đa tổ chức → marketplace công khai. Hồ sơ lô/container hiện có là điểm khởi đầu kỹ thuật; cả ba năng lực vẫn thuộc định hướng sản phẩm.
- Đặc tả và kiến trúc phải được founder duyệt trước khi Claude Code sửa source code.

---

## Prompt 1 — Đối chiếu repo, chỉ đọc source

**Chạy tại:** repo `durios`. Claude cần đọc được cả hai đường dẫn repo ở trên.

~~~~text
Đọc phần “Hợp đồng chung” trong /Users/macbook/durios/docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md rồi thực hiện chặng đối chiếu repo.

Chỉ khảo sát hai repo:
- Core: /Users/macbook/durios
- Demo: /Users/macbook/durios-frontend-demo

Trước tiên, ghi nhận git status và các diff hiện có ở cả hai repo. Không sửa source code, test, cấu hình hay tài liệu hiện có. Chỉ được tạo báo cáo mới tại:
/Users/macbook/durios/docs/product-direction/REPO-CROSSWALK.md
Nếu file đích đã tồn tại, không ghi đè; hãy dừng và báo đường dẫn xung đột.

Trong báo cáo:
1. Mô tả entrypoint, stack, các luồng nghiệp vụ, mô hình dữ liệu, API, lưu trữ, phân quyền và tests thực sự có trong mỗi repo.
2. Lập bảng đối chiếu năng lực: truy xuất lô/container, dữ liệu nhà vườn/HTX, bằng chứng hữu cơ, matching/đơn hàng/thanh toán, multi-tenant, quyền dữ liệu, audit/export.
3. Gắn nhãn từng nhận định: đã có trong code / chỉ có trong demo / chỉ được đề xuất trong tài liệu / mâu thuẫn hoặc lỗi thời / chưa có.
4. Đối chiếu tài liệu freeze và discovery với trạng thái code hiện tại; nêu rõ quyết định sản phẩm mới của founder thay đổi định hướng nào nhưng không xóa lịch sử.
5. Liệt kê rủi ro và câu hỏi cần giải quyết trước pilot, đặc biệt xác thực actor phía server, cô lập dữ liệu tổ chức, quyền export/validation, chia sẻ bằng chứng và giới hạn xử lý tiền.
6. Ghi rõ các thay đổi chưa commit để chặng sau tránh ghi đè.

Không đề xuất sửa code ở chặng này. Kết thúc bằng danh sách sự thật đã xác minh, giả định, câu hỏi mở và xác nhận rằng không có source code nào bị sửa.
~~~~

**Cổng:** founder đọc và chấp nhận báo cáo đối chiếu trước khi chạy Prompt 2.

## Prompt 2 — Viết PRD, chưa thiết kế chi tiết kỹ thuật

**Chạy tại:** repo `durios`, sau khi founder chấp nhận Prompt 1.

~~~~text
Đọc Hợp đồng chung và REPO-CROSSWALK.md trong /Users/macbook/durios/docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md và /Users/macbook/durios/docs/product-direction/REPO-CROSSWALK.md.

Tạo PRD mới tại:
/Users/macbook/durios/docs/product-direction/PRODUCT-PRD-V1.md

Không sửa source code, test, PRD cũ, tài liệu freeze hoặc tài liệu khảo sát. Nếu file đích đã tồn tại, không ghi đè; dừng và báo. Tài liệu phải đánh dấu đây là định hướng sản phẩm mới của founder, đồng thời giữ các tài liệu cũ như bằng chứng lịch sử.

PRD cần đủ để founder duyệt phạm vi sản phẩm, gồm:
- Vấn đề, outcome, người dùng và bên mua/trả phí cho nhà vườn/HTX, packhouse/exporter và buyer.
- Ba năng lực: hộ chiếu lô/container; hồ sơ bằng chứng hữu cơ/chuyển đổi do bên chứng nhận độc lập xác nhận; B2B matching/điều phối đơn và thanh toán qua đối tác được cấp phép.
- Các hành trình chính, ranh giới trách nhiệm giữa các bên, quyền dữ liệu theo bên tạo, quyền xem/chia sẻ theo tổ chức-lô-vai trò-mục đích, và cách thu hồi quyền.
- Ranh giới tài sản: DuriOS không sở hữu hàng, tồn kho, hợp đồng hàng hóa hoặc tiền; không cấp chứng nhận hữu cơ.
- Phạm vi Việt Nam và Trung Quốc; mọi yêu cầu pháp lý/chứng từ chưa xác minh phải ghi là câu hỏi, kèm nguồn chính thức và ngày kiểm tra nếu đã tra cứu.
- Rollout theo ba cổng: demo dữ liệu giả, pilot kín đa tổ chức, marketplace công khai. Dùng hồ sơ lô/container làm điểm khởi đầu, nhưng không loại bỏ hai năng lực còn lại khỏi roadmap.
- Mô hình doanh thu ban đầu, chỉ số thành công có thể đo, giả thuyết cần kiểm chứng, non-goals, rủi ro và tiêu chí dừng/tiếp tục.

Không tự đặt số liệu thị trường, tỷ lệ chuyển đổi hoặc mục tiêu KPI như sự thật. Nếu cần ngưỡng mục tiêu, đánh dấu “đề xuất cần founder duyệt” và tách khỏi baseline chưa có.

Kết thúc bằng bảng “Founder decisions locked / Open questions / Assumptions”. Không bắt đầu kiến trúc hoặc code. Tóm tắt thay đổi và dừng chờ founder duyệt PRD.
~~~~

**Cổng:** chỉ chạy Prompt 3 sau khi founder xác nhận PRD được duyệt hoặc cung cấp các chỉnh sửa cụ thể.

## Prompt 3 — Kiến trúc, API và roadmap; chưa code

**Chạy tại:** repo `durios`, sau khi PRD được duyệt.

~~~~text
Chỉ bắt đầu nếu PRODUCT-PRD-V1.md đã được founder duyệt. Đọc Hợp đồng chung, REPO-CROSSWALK.md, PRODUCT-PRD-V1.md và source hiện hành của cả hai repo. Nếu chưa có xác nhận duyệt PRD, dừng và hỏi đúng phần còn thiếu.

Tạo tài liệu mới tại:
/Users/macbook/durios/docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md

Không sửa source code, tests, schema, tài liệu cũ hoặc demo. Không ghi đè file đích đã tồn tại.

Đặc tả ở mức đủ để triển khai, không khóa vào công nghệ chưa cần thiết:
1. Sơ đồ thành phần và ranh giới core/demo; luồng dữ liệu từ vườn/HTX qua packhouse tới buyer.
2. Tổ chức, actor, vai trò và quyền; mô hình cô lập tenant; quyền sở hữu dữ liệu theo bên tạo; cấp/thu hồi quyền chia sẻ theo lô và mục đích.
3. Các hợp đồng/API chính cho dossier/lot lineage, evidence/certification, audit/export và marketplace/order/payment coordination. Ghi versioning, lỗi và idempotency cần thiết; chưa tạo code hoặc migration.
4. Lưu trữ tài liệu, lineage, tính toàn vẹn/audit, xử lý file nhạy cảm và các rủi ro bảo mật.
5. Offline/local-first và đồng bộ chỉ khi được repo hoặc PRD chứng minh cần thiết; nêu trade-off, không mặc định xây federation/blockchain/AI/OCR.
6. Bản đồ khoảng cách từ kiến trúc tới code hiện tại; lộ trình theo demo giả → pilot kín → marketplace công khai; dependencies, migration/compatibility và cổng nghiệm thu mỗi giai đoạn.
7. Xác minh các rủi ro server-side còn lại từ audit, gồm quyền actor khi export và validation trên dossier đã sealed; không dựa vào UI để bảo vệ API.
8. Test matrix cho phân quyền, tenant isolation, chia sẻ/thu hồi quyền, lineage/audit, evidence hữu cơ và payment boundary.

Phân biệt quyết định đã chốt, đề xuất cần duyệt và thông tin chưa biết. Không khẳng định đáp ứng luật Việt Nam/Trung Quốc khi thiếu nguồn chính thức hiện hành. Kết thúc bằng backlog theo thứ tự, tiêu chí nghiệm thu và các câu hỏi cần founder trả lời. Dừng chờ founder duyệt kiến trúc trước mọi thay đổi source code.
~~~~

**Cổng:** founder duyệt PRD và kiến trúc. Sau đó chạy từng prompt triển khai dưới đây, mỗi lần một prompt.

## Prompt 4A — Demo cục bộ bằng dữ liệu giả trong repo lõi

**Chạy tại:** repo `durios`.

~~~~text
Chỉ thực hiện giai đoạn demo cục bộ nếu PRODUCT-PRD-V1.md và PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md đã được founder duyệt. Đọc hai tài liệu, báo cáo crosswalk và git diff hiện có trước khi sửa.

Trong repo lõi, triển khai đúng vertical slice demo theo acceptance criteria đã duyệt. Dùng dữ liệu giả, không PII và không kết nối thanh toán/dịch vụ ngoài thật. Ưu tiên luồng dossier/lot hiện có; chỉ bổ sung bằng chứng hữu cơ dạng hồ sơ nguồn độc lập và marketplace dạng mô phỏng nếu được kiến trúc chấp thuận. Mọi màn hình và dữ liệu mô phỏng phải được nhận biết là demo; không được thể hiện DuriOS đã xác minh/cấp chứng nhận hữu cơ hoặc đã xử lý giao dịch thật.

Bảo toàn các thay đổi đang có. Nếu file cần sửa có diff chưa commit, đọc và tích hợp thay vì ghi đè; nếu không thể xác định ý định an toàn, dừng và nêu xung đột file cụ thể.

Sau khi làm: chạy các kiểm tra phù hợp có sẵn trong repo, không tự bịa lệnh; kiểm tra luồng tạo dossier, thêm tài liệu mẫu, xác minh, validation, phê duyệt và export. Báo cáo file đổi, hành vi hoàn thành, kết quả kiểm tra, giới hạn demo và việc chưa làm. Không commit/deploy; dừng chờ founder.
~~~~

## Prompt 4B — Demo trình bày ba năng lực bằng dữ liệu giả

**Chạy tại:** repo `/Users/macbook/durios-frontend-demo`.

~~~~text
Chỉ thực hiện sau khi PRD và kiến trúc đã được founder duyệt. Đọc Hợp đồng chung và tài liệu duyệt tại /Users/macbook/durios/docs/product-direction/. Đọc git status/diff của repo demo trước khi sửa.

Hoàn thiện demo trình bày ba hành trình: truy xuất lô/container; xem hồ sơ chứng nhận/chuyển đổi hữu cơ từ bên độc lập; buyer-seller matching và điều phối đơn. Chỉ dùng synthetic data. Nếu demo không kết nối core API thật, ghi rõ trong UI/tài liệu rằng đây là mô phỏng; không giả danh tích hợp backend, cơ quan quản lý, lab, nhà chứng nhận hay nhà cung cấp thanh toán.

Repo này chỉ sở hữu presentation/demo. Không chuyển business rules, dữ liệu chuẩn hoặc quyết định phân quyền thành nguồn sự thật tại đây; không sửa repo core. Bảo toàn thay đổi dở dang, tích hợp diff hiện có và dừng nếu xung đột không an toàn.

Chạy các kiểm tra có sẵn phù hợp, gồm typecheck/build hoặc browser checks nếu repo đã cấu hình. Báo cáo hành trình đã trình diễn, phần nào là mô phỏng, file đổi và kết quả kiểm tra. Không commit/deploy; dừng chờ founder.
~~~~

**Cổng:** founder duyệt demo tổng thể trước khi pilot. Demo không tự cấp quyền triển khai pilot.

## Prompt 5A — Pilot kín đa tổ chức trong repo lõi

**Chạy tại:** repo `durios`.

~~~~text
Chỉ thực hiện pilot khi founder đã duyệt PRD, kiến trúc và demo. Đọc tài liệu duyệt trong /Users/macbook/durios/docs/product-direction/ và đối chiếu trạng thái code hiện tại; không coi các báo cáo cũ là bằng chứng tính năng đã tồn tại.

Triển khai phần pilot kín theo backlog được duyệt: xác thực actor phía server, cô lập dữ liệu đa tổ chức, quyền theo vai trò/tổ chức/lô/mục đích, cấp và thu hồi quyền chia sẻ, audit/lineage và workflow dossier. Bổ sung quản lý bằng chứng chứng nhận hữu cơ từ bên cấp độc lập; DuriOS chỉ lưu nguồn, phạm vi, thời hạn và bằng chứng, không tự xác nhận trạng thái hữu cơ.

Kiểm tra và sửa các lỗ hổng server-side còn tồn tại, đặc biệt: API có chặn đúng quyền export không; có chặn re-validation dossier đã sealed không; có đường truy cập chéo tenant hoặc đọc bằng chứng chưa được cấp quyền không. Bảo vệ ở server/API, không chỉ ẩn hoặc disable nút UI.

Chỉ dùng tổ chức và hồ sơ pilot được phép; môi trường thử nghiệm. Không bật marketplace công khai, không giữ tiền, không xử lý thanh toán thật. Nếu có sandbox payment thì chỉ dùng theo thiết kế được duyệt và không dùng credential thật trong code.

Bảo toàn diff hiện tại. Bổ sung tests cho allow/deny, cross-tenant isolation, revoke access, audit, sealed dossier và export authorization; chạy tests/typecheck/build phù hợp đã có. Không commit, deploy hoặc nhập dữ liệu thật. Báo cáo rủi ro còn lại và dừng chờ founder.
~~~~

## Prompt 5B — Bản trình diễn pilot kín trong repo demo

**Chạy tại:** repo `/Users/macbook/durios-frontend-demo`.

~~~~text
Chỉ thực hiện sau khi pilot core đã được founder duyệt. Đọc PRD/kiến trúc và phần quyền đã triển khai trong repo lõi; đọc git diff hiện tại của repo demo.

Cập nhật presentation demo để minh họa trải nghiệm đa tổ chức bằng tài khoản và dữ liệu giả riêng biệt. Thể hiện rõ quyền nào đang xem, bằng chứng nào được chia sẻ và trường nào bị ẩn theo quyền. Không tạo dữ liệu thật hoặc tự giả lập rằng bảo mật demo tương đương bảo mật server.

Giữ repo này là demo, không thêm backend truth, không sửa core, không tuyên bố đã có pilot production. Bảo toàn diff chưa commit; nếu cần sửa file đang có thay đổi thì tích hợp an toàn hoặc dừng với báo cáo xung đột.

Chạy kiểm tra phù hợp có sẵn và báo cáo vai trò, hành trình, phần mô phỏng, giới hạn và kết quả. Không commit/deploy; dừng chờ founder.
~~~~

**Cổng:** chỉ mở rộng marketplace sau khi pilot kín đạt tiêu chí an toàn, vận hành và thương mại đã được founder duyệt.

## Prompt 6A — Marketplace B2B trong repo lõi

**Chạy tại:** repo `durios`.

~~~~text
Chỉ bắt đầu khi founder đã duyệt kết quả pilot và roadmap marketplace. Đọc kiến trúc, quyết định thị trường, giới hạn pháp lý đã xác minh và diff hiện tại.

Triển khai marketplace theo phạm vi được duyệt: buyer/seller discovery và matching; yêu cầu/chào hàng; điều phối trạng thái đơn và trao đổi bằng chứng. Hợp đồng hàng hóa vẫn giữa buyer và seller. DuriOS không sở hữu hàng, tồn kho hoặc tiền và không trở thành bên cấp chứng nhận.

Thanh toán chỉ qua nhà cung cấp được cấp phép, theo tích hợp đã duyệt; thiết kế trạng thái, idempotency và xử lý lỗi/callback để không tạo trạng thái đơn sai lệch. Không thu/giữ tiền, không dùng giao dịch thật, không lưu secret trong source. Nếu thiếu xác nhận pháp lý hoặc tích hợp provider, giữ luồng đó ở sandbox/disabled và ghi rõ blocker; không tự suy diễn.

Áp dụng quyền dữ liệu theo bên tạo và theo giao dịch; không công khai giá riêng, danh sách khách hàng hay hồ sơ lô nếu chưa được chủ dữ liệu cho phép. Giới hạn rollout theo thị trường/đối tác đã duyệt; mọi tuyên bố về quy định Việt Nam/Trung Quốc cần nguồn chính thức hiện hành.

Bảo toàn diff. Bổ sung và chạy tests cho matching, quyền truy cập, trạng thái đơn, lỗi/idempotency của provider sandbox và bảo đảm không có fund custody. Kiểm tra regressions dossier/evidence/export. Không public launch, commit hoặc deploy; báo cáo các cổng còn thiếu và dừng chờ founder.
~~~~

## Prompt 6B — Demo marketplace công khai bằng dữ liệu giả

**Chạy tại:** repo `/Users/macbook/durios-frontend-demo`.

~~~~text
Chỉ thực hiện sau khi founder duyệt phạm vi marketplace và core contract. Đọc Hợp đồng chung, PRD/kiến trúc đã duyệt và trạng thái repo demo.

Hoàn thiện demo marketplace cho buyer và seller tại Việt Nam/Trung Quốc bằng dữ liệu tổng hợp. Trình bày matching, yêu cầu/chào hàng, điều phối đơn và bằng chứng lô; thể hiện rõ trạng thái demo. Không tạo giao dịch thật, không giả lập tiền đã thanh toán, xác nhận chứng nhận, thông quan hoặc tích hợp chính thức.

Core repo vẫn là nguồn truth cho business/API contract. Không sửa core hoặc đưa synthetic data/rules vào hệ thống lõi. Bảo toàn diff chưa commit; chạy kiểm tra UI/browser responsive và các checks hiện có; báo cáo rõ phần mô phỏng cùng giới hạn. Không public, commit hoặc deploy; dừng chờ founder.
~~~~

## Checklist founder duyệt giữa các cổng

- Prompt 1: xác nhận crosswalk phản ánh đúng hai repo và thay đổi chưa commit.
- Prompt 2: duyệt personas, phạm vi ba năng lực, quyền dữ liệu, doanh thu, thị trường và KPI giả thuyết.
- Prompt 3: duyệt tenancy, API boundaries, bảo mật, rollout và backlog.
- Prompt 4A/4B: duyệt demo synthetic, không gây hiểu nhầm về tích hợp/chứng nhận/giao dịch thật.
- Prompt 5A/5B: duyệt bảo mật đa tổ chức, kiểm soát API server-side và giới hạn pilot.
- Prompt 6A/6B: duyệt điều kiện mở marketplace, provider thanh toán, quyền dữ liệu và điều kiện pháp lý đã xác minh.

**Quy tắc dừng chung:** mỗi prompt kết thúc bằng báo cáo và chờ founder. Không tự chạy prompt kế tiếp, không mở rộng scope và không biến bản demo thành triển khai production.
