# DuriOS Field Discovery: Data Ownership & Permissions Questionnaire
## Bảng Khảo Sát Quyền Sở Hữu Dữ Liệu & Thẩm Quyền Truy Cập Chuỗi Giá Trị

**Mục tiêu:** Xác định ranh giới pháp lý, quyền bảo mật thương mại và mức độ sẵn sàng chia sẻ dữ liệu giữa Nhà vườn - Hợp tác xã - Thương lái - Nhà đóng gói - Cơ quan quản lý.  
**Phiếu khảo sát:** `DOP-2026-V1`  

---

## 1. Ranh Giới Quyền Sở Hữu Dữ Liệu (Data Ownership Boundaries)

| Loại dữ liệu (Data Asset) | Ai tạo ra dữ liệu? (Data Creator) | Ai đang lưu giữ thực tế? (Data Custodian) | Ai tự nhận có quyền sở hữu? (Claimed Owner) | Tính chất nhạy cảm thương mại (Sensitivity Level) | Sẵn sàng chia sẻ cho ai? (Sharing Willingness) |
|---|---|---|---|---|---|
| **1. Mã số vùng trồng (PUC) & Toạ độ vườn** | Chi cục BVTV cấp phép | HTX / Chủ vườn | HTX / Nông dân | **CAO** (Sợ bị vựa khác mượn/đánh cắp mã xuất khẩu) | Chỉ cho vựa ký hợp đồng bao tiêu xem |
| **2. Nhật ký bón phân & Thuốc BVTV** | Nông dân | Sổ tay nông dân | Nông dân | **TRUNG BÌNH** (Sợ lộ bí quyết chăm sóc hoặc vi phạm danh mục thuốc cấm) | Cán bộ kiểm tra kỹ thuật, kiểm dịch |
| **3. Giá mua sầu tại vườn & Khối lượng** | Thương lái & Vườn | Giấy tay / Tin nhắn Zalo | Cả hai | **RẤT CAO** (Bí mật kinh doanh, sợ đối thủ ép giá) | Tuyệt đối không chia sẻ công khai |
| **4. Kết quả kiểm nghiệm Lab (Cadmium/Dư lượng)** | Phòng Lab độc lập | Nhà đóng gói trả tiền | Nhà đóng gói | **CỰC KỲ CAO** (Nếu chỉ số xấu sẽ huỷ hoại uy tín vựa) | Chỉ nộp cơ quan hải quan/kiểm dịch khi bắt buộc |
| **5. Danh sách khách mua Trung Quốc (Consignee)** | Nhà đóng gói / Doanh nghiệp xuất khẩu | Hợp đồng / Invoice | Doanh nghiệp xuất khẩu | **TỐI MẬT** (Mối buôn, bạn hàng tại chợ đầu mối Gaobeidian/Jiaxing) | Không chia sẻ cho bất kỳ bên thứ ba nào |
| **6. Vị trí GPS & Nhiệt độ container lạnh** | Hãng tàu / Đơn vị vận tải | Thiết bị giám sát hành trình | Doanh nghiệp XK / Tài xế | **TRUNG BÌNH** (Theo dõi độ lạnh tránh hư hỏng cơm sầu) | Khách mua và bảo hiểm |

---

## 2. Câu Hỏi Đi Sâu Về Quản Lý & Phân Quyền (In-Depth Authorization Questions)

### Q1. Vấn đề "Mượn mã vùng trồng" (PUC Identity Lending & Fraud)
* *Câu hỏi:* Hiện tại có tình trạng chủ vườn/HTX cho thuê hoặc bị "mượn" mã vùng trồng để làm thủ tục hải quan cho sầu riêng thu gom từ vùng khác không?
* *Phản hồi thực địa:* `[ ] Có phổ biến / [ ] Thỉnh thoảng / [ ] Tuyệt đối không / [ ] Từ chối bình luận`
* *Hệ quả phần mềm:* Nếu hệ thống phần mềm yêu cầu xác thực OTP từ điện thoại của chủ vườn trước khi cấp quota xuất khẩu cho vựa, các bên có chấp nhận hợp tác không?

### Q2. Quyền Kiểm Soát Dữ Liệu Khi Có Tranh Chấp (Dispute Data Access)
* *Câu hỏi:* Khi một container bị đối tác Trung Quốc trừ tiền hoặc bị hải quan GACC trả về vì phát hiện sâu bệnh/kim loại nặng, bên nào được quyền truy cập vào toàn bộ nhật ký dữ liệu từ vườn đến lúc đóng cont?
* *Phản hồi thực địa:* Ai là trọng tài? Dữ liệu do ai xác thực được coi là bằng chứng pháp lý?

### Q3. E ngại về Nền tảng Đám mây (Cloud & Privacy Concerns)
* *Câu hỏi:* Chủ cơ sở có ngần ngại khi đưa thông tin sản lượng và hoá đơn lên phần mềm kết nối Internet không? (Lo ngại cơ quan thuế, lộ giá bán, lộ khách hàng)?
* *Yêu cầu lưu trữ:* Doanh nghiệp ưu tiên lưu trữ dữ liệu tại máy tính nội bộ của xưởng (Local-first / On-premise) hay chấp nhận lưu trên Cloud?

---

## 3. Ma Trận Phân Quyền Đề Xuất (Target RBAC Matrix for Pilot)

```
Roles:
1. GROWER (Nhà vườn): Chỉ xem và chỉnh sửa nhật ký vườn của chính mình; phê duyệt quota xuất hàng.
2. COOP_LEADER (Chủ nhiệm HTX): Xem tổng hợp các vườn thành viên trong HTX; không xem giá bán của vựa.
3. PACKHOUSE_CLERK (Thư ký chứng từ): Nhập hồ sơ cont, tải lên PDF Lab, đối chiếu trường dữ liệu.
4. PACKHOUSE_MGR (Chủ vựa / Giám đốc): Ký duyệt xuất xưởng, xem báo cáo toàn bộ chuỗi cung ứng của xưởng.
5. INSPECTOR / AUDITOR (Cán bộ kiểm dịch / Khách hàng): Chỉ xem chế độ Read-only các chứng chỉ đã được niêm phong mật mã (Immutable).
```
