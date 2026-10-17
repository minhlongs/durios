# DuriOS Kiến Trúc Hệ Thống & Lộ Trình Kỹ Thuật V2 (Architecture & Roadmap v2.0)

**Mã tài liệu:** `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`  
**Ngày cập nhật:** 2026-10-17  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW**  
**Tài liệu baseline phê duyệt hiện hành:** `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (APPROVED — Founder approval, 2026-10-14)  
**Thứ bậc bằng chứng:** `PROPOSAL` / `DRAFT`

---

## 1. Bốn Lớp Sản Phẩm Bắt Buộc Theo Thứ Tự (The 4-Layer Product Stack)

Hệ thống DuriOS được cấu trúc theo 4 tầng tiến hóa độc lập nhưng kế thừa chặt chẽ:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 4. TRANSACTION RAILS (Orchestration với đối tác được cấp phép)         │
│    Logistics bidding, lab booking, bank escrow & settlement, finance   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. CLOSED TRANSACTION NETWORK (Verified Trade Rooms)                   │
│    Invite-only RFQ, private trade rooms, machine-readable terms        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. VERIFIED ORGANIZATION NETWORK (Federated Privacy-First Trust)       │
│    DuriOS Verified Profile (chỉ số uy tín khách quan, zero commercial  │
│    secrets leak: không lộ danh sách nhà vườn, giá mua hay margin)      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. CONTAINER TRUTH ENGINE (Sản phẩm cốt lõi hiện tại tại Cai Lậy)       │
│    Đối soát nguồn sự thật duy nhất (Single Verified Shipment State)     │
│    source ↔ lot ↔ lab ↔ packing ↔ document ↔ container ↔ seal         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến Trúc Thích Ứng Quy Định ASEAN (Country Compliance Adapters)

Để biến DuriOS thành hạ tầng khu vực Đông Nam Á mà không phải fork mã nguồn cho từng quốc gia:
- **Ontology Lõi Cố Định:** 11 thực thể nghiệp vụ (`Organization`, `ProductionSource`, `Lot`, `TestEvidence`, `Document`, `Container`, `Seal`, `CustodyEvent`, `Exception`, `Trade`, `Permission`) giữ bất biến.
- **Hành Lang Tuân Thủ (Corridor Compliance Adapters):**
  - **`VN_CN`:** Việt Nam $\rightarrow$ Trung Quốc (GACC GB 2762-2022 Cadmium $\le 0.05$, Phyto, Packing List, Mã PUC/PHC Cục BVTV).
  - **`MY_CN`:** Malaysia $\rightarrow$ Trung Quốc (Protocol sầu riêng tươi 2024, truy xuất nguồn gốc orchard/packing house, 52 cơ sở approved, seal kiểm soát nghiêm ngặt).
  - **`TH_CN`:** Thái Lan $\rightarrow$ Trung Quốc (Hành lang chiếm 57% nhập khẩu TQ, chuẩn độ khô dry matter, kiểm soát sâu bọ, mã DOAVN).
  - **`PH_CN`:** Philippines $\rightarrow$ Trung Quốc (Quy chuẩn quả tươi từ vùng Davao, kiểm dịch BPI).

---

## 3. Bản Đồ Ánh Xạ Khái Niệm Mạng Lưới Sang Thực Thể Mã Nguồn Hiện Tại

| Khái niệm mới | Thực thể mã nguồn hiện có | Ghi chú & Ranh giới |
|---|---|---|
| **Organization** | `tenantId` & `tenantType` (`src/domain/types.ts`) | Đại diện cho một tổ chức độc lập (`PACKHOUSE_EXPORTER`, `ORCHARD_COOP`, `BUYER_IMPORTER`). |
| **Site** | Đại diện bởi địa chỉ vựa trong `ContainerDossier` | Trong Stage 0, mỗi tenant tương ứng đúng 01 Site vật lý tại Cai Lậy. Chưa cần tách bảng riêng. |
| **Shipment** | Gắn liền trong `ContainerDossier` | Mỗi hồ sơ hiện quản lý 1 container xuất khẩu. Khi sang Stage 2 sẽ liên kết nhiều container vào 1 shipment. |
| **Container & Seal** | `containerNumber` & `sealNumber` | Đã có quy tắc kiểm tra định dạng ISO 6346 và đối soát kẹp chì nghiêm ngặt. |
| **Lot** | `OrganicCertificationEvidence` & `sourceOrchard` | Thông tin mã vùng trồng, chứng nhận hữu cơ đã lưu trong bảng `organic_evidence`. |
| **DocumentVersion** | `IngestedDocument` (`isSuperseded`) | Đã hỗ trợ ghi đè phiên bản mới và đánh dấu phiên bản cũ bị thay thế (`isSuperseded = true`). |
| **VerificationDecision** | `ExtractedField` (`verificationStatus`, `confirmedValue`) | Đã lưu trữ chi tiết người xác minh (`verifiedBy`) và thời điểm xác nhận (`verifiedAt`). |
| **SharingGrant** | `ShareAccessGrant` (`src/domain/pilot-types.ts`) | Đã có máy trạng thái cấp và thu hồi quyền truy cập (`ShareAccessManager`). |

---

## 4. Quyền Riêng Tư Liên Hợp (Federated Privacy-First Trust Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        4 PHÂN VÙNG DỮ LIỆU DURIOS                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. DỮ LIỆU VẬN HÀNH NỘI BỘ     │ 2. BẰNG CHỨNG ĐƯỢC PHÉP CHIA SẺ       │
│    (Local Operational Only)    │    (Permissioned Shared Evidence)     │
│ - Giá thu mua sầu riêng vườn   │ - Phiếu kiểm nghiệm cadimi đạt chuẩn   │
│ - Tên cá nhân & SĐT chủ vườn   │ - Tờ khai kiểm dịch thực vật (Phyto)  │
│ - Sổ sách kế toán, lợi nhuận   │ - Quy cách đóng gói (Packing List)     │
│ - Log thao tác nội bộ của vựa  │ - Ảnh chụp kẹp chì niêm phong         │
│ => TUYỆT ĐỐI KHÔNG CHIA SẺ     │ => CHỈ CHIA SẺ KHI CÓ SHARE GRANT     │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. SIÊU DỮ LIỆU MẠNG LƯỚI      │ 4. THÔNG TIN CÔNG KHAI                │
│    (Network Metadata)          │    (Public Domain Info)               │
│ - Mã băm tệp gốc (SHA-256)     │ - Danh mục quy chuẩn GACC GB 2762     │
│ - Dấu thời gian niêm phong     │ - Danh bạ vùng trồng hợp lệ Cục BVTV  │
│ - Trạng thái hồ sơ kỹ thuật số │ - Mẫu chứng từ xuất khẩu quy chuẩn    │
│ => DÙNG ĐỐI SOÁT TOÀN VẸN      │ => CÔNG KHAI, TRA CỨU TỰ DO           │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 5. ADR 003: Kiến Trúc "Local Core + Opt-in Network"

### Bối cảnh (Context)
DuriOS cần mở rộng từ phần mềm bàn giấy tại vựa sang nền tảng điều phối chuỗi giá trị theo chỉ đạo của Founder, nhưng vựa đóng gói tại miền Tây có đặc thù: kết nối Internet chập chờn, rủi ro bảo mật dữ liệu thương mại cao, và không chấp nhận để dữ liệu kinh doanh bị bên thứ ba nắm giữ.

### Quyết định (Decision)
1. **Kiến trúc phân tầng:** Duy trì máy chủ cục bộ (`durios` Local Core) chạy trên nền tảng Bun + SQLite tại vựa làm trung tâm hoạt động.
2. **Cơ chế đồng bộ ủy quyền:** Chỉ gửi thông tin băm kiểm toán (`AuditHash`) và gói hồ sơ niêm phong (`ExportManifest`) lên cổng chia sẻ khi có thao tác ký duyệt của Quản lý vựa.
3. **Từ chối kiến trúc phân tán phức tạp ở giai đoạn này:** Không triển khai microservices, blockchain, hệ thống distributed event log (Kafka) hay smart contracts. Tính toàn vẹn được bảo đảm bằng mật mã học ứng dụng (SHA-256 Hash Chain) và chữ ký số chuẩn PKI.
