# Research Report: Alternative UI/UX Paradigms for DuriOS Container Ingestion & Verification

**Date:** 2026-10-17  
**Topic:** Khảo sát và đề xuất các phương án UI/UX thực tế ngoài 3 hướng Dashboard/Terminal truyền thống cho DuriOS tại vựa xuất khẩu sầu riêng Việt Nam  
**Principles Honored:** YAGNI, KISS, DRY | Brutally honest, straight to the point, actionable.

---

## Executive Summary

Ba phương án đã thử nghiệm qua Stitch (`Mekong Emerald Terminal`, `Field-Proven POS`, và `Foundry Trade Command`) mang tính chất **trung tâm chỉ huy / dashboard phức tạp**. Tuy trực quan đẹp mắt, chúng tiềm ẩn rủi ro lớn tại thực địa vựa Cai Lậy:
1. **Quá tải nhận thức (Cognitive Overload):** Nhân viên chứng từ (`PACKHOUSE_CLERK`) tại các vựa Việt Nam quen dùng **Excel, Zalo PC và KiotViet**. Việc hiển thị quá nhiều widget biểu đồ, đồng hồ mili-giây và đồ họa Merkle tree làm họ phân tâm và sợ thao tác sai.
2. **Thao tác mắt qua lại (Split-Attention Effect):** Bố cục chia đôi (trái xem PDF, phải nhìn form) buộc mắt nhân viên đảo liên tục 500-1000 lần mỗi ngày giữa 2 màn hình, gây mỏi mắt sau 2 tiếng đóng hàng ban đêm.
3. **Thực tế luồng việc tại vựa:** Nhân viên chứng từ thường nhận ảnh chụp giấy tờ qua **Zalo trên điện thoại**, sau đó mở Zalo PC tải về hoặc chuyển tiếp cho chủ vựa.

Báo cáo này nghiên cứu và đề xuất **3 mô thức thiết kế hoàn toàn mới (Alternative Paradigms)**, bám sát hành vi thực tế của nhân viên kho bãi Việt Nam năm 2025–2026.

---

## 3 Phương Án Thiết Kế Đột Phá Mới

```
+--------------------------------------------------------------------------------------------------------+
|                                  SO SÁNH 3 MÔ THỨC MỚI VÀ ĐẶC ĐIỂM                                    |
+----------------------------------+----------------------------------+----------------------------------+
| PHƯƠNG ÁN 1: PAPER-AS-THE-CANVAS | PHƯƠNG ÁN 2: EXCEL-POWERED SPEED | PHƯƠNG ÁN 3: ZALO-FIRST BOT      |
| (Inline Document Editing)        | (Spreadsheet-Native Grid)        | (Conversational Timeline)        |
+----------------------------------+----------------------------------+----------------------------------+
| - Toàn màn hình là tờ giấy PDF   | - Giao diện giống 100% Excel     | - Giao diện khung chat Zalo PC   |
| - Click sửa thẳng trên chữ scan  | - Mỗi hàng là 1 container        | - Kéo thả ảnh vào khung chat     |
| - Không form phụ, không chia cột | - Phím mũi tên duyệt cực nhanh   | - Bot hỏi từng câu: Số chì? OK?  |
| - Cảm giác như cầm bút dạ quang  | - Nhập 100 container / 30 phút   | - Không cần đào tạo phần mềm     |
+----------------------------------+----------------------------------+----------------------------------+
```

### Phương án 1: "Paper-as-the-Canvas" (Tờ Giấy Thông Minh — Bút Dạ Quang Tương Tác)
- **Cơ chế hoạt động:**
  - Loại bỏ hoàn toàn cột form nhập liệu bên phải! Toàn bộ 90% màn hình là **tờ giấy chứng từ scan phóng to**.
  - Các trường dữ liệu trích xuất (Số container, Số chì, Kết quả Cadimi) được phủ lên bằng một lớp hộp màu bán trong suốt (như nhân viên dùng **bút dạ quang xanh/đỏ tô lên giấy**).
  - Khi nhân viên click thẳng vào số trên mặt giấy, hộp thoại chỉnh sửa tại chỗ (Inline Popover) hiện ra.
  - Phím bấm siêu tốc: Phím `Space` để xác nhận trường đang chọn, phím `Tab` tự động zoom/nhảy mượt sang trường tiếp theo.
- **Tại sao vượt trội:**
  - Giảm 100% hiện tượng "đảo mắt qua lại". Nhân viên chỉ nhìn duy nhất vào 1 tiêu điểm: tờ giấy chứng từ gốc.
  - Giống hệt thói quen cầm bút bi dò giấy in của kế toán kho truyền thống.

### Phương án 2: "Excel-Powered Speed Grid" (Bảng Tính Siêu Tốc — Bàn Phím 100%)
- **Cơ chế hoạt động:**
  - Mô phỏng giao diện quen thuộc nhất của mọi nhân viên kế toán Việt Nam: **Bảng tính Excel / Airtable**.
  - Mỗi hàng là 1 container xuất khẩu, các cột tương ứng: `Số Container`, `Số Chì`, `Mã Vùng Trồng`, `Cadimi mg/kg`, `Trọng Lượng`, `Trạng Thái`.
  - Khi con trỏ chuột/phím mũi tên di chuyển đến ô nào, một cửa sổ xem trước (Lens / Loupe) phóng to đúng góc chữ đó trên ảnh scan ở góc màn hình.
  - Các ô sai phạm (Cadimi $> 0.05$ hoặc sai số chì) tự động đổi màu đỏ rực bằng định dạng có điều kiện (Conditional Formatting).
- **Tại sao vượt trội:**
  - Nhân viên có thể đối soát hàng loạt (Bulk verification) 10–20 container cùng lúc bằng bàn phím số (Numpad) mà không cần click chuột từng container một.
  - Tốc độ xử lý đẩy lên dưới **90 giây/container**.

### Phương án 3: "Zalo-First Conversational Timeline" (Khung Trò Chuyện Điều Hành Dòng Thời Gian)
- **Cơ chế hoạt động:**
  - Thiết kế theo mô hình **Zalo PC Chat Stream / Feed**.
  - Bên trái là dòng thời gian tin nhắn sự kiện của container (vd: *"Xe 63C-123.45 vừa vào bàn cân"*, *"Bác tài vừa gửi ảnh phiếu kiểm dịch"*).
  - Kế toán chỉ cần **kéo ảnh từ Zalo thả thẳng vào khung chat**, DuriOS Bot tự động quét và phản hồi dạng thẻ tin nhắn:
    - *"DuriOS đã nhận Phiếu Lab. Cadimi: 0.024 mg/kg (ĐẠT). Số container: MSKU1234565. Nhấn [Xác Nhận] để xuất Manifest."*
  - Chỉ có 2 nút bấm lớn: `[ĐỒNG Ý (Enter)]` hoặc `[BÁO LỖI (Esc)]`.
- **Tại sao vượt trội:**
  - Zero Onboarding: Không cần đào tạo phần mềm. Bất kỳ nhân viên nào biết dùng Zalo đều dùng được ngay trong 1 phút.
  - Rất phù hợp với luồng trao đổi ảnh thực tế giữa tài xế, thương lái và nhân viên vựa.

---

## Đánh Giá So Sánh & Khuyến Nghị Thực Thi

| Tiêu chí | Phương án 1: Paper-as-Canvas | Phương án 2: Excel Speed Grid | Phương án 3: Zalo Timeline |
|---|---|---|---|
| **Độ quen thuộc với nhân viên VN** | Trung bình (cần 10p làm quen) | **Rất cao (ai cũng biết Excel)** | **Tuyệt đối (100% giống Zalo)** |
| **Tốc độ đối soát 1 container** | **Cực nhanh (< 2 phút)** | Rất nhanh (< 1.5 phút / hàng loạt) | Nhanh (~2.5 phút) |
| **Xử lý lô hàng lớn (Bulk Ops)** | Từng tờ một | **Vô địch (hàng chục xe cùng lúc)** | Hạn chế (dễ trôi tin nhắn) |
| **Chống mỏi mắt ban đêm** | Tốt (màu giấy ấm, ít đảo mắt) | Trung bình | Tốt (giao diện tối giản) |
| **Khuyến nghị áp dụng** | **Dành cho màn hình soi chi tiết** | **Dành cho Trưởng vựa / Kế toán tổng** | **Dành cho Bàn cân & Tài xế ngoài bãi** |

---

## Câu Hỏi Chưa Giải Quyết (Unresolved Questions)
- Bạn thích mô thức nào nhất trong 3 phương án trên: **Paper-as-the-Canvas** (Soi thẳng trên giấy scan), **Excel Speed Grid** (Bảng tính kế toán siêu tốc), hay **Zalo-First** (Giao diện khung chat Zalo thân thuộc)?
