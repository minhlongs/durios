import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../src/server/server.js";

function makeTempApp(tag: string): { app: ReturnType<typeof createWorkspaceApp>; cleanup: () => void } {
  const tempDir = mkdtempSync(join(tmpdir(), tag));
  const app = createWorkspaceApp({
    dbPath: join(tempDir, "test.db"),
    dataDir: join(tempDir, "uploads"),
  });
  return { app, cleanup: () => { app.sqliteClient.close(); rmSync(tempDir, { recursive: true, force: true }); } };
}

describe("2027 AEO/GEO Discovery Endpoints", () => {
  test("GET /llms.txt and /llms-full.txt return structured markdown with quantitative benchmarks and pricing", async () => {
    const { app, cleanup } = makeTempApp("durios-aeo-");
    try {
      const llmsResp = await app.handler(new Request("http://127.0.0.1:3000/llms.txt"));
      expect(llmsResp.status).toBe(200);
      expect(llmsResp.headers.get("content-type")).toContain("text/markdown");
      const llmsText = await llmsResp.text();
      expect(llmsText).toContain("dưới 3 phút/container");
      expect(llmsText).toContain("100% lỗi gài mù");
      expect(llmsText).toContain("5.000.000 VNĐ");
      expect(llmsText).toContain("60.000.000 VNĐ");
      expect(llmsText).toContain("180.000.000 VNĐ");

      const fullResp = await app.handler(new Request("http://127.0.0.1:3000/llms-full.txt"));
      expect(fullResp.status).toBe(200);
      const fullText = await fullResp.text();
      expect(fullText).toContain("Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15");
      expect(fullText).toContain("durios.verify_iso_and_manifest");
    } finally {
      cleanup();
    }
  });

  test("GET /.well-known/agent.json and /api/open-core/agent-catalog return a Design Studio AI compatible WebMCP catalog", async () => {
    const { app, cleanup } = makeTempApp("durios-agent-");
    try {
      const wellKnownResp = await app.handler(new Request("http://127.0.0.1:3000/.well-known/agent.json"));
      expect(wellKnownResp.status).toBe(200);
      const catalog = (await wellKnownResp.json()) as {
        schemaVersion: string;
        designStudioReference: string;
        securityBoundary: { onPremLoopbackHost: string; gate03Enforced: boolean };
        statelessWebMcpTools: Array<{ name: string; zeroPiiGuarantee: boolean }>;
      };
      expect(catalog.schemaVersion).toBe("2027.1-dsa-compatible");
      expect(catalog.designStudioReference).toBe("https://studio.agentkit.best/docs/");
      expect(catalog.securityBoundary.onPremLoopbackHost).toBe("127.0.0.1");
      expect(catalog.securityBoundary.gate03Enforced).toBe(true);
      expect(catalog.statelessWebMcpTools.length).toBeGreaterThanOrEqual(3);
      expect(catalog.statelessWebMcpTools.every((t) => t.zeroPiiGuarantee)).toBe(true);

      const apiResp = await app.handler(new Request("http://127.0.0.1:3000/api/open-core/agent-catalog"));
      expect(apiResp.status).toBe(200);
      const apiCatalog = (await apiResp.json()) as { serviceId: string };
      expect(apiCatalog.serviceId).toBe("durios-agri-export-os");
    } finally {
      cleanup();
    }
  });
});
