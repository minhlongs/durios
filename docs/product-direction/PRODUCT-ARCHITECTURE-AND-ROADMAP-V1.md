# DuriOS Kiến Trúc Hệ Thống & Lộ Trình Kỹ Thuật (Architecture & API Roadmap v1.0)
**Mã tài liệu:** `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md`  
**Ngày phát hành:** 2026-10-13  
**Trạng thái:** **APPROVED — Founder approval, 2026-10-14**  
**Phạm vi áp dụng:** Hệ thống nền tảng DuriOS (`durios` Core & `durios-frontend-demo` Presentation)  
**Tài liệu tham chiếu:** `docs/product-direction/PRODUCT-PRD-V1.md`, `docs/product-direction/REPO-CROSSWALK.md`, `docs/product-direction/CLAUDE-CODE-PROMPT-CAMPAIGN.md`

---

## 1. Sơ Đồ Thành Phần, Ranh Giới Hệ Thống & Luồng Dữ Liệu

### 1.1. Ranh giới Core (`durios`) và Presentation Demo (`durios-frontend-demo`)
Hệ thống DuriOS được phân định ranh giới chức năng rõ ràng giữa hai repository theo Hợp đồng chung:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION REPO: durios-frontend-demo                │
│  - Vanilla ES Modules (zero-build), CSS Custom Properties, Browser-native   │
│  - Trình chiếu UI/UX 3 năng lực (Hộ chiếu, Bằng chứng hữu cơ, Sàn B2B)      │
│  - 100% Synthetic Dataset — Không giữ business logic chuẩn, không gọi ngoài │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Chỉ gọi HTTP REST API chuẩn hóa)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE REPO: durios                                │
│  - Bun + TypeScript (Strict), SQLite Native Driver, In-Memory Domain FSM    │
│  - Nguồn sự thật duy nhất (Single Source of Truth) cho Business Logic:      │
│    • Domain State Machine (FSM Vòng đời Dossier)                            │
│    • Deterministic Compliance Rules Engine (ISO 6346, Cadmium nội bộ)       │
│    • Tamper-Evident SHA-256 Hash Chained Audit Ledger                       │
│    • Multi-tenant Isolation & Server-Side Actor Authorization Engine        │
│    • Independent Organic Evidence Vault & B2B Order Coordination Webhooks   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│       SQLite DATABASE        │              │     FILE STORAGE ADAPTER     │
│  - Append-only Event Ledger  │              │  - Local Encrypted FileStore │
│  - Tenant & Dossier Tables   │              │  - SHA-256 Content Address   │
└──────────────────────────────┘              └──────────────────────────────┘
```

### 1.2. Luồng dữ liệu xuyên suốt từ Vườn/HTX qua Vựa đến Thương nhân

```
 [1. VƯỜN / HTX]              [2. VỰA ĐÓNG GÓI]             [3. CỬA KHẨU / HẢI QUAN]       [4. THƯƠNG NHÂN (BUYER)]
  (Orchard/Co-op)               (Packhouse/Exporter)              (Border Inspection)            (China Importer)
        │                               │                                 │                             │
   [Tạo Lô Hàng]                        │                                 │                             │
   (Lot Creation)                       │                                 │                             │
   + Tải chứng chỉ hữu cơ               │                                 │                             │
   + Cấp quyền xem cho Vựa ────────────>│                                 │                             │
        │                         [Tạo Dossier]                           │                             │
        │                         + Gán Lô & Số Reefer                    │                             │
        │                         + Tải 4 chứng từ xuất                   │                             │
        │                         + Chạy Rule Engine đối chiếu            │                             │
        │                         + Rà soát HITL                          │                             │
        │                         + Phê duyệt & Niêm phong                │                             │
        │                           (Sealed Export Manifest)              │                             │
        │                               │                                 │                             │
        │                               ├────────────────────────────────>│ (Đối chiếu Manifest gốc)   │
        │                               │                                 │                             │
        │                               │ <── [B2B Marketplace Order] ──────────────────────────────────┤
        │                               │                                 │                             │
        │                               │ <── [Webhook: Escrow Locked từ Ngân hàng đối tác] ────────────┤
        │                               │                                 │                             │
        │                         [Xuất hàng đi biên giới]                │                             │
        │                               │                                 │                             │
        │                               │ ─── [Thông quan & Giao nhận thành công] ─────────────────────>│
        │                               │                                 │                             │
        │                               │ <── [Webhook: Escrow Released giải ngân vào TK Vựa] ──────────┤
```

---

## 2. Tổ Chức, Actor, Vai Trò, Mô Hình Cô Lập Tenant & Quyền Dữ Liệu

### 2.1. Mô Hình Đồng Tồn Tại `ProductPersona + TenantType + UserRole`, Bảng Cặp Hợp Lệ & Ma Trận RBAC
- **Quyết định của Founder đã ghi nhận:** Trong runtime, hệ thống cùng tồn tại cả **Persona sản phẩm (`ProductPersona`)** và cặp **`TenantType + UserRole`**. Hệ thống kiểm tra nghiêm ngặt tính hợp lệ của bộ ba (`ProductPersona`, `TenantType`, `UserRole`) theo bảng dưới đây; mọi cặp persona–tenant–role không hợp lệ bị từ chối ngay lập tức (`400`/`403`) và **tuyệt đối không tự chọn quyền thay thế (No silent fallback)** (*lưu ý: mã nguồn hiện tại trong `src/domain/types.ts` mới chỉ có `UserRole`, chưa triển khai `ProductPersona`, `TenantType` và bộ kiểm tra cặp hợp lệ*).

#### A. Bảng Cặp `ProductPersona – TenantType – UserRole` Hợp Lệ và Ma Trận Quyền Hạn

| Persona Sản phẩm (`ProductPersona`) | Loại Tổ chức Hợp lệ (`TenantType`) | Vai trò Kỹ thuật Hợp lệ (`UserRole`) | Quyền Đọc (`Read`) | Quyền Tác nghiệp (`Create` / `Upload` / `Verify` / `Validate` / `RecordOrganic`) | Quyền Phê duyệt (`Approve`) | Quyền Xuất & Niêm phong (`Export`) | Quyền Quản lý Chia sẻ (`Grant` / `Revoke Share`) |
|---|---|---|---|---|---|---|---|
| `ORCHARD_OFFICER` | `ORCHARD_COOP` | `CLERK`, `MANAGER`, `ADMIN` | Đọc lô và bằng chứng hữu cơ của HTX mình | Tạo lô, đính kèm bằng chứng hữu cơ của HTX | Không áp dụng cho container xuất khẩu của vựa | Không có quyền export container | Chỉ `MANAGER` / `ADMIN` của HTX trên lô của mình |
| `PACKHOUSE_CLERK` | `PACKHOUSE_EXPORTER` | `CLERK` | Đọc hồ sơ thuộc tenant mình hoặc được chia sẻ | Được tác nghiệp (`createDossier`, `uploadDocument`, `verifyField`, `runValidation`, `recordOrganicEvidence`) trong phạm vi tenant sở hữu; ở tenant nhận share chỉ được `verifyField` khi có grant `READ_AND_VERIFY` | **BỊ CẤM (`403 INSUFFICIENT_ROLE`)** | **BỊ CẤM (`403 INSUFFICIENT_ROLE`)** | **BỊ CẤM (`403`)** |
| `PACKHOUSE_MANAGER` | `PACKHOUSE_EXPORTER` | `MANAGER`, `ADMIN` | Đọc toàn bộ hồ sơ thuộc tenant mình hoặc được chia sẻ | Có đầy đủ quyền tác nghiệp như `PACKHOUSE_CLERK` trong tenant sở hữu; ở tenant nhận share chỉ được `verifyField` khi có grant `READ_AND_VERIFY` | **ĐƯỢC PHÉP** (chỉ trên dossier của tenant sở hữu) | **ĐƯỢC PHÉP** (chỉ trên dossier của tenant sở hữu sau khi đã `APPROVED_FOR_EXPORT`) | **ĐƯỢC PHÉP** (cấp/thu hồi share trên dossier của tenant sở hữu) |
| `BUYER_VIEWER` | `BUYER_IMPORTER` (hoặc đối tác xem) | `VIEWER` | **CHỈ ĐỌC (`Read-Only`)** trên hồ sơ được chia sẻ (đã lọc trường nhạy cảm theo `SharePurpose`) | **BỊ CẤM TUYỆT ĐỐI** mọi thao tác tác nghiệp (kể cả `verifyField` khi tenant có grant `READ_AND_VERIFY`) | **BỊ CẤM TUYỆT ĐỐI (`403`)** | **BỊ CẤM TUYỆT ĐỐI (`403`)** | **BỊ CẤM TUYỆT ĐỐI (`403`)** |
| `SYSTEM_AUDITOR` | `INSPECTION_AUDITOR` (hoặc `PACKHOUSE_EXPORTER` / `ORCHARD_COOP`) | `AUDITOR` | **CHỈ ĐỌC (`Read-Only`)** hồ sơ và `Audit Trail` theo phạm vi tenant hoặc share purpose `AUDIT` / `CUSTOMS_INSPECTION` | **BỊ CẤM TUYỆT ĐỐI** mọi thao tác tác nghiệp (kể cả `verifyField` khi tenant có grant `READ_AND_VERIFY`) | **BỊ CẤM TUYỆT ĐỐI (`403`)** | **BỊ CẤM TUYỆT ĐỐI (`403`)** | **BỊ CẤM TUYỆT ĐỐI (`403`)** |

#### B. Các Quy Tắc Bất Biến Về Vai Trò & Phạm Vi Tenant (Theo Quyết Định Founder)
- **Giới hạn của `ADMIN` (`Tenant-scoped Admin`):** `ADMIN` chỉ có hiệu lực trong phạm vi **một tổ chức (`tenantId`) duy nhất** (hợp lệ khi đi kèm `ORCHARD_OFFICER` tại `ORCHARD_COOP` hoặc `PACKHOUSE_MANAGER` tại `PACKHOUSE_EXPORTER`). `ADMIN` **không phải là quyền nền tảng xuyên tổ chức** và không có quyền đọc/ghi dữ liệu của tenant khác nếu không có share grant hợp lệ.
- **Từ chối cặp không hợp lệ (Reject Invalid Tuples Without Fallback):** Mọi tổ hợp sai lệch giữa `ProductPersona`, `TenantType` và `UserRole` (ví dụ: `BUYER_VIEWER` gắn với `MANAGER`/`CLERK`; `PACKHOUSE_CLERK` gắn với `MANAGER`/`VIEWER`; `SYSTEM_AUDITOR` gắn với `CLERK`/`ADMIN`; hoặc `PACKHOUSE_MANAGER` gắn với `ORCHARD_COOP`) đều bị server từ chối thẳng (`400`/`403`), tuyệt đối không tự động suy diễn hoặc gán quyền thay thế.

### 2.2. Mô Hình Cô Lập Đa Tổ Chức & Kiến Trúc Xác Thực 3 Phương Thức Phía Server
- Mỗi tổ chức (HTX, Vựa, Công ty xuất khẩu, Thương nhân, Đơn vị kiểm tra) là một `tenantId` độc lập.
- **Quyết định của Founder về Xác thực Phía Server:** Trong giai đoạn Pilot kín, hệ thống hỗ trợ đồng thời **cả 3 phương thức xác thực** (*hiện trạng code trong `src/server/actor-resolver.ts` chưa triển khai 3 phương thức này và đang đọc header/query client*):
  1. **Tài khoản/Mật khẩu với Session (`Password + Server Session`):** Xác thực thông tin đăng nhập và tạo phiên làm việc lưu trữ phía server (SQLite).
  2. **Mã OTP Zalo/SMS (`Zalo/SMS OTP + Server Session`):** Xác thực mã OTP một lần gắn với số điện thoại nhân sự đã đăng ký thuộc tổ chức và cấp phiên làm việc phía server.
  3. **Managed Pilot Token theo người/thiết bị (`Managed Actor/Device Token`):** Token định danh được cấp phát và quản lý trực tiếp trên server cho từng nhân sự/thiết bị tham gia pilot.
- **Hội tụ về Danh tính Actor Duy nhất do Server Quản lý (`Unified Server-Verified Actor Identity`):**
  - Cả 3 phương thức xác thực trên đều bắt buộc phân giải về **cùng một cấu trúc danh tính `AuthenticatedActor`** (`id`, `name`, `tenantId`, `tenantType`, `role`, `persona`) được truy xuất và kiểm chứng từ dữ liệu phía server.
  - Toàn bộ thông tin `tenantId`, `tenantType`, `role` và `persona` đều do server quản lý và gắn với phiên/token hợp lệ.
  - **Cấm tuyệt đối việc tin cậy Client Header/Query:** Server tuyệt đối không nhận hoặc tin cậy `role`, `tenantId` hay `actorId` từ HTTP headers (`x-actor-role`, `x-tenant-id`, `x-actor-id`) hoặc query parameters (`?role=`, `?tenantId=`) do client tự gửi lên.
  ```typescript
  // Invariant bắt buộc trong Domain Workspace
  if (dossier.tenantId !== actor.tenantId && !hasSharedAccess(dossier, actor)) {
    throw new TenantSecurityError("Cross-tenant access prohibited.", actor.tenantId, dossier.tenantId);
  }
  ```

### 2.3. Quyền Sở Hữu Dữ Liệu Theo Bên Tạo & Cơ Chế Cấp/Thu Hồi Quyền (`ShareAccessGrant`)
- **Nguyên tắc Bên tạo sở hữu (Creator Ownership):** Dữ liệu mã vùng trồng PUC, diện tích, sản lượng và chứng chỉ hữu cơ do HTX tạo ra thuộc tài sản dữ liệu của HTX; hồ sơ container và thông tin thương mại do Vựa tạo thuộc quyền sở hữu của Vựa.
- **Ủy quyền chia sẻ có phạm vi và mục đích tách biệt (`ShareAccessGrant`):**
  - **Đồng bộ `purpose` (`SharePurpose`) và `scope` (`ShareScope`) với PRD và `src/domain/pilot-types.ts:1-23`:**
    - `purpose` (Mục đích chia sẻ): Chỉ sử dụng bộ 4 giá trị chuẩn:
      `BUYER_VERIFICATION` | `CUSTOMS_INSPECTION` | `AUDIT` | `LOGISTICS`
    - `scope` (Phạm vi thao tác được phép): Tách biệt độc lập khỏi `purpose`, chỉ sử dụng 2 giá trị chuẩn:
      `READ_ONLY` | `READ_AND_VERIFY`
  - **Cấu trúc bản ghi cấp quyền chuẩn trên `DOSSIER` (đã có kiểu dữ liệu trong `src/domain/pilot-types.ts:9-23`):**
    ```text
    ShareAccessGrant {
      id,
      dossierId,
      ownerTenantId,
      granteeTenantId,
      purpose: 'BUYER_VERIFICATION' | 'CUSTOMS_INSPECTION' | 'AUDIT' | 'LOGISTICS',
      scope: 'READ_ONLY' | 'READ_AND_VERIFY',
      grantedAt,
      grantedBy,
      expiresAt,
      isRevoked,
      revokedAt?,
      revokedBy?,
      revocationReason?
    }
    ```
  - **Về chia sẻ ở cấp độ `LOT` vs `DOSSIER`:**
    - Hiện tại mã nguồn (`src/domain/pilot-types.ts:9-23`, `src/sharing/share-access-manager.ts:12-164`) mới định nghĩa và cài đặt chia sẻ gắn trực tiếp với `dossierId` (`DOSSIER`).
    - Đối với luồng HTX chia sẻ cấp độ lô thu hoạch (`LOT`) trước khi ghép vào container (như mô tả ở Hành trình 1 của PRD), các quy tắc chi tiết riêng cho thực thể `LOT` (cấu trúc bảng `lots`, liên kết nhiều `LOT` vào một `DOSSIER` và kế thừa quyền chia sẻ từ `LOT` sang `DOSSIER`) **hiện chưa có căn cứ xác định đầy đủ trong tài liệu đã khóa và chưa có trong code** — được ghi nhận là điểm chưa xác định để Founder quyết định khi mở rộng thực thể `LOT`, không tự tạo thêm enum hay chính sách mới tại đây.
  - **Hiệu lực Thu hồi (`Revoke`) và Hết hạn (`Expiration`):** Khi chủ sở hữu bấm **Thu hồi (`revokeAccess`)** (`isRevoked: true`, ghi nhận `revokedAt`, `revokedBy`, `revocationReason`) hoặc khi thời điểm hiện tại vượt quá `expiresAt`, quyền truy cập của `granteeTenantId` lập tức bị cắt trong yêu cầu API tiếp theo.

---

## 3. Đặc Tả Giao Diện Lập Trình (API Contracts & Lộ Trình Tương Thích Đường Dẫn)

### 3.0. Đồng Bộ Đường Dẫn API: Hỗ Trợ Song Song `/api/...` và `/api/v1/...`
- **Hiện trạng trong mã nguồn (`src/server/http-router.ts:39-121`):** Toàn bộ các endpoint đang được triển khai dưới tiền tố `/api/...` (chưa có `/api/v1/...`), cụ thể:
  - `GET /api/health`
  - `GET /api/dossiers`, `POST /api/dossiers`, `GET /api/dossiers/:id`
  - `POST /api/dossiers/:id/documents`, `POST /api/dossiers/:id/documents/:docId/fields/:fieldId/verify`
  - `POST /api/dossiers/:id/validate`, `POST /api/dossiers/:id/approve`, `POST /api/dossiers/:id/export`
  - `GET /api/dossiers/:id/manifest`, `GET /api/dossiers/:id/audit`
  - `POST /api/dossiers/:id/shares`, `GET /api/dossiers/:id/shares`, `POST /api/dossiers/:id/shares/:grantId/revoke`
  - `POST /api/dossiers/:id/organic-evidence`, `GET /api/dossiers/:id/organic-evidence`
- **Quyết định của Founder đã ghi nhận:**
  1. Hệ thống **hỗ trợ đồng thời cả hai tiền tố đường dẫn `/api/...` và `/api/v1/...`** (*lưu ý: tiền tố `/api/v1/...` hiện chưa có trong code `http-router.ts` và sẽ được bổ sung khi triển khai*).
  2. Cả `/api/...` và `/api/v1/...` bắt buộc **đi qua cùng một bộ xác thực server-side, cùng chính sách phân quyền RBAC/Tenant Isolation và gọi vào cùng một hàm handler nghiệp vụ**. Sự khác biệt tiền tố URL tuyệt đối không tạo ra bất kỳ khác biệt nào về ranh giới quyền truy cập hay dữ liệu trả về.

### 3.1. Nhóm API Quản lý Lô & Hộ chiếu Container (Lot & Dossier API — Hiện có trên `/api/dossiers/...`, định hướng `/api/v1/...`)
- `POST /api/v1/lots` *(Định hướng mở rộng, chưa có trong code)* — Tạo mới lô thu hoạch từ vườn/HTX.
  - *Headers:* `Authorization: Bearer <token>`, `Idempotency-Key: <uuid>`
  - *Body:* `{ lotCode, pucCode, harvestDate, expectedWeightKg, standardType }`
- `POST /api/dossiers` (định hướng `/api/v1/dossiers`) — Tạo mới hồ sơ container tại vựa.
  - *Rào chắn:* Chỉ cho phép vai trò tác nghiệp (`CLERK`, `MANAGER`, `ADMIN`); từ chối `VIEWER` và `AUDITOR` (`403 INSUFFICIENT_ROLE`).
- `GET /api/dossiers` & `GET /api/dossiers/{id}` (định hướng `/api/v1/dossiers/{id}`) — Lấy danh sách và chi tiết hồ sơ container.
  - *Rào chắn:* Chỉ trả về hồ sơ thuộc `actor.tenantId` hoặc có `ShareAccessGrant` còn hiệu lực; nếu xem qua share grant thì bắt buộc áp dụng che dữ liệu thương mại (redaction) trên cả danh sách và chi tiết.
- `POST /api/dossiers/{id}/validate` (định hướng `/api/v1/dossiers/{id}/validate`) — Kích hoạt công cụ kiểm tra quy tắc tuân thủ (ISO 6346, đối chiếu chéo số container/seal/mã lô, kiểm tra ngưỡng Cadmium nội bộ).
  - *Rào chắn:* Chỉ cho phép `CLERK`, `MANAGER`, `ADMIN` của tenant sở hữu; bị từ chối (`409 DOSSIER_IMMUTABLE`) nếu hồ sơ đã ở trạng thái `EXPORTED`, `CLOSED`, `CANCELLED` hoặc `isImmutable: true`.
- `POST /api/dossiers/{id}/approve` (định hướng `/api/v1/dossiers/{id}/approve`) — Quản lý phê duyệt hồ sơ xuất khẩu (`APPROVED_FOR_EXPORT`).
  - *Rào chắn:* Chỉ vai trò `PACKHOUSE_MANAGER` (`MANAGER`) hoặc `ADMIN` thuộc đúng Tenant sở hữu; từ chối đối với `CLERK`, `VIEWER`, `AUDITOR` và mọi tenant khác (`403`).
- `POST /api/dossiers/{id}/export` (định hướng `/api/v1/dossiers/{id}/export`) — Niêm phong và tạo Manifest xuất khẩu.
  - *Rào chắn:* Chỉ vai trò `PACKHOUSE_MANAGER` (`MANAGER`) hoặc `ADMIN` thuộc đúng Tenant sở hữu khi hồ sơ đã `APPROVED_FOR_EXPORT`.
  - *Kết quả:* Chuyển trạng thái sang `EXPORTED`, thiết lập `isImmutable: true`, tính toán mã băm SHA-256 tổng thể.
- `GET /api/dossiers/{id}/manifest` (định hướng `/api/v1/dossiers/{id}/manifest`) — Xuất bản lược khai kỹ thuật số đã niêm phong.

### 3.2. Nhóm API Bằng chứng Hữu cơ & Chia sẻ Hồ sơ (Organic Evidence & Share API)
- `POST /api/dossiers/{id}/organic-evidence` (định hướng mở rộng `/api/v1/evidence/certificates`) — Ghi nhận hồ sơ bằng chứng chứng nhận bên thứ 3 (TCVN 11041, USDA, EU, JAS, GlobalGAP).
  - *Rào chắn:* Chỉ `CLERK`, `MANAGER`, `ADMIN` của tenant sở hữu trên dossier chưa niêm phong.
  - *Tách bạch trạng thái & Kiểm tra thời hạn:*
    - Tách rõ trạng thái ghi trên chứng chỉ của tổ chức cấp (`issuerClaimedStatus`: `IN_CONVERSION` | `CERTIFIED` | `EXPIRED` | `SUSPENDED`) khỏi trạng thái lưu trữ của hệ thống (`duriosRecordStatus`: `EVIDENCE_STORED_NOT_CERTIFIED`).
    - Từ chối ghi nhận chứng chỉ đã hết hạn (`validTo <= now`) hoặc bị đình chỉ làm bằng chứng đang có hiệu lực cho lô hàng xuất khẩu (*mã nguồn hiện tại chưa chặn `validTo <= now`, cần bổ sung khi triển khai*).
    - Luôn đính kèm tuyên bố miễn trừ trách nhiệm: **DuriOS tuyệt đối không tự cấp chứng nhận hữu cơ**.
- `GET /api/dossiers/{id}/organic-evidence` — Xem danh sách bằng chứng hữu cơ của hồ sơ.
  - *Rào chắn:* Chủ sở hữu hoặc tổ chức được chia sẻ có `SharePurpose` phù hợp (`BUYER_VERIFICATION`, `CUSTOMS_INSPECTION`, `AUDIT`).
- `POST /api/dossiers/{id}/shares`, `GET /api/dossiers/{id}/shares`, `POST /api/dossiers/{id}/shares/{grantId}/revoke` — Cấp, liệt kê và thu hồi quyền chia sẻ hồ sơ theo tổ chức, mục đích và thời hạn (chỉ `MANAGER` hoặc `ADMIN` của tenant sở hữu mới được cấp/thu hồi).

### 3.3. Nhóm API Sàn B2B, Khớp lệnh & Webhook Điều phối Ký quỹ (Marketplace & Escrow Coordination API)
- `POST /api/v1/marketplace/offers` — Vựa chào bán lô/container đã có Hộ chiếu DuriOS.
  - *Body:* `{ dossierId, variety: "MONTHONG" | "RI6", grade: "A" | "B", totalBoxes, netWeightKg }`
- `POST /api/v1/marketplace/orders` — Thương nhân tạo yêu cầu mua và khởi tạo điều phối hợp đồng.
  - *Body:* `{ offerId, buyerTenantId, agreedCurrency: "VND" | "CNY" | "USD" }`
- `POST /api/v1/webhooks/escrow` — Nhận sự kiện từ Cổng thanh toán / Ngân hàng đối tác được cấp phép.
  - *Headers:* `X-Partner-Signature: <hmac-sha256>`
  - *Body:* `{ eventId, eventType: "ESCROW_LOCKED" | "ESCROW_RELEASED" | "ESCROW_REFUNDED", orderId, escrowReference, bankTimestamp }`
  - *Xử lý:* Hệ thống cập nhật trạng thái đơn hàng (`ESCROW_FUNDED` → `PAYMENT_RELEASED`); **DuriOS không chạm vào dòng tiền**.

### 3.4. Chuẩn hóa Mã lỗi Hệ thống (Standard Error Codes)
```json
{
  "error": {
    "code": "DOSSIER_IMMUTABLE",
    "message": "Cannot validate sealed dossier: mutations and re-evaluations are prohibited on immutable or closed dossiers.",
    "status": 409,
    "timestamp": "2026-10-13T10:00:00.000Z"
  }
}
```
- `401 UNAUTHORIZED` / `403 FORBIDDEN` — Lỗi chưa đăng nhập hoặc không đủ quyền vai trò.
- `403 CROSS_TENANT_FORBIDDEN` — Cố tình truy cập tài nguyên của tổ chức khác.
- `403 INSUFFICIENT_ROLE` — Clerk cố tình phê duyệt hoặc niêm phong container.
- `409 DOSSIER_IMMUTABLE` — Cố tình chỉnh sửa hoặc chạy lại validation trên container đã niêm phong.
- `422 VALIDATION_BLOCKED` — Vi phạm quy tắc bắt buộc (ví dụ: số container sai ISO 6346 Modulo 11).

---

## 4. Lưu Trữ Tài Liệu, Lineage, Tính Toàn Vẹn & Rủi Ro Bảo Mật

### 4.1. Lưu Trữ Tài Liệu & Băm Toàn Vẹn SHA-256 (Hiện Trạng Code vs Thiết Kế Mục Tiêu)
- **Hiện trạng đã xác minh trong mã nguồn (`src/`):**
  1. *Tính toán mã băm SHA-256:* Mọi tài liệu tải lên đều được tính mã băm SHA-256 (`createHash("sha256")`) từ mảng byte nội dung file tại `src/ingestion/document-hasher.ts:3-7` và được kiểm tra chống trùng lặp (`duplicate`) theo `sha256Hash` trong cùng một dossier tại `src/workspace/document-ingestion-orchestrator.ts:34-44`.
  2. *Đường dẫn lưu file vật lý trên đĩa (`FileStorageService`):* Tại `src/storage/file-storage-service.ts:8-29`, thư mục lưu trữ mặc định là `./data/uploads` (hoặc cấu hình qua `DURIOS_DATA_DIR` tại `src/server/server.ts:21`) và tên file lưu trên đĩa đang theo mẫu `doc_${sanitizedDocId}_${Date.now()}${safeExt}` (kèm cơ chế xóa file rollback tại `src/workspace/container-dossier-workspace.ts:102-106` nếu lưu cơ sở dữ liệu thất bại).
  3. *Đường dẫn lưu trong bảng SQLite `documents`:* Tại `src/storage/sqlite-dossier-repository.ts:57`, cột `storage_path` trong bảng `documents` hiện đang ghi chuỗi cố định theo mã tài liệu `data/uploads/${doc.id}.bin` (chưa đồng bộ với tên file có gắn `Date.now()` của `FileStorageService` và chưa đặt tên theo địa chỉ nội dung `{sha256_hash}.bin`).
- **Thiết kế mục tiêu của Kiến trúc (Target Architecture — Yêu cầu mục tiêu cần triển khai, chưa hoàn tất trong code hiện tại):**
  Khi triển khai hoàn chỉnh, hệ thống bắt buộc đáp ứng **đồng thời cả hai điều kiện mục tiêu** dưới đây (không phải hai phương án thay thế nhau):
  1. **Định danh và lưu blob vật lý theo nội dung (Content-Addressed Blob Storage):** Tệp vật lý trên đĩa được định danh và lưu theo mã băm nội dung với đường dẫn mục tiêu `storage/blobs/{sha256_hash}.bin` nhằm chống ghi đè và cho phép kiểm chứng trực tiếp tính toàn vẹn của tệp vật lý đối chiếu với `sha256_hash`.
  2. **Đồng bộ chính xác đường dẫn tương đối vào SQLite `documents.storage_path`:** Cột `documents.storage_path` trong SQLite phải lưu chính xác đường dẫn tương đối của blob thực tế do storage adapter trả về (tương ứng `storage/blobs/{sha256_hash}.bin`), bảo đảm đường dẫn trong cơ sở dữ liệu luôn trỏ đúng tới file thực tế trên đĩa (và luôn bị che/ẩn khi chia sẻ hồ sơ ra ngoài tổ chức sở hữu).

### 4.2. Sổ cái Kiểm toán Bất biến (Tamper-Evident SHA-256 Hash Chain)
- Mọi sự kiện phát sinh (Upload, VerifyField, RunValidation, Approve, Export) tạo thành một khối sự kiện (`AuditEvent`).
- Mỗi sự kiện chứa:
  - `eventId`: UUID
  - `dossierId` / `tenantId` / `actorId` / `actorRole`
  - `eventType` & `payload`
  - `previousHash`: Mã băm của sự kiện liền trước.
  - `eventHash`: `SHA256(previousHash + eventId + timestamp + payload)`
- Khi xuất `DossierExportManifest`, mã `rootHash` của sự kiện cuối cùng được in lên tờ khai và mã QR để bất kỳ ai cũng có thể kiểm chứng tính toàn vẹn độc lập.

### 4.3. Lưu Trữ SQLite Bền Vững Cho Chia Sẻ / Hữu Cơ & Quy Tắc Redaction Dữ Liệu Thương Mại
- **Yêu cầu lưu trữ SQLite bền vững cho Pilot kín:**
  - Hiện tại `src/storage/schema-migrations.ts` mới tạo 5 bảng (`container_dossiers`, `documents`, `extracted_fields`, `audit_events`, `export_manifests`), trong khi `ShareAccessManager` và `OrganicEvidenceManager` chỉ lưu trên `Map` trong RAM.
  - Để vận hành pilot kín, bắt buộc bổ sung hai bảng SQLite `share_grants` và `organic_evidence`, đồng thời tích hợp kiểm tra quyền chia sẻ trực tiếp vào `SqliteDossierRepository` để cả `findById` và `listForTenant` đều trả về đúng các hồ sơ được chia sẻ còn hiệu lực.
  - Trên bảng `organic_evidence`, tách bạch rõ cột `issuer_claimed_status` (trạng thái ghi trên chứng chỉ của đơn vị cấp độc lập) và `durios_record_status` (`EVIDENCE_STORED_NOT_CERTIFIED`), đồng thời không cho phép trình bày chứng chỉ đã hết hạn như bằng chứng còn hiệu lực.
- **Quy tắc kiểm tra quyền chia sẻ và Redaction trên CẢ API Danh sách lẫn Chi tiết:**
  - Giá thu mua tại vườn, chi phí đóng gói, điều khoản thanh toán và thông tin khách hàng của vựa là bí mật thương mại.
  - Khi người gọi xem hồ sơ qua ủy quyền chia sẻ (`actor.tenantId !== dossier.tenantId`), hệ thống bắt buộc áp dụng kiểm tra quyền chia sẻ và che dữ liệu nhạy cảm (Redaction/Field masking) nhất quán trên **cả API danh sách (`GET /api/dossiers`, `GET /api/v1/dossiers`) lẫn API chi tiết (`GET /api/dossiers/:id`, `GET /api/v1/dossiers/:id`)** (*hiện tại repo core chưa triển khai hàm redaction này*).
  - **Nhóm trường thương mại bắt buộc che với mọi mục đích chia sẻ:** Giá trị hóa đơn (`invoice_value`), đơn giá (`unit_price`), thông tin buyer (`buyer_name`, `buyer_contact`), số hợp đồng (`commercial_contract_no`), điều khoản thanh toán (`payment_terms`), phí/margin (`exporter_margin`, `customs_broker_fee`), ghi chú nội bộ (`clerkNote`) và đường dẫn lưu trữ nội bộ (`storagePath`).
  - **Quy tắc đối với `declaredNetWeightKg` và `declaredBoxCount` (Theo quyết định của Founder):**
    - **Hiển thị** `declaredNetWeightKg` và `declaredBoxCount` khi mục đích chia sẻ (`SharePurpose`) là `CUSTOMS_INSPECTION` hoặc `LOGISTICS`.
    - **Ẩn (`undefined` / lược bỏ)** cả `declaredNetWeightKg` và `declaredBoxCount` đối với các mục đích chia sẻ còn lại (`BUYER_VERIFICATION`, `AUDIT`).
    - Áp dụng nhất quán quy tắc này trên cả API danh sách lẫn API chi tiết.
  - **Tuân thủ `SharePurpose` đối với Audit và Bằng chứng hữu cơ:** Quyền truy cập `GET /api/dossiers/:id/audit` (và `/api/v1/...`) cùng `GET /api/dossiers/:id/organic-evidence` (và `/api/v1/...`) của bên nhận chia sẻ bắt buộc được kiểm tra đối chiếu với `purpose` của bản ghi `ShareAccessGrant`.

---

## 5. Đánh Giá Offline / Local-First & Đồng Bộ Hóa (Offline Architecture Trade-off)

### 5.1. Phân tích Hiện trạng Thực địa
- Tại trạm đóng gói (Cai Lậy, Krông Pắc), mạng 4G/Wifi thường xuyên chập chờn vào ban đêm khi mật độ sử dụng tăng cao hoặc trong phòng đóng gói bằng tôn kín.
- Tuy nhiên, việc áp dụng kiến trúc đồng bộ dữ liệu đa chiều (CRDTs, P2P Federation) ở giai đoạn đầu tiềm ẩn rủi ro quá tải kỹ thuật (Over-engineering), vi phạm nguyên tắc YAGNI/KISS.

### 5.2. Quyết định Kiến trúc Bền vững:
1. **Giai đoạn Demo & Pilot kín:** Áp dụng mô hình **Local-first Buffer** đơn giản:
   - Trên trình duyệt, lưu tạm thời chứng từ và thao tác kiểm tra vào `IndexedDB` nội bộ khi mất mạng.
   - Khi có kết nối, gửi hàng đợi tuần tự (Sequential Queue) lên server Bun/SQLite cục bộ tại trạm đóng gói.
2. **Loại trừ tuyệt đối:**
   - **KHÔNG xây dựng Blockchain:** Chi phí vận hành đắt đỏ, độ trễ giao dịch cao, không cần thiết khi SHA-256 Hash Chain đã giải quyết trọn vẹn bài toán chống gian lận.
   - **KHÔNG tự xây dựng mô hình AI/OCR phức tạp tại chỗ:** OCR cục bộ tốn tài nguyên phần cứng tại vựa; ưu tiên quy trình rà soát trực tiếp bằng mắt người có sự trợ giúp của công cụ đối chiếu trường (Field-assisted HITL).

---

## 6. Bản Đồ Khoảng Cách (Gap Analysis) & Lộ Trình 3 Giai Đoạn

### 6.1. Ma trận So sánh Hiện trạng Code và Mục tiêu Kiến trúc

| Thành phần | Hiện trạng thực tế trong Code (`durios`) | Mục tiêu Kiến trúc Pilot Kín (v1.0) | Khoảng cách kỹ thuật cần bổ sung sau khi duyệt |
|---|---|---|---|
| **Actor Resolution (3 Phương thức)** | Lấy trực tiếp từ header `x-actor-role`, `x-tenant-id` hoặc query params (`src/server/actor-resolver.ts:24-57`) — Lỗ hổng VULN-01 | Hỗ trợ cả 3 phương thức (Tài khoản/mật khẩu + session, OTP Zalo/SMS, Managed pilot token) cùng phân giải về một danh tính actor do server xác thực; không tin header/query client | Thay thế `resolveLocalActor` bằng bộ xác thực 3 phương thức phía server. |
| **Mô hình Role & Cặp Hợp lệ** | Mới có `UserRole` (`src/domain/types.ts:1`); đã chặn `CLERK` gọi `approve`/`export`, nhưng **chưa có `ProductPersona`/`TenantType`** và **chưa chặn `VIEWER`/`AUDITOR`** tại `createDossier`, `uploadDocument`, `verifyField`, `runValidation` và `approve` (`src/domain/dossier-fsm.ts:63`) | Đồng tồn tại `ProductPersona` và `TenantType + UserRole`; từ chối cặp không hợp lệ; `VIEWER`/`AUDITOR` hoàn toàn chỉ đọc; chỉ `CLERK`/`MANAGER`/`ADMIN` được tác nghiệp; chỉ `MANAGER`/`ADMIN` được `approve`, `export`, quản lý share | Bổ sung kiểm tra cặp `ProductPersona – TenantType – UserRole` và khóa chặt RBAC ở mọi hàm ghi/approve/export/share. |
| **Đồng bộ Đường dẫn API** | Mới chỉ định tuyến tiền tố `/api/...` (`src/server/http-router.ts:39-121`) | Hỗ trợ song song cả `/api/...` và `/api/v1/...` bằng cùng handler, xác thực và chính sách phân quyền | Mở rộng `http-router.ts` hỗ trợ cả `/api/...` và `/api/v1/...`. |
| **Lưu trữ Chia sẻ & Bằng chứng Hữu cơ** | Đã có `ShareAccessManager` (`src/sharing/share-access-manager.ts`) và `OrganicEvidenceManager` (`src/organic/organic-evidence-manager.ts`) nhưng **chỉ lưu trên `Map` in-memory**; `SqliteDossierRepository` chỉ lọc cứng `WHERE tenant_id = ?` | Lưu bền vững `share_grants` và `organic_evidence` trong SQLite; `SqliteDossierRepository` hỗ trợ truy vấn hồ sơ được chia sẻ còn hiệu lực | Thêm bảng `share_grants` và `organic_evidence` vào `src/storage/schema-migrations.ts` và tích hợp vào `SqliteDossierRepository`. |
| **Che dữ liệu thương mại (Redaction)** | **Chưa có trong repo core:** `handleGetDossier` và `handleListDossiers` trả nguyên bản toàn bộ trường dữ liệu cho bên được chia sẻ | Tự động che các trường thương mại nhạy cảm và `storagePath` trên **cả API danh sách lẫn chi tiết**; hiển thị `declaredNetWeightKg` và `declaredBoxCount` cho `CUSTOMS_INSPECTION` & `LOGISTICS`, ẩn với các mục đích còn lại | Xây dựng bộ lọc redaction dùng chung cho cả `listDossiers` và `getDossier` theo `SharePurpose`. |
| **Kiểm soát Mục đích Chia sẻ & Thời hạn Hữu cơ** | `handleGetAuditTrail` chưa kiểm tra quyền đọc dossier; `handleListOrganicEvidence` chưa kiểm tra `SharePurpose`; `recordEvidence` chưa chặn chứng chỉ đã hết hạn (`validTo <= now`) và chưa tách bạch 2 lớp trạng thái | Kiểm tra `SharePurpose` khi xem `audit` và `organic-evidence`; tách rõ trạng thái chứng chỉ của tổ chức cấp và trạng thái lưu trữ `EVIDENCE_STORED_NOT_CERTIFIED` của DuriOS; từ chối bằng chứng hết hạn | Cập nhật `OrganicEvidenceManager`, `pilot-handlers.ts` và `document-handlers.ts`. |
| **Sealed Dossier Guard** | Đã triển khai `assertCanValidate` chặn re-validate và chặn upload/verify/organic-evidence khi `isImmutable: true` | Duy trì bất biến tuyệt đối trên mọi thao tác sau khi `EXPORTED` | Đã có trong code; bổ sung kiểm thử tích hợp qua HTTP + SQLite. |
| **B2B Coordination** | Chưa có bảng đơn hàng và Webhook điều phối ký quỹ | Bổ sung mô hình Order FSM và Webhook Handler an toàn cho Escrow ở Giai đoạn 3 (Prompt 6A) | Thuộc phạm vi Cổng 3 (sau khi hoàn tất Pilot kín). |

### 6.2. Lộ trình Triển khai 3 Giai đoạn & Tiêu chí Nghiệm thu

```
┌─────────────────────────────────┐   Cổng 1:   ┌─────────────────────────────────┐   Cổng 2:   ┌─────────────────────────────────┐
│ GIAI ĐOẠN 1: DEMO GIẢ LẬP       │ ──────────> │ GIAI ĐOẠN 2: PILOT KÍN          │ ──────────> │ GIAI ĐOẠN 3: SÀN B2B MỞ         │
│ - Hoàn thiện 3 hành trình demo  │  Duyệt UI/  │ - Vá triệt để VULN-01, VULN-02  │  Đạt SLA,   │ - Mở Marketplace công khai      │
│ - 100% dữ liệu synthetic        │  UX & cốt   │ - Quản lý chứng chỉ hữu cơ thật │  vựa nghiệm │ - Webhook ký quỹ với ngân hàng  │
│ - Gắn nhãn mô phỏng rõ ràng     │  truyện     │ - Thử nghiệm tại 1-3 vựa mục tiêu│  thu        │ - Kết nối mạng lưới thương nhân │
└─────────────────────────────────┘             └─────────────────────────────────┘             └─────────────────────────────────┘
```

---

## 7. Xác Minh & Triệt Tiêu Các Rủi Ro Bảo Mật Server-Side (Security Hardening)

Kiến trúc xác nhận **tuyệt đối không dựa vào giao diện (UI) để bảo vệ hệ thống**. Mọi quy tắc an toàn phải được thực thi cưỡng chế tại Server và Domain Model:

### 7.1. Triệt tiêu VULN-01 (Xác thực 3 Phương thức Phía Server & Chống giả mạo qua Header/Query)
- Tuyệt đối không tin cậy các header (`x-actor-role`, `x-tenant-id`, `x-actor-id`, `x-actor-name`) hoặc query parameters (`?role=`, `?tenantId=`) do client tự gửi lên.
- Cả 3 phương thức xác thực của Pilot kín (Tài khoản/mật khẩu với session, OTP Zalo/SMS, và Managed pilot token theo người/thiết bị) đều bắt buộc phân giải về cùng một danh tính `AuthenticatedActor` do server xác thực và quản lý; nếu thiếu thông tin xác thực hợp lệ thì trả về `401 UNAUTHORIZED`, nếu cặp `ProductPersona – TenantType – UserRole` không hợp lệ thì từ chối ngay (`400`/`403`) mà không tự chọn quyền thay thế.

### 7.2. Triệt tiêu VULN-02 (Cô lập dữ liệu đa tổ chức, Chia sẻ có kiểm soát & Phân định Quyền Đọc/Ghi)
Để thống nhất hoàn toàn với mô hình chia sẻ và lưu trữ SQLite tại Mục 2.3 và Mục 4.3, quy tắc truy cập dữ liệu giữa các tenant được quy định chặt chẽ như sau:

1. **Truy cập của Tenant sở hữu (`dossier.tenantId === actor.tenantId`):**
   - Hồ sơ thuộc tenant sở hữu được truy cập theo đúng `actor.tenantId` đã xác thực phía server, kết hợp kiểm tra vai trò (`role`) cho từng thao tác.
2. **Truy cập đọc của Tenant khác qua Ủy quyền Chia sẻ (`dossier.tenantId !== actor.tenantId`):**
   - Hồ sơ thuộc tenant khác **chỉ được đọc** khi tồn tại bản ghi `ShareAccessGrant` đang còn hiệu lực trong SQLite, khớp chính xác đồng thời:
     - `dossier_id = dossier.id`
     - `grantee_tenant_id = actor.tenantId`
     - `is_revoked = 0` và `expires_at > thời điểm hiện tại`
     - Đúng `scope` và đúng `purpose` tương ứng với tài nguyên đang truy cập (ví dụ: đọc `audit` hoặc `organic-evidence` phải khớp với `SharePurpose` được phép).
   - Mọi bản ghi grant đã hết hạn (`expires_at <= now`) hoặc đã bị thu hồi (`is_revoked = 1`) đều bị từ chối ngay lập tức (`403` / `404`).
   - **Quy tắc truy vấn SQLite:** Không viết câu lệnh SQL đọc hồ sơ (`findById`, `listForTenant`) chỉ lọc cứng `WHERE tenant_id = actor.tenantId` làm loại bỏ các hồ sơ được chia sẻ hợp lệ; câu truy vấn đọc phải bao gồm cả hồ sơ do `actor.tenantId` sở hữu HOẶC hồ sơ có `share_grants` đang còn hiệu lực cho `grantee_tenant_id = actor.tenantId`, sau đó bắt buộc đi qua bộ lọc che dữ liệu thương mại (redaction) đối với mọi hồ sơ không thuộc quyền sở hữu của người gọi.
3. **Phân định độc lập Quyền Ghi theo từng thao tác (No Implied Write from Shared Read):**
   - **Tuyệt đối không suy diễn quyền ghi từ quyền đọc được chia sẻ (`findById` / `getOrThrow`).** Mỗi thao tác ghi phải kiểm tra tường minh quyền sở hữu tenant và vai trò:
     - `createDossier`, `uploadDocument`, `runValidation`, `recordOrganicEvidence`: Chỉ cho phép vai trò tác nghiệp (`CLERK`, `MANAGER`, `ADMIN`) của **chính tenant sở hữu (`dossier.tenantId === actor.tenantId`)**; từ chối `VIEWER`, `AUDITOR` và mọi tenant được chia sẻ.
     - `approveForExport`, `exportDossier`, `grantShare`, `revokeShare`: Chỉ cho phép `MANAGER` và `ADMIN` của **chính tenant sở hữu (`dossier.tenantId === actor.tenantId`)**; từ chối `CLERK`, `VIEWER`, `AUDITOR` và mọi tenant được chia sẻ.
   - **Ngoại lệ duy nhất cho thao tác xác minh trường (`verifyField` qua `READ_AND_VERIFY`):**
     - Thao tác `verifyField` được phép thực hiện bởi:
       1. Vai trò `CLERK`, `MANAGER` hoặc `ADMIN` thuộc **tenant sở hữu dossier**; HOẶC
       2. Vai trò `CLERK`, `MANAGER` hoặc `ADMIN` thuộc **tenant đối tác nhận chia sẻ** khi và chỉ khi có `ShareAccessGrant` đang còn hiệu lực với `scope === "READ_AND_VERIFY"`.
     - Ngay cả khi tenant đối tác có grant `READ_AND_VERIFY`, các vai trò chỉ đọc (`VIEWER`, `AUDITOR`) của tenant đó vẫn **bị cấm gọi `verifyField`** (`403 INSUFFICIENT_ROLE`), và grant `READ_ONLY` tuyệt đối không được gọi `verifyField`.

### 7.3. Bảo vệ Vòng đời Niêm phong (Sealed Invariant Enforcement)
- Khi một Dossier đã đạt trạng thái `EXPORTED` (hoặc `CLOSED`, `CANCELLED`, `isImmutable: true`), cấm vĩnh viễn mọi thao tác làm thay đổi trạng thái hoặc dữ liệu, bao gồm:
  - Tải thêm tài liệu (`uploadDocument`).
  - Xác minh hoặc chỉnh sửa lại trường dữ liệu (`verifyField`).
  - Chạy lại thẩm định quy tắc (`runValidation`).
  - Đính kèm thêm bằng chứng hữu cơ (`recordOrganicEvidence`).
- Mọi nỗ lực gọi API vi phạm đều bị chặn tại Server với mã lỗi `409 DOSSIER_IMMUTABLE`.

---

## 8. Ma Trận Kiểm Thử Kỹ Thuật & Tiêu Chí Nghiệm Thu Pilot Kín (HTTP + SQLite Acceptance Criteria)

Để nghiệm thu kỹ thuật cho **Giai đoạn 2 — Pilot Kín (Prompt 5A)** theo quy chuẩn zero `:any`, toàn bộ các cụm tiêu chí dưới đây bắt buộc được kiểm chứng tự động qua **tầng HTTP Router kết nối cơ sở dữ liệu SQLite thực tế** (không chỉ gọi hàm in-memory; *lưu ý: các tính năng chưa có trong code hiện tại như xác thực 3 phương thức, bộ kiểm tra role tuple, redaction và alias `/api/v1/...` được quy định tại đây làm tiêu chí nghiệm thu cho chặng triển khai, chưa tuyên bố đã có sẵn trong code*):

| Cụm Nghiệm Thu (HTTP + SQLite) | Mục Tiêu Kiểm Định | Kịch Bản Kiểm Thử Bắt Buộc (Acceptance Test Cases) |
|---|---|---|
| **1. Xác thực Server-Side qua 3 Phương thức & Chống giả mạo Header/Query** | Danh tính Actor đáng tin cậy do Server quản lý | - **Xác thực thành công trên cả 3 phương thức qua HTTP:**<br>  1. *Tài khoản/mật khẩu với server session* (lưu phiên trong SQLite).<br>  2. *OTP Zalo/SMS với server session* (trong kiểm thử bắt buộc dùng **OTP provider giả lập nội bộ**; tuyệt đối không gọi dịch vụ Zalo/SMS thật ra ngoài).<br>  3. *Managed pilot token* cấp theo người/thiết bị.<br>- **Đồng nhất danh tính (`Unified AuthenticatedActor`):** Khi cả 3 phương thức cùng xác thực một người dùng, xác nhận chúng phân giải về chính xác cùng một `AuthenticatedActor` trên mọi trường: `id`, `name`, `tenantId`, `tenantType`, `role`, `persona`.<br>- **Từ chối thông tin xác thực không hợp lệ (`401 UNAUTHORIZED`):** Kiểm thử request không gửi thông tin xác thực, sai mật khẩu, OTP sai hoặc đã hết hạn, session hoặc managed token đã hết hạn hoặc đã bị thu hồi đều bị từ chối `401` (không tự động gán mặc định `CLERK` hay `TENANT-LOCAL-001`).<br>- **Chống giả mạo qua Header/Query:** Request gửi kèm header (`x-actor-role`, `x-tenant-id`, `x-actor-id`, `x-actor-name`) hoặc query (`?role=`, `?tenantId=`, `?actorId=`) tuyệt đối không làm thay đổi bất kỳ trường danh tính nào của `AuthenticatedActor` đã xác thực hoặc bị từ chối `401`/`403`. |
| **2. Kiểm chứng Bộ ba `ProductPersona–TenantType–UserRole` & Ma trận RBAC** | Chấp nhận đúng bộ hợp lệ, từ chối bộ sai (`403`) và áp dụng đúng quyền | - **Chấp nhận các bộ hợp lệ theo Bảng Mục 2.1.A:** Kiểm chứng từng bộ hợp lệ (`ORCHARD_OFFICER` + `ORCHARD_COOP` + `CLERK`/`MANAGER`/`ADMIN`; `PACKHOUSE_CLERK` + `PACKHOUSE_EXPORTER` + `CLERK`; `PACKHOUSE_MANAGER` + `PACKHOUSE_EXPORTER` + `MANAGER`/`ADMIN`; `BUYER_VIEWER` + `BUYER_IMPORTER`/đối tác xem + `VIEWER`; `SYSTEM_AUDITOR` + `INSPECTION_AUDITOR`/`PACKHOUSE_EXPORTER`/`ORCHARD_COOP` + `AUDITOR`) được chấp nhận và thực thi đúng ma trận quyền.<br>- **Từ chối bộ không hợp lệ (`403 FORBIDDEN` — Không tự chọn quyền thay thế):** Mọi bộ `ProductPersona–TenantType–UserRole` sai lệch đều bị từ chối `403`, tuyệt đối không tự động hạ quyền, nâng quyền hoặc gán role thay thế. Bắt buộc có ca kiểm thử cụ thể cho:<br>  1. `BUYER_VIEWER` đi cùng `MANAGER` hoặc `CLERK`.<br>  2. `PACKHOUSE_CLERK` đi cùng `MANAGER` hoặc `VIEWER`.<br>  3. `SYSTEM_AUDITOR` đi cùng `CLERK` hoặc `ADMIN`.<br>  4. Persona gắn sai `TenantType` (gồm `ORCHARD_OFFICER` thuộc `BUYER_IMPORTER`, và `PACKHOUSE_MANAGER` thuộc `ORCHARD_COOP`).<br>- **Ma trận `Allow/Deny` cho 5 `UserRole` trên các thao tác:**<br>  - `createDossier`: `CLERK`, `MANAGER`, `ADMIN` (thuộc `PACKHOUSE_EXPORTER`) → `201`; `VIEWER`, `AUDITOR` → `403`.<br>  - `uploadDocument`: `CLERK`, `MANAGER`, `ADMIN` (chủ sở hữu) → `201`; `VIEWER`, `AUDITOR` → `403`.<br>  - `verifyField`: `CLERK`, `MANAGER`, `ADMIN` (chủ sở hữu hoặc có grant `READ_AND_VERIFY`) → `200`; `VIEWER`, `AUDITOR` → `403`.<br>  - `runValidation`: `CLERK`, `MANAGER`, `ADMIN` (chủ sở hữu) → `200`; `VIEWER`, `AUDITOR` → `403`.<br>  - `approveForExport`, `exportDossier`, và `grant/revoke share`: `MANAGER`, `ADMIN` (chủ sở hữu) → `200`/`201`; `CLERK`, `VIEWER`, `AUDITOR` → `403`.<br>- **Giới hạn `ADMIN` trong phạm vi Tenant:** Kiểm chứng `ADMIN` của Tenant A không có bất kỳ quyền xuyên tenant nào sang Tenant B nếu không có share grant hợp lệ (`403`/`404`). |
| **3. Tương đương Hành vi giữa Hai Tiền tố `/api/...` và `/api/v1/...`** | Đồng nhất 100% giữa `/api/...` và `/api/v1/...` (*tiêu chí cho chặng triển khai, chưa có sẵn trong code*) | Kiểm chứng các cặp endpoint tương ứng dưới `/api/...` và `/api/v1/...` cho kết quả **tương đương hoàn toàn** về: (a) xác thực và phân quyền, (b) mã trạng thái HTTP và mã lỗi chuẩn, (c) cấu trúc và nội dung phản hồi JSON, và (d) hành vi allow/deny đối với chủ sở hữu, bên được chia sẻ và bên không có quyền trên cả **7 nhóm route được bảo vệ**:<br>1. **Dossier:** `GET/POST .../dossiers`, `GET .../dossiers/:id`<br>2. **Documents & Verify:** `POST .../dossiers/:id/documents`, `POST .../dossiers/:id/documents/:docId/fields/:fieldId/verify`<br>3. **Validate:** `POST .../dossiers/:id/validate`<br>4. **Approve & Export:** `POST .../dossiers/:id/approve`, `POST .../dossiers/:id/export`<br>5. **Manifest & Audit:** `GET .../dossiers/:id/manifest`, `GET .../dossiers/:id/audit`<br>6. **Shares:** `POST/GET .../dossiers/:id/shares`, `POST .../dossiers/:id/shares/:grantId/revoke`<br>7. **Organic Evidence:** `POST/GET .../dossiers/:id/organic-evidence` |
| **4. Cô lập Chéo Tenant & Vòng đời Chia sẻ (`Scope`, `Purpose`, Hết hạn, Thu hồi)** | Kiểm soát truy cập chéo tổ chức | - **Không có grant:** Tenant B (kể cả `ADMIN` của Tenant B) gọi `GET .../dossiers/:id` của Tenant A → Bị chặn (`404`/`403`), và `GET .../dossiers` của Tenant B không chứa hồ sơ của Tenant A.<br>- **Grant `READ_ONLY`:** Tenant B đọc được hồ sơ của Tenant A qua cả danh sách và chi tiết, nhưng bị chặn (`403`) khi gọi `uploadDocument`, `verifyField`, `runValidation`, `approve`, `export`, `recordOrganicEvidence`.<br>- **Grant `READ_AND_VERIFY`:** Role `CLERK`/`MANAGER`/`ADMIN` của Tenant B được phép gọi `verifyField`, nhưng `VIEWER`/`AUDITOR` của Tenant B vẫn bị chặn (`403`), và Tenant B vẫn bị chặn hoàn toàn trên `uploadDocument`, `runValidation`, `approve`, `export`.<br>- **Hết hạn & Thu hồi:** Khi `expiresAt` đã qua hoặc sau khi Tenant A gọi `POST .../shares/:grantId/revoke`, yêu cầu đọc/verify tiếp theo của Tenant B trên SQLite HTTP Server lập tức bị từ chối. |
| **5. Che dữ liệu Thương mại (Redaction) trên cả Danh sách & Chi tiết** | Bảo mật bí mật thương mại | - Khi Tenant B (được chia sẻ hợp lệ) gọi **cả API danh sách (`GET .../dossiers`) lẫn API chi tiết (`GET .../dossiers/:id`)**, response bắt buộc đã loại bỏ các trường thương mại nhạy cảm (`invoice_value`, `unit_price`, `buyer_name`, `buyer_contact`, `commercial_contract_no`, `payment_terms`, `exporter_margin`, `customs_broker_fee`, `clerkNote`) và ẩn `storagePath`.<br>- **Kiểm chứng quy tắc `declaredNetWeightKg` và `declaredBoxCount`:** Khi `purpose` là `CUSTOMS_INSPECTION` hoặc `LOGISTICS`, hai trường này được hiển thị trên cả danh sách và chi tiết; khi `purpose` là `BUYER_VERIFICATION` hoặc `AUDIT`, cả hai trường này đều bị ẩn trên cả danh sách và chi tiết.<br>- Khi chính Tenant A (chủ sở hữu) gọi API, toàn bộ dữ liệu hiển thị đầy đủ. |
| **6. Kiểm soát Quyền Xem `Audit Trail` & `Organic Evidence` theo `SharePurpose`** | Giới hạn theo mục đích chia sẻ | - Tenant không có quyền truy cập dossier gọi `GET .../dossiers/:id/audit` hoặc `GET .../dossiers/:id/organic-evidence` → Bị chặn `404`/`403` (không trả `200 OK` kèm mảng rỗng).<br>- Tenant được chia sẻ chỉ xem được `audit` khi grant có `purpose` cho phép kiểm toán/thanh tra (`AUDIT`, `CUSTOMS_INSPECTION`), và chỉ xem được `organic-evidence` khi `purpose` phù hợp (`BUYER_VERIFICATION`, `CUSTOMS_INSPECTION`, `AUDIT`); bị từ chối (`403`) nếu grant chỉ có mục đích `LOGISTICS`. |
| **7. Tính bền vững SQLite (`Process Restart`) & Ranh giới Bằng chứng Hữu cơ** | Lưu trữ lâu dài & Không tự chứng nhận | - Khởi tạo dữ liệu (`dossiers`, `share_grants`, `organic_evidence`), đóng kết nối / khởi động lại instance `createWorkspaceApp` trên cùng file SQLite: toàn bộ trạng thái chia sẻ, trạng thái đã thu hồi (`revoked`) và danh sách bằng chứng hữu cơ vẫn được bảo toàn chính xác.<br>- Thử ghi nhận bằng chứng hữu cơ đã hết hạn (`validTo <= now`) hoặc thiếu nguồn cấp (`certifierName`, `certificateNumber`) → Bị từ chối `400`/`422`.<br>- Bản ghi hữu cơ hợp lệ phải tách rõ trạng thái chứng chỉ của đơn vị cấp (`issuerClaimedStatus`) và trạng thái lưu trữ hồ sơ của DuriOS (`EVIDENCE_STORED_NOT_CERTIFIED`) kèm `DURIOS_ORGANIC_DISCLAIMER`. |
| **8. Bất biến trên Hồ sơ đã Niêm phong (`Sealed Dossier Invariants`)** | Chống sửa đổi sau khi `EXPORTED` | - Sau khi dossier chuyển sang `EXPORTED` (`isImmutable: true`), mọi lệnh gọi HTTP `POST .../documents` (upload), `POST .../verify` (verify field), `POST .../validate` (re-validate) và `POST .../organic-evidence` (ghi bằng chứng hữu cơ) đều bị chặn ở Server với mã `409 Conflict` (`DOSSIER_IMMUTABLE`).<br>- Kiểm tra tính toàn vẹn chuỗi băm SHA-256 (`verifyIntegrity`) trên sổ cái SQLite trước và sau khi niêm phong. |

> **Phân định phạm vi Giai đoạn sau (Cổng 3 — Không thuộc điều kiện nghiệm thu Pilot kín Prompt 5A):**  
> Các kịch bản kiểm thử liên quan đến **B2B Marketplace, khớp lệnh đơn hàng (`MarketplaceOrder`) và Webhook điều phối ký quỹ (`Escrow Webhook HMAC Signature & Idempotency`)** thuộc phạm vi **Giai đoạn 3 (Prompt 6A)** và không nằm trong điều kiện chặn của Pilot kín.

---

## 9. Backlog Triển Khai Theo Thứ Tự Ưu Tiên (Implementation Backlog)

Đối chiếu trực tiếp với `PRODUCT-PRD-V1.md`, `CLAUDE-CODE-PROMPT-CAMPAIGN.md` và trạng thái thực tế của hai repo (`/Users/macbook/durios` và `/Users/macbook/durios-frontend-demo`), lộ trình backlog được cập nhật và sắp xếp không trùng lặp như sau:

1. **[Giai đoạn 1 — Prompt 4A] Demo cục bộ bằng dữ liệu giả trong repo lõi (`/Users/macbook/durios`):**
   - *Hiện trạng xác minh trong code:* Repo lõi đã có luồng vertical slice cho `ContainerDossier` (tạo dossier, tải tài liệu mẫu, xác minh HITL, chạy validation, phê duyệt, xuất manifest, kiểm tra chuỗi băm kiểm toán) cùng giao diện tĩnh `src/server/public/index.html` và các bộ test tương ứng (`test/http-api.test.ts`, `test/static-ui-contract.test.ts`, `test/ui-sample-upload.test.ts`). Ngoài ra, working tree đã có bản mẫu in-memory cho chia sẻ hồ sơ (`src/sharing/share-access-manager.ts`), bằng chứng hữu cơ (`src/organic/organic-evidence-manager.ts`) và các route tại `src/server/pilot-handlers.ts`.
   - *Trạng thái nghiệm thu cổng:* Đã có hiện thực kỹ thuật trong working tree nhưng **chưa có biên bản xác nhận duyệt Cổng Demo tổng thể của Founder** trong tài liệu chiến dịch.

2. **[Giai đoạn 1 — Prompt 4B & Prompt 5B] Demo trình bày 3 năng lực và trải nghiệm đa tổ chức trong repo demo (`/Users/macbook/durios-frontend-demo`):**
   - *Hiện trạng xác minh trong repo demo:* Working tree của `/Users/macbook/durios-frontend-demo` đã có các module giao diện trình diễn, bộ dữ liệu giả định (`synthetic-dossier-001/002/003`), bộ chọn 5 persona giả định (`src/server/public/js/state/personas.js`), tuyên bố miễn trừ chứng nhận hữu cơ và bài kiểm thử `test/multi-tenant-pilot.test.ts` (đã rà soát disclosure tên tổ chức giả định).
   - *Trạng thái nghiệm thu cổng:* Đã có trong working tree của repo demo nhưng **chưa được đánh dấu nghiệm thu chính thức tại Cổng Founder** cho tới khi Founder xác nhận.

3. **[Giai đoạn 2 — Prompt 5A] Hoàn thiện Pilot Kín Đa Tổ Chức trong repo lõi (`/Users/macbook/durios` — Chỉ thực hiện sau khi Founder duyệt PRD & Kiến trúc):**
   Các hạng mục kỹ thuật còn thiếu của Prompt 5A được gom thành 6 công việc rõ ràng, không trùng lặp:
   - **5A-1. Xác thực Actor Phía Server (3 Phương thức) & Chống giả mạo Header/Query:** Thay thế `resolveLocalActor` trong `src/server/actor-resolver.ts` bằng bộ xác thực hỗ trợ (a) Tài khoản/mật khẩu + session, (b) OTP Zalo/SMS + session (dùng provider giả lập trong môi trường kiểm thử), và (c) Managed pilot token theo người/thiết bị; phân giải về cùng một `AuthenticatedActor` do server quản lý và từ chối `401` khi không hợp lệ.
   - **5A-2. Mô hình `ProductPersona–TenantType–UserRole` & Khóa chặt Ma trận RBAC:** Bổ sung kiểm tra bộ ba hợp lệ theo Bảng Mục 2.1.A (từ chối `403` mọi cặp sai lệch, không tự chọn quyền thay thế); chặn tuyệt đối `VIEWER` và `AUDITOR` trên mọi thao tác ghi (`createDossier`, `uploadDocument`, `verifyField`, `runValidation`, `approveForExport`, `exportDossier`, `recordOrganicEvidence`, `grant/revoke share`); giữ `ADMIN` trong phạm vi từng tenant và duy trì khóa bất biến `409 DOSSIER_IMMUTABLE` trên hồ sơ đã niêm phong.
   - **5A-3. Lưu trữ SQLite Bền vững cho `share_grants` và `organic_evidence`:** Thêm migration tạo bảng `share_grants` và `organic_evidence` trong `src/storage/schema-migrations.ts`; nâng cấp `SqliteDossierRepository` để truy vấn đọc bao gồm cả hồ sơ thuộc tenant sở hữu và hồ sơ có `share_grants` đang còn hiệu lực (`is_revoked = 0`, `expires_at > now`).
   - **5A-4. Hoàn thiện Ranh giới Bằng chứng Hữu cơ & Kiểm soát theo `SharePurpose`:** Tách bạch trường trạng thái chứng chỉ của đơn vị cấp (`issuerClaimedStatus`) và trạng thái lưu trữ không tự chứng nhận của DuriOS (`duriosRecordStatus: EVIDENCE_STORED_NOT_CERTIFIED`); từ chối bằng chứng đã hết hạn (`validTo <= now`) hoặc bị đình chỉ; bắt buộc kiểm tra `SharePurpose` hợp lệ khi bên nhận chia sẻ truy cập `GET .../audit` và `GET .../organic-evidence`.
   - **5A-5. Che Dữ liệu Nhạy cảm Thương mại (Redaction) & Đồng bộ Tiền tố `/api/...` + `/api/v1/...`:** Triển khai hàm redaction dùng chung cho cả API danh sách và chi tiết khi người xem không phải chủ sở hữu (che các trường thương mại nhạy cảm và `storagePath`; hiển thị `declaredNetWeightKg` và `declaredBoxCount` cho `CUSTOMS_INSPECTION` và `LOGISTICS`, ẩn với `BUYER_VERIFICATION` và `AUDIT`); định tuyến song song `/api/...` và `/api/v1/...` vào cùng handler và cùng tầng kiểm tra quyền.
   - **5A-6. Bộ Kiểm thử Nghiệm thu Tích hợp HTTP + SQLite:** Viết và chạy bộ kiểm thử tự động bao phủ toàn bộ 8 cụm tiêu chí tại Mục 8 qua HTTP Router + SQLite (bao gồm kiểm chứng dữ liệu bảo toàn qua `process restart`).

4. **[Giai đoạn 3 — Prompt 6A & Prompt 6B] B2B Marketplace & Điều phối Thanh toán Ký quỹ (Giai đoạn sau — Chỉ mở sau khi hoàn tất và nghiệm thu Pilot kín):**
   - Thiết kế và triển khai bảng SQLite cho chào hàng, khớp lệnh đơn hàng (`MarketplaceOrders`), nhật ký điều phối ký quỹ (`EscrowLogs`), và Webhook receiver kiểm tra chữ ký HMAC + Idempotency với đối tác thanh toán/ngân hàng được cấp phép trên repo lõi (`Prompt 6A`), cùng giao diện mô phỏng tương ứng trên repo demo (`Prompt 6B`), đảm bảo nguyên tắc DuriOS không sở hữu hàng hóa và không giữ tiền.

---

## 10. Bảng Tổng Hợp Quyết Định Đã Ghi Nhận & Các Câu Hỏi Mở Còn Lại

| Phân loại | Nội dung chi tiết | Hiện trạng & Bước tiếp theo |
|---|---|---|
| **QUYẾT ĐỊNH CỦA FOUNDER ĐÃ GHI NHẬN (Founder Decisions Recorded)** | 1. **Ranh giới nền tảng & Kiến trúc lõi:** Tách biệt tuyệt đối Core (`durios`) và Presentation (`durios-frontend-demo`). Lưu trữ SHA-256 Content-Addressed cho tài liệu và SHA-256 Hash Chained Audit Ledger. Không dùng Blockchain, không tự xây OCR cục bộ phức tạp. DuriOS không sở hữu hàng/tồn kho, không chạm vào dòng tiền và không tự cấp chứng nhận hữu cơ.<br>2. **Xác thực Phía Server (3 Phương thức):** Pilot hỗ trợ cả 3 cách: (a) Tài khoản/mật khẩu với session, (b) OTP Zalo/SMS, và (c) Managed pilot token theo người/thiết bị. Cả 3 đều phân giải về cùng một danh tính actor do server xác thực; tenant và quyền do server quản lý; tuyệt đối không tin role, tenant hoặc actor từ header/query client gửi.<br>3. **Mô hình Role & Ma trận quyền:** Cùng tồn tại `ProductPersona` và `TenantType + UserRole` trong runtime; từ chối cặp persona–tenant–role không hợp lệ và không tự chọn quyền thay thế. `ADMIN` giới hạn trong phạm vi từng tenant. `VIEWER`/`AUDITOR` chỉ đọc; `CLERK`/`MANAGER`/`ADMIN` được tác nghiệp theo tenant sở hữu; `MANAGER`/`ADMIN` được `approve`, `export` và quản lý share; role tác nghiệp ở tenant nhận share chỉ được `verifyField` khi có `READ_AND_VERIFY`.<br>4. **Đồng bộ Đường dẫn API:** Hỗ trợ đồng thời cả `/api/...` và `/api/v1/...` bằng cùng handler, xác thực và chính sách phân quyền.<br>5. **Quy tắc Redaction theo Mục đích chia sẻ:** Hiển thị `declaredNetWeightKg` và `declaredBoxCount` với `CUSTOMS_INSPECTION` và `LOGISTICS`; ẩn với các mục đích chia sẻ còn lại (`BUYER_VERIFICATION`, `AUDIT`). Áp dụng nhất quán kèm việc che các trường thương mại nhạy cảm trên cả API danh sách và chi tiết.<br>6. **Phạm vi Pilot & Giả thuyết giá:** Phạm vi pilot kín là **1–3 vựa**. Các mức giá **5.000.000 VNĐ/5 container**, **60.000.000 VNĐ/năm** và phí setup **10.000.000 VNĐ** được giữ làm **giả thuyết cần kiểm chứng**, không ghi là giá đã được duyệt cố định. | Đã ghi nhận vào Kiến trúc v1.0; chờ Founder phê duyệt tài liệu để bắt đầu triển khai code. |
| **THÔNG TIN & CÂU HỎI PHÁP LÝ / BÊN NGOÀI CÒN MỞ (Open External Unknowns)** | 1. Văn bản công báo chính thức của Trung Quốc (GB 2762-2022) về phân loại sầu riêng và ngưỡng Cadmium 0.050 mg/kg (vẫn giữ nguyên trạng thái chưa kích hoạt `RUL-GB2762-CD`).<br>2. Cơ chế chính thức của Cục BVTV về việc theo dõi sản lượng xuất khẩu theo Mã số vùng trồng (MSVT Quota) và khả năng kết nối chứng từ điện tử (e-Phyto/NSW).<br>3. Quy chuẩn kỹ thuật của Ngân hàng/Đối tác thanh toán được cấp phép về định dạng Webhook ký quỹ (chờ thỏa thuận đối tác cụ thể ở Giai đoạn 3 — Marketplace). | Giữ ở trạng thái câu hỏi mở và giữ rào chắn an toàn trong code. |

---
*Xác nhận trạng thái tài liệu: **APPROVED — Founder approval, 2026-10-14**.*
