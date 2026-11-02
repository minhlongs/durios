# ĐỀ XUẤT CHÍNH SÁCH KHAI TRƯƠNG PILOT (GATE-05A / GATE-05B & VÒNG ĐỜI 5 TRẠNG THÁI)

**Mã tài liệu:** `docs/pilot-readiness/08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md`  
**Ngày lập:** 2026-11-02  
**Trạng thái chính sách:** **PENDING_FOUNDER_APPROVAL** (Chưa có chữ ký phê duyệt của Founder — hệ thống giữ nguyên trạng thái mặc định `BLOCKED` đối với dữ liệu khách hàng thật)  
**Đối tượng áp dụng:** Đợt Pilot kín 01 vựa đầu tiên (`SITE-CAILAY-TIENGIANG-01` / `TENANT-CAILAY-PILOT-01`)  

---

## 1. Tóm Tắt Vấn Đề Cần Giải Quyết (Vì Sao Phải Tách GATE-05A / GATE-05B Trong Runtime)

Trước đợt đồng bộ này, tài liệu `01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md` (mục 3.1.6) đã phân biệt hai mốc:
- **`GATE-05A` (Pre-Cutover Rehearsal):** Diễn tập bấm giờ 5 container giả lập (có ≥ 2 ca gài lỗi mù) trên DB diễn tập riêng biệt để mở khóa nạp 5 container thật đầu tiên.
- **`GATE-05B` (Live 5-Container Graduation):** Nghiệm thu 5 container thật đầu tiên tại vựa dưới đồng hồ bấm giờ độc lập để hoàn tất đợt Pilot.

Tuy nhiên, mã runtime trong `src/auth/pilot-gate-report-builder.ts` trước đây gộp chung thành một `GATE-05` duy nhất, dẫn đến **vòng khóa (circular deadlock)** khi chuyển sang cơ sở dữ liệu vận hành sạch:
1. Nếu chạy trên **DB diễn tập**, `cohortProvenance.synthetic === true` nên mọi cổng bị khóa ở `MACHINE_CHECK_ONLY` (`0/5` cổng mở).
2. Khi khởi tạo **DB vận hành sạch mới (`0` container)** theo đúng quy trình sau diễn tập, `GATE-05` lập tức `FAIL` vì `totalContainers = 0 < 5`.
3. Để `GATE-05` đạt `5/5`, vựa buộc phải nạp 5 container thật trước — nhưng quy tắc cổng chặn lại cấm nạp dữ liệu thật khi chưa đạt đủ 5 cổng.

---

## 2. Kiến Trúc Máy Trạng Thái 5 Bước (`PilotLifecycleState`) Đề Xuất Trình Founder

Mã nguồn đã được nâng cấp (`src/auth/pilot-lifecycle-types.ts`, `src/auth/pilot-lifecycle-policy.ts`, `src/auth/founder-pilot-authorization.ts`, `src/workspace/pilot-quota-guard.ts`) để tách bạch **3 quyết định độc lập** mà không làm yếu bất kỳ chốt chặn an toàn nào:

| Trạng thái (`PilotLifecycleState`) | Trạng thái chính sách (`policyStatus`) | Điều kiện kích hoạt | `canStartLimitedFiveContainerPilot` | `goForLiveCustomerData` | Trần tạo hồ sơ (`createDossier`) |
|---|---|---|---|---|---|
| **`BLOCKED`** | `PREREQUISITES_INCOMPLETE` | Mặc định khi thiếu `GATE-01..04`, thiếu `GATE-05A`, hoặc đang chạy trên DB diễn tập (`SYNTHETIC_REHEARSAL`). | `false` | `false` | Chặn (`0` container khi bật guard) |
| **`READY_FOR_FOUNDER_REVIEW`** | `PENDING_FOUNDER_APPROVAL` | DB vận hành sạch (`0` tín hiệu synthetic, `verifyIntegrity() === true`) + `GATE-01..04` đạt `EVIDENCED_FOR_LAUNCH` + có biên bản diễn tập `GATE-05A` hợp lệ (`DURIOS_GATE05A_EVIDENCE_FILE`), nhưng **chưa có tệp quyết định của Founder**. | `false` | `false` | Chặn (`0` container khi bật guard) |
| **`LIMITED_PILOT_AUTHORIZED`** | `LIMITED_PILOT_AUTHORIZED` | Đạt `READY_FOR_FOUNDER_REVIEW` **VÀ** có tệp quyết định `DURIOS_FOUNDER_PILOT_AUTH_FILE` hợp lệ (`maxContainers: 5`, khớp `siteCode`, `tenantId`, chưa hết hạn, chưa thu hồi, khớp `gate05AEvidenceSha256` nếu khai báo). | **`true`** | **`false`** | **Trần cứng tối đa `5` container** (`usedContainers < 5`) |
| **`PILOT_COMPLETED`** | `PILOT_GRADUATED` | Đạt `LIMITED_PILOT_AUTHORIZED` **VÀ** đủ 5 container vận hành thật đạt KPI `GATE-05B` (`meanDeltaSeconds < 300`, `zeroMissGate === true`, `0` lỗi P0) kèm biên bản bấm giờ `DURIOS_GATE05B_EVIDENCE_FILE`. | `true` | **`true`** | Mở cho vận hành tại site đã nghiệm thu |
| **`PILOT_HOLD`** | `HOLD_ACTIVE` | Phanh khẩn cấp khi: (a) đứt chuỗi băm kiểm toán (`UNPROVEN_LEDGER_INTEGRITY`), (b) phát hiện trộn chứng từ synthetic vào DB vận hành, (c) `DURIOS_PILOT_HOLD=true`, hoặc (d) tệp ủy quyền Founder bị thu hồi (`revoked: true`), hết hạn (`expiresAt <= now`) hoặc sai phạm vi/SHA-256. | `false` | `false` | Khóa tức thì |

---

## 3. Cấu Trúc Tệp Quyết Định Ủy Quyền Pilot Giới Hạn Của Founder (`DURIOS_FOUNDER_PILOT_AUTH_FILE`)

Khi Founder quyết định cho phép bắt đầu thử nghiệm 5 container thật đầu tiên tại vựa Cai Lậy (sau khi đã kiểm tra biên bản `GATE-01..04` và `GATE-05A`), Founder tạo và ký tệp JSON theo mẫu sau (đặt ngoài kho mã nguồn, quyền `0600`):

```json
{
  "authorizationVersion": "1.0.0",
  "authorizationId": "FOUNDER-AUTH-CAILAY-20261102-01",
  "siteCode": "SITE-CAILAY-TIENGIANG-01",
  "tenantId": "TENANT-CAILAY-PILOT-01",
  "authorizedBy": "Founder (Họ tên & chữ ký xác nhận)",
  "authorizedAt": "2026-11-02T09:00:00.000Z",
  "expiresAt": "2026-12-02T09:00:00.000Z",
  "maxContainers": 5,
  "gate05AEvidenceSha256": "<sha256-của-tệp-biên-bản-diễn-tập-GATE-05A>",
  "revoked": false,
  "note": "Cho phép chạy thử nghiệm có kiểm soát tối đa 05 container thật đầu tiên tại vựa Cai Lậy."
}
```

### Quy tắc kiểm tra tự động (`src/auth/founder-pilot-authorization.ts`)
1. Không có biến `DURIOS_FOUNDER_PILOT_AUTH_FILE` $\rightarrow$ giữ `PENDING_FOUNDER_APPROVAL` (`valid: false`).
2. `maxContainers` bắt buộc bằng `5` (`maxContainers === 5`). Mọi số khác bị từ chối (`INVALID_SCOPE_OR_ARTIFACT`).
3. `siteCode` và `tenantId` phải khớp tuyệt đối với site/tenant đang kiểm định.
4. Nếu khai báo `gate05AEvidenceSha256`, mã băm này phải khớp với SHA-256 thực tế của tệp biên bản `DURIOS_GATE05A_EVIDENCE_FILE`.
5. Nếu `revoked === true`, có `holdReason`, hoặc `expiresAt <= now` $\rightarrow$ chuyển ngay sang `PILOT_HOLD`.

---

## 4. Các Chốt Chặn An Toàn Không Đổi (Non-Negotiable Invariants)

1. **`goForLiveCustomerData` luôn bằng `false`** ở mọi trạng thái trước `PILOT_COMPLETED` (kể cả khi đang ở `LIMITED_PILOT_AUTHORIZED`).
2. **Không bao giờ dùng dữ liệu synthetic để mở cổng vận hành:** Mọi hồ sơ có sự kiện `SYNTHETIC_DOCUMENT_INGESTED` hoặc `REHEARSAL_DOSSIER_SEEDED` trong sổ kiểm toán đều ép `evidenceProvenance = "SYNTHETIC_REHEARSAL"` hoặc kích hoạt `PILOT_HOLD` nếu bị trộn vào DB vận hành.
3. **Đếm hạn ngạch chống lách luật xóa-tạo lại:** `countUsedPilotContainers` đếm `Math.max(activeDossiers, distinctCreatedDossierIdsInAuditLedger)` của tenant để không thể xóa hồ sơ nháp nhằm vượt trần 5 container.
4. **Ranh giới tin cậy (Trust Boundary):** Mọi tệp bằng chứng (`DURIOS_GATE01..05B_EVIDENCE_FILE`) và tệp ủy quyền Founder (`DURIOS_FOUNDER_PILOT_AUTH_FILE`) chỉ đọc từ biến môi trường của tiến trình hoặc tham số CLI nội bộ trên máy chủ on-prem; **không có bất kỳ HTTP endpoint nào** cho phép tải lên hay ghi đè bằng chứng từ xa.

---

## 5. Phần Xác Nhận Dành Cho Founder (Chờ Phê Duyệt)

- [ ] **Chưa phê duyệt (Mặc định hiện hành):** Giữ nguyên `PENDING_FOUNDER_APPROVAL` và `BLOCKED`.
- [ ] **Phê duyệt khung chính sách `GATE-05A` / `GATE-05B`:** Đồng ý sử dụng quy trình 5 trạng thái (`BLOCKED` $\rightarrow$ `READY_FOR_FOUNDER_REVIEW` $\rightarrow$ `LIMITED_PILOT_AUTHORIZED` $\rightarrow$ `PILOT_COMPLETED` / `PILOT_HOLD`) làm chuẩn kiểm định Stage 0.
- [ ] **Phê duyệt mở khóa `LIMITED_PILOT_AUTHORIZED` (chỉ ký sau khi có đủ hiện vật `GATE-01..04` + `GATE-05A`):** Cấp tệp `DURIOS_FOUNDER_PILOT_AUTH_FILE` cho phép tối đa 05 container đầu tiên tại `SITE-CAILAY-TIENGIANG-01`.
