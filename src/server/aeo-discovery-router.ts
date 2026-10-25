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

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://durios.vn/</loc><priority>1.0</priority></url>
  <url><loc>https://durios.vn/llms.txt</loc><priority>0.9</priority></url>
  <url><loc>https://durios.vn/llms-full.txt</loc><priority>0.9</priority></url>
  <url><loc>https://durios.vn/.well-known/agent.json</loc><priority>0.9</priority></url>
  <url><loc>https://durios.vn/stitch/auditor.html</loc><priority>0.8</priority></url>
  <url><loc>https://durios.vn/stitch/buyer.html</loc><priority>0.8</priority></url>
  <url><loc>https://durios.vn/stitch/dossiers.html</loc><priority>0.8</priority></url>
  <url><loc>https://durios.vn/stitch/field-proven.html</loc><priority>0.8</priority></url>
</urlset>
`;

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
