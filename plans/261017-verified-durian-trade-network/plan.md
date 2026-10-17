# Implementation Plan: DuriOS Verified Durian Trade Network

## Context & Background
Theo bản luận điểm chiến lược toàn diện của Founder:
"DuriOS = Verified Durian Trade Network - Hệ điều hành biến một container sầu riêng từ tập hợp hàng hóa + giấy tờ rời rạc thành một giao dịch xuất khẩu có thể kiểm chứng, điều phối và giao dịch được."
Đơn vị nguyên tử là **Verified Export Shipment / Verified Container**.
Sequencing bắt buộc: **System of Record -> System of Verification -> Closed Network -> Transaction Network -> Regional Infrastructure**.

## Implementation Phases

### Phase 1: Strategic Documentation & Economics Alignment (`docs/product-direction/`)
1. **Cập nhật `PRODUCT-VISION-V2.md`:**
   - Bổ sung định vị "Verified Durian Trade Network".
   - 11 Core Ontology Entities (Organization, Production Source, Lot, Test Evidence, Document, Container, Seal, Custody Event, Exception, Trade, Permission).
   - 6-Tier Moat Ladder (Workflow -> Evidence -> Outcome -> Reputation -> Network -> Regulatory Adapter).
2. **Cập nhật `VALIDATION-AND-ECONOMICS-V2.md`:**
   - Phân tích TAM thực tế: 281 cơ sở đóng gói VN x 60M VND = 16.86 tỷ VND (~$658k ARR) < 427 sites để đạt $1M ARR -> bắt buộc Multi-Revenue Stack & Regional Expansion.
   - Thiết lập chỉ số North Star: **Verified GMV**, Revenue/Verified Container, Gross Profit/Container, CAC Payback, Cross-organization Network Density.
   - 4 chỉ số đo lường bổ sung ngay từ container đầu tiên: `minutes_saved`, `human_touches`, `exceptions_discovered`, `expected_loss_avoided`.
3. **Cập nhật `PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md`:**
   - 4 lớp sản phẩm theo thứ tự bắt buộc: (1) Container Truth Engine -> (2) Verified Organization Network -> (3) Closed Transaction Network (Trade Rooms) -> (4) Transaction Rails.
   - Cập nhật 9 Hard Kill Criteria.
4. **Cập nhật `DURIOS-STRATEGY-V2.json`:**
   - Đồng bộ hóa các chỉ số và cấu trúc JSON chuẩn.

### Phase 2: Core Code Primitives (`src/` & `test/`)
1. **ASEAN Corridor Compliance Adapters (`src/rules/asean-corridor-adapters.ts` ~130 LOC):**
   - Hỗ trợ các hành lang: `VN_CN`, `MY_CN` (Malaysia-China Protocol 2024, 52 cơ sở approved), `TH_CN`, `PH_CN`.
   - Giữ nguyên core ontology, linh hoạt quy tắc kiểm nghiệm và chứng từ.
2. **Verified Organization Profile Compiler (`src/sharing/verified-org-profile.ts` ~140 LOC):**
   - Tạo hồ sơ uy tín `DuriOS Verified Profile` (số lượng container đã xác minh, thời gian xử lý trung vị, tỷ lệ sai lệch seal/chứng từ, độ tin cậy) mà không làm lộ supplier/buyer/margin (Federated Privacy-First Trust).
3. **Mở Rộng KPI Diễn Tập Container (`src/auth/pilot-kpi-extended-types.ts` ~75 LOC & `src/auth/pilot-kpi-evaluator.ts`):**
   - Tính toán 4 chỉ số thực địa: `minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`.
4. **Kiểm thử toàn diện (`test/asean-corridor-and-verified-profile.test.ts` ~130 LOC):**
   - Kiểm tra các hành lang ASEAN, hồ sơ uy tín liên tổ chức, và các chỉ số đo lường thực tế.

## Strict Quality & Safety Checks
- Mọi file `.ts` mới hoặc sửa đổi $\le 179$ LOC.
- 0 lần xuất hiện `: any`, `as any`, `<any>`.
- `bun run typecheck` đạt 0 lỗi.
- 100% test pass (117 test cũ + test suite mới).
- Không phá vỡ ranh giới Stage 0 tại Cai Lậy.
