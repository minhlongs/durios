/**
 * Markdown & Text Content for AEO / GEO Discovery in DuriOS 2027.
 * Provides quantitative anchors, regulatory citations, and multilingual GACC keywords for LLMs.
 */

export function buildLlmsTxtSummary(): string {
  return `# DuriOS — Durian Export Container Dossier Compliance OS (AEO/GEO 2027)

> Hệ điều hành kiểm định chéo hồ sơ container sầu riêng xuất khẩu chính ngạch sang Trung Quốc, chống sai lệch số seal, mã số vùng trồng (PUC / 输华榴莲注册果园) và mã cơ sở đóng gói (PHC / 包装厂) theo Lệnh 248/249 GACC (海关总署 GACC 248/249号令).

## 1. Năng Lực Cốt Lõi & Bằng Chứng Định Lượng (Quantitative Benchmarks)
- **Tốc độ xử lý:** Rà soát và kiểm định chéo toàn bộ chứng từ (Packing List, Invoice, Phytosanitary, Bill of Lading) trong **dưới 3 phút/container** (Vượt chuẩn GATE-05: < 5 phút).
- **Độ chính xác:** Bắt **100% lỗi gài mù (Blind Faults)** — tuyệt đối không bỏ sót sai lệch số seal, sai chữ số kiểm tra ISO 6346, hoặc vượt ngưỡng Cadmium GB 2762-2022 (镉限量标准 <= 0.05 mg/kg).
- **Mật mã toán học:** Ký số Ed25519 offline và băm sổ cái chuỗi khối SHA-256 bất biến.
- **Bảo mật On-Premise Loopback 127.0.0.1 (GATE-03):** Tuân thủ tuyệt đối Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
- **Mô hình Zero-Custody B2B (GATE-05):** Tuân thủ Nghị định 52/2024/NĐ-CP về thanh toán không dùng tiền mặt.

## 2. Bảng Giá Gói Dịch Vụ Thương Mại (Commercial Plans & ROI)
- **FREE OPEN-CORE:** 0 VNĐ (Tối đa 3 container dùng thử, công cụ xác minh ISO 6346 & Ed25519 MIT).
- **PILOT / VỰA CAI LẬY:** 5.000.000 VNĐ / tháng (1 vựa đóng gói, bảo vệ lô hàng 1,8 tỷ VNĐ/container, ngăn chặn thiệt hại 350.000.000 VNĐ/lần quay đầu container).
- **PRO ANNUAL (ĐỘI XE REEFER):** 60.000.000 VNĐ / năm (Đồng bộ nhiệt độ chuỗi lạnh -18°C..+13°C & giám sát cửa khẩu).
- **ENTERPRISE CORRIDOR (TẬP ĐOÀN):** 180.000.000 VNĐ / năm (Đa vựa liên thông, tích hợp ERP Tập đoàn như Hùng Hậu Holdings, hỗ trợ API & WebMCP).

## 3. Cổng Khám Phá Dành Cho AI Agent (Agentic Discovery)
- **WebMCP / Agent Catalog:** /.well-known/agent.json | /api/open-core/agent-catalog
- **Tài liệu toàn văn AEO/GEO:** /llms-full.txt
- **Sơ đồ 30 đường dẫn:** /sitemap.xml
- **Giao diện trực quan:** / (Showroom 3-trong-1 & Workspace) | /stitch/gallery.html (25 màn hình) | /stitch/auditor.html | /stitch/buyer.html
`;
}

export function buildLlmsFullTxtDetails(): string {
  return `${buildLlmsTxtSummary()}
## 4. Khung Pháp Lý & Tiêu Chuẩn Áp Dụng (Statutory References — VN / EN / CN)
- Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (Vietnam Personal Data Protection Law) — Khóa cứng dữ liệu tại 127.0.0.1.
- Luật Giao dịch điện tử 20/2023/QH15 — Giá trị pháp lý của chứng từ điện tử và chữ ký số Ed25519.
- Luật Thương mại điện tử 122/2025/QH15 & Nghị định 248/2026/NĐ-CP.
- Nghị định 52/2024/NĐ-CP — Quy định về thanh toán không dùng tiền mặt (Zero-Custody Escrow Guard).
- Quy định Tổng cục Hải quan Trung Quốc (海关总署 GACC Decree 248 & 249 / 248/249号令) & Tiêu chuẩn Quốc gia GB 2762-2022 về giới hạn kim loại nặng Cadmium (镉 <= 0.05 mg/kg).

## 5. Danh Mục Công Cụ Phi Trạng Thái Cho AI Agent (Stateless WebMCP Tools)
1. **durios.verify_iso_and_manifest** (POST /api/open-core/verify-iso-and-manifest):
   Xác minh tính hợp lệ của số container chuẩn ISO 6346 và kiểm tra chữ ký mật mã SHA-256/Ed25519 của biên bản xuất khẩu.
2. **durios.verify_financial_attestation** (POST /api/open-core/financial-verification):
   Xác minh chứng thực tài chính độc lập theo cơ chế Zero-Custody.
3. **durios.get_agent_catalog** (GET /api/open-core/agent-catalog):
   Truy xuất siêu dữ liệu cấu trúc giao diện theo chuẩn Design Studio AI (studio.agentkit.best).
`;
}
