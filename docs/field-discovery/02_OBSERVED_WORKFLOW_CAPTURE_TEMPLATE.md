# DuriOS Field Discovery: Observed-Workflow Capture Template
## Biểu Mẫu Ghi Nhận Quy Trình Thực Tế Tại Hiện Trường

**Mã quan sát (Observation ID):** `OBS-YYYYMMDD-LOC-XXX`  
**Địa điểm (Location):** Vườn / HTX / Xưởng đóng gói / Cửa khẩu (Ghi rõ Huyện, Tỉnh)  
**Thời gian quan sát (Timestamp):** Từ `[HH:MM]` đến `[HH:MM]`, Ngày `[DD/MM/YYYY]`  
**Người quan sát (Observer):** `[Họ tên / Vai trò]`  
**Chủ thể được quan sát (Subject):** `[Tên cơ sở / Mã định danh nội bộ]`  

---

## 1. Bảng Khảo Sát Quy Trình Chuỗi Cung Ứng (Supply Chain Steps)

| Bước | Quy trình lý thuyết (Assumed) | Quy trình thực tế ghi nhận (Observed Reality) | Công cụ sử dụng (Tool/Medium) | Người thực hiện (Role) | Rủi ro sai lệch (Failure Mode) | Bằng chứng thu thập (Artifact ID) |
|---|---|---|---|---|---|---|
| **1. Thu hoạch vườn (Harvest)** | Cắt theo độ chín, gắn mã QR từng cây/vườn | | Sổ tay / Sơn xịt / Giấy dán | Thợ cắt / Chủ vườn | Lẫn lộn quả chưa đạt tuổi, cắt trộm | Ảnh chụp trái / Cuống |
| **2. Cân & Giao nhận (Weighing & Dispatch)** | Cân điện tử, in phiếu cân có mã số vùng trồng | | Cân đồng hồ cơ / Cân bàn | Thương lái / Chủ vườn | Sai lệch trọng lượng, gian lận số ký | Phiếu ghi cân giấy |
| **3. Vận chuyển về vựa (Transit to Packhouse)** | Xe tải thùng lạnh có niêm phong | | Xe tải mui bạt hở | Tài xế | Dập gai, nhiệt độ quả tăng cao | Ảnh thùng xe / Giấy đường |
| **4. Làm sạch & Xử lý nấm (Cleaning & Dip)** | Bể sục ozone, xử lý rệp sáp chuẩn quy chuẩn | | Thau nhúng hoá chất / Xịt hơi | Công nhân xưởng | Tồn dư hoá chất, rệp còn sót kẽ gai | Video/Ảnh khu xử lý |
| **5. Phân loại & Dán tem (Grading & Labeling)** | Phân size điện tử, dán tem QR truy xuất GACC | | Gõ nghe âm thanh / Cân tay | Thợ phân loại (Master grader) | Dán nhầm tem MSVT, lẫn loại B vào A | Mẫu tem truy xuất |
| **6. Đóng thùng & Lưu kho (Boxing & Pre-cooling)** | Thùng carton 18-19kg, kho lạnh 13-15°C | | Thùng xốp / Thùng giấy | Công nhân đóng thùng | Quá nhiệt hoặc quá lạnh làm sượng | Mẫu nhãn thùng |
| **7. Lấy mẫu phân tích (Lab Sampling)** | Cơ quan kiểm nghiệm lấy mẫu ngẫu nhiên đại diện | | Xưởng tự gửi quả mẫu đi test | Quản lý xưởng / KTV Lab | Mẫu test không đại diện cho cả cont | Biên bản lấy mẫu |
| **8. Đóng container & Bấm seal (Stuffing & Sealing)** | Container lạnh ISO, giám sát nhiệt độ 24/7 | | Xếp tay thủ công vào cont | Đội bốc xếp / Tài xế xe lạnh | Sai số container/seal so với Phyto | Ảnh chụp Seal & Cont |
| **9. Kiểm dịch thực vật (Phyto Inspection)** | Cán bộ Chi cục kiểm tra tại xưởng trước khi niêm phong | | Kiểm tại trạm / Kiểm hồ sơ | Cán bộ kiểm dịch / Dịch vụ | Chậm trễ hồ sơ, mẫu lưu không khớp | Bản thảo Phyto |
| **10. Thông quan cửa khẩu (Border Clearance)** | Truyền dữ liệu hải quan điện tử, soi chiếu cont | | Nộp hồ sơ giấy tại luồng cửa khẩu | Đại lý hải quan (Forwarder) | Ách tắc luồng đỏ, chờ kết quả test | Phiếu tiếp nhận HQ |

---

## 2. Ghi Nhận Điểm Nghẽn & Độ Trễ Thời Gian (Bottleneck & Latency Log)

1. **Khoảng cách thời gian (Time Elapsed):**
   - Từ lúc cắt quả tại cây đến khi đưa vào kho mát: `........` giờ.
   - Từ lúc gửi mẫu Lab đến khi nhận file PDF kết quả: `........` giờ.
   - Từ lúc hoàn thành đóng cont đến khi có Chứng thư Kiểm dịch: `........` giờ.
   - Thời gian xe cont chờ tại bãi cửa khẩu đến khi qua barie phía Trung Quốc: `........` giờ.

2. **Các điểm can thiệp thủ công (Manual Intervention Points):**
   - Có bao nhiêu lần dữ liệu phải gõ lại bằng tay từ giấy sang Zalo / Excel / Phần mềm?
   - Ai là người chịu trách nhiệm cuối cùng nếu số liệu giữa các bên không khớp?

---

## 3. Xác Nhận Của Điều Tra Viên (Field Investigator Sign-off)
- **Độ tin cậy của thông tin quan sát:** `[ ] CAO (Tận mắt chứng kiến) / [ ] TRUNG BÌNH (Đối chiếu qua sổ sách) / [ ] THẤP (Nghe kể lại)`
- **Ghi chú đặc biệt tại hiện trường:**  
  `................................................................................................................`
