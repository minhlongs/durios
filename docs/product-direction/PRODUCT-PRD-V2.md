# DuriOS Bản Yêu Cầu Sản Phẩm V2 (Product Requirements Document v2.0)

**Mã tài liệu:** `docs/product-direction/PRODUCT-PRD-V2.md`  
**Ngày phát hành dự thảo:** 2026-10-17  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW**  
**Tài liệu baseline phê duyệt hiện hành:** `docs/product-direction/PRODUCT-PRD-V1.md` (APPROVED — Founder approval, 2026-10-14)  
**Thứ bậc bằng chứng:** `PROPOSAL` / `DRAFT` — PRD-V1 tiếp tục là căn cứ vận hành duy nhất cho tới khi Founder phê duyệt bằng văn bản.

---

## 1. Bài Toán Nghiệp Vụ Cần Giải Quyết (Problem Statements)

### 1.1. Vựa đóng gói & Doanh nghiệp xuất khẩu (Chủ thể trọng tâm)
- **Rủi ro sai lệch dữ liệu kẹp chì và container:** Các chứng từ (Packing List, Phyto, Kiểm nghiệm, Hóa đơn) được soạn thảo thủ công bởi nhiều bộ phận hoặc phòng lab gửi về. Sai lệch 1 chữ số trong mã số container (ISO 6346) hoặc số seal dẫn đến container bị kẹt tại cửa khẩu Hữu Nghị / Tân Thanh từ 3–7 ngày, gây phát sinh chi phí điện lạnh (2–3 triệu VND/ngày) và nguy cơ hỏng múi sầu riêng.
- **Rủi ro vượt ngưỡng kim loại nặng (Cadimi GB 2762-2022):** Giới hạn tối đa cadimi của Trung Quốc là $0.05\text{ mg/kg}$. Nhân viên văn phòng vựa phải kiểm tra thủ công phiếu lab, dễ bỏ sót kết quả vi phạm khi vựa xử lý 5–10 xe/đêm lúc cao điểm.
- **Thiếu hồ sơ truy xuất minh bạch cho đối tác:** Khi đối tác Trung Quốc hoặc hải quan cửa khẩu yêu cầu cung cấp hồ sơ kiểm tra, vựa phải chụp ảnh Zalo từng tờ giấy, thiếu tính toàn vẹn và dễ bị làm giả.

### 1.2. Hợp tác xã & Nhà vườn (Tác nhân liên kết nguồn hàng)
- **Khó khăn chứng minh tính xác thực nguồn gốc:** Nhật ký canh tác và chứng nhận hữu cơ (TCVN 11041, USDA, GlobalGAP) nằm rải rác trên giấy tờ, chưa có cơ chế chia sẻ bảo vệ dữ liệu với vựa thu mua mà không sợ lộ thông tin khách hàng hay chi phí đầu vào.

### 1.3. Thương nhân nhập khẩu (Buyer)
- **Bất đối xứng thông tin nghiêm trọng:** Người mua tại chợ Gia Hưng, Quảng Châu hoặc Thượng Hải không nắm được chính xác tình trạng kỹ thuật, kết quả lab và thời điểm niêm phong kẹp chì cho đến khi hàng tới biên giới, dẫn đến việc ép giá hoặc tranh chấp chất lượng.

---

## 2. Phân Kỳ Phạm Vi Sản Phẩm (Product Scopes Across 5 Stages)

Lộ trình phát triển được kiểm soát nghiêm ngặt theo 5 giai đoạn có điều kiện (Conditional Stages), không biến roadmap thành danh sách việc phải xây ngay lập tức:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STAGE 0   │────>│   STAGE 1   │────>│   STAGE 2   │────>│   STAGE 3   │────>│   STAGE 4   │
│ Single-Site │     │ Repeatable  │     │Permissioned │     │   Closed    │     │  Regional   │
│  Container  │     │    Paid     │     │   Network   │     │ Transaction │     │   Network   │
│   Dossier   │     │  Workflow   │     │   Sharing   │     │Orchestration│     │ (ASEAN-CN)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
  (Hiện tại)         (Mở rộng vựa)       (Chia sẻ Buyer)     (Thí điểm RFQ)      (Hành lang)
```

### STAGE 0 — Single-Site Container Dossier (Giai đoạn hiện tại)
- **Mục tiêu:** Chứng minh giá trị đối soát và mức độ sẵn sàng chi trả (Willingness-to-Pay) tại đúng 01 vựa ở Cai Lậy.
- **Trong phạm vi:**
  - Nhập và lưu trữ hồ sơ container (`ContainerDossier`), quản lý chứng từ 4 loại cốt lõi.
  - Bộ bóc tách trường cục bộ (`LocalExtractor`) và trích xuất mẫu fixture.
  - Giao diện người dùng HITL tiếng Việt xác thực trường (`verifyField`).
  - Bộ kiểm tra tuân thủ tất định (`DeterministicComplianceEngine`) kiểm tra ISO 6346, tải trọng, cadimi $\le 0.05\text{ mg/kg}$.
  - Gói xuất bản niêm phong (`ExportManifest`) băm SHA-256 chuỗi sự kiện kiểm toán (`AuditLedger`).
  - Phân quyền tài khoản cơ bản trên máy chủ cục bộ, sao lưu và phục hồi dữ liệu SQLite.
- **Ngoài phạm vi:** B2B Marketplace, Escrow, multi-tenant cloud, mobile app, tự động hóa thanh toán.
- **Tiêu chí nghiệm thu (Exit Criteria):** Hoàn thành pilot trả phí cho 5 container, thời gian đối soát trung bình $<5$ phút, phát hiện 100% lỗi gài mù (2 kịch bản blind test), người có thẩm quyền ký hợp đồng năm hoặc biên bản nghiệm thu.

### STAGE 1 — Repeatable Paid Workflow (Quy trình trả phí lặp lại)
- **Mục tiêu:** Chứng minh tính nhân rộng quy trình đóng gói hồ sơ sang 3–5 vựa khác mà không cần sự can thiệp thủ công liên tục của Founder.
- **Trong phạm vi:**
  - Quy trình cài đặt chuẩn hóa (Standard Installer / Onboarding Playbook) $\le 2$ giờ tại vựa mới.
  - Bộ công cụ cấu hình quy tắc riêng theo yêu cầu từng vựa (Custom tolerance thresholds).
  - Báo cáo đối soát vận hành hàng tuần xuất định dạng PDF/Excel có chữ ký số.
  - Cơ chế cập nhật phiên bản offline/LAN an toàn.
- **Ngoài phạm vi:** Sàn giao dịch, thanh toán qua cổng điện tử, mở rộng ra ngoài tỉnh Tiền Giang / Đắk Lắk.
- **Tiêu chí chuyển giai đoạn (Exit Criteria):** Ít nhất 3 vựa thanh toán phí thuê bao năm độc lập, tỷ lệ lỗi cài đặt $<5\%$, chi phí hỗ trợ vận hành $<15\%$ doanh thu thuê bao.

### STAGE 2 — Permissioned Organization Network (Mạng lưới chia sẻ có ủy quyền)
- **Mục tiêu:** Chứng minh nhu cầu và giá trị trao đổi dữ liệu hồ sơ có kiểm soát giữa các pháp nhân độc lập (Vựa $\leftrightarrow$ Buyer hoặc Vựa $\leftrightarrow$ HTX).
- **Trong phạm vi:**
  - Quản lý cấp/thu hồi quyền truy cập theo phạm vi (`ShareAccessGrant` với scope: `READ_ONLY`, `READ_AND_VERIFY`).
  - Che giấu dữ liệu thương mại nhạy cảm (`CommercialRedaction` che giá mua, danh tính nhà vườn theo thỏa thuận).
  - Cổng thông tin xem hồ sơ niêm phong cho thương nhân nhập khẩu (`Buyer Portal`).
  - Ghi nhận nhật ký truy cập chéo tổ chức vào Audit Ledger bất biến.
- **Ngoài phạm vi:** Niêm yết chào bán công khai, tìm kiếm đối tác mở, giữ tiền cọc.
- **Tiêu chí chuyển giai đoạn (Exit Criteria):** $\ge 80\%$ hồ sơ container được chia sẻ có bên mua đăng nhập xác nhận trước khi hàng cập bến, không có khiếu nại rò rỉ dữ liệu thương mại.

### STAGE 3 — Closed Transaction Orchestration (Điều phối giao dịch khép kín)
- **Mục tiêu:** Thí điểm điều phối đơn hàng và phối hợp dịch vụ kiểm định/ký quỹ trong nhóm đối tác đã được xác thực (Whitelisted Partners).
- **Trong phạm vi:**
  - Tạo yêu cầu báo giá riêng tư (`Private RFQ`) giữa Vựa và Thương nhân đã thẩm định.
  - Kết nối trạng thái chứng từ với tài khoản ký quỹ tại Ngân hàng thương mại được cấp phép (Nguyên tắc Zero-Custody: Ngân hàng giữ tiền, DuriOS chỉ gửi tín hiệu giải ngân khi container đạt trạng thái `EXPORTED` và băm manifest khớp 100%).
  - Tích hợp kết quả kiểm nghiệm điện tử trực tiếp từ các phòng lab được chỉ định (Accredited Lab Webhooks).
- **Ngoài phạm vi:** Mở sàn công khai cho người dùng lạ, ví điện tử tự phát, bảo lãnh thanh toán.
- **Tiêu chí chuyển giai đoạn (Exit Criteria):** $\ge 10$ giao dịch điều phối thành công qua ngân hàng đối tác, không có sự cố pháp lý về thương mại điện tử hoặc thanh toán.

### STAGE 4 — Regional Network (Mạng lưới hành lang khu vực)
- **Mục tiêu:** Mở rộng điều phối hồ sơ xuất khẩu sang các hành lang giao thương khu vực Đông Nam Á (Thái Lan $\rightarrow$ Trung Quốc, Malaysia $\rightarrow$ Trung Quốc).
- **Trong phạm vi:**
  - Bộ quy tắc tuân thủ thích ứng theo quốc gia xuất xứ (Country-specific Compliance Adapters).
  - Hỗ trợ đa ngôn ngữ và tiêu chuẩn kiểm dịch địa phương (DOA Thái Lan, MAFI Malaysia).
- **Ngoài phạm vi:** Mở rộng sang các mặt hàng nông sản khác ngoài sầu riêng trước khi hành lang sầu riêng ổn định.
- **Tiêu chí chuyển giai đoạn (Exit Criteria):** Vượt qua các cổng pháp lý và kiểm định chất lượng tại nước sở tại.

---

## 3. Ranh Giới Thẩm Quyền Phê Duyệt (Approval Boundaries)

| Lĩnh vực / Quyết định | Thẩm quyền duyệt (Owner) | Vai trò AI / Công cụ | Ranh giới cấm |
|---|---|---|---|
| **Khai trương pilot, mở gate, chọn địa điểm** | **Founder / CEO** | Thu thập dữ liệu, đo lường KPI, lập báo cáo. | AI không tự đóng/mở gate hoặc cam kết với khách hàng. |
| **Cam kết tài chính, giá bán, hợp đồng** | **Founder / CEO** | Tính toán mô hình nhạy cảm, giả định kinh tế. | Không tự chốt hợp đồng hoặc hứa hẹn chiết khấu. |
| **Quy trình nghiệp vụ, rà soát dữ liệu** | **Product & Operations** | Gợi ý lỗi, đối soát tự động theo quy tắc. | Phải có con người kiểm tra tính đúng đắn thực địa. |
| **Bảo mật, phân quyền, hạ tầng phần mềm** | **Engineering & Security** | Kiểm thử tự động, quét mã độc, bảo đảm CI/CD. | Không tự ý mở port, public database hoặc sửa auth. |
| **Pháp lý, tuân thủ dữ liệu cá nhân, hợp đồng** | **Legal & Governance** | Kiểm tra rà soát điều khoản, cảnh báo rủi ro. | Không tự diễn giải luật hoặc cam kết miễn trừ trách nhiệm. |
