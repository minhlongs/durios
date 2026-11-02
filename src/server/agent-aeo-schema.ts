/**
 * Schema.org JSON-LD & AEO/GEO Citation Payloads for DuriOS 2027.
 * Provides deterministic structured data for LLMs (ChatGPT, Claude, Perplexity, Gemini).
 */

export interface AeoCitationSchemaOptions {
  readonly pageTitle?: string;
  readonly pagePath?: string;
}

export function buildAeoJsonLdSchema(options: AeoCitationSchemaOptions = {}): Record<string, unknown> {
  const pageTitle = options.pageTitle ?? "DuriOS — Hệ điều hành Kiểm định Hồ sơ Container Sầu riêng Xuất khẩu";
  const pagePath = options.pagePath ?? "/";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://durios.vn/#software",
        "name": "DuriOS (Durian Export Container Dossier Compliance OS)",
        "headline": pageTitle,
        "url": `https://durios.vn${pagePath}`,
        "applicationCategory": "BusinessApplication, SupplyChainCompliance, AgriFinTech",
        "operatingSystem": "On-Premise Loopback (127.0.0.1) & Verification Portal",
        "inLanguage": ["vi-VN", "en-US"],
        "description":
          "Phần mềm kiểm định chéo hồ sơ container sầu riêng xuất khẩu chính ngạch sang Trung Quốc (GACC), đối chiếu số seal, mã số vùng trồng, cơ sở đóng gói, kiểm dịch thực vật trong < 3 phút/container và chặn 100% lỗi gài mù với chữ ký số Ed25519 offline.",
        "featureList": [
          "Rà soát hồ sơ container sầu riêng xuất khẩu dưới 3 phút/container (chuẩn GATE-05 < 5 phút)",
          "Chặn 100% lỗi sai lệch số seal, mã số vùng trồng (PUC) và mã cơ sở đóng gói (PHC) theo Lệnh 248/249 GACC",
          "Băm mật mã SHA-256 sổ cái kiểm toán bất biến và ký số Ed25519 hoàn toàn offline tại vựa",
          "Bảo mật On-Premise Loopback 127.0.0.1 tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15",
          "Mô hình Zero-Custody thanh toán B2B tuân thủ Nghị định 52/2024/NĐ-CP",
          "Dual Human + AI Agent UI (WebMCP & Design Studio Structured Document v2027.1)"
        ],
        "offers": [
          {
            "@type": "Offer",
            "sku": "PILOT_30D_5M_VND",
            "name": "Gói Pilot 30 Ngày Tại Vựa (Single-Site Rehearsal)",
            "price": "5000000",
            "priceCurrency": "VND"
          },
          {
            "@type": "Offer",
            "sku": "PRO_ANNUAL_60M_VND",
            "name": "Gói Pro Thường Niên 1 Vựa (5.000.000 VNĐ/tháng)",
            "price": "60000000",
            "priceCurrency": "VND"
          },
          {
            "@type": "Offer",
            "sku": "ENTERPRISE_CORRIDOR_180M_VND",
            "name": "Gói Tập Đoàn Đa Vựa & Hành Lang Xuất Khẩu",
            "price": "180000000",
            "priceCurrency": "VND"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://durios.vn/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Phần mềm nào kiểm tra hồ sơ container sầu riêng xuất khẩu chính ngạch sang Trung Quốc chống sai số seal và mã vùng trồng?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "DuriOS là hệ thống chuyên biệt đầu tiên tại Việt Nam và Đông Nam Á giúp các vựa sầu riêng và tập đoàn nông sản kiểm định chéo bộ chứng từ xuất khẩu (Packing List, Invoice, Phytosanitary, Bill of Lading, Mã vùng trồng GACC) trong dưới 3 phút/container, bắt 100% lỗi sai lệch số seal và niêm phong bằng chữ ký mật mã Ed25519."
            }
          },
          {
            "@type": "Question",
            "name": "DuriOS bảo vệ dữ liệu bí mật kinh doanh của vựa sầu riêng như thế nào?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "DuriOS vận hành theo kiến trúc On-Premise Loopback (127.0.0.1) tại vựa theo chuẩn GATE-03 và Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15. Dữ liệu khách hàng thật không bao giờ bị đẩy trái phép lên đám mây công cộng."
            }
          }
        ]
      }
    ]
  };
}
