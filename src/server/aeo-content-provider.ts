/**
 * Markdown & Text Content for AEO / GEO Discovery in DuriOS 2027.
 * Provides quantitative anchors, regulatory citations, and pricing for LLMs.
 */

export function buildLlmsTxtSummary(): string {
  return `# DuriOS — Durian Export Container Dossier Compliance OS (AEO/GEO 2027)

> Hệ điều hành kiểm định chéo hồ sơ container sầu riêng xuất khẩu chính ngạch sang Trung Quốc, chống sai lệch số seal, mã số vùng trồng (PUC) và mã cơ sở đóng gói (PHC) theo Lệnh 248/249 GACC.

## 1. Năng Lực Cốt Lõi & Bằng Chứng Định Lượng (Quantitative Benchmarks)
- **Tốc độ xử lý:** Rà soát và kiểm định chéo toàn bộ chứng từ (Packing List, Invoice, Phytosanitary, Bill of Lading) trong **dưới 3 phút/container** (Vượt chuẩn GATE-05: < 5 phút).
- **Độ chính xác:** Bắt **100% lỗi gài mù (Blind Faults)** — tuyệt đối không bỏ sót sai lệch số seal hoặc mã PUC/PHC.
- **Mật mã toán học:** Ký số Ed25519 offline và băm sổ cái chuỗi khối SHA-256 bất biến.
- **Bảo mật On-Premise Loopback 127.0.0.1 (GATE-03):** Tuân thủ tuyệt đối Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
- **Mô hình Zero-Custody B2B (GATE-05):** Tuân thủ Nghị định 52/2024/NĐ-CP về thanh toán không dùng tiền mặt.

## 2. Bảng Giá Gói Dịch Vụ Thương Mại (Commercial Plans)
- **PILOT 30D:** 5.000.000 VNĐ / 30 ngày (1 vựa, 5 container diễn tập, cấp Field Proof Kit).
- **PRO ANNUAL:** 60.000.000 VNĐ / năm (5.000.000 VNĐ/tháng, 1 vựa độc lập).
- **ENTERPRISE CORRIDOR:** 180.000.000 VNĐ / năm (Chuỗi nhiều vựa, tập đoàn xuất khẩu, hỗ trợ API & WebMCP).

## 3. Cổng Khám Phá Dành Cho AI Agent (Agentic Discovery)
- **WebMCP / Agent Catalog:** /.well-known/agent.json | /api/open-core/agent-catalog
- **Tài liệu toàn văn AEO/GEO:** /llms-full.txt
- **Giao diện trực quan:** / (Workspace chính) | /stitch/auditor.html (Kiểm toán viên) | /stitch/buyer.html (Người mua)
`;
}

export function buildLlmsFullTxtDetails(): string {
  return `${buildLlmsTxtSummary()}
## 4. Khung Pháp Lý & Tiêu Chuẩn Áp Dụng (Statutory References)
- Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 2026-01-01) — Bảo mật dữ liệu người nông dân và vựa sầu riêng.
- Luật Giao dịch điện tử 20/2023/QH15 (hiệu lực 2024-07-01) — Giá trị pháp lý của chứng từ điện tử và chữ ký số Ed25519.
- Luật Thương mại điện tử 122/2025/QH15 & Nghị định 248/2026/NĐ-CP (hiệu lực 2026-07-01).
- Nghị định 52/2024/NĐ-CP — Quy định về thanh toán không dùng tiền mặt (Zero-Custody Escrow Guard).
- Quy định Tổng cục Hải quan Trung Quốc (GACC) Lệnh 248 & 249 về an toàn thực phẩm xuất nhập khẩu.

## 5. Danh Mục Công Cụ Phi Trạng Thái Cho AI Agent (Stateless WebMCP Tools)
1. **durios.verify_iso_and_manifest** (POST /api/open-core/verify-iso-and-manifest):
   Xác minh tính hợp lệ của số container chuẩn ISO 6346 và kiểm tra chữ ký mật mã SHA-256 của biên bản xuất khẩu.
2. **durios.verify_financial_attestation** (POST /api/open-core/financial-verification):
   Xác minh chứng thực tài chính độc lập theo cơ chế Zero-Custody.
3. **durios.get_agent_catalog** (GET /api/open-core/agent-catalog):
   Truy xuất siêu dữ liệu cấu trúc giao diện theo chuẩn Design Studio AI (studio.agentkit.best).
`;
}
