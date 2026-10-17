# DuriOS Architecture & MVP Scope Consistency Matrix
## Supreme Command #09: Deliverable 3 — Scope & Architecture Alignment (Phase E)

**Core Business Model Invariant:** Neutral Value Chain OS (Identity, Permissions, Evidence, Lineage). Zero commodity ownership.  
**Approved MVP Scope:** Container Dossier & Evidence Workflow for packhouses / exporters.  
**Out of Scope:** Organic certification, Farm ERP, IoT sensor hardware, customs brokerage replacement.  

---

## 1. Stakeholder Tension & Alignment Analysis

There is a fundamental strategic tension in the venture positioning between the **Initial Entry Persona** (Packhouse / Exporter) and the **Long-Term Mission** (Grower / Cooperative Value Chain OS).

| Dimension | Strategic Long-Term Ambition (Value Chain OS) | Current MVP Implementation (Container Dossier Workspace) | Inconsistency / Friction | Alignment Resolution for Discovery |
|---|---|---|---|---|
| **1. Target User (Daily Operator)** | Nông dân trồng sầu riêng & Cán bộ HTX | Thư ký chứng từ xưởng đóng gói (Packhouse Clerk) | **High.** Nông dân không dùng máy tính để đối chiếu số seal container. | Thư ký xưởng là người chịu áp lực đóng cont hàng ngày. Bắt đầu từ thư ký xưởng để thu thập dữ liệu nguồn. |
| **2. Economic Buyer (Budget Owner)** | Hợp tác xã / Liên minh nhà vườn | Chủ vựa đóng gói / Giám đốc công ty xuất khẩu | **Critical.** Nông dân từ chối chi trả cho phần mềm xuất khẩu cont. Chủ vựa chịu phạt lưu bãi nếu sai seal. | Chủ vựa là người trả tiền (Buyer Persona). HTX là bên cung cấp dữ liệu nguồn (Data Provider). |
| **3. Workflow Automated** | Quản lý nhật ký bón phân, tưới tiêu, cấp quota MSVT | Đối soát chứng từ (Packing list, Phiếu Lab, Phyto, Tờ khai hải quan) | **Divergent.** Codebase hiện tại là 100% tài liệu xuất khẩu container, 0% tính năng quản lý nông nghiệp tại vườn. | Không biến DuriOS thành Farm OS. Giữ vững Container Dossier làm điểm chạm có doanh thu đầu tiên. |
| **4. Data Ownership Friction** | Nông dân sở hữu mã vùng trồng (PUC) | Vựa sở hữu hồ sơ lô hàng và kết quả phân tích Lab | **Very High.** Vựa sợ lộ giá mua và khách Trung Quốc; Vườn sợ vựa đánh cắp quota mã PUC. | Áp dụng ma trận phân quyền: Vựa không xem nhật ký vườn chi tiết; Vườn không xem giá bán và Consignee. |
| **5. Commodity Exposure** | Trung lập (Neutral Platform) | Trung lập (Neutral Software) | **Consistent.** DuriOS không bao tiêu sầu riêng, không mua đứt bán đoạn. | Duy trì nguyên tắc không sở hữu hàng hóa. |
| **6. Certification Scope** | Chứng nhận hữu cơ (Organic) | Kiểm soát kim loại nặng (Cadmium) & kiểm dịch thực vật | **Scope Creep Prevented.** Chứng nhận hữu cơ bị loại bỏ hoàn toàn khỏi MVP. | Giữ nguyên: Chỉ tập trung dư lượng Cadmium và tính đồng nhất số seal/container. |

---

## 2. Scope Consistency Matrix

| Component in Repo | Found in Source Code? | Aligned with MVP? | Production Ready? | Audit Verdict |
|---|---|---|---|---|
| Container Dossier State Machine | `src/domain/dossier-state-machine.ts` | **YES** | Prototype | **ALIGNED** (Strict transitions enforced) |
| Local SQLite Repository | `src/storage/sqlite-dossier-repository.ts` | **YES** | Prototype | **ALIGNED** (Single-tenant local execution) |
| File Storage & Safe Path Jail | `src/storage/file-storage-service.ts` | **YES** | Prototype | **ALIGNED** (Path traversal blocked) |
| Immutable Export Manifest | `src/export/manifest-compiler.ts` | **YES** | Prototype | **ALIGNED** (SHA-256 composite sealed) |
| Human-in-the-Loop Field Verification | `src/server/document-handlers.ts` | **YES** | Prototype | **ALIGNED** (Validates operator confirmation) |
| Cadmium Statutory Rule | `src/rules/rule-catalog.ts` | **NO** (Disabled) | Quarantined | **ALIGNED** (Quarantine protects from liability) |
| Farm Management / Soil Moisture | None | **NO** | Not Built | **CORRECTLY EXCLUDED** (YAGNI/KISS) |
| Organic Certification Engine | None | **NO** | Not Built | **CORRECTLY EXCLUDED** (YAGNI/KISS) |

---

## 3. Unresolved Architectural Decisions

1. **Local-First vs. Cloud Sync:** Các xưởng tại Cai Lậy và Krông Pắc thường xuyên bị chập chờn mạng 4G/Wifi. Việc thiết kế DuriOS chạy hoàn toàn cục bộ trên máy tính xưởng (`Local-first`) là chuẩn xác, nhưng cơ chế đồng bộ chứng từ lên cơ quan hải quan hoặc khách mua Trung Quốc trong tương lai cần một giao thức phi tập trung hoặc API gateway được mã hóa an toàn.
2. **Actor Trust Boundary:** Cơ chế `x-actor-role` hiện tại chỉ phục vụ chạy thử nghiệm đơn máy (single-user demo). Bắt buộc phải thay thế bằng phân quyền dựa trên chữ ký điện tử hoặc session mã hóa trước khi cho bất kỳ đối tác thương mại nào dùng thử.
