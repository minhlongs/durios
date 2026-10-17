import { describe, expect, test } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../src/server/http-router.js";

describe("Stitch Static Gallery HTTP Route (/stitch/*)", () => {
  const workspace = new ContainerDossierWorkspace();

  test("serves all 15 Stitch HTML pages under /stitch/*", async () => {
    const pages = [
      "gallery.html",
      "index.html",
      "dossiers.html",
      "auditor.html",
      "buyer.html",
      "cluster.html",
      "portability.html",
      "upgrade.html",
      "styleguide.html",
      "paper-canvas.html",
      "excel-grid.html",
      "zalo-bot.html",
      "mobile-weighbridge.html",
      "field-proven.html",
      "foundry.html",
    ];

    for (const page of pages) {
      const req = new Request(`http://localhost:3000/stitch/${page}`);
      const res = await routeHttpRequest(workspace, req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      expect(res.headers.get("X-DuriOS-Stitch-Static")).toBe("true");
      const html = await res.text();
      expect(html.length).toBeGreaterThan(1000);
    }
  });

  test("blocks directory traversal attempts with 403", async () => {
    const req = new Request("http://localhost:3000/stitch/..%2Fpackage.json");
    const res = await routeHttpRequest(workspace, req);
    expect([403, 404]).toContain(res.status);
  });

  test("returns 404 for non-existent stitch asset", async () => {
    const req = new Request("http://localhost:3000/stitch/nonexistent-page.html");
    const res = await routeHttpRequest(workspace, req);
    expect(res.status).toBe(404);
  });
});
