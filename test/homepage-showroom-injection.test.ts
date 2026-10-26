import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../src/server/server.js";

function tempApp(tag: string): { handler: (r: Request) => Promise<Response>; close: () => void } {
  const dir = mkdtempSync(join(tmpdir(), tag));
  const app = createWorkspaceApp({ dbPath: join(dir, "t.db"), dataDir: join(dir, "u") });
  return {
    handler: app.handler,
    close: () => {
      app.sqliteClient.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

describe("2027 3-in-1 Homepage Showroom & 1-Click Workspace Switcher", () => {
  test("GET / serves the Marketing Hero, 3 PLG CTAs, Live ISO 6346 Verifier, 4-Pillar Hub, and 4-Tier Pricing", async () => {
    const { handler, close } = tempApp("durios-home-3in1-");
    try {
      const resp = await handler(new Request("http://127.0.0.1:3000/"));
      expect(resp.status).toBe(200);
      const html = await resp.text();

      // 1-Click Mode Switcher
      expect(html).toContain('id="durios-home-mode-bar"');
      expect(html).toContain('id="durios-btn-mode-showroom"');
      expect(html).toContain('id="durios-btn-mode-workspace"');

      // Hero & 4 Golden Metrics
      expect(html).toContain('id="durios-home-showroom"');
      expect(html).toContain("&lt; 3 phút / container");
      expect(html).toContain("Bắt 100% lỗi gài mù");
      expect(html).toContain("Chữ ký số Ed25519 Offline");
      expect(html).toContain("Loopback 127.0.0.1");

      // 3 PLG Call-To-Actions
      expect(html).toContain('id="durios-cta-try-verifier"');
      expect(html).toContain('id="durios-cta-enter-workspace"');
      expect(html).toContain('id="durios-cta-book-zalo"');

      // Live Zero-PII ISO 6346 Verifier Box
      expect(html).toContain('id="durios-live-iso-verifier"');
      expect(html).toContain("MSKU9070323");
      expect(html).toContain("MSKU9070320");

      // 4-Pillar 25-Screen Showroom Hub
      expect(html).toContain('id="durios-showroom-pillars"');
      expect(html).toContain("/stitch/gallery.html");
      expect(html).toContain("/stitch/auditor.html");
      expect(html).toContain("/stitch/buyer.html");

      // 4-Tier Commercial Pricing Table
      expect(html).toContain('id="durios-showroom-pricing"');
      expect(html).toContain("5.000.000 VNĐ");
      expect(html).toContain("60.000.000 VNĐ");
      expect(html).toContain("180.000.000 VNĐ");

      // Core Packhouse Workspace remains intact in the DOM
      expect(html).toContain('id="dossier-nav"');
      expect(html).toContain('id="workspace-main"');
    } finally {
      close();
    }
  });
});
