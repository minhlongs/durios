# Bản thiết kế doanh nghiệp DuriOS

**Ngày lập:** 2026-10-14  
**Giai đoạn:** Từ ý tưởng đến kiểm chứng mức độ phù hợp sản phẩm-thị trường  
**Thời hạn kế hoạch:** Sáu tháng, từ 2026-10-14 đến 2027-04-14  
**Căn cứ:** Định hướng sản phẩm đã được duyệt và các cổng khai trương pilot tại một địa điểm trong `docs/product-direction/` và `docs/pilot-readiness/` được ưu tiên áp dụng so với các bản kiểm toán cũ hơn.  
**Quan điểm ra quyết định:** Đã có ý tưởng sản phẩm và nguyên mẫu; khả năng tiếp cận khách hàng, mức sẵn sàng chi trả, giá trị có thể lặp lại và hiệu quả kinh tế vận hành vẫn chưa được chứng minh. Mọi mức giá và mục tiêu tăng trưởng dưới đây là giả thuyết cho đến khi có bằng chứng từ khách hàng.

## 1. Khung tổng thể — Kinh doanh / Tác nhân AI / Quản trị

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Bắt đầu từ quy trình của vựa để đối soát chứng từ container trước khi xuất hàng. Chỉ mở rộng sang bằng chứng lô hàng và trao đổi với bên mua khi đã qua các cổng được duyệt. | Dùng phép kiểm tra tất định cho các trường dữ liệu đã xác định; con người chịu trách nhiệm diễn giải chứng từ, xác nhận trường dữ liệu, phê duyệt và đánh giá quy định. | Ranh giới vận hành được xác định bằng dữ liệu tách biệt theo tổ chức, chia sẻ có chấp thuận, lịch sử giúp phát hiện can thiệp, nội dung khuyến cáo rõ ràng và năm cổng khai trương. |

## 2. Khung năm 2026 và luận điểm doanh nghiệp

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Định vị DuriOS là sản phẩm quy trình B2B chuyên ngành cho vựa đóng gói sầu riêng tươi và doanh nghiệp xuất khẩu, không phải ERP hay dịch vụ thông quan. Sản phẩm mở đầu là hồ sơ đáng tin cậy, nối bằng chứng lô hàng đến lúc niêm phong container. | Công cụ hỗ trợ dựa trên bộ quy tắc làm nổi bật sai lệch và bằng chứng còn thiếu; nhân viên được đào tạo xác nhận giá trị từ nguồn, quản lý giữ quyền phê duyệt. | Giữ nguyên các tài liệu khảo sát và kiểm toán lịch sử. Dùng PRD 2026 đã duyệt làm phạm vi hiện hành; không kích hoạt tuyên bố theo luật nếu chưa xác minh nguồn chính thức và rà soát. |

## 3. Hệ điều hành tác nhân AI

| Bộ phận | Tác nhân / người phụ trách | Ranh giới tự động hóa và KPI |
|---|---|---|
| Founder / chiến lược | CEO | Chịu trách nhiệm về cổng, ưu tiên, vốn và tuyên bố; KPI: mỗi lần phát hành đều có quyết định được ghi nhận. |
| Sản phẩm / vận hành thực địa | Trưởng sản phẩm + nhân sự vận hành pilot | Ghi nhận quy trình, hướng dẫn sử dụng và hỗ trợ; KPI: thời gian xử lý hồ sơ trung vị và thời gian đào tạo. |
| Kỹ thuật / bảo mật | CTO / trưởng kỹ thuật | Tự động hóa các phép kiểm tra tất định và giám sát vận hành; KPI: không có sự cố P0, khôi phục sao lưu thành công, không bỏ sót lỗi trong kiểm tra mù. |
| Doanh thu / khảo sát khách hàng | Founder phụ trách bán hàng giai đoạn đầu | Không tự động gửi tuyên bố ra bên ngoài; KPI: số cuộc phỏng vấn đạt tiêu chí, cam kết pilot được người mua có thẩm quyền duyệt, chuyển đổi trả phí. |
| Quản trị | Founder cùng luật sư đủ chuyên môn tại Việt Nam | Con người phải rà soát quyền riêng tư, cách diễn đạt pháp lý, điều khoản hợp đồng và tích hợp thanh toán; KPI: không còn cổng pháp lý chưa giải quyết trước khi khai trương. |

**Chính sách tự động hóa:** Tự động hóa việc so sánh lặp lại và ghi nhận thao tác quy trình. Không tự động cấp chứng nhận, quyết định thông quan, cấp quyền ngoài chính sách rõ ràng hoặc cam kết thương mại. Con người phải xác minh mọi trường được trích xuất trước khi xuất hồ sơ.

## 4. Ảnh chụp mức độ sẵn sàng IPO

**Mức sẵn sàng: 1/5 — đã ghi nhận các kiểm soát nền tảng, chưa có bằng chứng ở quy mô doanh nghiệp.** Đây là điểm phục vụ lập kế hoạch, không phải ý kiến kiểm toán. Tài liệu hiện có xác định ranh giới sản phẩm và nguyên tắc kiểm toán, nhưng chưa chứng minh tình trạng pháp nhân, doanh thu trả phí, báo cáo tài chính được kiểm toán, hội đồng quản trị độc lập, hiệu quả kinh tế đơn vị có thể lặp lại hay kiểm soát dành cho công ty đại chúng.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Ưu tiên bằng chứng phù hợp sản phẩm-thị trường và doanh thu ổn định trước khi chuẩn bị huy động vốn trên thị trường vốn. | Duy trì nhịp ghi nhận có thể truy vết đối với dữ liệu khách hàng, tài chính và rủi ro. | Xác nhận nghĩa vụ về pháp nhân, thuế, kế toán, lao động, quyền riêng tư, sở hữu trí tuệ và hợp đồng với luật sư/kế toán; chỉ xây dựng kiểm soát chính thức khi quy mô đòi hỏi. |

## 5. Báo cáo khoảng trống và lộ trình sáu tháng

| Thời gian | Kết quả kinh doanh | Tác nhân AI / triển khai | Cổng quản trị |
|---|---|---|---|
| Tháng 10–11/2026 | Xác nhận một địa điểm pilot có thể tiếp cận và người quyết định chi. | Nghiệm thu bản trình diễn dữ liệu tổng hợp; chọn phương thức OTP; chuẩn bị triển khai tại địa điểm và đo KPI. | Phải có Founder duyệt địa điểm, chấp thuận dữ liệu, thông báo quyền riêng tư, kiểm soát triển khai và bằng chứng khôi phục trước khi dùng chứng từ thật. |
| Tháng 12/2026–1/2027 | Nếu các cổng đạt, chạy pilot trả phí trên năm container. | Đo mức nền và thời gian xử lý bằng DuriOS; thử hai lỗi mù; ghi nhận khối lượng hỗ trợ. | Chỉ triển khai sau khi cả năm cổng áp dụng đều đạt; có phạm vi công việc được ký và đầu mối liên hệ khi xảy ra sự cố. |
| Tháng 2–3/2027 | Quyết định chuyển đổi, điều chỉnh giá hay dừng. | So sánh kết quả pilot với giá trị do bên mua xác định; chỉ sửa các trở ngại áp dụng có bằng chứng. | Rà soát lưu giữ/xóa dữ liệu, nhật ký truy cập và thủ tục kết thúc với khách hàng. |
| Tháng 4/2027 | Quyết định lặp lại với tối đa hai địa điểm nữa hoặc tạm dừng. | Ghi nhận khả năng lặp lại, giờ hướng dẫn, chi phí hỗ trợ và ý định gia hạn. | Rà soát cổng; chưa mở sàn công khai hay ký quỹ nếu chưa có phê duyệt pháp lý, bảo mật và đối tác riêng. |

**Khoảng trống trọng yếu:** quyền tiếp cận địa điểm và chấp thuận bằng văn bản; thông tin xác thực thật của nhà cung cấp OTP; cấu hình mạng/TLS và mã hóa tại địa điểm; hiệu quả kinh tế quy trình đã xác minh; mức sẵn sàng trả phí thực tế; chi phí triển khai/hỗ trợ; rà soát pháp lý hiện hành cho chia sẻ dữ liệu và thương mại công khai trong tương lai.

## 6. Mô hình kinh doanh và hiệu quả kinh tế đơn vị

**Mô hình:** Phần mềm quy trình B2B chuyên ngành có tính mùa vụ, ban đầu có thể cài tại chỗ, kèm phí thiết lập/pilot nếu khách hàng chấp nhận; mô hình sàn và phí theo giao dịch là giả thuyết riêng ở giai đoạn sau.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Chỉ kiểm tra các mức giá đề xuất: 5 triệu VND cho pilot năm container, 60 triệu VND/năm và 10 triệu VND phí thiết lập. Lập mô hình doanh thu từ số vựa có thể tiếp cận, mùa vụ sử dụng đã xác minh, gia hạn và thời gian cung cấp dịch vụ. | Theo dõi số phút tiết kiệm, lỗi làm lại được phát hiện, giờ hướng dẫn, yêu cầu hỗ trợ, hạ tầng, OTP, lưu trữ và chi phí rà soát thủ công trên mỗi tài khoản. | Không coi ước tính tổn thất tránh được hay giá mẫu là hiệu quả kinh tế thực tế. Không cam kết ROI trước khi ghi nhận mức nền và kết quả của khách hàng. |

**Công thức chính:** biên lợi nhuận gộp = (doanh thu đã thu − chi phí lưu trữ/hỗ trợ/OTP/lưu dữ liệu/hướng dẫn) ÷ doanh thu đã thu; số tháng hoàn vốn = chi phí thu hút và hướng dẫn ÷ lợi nhuận gộp hàng tháng; chưa thể dùng LTV/CAC có ý nghĩa cho đến khi có dữ liệu gia hạn theo nhóm khách hàng. Hiện chưa có bằng chứng đáng tin cậy về CAC, LTV, tỷ lệ chuyển đổi hay TAM.

## 7. Tâm lý khách hàng và chân dung người dùng

| Chân dung | Công việc / yếu tố kích hoạt | Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|---|---|
| Nhân viên chứng từ (người dùng hàng ngày) | Hoàn tất hồ sơ trước giờ xe/container lạnh rời bãi; phát hiện lỗi số kẹp chì, số container và chứng từ thiếu mà không phải nhập lại từ bản quét, Excel và tin nhắn. | Giảm thời gian xử lý và áp lực ca đêm. | Hỗ trợ trích xuất và đối chiếu chứng từ, kèm hiển thị đoạn nguồn. | Nhân viên xác minh từng giá trị; không tự động phê duyệt trong im lặng. |
| Chủ vựa / quản lý xuất khẩu (người mua) | Tránh làm lại, chậm trễ và lỗi chứng từ có thể phòng tránh; quyết định mua dựa trên chi phí quan sát được và thẩm quyền phê duyệt. | Chỉ trả tiền nếu giá trị đo được lớn hơn phí và các phương án khác. | Màn hình quản lý hiển thị ngoại lệ, thời gian xử lý và lịch sử phê duyệt. | Giới hạn rõ hợp đồng và tuyên bố; bên mua quyết định có chia sẻ hồ sơ hay không. |
| Nhà vườn / hợp tác xã (chủ dữ liệu) | Chứng minh nguồn gốc lô hàng và chia sẻ có chọn lọc chứng nhận do bên độc lập cấp. | Bảo vệ vị thế thương lượng và cơ hội tiếp cận kênh giá trị cao. | Ghi nhận bằng chứng có cấu trúc, quyền truy cập có thời hạn và có thể thu hồi. | Tổ chức giữ quyền với dữ liệu; DuriOS lưu bằng chứng nhưng không cấp chứng nhận. |
| Nhà nhập khẩu (người dùng tương lai) | Xem nguồn gốc và bằng chứng lô hàng. | Có thể tham gia mạng lưới sau này, nhưng không phải bên trả phí đầu tiên. | Xem hộ chiếu ở chế độ chỉ đọc, đúng mục đích được cấp. | Không công khai dữ liệu thương mại nếu chưa có chấp thuận và rà soát pháp lý. |

## 8. Định vị thương hiệu và lợi thế cạnh tranh

**Giả thuyết định vị:** “Hồ sơ container rõ ràng, có người xác minh trước khi xuất hàng.” Tránh các tuyên bố “bảo đảm tuân thủ”, “thông quan” hay “chứng nhận hữu cơ”.

Mô tả sản phẩm công khai cho thấy có các đối thủ gần hoặc trực tiếp: [eDurian Export Control Tower](https://edurian.vn/en) giới thiệu hệ sinh thái xuất khẩu sầu riêng rộng; [DurianTradeX](https://www.duriantradex.com/en) mô tả nền tảng chuỗi cung ứng đầu-cuối; [DurianBase](https://durianbase.vn/) mô tả truy xuất từ vườn đến xuất khẩu; [SourceTrace](https://sourcetrace.com/) phục vụ truy xuất nông nghiệp rộng hơn. Đây là mô tả của nhà cung cấp, không phải đánh giá hiệu quả độc lập.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Khác biệt bằng cách chứng minh phù hợp với quy trình của vựa, dễ thiết lập hơn, triển khai tại chỗ có cân nhắc quyền riêng tư và hồ sơ chứng từ sạch — không phải bằng tuyên bố có phạm vi rộng hơn. | Giúp việc truy nguồn bằng chứng, giải thích đối chiếu và rà soát của con người dễ hơn bảng tính/tin nhắn. | Coi “lợi thế cạnh tranh” là giả thuyết chưa kiểm chứng; so sánh thắng/thua tại thực địa và không sao chép tuyên bố của đối thủ. |

## 9. Trụ cột nội dung và thu hút khách hàng đầu phễu

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Chỉ xuất bản sau phỏng vấn thực địa: (1) danh sách kiểm tra hồ sơ container, (2) quy trình ngăn lỗi, (3) quyền sở hữu và chia sẻ bằng chứng, (4) bài học từ pilot tại vựa. Bắt đầu với kênh tiếng Việt do Founder vận hành và các hiệp hội ngành. | Dùng AI soạn bản tóm tắt từ ghi chú đã được duyệt và ẩn danh; Founder kiểm tra mọi dữ kiện và trích dẫn. | Xin phép trước khi kể chuyện khách hàng; không công bố chứng từ, sự cố có tên khách hàng hay diễn giải quy định nếu chưa được duyệt và kiểm chứng nguồn. |

## 10. Nội dung trang web và trang giới thiệu

1. Tiêu đề chính: “Rà soát hồ sơ từng container trước khi xuất hàng.”  
2. Trình bày quy trình: tải lên → đối chiếu → con người xác minh → quản lý rà soát → niêm phong manifest nội bộ.  
3. Chỉ trình bày kết quả đo được bằng dữ liệu tổng hợp cho đến khi khách hàng cho phép công bố tình huống thực tế.  
4. Giải thích phương án cài tại chỗ/pilot kín và quyền sở hữu dữ liệu.  
5. Nêu giới hạn: công cụ hỗ trợ chuẩn bị nội bộ; không bảo đảm thông quan hoặc chứng nhận.  
6. Lời kêu gọi hành động: đăng ký phỏng vấn quy trình hoặc trao đổi về pilot có kiểm soát; không ngụ ý có giá thương mại cố định.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Tối ưu để có cuộc trao đổi đủ tiêu chuẩn với vựa, không chạy theo lượng truy cập người tiêu dùng. | Đo tỷ lệ từ lượt xem trang sang cuộc phỏng vấn đủ tiêu chuẩn bằng công cụ phân tích tối thiểu. | Thông báo quyền riêng tư, tuyên bố trung thực, sự chấp thuận và dữ liệu demo an toàn là điều kiện trước khi ra mắt. |

## 11. Quảng cáo hiệu suất và thử nghiệm nội dung

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Không chi quảng cáo trong giai đoạn kiểm chứng đầu tiên. Nếu Founder duyệt thử nghiệm sau đó, nhắm đến người quyết định tại vựa với ngân sách nhỏ có giới hạn và một thông điệp quy trình rõ ràng. | Tạo một vài biến thể nội dung từ nỗi đau đã xác minh; con người duyệt trước khi đăng. | Không đưa ra mức tiết kiệm chưa có căn cứ, cam kết không lỗi, tuyên bố được GACC xác nhận hay dùng tên/chứng từ khách hàng. Dừng quảng cáo nếu khách hàng tiềm năng không phù hợp hoặc chưa rõ cách xử lý chấp thuận. |

## 12. Bài viết chuyên sâu và kể chuyện

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Xây dựng câu chuyện Founder về điểm bàn giao tốn kém giữa chứng từ và lúc xuất hàng; chỉ công bố tình huống khách hàng sau khi đo được kết quả pilot. | Soạn câu chuyện từ nhật ký sự kiện và ghi chú phỏng vấn đã ẩn danh; con người kiểm chứng mọi con số. | Phân biệt quan sát, lời kể của khách hàng và suy luận. Xin phép bằng văn bản trước khi công bố; không khẳng định đã ngăn ngừa tổn thất nếu chưa có bằng chứng. |

## 13. Email và chuỗi chăm sóc khách hàng

| Giai đoạn | Nội dung kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|---|
| Khảo sát | Cảm ơn người được phỏng vấn; xác nhận ghi chú và buổi hẹn tiếp theo. | Hỗ trợ soạn bằng mẫu. | Không gửi chuỗi email hàng loạt trước khi rà soát căn cứ hợp pháp/chấp thuận. |
| Bắt đầu pilot | Vai trò, phạm vi dữ liệu, đào tạo, hỗ trợ và danh sách kiểm tra cổng. | Nhắc các mục trong danh sách. | Ghi bằng văn bản đầu mối liên hệ, phạm vi truy cập, lưu trữ và quy trình xử lý sự cố. |
| Đánh giá pilot | Chia sẻ kết quả KPI và quyết định của bên mua. | Soạn báo cáo nháp từ các chỉ số đã duyệt. | Khách hàng xác minh dữ kiện; không tái sử dụng cho tiếp thị nếu chưa được chấp thuận. |
| Gia hạn / kết nối lại | Rà soát mức sử dụng và vấn đề quy trình còn tồn đọng. | Đánh dấu tài khoản ngừng hoạt động để con người liên hệ. | Tôn trọng yêu cầu từ chối/xóa dữ liệu; không suy đoán thông tin nhạy cảm. |

## 14. Quy trình bán hàng và kênh tiếp cận

**Các bước bán hàng:** chọn địa điểm mục tiêu → xác nhận quyền tiếp cận → quan sát quy trình → xác định người quyết định chi → được phép dùng tài liệu đã ẩn danh → đề nghị pilot trả phí → qua cổng bảo mật/pháp lý → pilot năm container → bên mua đánh giá → quyết định gia hạn năm.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Ban đầu Founder trực tiếp bán hàng và nhờ giới thiệu đáng tin cậy tại địa phương; nhân viên chứng từ là người dùng, chủ vựa/quản lý xuất khẩu là người quyết định chi. Đánh giá sản lượng, chi phí lỗi, thẩm quyền ngân sách, mùa vụ và cách làm hiện tại. | Nhắc việc CRM và lưu bằng chứng; không tự đàm phán hoặc cam kết giá. | Cần có phê duyệt bằng văn bản về tiếp cận, quyền sử dụng dữ liệu, phạm vi pilot, hoàn phí, giới hạn dịch vụ và tuyên bố với khách hàng. |

## 15. Thử nghiệm GTM và chọn kênh trọng tâm

| Thử nghiệm | Dấu hiệu thành công | Quy tắc quyết định |
|---|---|---|
| Quan sát quy trình chứng từ và đo thời gian tại một địa điểm. | Quan sát trực tiếp thấy vấn đề đối soát lặp lại và gây tốn kém. | Nếu người dùng xác nhận không có chi phí lặp lại hoặc đã có cách xử lý phù hợp, dừng hoặc thu hẹp vấn đề cần giải quyết. |
| Đề nghị pilot trả phí năm container theo giả thuyết giá hiện tại. | Người quyết định chi ký và thanh toán/đặt ký quỹ theo điều khoản đã rà soát. | Lời khen không phải bằng chứng; điều chỉnh hoặc dừng nếu không có cam kết trả phí sau số lượng khảo sát đã duyệt. |
| Kiểm tra khả năng hướng dẫn nhân viên chứng từ trong 30 phút. | Người dùng tự hoàn tất hồ sơ sau đào tạo. | Chỉ sửa trải nghiệm ở điểm vướng được quan sát thực tế. |
| Thử giới thiệu từ đối tác (phòng lab, đơn vị vận chuyển, hiệp hội). | Có quyền tiếp cận địa điểm đủ tiêu chuẩn và công khai quan hệ giới thiệu. | Không phụ thuộc một bên trung gian, không chia sẻ dữ liệu khách hàng nếu chưa được chấp thuận. |

## 16. AARRR và phân tích tinh gọn

| Phễu | Chỉ số | Cách đo ban đầu |
|---|---|---|
| Thu hút | Lượt giới thiệu vựa đủ tiêu chuẩn | Đếm theo nguồn; không chạy theo chỉ số hiển thị vô nghĩa. |
| Kích hoạt | Hồ sơ hoàn tất đầu tiên | Thời gian đến hồ sơ được xác thực đầu tiên và số phút đào tạo. |
| Duy trì | Người dùng/hồ sơ pilot hoạt động hàng tuần | Đánh giá theo ngày vận hành trong mùa vụ. |
| Doanh thu | Pilot trả phí và chuyển đổi hợp đồng năm | Tiền đã thu và điều khoản đã ký, không tính lời bày tỏ ý định. |
| Giới thiệu | Lượt giới thiệu được khách hàng cho phép | Chỉ tính khi có chấp thuận. |

**Chỉ số trọng tâm:** tỷ lệ container đủ điều kiện pilot có hồ sơ hoàn tất trước khi xuất hàng, tất cả trường bắt buộc được con người xác minh và không bỏ sót lỗi container/kẹp chì/chứng từ được cài vào kiểm tra. Mục tiêu pilot: thời gian đối soát trung bình dưới 5 phút trên năm container thật, chặn được hai lỗi kiểm tra mù; dưới 3 phút là mục tiêu cao hơn.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Kết hợp kết quả sản phẩm với mức sử dụng trả phí được duy trì. | Tạo bản tổng hợp ngoại lệ và nhóm khách hàng hàng tuần. | Giảm thiểu dữ liệu phân tích, giới hạn truy cập, lưu định nghĩa KPI và nguồn gốc dữ liệu. |

## 17. Gọi vốn và câu chuyện với nhà đầu tư

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Hiện chưa có cơ sở cho luận điểm gọi vốn. Câu chuyện tương lai: ngăn việc làm lại chứng từ tại điểm bàn giao quan trọng của xuất khẩu, kiểm chứng phân khúc vựa trả phí rồi mở rộng chia sẻ bằng chứng nếu tạo được giá trị mạng lưới. | Duy trì kho chỉ số có liên kết nguồn; đánh dấu rõ dự báo và giả thuyết. | Không trình bày mục tiêu tham vọng 1 triệu USD ARR, quy mô thị trường, số khách hàng, tổn thất tránh được hay pipeline như kết quả đã đạt. Chỉ gọi vốn sau khi chứng minh được doanh thu lặp lại và chi phí phục vụ. |

## 18. Rủi ro và vận hành theo kịch bản

| Kịch bản | Tín hiệu kích hoạt | Ứng phó |
|---|---|---|
| Không có nhu cầu trả phí | Vựa đủ tiêu chuẩn từ chối pilot hoặc người mua không có quyền duyệt chi. | Dừng mở rộng tính năng; phỏng vấn người không mua; dừng hoặc định vị lại theo cổng đã ghi nhận. |
| Không thể chia sẻ dữ liệu an toàn | Địa điểm từ chối chứng từ thật hoặc quyền sử dụng dữ liệu không rõ. | Chỉ dùng dữ liệu tổng hợp; không gây áp lực để xin quyền truy cập; điều chỉnh phạm vi hoặc dừng. |
| Bỏ sót lỗi vận hành | Lỗi kiểm tra mù lọt qua hoặc sai lệch hồ sơ thật không được phát hiện. | Tạm dừng sử dụng, thông báo khách hàng, giữ lại bằng chứng, khắc phục và đánh giá lại trước khi tiếp tục. |
| Quy định đổi hoặc quy tắc sai | Cơ quan có thẩm quyền hoặc nguồn từ phòng lab mâu thuẫn với quy tắc đang dùng. | Cách ly quy tắc, cảnh báo người dùng và xin chuyên gia rà soát. |
| Sự cố bảo mật / lỗi sao lưu | Truy cập trái phép, mất thiết bị, khôi phục lỗi hoặc lộ thông tin xác thực. | Cô lập hệ thống, bảo toàn nhật ký, tuân thủ nghĩa vụ thông báo với khách hàng/cơ quan và khôi phục từ bản sao đã xác minh. |
| Rủi ro từ sàn/thanh toán | Phạm vi sản phẩm trượt sang môi giới hoặc giữ tiền. | Giữ tính năng tắt cho đến khi luật sư và đối tác được cấp phép xác nhận mô hình hoạt động. |

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Đánh giá lại rủi ro hàng tháng và tại mỗi cổng giai đoạn. | Theo dõi tín hiệu vận hành và chuẩn bị tóm tắt sự cố nội bộ, không tự gửi thông báo ra ngoài. | Founder chịu trách nhiệm chấp nhận rủi ro; sự cố pháp lý, bảo mật hoặc ảnh hưởng khách hàng cần con người quyết định. |

## 19. Nhân sự và thiết kế tổ chức

| Giai đoạn | Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|---|
| Khảo sát / một địa điểm | Founder kiêm CEO/sản phẩm/bán hàng; một người phụ trách kỹ thuật; thuê hỗ trợ bảo mật/pháp lý khi cần. | AI hỗ trợ soạn thảo, rà soát mã và tổng hợp chỉ số dưới sự kiểm tra của con người. | Không tuyển trước khi có nhu cầu lặp lại. Tách nhiệm vụ phê duyệt và thực thi khi phù hợp. |
| Các pilot lặp lại | Bổ sung nhân sự thành công khách hàng/triển khai trước khi mở rộng tiếp thị. | Tự động hóa danh sách hướng dẫn và phân loại yêu cầu hỗ trợ. | Chính thức hóa rà soát quyền truy cập, trách nhiệm xử lý sự cố và kiểm soát tài chính. |
| Mở rộng | Chỉ bổ sung bán hàng và vận hành khi khả năng duy trì khách hàng và hoàn vốn cho phép. | Xác định quyền đã kiểm toán và nhật ký thay đổi của tác nhân. | Thiết lập báo cáo quản trị và giám sát độc lập tương xứng với giai đoạn doanh nghiệp. |

## 20. Mô hình ngành và hình mẫu IPO

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Tuyên bố công khai của các sản phẩm lân cận cho thấy hệ sinh thái truy xuất rộng và một số nền tảng riêng cho sầu riêng. Các điểm cần kiểm chứng gồm mức độ áp dụng quy trình, tính mùa vụ, chi phí tích hợp và việc chia sẻ liên tổ chức có tạo giá trị lặp lại không. Không suy ra thị phần hay hiệu quả từ trang tiếp thị. | Dùng khả năng liên thông và bằng chứng gắn với nguồn để giảm thao tác thủ công; không lấy “AI” làm luận điểm chính nếu chưa đo chất lượng trích xuất. | Hình mẫu IPO chưa hữu ích cho quyết định ở giai đoạn này. Chỉ đối chiếu tăng trưởng, duy trì và biên lợi nhuận đã kiểm toán khi đã xác định được nhóm công ty đại chúng phù hợp và có dữ liệu xác thực. |

## 21. Phòng dữ liệu và tài liệu nhà đầu tư

**Chuẩn bị khi có bằng chứng:** bản mô tả vấn đề một trang, bản demo sản phẩm, PRD đã duyệt, quy trình pilot, bằng chứng đã ẩn danh và được chấp thuận, quyết định qua cổng, sổ theo dõi sự cố, kết quả thử giá, hợp đồng khách hàng, hướng dẫn triển khai, tình hình bảo mật, hồ sơ vốn/pháp nhân/thuế và mô hình tài chính được ghi nhãn rõ.

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Lưu thư mục có phiên bản theo chủ đề thẩm định; chỉ chia sẻ với người được duyệt. | Tạo danh mục và xác định bằng chứng còn thiếu. | Ẩn thông tin khách hàng, ghi nhật ký truy cập, tách dữ kiện đã xác minh khỏi ước tính và nhờ luật sư rà soát nội dung công bố. |

## 22. Thực thi bằng tác nhân AI và OKR

| Quý | OKR kinh doanh | Phân công tác nhân | Kiểm soát quản trị |
|---|---|---|---|
| Q4 2026 | Nghiệm thu bản demo dữ liệu tổng hợp và qua cổng chọn địa điểm. | Sản phẩm/vận hành phụ trách phỏng vấn và thiết lập KPI; kỹ thuật phụ trách staging và độ tin cậy. | Không dùng dữ liệu thật cho đến khi cả năm cổng tại địa điểm đều đạt. |
| Q1 2027 | Nếu đủ điều kiện, hoàn tất một pilot trả phí năm container và có quyết định chuyển đổi của bên mua. | Sản phẩm tổng hợp thời gian; kỹ thuật giám sát lỗi; Founder phụ trách đánh giá thương mại. | Tiếp tục áp dụng kiểm soát về chấp thuận, truy cập, sao lưu, sự cố và tuyên bố. |
| Q2 2027 (có điều kiện) | Chỉ lặp lại tại tối đa hai địa điểm nếu pilot đầu đạt mục tiêu và cổng thanh toán. | Chỉ tự động hóa hướng dẫn triển khai lặp lại sau khi đo được công sức hỗ trợ. | Mỗi địa điểm phải được duyệt riêng; chấp thuận ở địa điểm đầu không áp dụng cho địa điểm khác. |

## 23. Nhịp quản trị hội đồng

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Founder chủ trì họp vận hành hàng tháng; tổ chức rà soát với cố vấn bên ngoài hàng quý khi có cố vấn phù hợp. Theo dõi khách hàng, tiền mặt, kết quả sản phẩm, rủi ro và quyết định qua cổng. | Chuẩn bị tài liệu họp hội đồng/cố vấn từ nguồn đã duyệt. | Chưa có bằng chứng về một hội đồng chính thức. Xác nhận nghĩa vụ của pháp nhân và quản trị theo luật với luật sư; ghi nhận xung đột lợi ích, phê duyệt và quyết định vốn. |

## 24. ESG và tác động

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Tác động tiềm năng: tăng trách nhiệm giải trình nguồn gốc, giúp người trồng tiếp cận bằng chứng công bằng hơn và giảm việc làm lại hồ sơ không cần thiết. Phải đo trước khi tuyên bố. | Theo dõi việc chia sẻ dữ liệu được chấp thuận và kết quả giảm làm lại hồ sơ. | Bảo vệ quyền dữ liệu của người trồng; không ngụ ý sản phẩm hữu cơ; không đưa ra tuyên bố bền vững nếu thiếu căn cứ được công nhận. Chỉ xem xét năng lượng/chất thải chuỗi lạnh nếu có dữ liệu đáng tin cậy. |

## 25. Ứng phó khủng hoảng và danh tiếng

| Kinh doanh | Tác nhân AI | Quản trị |
|---|---|---|
| Duy trì danh sách liên hệ khách hàng và mẫu phản hồi cho sự cố dịch vụ, nghi ngờ sai hồ sơ, rò rỉ dữ liệu, quy tắc khuyến cáo sai và sự cố đối tác thanh toán. | Phát hiện bất thường và soạn dòng thời gian nội bộ; con người quyết định mức độ, việc thông báo khách hàng và phản hồi công khai. | Bảo toàn bằng chứng, chặn truy cập, thông báo kịp thời các dữ kiện đã xác minh, tuân thủ nghĩa vụ theo hợp đồng/pháp luật và không hứa hẹn thông quan. Sau sự cố cần rà soát và phê duyệt hành động khắc phục. |

## Rà soát quy định và thị trường hiện hành

Các nội dung dưới đây là căn cứ để lập kế hoạch, không phải tư vấn pháp lý. Cần kiểm tra lại văn bản đang có hiệu lực và mức độ áp dụng với luật sư Việt Nam trước khi đưa sản phẩm đến khách hàng, chuyển dữ liệu xuyên biên giới, vận hành sàn hoặc điều phối thanh toán.

- Luật Bảo vệ dữ liệu cá nhân **91/2025/QH15** có hiệu lực từ 2026-01-01: [hồ sơ văn bản chính thức](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=).
- Luật Giao dịch điện tử **20/2023/QH15** có hiệu lực từ 2024-07-01: [hồ sơ văn bản chính thức](https://vanban.chinhphu.vn/?classid=1&docid=208421&pageid=27160).
- Luật Thương mại điện tử **122/2025/QH15** và Nghị định hướng dẫn **248/2026/NĐ-CP** có hiệu lực từ 2026-07-01; cần đánh giá trước khi mở sàn: [Luật](https://vanban.chinhphu.vn/?classid=1&docid=216503&pageid=27160), [Nghị định](https://vanban.chinhphu.vn/?docid=218747&orggroupid=2&pageid=27160).
- Quy định thanh toán không dùng tiền mặt gồm Nghị định **52/2024/NĐ-CP**: [hồ sơ văn bản chính thức](https://vanban.chinhphu.vn/?docid=210262&pageid=27160). Tiền phải do tổ chức được cấp phép giữ; cần xin tư vấn pháp lý về mọi vai trò điều phối.
- Cục Trồng trọt và Bảo vệ thực vật lưu Nghị định thư sầu riêng tươi Việt Nam–Trung Quốc và danh sách vùng trồng/vựa được phê duyệt; hãy kiểm tra danh sách và nghị định thư hiện hành trước khi dựa vào mã số: [trang chính thức của PPD](https://sansangxuatkhau.ppd.gov.vn/tin-tuc-su-kien/sau-rieng-duoc-xuat-khau-chinh-ngach-sang-trung-quoc.html), [cập nhật mã được duyệt](https://ppd.gov.vn/tin-moi-nhat/trung-quoc-phe-duyet-them-829-ma-so-vung-trong-va-131-ma-so-co-so-dong-goi-sau-rieng-cua-viet-nam.html).

## Các bước tiếp theo được đề xuất

1. **Thu thập thông tin:** SWOT, đánh giá năm yếu tố, rà soát mức sẵn sàng kỹ thuật/địa điểm và bằng chứng về quy trình khách hàng.
2. **Chiến lược:** Chốt vấn đề và phạm vi pilot; kiểm chứng người mua, giá và hướng tiếp cận thị trường.
3. **Xây dựng:** Chỉ thực hiện thay đổi cần cho pilot; hoàn tất staging, bảo mật, sao lưu/khôi phục và nghiệm thu người dùng.
4. **Doanh thu:** Chạy pilot trả phí; đánh giá chuyển đổi, chi phí hỗ trợ và nhu cầu lặp lại.
5. **Mở rộng:** Mở rộng thận trọng, xác minh vị thế cạnh tranh và xây dựng kiểm soát tài chính dựa trên hiệu quả đã quan sát.
