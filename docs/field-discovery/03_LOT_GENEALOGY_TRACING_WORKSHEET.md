# DuriOS Field Discovery: Lot Genealogy Tracing Worksheet
## Phiếu Điều Tra Phả Hệ Lô Hàng Sầu Riêng Xuất Khẩu (Traceability Lineage)

**Phiếu số:** `GEN-YYYYMMDD-LOT-XXX`  
**Container Mục Tiêu:** `[Số Container ISO - ví dụ: MSKU1234565]`  
**Số Niêm Phong (Seal No):** `[Ví dụ: SEAL-VN-99281]`  
**Cơ Sở Đóng Gói (Packhouse):** `[Tên cơ sở & Mã PPHC - Packaging Facility Code]`  
**Thị Trường Đích:** Trung Quốc (Đường bộ: Cửa khẩu Hữu Nghị / Tân Thanh / Lào Cai)  

---

## 1. Sơ Đồ Phả Hệ Chuỗi Lô Hàng (Genealogy Hierarchy Graph)

```
[Mã số Vùng trồng - PUC] ---> [Lô cắt tại vườn] ---> [Xe tải trung chuyển]
        (VN-TG-001)                (Batch B1)             (Xe 63C-123.45)
                                        |
                                        v
                            [Tiếp nhận xưởng đóng gói]
                               (Packhouse Lot PL-99)
                                        |
                 +----------------------+----------------------+
                 |                                             |
         [Loại 1 - Xuất khẩu]                          [Loại 2 / Dạt nội địa]
            (Grade A / B)                                  (Grade C / Chợ)
                 |                                             |
                 v                                             v
       [Đóng thùng 18kg]                             [Bán sỉ trong nước]
   (Carton Barcode / Serial)
                 |
                 v
   [Stuffing Reefer Container]
      (ISO Cont: MSKU1234565)
                 |
                 +---> [Phiếu kiểm nghiệm Cadmium: LAB-2026-XXXX]
                 +---> [Chứng thư kiểm dịch: PHYTO-VN-XXXXX]
                 +---> [Tờ khai hải quan: CD-XXXX-XXXX]
```

---

## 2. Bảng Đối Soát Tính Toàn Vẹn Của Lô Hàng (Integrity Matrix)

| Cấp độ truy xuất (Node Level) | Định danh thực tế (Identifier) | Căn cứ xác minh (Supporting Document) | Tồn tại cơ chế chống trộn lẫn? (Segregation Safeguard) | Phát hiện lỗ hổng phả hệ (Genealogy Gap) |
|---|---|---|---|---|
| **Cấp 1: Vườn / Cây trồng** | Mã số vùng trồng (PUC): `..........` Diện tích: `......` ha | Giấy chứng nhận MSVT còn hiệu lực | Có gắn mã QR / màu sơn theo dõi luống? `[ ] Có / [ ] Không` | Nhiều vườn chung 1 mã PUC; không rõ quả từ lô nào |
| **Cấp 2: Thu hái & Cân sọt** | Mã lô hái: `..........` Ngày cắt: `../../....` | Phiếu cân / Sổ tay thợ cắt | Phân biệt sọt theo vườn? `[ ] Có / [ ] Không` | Đổ dồn nhiều sọt từ các vườn khác nhau lên thùng xe |
| **Cấp 3: Vận chuyển nội địa** | Biển số xe tải: `..........` Trọng lượng: `......` kg | Giấy giao nhận / Cân bàn trạm | Xe chạy thẳng về xưởng hay ghé điểm trung chuyển khác? | Không có seal niêm phong thùng xe nội địa |
| **Cấp 4: Đóng gói tại xưởng** | Mã lô nội bộ xưởng: `..........` Ca làm việc: `......` | Sổ theo dõi đóng thùng xưởng | Trong cùng ca có đóng hàng cho mã PUC khác không? | Công nhân dán nhầm tem thùng của lô hàng trước |
| **Cấp 5: Kiểm nghiệm Lab** | Mã mẫu Lab: `..........` Ngày lấy mẫu: `../../....` | Phiếu kết quả kiểm nghiệm (Lab Report) | Quả mẫu lấy từ thùng nào trong cont? Có chụp ảnh lưu vết? | Mẫu gửi đi là quả chọn sẵn, không lấy ngẫu nhiên |
| **Cấp 6: Reefer Container** | Số Cont: `................` Số Seal: `................` | Tờ khai hải quan & Packing List | Bấm seal ngay tại cửa xưởng hay tại bãi tập kết? | Số seal ghi trên bản thảo Phyto khác với seal thực tế |

---

## 3. Quy Tắc Tách / Ghép Lô Hàng (Split & Merge Tracking)

1. **Hiện tượng Ghép Lô (Lot Merge):**
   - Một container (khoảng 900 - 950 thùng, ~18 tấn) được thu gom từ bao nhiêu mã số vùng trồng khác nhau?
   - Nếu có từ 2 mã PUC trở lên trong 1 container: Tỷ lệ phân bổ kg giữa các mã được quản lý bằng cách nào?

2. **Hiện tượng Tách Lô (Lot Split):**
   - Sản lượng 1 vườn (ví dụ 30 tấn) bị chia sang 2 container khác nhau: Làm thế nào hồ sơ truy xuất liên kết lại được nguồn gốc gốc ban đầu nếu 1 trong 2 cont bị cảnh báo tại biên giới?

---

## 4. Đánh Giá Độ Rủi Ro Mất Dấu Vết (Audit Risk Conclusion)
- **Mức độ đứt gãy phả hệ tại thực địa:**  
  `[ ] NGHIÊM TRỌNG (Không thể truy ngược quả trong thùng về đúng cây/vườn)`  
  `[ ] TRUNG BÌNH (Chỉ truy được đến cấp xã/hợp tác xã, không tới từng hộ)`  
  `[ ] THẤP (Kiểm soát chặt chẽ từng sọt có mã định danh)`  
- **Khuyến nghị kiến trúc hệ thống (Software Implication):**  
  `................................................................................................................`
