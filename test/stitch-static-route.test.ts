import { describe, expect, test } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../src/server/http-router.js";

describe("Stitch Static Gallery HTTP Route (/stitch/*)", () => {
  const workspace = new ContainerDossierWorkspace();

  test("serves all 23 Stitch HTML pages and durios-live-bridge.js under /stitch/*", async () => {
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
      "corridors.html",
      "blueprint.html",
      "security-vault.html",
      "organic-escrow-guard.html",
      "webhook-sync-queue.html",
      "socratic-introspector.html",
      "rehearsal-command.html",
      "mit-verifier-lab.html",
    ];

    for (const page of pages) {
      const req = new Request(`http://localhost:3000/stitch/${page}`);
      const res = await routeHttpRequest(workspace, req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      expect(res.headers.get("X-DuriOS-Stitch-Static")).toBe("true");
      const html = await res.text();
      expect(html.length).toBeGreaterThan(1000);
      expect(html).toContain("/stitch/durios-live-bridge.js");
    }

    const jsReq = new Request("http://localhost:3000/stitch/durios-live-bridge.js");
    const jsRes = await routeHttpRequest(workspace, jsReq);
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers.get("Content-Type")).toContain("application/javascript");
    const jsText = await jsRes.text();
    expect(jsText).toContain("/api/v1/open-core/ecosystem-telemetry");
  });

  test("bootstraps 5 Cai Lay pilot rehearsal dossiers and serves live ecosystem telemetry", async () => {
    const bootReq = new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap", {
      method: "POST",
    });
    const bootRes = await routeHttpRequest(workspace, bootReq);
    expect(bootRes.status).toBe(200);
    expect(bootRes.headers.get("Set-Cookie")).toContain("durios_session=");
    const bootJson = (await bootRes.json()) as {
      success: boolean;
      data: {
        clerkPilotToken: string;
        managerPilotToken: string;
        goLivePackVerified: boolean;
        dossiers: Array<{ dossierCode: string; scenario: string }>;
      };
    };
    expect(bootJson.success).toBe(true);
    expect(bootJson.data.dossiers.length).toBe(5);
    expect(bootJson.data.goLivePackVerified).toBe(true);

    const telReq = new Request("http://127.0.0.1:3000/api/v1/open-core/ecosystem-telemetry", {
      headers: { "x-pilot-token": bootJson.data.clerkPilotToken },
    });
    const telRes = await routeHttpRequest(workspace, telReq);
    expect(telRes.status).toBe(200);
    const telJson = (await telRes.json()) as {
      success: boolean;
      data: {
        corridors: Array<{ corridorCode: string }>;
        marketplaceGuard: { custodyMode: string };
        blueprintAudit: { completedStepsCount: number; overallPassed: boolean };
        deepSocratic: { ideaVerdict: string; allTurnsPassed: boolean };
        pilotKpi: { totalContainers: number };
        goLivePackVerified: boolean;
      };
    };
    expect(telJson.success).toBe(true);
    expect(telJson.data.corridors.length).toBe(4);
    expect(telJson.data.marketplaceGuard.custodyMode).toBe("ZERO_CUSTODY_LICENSED_BANK_PARTNER");
    expect(telJson.data.blueprintAudit.completedStepsCount).toBe(25);
    expect(telJson.data.deepSocratic.ideaVerdict).toBe("GO_OPEN_CORE_SAAS");
    expect(telJson.data.deepSocratic.allTurnsPassed).toBe(true);
    expect(telJson.data.pilotKpi.totalContainers).toBeGreaterThanOrEqual(5);
    expect(telJson.data.goLivePackVerified).toBe(true);
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
