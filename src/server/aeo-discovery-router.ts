import { buildLlmsTxtSummary, buildLlmsFullTxtDetails } from "./aeo-content-provider.js";
import { buildDuriosAgentCatalog } from "./agent-webmcp-catalog.js";
import { jsonResponse } from "./server-types.js";

const ROBOTS_TXT = `User-agent: *
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /.well-known/agent.json
Allow: /api/open-core/agent-catalog
Allow: /stitch/
Disallow: /api/dossiers
Disallow: /api/auth

User-agent: GPTBot
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /.well-known/agent.json
Allow: /stitch/

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://durios.vn/sitemap.xml
`;

const SITEMAP_PATHS: readonly string[] = [
  "/", "/llms.txt", "/llms-full.txt", "/.well-known/agent.json",
  "/stitch/index.html", "/stitch/dossiers.html", "/stitch/auditor.html", "/stitch/buyer.html",
  "/stitch/cluster.html", "/stitch/portability.html", "/stitch/upgrade.html", "/stitch/styleguide.html",
  "/stitch/paper-canvas.html", "/stitch/excel-grid.html", "/stitch/zalo-bot.html", "/stitch/mobile-weighbridge.html",
  "/stitch/field-proven.html", "/stitch/socratic-introspector.html", "/stitch/rehearsal-command.html", "/stitch/mit-verifier-lab.html",
  "/stitch/foundry.html", "/stitch/security-vault.html", "/stitch/organic-escrow-guard.html", "/stitch/corridors.html",
  "/stitch/subscription-lifecycle.html", "/stitch/immutable-audit-ledger.html", "/stitch/blueprint-25-steps.html",
  "/stitch/cloud-ocr-vault.html", "/stitch/ed25519-downgrade-simulator.html", "/stitch/gallery.html",
];

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP_PATHS.map((p, i) => `  <url><loc>https://durios.vn${p}</loc><priority>${i === 0 ? "1.0" : i < 4 ? "0.9" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`;

export function handleAeoAndAgentDiscoveryRoutes(method: string, path: string): Response | undefined {
  if (method !== "GET") return undefined;

  if (path === "/llms.txt") {
    return new Response(buildLlmsTxtSummary(), {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }
  if (path === "/llms-full.txt") {
    return new Response(buildLlmsFullTxtDetails(), {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }
  if (path === "/.well-known/agent.json" || path === "/api/open-core/agent-catalog" || path === "/api/v1/open-core/agent-catalog") {
    return jsonResponse(buildDuriosAgentCatalog());
  }
  if (path === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }
  if (path === "/sitemap.xml") {
    return new Response(SITEMAP_XML, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }
  return undefined;
}
