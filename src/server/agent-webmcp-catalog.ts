/**
 * WebMCP & Design Studio AI Structured Catalog for DuriOS 2027.
 * Inspired by https://studio.agentkit.best/docs/ (/api/catalog, /api/schema, WebMCP).
 */

export interface AgentWebMcpToolDescriptor {
  readonly name: string;
  readonly method: "GET" | "POST";
  readonly endpoint: string;
  readonly authRequired: boolean;
  readonly zeroPiiGuarantee: boolean;
  readonly descriptionVi: string;
  readonly descriptionEn: string;
}

export interface DuriosAgentCatalogManifest {
  readonly schemaVersion: "2027.1-dsa-compatible";
  readonly designStudioReference: "https://studio.agentkit.best/docs/";
  readonly serviceId: "durios-agri-export-os";
  readonly canonicalLanguages: readonly ["vi", "en"];
  readonly securityBoundary: {
    readonly onPremLoopbackHost: "127.0.0.1";
    readonly gate03Enforced: true;
    readonly pdplStatutoryRef: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15";
    readonly zeroCustodyRef: "Nghị định 52/2024/NĐ-CP";
  };
  readonly discoveryEndpoints: {
    readonly llmsTxt: "/llms.txt";
    readonly llmsFullTxt: "/llms-full.txt";
    readonly agentJson: "/.well-known/agent.json";
    readonly agentCatalog: "/api/open-core/agent-catalog";
    readonly sitemapXml: "/sitemap.xml";
  };
  readonly designSystemPreset: {
    readonly style: "2027 Enterprise Command Station (Emerald Ops & Daylight Field)";
    readonly fonts: readonly ["Inter", "Space Grotesk", "JetBrains Mono"];
    readonly dualViewSupported: true;
  };
  readonly statelessWebMcpTools: readonly AgentWebMcpToolDescriptor[];
}

export function buildDuriosAgentCatalog(): DuriosAgentCatalogManifest {
  return {
    schemaVersion: "2027.1-dsa-compatible",
    designStudioReference: "https://studio.agentkit.best/docs/",
    serviceId: "durios-agri-export-os",
    canonicalLanguages: ["vi", "en"],
    securityBoundary: {
      onPremLoopbackHost: "127.0.0.1",
      gate03Enforced: true,
      pdplStatutoryRef: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15",
      zeroCustodyRef: "Nghị định 52/2024/NĐ-CP",
    },
    discoveryEndpoints: {
      llmsTxt: "/llms.txt",
      llmsFullTxt: "/llms-full.txt",
      agentJson: "/.well-known/agent.json",
      agentCatalog: "/api/open-core/agent-catalog",
      sitemapXml: "/sitemap.xml",
    },
    designSystemPreset: {
      style: "2027 Enterprise Command Station (Emerald Ops & Daylight Field)",
      fonts: ["Inter", "Space Grotesk", "JetBrains Mono"],
      dualViewSupported: true,
    },
    statelessWebMcpTools: [
      {
        name: "durios.verify_iso_and_manifest",
        method: "POST",
        endpoint: "/api/open-core/verify-iso-and-manifest",
        authRequired: false,
        zeroPiiGuarantee: true,
        descriptionVi: "Xác minh mã container ISO 6346 và chữ ký mật mã SHA-256/Ed25519 của hồ sơ xuất khẩu.",
        descriptionEn: "Verify ISO 6346 container number and SHA-256/Ed25519 cryptographic export manifest.",
      },
      {
        name: "durios.verify_financial_attestation",
        method: "POST",
        endpoint: "/api/open-core/financial-verification",
        authRequired: false,
        zeroPiiGuarantee: true,
        descriptionVi: "Xác minh chứng thực tài chính Zero-Custody cho lô hàng sầu riêng xuất khẩu.",
        descriptionEn: "Verify Zero-Custody cryptographic financial attestation for durian export shipments.",
      },
      {
        name: "durios.get_agent_catalog",
        method: "GET",
        endpoint: "/api/open-core/agent-catalog",
        authRequired: false,
        zeroPiiGuarantee: true,
        descriptionVi: "Truy xuất danh mục cấu trúc giao diện chuẩn Design Studio AI và công cụ WebMCP.",
        descriptionEn: "Retrieve Design Studio AI structured UI catalog and stateless WebMCP tool definitions.",
      },
    ],
  };
}
