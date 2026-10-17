# DuriOS — Năm việc ưu tiên đầu tiên

Các việc dưới đây tuân theo định hướng sản phẩm và cổng khai trương pilot tại một địa điểm đã được duyệt. Không đưa dữ liệu khách hàng thật vào hệ thống cho đến khi cả năm cổng khai trương đều đạt.

| Ưu tiên | Công việc | Người phụ trách | Điều kiện hoàn tất |
|---|---|---|---|
| P0 | Xác nhận quyền tiếp cận một vựa tiềm năng tại Cai Lậy, xác định người quyết định chi và người phụ trách chứng từ, xin Founder duyệt địa điểm, ký chấp thuận sử dụng dữ liệu trước khi thu thập chứng từ thật. | Founder / CEO | Hồ sơ bằng chứng của `GATE-01` đã hoàn tất và được lưu; chưa nạp dữ liệu khách hàng trước khi có chấp thuận. |
| P0 | Chọn nhà cung cấp OTP và hoàn tất diễn tập đăng nhập trên staging bằng thông tin xác thực thật cho tài khoản pilot. | Founder + Kỹ thuật | `GATE-02` đạt; thông tin xác thực được lưu theo quy trình quản lý bí mật đã duyệt và không sử dụng dữ liệu khách hàng thật trong môi trường sản xuất. |
| P0 | Hoàn tất cấu hình bảo mật tại chỗ cho địa điểm: reverse proxy HTTPS, giới hạn mạng riêng, mã hóa ổ đĩa và bản sao lưu, giới hạn quyền truy cập bí mật và diễn tập khôi phục đã xác minh. | Kỹ thuật / Bảo mật | `GATE-03` và bằng chứng sao lưu/khôi phục được duyệt cho địa điểm này; có đầu mối liên hệ sự cố cụ thể. |
| P0 | Chạy diễn tập nghiệm thu quy trình hoàn chỉnh bằng dữ liệu tổng hợp và KPI, gồm hai lỗi kiểm tra mù: sai số kẹp chì và thiếu bằng chứng/chưa xác minh. | Sản phẩm / Vận hành + Kỹ thuật | `GATE-05` đạt: trung bình dưới 5 phút mỗi container trong diễn tập, chặn được toàn bộ lỗi được cài vào và không có lỗi P0. |
| P1 | Kiểm tra mức sẵn sàng trả phí với chủ vựa/quản lý xuất khẩu; ghi lại điều khoản pilot thực tế, chi phí nền, sản lượng dự kiến, công sức hướng dẫn và tiêu chí gia hạn. | Founder / Doanh thu | Có cam kết pilot trả phí đã ký hoặc quyết định giữ/dừng có ghi nhận; mức giá tiếp tục được đánh dấu là giả thuyết cho đến khi nhận thanh toán. |

## Quy tắc dừng / tạm hoãn

- Không cài đặt tại địa điểm khách hàng hoặc nhập chứng từ thật trước khi mọi cổng áp dụng đều đạt và chấp thuận dữ liệu đã được ký.
- Không bật tuyên bố tuân thủ theo luật dựa trên quy tắc chưa xác minh; manifest vẫn là hồ sơ chuẩn bị nội bộ và phải có tuyên bố giới hạn trách nhiệm bắt buộc.
- Không mở sàn B2B hoặc triển khai ký quỹ trong pilot đầu tiên. Mọi lần mở sau này cần luật sư, đối tác được cấp phép, bộ phận bảo mật và Founder phê duyệt riêng.
- Nếu khách hàng không trả phí hoặc không chứng minh được chi phí quy trình lặp lại, hãy ghi nhận bằng chứng và dừng hoặc điều chỉnh giả thuyết kinh doanh trước khi mở rộng phạm vi.
