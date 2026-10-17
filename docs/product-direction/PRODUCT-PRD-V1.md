# DuriOS Product Requirements Document (PRD v1.0)
**Mã tài liệu:** `docs/product-direction/PRODUCT-PRD-V1.md`  
**Ngày phát hành:** 2026-10-13  
**Trạng thái:** **APPROVED — Founder approval, 2026-10-14**  
**Phạm vi áp dụng:** Hệ thống nền tảng DuriOS (Core Repository & Presentation Demo)  
**Tài liệu tham chiếu:** `docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md`, `docs/product-direction/REPO-CROSSWALK.md`

---

## 1. Giới Thiệu & Bối Cảnh Định Hướng Sản Phẩm Mới

Tài liệu này xác lập định hướng sản phẩm mới của Founder cho DuriOS, mở rộng từ công cụ đối chiếu chứng từ tại bàn giấy nội bộ trạm đóng gói (Clerical Reconciliation Tool) thành **Hệ Điều Hành Chuỗi Giá Trị Sầu Riêng Việt Nam — Trung Quốc (Vietnam-China Durian Value Chain OS)**.

Mọi tài liệu kiểm toán, phân tích rủi ro và đóng băng trước đây (`docs/audits/`, `docs/field-discovery/`) tiếp tục được bảo toàn nguyên vẹn như bằng chứng lịch sử và ranh giới an toàn. PRD này định nghĩa tầm nhìn, phạm vi nghiệp vụ, ranh giới trách nhiệm và lộ trình triển khai theo 3 cổng nghiêm ngặt.

---

## 2. Các Bên Tham Gia, Vấn Đề, Kết Quả Kỳ Vọng & Bên Trả Phí

Hệ thống phục vụ ba nhóm tác nhân chính trong chuỗi giá trị sầu riêng xuất khẩu:

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│     NHÀ VƯỜN / HTX      │       │     VỰA / XUẤT KHẨU     │       │   THƯƠNG NHÂN (BUYER)   │
│  (Orchard / Cooperative)│──────>│ (Packhouse / Exporter)  │──────>│  (China Importer / B2B) │
│  - Vùng trồng mã số PUC │       │  - Cơ sở đóng gói PHC   │       │  - Phân phối chợ đầu mối│
│  - Nhật ký canh tác/hữu cơ      │  - Đối chiếu hồ sơ xuất │       │  - Siêu thị / Bán buôn  │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### 2.1. Nhà vườn & Hợp tác xã (Orchard & Cooperative)
- **Người dùng trực tiếp:** Chủ vườn, giám đốc HTX, cán bộ kỹ thuật nông nghiệp.
- **Vấn đề thực tế:** 
  - Khó chứng minh nguồn gốc vùng trồng hợp pháp (Mã số vùng trồng — PUC).
  - Khó bảo vệ giá trị nông sản chất lượng cao hoặc nông sản đạt tiêu chuẩn hữu cơ/chuyển đổi hữu cơ trước thương lái ép giá.
  - Nguy cơ bị mạo danh mã PUC để xuất khẩu hàng từ vùng trồng chưa được phê duyệt.
- **Kết quả kỳ vọng (Outcome):** 
  - Hồ sơ vùng trồng và bằng chứng canh tác hữu cơ được số hóa, gắn liền với từng lô thu hoạch (Lot).
  - Quyền sở hữu dữ liệu thuộc về nhà vườn/HTX; chỉ chia sẻ dữ liệu khi có thỏa thuận thương mại.
- **Khả năng trả phí (Buyer/Payer):** Ban đầu miễn phí hoặc chi phí tượng trưng; HTX có thể trả phí quản lý hồ sơ nếu sản phẩm giúp bán được giá cao hơn (Premium price).

### 2.2. Vựa đóng gói & Doanh nghiệp xuất khẩu (Packhouse & Exporter)
- **Người dùng trực tiếp:** Nhân viên chứng từ (Documentation Clerk), quản lý chất lượng (QC Manager), chủ vựa / giám đốc điều hành xuất khẩu.
- **Vấn đề thực tế:** 
  - Áp lực đối chiếu chứng từ đa nguồn (Phiếu đóng gói, kết quả xét nghiệm Cadmium/kim loại nặng, dự thảo kiểm dịch thực vật PPD, tờ khai hải quan) trong thời gian ngắn (15–20 phút/container) dưới điều kiện áp lực giờ đóng container lạnh (Reefer cutoff).
  - Nguy cơ sai sót thông tin (lệch số container ISO 6346, sai số seal, sai mã PUC/PHC) dẫn đến rủi ro bị giữ hàng tại cửa khẩu Hữu Nghị, Tân Thanh hoặc cảng biển.
  - Khó khăn trong việc tìm kiếm nguồn hàng sầu riêng đạt chuẩn chất lượng/hữu cơ đồng đều và kết nối với người mua uy tín tại Trung Quốc.
- **Kết quả kỳ vọng (Outcome):** 
  - Tự động hóa phát hiện sai lệch chéo giữa các chứng từ trước khi xe lăn bánh; giảm thiểu rủi ro ách tắc cửa khẩu.
  - Tạo lập Hộ chiếu container (Container Dossier Manifest) chuẩn hóa, có chữ ký số hoặc mã băm bất biến để gửi cho đối tác.
  - Tiếp cận mạng lưới thương nhân nhập khẩu uy tín.
- **Khả năng trả phí (Primary Buyer/Payer):** **Bên trả phí cốt lõi ban đầu.** Sẵn sàng trả phí bản quyền phần mềm (SaaS licence) hoặc phí theo container nếu phần mềm trực tiếp ngăn ngừa được rủi ro phạt tắc biên và tiết kiệm nhân công chứng từ.

### 2.3. Thương nhân nhập khẩu & Hệ thống phân phối tại Trung Quốc (Buyer / Importer)
- **Người dùng trực tiếp:** Bộ phận thu mua quốc tế (Procurement Officer), cán bộ kiểm tra chất lượng tại cửa khẩu/chợ đầu mối (Gia Hưng, Tân Phát Địa).
- **Vấn đề thực tế:** 
  - Thiếu niềm tin vào nguồn gốc thực tế và hồ sơ kiểm nghiệm dư lượng; lo ngại hàng bị từ chối thông quan bởi GACC (Hải quan Trung Quốc).
  - Nhu cầu ngày càng tăng đối với sầu riêng cao cấp, sầu riêng hữu cơ hoặc đang chuyển đổi hữu cơ nhưng thiếu bằng chứng xác thực từ bên thứ ba độc lập.
  - Rủi ro thanh toán và tranh chấp chất lượng khi chuyển tiền đặt cọc xuyên biên giới.
- **Kết quả kỳ vọng (Outcome):** 
  - Quét xem Hộ chiếu lô hàng tức thời, kiểm tra chứng chỉ kiểm nghiệm và chứng nhận hữu cơ gốc được bảo chứng tính toàn vẹn.
  - Cơ chế thanh toán an toàn qua tài khoản ký quỹ (Escrow) tại tổ chức tài chính được cấp phép, giải ngân theo các mốc kiểm tra thực tế.
- **Khả năng trả phí (Buyer/Payer):** Trả phí giao dịch (Transaction matching fee) hoặc phí thuê bao tài khoản cao cấp khi tham gia sàn kết nối có bảo chứng dữ liệu.

---

## 3. Ba Năng Lực Trọng Tâm Của Sản Phẩm (Three Core Capabilities)

DuriOS được cấu trúc quanh 3 năng lực bổ trợ lẫn nhau, tạo thành vòng lặp giá trị khép kín:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DURIOS VALUE CHAIN OS                           │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ 1. HỘ CHIẾU LÔ &    │ 2. HỒ SƠ BẰNG CHỨNG HỮU CƠ │ 3. B2B MATCHING &    │
│    CONTAINER        │    (ĐỘC LẬP TỪ BÊN THỨ 3) │    ĐIỀU PHỐI ĐƠN HÀNG│
├─────────────────────┼───────────────────────────┼──────────────────────┤
│ - Vòng đời dossier  │ - Lưu trữ chứng chỉ gốc   │ - Chào hàng/Khớp lệnh│
│ - Đối chiếu chéo    │ - Giám sát phạm vi & hạn  │ - Hợp đồng hàng hóa  │
│ - Chuỗi băm kiểm    │ - Bằng chứng chuyển đổi   │ - Webhook ký quỹ qua │
│   toán SHA-256      │ - Tuyệt đối không tự cấp  │   tổ chức cấp phép   │
│ - Manifest niêm phong│   chứng nhận hữu cơ       │ - DuriOS không giữ   │
│   kỹ thuật số       │                           │   tiền               │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

### 3.1. Năng lực 1: Hộ chiếu lô & Container xuất khẩu (Container/Lot Traceability Passport)
- **Mục tiêu:** Tạo ra một bản lược khai kỹ thuật số duy nhất (Digital Container Manifest), liên kết toàn bộ chuỗi chứng từ từ vườn đến cửa khẩu.
- **Chức năng chính:**
  - Khởi tạo hồ sơ lô (Lot) và hồ sơ container (Dossier) với mã định danh duy nhất.
  - Tiếp nhận và lưu trữ nguyên bản tài liệu: Phiếu đóng gói, Kết quả kiểm nghiệm (Lab report), Dự thảo giấy kiểm dịch thực vật (Phyto cert), Tờ khai hải quan.
  - Công cụ thẩm định quy tắc tuân thủ tất định (Deterministic Compliance Rules Engine):
    - Kiểm tra định dạng số container ISO 6346 (Modulo 11).
    - So sánh đối chiếu chéo tính đồng nhất: Số container, số seal, mã lô giữa các văn bản.
    - So sánh ngưỡng kiểm nghiệm nội bộ (Cảnh báo khi Cadmium vượt 0.040 mg/kg theo tiêu chuẩn nội bộ vựa).
  - Máy trạng thái vòng đời (FSM): Ngăn chặn chỉnh sửa hoặc thẩm định lại sau khi hồ sơ đã ở trạng thái niêm phong xuất khẩu (`EXPORTED` / `CLOSED`).
  - Sổ cái kiểm toán bất biến (Tamper-evident Audit Ledger): Mỗi thao tác chỉnh sửa, xác nhận của con người đều được ghi nhận vào chuỗi băm SHA-256.

### 3.2. Năng lực 2: Hồ sơ bằng chứng hữu cơ / Chuyển đổi từ bên độc lập (Independent Organic Evidence)
- **Mục tiêu:** Số hóa và bảo vệ tính toàn vẹn của các chứng nhận tiêu chuẩn nông nghiệp (Hữu cơ TCVN 11041, USDA Organic, EU Organic, VietGAP, GlobalGAP) mà không biến DuriOS thành cơ quan cấp phép.
- **Chức năng chính:**
  - Kho lưu trữ chứng chỉ gốc (Digital Certificate Repository): Lưu trữ bản scan gốc, mã số chứng chỉ, tổ chức cấp (CB - Certification Body), ngày hiệu lực, ngày hết hạn và phạm vi diện tích/sản lượng được chứng nhận.
  - Hồ sơ giai đoạn chuyển đổi (Transition Records): Đối với các vườn đang trong giai đoạn 1, 2, 3 năm chuyển đổi sang hữu cơ, hệ thống cho phép ghi nhận nhật ký xét nghiệm đất, nước, mẫu trái định kỳ từ các phòng thử nghiệm đạt chuẩn ISO/IEC 17025.
  - Liên kết bằng chứng vào Lô hàng (Evidence-to-Lot Linking): Cho phép đính kèm bằng chứng chứng nhận vào một mã lô/container cụ thể và lưu trữ bền vững trong cơ sở dữ liệu SQLite ở giai đoạn pilot kín (*hiện trạng mã nguồn mới có bản mẫu in-memory trong `src/organic/organic-evidence-manager.ts`, chưa lưu SQLite*).
  - **Tách bạch hai lớp trạng thái (2-Layer Status Separation):**
    1. *Trạng thái do tổ chức chứng nhận độc lập ghi trên chứng chỉ (`issuerClaimedStatus`):* Ví dụ `IN_CONVERSION`, `CERTIFIED`, `EXPIRED`, `SUSPENDED` — phản ánh đúng nội dung văn bản do đơn vị cấp độc lập phát hành.
    2. *Trạng thái lưu trữ hồ sơ trên DuriOS (`duriosRecordStatus`):* Luôn mang ý nghĩa hồ sơ bằng chứng được lưu trữ (`EVIDENCE_STORED_NOT_CERTIFIED`), tách biệt hoàn toàn với việc chứng nhận.
  - **Quy tắc hiệu lực thời hạn:** Bằng chứng đã hết hạn (`validTo < thời điểm hiện tại`) hoặc bị đình chỉ không được phép trình bày như bằng chứng đang còn hiệu lực cho lô hàng xuất khẩu (*mã nguồn hiện tại mới kiểm tra `validTo > validFrom`, cần bổ sung kiểm tra hiệu lực thực tế khi triển khai*).
  - **Ranh giới pháp lý bất di bất dịch:** DuriOS **chỉ là nền tảng lưu trữ và trình bày bằng chứng**; DuriOS không thẩm định quy trình canh tác, không thực hiện đánh giá sự phù hợp và **tuyệt đối không cấp chứng nhận hữu cơ**.

### 3.3. Năng lực 3: B2B Marketplace, Khớp lệnh & Điều phối thanh toán qua đối tác cấp phép (B2B Marketplace & Regulated Payment Coordination)
- **Mục tiêu:** Tạo kênh kết nối thương mại minh bạch giữa người bán (HTX, Vựa) và người mua (Thương nhân Trung Quốc) dựa trên dữ liệu hộ chiếu container đã được thẩm định.
- **Chức năng chính:**
  - Khám phá & Chào hàng (Catalog & RFQ): Người bán niêm phong lô hàng kèm Hộ chiếu DuriOS; người mua tìm kiếm theo giống (Ri6, Monthong), trọng lượng, tiêu chuẩn kiểm nghiệm và chứng chỉ hữu cơ.
  - Điều phối trạng thái đơn hàng (Order Lifecycle Coordination): Theo dõi tiến độ từ `OFFER_MADE` → `CONTRACT_SIGNED` → `ESCROW_FUNDED` → `REEFER_LOADED` → `EXPORT_SEALED` → `BORDER_CLEARED` → `PAYMENT_RELEASED`.
  - Điều phối thanh toán ký quỹ qua đối tác được cấp phép (Regulated Escrow Coordination):
    - DuriOS tích hợp qua Webhook/API an toàn với Ngân hàng hoặc Cổng thanh toán trung gian được cấp phép theo quy định pháp luật.
    - Khi người mua nạp tiền ký quỹ, ngân hàng gửi webhook `ESCROW_LOCKED` cho DuriOS.
    - Khi hồ sơ container được niêm phong xuất khẩu và có xác nhận thông quan/giao nhận hàng, hệ thống gửi chỉ thị điều phối để ngân hàng giải ngân cho người bán.
  - **Ranh giới tài chính bất di bất dịch:** DuriOS **hoàn toàn không giữ tiền, không mở tài khoản thu hộ, không nhận chuyển khoản thanh toán hàng hóa**. Hợp đồng mua bán hàng hóa là hợp đồng trực tiếp giữa Bên Bán và Bên Mua.

---

## 4. Hành Trình Người Dùng Chính & Ranh Giới Trách Nhiệm

### 4.1. Hành trình 1: Nhà vườn/HTX tạo lô và chia sẻ chứng nhận
1. Cán bộ HTX tạo mã lô thu hoạch (`LOT-2026-XXXX`).
2. Tải lên Giấy chứng nhận hữu cơ (hoặc VietGAP) do tổ chức độc lập cấp kèm file PDF gốc.
3. Nhập phạm vi diện tích và sản lượng thu hoạch ước tính của lô.
4. Cấp quyền truy cập xem bằng chứng (Grant Read Access) cho Vựa thu mua cụ thể kèm thời hạn hết hạn.
5. Khi hoàn tất bán hàng, HTX có quyền thu hồi quyền truy cập (Revoke Access) hoặc hệ thống tự động khóa khi lô hàng hoàn thành xuất khẩu.

### 4.2. Hành trình 2: Vựa tiếp nhận, kiểm tra chéo và niêm phong xuất khẩu
1. Nhân viên chứng từ (Clerk) tạo Dossier container, liên kết với các mã lô thu hoạch từ nhà vườn.
2. Tải lên 4 loại chứng từ: Phiếu đóng gói, Kết quả test lab, Dự thảo Phyto, Tờ khai hải quan.
3. Hệ thống chạy công cụ kiểm tra tự động:
   - Kiểm tra định dạng số container theo ISO 6346.
   - So khớp chéo số container, số seal, mã lô giữa các chứng từ.
   - Đối chiếu chỉ số Cadmium với ngưỡng cảnh báo nội bộ (0.040 mg/kg).
4. Nhân viên chứng từ rà soát trực tiếp (Human-in-the-loop) trên giao diện đối chiếu, bấm xác nhận từng trường dữ liệu.
5. Quản lý (Manager) kiểm tra tổng thể hồ sơ. Nếu đạt, Manager phê duyệt `APPROVED_FOR_EXPORT`.
6. Hệ thống tạo bản lược khai xuất khẩu `DossierExportManifest`, tính toán mã băm SHA-256 tổng thể, chuyển trạng thái sang `EXPORTED` và khóa bất biến vĩnh viễn (`isImmutable: true`).

### 4.3. Hành trình 3: Thương nhân xem hộ chiếu, khớp lệnh và thanh toán ký quỹ
1. Thương nhân nhập khẩu truy cập giao diện Marketplace, lọc các container sầu riêng Monthong có Hộ chiếu DuriOS và có chứng nhận hữu cơ.
2. Thương nhân xem bản tóm tắt Hộ chiếu container (các dữ liệu thương mại nhạy cảm như giá thu mua của vựa được bảo mật theo quyền).
3. Thương nhân gửi yêu cầu đặt hàng (Order Request). Hai bên ký kết hợp đồng thương mại điện tử trực tiếp.
4. Thương nhân chuyển tiền ký quỹ vào tài khoản của Ngân hàng đối tác được cấp phép.
5. Ngân hàng gửi webhook báo trạng thái `ESCROW_DEPOSITED` cho DuriOS.
6. Vựa vận chuyển container ra cửa khẩu. Khi hải quan thông quan và container được bàn giao, chứng từ giao nhận được xác thực trên hệ thống.
7. DuriOS kích hoạt tín hiệu điều phối hoàn thành đơn hàng; ngân hàng giải ngân tiền từ tài khoản ký quỹ cho vựa.

---

## 5. Quyền Sở Hữu Dữ Liệu, Mô Hình Phân Quyền & Ranh Giới Pháp Lý

### 5.1. Quyền sở hữu dữ liệu thuộc về Bên tạo (Data Creator Ownership)
- **Dữ liệu vùng trồng & nhật ký:** Thuộc quyền sở hữu duy nhất của Nhà vườn/HTX. Vựa hoặc thương nhân không có quyền tải về, sửa đổi hoặc sử dụng lại cho mục đích khác nếu không được nhà vườn cấp quyền rõ ràng.
- **Dữ liệu giá thu mua & chi phí nội bộ vựa:** Thuộc quyền sở hữu của Vựa đóng gói. Tuyệt đối không được công khai trên Marketplace hoặc hiển thị cho Thương nhân mua hàng.
- **Dữ liệu giá bán & giao dịch hợp đồng:** Thuộc quyền sở hữu chung của hai bên ký hợp đồng mua bán; không công khai cho các vựa hoặc người mua khác trên thị trường.

### 5.2. Mô hình phân quyền đa tầng (Organization - Lot - Role - Purpose)
Quyền truy cập được xác định chặt chẽ bởi 4 yếu tố:
1. **Organization (Tenant):** Cô lập hoàn toàn giữa các tổ chức. Nhân viên vựa A không thể thấy bất kỳ dữ liệu nào của vựa B nếu không có ủy quyền chia sẻ hợp lệ.
2. **Lot / Dossier Scope:** Quyền được cấp theo từng mã lô hoặc mã container cụ thể, không cấp quyền mở cho toàn bộ tài khoản.
3. **Role (Mô hình đồng tồn tại `ProductPersona + TenantType + UserRole` & Bảng cặp hợp lệ):**
   - **Quyết định của Founder đã ghi nhận:** Trong runtime, hệ thống cùng tồn tại cả **Persona sản phẩm (`ProductPersona`)** và cặp **`TenantType + UserRole`**. Hệ thống chỉ chấp nhận các bộ ba (`ProductPersona`, `TenantType`, `UserRole`) hợp lệ trong bảng dưới đây; mọi cặp persona–tenant–role không hợp lệ phải bị từ chối ngay (`400`/`403`) và **tuyệt đối không tự động hạ quyền hay gán quyền thay thế (No silent fallback)** (*lưu ý: hiện trạng code trong `src/domain/types.ts` mới có `UserRole`, chưa triển khai kiểm tra cặp `ProductPersona + TenantType + UserRole`*).

   | Persona Sản phẩm (`ProductPersona`) | Loại Tổ chức Hợp lệ (`TenantType`) | Vai trò Kỹ thuật Hợp lệ (`UserRole`) | Quyền Đọc / Ghi / Phê duyệt / Export (Chuẩn mực yêu cầu) | Hiện trạng trong Code (`durios`) |
   |---|---|---|---|---|
   | `ORCHARD_OFFICER` (Cán bộ HTX/Vườn) | `ORCHARD_COOP` | `CLERK`, `MANAGER`, `ADMIN` | Tạo/cập nhật lô thu hoạch, đính kèm bằng chứng hữu cơ của HTX; chỉ `MANAGER`/`ADMIN` của HTX mới được cấp/thu hồi chia sẻ lô. Không có quyền tạo/approve/export container của vựa. | Chưa có kiểm tra cặp `ORCHARD_OFFICER` + `ORCHARD_COOP` trong code hiện tại. |
   | `PACKHOUSE_CLERK` (Nhân viên chứng từ vựa) | `PACKHOUSE_EXPORTER` | `CLERK` | Đọc hồ sơ thuộc tenant mình hoặc được chia sẻ; được tác nghiệp (`createDossier`, `uploadDocument`, `verifyField`, `runValidation`, `recordOrganicEvidence`) trong phạm vi tenant sở hữu; nếu ở tenant nhận chia sẻ thì chỉ được `verifyField` khi có grant `READ_AND_VERIFY`. **Bị cấm `approve`, `export` và quản lý share (`grant/revoke`).** | Đã chặn `approve`, `export` và `grant/revoke share`. |
   | `PACKHOUSE_MANAGER` (Quản lý / Chủ vựa) | `PACKHOUSE_EXPORTER` | `MANAGER`, `ADMIN` | Toàn bộ quyền tác nghiệp của `CLERK` trong tenant sở hữu, cộng thêm: **Phê duyệt xuất khẩu (`approveForExport`)**, **Niêm phong & Xuất Manifest (`exportDossier`)**, và **Quản lý chia sẻ (`grant/revoke share`)** trên hồ sơ của tenant sở hữu; ở tenant nhận chia sẻ chỉ được `verifyField` khi có `READ_AND_VERIFY`. | Đã triển khai trong FSM và `ShareAccessManager` (cần bổ sung kiểm tra cặp `TenantType`). |
   | `BUYER_VIEWER` (Thương nhân / Người xem đối tác) | `BUYER_IMPORTER` (hoặc `PACKHOUSE_EXPORTER` / đối tác xem) | `VIEWER` | **Chỉ đọc (`Read-only`)** các hồ sơ/lô được chia sẻ còn hiệu lực sau khi đã qua bộ lọc redaction. **Cấm tuyệt đối mọi thao tác ghi, `verifyField` (kể cả khi tenant có `READ_AND_VERIFY`), `runValidation`, `approve`, `export`, `grant/revoke share`.** | **Chưa triển khai đầy đủ trong code:** `VIEWER` chưa bị chặn ở `createDossier`, `uploadDocument`, `verifyField`, `runValidation` và `approve`. |
   | `SYSTEM_AUDITOR` (Kiểm toán viên / Thanh tra) | `INSPECTION_AUDITOR` (hoặc `PACKHOUSE_EXPORTER` / `ORCHARD_COOP`) | `AUDITOR` | **Chỉ đọc (`Read-only`)** hồ sơ và sổ cái kiểm toán (`Audit Trail`) trong phạm vi tenant của mình hoặc theo ủy quyền chia sẻ có mục đích `AUDIT` / `CUSTOMS_INSPECTION`. **Cấm tuyệt đối mọi thao tác ghi, `verifyField`, `runValidation`, `approve`, `export`, `grant/revoke share`.** | **Chưa triển khai đầy đủ trong code:** `AUDITOR` chưa bị chặn ở các hàm ghi và `approve`. |

   - **Quy tắc giới hạn của `ADMIN` (`Tenant-scoped Admin`):** `ADMIN` chỉ có hiệu lực quản trị và phê duyệt trong phạm vi **một tổ chức (`tenantId`) duy nhất** (hợp lệ khi đi cùng `ORCHARD_OFFICER` tại `ORCHARD_COOP` hoặc `PACKHOUSE_MANAGER` tại `PACKHOUSE_EXPORTER`); **tuyệt đối không có quyền vượt rào sang tenant khác**.
   - **Quy tắc từ chối cặp không hợp lệ:** Ví dụ `BUYER_VIEWER` đi kèm `MANAGER`/`CLERK`, hoặc `PACKHOUSE_CLERK` đi kèm `MANAGER`/`VIEWER`, hoặc `ORCHARD_OFFICER` thuộc `BUYER_IMPORTER` đều bị từ chối ngay khi xác thực/phân quyền, không tự chọn quyền thay thế.
   - **Quy tắc nhất quán về quyền التác nghiệp, Phê duyệt (`Approve`) và Xuất hồ sơ (`Export`):**
     - **Chỉ đọc (`VIEWER`, `AUDITOR`):** Chỉ được đọc dữ liệu trong phạm vi cho phép; bị chặn trên mọi thao tác ghi.
     - **Tác nghiệp (`CLERK`, `MANAGER`, `ADMIN`):** Được thực hiện các thao tác tác nghiệp trên hồ sơ thuộc tenant sở hữu; ở tenant nhận chia sẻ chỉ được phép gọi `verifyField` khi có grant `READ_AND_VERIFY` còn hiệu lực.
     - **Phê duyệt (`approveForExport`), Xuất & Niêm phong (`exportDossier`), và Quản lý chia sẻ (`grant/revoke share`):** Chỉ `MANAGER` và `ADMIN` thuộc đúng tenant sở hữu dossier mới được thực hiện.

4. **Purpose, Expiration & Redaction (Mục đích, Thời hạn & Che dữ liệu nhạy cảm):**
   - Cấp quyền chia sẻ bắt buộc gắn mục đích (`purpose`: `CUSTOMS_INSPECTION`, `BUYER_VERIFICATION`, `AUDIT`, `LOGISTICS`) kèm thời hạn hiệu lực (`expiresAt`). Khi hết hạn hoặc khi chủ sở hữu bấm **Thu hồi quyền (Revoke)**, quyền truy cập lập tức bị vô hiệu hóa trên server và trạng thái thu hồi phải được lưu bền vững trong SQLite (*hiện tại code mới lưu trong RAM, chưa lưu SQLite*).
   - **Kiểm soát theo Mục đích chia sẻ (`SharePurpose`):**
     - Quyền đọc lịch sử kiểm toán (`GET /audit`) và xem bằng chứng hữu cơ (`GET /organic-evidence`) của bên được chia sẻ phải tuân thủ đúng `purpose` được cấp (ví dụ: mục đích `LOGISTICS` chỉ phục vụ giao nhận vận tải, không được mở nhật ký kiểm toán hoặc hồ sơ chứng nhận hữu cơ).
   - **Che dữ liệu thương mại nhạy cảm (Commercial Redaction nhất quán trên cả API Danh sách và Chi tiết):**
     - Khi một tổ chức xem hồ sơ qua quyền được chia sẻ (`actor.tenantId !== dossier.tenantId`), server bắt buộc áp dụng bộ lọc ẩn dữ liệu nhất quán trên **cả API danh sách (`list`) lẫn API chi tiết (`detail`)** (*hiện tại repo core chưa triển khai bộ lọc này*).
     - **Nhóm trường thương mại bắt buộc che với mọi bên nhận chia sẻ:** Giá trị hóa đơn (`invoice_value`), đơn giá (`unit_price`), tên/liên hệ người mua (`buyer_name`, `buyer_contact`), số hợp đồng thương mại (`commercial_contract_no`), điều khoản thanh toán (`payment_terms`), biên lợi nhuận/phí dịch vụ (`exporter_margin`, `customs_broker_fee`), ghi chú nội bộ (`clerkNote`) và đường dẫn lưu trữ file nội bộ (`storagePath`).
     - **Quyết định của Founder về `declaredNetWeightKg` và `declaredBoxCount`:** Hiển thị `declaredNetWeightKg` (trọng lượng tịnh khai báo) và `declaredBoxCount` (số thùng khai báo) khi mục đích chia sẻ là `CUSTOMS_INSPECTION` hoặc `LOGISTICS`; **ẩn cả hai trường này đối với tất cả các mục đích chia sẻ còn lại** (`BUYER_VERIFICATION`, `AUDIT`). Áp dụng nhất quán trên cả API danh sách và API chi tiết.

### 5.3. Ranh giới tài sản & Tuyên bố trách nhiệm pháp lý (Boundaries & Disclaimers)
```
┌────────────────────────────────────────────────────────────────────────┐
│               RANH GIỚI TRÁCH NHIỆM BẤT DI BẤT DỊCH                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DuriOS KHÔNG sở hữu hàng hóa, không sở hữu container, không lưu kho.│
│ 2. DuriOS KHÔNG ký kết hợp đồng mua bán nông sản thay cho các bên.     │
│ 3. DuriOS KHÔNG giữ tiền, không mở tài khoản thanh toán, không cung    │
│    cấp dịch vụ trung gian thanh toán. Mọi dòng tiền đi qua tổ chức     │
│    tài chính được Ngân hàng Nhà nước cấp phép.                         │
│ 4. DuriOS KHÔNG cấp chứng nhận hữu cơ, VietGAP hay GlobalGAP; không    │
│    đóng vai trò Tổ chức chứng nhận (Certification Body).               │
│ 5. DuriOS KHÔNG bảo đảm thông quan hải quan 100%. Kết quả thông quan   │
│    thuộc thẩm quyền tuyệt đối của Hải quan và Cơ quan Kiểm dịch hai    │
│    nước Việt Nam và Trung Quốc.                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Phạm Vi Địa Lý (Việt Nam & Trung Quốc) & Các Yêu Cầu Pháp Lý Chưa Xác Minh

### 6.1. Phạm vi địa lý
- **Việt Nam:** Vùng nguyên liệu và vựa đóng gói tập trung ban đầu tại 2 thủ phủ sầu riêng lớn:
  1. Huyện Cai Lậy, tỉnh Tiền Giang (Đồng bằng sông Cửu Long).
  2. Huyện Krông Pắc, tỉnh Đắk Lắk (Tây Nguyên).
- **Trung Quốc:** Điểm đến hàng hóa là các cửa khẩu đường bộ chính (Hữu Nghị Quan / Bằng Tường; Tân Thanh / Pò Chài) và các chợ đầu mối nông sản quốc tế lớn (Gia Hưng - Chiết Giang, Tân Phát Địa - Bắc Kinh).

### 6.2. Các yêu cầu pháp lý & chứng từ chưa xác minh (Đánh dấu câu hỏi mở)
*Ghi chú: Theo nguyên tắc của Hợp đồng chung, mọi quy định chưa có văn bản công báo chính thức hiện hành được phân loại rõ ràng và không được tự động giả định là đúng trong code.*

1. **Quy chuẩn Cadmium của Trung Quốc (GB 2762-2022):**
   - *Hiện trạng:* Các báo cáo đề cập mức dư lượng tối đa MRL Cadmium cho sầu riêng là 0.050 mg/kg theo GB 2762-2022.
   - *Tình trạng xác minh:* **CHƯA CÓ VĂN BẢN GỐC.** Mã nguồn Core đang vô hiệu hóa quy tắc này (`RUL-GB2762-CD: isActive = false`).
   - *Câu hỏi:* Cần văn bản công báo chính thức từ Ủy ban Y tế Quốc gia Trung Quốc (NHC) hoặc SAMR xác nhận chính xác phân loại nông sản của sầu riêng và ngưỡng Cadmium tương ứng.
2. **Quy định trừ hạn ngạch sản lượng theo Mã số vùng trồng (MSVT Quota):**
   - *Hiện trạng:* Giả định rằng hệ thống có thể tự động trừ sản lượng xuất khẩu của từng container vào tổng sản lượng cho phép của mã PUC.
   - *Tình trạng xác minh:* **CHƯA ĐƯỢC XÁC MINH.** Hiện tại Cục Bảo vệ Thực vật Việt Nam quản lý mã vùng trồng nhưng chưa có cơ sở dữ liệu công khai hoặc API chính thức cho phép phần mềm thứ ba trừ hạn ngạch.
   - *Câu hỏi:* Cục BVTV có cơ chế chính thức nào cho bên thứ ba tích hợp theo dõi sản lượng không, hay đây thuần túy là dữ liệu tự khai báo của vựa?
3. **Cơ chế chia sẻ dữ liệu chứng từ điện tử qua biên giới:**
   - *Hiện trạng:* Giấy kiểm dịch thực vật điện tử (e-Phyto) và tờ khai hải quan điện tử của Việt Nam và Trung Quốc hiện có trao đổi song phương cấp chính phủ.
   - *Câu hỏi:* Doanh nghiệp tư nhân hoặc nền tảng độc lập như DuriOS có được phép kết nối kỹ thuật trực tiếp vào cổng một cửa quốc gia (NSW) hay không, hay chỉ được lưu bản sao quét (scanned copies)?

---

## 7. Lộ Trình Triển Khai 3 Cổng Nghiệm Thu (Three-Gate Rollout Roadmap)

Quá trình phát triển và thương mại hóa được chia thành 3 cổng tuần tự. Không được bước sang cổng tiếp theo khi cổng trước chưa đạt tiêu chuẩn nghiệm thu của Founder:

```
┌────────────────────────────────┐
│ CỔNG 1: DEMO DỮ LIỆU TỔNG HỢP  │ (Tháng 1)
│ - Trình diễn 3 năng lực        │
│ - Dữ liệu giả định, air-gapped │
└───────────────┬────────────────┘
                │ Đạt tiêu chuẩn trình diễn & nghiệm thu
                ▼
┌────────────────────────────────┐
│ CỔNG 2: PILOT KÍN ĐA TỔ CHỨC   │ (Tháng 2 - Tháng 3)
│ - 1-3 vựa tại Tiền Giang/ĐắkLắk│
│ - Hộ chiếu container thực tế   │
│ - Xác thực an toàn server-side │
└───────────────┬────────────────┘
                │ Đạt SLA đối chiếu, không lỗi P0, vựa ký nhận
                ▼
┌────────────────────────────────┐
│ CỔNG 3: B2B MARKETPLACE MỞ     │ (Tháng 4 trở đi)
│ - Khớp lệnh mua bán B2B        │
│ - Webhook ký quỹ với ngân hàng │
│ - Mạng lưới thương nhân TQ     │
└────────────────────────────────┘
```

### 7.1. Cổng 1: Demo dữ liệu tổng hợp (Synthetic Data Demo)
- **Nội dung:** Hoàn thiện bản trình diễn trên repo `durios-frontend-demo` minh họa trực quan cả 3 năng lực: Hộ chiếu container, Hồ sơ bằng chứng hữu cơ độc lập, và Mô phỏng sàn khớp lệnh B2B.
- **Tiêu chuẩn dữ liệu:** 100% dữ liệu giả định (`synthetic-dataset`), tuyệt đối không dùng PII, không gọi API ngoài, không kết nối thanh toán thật.
- **Tiêu chí qua cổng:** Founder duyệt trải nghiệm người dùng, tính mạch lạc của câu chuyện sản phẩm và tính an toàn ranh giới pháp lý trên giao diện.

### 7.2. Cổng 2: Pilot kín đa tổ chức (Private Multi-Tenant Pilot)
- **Nội dung (theo quyết định phạm vi của Founder):** Triển khai thử nghiệm tại **1 đến 3 vựa đóng gói mục tiêu** (Cai Lậy hoặc Krông Pắc) trong vụ mùa thực tế. Trọng tâm kỹ thuật khởi đầu từ **Năng lực 1 (Hộ chiếu lô/container)**, kết hợp **chia sẻ đa tổ chức có thu hồi quyền** và **Năng lực 2 (Lưu trữ bằng chứng hữu cơ độc lập)**; chưa mở Marketplace công khai (thuộc Cổng 3).
- **Yêu cầu kỹ thuật bắt buộc trước khi vận hành pilot kín:**
  - **Xác thực đa phương thức phía Server:** Hỗ trợ cả 3 phương thức đăng nhập/xác thực cho Pilot kín gồm (1) Tài khoản/mật khẩu với session, (2) OTP Zalo/SMS, và (3) Managed pilot token theo người/thiết bị. Cả ba phương thức đều phải phân giải về cùng một cấu trúc danh tính actor do server xác thực và quản lý tenant/quyền; tuyệt đối không tin cậy role, tenant hoặc actor từ header/query do client tự gửi (*hiện trạng code trong `actor-resolver.ts` chưa triển khai 3 phương thức này*).
  - **Đồng bộ đường dẫn API:** Hỗ trợ đồng thời cả `/api/...` và `/api/v1/...` trỏ vào cùng handler, cùng bộ xác thực và cùng chính sách phân quyền (*hiện trạng code mới chỉ có `/api/...`*).
  - Cô lập dữ liệu đa tổ chức nghiêm ngặt và lưu bền vững `share_grants`, `organic_evidence` trong SQLite.
  - Áp dụng đầy đủ mô hình đồng tồn tại `ProductPersona + TenantType + UserRole` (từ chối cặp không hợp lệ; chặn tuyệt đối `VIEWER`/`AUDITOR` ghi dữ liệu; bảo vệ ranh giới `MANAGER`/`ADMIN` cho `approve`, `export` và quản lý share; chặn sửa đổi và chặn re-validate hồ sơ đã niêm phong `EXPORTED`).
  - Che dữ liệu thương mại nhạy cảm nhất quán trên cả API danh sách lẫn chi tiết khi truy cập chéo tổ chức (hiển thị `declaredNetWeightKg` và `declaredBoxCount` cho `CUSTOMS_INSPECTION` và `LOGISTICS`, ẩn với các mục đích chia sẻ còn lại).
- **Tiêu chí qua cổng:**
  - Giảm thời gian kiểm tra đối chiếu chứng từ xuống dưới 5 phút/container.
  - 0 sự cố sai lệch mã số container hoặc số seal bị lọt qua hệ thống.
  - Khách hàng vựa ký biên bản nghiệm thu hoặc cam kết trả phí thử nghiệm (Paid Pilot).

### 7.3. Cổng 3: B2B Marketplace & Điều phối thanh toán (Public Marketplace)
- **Nội dung:** Mở rộng kết nối người mua tại Trung Quốc; tích hợp luồng khám phá lô hàng, gửi yêu cầu báo giá và điều phối ký quỹ qua ngân hàng/cổng thanh toán được cấp phép.
- **Yêu cầu kỹ thuật bắt buộc:**
  - Tích hợp hoàn chỉnh API/Webhook tài khoản ký quỹ với đối tác tài chính có giấy phép.
  - Xử lý lỗi, timeout và cơ chế bảo đảm tính toàn vẹn (idempotency) của trạng thái giao dịch.
  - Kiểm toán bảo mật độc lập và tuân thủ pháp luật về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).

---

## 8. Mô Hình Doanh Thu Ban Đầu (Giả Thuyết Kiểm Chứng), Chỉ Số Thành Công & Giả Thuyết Thực Địa

### 8.1. Mô hình doanh thu ban đầu (Giả thuyết cần kiểm chứng thực địa — Chưa phải giá đã duyệt cố định)
*Lưu ý: Theo quyết định của Founder, toàn bộ các mức giá dưới đây — bao gồm 5.000.000 VNĐ/5 container, 60.000.000 VNĐ/năm và phí setup 10.000.000 VNĐ — được giữ làm **giả thuyết cần kiểm chứng tại thực địa (Hypotheses to Validate)**, không ghi là mức giá thương mại đã được duyệt cố định.*

1. **Phí bản quyền phần mềm Vựa (SaaS Subscription — Giả thuyết kiểm chứng):**
   - Mức phí giả thuyết cần kiểm chứng: **60.000.000 VNĐ / năm / vựa**.
   - Phí cài đặt, cấu hình và đào tạo ban đầu (Onboarding/Setup fee — Giả thuyết kiểm chứng): **10.000.000 VNĐ / vựa** (một lần).
   - Bao gồm: Tài khoản quản trị, tài khoản nhân viên chứng từ không giới hạn, xử lý hộ chiếu container không giới hạn trong vụ mùa, lưu trữ kiểm toán bất biến.
2. **Gói thử nghiệm có trả phí (Paid Pilot Package — Giả thuyết kiểm chứng):**
   - Mức phí giả thuyết cần kiểm chứng: **5.000.000 VNĐ / 5 container thực tế**.
   - Mục đích: Kiểm chứng mức độ sẵn sàng chi trả (Willingness-to-pay) thực tế của chủ vựa trước khi ký hợp đồng năm.
3. **Phí điều phối giao dịch sàn B2B (Giai đoạn Marketplace - Tương lai):**
   - Thu phí từ phía người mua hoặc tỷ lệ % điều phối giao dịch (ví dụ: 0.5% - 1% giá trị lô hàng) khi giao dịch hoàn tất thành công qua cơ chế ký quỹ được bảo chứng.

### 8.2. Chỉ số thành công có thể đo lường (Measurable Success Metrics)
- **Thời gian đối chiếu chứng từ (Clerical Reconciliation Time):** Giảm từ 12–18 phút/container xuống dưới 3 phút/container trên bàn làm việc DuriOS.
- **Tỷ lệ phát hiện sai sót trước khi rời xưởng (Pre-departure Error Detection):** 100% các lỗi sai lệch số container, số seal hoặc thiếu giấy tờ bắt buộc được hệ thống cảnh báo trước khi xuất manifest.
- **Tỷ lệ chuyển đổi thử nghiệm sang hợp đồng năm (Pilot-to-SaaS Conversion Rate):** Đạt tối thiểu 50% số vựa tham gia gói pilot đồng ý chuyển đổi sang hợp đồng thuê bao năm.
- **Mức độ sẵn sàng chia sẻ chứng nhận (Certification Sharing Adoption):** Tối thiểu 80% các lô hàng có liên kết chứng chỉ hữu cơ/VietGAP được người mua đánh giá cao về tính minh bạch.

### 8.3. Giả thuyết cần kiểm chứng tại thực địa (Hypotheses to Validate)
1. *Giả thuyết về nỗi đau:* Chủ vựa và nhân viên chứng từ thực sự coi việc đối chiếu sai lệch hồ sơ là rủi ro nghiêm trọng và tốn thời gian, chứ không phải một công việc giấy tờ thứ yếu.
2. *Giả thuyết về giá trị:* Mức phí 60 triệu VNĐ/năm nhỏ hơn rất nhiều so với chi phí rủi ro của 1 container bị trả về hoặc giữ lại tại cửa khẩu (thiệt hại ước tính từ 300 triệu đến 1 tỷ VNĐ/container).
3. *Giả thuyết về thói quen sử dụng:* Nhân viên chứng từ tại vựa (vốn quen dùng Zalo và Excel) có thể sử dụng thành thạo bàn làm việc đối chiếu của DuriOS trong vòng 30 phút đào tạo.

### 8.4. Non-Goals (Những việc DuriOS KHÔNG làm)
- KHÔNG xây dựng hệ thống ERP kế toán, tính lương nhân công hay quản lý kho tổng hợp của vựa.
- KHÔNG xây dựng chuỗi khối (Blockchain) đắt đỏ, phức tạp hoặc không cần thiết khi cơ sở dữ liệu SQLite/Postgres có mã băm mật mã SHA-256 đã đáp ứng đầy đủ yêu cầu bất biến.
- KHÔNG thay thế cơ quan kiểm nghiệm hay cán bộ kiểm dịch thực vật tại cửa khẩu.
- KHÔNG cung cấp hạn mức tín dụng hoặc dịch vụ tài chính cho vay.

### 8.5. Tiêu chí Dừng / Tiếp Tục (Stop / Continue Criteria)
- **DỪNG (KILL / STOP):**
  - Nếu sau đợt khảo sát thực địa tại 10 vựa, không có vựa nào sẵn sàng trả 5 triệu VNĐ cho gói pilot 5 container.
  - Nếu cơ quan quản lý ban hành quy định bắt buộc toàn bộ dữ liệu phải đi qua một nền tảng độc quyền của nhà nước mà các phần mềm độc lập không được phép tích hợp hoặc hoạt động.
  - Nếu phát hiện rủi ro pháp lý về việc DuriOS bị coi là tổ chức trung gian thanh toán trái phép dù đã ủy thác toàn bộ dòng tiền cho ngân hàng.
- **TIẾP TỤC (GO / CONTINUE):**
  - Có ít nhất 2 vựa chấp nhận ký thỏa thuận thử nghiệm pilot 5 container có trả phí (hoặc ký quỹ cam kết).
  - Nhân viên chứng từ xác nhận phần mềm giúp họ giảm ít nhất 50% thời gian căng thẳng khi lập hồ sơ đêm xuất hàng.
  - Ngân hàng đối tác xác nhận về nguyên tắc giải pháp webhook điều phối ký quỹ phù hợp với khuôn khổ pháp lý hiện hành.

---

## 9. Bảng Tổng Hợp Quyết Định Đã Ghi Nhận, Câu Hỏi Mở & Giả Định (Locked / Open / Assumptions)

| Phân loại | Nội dung chi tiết | Hiện trạng & Bước tiếp theo |
|---|---|---|
| **QUYẾT ĐỊNH CỦA FOUNDER ĐÃ GHI NHẬN (Founder Decisions Recorded)** | 1. **Ba năng lực & Ranh giới sản phẩm:** DuriOS gồm 3 năng lực theo lộ trình (Hộ chiếu lô/container, Bằng chứng hữu cơ độc lập, Sàn B2B & điều phối thanh toán). DuriOS điều phối danh tính, quy trình, quyền truy cập, bằng chứng và kết nối giao dịch; tuyệt đối không sở hữu hàng/tồn kho, không giữ tiền và không tự cấp chứng nhận hữu cơ. | Đã ghi nhận xuyên suốt PRD v1.0. |
| | 2. **Quyền sở hữu dữ liệu & Lộ trình 3 cổng:** Mỗi tổ chức giữ quyền với dữ liệu mình tạo; chia sẻ giới hạn theo tổ chức, lô/hồ sơ, vai trò, mục đích, thời hạn và có thu hồi. Triển khai tuần tự: Demo dữ liệu giả → Pilot kín đa tổ chức → Marketplace công khai. | Đã ghi nhận vào lộ trình bắt buộc. |
| | 3. **Xác thực Actor phía Server (Pilot kín):** Hỗ trợ cả 3 phương thức: (a) Tài khoản/mật khẩu với session, (b) OTP Zalo/SMS, và (c) Managed pilot token theo người/thiết bị. Cả 3 phân giải về cùng một danh tính actor do server xác thực; tenant và quyền do server quản lý; tuyệt đối không tin role, tenant hoặc actor từ header/query client gửi. | Quyết định Founder đã chốt (chưa triển khai trong code). |
| | 4. **Mô hình Role & Ma trận quyền:** Cùng tồn tại `ProductPersona` và `TenantType + UserRole` trong runtime; từ chối các cặp persona–tenant–role không hợp lệ và không tự chọn quyền thay thế. `ADMIN` giới hạn trong phạm vi từng tenant. `VIEWER`/`AUDITOR` chỉ đọc; `CLERK`/`MANAGER`/`ADMIN` được tác nghiệp theo tenant sở hữu; `MANAGER`/`ADMIN` được `approve`, `export` và quản lý share; role tác nghiệp ở tenant nhận share chỉ được `verifyField` khi có `READ_AND_VERIFY`. | Quyết định Founder đã chốt (cần triển khai vào code ở bước tiếp theo). |
| | 5. **Đồng bộ đường dẫn API:** Hỗ trợ cả `/api/...` và `/api/v1/...` bằng cùng handler, cùng cơ chế xác thực và cùng chính sách phân quyền. | Quyết định Founder đã chốt (hiện code mới có `/api/...`). |
| | 6. **Quy tắc Redaction theo Mục đích chia sẻ:** Hiển thị `declaredNetWeightKg` và `declaredBoxCount` với `CUSTOMS_INSPECTION` và `LOGISTICS`; ẩn với các mục đích chia sẻ còn lại (`BUYER_VERIFICATION`, `AUDIT`). Áp dụng nhất quán kèm việc che các trường thương mại nhạy cảm trên cả API danh sách lẫn chi tiết. | Quyết định Founder đã chốt (chưa triển khai trong code). |
| | 7. **Phạm vi Pilot kín & Giả thuyết giá:** Phạm vi pilot kín là **1–3 vựa**. Các mức giá **5.000.000 VNĐ/5 container**, **60.000.000 VNĐ/năm** và phí setup **10.000.000 VNĐ** được giữ làm **giả thuyết cần kiểm chứng**, không ghi là giá thương mại đã duyệt cố định. | Quyết định Founder đã chốt. |
| **CÂU HỎI MỞ CHƯA XÁC MINH (Open Legal / External Questions)** | 1. Văn bản công báo gốc của Trung Quốc (GB 2762-2022) về phân loại sầu riêng và ngưỡng Cadmium 0.050 mg/kg (`RUL-GB2762-CD` vẫn giữ `isActive = false`). | Đang mở — chờ nguồn pháp lý chính thức. |
| | 2. Cơ chế chính thức của Cục BVTV về việc theo dõi/trừ sản lượng xuất khẩu theo Mã số vùng trồng (MSVT Quota) và khả năng kết nối chứng từ điện tử (e-Phyto/NSW). | Đang mở — không giả định có API nhà nước. |
| | 3. Đặc tả kỹ thuật Webhook ký quỹ của ngân hàng/đối tác trung gian thanh toán được cấp phép cho Giai đoạn 3 (Marketplace). | Đang mở — thuộc giai đoạn chuẩn bị Cổng 3. |
| **GIẢ ĐỊNH CẦN KIỂM CHỨNG (Assumptions to Validate)** | 1. Giả thuyết giá thử nghiệm 5 triệu VNĐ/5 container và thuê bao 60 triệu VNĐ/năm (+ 10 triệu VNĐ setup) phù hợp với mức sẵn sàng chi trả của chủ vựa. | Kiểm chứng tại thực địa ở Cổng 2. |
| | 2. Chủ vựa sẵn sàng đưa tài liệu scan thực tế vào phần mềm DuriOS trong môi trường pilot kín có bảo mật. | Kiểm chứng trong khảo sát thực địa. |
| | 3. Ngưỡng cảnh báo nội bộ Cadmium 0.040 mg/kg được các vựa đồng tình như một vùng đệm an toàn hữu ích trước mức tham chiếu 0.050 mg/kg. | Kiểm chứng với chuyên gia kiểm nghiệm. |

---
*Xác nhận trạng thái tài liệu: **APPROVED — Founder approval, 2026-10-14**.*
