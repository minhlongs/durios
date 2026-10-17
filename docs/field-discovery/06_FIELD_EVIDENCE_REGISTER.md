# DuriOS Field Discovery: Field Evidence Register
## Sổ Đăng Ký & Theo Dõi Bằng Chứng Thực Địa (Canonical Evidence Register)

**Version:** 2.0.0 (Command #11 Verified)  
**Trạng thái hiện tại:** `READY_FOR_EXECUTION` (Chưa có dữ liệu - Tuyệt đối không bịa đặt số liệu hoặc tiếp xúc giả).  
**Nguyên tắc chuỗi hành trình chứng cứ (Chain of Custody):**
- Mỗi dòng ghi nhận 01 phát hiện/quan sát/tuyên bố cụ thể.
- Mọi tài liệu số hoặc ảnh chụp phải được ghi lại mã băm (SHA256).
- Mọi phát biểu phải phân loại rõ ràng theo 7 nhóm bằng chứng, không suy diễn hoặc mập mờ giữa lời kể miệng và sự thật quan sát được.

---

## 1. Phân Loại 7 Nhóm Bằng Chứng (Evidence Taxonomy)

1. `[DIRECT_OBSERVATION]`: Thực tế được điều tra viên tận mắt chứng kiến tại xưởng/vườn (ví dụ: thư ký gõ lại số seal từ giấy nháp vào máy tính mất 5 phút).
2. `[PARTICIPANT_STATEMENT]`: Tuyên bố bằng lời nói của người được phỏng vấn (ví dụ: "Cont trước bị hải quan giữ 2 ngày do sai mã số").
3. `[DOCUMENTARY_EVIDENCE]`: Bằng chứng bằng văn bản, chứng từ giấy hoặc tệp tin điện tử (ví dụ: ảnh chụp phiếu kết quả kiểm nghiệm Cadmium, packing list).
4. `[FOUNDER_INTERPRETATION]`: Diễn giải, giả thuyết hoặc phân tích chủ quan của founder/điều tra viên.
5. `[UNVERIFIED_ASSUMPTION]`: Giả định lý thuyết chưa được kiểm chứng tại hiện trường.
6. `[CONTRADICTORY_EVIDENCE]`: Bằng chứng thực tế mâu thuẫn hoặc phủ định lại giả định ban đầu (ví dụ: chủ vựa cho biết dịch vụ hải quan lo trọn gói không bao giờ bị phạt).
7. `[MISSING_EVIDENCE]`: Bằng chứng cần thiết nhưng bị cơ sở từ chối cung cấp hoặc không thể tiếp cận.

---

## 2. Bảng Đăng Ký Bằng Chứng Thực Địa (Evidence Register Schema)

| Evidence ID | Ngày | Đối tượng tiếp xúc (Ẩn danh) | Địa điểm | Nội dung phát hiện / Tuyên bố | Loại bằng chứng (1 trong 7 loại) | Mã tham chiếu tài liệu / Artifact Hash | Tình trạng đồng ý (Consent Status) | Độ tin cậy & Hạn chế | Hành động tiếp theo |
|---|---|---|---|---|---|---|---|---|---|
| `EVD-001` | *Pending* | Thư ký chứng từ vựa #1 | Cai Lậy, Tiền Giang | *Chờ ghi nhận* | `[DIRECT_OBSERVATION]` | `SHA256:...` | Đồng ý ghi âm | Cần đối chiếu chéo với chủ vựa | Phỏng vấn chủ vựa |
| `EVD-002` | *Pending* | Chủ vựa #1 (Budget Holder) | Cai Lậy, Tiền Giang | *Chờ ghi nhận* | `[PARTICIPANT_STATEMENT]` | `Audio:...` | Đồng ý ghi âm | Lời khai miệng, cần xem hoá đơn phạt | Đề nghị xem biên lai bãi xe |
| `EVD-003` | *Pending* | Bộ chứng từ cont xuất khẩu gần nhất | Cai Lậy, Tiền Giang | *Chờ ghi nhận* | `[DOCUMENTARY_EVIDENCE]` | `DOC-SHA256:...` | Đã che thông tin nhạy cảm | Hồ sơ thực tế của 1 cont duy nhất | Kiểm tra tính nhất quán mã seal |
| `EVD-004` | *Pending* | Đại lý forwarder cửa khẩu Hữu Nghị | Lạng Sơn (Phone) | *Chờ ghi nhận* | `[CONTRADICTORY_EVIDENCE]` | `Audio:...` | Đồng ý ghi âm | Quan điểm từ bên làm dịch vụ | Đối chiếu quy định hải quan |
| `EVD-005` | *Pending* | Ban quản trị HTX sầu riêng | Krông Pắc, Đắk Lắk | *Chờ ghi nhận* | `[DIRECT_OBSERVATION]` | `Photo:...` | Đồng ý chụp sổ tay | Chỉ phản ánh quy mô 1 HTX | Đối chiếu hạn mức PUC |

---

## 3. Nhật Ký Chi Tiêu Thực Địa (Field Expenditure Ledger - Tranche 1: Cap 7,500,000 VND)

*Nguyên tắc: Chỉ ghi nhận chi phí thực tế khi đã phát sinh và có hoá đơn/chứng từ hợp lệ cung cấp bởi Founder.*

| Ngày | Khoản mục chi | Mục đích (Liên kết Evidence ID) | Chứng từ kèm theo (Hoá đơn/Phiếu thu) | Số tiền (VND) | Người chi | Người duyệt |
|---|---|---|---|---|---|---|
| *Pending* | Vé xe liên tỉnh / Xăng xe | Di chuyển Cai Lậy & Krông Pắc | Vé xe / Hoá đơn xăng VAT | 0 | Founder | Audit Controller |
| *Pending* | Lưu trú cơ bản | 4 đêm công tác thực địa | Hoá đơn khách sạn / nhà nghỉ | 0 | Founder | Audit Controller |
| *Pending* | Công tác phí / Ăn uống | Chi phí ăn uống 5 ngày | Phiếu thu / Hoá đơn ăn uống | 0 | Founder | Audit Controller |
| *Pending* | In ấn tài liệu & Văn phòng phẩm | In bộ câu hỏi & biên bản che mờ | Hoá đơn tiệm photo | 0 | Founder | Audit Controller |
| **TỔNG ĐÃ CHI** | | | | **0** | | |
| **HẠN MỨC CÒN LẠI** | **7,500,000 VND** | | | | | |
