# DuriOS Tầm Nhìn Chiến Lược Sản Phẩm V2 (Product Vision v2.0)

**Mã tài liệu:** `docs/product-direction/PRODUCT-VISION-V2.md`  
**Ngày cập nhật:** 2026-10-17  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW** (Dự thảo chờ Founder phê duyệt)  
**Tài liệu baseline được phê duyệt:** `docs/product-direction/PRODUCT-PRD-V1.md` (APPROVED — Founder approval, 2026-10-14)  
**Thứ bậc bằng chứng:** `PROPOSAL` dựa trên `FOUNDER_STRATEGIC_DIRECTION` mới; không thay thế `APPROVED_BASELINE` cho đến khi có quyết định bằng văn bản.

---

## 1. Chỉ Đạo Chiến Lược Của Founder: Verified Durian Trade Network

### 1.1. Tầm nhìn chiến lược
> **Chỉ đạo của Founder:** *“DuriOS là GRAB trong lĩnh vực chuỗi giá trị sầu riêng xuất khẩu khu vực Đông Nam Á.”*

### 1.2. Định nghĩa lại về mặt kiến trúc & kinh tế học
> **DuriOS = Verified Durian Trade Network**  
> Hệ điều hành biến một container sầu riêng từ tập hợp hàng hóa + giấy tờ rời rạc thành một **giao dịch xuất khẩu có thể kiểm chứng, điều phối và giao dịch được**.

Ẩn dụ với Grab chỉ đúng khi hiểu ở cấp độ kiến trúc: điều phối nhiều phía của thị trường (growers/packhouses ↔ buyers/importers ↔ labs/logistics) dựa trên lòng tin có thể xác minh, rồi mở rộng sang các dịch vụ giao dịch và tài chính trong cùng hệ sinh thái.

### 1.3. Đơn vị nguyên tử (Atomic Business Unit)
Đơn vị tương đương một “chuyến Grab” **không phải một trái sầu riêng và cũng không phải một đơn hàng trên marketplace**. Đơn vị nguyên tử bắt buộc là:
**Verified Export Shipment / Verified Container.**

Hệ thống phải trả lời được câu hỏi cốt lõi:
*Hàng từ đâu → ai chịu trách nhiệm → mã vùng trồng nào → vựa nào → kết quả kiểm nghiệm nào → chứng từ nào → container nào → seal nào → ai xác minh → phiên bản dữ liệu nào → thay đổi lúc nào → ai được phép xem → cuối cùng giao dịch có hoàn tất hay phát sinh sự cố.*

### 1.4. Trình tự tiến hóa chiến lược (Mandatory Sequencing)
Tuyệt đối không xây “sàn sầu riêng” ngay lập tức. Thứ tự bắt buộc:
$$\text{System of Record} \longrightarrow \text{System of Verification} \longrightarrow \text{Closed Network} \longrightarrow \text{Transaction Network} \longrightarrow \text{Regional Infrastructure}$$

---

## 2. 11 Thực Thể Lõi (Core Shipment Ontology)

Thay vì hard-code quy trình riêng biệt của từng nước, DuriOS chuẩn hóa mô hình dữ liệu (Ontology) dùng chung cho toàn bộ chuỗi xuất khẩu ASEAN, sau đó kết nối qua các **Country Compliance Adapters** (`VN -> CN`, `MY -> CN`, `TH -> CN`, `PH -> CN`):

| Entity lõi | Ý nghĩa thương mại & dữ liệu |
|---|---|
| **Organization** | Vùng trồng, vựa, exporter, importer, lab kiểm nghiệm, đơn vị vận tải lạnh. |
| **Production Source** | Mã số vùng trồng (PUC), orchard đăng ký và nguồn gốc lô hàng. |
| **Lot** | Lô hàng vật lý được thu gom, phân loại, cắt gọt, đóng gói. |
| **Test Evidence** | Phòng lab đạt chuẩn, mẫu thử, kết quả phân tích (Cadmium, Vàng O), chữ ký xác nhận. |
| **Document** | Hồ sơ thương mại/hải quan/kiểm dịch (Packing List, Phyto, CO) và lịch sử phiên bản. |
| **Container** | Số container chuẩn ISO 6346, sự kiện đóng hàng, nhiệt độ bảo quản. |
| **Seal** | Số chì hải quan, người niêm phong, thời điểm khóa niêm phong. |
| **Custody Event** | Bằng chứng bàn giao trách nhiệm giữa các bên (vựa ↔ xe lạnh ↔ cửa khẩu ↔ cảng). |
| **Exception** | Cảnh báo sai lệch container, sai seal, quá hạn lab, vượt ngưỡng cadmium, sai nguồn gốc. |
| **Trade** | Người mua, người bán, số lượng, điều khoản thương mại (Incoterms), trạng thái. |
| **Permission** | Chính sách phân quyền: tổ chức nào được phép xem trường dữ liệu nào (Selective Disclosure). |

---

## 3. Thang Lợi Thế Cạnh Tranh Thực Sự (The Moat Ladder)

Truy xuất nguồn gốc đơn thuần đang trở thành hạ tầng cơ bản của cơ quan quản lý (Bộ NN&MT đã triển khai hệ thống quốc gia). Bốn tuyên bố sau **không đủ làm moat**: *“All-in-one”, “AI”, “Blockchain”, “Marketplace sầu riêng”*.

Moat bền vững của DuriOS leo theo 6 bậc:
1. **Workflow Moat:** Thấu hiểu sâu sắc quy trình vận hành thực tế tại bàn cân vựa, ai duyệt gì, lỗi thường xảy ra ở đâu lúc 2 giờ sáng.
2. **Evidence Moat:** Mỗi trường dữ liệu quan trọng đều có nguồn gốc, con người xác nhận, dấu thời gian và bằng chứng chống giả mạo (tamper-evident SHA-256).
3. **Outcome Moat:** Tập dữ liệu phản ánh mối liên hệ: `input evidence → shipment decision → export outcome → exception/dispute`.
4. **Reputation Moat:** Chỉ số uy tín khách quan (`DuriOS Verified Profile`) dựa trên hành vi thực tế (tỷ lệ lỗi seal, thời gian sẵn sàng chứng từ, tỷ lệ tranh chấp), không phải đánh giá sao tự khai.
5. **Network Moat:** Vựa ở lại vì có Verified Buyers; Người mua ở lại vì có nguồn hàng Verified; Lab và logistics tham gia vì có lưu lượng giao dịch.
6. **Regulatory Adapter Moat:** Kiến trúc adapter đa quốc gia cho phép mở rộng sang Malaysia, Thái Lan mà không cần viết lại lõi hệ thống.

---

## 4. Năm Mục Tiêu Cấm Đoán Tuyệt Đối (Anti-Goals)

1. **Không cạnh tranh với Nhà nước bằng generic traceability:** Hệ thống DuriOS tập trung vào độ tin cậy của giao dịch xuất khẩu và kiểm toán thương mại, không làm portal tem truy xuất đại trà.
2. **Không gọi blockchain là moat:** Tính toàn vẹn mật mã học SHA-256 nội bộ và chữ ký số có giá trị pháp lý và hiệu năng thực tế cao hơn công nghệ sổ cái phân tán quảng cáo rầm rộ.
3. **Không giữ tiền khách hàng (Zero-Custody):** Tuân thủ tuyệt đối Nghị định 52/2024/NĐ-CP và Luật TMĐT 122/2025/QH15; toàn bộ tiền hàng phải do ngân hàng được cấp phép nắm giữ.
4. **Không tuyên bố đảm bảo thông quan:** DuriOS là công cụ đối soát kỹ thuật nội bộ, quyết định thông quan thuộc thẩm quyền hải quan và cơ quan kiểm dịch hai nước.
5. **Không mở public marketplace trước khi closed network chứng minh được thanh khoản:** Mọi giao dịch giai đoạn đầu phải diễn ra trong các phòng giao dịch kín được xác minh (`Verified Trade Rooms`).
