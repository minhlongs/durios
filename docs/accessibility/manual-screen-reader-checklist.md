# DuriOS — Quy trình & Checklist kiểm thử thủ công Accessibility bằng Screen Reader

Tài liệu này là hướng dẫn chính thức dành cho kiểm thử viên (QA/Tester) để tiến hành kiểm tra khả năng tiếp cận (Accessibility - A11y) trên giao diện DuriOS bằng các trình đọc màn hình thực tế (Physical Screen Readers).

---

## 1. Nguyên tắc cốt lõi & Phân lập môi trường kiểm thử

> [!IMPORTANT]
> **Quy tắc phân lập môi trường**: VoiceOver macOS, VoiceOver iOS và NVDA Windows hoạt động trên các API trợ năng (Accessibility APIs) khác nhau (`NSAccessibility`, `UIAccessibility`, `MSAA / IAccessible2 / UI Automation`) và có hành vi điều hướng, phím tắt cũng như thuật toán đọc văn bản khác biệt.
> 
> **Tuyệt đối không suy rộng kết quả từ môi trường này sang môi trường khác.** Mỗi môi trường bắt buộc phải có biên bản kiểm thử độc lập.

| Môi trường | Nền tảng | Trình duyệt khuyến nghị | Phương thức điều hướng chính |
|---|---|---|---|
| **VoiceOver macOS** | macOS Sonoma / Sequoia | Safari / Google Chrome | Tổ hợp phím VO (`Control + Option`) + Mũi tên, `VO + U` (Rotor), `Tab` |
| **VoiceOver iOS** | iOS 17 / 18 (iPhone/iPad) | Mobile Safari | Cử chỉ vuốt (`Swipe Right/Left`), Double tap để kích hoạt, xoay 2 ngón (Rotor) |
| **NVDA Windows** | Windows 11 | Mozilla Firefox / Google Chrome | Phím điều hướng Browse Mode (Mũi tên, `H`, `T`, `K`, `D`), Focus Mode (`Tab`, `Enter`, `Space`) |

---

## 2. Chuẩn bị trước khi kiểm thử

1. **Khởi động hệ thống DuriOS**:
   ```bash
   cd /Users/macbook/durios
   # Khởi động máy chủ thử nghiệm trên cổng 3917 (hoặc cổng mặc định 3000)
   PORT=3917 bun run src/server/server.ts
   ```
2. **Mở giao diện ứng dụng**: Truy cập `http://127.0.0.1:3917` trên trình duyệt mục tiêu.
3. **Kích hoạt Screen Reader**:
   * **VoiceOver macOS**: Nhấn `Command + F5` (hoặc bấm Touch ID 3 lần).
   * **VoiceOver iOS**: Vào *Cài đặt > Trợ năng > VoiceOver* gạt Bật (hoặc bấm 3 lần nút nguồn).
   * **NVDA Windows**: Nhấn `Ctrl + Alt + N`.
4. **Quy tắc ghi nhận**:
   * Ghi lại chính xác nguyên văn âm thanh screen reader phát ra (Verbatim Speech Output).
   * Ghi nhận nếu phát hiện khoảng im lặng bất thường (Unintended Silence) hoặc đọc lặp nội dung.

---

## 3. Checklist kiểm thử chi tiết theo luồng nghiệp vụ

### Kịch bản 1: Landmarks, Cấu trúc trang & Phím tắt nhảy vùng (Skip Link)

*Mục tiêu: Đảm bảo người dùng khiếm thị có thể hình dung toàn bộ bố cục trang và bỏ qua phần đầu trang nhanh chóng.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 1.1 | Mở trang, nhấn `Tab` lần đầu tiên | Nút nhảy nhanh (`.skip-link`) | Đọc: *"Bỏ qua tới nội dung hồ sơ, liên kết"* (Hiển thị trực quan ở góc trên bên trái) | | [ ] Đạt<br>[ ] Chưa đạt |
| 1.2 | Khi đang ở `skip-link`, nhấn `Enter` | Vùng làm việc chính (`#workspace-main`) | Focus chuyển thẳng vào `#workspace-main`, đọc: *"Không gian làm việc hồ sơ, vùng chính"* | | [ ] Đạt<br>[ ] Chưa đạt |
| 1.3 | Dùng phím duyệt landmark (`VO + U` chọn Landmarks / NVDA bấm `D`) | Cấu trúc Landmarks | Nhận diện đủ 4 landmark: <br>1. *Banner* (`header.app-header`)<br>2. *Navigation* (*"Danh sách hồ sơ"* - `nav#dossier-nav`)<br>3. *Main* (*"Không gian làm việc hồ sơ"* - `main#workspace-main`)<br>4. *Complementary* (*"Lưu ý pháp lý"* - `aside.disclaimer-strip`) | | [ ] Đạt<br>[ ] Chưa đạt |
| 1.4 | Duyệt tiêu đề Heading (`VO + Cmd + H` / NVDA bấm `H`) | Phân cấp tiêu đề | Đọc tuần tự cấp độ rõ ràng:<br>- H1: *"DuriOS Bản thử nghiệm cục bộ"*<br>- H2: *"Hồ sơ (...)"* (Sidebar)<br>- H2: Tiêu đề trạng thái hoặc *"Chưa có hồ sơ container nào"* | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 2: Tạo hồ sơ container & Xử lý lỗi nhập liệu

*Mục tiêu: Kiểm tra hộp thoại modal, bẫy tiêu điểm (focus trap), thông báo lỗi inline và dọn dẹp lỗi khi người dùng gõ lại.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 2.1 | `Tab` đến nút *"Tạo hồ sơ"*, nhấn `Enter` | Hộp thoại modal (`#create-dossier-dialog`) | Mở modal, đọc tiêu đề: *"Tạo hồ sơ container mới, hộp thoại"*. Focus tự động nhảy vào ô đầu tiên: *"Mã hồ sơ, ô nhập văn bản"* | | [ ] Đạt<br>[ ] Chưa đạt |
| 2.2 | Duyệt nhãn trường bằng phím mũi tên | Tên accessible của các trường | Tên các trường không bị đọc dính dấu sao lạ (ví dụ đọc *"Mã hồ sơ"*, không đọc *"Mã hồ sơ dấu sao"* do dấu `*` đã ẩn `aria-hidden`) | | [ ] Đạt<br>[ ] Chưa đạt |
| 2.3 | Để trống toàn bộ biểu mẫu, `Tab` đến nút *"Tạo hồ sơ"* (submit) và nhấn `Enter` | Kiểm tra bắt lỗi submit | 1. Vùng alert cảnh báo: *"Biểu mẫu còn lỗi. Vui lòng kiểm tra các trường được đánh dấu."*<br>2. Focus lập tức quay về ô `#inp-dossier-code`<br>3. Đọc: *"Mã hồ sơ, dữ liệu không hợp lệ, Vui lòng nhập mã hồ sơ."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 2.4 | Bắt đầu gõ ký tự vào ô `Mã hồ sơ` (VD: `DOS-TEST-01`) | Sự kiện xóa lỗi tức thì | Thuộc tính `aria-invalid` được gỡ bỏ; thông báo lỗi bên dưới ô lập tức biến mất | | [ ] Đạt<br>[ ] Chưa đạt |
| 2.5 | Nhấn phím `Escape` khi đang mở hộp thoại | Hủy bỏ hộp thoại modal | Hộp thoại đóng lại; tiêu điểm (focus) trả về chính xác nút *"Tạo hồ sơ"* đã gọi modal trước đó | | [ ] Đạt<br>[ ] Chưa đạt |
| 2.6 | Mở lại modal, nhập đầy đủ thông tin hợp lệ (Container: `MSKU1234565`, Seal: `VN-SEAL-8899`, ...), nhấn `Tạo hồ sơ` | Luồng tạo thành công | 1. Nghe tiếng báo: *"Đang tạo hồ sơ…"*<br>2. Modal đóng, live region thông báo: *"Đã tạo hồ sơ DOS-TEST-01. Bước tiếp theo: tải chứng từ."*<br>3. Focus chuyển tới tiêu đề `<h2>` của hồ sơ mới | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 3: Danh sách hồ sơ & Thanh tiến trình (Stepper)

*Mục tiêu: Đảm bảo trạng thái hồ sơ đang mở và các bước nghiệp vụ được thông báo chính xác.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 3.1 | `Tab` qua danh sách hồ sơ ở thanh bên | Nút chọn hồ sơ (`.dossier-item`) | Đọc rõ mã hồ sơ, trạng thái và chi tiết container/seal. Hồ sơ đang mở có thông báo *"mục hiện tại"* (`aria-current="true"`) | | [ ] Đạt<br>[ ] Chưa đạt |
| 3.2 | Duyệt vào thanh tiến trình Stepper (`.stepper-nav`) | Thanh bước (`<nav aria-label="Tiến trình hồ sơ">`) | Đọc: *"Tiến trình hồ sơ, điều hướng"*, danh sách gồm 5 mục có thứ tự | | [ ] Đạt<br>[ ] Chưa đạt |
| 3.3 | Di chuyển qua từng bước (`Tab` hoặc phím mũi tên) | Liên kết bước (`.step-link`) | Bước hiện tại có thông báo: *"bước hiện tại"* (`aria-current="step"`). Từng bước đọc đủ: Số bước, tên bước, trạng thái (ví dụ: *"Bước 1 Chứng từ Cần làm 0/3 chứng từ"*) | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 4: Tải chứng từ mẫu & Bảng chứng từ hiệu lực

*Mục tiêu: Kiểm tra phản hồi trong lúc tải file mạng và khả năng đọc dữ liệu dạng bảng biểu.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 4.1 | Duyệt danh sách checklist chứng từ mẫu | Danh sách checklist (`<ul class="checklist">`) | Từng loại chứng từ đọc kèm trạng thái rõ ràng: *"Chưa có"* hoặc *"Đã có"*, kèm giải thích *"Bản mẫu tổng hợp..."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 4.2 | Nhấn nút *"Tải bản mẫu"* của Phiếu đóng gói | Trạng thái bận & Kết quả tải | 1. Live region đọc ngay lập tức: *"Đang tải…"* (không im lặng)<br>2. Sau khi xong, đọc: *"Đã tải Phiếu đóng gói (Packing List). 4 trường cần xác minh."*<br>3. Nút chuyển sang *"Đã tải bản mẫu"* và bị disabled có lý do | | [ ] Đạt<br>[ ] Chưa đạt |
| 4.3 | Duyệt vào bảng chứng từ đang hiệu lực | Bảng dữ liệu (`<table class="data-table">`) | Đọc tiêu đề bảng: *"Chứng từ đang hiệu lực trong hồ sơ, bảng gồm ... dòng, 5 cột"*. Tiêu đề cột được gắn đúng khi chuyển giữa các ô | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 5: Xác minh trường dữ liệu trích xuất (HITL)

*Mục tiêu: Đảm bảo nhân viên nghiệp vụ (CLERK) kiểm tra và xác nhận từng trường dữ liệu dễ dàng bằng bàn phím.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 5.1 | `Tab` vào từng ô nhập *"Giá trị xác nhận"* (`input[data-field-input]`) | Tên nhãn Accessible của ô nhập | Đọc nhãn ẩn chi tiết: *"Giá trị xác nhận cho [Tên trường] ([Tên loại chứng từ]), ô nhập văn bản"* | | [ ] Đạt<br>[ ] Chưa đạt |
| 5.2 | Di chuyển vào ô có giá trị bị lệch so với hồ sơ (ví dụ container number) | Ghi chú so sánh (`aria-describedby`) | Đọc kèm mô tả phụ: *"Khác hồ sơ: MSKU1234565"* để cảnh báo kiểm thử viên ngay khi focus vào ô | | [ ] Đạt<br>[ ] Chưa đạt |
| 5.3 | Xóa trắng giá trị trong ô và nhấn nút *"Xác nhận"* (hoặc nhấn `Enter`) | Bắt lỗi bỏ trống trường | 1. Live alert đọc: *"Giá trị xác nhận không được để trống. Nhập giá trị đúng theo chứng từ gốc rồi xác nhận lại."*<br>2. Ô nhập giữ tiêu điểm và thông báo trạng thái không hợp lệ | | [ ] Đạt<br>[ ] Chưa đạt |
| 5.4 | Nhập giá trị đúng theo hồ sơ và nhấn phím `Enter` trong ô input | Phím tắt xác nhận nhanh | 1. Live region đọc: *"Đang lưu…"*<br>2. Thông báo thành công: *"Đã xác minh [Tên trường]..."*<br>3. Focus giữ nguyên vị trí hợp lý để tiếp tục làm việc | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 6: Thẩm định quy tắc tuân thủ & Phát hiện lỗi chặn / Cảnh báo

*Mục tiêu: Đảm bảo thông tin blocker và warning được phân biệt bằng văn bản ngữ nghĩa, không phụ thuộc màu sắc.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 6.1 | Nhấn nút *"Chạy thẩm định"* (`[data-action="run-validation"]`) | Trạng thái thẩm định | Nghe thông báo: *"Đang thẩm định…"*, sau đó nghe tóm tắt kết quả (ví dụ: *"Thẩm định: 2 lỗi chặn..."* hoặc *"Thẩm định xong: không phát hiện lỗi chặn"*) | | [ ] Đạt<br>[ ] Chưa đạt |
| 6.2 | Duyệt danh sách các lỗi chặn (`.finding--danger`) | Phân biệt lỗi chặn | Đọc rõ văn bản huy hiệu: *"CHẶN"*, tên quy tắc, giá trị quan sát, ngưỡng yêu cầu và căn cứ pháp lý | | [ ] Đạt<br>[ ] Chưa đạt |
| 6.3 | Duyệt danh sách cảnh báo (`.finding--warning`) | Phân biệt cảnh báo | Đọc rõ văn bản huy hiệu: *"CẢNH BÁO"*, phân biệt rạch ròi với lỗi chặn mà không cần nhìn màu đỏ/vàng | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 7: Kiểm soát phân quyền (CLERK vs MANAGER) & Phê duyệt xuất

*Mục tiêu: Kiểm tra cách giải thích lý do vô hiệu hóa nút bấm cho người dùng screen reader.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 7.1 | Khi đang ở vai trò `CLERK`, di chuyển đến nút *"Phê duyệt xuất"* | Nút disabled có mô tả lý do | Đọc tên nút: *"Phê duyệt xuất, nút, bị mờ (disabled)"*, kèm đọc đoạn mô tả liên kết: *"Chỉ vai trò Quản lý phê duyệt mới được phê duyệt. Đổi vai trò ở đầu trang."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 7.2 | `Tab` lên đầu trang, chọn vai trò *"Quản lý phê duyệt (MANAGER)"* trong combobox | Chuyển vai trò mô phỏng | Live region thông báo: *"Đã chuyển vai trò mô phỏng: Quản lý phê duyệt."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 7.3 | Quay lại nút *"Phê duyệt xuất"*, nhấn `Enter` | Thực hiện phê duyệt | 1. Nghe: *"Đang phê duyệt…"*<br>2. Nghe thông báo thành công: *"Đã phê duyệt xuất hồ sơ. Bước tiếp theo: niêm phong và xuất manifest."* | | [ ] Đạt<br>[ ] Chưa đạt |

---

### Kịch bản 8: Hộp xác nhận niêm phong, Phím tắt Escape & Trạng thái chỉ đọc

*Mục tiêu: Kiểm tra quy trình niêm phong không thể hoàn tác, bẫy focus bàn phím và trạng thái khóa toàn diện.*

| STT | Thao tác | Thành phần kiểm tra | Kỳ vọng Screen Reader phát ra | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|---|
| 8.1 | Nhấn nút *"Niêm phong và xuất manifest"* (`[data-action="request-export"]`) | Mở vùng xác nhận niêm phong | 1. Live region đọc: *"Mở xác nhận niêm phong và xuất hồ sơ."*<br>2. Vùng cảnh báo xuất hiện (`role="region"` có nhãn)<br>3. Focus nhảy vào nút *"Niêm phong và xuất"*<br>4. Nút đọc kèm toàn bộ cảnh báo: *"Sau khi niêm phong, hồ sơ chuyển sang chỉ đọc..."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.2 | Nhấn phím `Escape` trên bàn phím | Hủy thao tác xuất bằng phím tắt | 1. Vùng xác nhận đóng lại<br>2. Live region đọc: *"Đã huỷ thao tác xuất hồ sơ."*<br>3. Focus tự động quay về nút *"Niêm phong và xuất manifest"* | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.3 | Nhấn lại nút mở xác nhận, rồi chọn nút *"Huỷ"* (`data-action="cancel-export"`) | Hủy thao tác xuất bằng nút bấm | Kết quả tương tự như phím `Escape`: đóng xác nhận và trả focus về nút gọi | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.4 | Nhấn nút xác nhận *"Niêm phong và xuất"* (`confirm-export`) | Thực hiện xuất hồ sơ | 1. Nghe: *"Đang niêm phong…"*<br>2. Nghe thông báo thành công kèm mã băm SHA-256: *"Đã niêm phong và xuất hồ sơ. Mã băm tổng hợp..."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.5 | Duyệt biên nhận manifest | Thẻ biên nhận (`.receipt`) | Đọc được mã băm tổng hợp, thời điểm xuất, người xuất, nút *"Sao chép mã băm"* thao tác được | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.6 | Duyệt lại các ô nhập trường dữ liệu ở bước 2 | Trạng thái các trường bị khóa | Các ô input chuyển sang disabled. Screen reader đọc rõ lý do khóa: *"Hồ sơ đã niêm phong và chuyển sang chỉ đọc. Không thể chỉnh sửa giá trị trường."* | | [ ] Đạt<br>[ ] Chưa đạt |
| 8.7 | Duyệt đến nút *"Chạy thẩm định"* ở bước 3 | Trạng thái nút thẩm định bị khóa | Nút bị disabled kèm lý do: *"Hồ sơ đã niêm phong — không chạy lại thẩm định."* | | [ ] Đạt<br>[ ] Chưa đạt |

---

## 4. Biên bản kết quả kiểm thử thủ công (Dành cho Tester)

Kiểm thử viên sao chép phần này vào báo cáo nghiệm thu sau khi hoàn thành:

```markdown
### BIÊN BẢN KIỂM THỬ THỦ CÔNG SCREEN READER
- Ngày kiểm thử: YYYY-MM-DD
- Người thực hiện: [Họ và tên Tester]
- Thiết bị & Phiên bản OS: [VD: MacBook Pro M2, macOS 14.5 / iPhone 15, iOS 17.5 / ThinkPad, Windows 11]
- Screen Reader & Phiên bản: [VD: VoiceOver macOS / VoiceOver iOS / NVDA 2024.1]
- Trình duyệt & Phiên bản: [VD: Safari 17.5 / Chrome 126 / Firefox 127]

#### TỔNG HỢP KẾT QUẢ:
- Kịch bản 1 (Landmarks & Skip Link):        [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 2 (Tạo hồ sơ & Lỗi nhập liệu):   [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 3 (Danh sách hồ sơ & Stepper):    [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 4 (Tải chứng từ & Bảng):          [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 5 (Xác minh trường dữ liệu):      [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 6 (Thẩm định & Blocker/Warning):  [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 7 (Phân quyền & Phê duyệt):       [ ] ĐẠT  [ ] CHƯA ĐẠT
- Kịch bản 8 (Niêm phong & Khóa hồ sơ):     [ ] ĐẠT  [ ] CHƯA ĐẠT

#### DANH SÁCH LỖI PHÁT HIỆN (NẾU CÓ):
1. [Mô tả ngắn lỗi 1]:
   - Vị trí / Kịch bản:
   - Thao tác:
   - Âm thanh thực tế nghe được:
   - Âm thanh kỳ vọng:
   - Mức độ ảnh hưởng (Blocker / Major / Minor):
```
