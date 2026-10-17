# DuriOS 25-Step Open-Core Company Blueprint (Verified Durian Trade Network)

**Project:** `~/durios` — Operating System for Verified Durian Trade  
**Stage:** `STAGE_0_SINGLE_SITE_PROTOTYPE` (Beachhead: `SITE-CAILAY-TIENGIANG-01`, Cai Lậy, Tiền Giang)  
**Dual-License Architecture:** `AGPL-3.0-only` (Community Core) + `MIT` (`standalone-manifest-verifier.ts` SDK) + `Ed25519 Signed Commercial License` (`PACKHOUSE_PRO_SAAS` / `EXPORTER_ENTERPRISE`)  

---

## 1. Open-Core Master Framework (`[Verified]`)
- **Community Open-Core (`COMMUNITY_OPEN_CORE`):** Miễn phí 100% tính năng đối soát hồ sơ container GACC Trung Quốc (`VN_CN`), xác minh con người (HITL), sổ cái chuỗi băm SHA-256 (`SqliteAuditLedger`), phân quyền Tri-Tuple RBAC và `MIT` Standalone Manifest Verifier.
- **Packhouse Pro SaaS (`PACKHOUSE_PRO_SAAS` — `[Hypothesis]` 60M VND/năm):** Mở khóa qua khóa ký số Ed25519 (`src/saas/saas-tier-policy.ts`) cho Cloud Vision OCR, Managed Zalo ZNS Alert Relay, E2EE Cloud Backup Vault và GACC Registry Watch.
- **Exporter Enterprise (`EXPORTER_ENTERPRISE`):** Đồng bộ đa cơ sở đóng gói (Multi-Site Sync), cổng thông tin người mua xuyên biên giới và các phòng giao dịch xác minh kín (`Verified Trade Rooms`).

## 2. 2026 Truthful Plan & Market Reality Refresh (`[Verified]`)
- Theo Bộ NN&MT (tháng 9/2026): Việt Nam có **1.599 mã số vùng trồng (PUC)** và **281 cơ sở đóng gói (PHC)** đang hoạt động; kim ngạch xuất khẩu 2025 đạt **3,85 tỷ USD**, 8 tháng 2026 đạt **1,97 tỷ USD**.

## 3. Agentic OS & Human-in-the-Loop Governance (`[Verified]`)
- 5 vai trò điều hành (Founder/CEO, Product & Ops, Engineering & Security, Revenue & Discovery, Governance & Legal) hoạt động dưới nguyên tắc: AI chỉ gợi ý bóc tách và phát hiện bất thường; quyết định phê duyệt xuất khẩu cuối cùng bắt buộc thuộc về con người (`HUMAN_VERIFIED` + `MANAGER` sign-off).

## 4. Pilot Readiness & Audit Evidence Baseline (`[Verified]`)
- Hệ thống 5 cổng khai trương (`GATE-01` đến `GATE-05`) kèm công cụ kiểm toán thực địa `bun run pilot:audit-pack -- --verify` xuất báo cáo JSON/Markdown có niêm phong SHA-256.

## 5. Conditional 5-Stage Sequencing Roadmap (`[Target]`)
- `System of Record` (Cai Lậy) $\rightarrow$ `System of Verification` (Verified Profile) $\rightarrow$ `Closed Network` (Trade Rooms) $\rightarrow$ `Transaction Network` (Licensed Partner Rails) $\rightarrow$ `ASEAN Regional Infrastructure` (`MY_CN`, `TH_CN`, `PH_CN`).

## 6. Economic Truth First & Multi-Revenue Stack (`[Hypothesis]` / `[Target]`)
- **Trần SaaS thuần túy tại Việt Nam:** $281\text{ vựa} \times 60\text{M VND} = 16,86\text{ tỷ VND} \approx \$657.643\text{ ARR}$ (tỷ giá 25.637 VND/USD) < 427 vựa cần cho \$1M ARR.
- **Giải pháp bắt buộc:** Kết hợp 8 tầng doanh thu (Core SaaS + Verification Modules + Multi-Site Enterprise + Network Membership + Transaction Orchestration Fee 0.1–0.5% + Lab/Logistics Referral + Trade Finance Share + ASEAN Expansion).

## 7. Tri-Tuple Buyer & Operator Personas (`[Verified]`)
- Thực thi trực tiếp trong mã nguồn (`src/auth/rbac-policy.ts`): `PACKHOUSE_CLERK`, `PACKHOUSE_MANAGER`, `ORCHARD_REPRESENTATIVE`, `BUYER_VIEWER`, `SYSTEM_AUDITOR`.

## 8. Category Positioning (`[Verified]`)
- Định vị: **“DuriOS — Operating System for Verified Durian Trade”** (không phải phần mềm truy xuất QR đại trà, không phải chợ thương mại điện tử tự do).

## 9. Bilingual Open-Source Documentation & MIT Verifier (`[Verified]`)
- Tài liệu song ngữ Việt-Anh, cho phép bất kỳ bên nhập khẩu hoặc hải quan nào dùng `verifyExportManifest()` (`MIT`) để kiểm tra tính toàn vẹn SHA-256 và số container ISO 6346.

## 10. Federated Privacy-First Narrative (`[Verified]`)
- Dữ liệu nhạy cảm (giá mua tại vườn, danh sách nông hộ, biên lợi nhuận) nằm tại SQLite của vựa; chỉ những bằng chứng được cấp `ShareAccessGrant` và chỉ số `VerifiedOrganizationProfile` mới đi ra ngoài.

## 11. Field-First Demonstration & Blind-Fault Testing (`[Verified]`)
- Chứng minh năng lực qua 2 kịch bản gài lỗi mù (lệch số chì hải quan giữa Packing List và Phyto; thiếu xác minh con người trên chỉ tiêu Cadimi) với thời gian đối soát trung bình (Arithmetic Mean) $< 5.0$ phút.

## 12. Case Study Evidence Protocol (`[Verified]`)
- Đo lường 4 chỉ số thực tế ngay từ container đầu tiên (`minutesSavedPerContainer`, `humanTouchesPerContainer`, `exceptionsDiscoveredPerContainer`, `expectedLossAvoidedVnd`).

## 13. Community-to-Pro Upgrade Trigger (`[Verified]`)
- Khi vựa dùng bản `COMMUNITY_OPEN_CORE` cần gửi cảnh báo Zalo ZNS tự động, sao lưu đám mây mã hóa đầu cuối hoặc đối soát đa thị trường (`JP`, `KR`, `EU`), hệ thống hướng dẫn nâng cấp qua `SaasSubscriptionStatus`.

## 14. Signed Workspace Portability Funnel (`[Verified]`)
- Vựa xuất gói **Workspace Portability Bundle** (`src/saas/workspace-portability-bundle.ts`) có chữ ký HMAC-SHA256 để chuyển đổi liền mạch lên bản Pro/Enterprise mà không làm rò rỉ khóa bí mật.

## 15. Dense Cluster GTM Playbook (`[Target]`)
- Tập trung xây dựng cụm liên kết dày đặc tại Cai Lậy $\rightarrow$ Tiền Giang/ĐBSCL (8 vựa + 3 exporter + 2 phòng lab + 3 đơn vị xe lạnh + 5 nhà nhập khẩu) trước khi mở rộng địa lý.

## 16. North Star & Funnel Metrics (`[Verified]`)
- Theo dõi **Verified GMV**, `Revenue / Verified Container`, `Gross Profit / Container`, `CAC Payback`, và `Cross-organization Network Density`.

## 17. Strategic & VC Narrative (`[Verified]`)
- Thang 6 bậc Moat: `Workflow` $\rightarrow$ `Evidence` $\rightarrow$ `Outcome` $\rightarrow$ `Reputation` $\rightarrow$ `Network` $\rightarrow$ `ASEAN Regulatory Adapter`.

## 18. Dual-License IP, Rate Limiting & Secret Hygiene (`[Verified]`)
- Tách biệt rõ `LICENSE` (`AGPL-3.0-only`) và `LICENSE-MIT`; áp dụng `TenantRateLimiter` (30 req/phút/tenant); quét `gitleaks` 0 leaks.

## 19. On-Premise Resilience & Backup Runbook (`[Verified]`)
- Vận hành offline-first trên mạng LAN tại vựa, sao lưu SQLite WAL định kỳ, khôi phục thảm họa trong $< 10$ phút.

## 20. Competitive & Regional Benchmarks (`[Verified]`)
- So sánh khách quan với hệ thống truy xuất quốc gia, TE-FOOD, Agrione, eDurian, DurianTradeX; chuẩn bị sẵn adapter cho Malaysia (`MY_CN` — 52 cơ sở) và Thái Lan (`TH_CN` — 57% thị phần).

## 21. Evidence-Backed Audit Data Room (`[Verified]`)
- Toàn bộ hồ sơ đối soát, nhật ký kiểm toán và báo cáo 5 cổng khai trương có thể kiểm chứng độc lập bằng mã băm SHA-256.

## 22. Quarterly OKRs (`[Verified]`)
- Gắn chặt tiến độ Q4/2026 – 2028 với các cổng kiểm định kỹ thuật và thương mại.

## 23. Dual-Lock Marketplace & Zero-Custody Governance (`[Verified]`)
- Module sàn B2B và ký quỹ (`src/marketplace/`) bị khóa kép bởi `DURIOS_FEATURE_B2B_MARKETPLACE=enabled` VÀ `goForLiveCustomerData === true`; tuân thủ tuyệt đối Nghị định 52/2024/NĐ-CP và Luật Thương mại điện tử `122/2025/QH15` (không giữ tiền khách hàng).

## 24. Personal Data Protection & Statutory Disclaimers (`[Verified]`)
- Tuân thủ Luật Bảo vệ dữ liệu cá nhân `91/2025/QH15`; tách biệt 2 tầng trạng thái hữu cơ (`issuerClaimedStatus` vs `duriosRecordStatus`).

## 25. 9 Hard Kill Criteria & Incident Playbook (`[Verified]`)
- Áp dụng 9 tiêu chí dừng cứng (WTP failure, workflow rejection, missed blind faults, privacy refusal, buyer indifference, no repeat trades, subsidy dependency, CAC > 18m, non-portable model).
