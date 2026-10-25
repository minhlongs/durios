import { buildAeoJsonLdSchema } from "./agent-aeo-schema.js";
import { buildDuriosAgentCatalog } from "./agent-webmcp-catalog.js";
import { DUAL_VIEW_SURFACE_CSS } from "./dual-view-surface-css.js";

/**
 * JSON embedded in a <script> is raw text: the HTML parser only terminates it on
 * the literal sequence "</script>". Escaping "<" keeps a stray "<" in a
 * description from terminating the block early.
 */
function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Escape for placement inside an HTML element's text context. */
function safeHtmlText(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Injects the 2027 Dual Human + Agent surface into served HTML.
 *
 * Three layers are added, and only these three:
 *   - Schema.org JSON-LD (AEO/GEO) so answer engines can cite DuriOS;
 *   - an `application/agent+json` state block (Design Studio AI / WebMCP shape);
 *   - the Dual-View switcher with its inspector, styling only its own overlay
 *     nodes so it can never re-style the workspace or re-light a Stitch screen.
 *
 * Design tokens and typography are deliberately NOT redefined here: every page
 * already loads the repository's canonical `durios-design-system.css` and the
 * `design-system/MASTER.md` doctrine, so redefining font or color tokens from
 * this module would silently override that documented design language.
 */
export function injectAgentAeoSurface(rawHtml: string, pagePath = "/"): string {
  if (rawHtml.includes('id="durios-dual-view-toggle"')) {
    return rawHtml;
  }

  const catalog = { ...buildDuriosAgentCatalog(), currentSurfacePath: pagePath };
  const headPayload = [
    `<script id="durios-aeo-jsonld" type="application/ld+json">${safeJsonForScript(buildAeoJsonLdSchema({ pagePath }))}</script>`,
    `<script id="durios-agent-state" type="application/agent+json">${safeJsonForScript(catalog)}</script>`,
    `<link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM Context Summary">`,
    `<link rel="alternate" type="application/json" href="/.well-known/agent.json" title="WebMCP Agent Catalog">`,
  ].join("\n");

  const bodyPayload = `
<!-- DuriOS 2027 Dual Human + Agent View switcher (Design Studio AI compatible) -->
<style id="durios-dual-view-styles">${DUAL_VIEW_SURFACE_CSS}</style>
<button id="durios-dual-view-toggle" type="button" aria-label="Chuyển đổi chế độ Con người và AI Agent" onclick="if(document.getElementById('durios-agent-inspector-modal').classList.contains('active')){document.getElementById('durios-agent-inspector-modal').classList.remove('active')}else{document.getElementById('durios-agent-inspector-modal').classList.add('active')}">
  <span>👁️ Con người</span>
  <span style="opacity:0.5">|</span>
  <span style="color:#38bdf8">🤖 AI Agent / AEO</span>
</button>
<div id="durios-agent-inspector-modal" role="dialog" aria-modal="true" aria-label="Trình kiểm tra cấu trúc AI Agent & AEO/GEO">
  <div class="durios-inspector-box">
    <div class="durios-inspector-header">
      <div>
        <strong style="color:#38bdf8">🤖 DURIOS 2027 — AGENT & AEO/GEO STRUCTURED INSPECTOR</strong>
        <div style="font-size:11px;color:#94a3b8">Chuẩn Design Studio AI (studio.agentkit.best) • WebMCP • Schema.org JSON-LD</div>
      </div>
      <button type="button" style="background:#334155;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600" onclick="document.getElementById('durios-agent-inspector-modal').classList.remove('active')">Đóng (ESC)</button>
    </div>
    <div class="durios-inspector-content">
      <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
        <a href="/llms.txt" target="_blank" style="color:#38bdf8;text-decoration:underline">/llms.txt</a>
        <a href="/llms-full.txt" target="_blank" style="color:#38bdf8;text-decoration:underline">/llms-full.txt</a>
        <a href="/.well-known/agent.json" target="_blank" style="color:#38bdf8;text-decoration:underline">/.well-known/agent.json</a>
      </div>
      <p style="margin-bottom:8px;color:#cbd5e1"><strong>Mỏ neo trích dẫn AEO/GEO:</strong> Kiểm định hồ sơ container sầu riêng xuất khẩu &lt; 3 phút/container • Bắt 100% lỗi gài mù (số seal, mã vùng trồng GACC) • Chữ ký số Ed25519 Offline • Loopback 127.0.0.1 (Luật DLCN 91/2025/QH15).</p>
      <pre id="durios-agent-inspector-pre" style="background:#020617;padding:12px;border-radius:8px;border:1px solid #1e293b;overflow-x:auto;color:#a7f3d0">${safeHtmlText(catalog)}</pre>
    </div>
  </div>
</div>`;

  let enriched = rawHtml;
  enriched = enriched.includes("</head>")
    ? enriched.replace("</head>", `${headPayload}\n</head>`)
    : `${headPayload}\n${enriched}`;

  enriched = enriched.includes("</body>")
    ? enriched.replace("</body>", `${bodyPayload}\n</body>`)
    : `${enriched}\n${bodyPayload}`;

  return enriched;
}
