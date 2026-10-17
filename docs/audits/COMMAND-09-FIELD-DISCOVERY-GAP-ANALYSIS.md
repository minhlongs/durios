# DuriOS Field Discovery Red Team: Document Gap Analysis & Gate Reconciliation
## Supreme Command #09: Deliverable 6 — Field Discovery Instruments Audit (Phase G)

**Audit Target:** 8 instruments in `docs/field-discovery/` (01 through 08) prepared under Supreme Command #08.  
**Objective:** Adversarially review every interview question, workflow metric, lot tracing standard, data ownership assumption, WTP guide, evidence register, report template, and gating criterion.

---

## 1. Document-by-Document Gap & Flaw Analysis

### Document 01: Stakeholder Interview Guide (`01_STAKEHOLDER_INTERVIEW_GUIDE.md`)
* **Critique & Flaws:**
  - *Leading Questions (Câu hỏi định hướng):* Phần phỏng vấn chủ vựa hỏi: *"Anh/chị có gặp rủi ro bị giữ cont vì sai số seal không?"* $\rightarrow$ Dễ nhận được câu trả lời xã giao *"Có, mệt lắm"*, tạo ra tín hiệu giả về mức độ nghiêm trọng (False Pain Signal).
  - *Omission (Thiếu sót):* Chưa có câu hỏi phân loại cơ cấu pháp lý của vựa: Vựa là cơ sở thu mua cho công ty xuất khẩu lớn, hay chính vựa là pháp nhân đứng tên tờ khai hải quan? (Người chịu rủi ro pháp lý khác với người thực hiện đóng hàng).

### Document 02: Observed Workflow Capture Template (`02_OBSERVED_WORKFLOW_CAPTURE_TEMPLATE.md`)
* **Critique & Flaws:**
  - *Impractical Data Precision:* Yêu cầu bấm giờ chi tiết đến từng giây cho từng khâu (ví dụ: gõ số seal mất bao nhiêu giây) trong điều kiện xưởng đóng hàng ban đêm ồn ào, bụi bặm, áp lực xe container phải chạy lúc 2-3 giờ sáng để kịp giờ lên biên giới là phi thực tế.
  - *Correction:* Điều tra viên chỉ nên đo tổng thời gian thư ký lập xong 1 bộ chứng từ (Dossier Completion Time) và đếm số lần phải sửa đổi chứng từ (Correction Frequency).

### Document 03: Lot Genealogy Tracing Worksheet (`03_LOT_GENEALOGY_TRACING_WORKSHEET.md`)
* **Critique & Flaws:**
  - *Impractical Traceability Assumption:* Giả định rằng 1 container sầu riêng tươi có thể truy xuất phả hệ rành mạch 1:1 từ từng trái đến từng cây hoặc từng thửa vườn.
  - *Field Reality:* Thực tế sầu riêng cắt từ 3 - 5 vườn khác nhau trong cùng 1 xã thường được đổ chung vào bồn sục rửa ozone/nước clo, sau đó phân loại hàng loại A, B, C rồi đóng thùng dán tem chung mã PUC của HTX. Việc truy xuất 1 trái về đúng chủ vườn cá thể trong cont là bất khả thi nếu không có tem mã vạch dán tại từng gốc cây.

### Document 04: Data Ownership & Permissions Questionnaire (`04_DATA_OWNERSHIP_AND_PERMISSIONS_QUESTIONNAIRE.md`)
* **Critique & Flaws:**
  - *Sensitive Information Friction:* Đặt câu hỏi trực diện: *"Hiện tại có tình trạng mượn mã vùng trồng (PUC lending fraud) không?"* $\rightarrow$ Đối tượng phỏng vấn sẽ lập tức cảnh giác, phòng thủ hoặc từ chối tiếp chuyện vì sợ bị thanh tra thuế/kiểm dịch.
  - *Correction:* Cần chuyển sang câu hỏi trung tính: *"Khi sản lượng thực tế tại vườn liên kết vượt quá hoặc thiếu hụt so với hạn mức đăng ký ban đầu, vựa và HTX thường phối hợp thủ tục như thế nào?"*

### Document 05: Willingness-to-Pay Guide (`05_WILLINGNESS_TO_PAY_INTERVIEW_GUIDE.md`)
* **Critique & Flaws:**
  - *Hypothetical Bias (Bẫy trả lời giả định):* Phương pháp Van Westendorp trên câu hỏi lý thuyết thường cho ra mức giá kỳ vọng rẻ phi thực tế hoặc chủ doanh nghiệp gật đầu đồng ý nhưng khi đưa hợp đồng thì từ chối ký.
  - *Correction:* Bắt buộc kiểm chứng bằng **Cam kết có rủi ro (Skin-in-the-game Commitments)**: Yêu cầu đặt cọc thử nghiệm (Pilot Deposit) tối thiểu 2,500,000 - 5,000,000 VND kèm cam kết hoàn tiền nếu không bắt được lỗi chứng từ.

### Document 06: Field Evidence Register (`06_FIELD_EVIDENCE_REGISTER.md`)
* **Critique & Flaws:**
  - *Unpopulated Schema:* Hiện tại bảng hoàn toàn trống (`READY_FOR_EXECUTION`). Đây là trạng thái trung thực (không bịa đặt bằng chứng giả), nhưng cần có hướng dẫn kiểm soát mã băm (SHA256) cho các tệp ghi âm và ảnh chụp để đảm bảo tính chuỗi hành trình chứng cứ (Chain of Custody).

### Document 07: Field Discovery Report Template (`07_FIELD_DISCOVERY_REPORT_TEMPLATE.md`)
* **Critique & Flaws:**
  - Cần bổ sung mục phân tích đối chiếu giữa luồng thông quan chính ngạch qua phần mềm và thực trạng dịch vụ "Bao luật trọn gói tại cửa khẩu". Nếu "bao luật" giải quyết được 100% sai lệch chứng từ, giá trị của DuriOS bằng 0.

### Document 08: Explicit GO / HOLD / STOP Criteria (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md`)
* **Critique & Flaws:**
  - Có sự mâu thuẫn về ngưỡng giữa các tài liệu trước đây:
    - *Audit-03 Draft:* Đòi hỏi 15 cơ sở phỏng vấn, 1 ký hợp đồng năm 60M VND.
    - *Document 08:* Đòi hỏi 03 cơ sở cho quan sát thực tế, 01 ký thỏa thuận nguyên tắc (LOI) pilot 5 container (2.5M - 5M VND), 03 bộ hồ sơ ẩn danh thực tế.
  - *Cần chuẩn hóa:* Không thể đòi hỏi hợp đồng năm 60M VND ngay trong giai đoạn khảo sát 5 ngày với ngân sách 7.5M VND.

---

## 2. Canonical Gate Reconciliation Recommendation (PROPOSED)

Để giải quyết xung đột giữa các tài liệu và bảo toàn kỷ luật vốn, đề xuất **Chuẩn hóa Bộ Tiêu Chí Cổng Giai Đoạn (Canonical Gate Definition - PROPOSED)** như sau:

| Tiêu chí | Audit-03 Giả định cũ | Document 08 Hiện tại | **Đề xuất Chuẩn hóa Canonical Gate (PROPOSED)** | Lý do điều chỉnh |
|---|---|---|---|---|
| **Số cơ sở tiếp cận** | 15 vựa | 15 cơ sở tiếp xúc | **10 - 15 cơ sở tiếp xúc (tối thiểu 03 vựa cho vào xưởng quan sát)** | Chất lượng quan sát sâu 3 vựa vượt trội so với 15 cuộc trò chuyện xã giao lướt qua. |
| **Cam kết thương mại** | Ký Hợp đồng năm 60M VND | 01 LOI pilot 5 cont (2.5M - 5M VND) | **01 Bản Thỏa thuận Nguyên tắc (LOI) Pilot 5 container có điều kiện cọc 2,500,000 - 5,000,000 VND (hoàn tiền 100%)** | LOI không cọc không chứng minh được WTP; Hợp đồng năm 60M VND là bất khả thi khi chưa có sản phẩm chạy thử. |
| **Dữ liệu thực tế** | Không quy định số lượng | 03 bộ hồ sơ ẩn danh | **Tối thiểu 02 bộ hồ sơ xuất khẩu thực tế ẩn danh hoàn chỉnh (Lab, Packing List, Phyto nháp, Tờ khai)** | Cần dữ liệu thực để kiểm thử bộ quy tắc và độ chính xác của schema trước khi code. |
| **Kỷ luật vốn** | 35M VND / 90 ngày | 7.5M VND / Tranche 1 | **Chi tiêu thực tế $\le$ 7,500,000 VND có đầy đủ hoá đơn hợp lệ; Không giải ngân Tranche 2 nếu thiếu điều kiện trên** | Bảo toàn vốn, phòng ngừa rủi ro tự huyễn hoặc về nhu cầu thị trường. |
