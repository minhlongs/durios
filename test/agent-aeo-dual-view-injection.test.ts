import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../src/server/server.js";

/**
 * The Dual-Mode UI and AEO/GEO payloads must be present in every served HTML
 * surface. Assertions go through the HTTP handler rather than reading files from
 * disk, because the injection happens at serve time — a disk check would pass
 * whether or not the injector actually ran.
 */
function tempApp(tag: string): { handler: (r: Request) => Promise<Response>; close: () => void } {
  const dir = mkdtempSync(join(tmpdir(), tag));
  const app = createWorkspaceApp({ dbPath: join(dir, "t.db"), dataDir: join(dir, "u") });
  return { handler: app.handler, close: () => { app.sqliteClient.close(); rmSync(dir, { recursive: true, force: true }); } };
}

describe("2027 Dual Human + Agent View surface injection", () => {
  test("the workspace root carries tokens, JSON-LD, agent state, and the Dual-View toggle", async () => {
    const { handler, close } = tempApp("durios-dual-ui-");
    try {
      const resp = await handler(new Request("http://127.0.0.1:3000/"));
      expect(resp.status).toBe(200);
      const html = await resp.text();
      expect(html).toContain('id="durios-dual-view-styles"');
      expect(html).toContain('<script id="durios-aeo-jsonld" type="application/ld+json">');
      expect(html).toContain('<script id="durios-agent-state" type="application/agent+json">');
      expect(html).toContain('id="durios-dual-view-toggle"');
      expect(html).toContain('"@type":"SoftwareApplication"');
    } finally {
      close();
    }
  });

  test("a served Stitch screen carries the same Dual-View payload", async () => {
    const { handler, close } = tempApp("durios-dual-stitch-");
    try {
      const resp = await handler(new Request("http://127.0.0.1:3000/stitch/auditor.html"));
      expect(resp.status).toBe(200);
      const html = await resp.text();
      expect(html).toContain('id="durios-dual-view-toggle"');
      expect(html).toContain('<script id="durios-aeo-jsonld" type="application/ld+json">');
    } finally {
      close();
    }
  });

  test("robots.txt admits AI crawlers and sitemap.xml lists the AEO endpoints", async () => {
    const { handler, close } = tempApp("durios-dual-crawl-");
    try {
      const robots = await handler(new Request("http://127.0.0.1:3000/robots.txt"));
      expect(robots.status).toBe(200);
      const robotsText = await robots.text();
      expect(robotsText).toContain("PerplexityBot");
      expect(robotsText).toContain("Disallow: /api/dossiers");

      const sitemap = await handler(new Request("http://127.0.0.1:3000/sitemap.xml"));
      expect(sitemap.status).toBe(200);
      expect(await sitemap.text()).toContain("https://durios.vn/llms.txt");
    } finally {
      close();
    }
  });
});
