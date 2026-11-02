import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../src/server/http-router.js";
describe("Stitch Static Gallery HTTP Route (/stitch/*) & Live 25-Screen Suite", () => {
  const workspace = new ContainerDossierWorkspace();
  // The rehearsal bootstrap mints pilot accounts and a MANAGER token without
  // credentials, so it is refused unless the process declares itself a rehearsal
  // sandbox. These route tests are exactly that sandbox.
  beforeAll(() => { process.env.DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP = "true"; });
  afterAll(() => { delete process.env.DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP; });
  const pages = [
"gallery.html", "index.html", "dossiers.html", "auditor.html", "buyer.html", "cluster.html", "portability.html", "upgrade.html", "styleguide.html", "paper-canvas.html",
"excel-grid.html", "zalo-bot.html", "mobile-weighbridge.html", "field-proven.html", "foundry.html", "corridors.html", "blueprint.html", "security-vault.html", "organic-escrow-guard.html", "webhook-sync-queue.html",
"socratic-introspector.html", "rehearsal-command.html", "mit-verifier-lab.html", "cloud-ocr-vault.html", "ed25519-downgrade-simulator.html", ];
  test("serves all 25 Stitch HTML pages and PNG previews under /stitch/*", async () => {
    expect(pages).toHaveLength(25);
    for (const page of pages) {
      const htmlRes = await routeHttpRequest(workspace, new Request(`http://localhost:3000/stitch/${page}`));
      expect(htmlRes.status).toBe(200);
      expect(htmlRes.headers.get("Content-Type")).toContain("text/html");
      expect(htmlRes.headers.get("X-DuriOS-Stitch-Static")).toBe("true");
      const html = await htmlRes.text();
      expect(html.length).toBeGreaterThan(1000);
      expect(html).toContain("<!-- DURIOS-TOP-NAV-START -->");
      expect(html).toContain("<!-- DURIOS-TOP-NAV-END -->");
      expect(html).toContain("DURIOS 25-SCREEN NAV");
      expect(html).toContain("/stitch/durios-live-bridge.js");
      expect(html).toContain("/stitch/durios-design-system.css");
      const openDivs = (html.match(/<div\b/gi) ?? []).length;
      const closeDivs = (html.match(/<\/div>/gi) ?? []).length;
      expect(openDivs).toBe(closeDivs);
      expect(html).not.toContain('href="#"');
      const pngName = page.replace(".html", ".png");
      const pngRes = await routeHttpRequest(workspace, new Request(`http://localhost:3000/stitch/${pngName}`));
      expect(pngRes.status).toBe(200);
expect(pngRes.headers.get("Content-Type")).toBe("image/png"); }
    const jsRes = await routeHttpRequest(workspace, new Request("http://localhost:3000/stitch/durios-live-bridge.js"));
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers.get("Content-Type")).toContain("application/javascript");
    const jsText = await jsRes.text();
    expect(jsText).toContain("/api/v1/open-core/ecosystem-telemetry");
    expect(jsText).toContain("durios_theme");
    expect(jsText).toContain("1. Packhouse Ops");
    expect(jsText).toContain("4. SaaS & Corridors");
    expect(jsText).toContain("setupUniversalInteractiveDelegation");
    expect(jsText).toContain("setupUniversalTableAndInputHydration");
    expect(jsText).toContain("openSocratic10TurnModal");
    expect(jsText).toContain("injectProMaxTelemetryRibbon");
    const cssRes = await routeHttpRequest(workspace, new Request("http://localhost:3000/stitch/durios-design-system.css"));
    expect(cssRes.status).toBe(200);
    expect(cssRes.headers.get("Content-Type")).toContain("text/css");
    const cssText = await cssRes.text();
    expect(cssText).toContain("--durios-shell-height: 44px");
    expect(cssText).toContain("daylight-theme");
    expect(cssText).toContain("durios-socratic-modal-backdrop");
    const socRes = await routeHttpRequest(workspace, new Request("http://localhost:3000/stitch/socratic-introspector.html"));
    expect(socRes.status).toBe(200);
    const socHtml = await socRes.text();
    expect(socHtml).toContain("10-Turn Socratic Deep Brainstorm");
    expect(socHtml).toContain("Pillar A: 5 Open-Core & SaaS Unit Economics Turns");
    expect(socHtml).toContain("Pillar B: 5 UI/UX Pro Max 2027 Architecture Turns");
    expect(socHtml).toContain("10-Dimension UI/UX Pro Max Scorecard");
    expect(socHtml).toContain("Re-Run Deep Socratic Audit (--deep)");
expect(socHtml).toContain("Export Deep Brainstorm Contract JSON"); });
  test("preserves fail-closed 2/5 gates without fullGates and unlocks 5/5 gates when fullGates=true", async () => {
    const bootDefault = await routeHttpRequest(workspace, new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap", { method: "POST" }));
    expect(bootDefault.status).toBe(200);
    const jsonDefault = (await bootDefault.json()) as { success: boolean; data: { passedGateCount: number; goLivePack: { overallVerdict: string } } };
    expect(jsonDefault.success).toBe(true);
    expect(jsonDefault.data.passedGateCount).toBe(2);
    expect(jsonDefault.data.goLivePack.overallVerdict).toBe("HOLD_BLOCKERS_REMAIN");
    const bootFull = await routeHttpRequest(workspace, new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap?fullGates=true&role=MANAGER", { method: "POST" }));
    expect(bootFull.status).toBe(200);
    const jsonFull = (await bootFull.json()) as { success: boolean; data: { passedGateCount: number; totalGateCount: number; goLivePack: { overallVerdict: string }; goLivePackVerified: boolean } };
    expect(jsonFull.success).toBe(true);
    expect(jsonFull.data.passedGateCount).toBe(5);
    expect(jsonFull.data.totalGateCount).toBe(5);
    expect(jsonFull.data.goLivePack.overallVerdict).toBe("READY_FOR_PILOT_GO_LIVE");
expect(jsonFull.data.goLivePackVerified).toBe(true); });
  test("validates live ISO 6346 container and detects 1-byte Cadimi mutation with MANIFEST_HASH_MISMATCH", async () => {
    const validRes = await routeHttpRequest(workspace, new Request("http://127.0.0.1:3000/api/v1/open-core/verify-iso-and-manifest", {
method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ containerNumber: "CSQU3054383" }), }));
    expect(validRes.status).toBe(200);
    const validJson = (await validRes.json()) as { valid: boolean; expectedCheckDigit: number };
    expect(validJson.valid && validJson.expectedCheckDigit === 3).toBe(true);
    const tamperRes = await routeHttpRequest(workspace, new Request("http://127.0.0.1:3000/api/v1/open-core/verify-iso-and-manifest", {
method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ simulateCadimiMutation: true }), }));
    expect(tamperRes.status).toBe(200);
    const tamperJson = (await tamperRes.json()) as { valid: boolean; error: string };
expect(tamperJson.valid === false && tamperJson.error === "MANIFEST_HASH_MISMATCH").toBe(true); });
  test("blocks traversal with 403/404 and returns 404 for missing asset", async () => {
    const trav = await routeHttpRequest(workspace, new Request("http://localhost:3000/stitch/..%2Fpackage.json"));
    expect([403, 404]).toContain(trav.status);
    const missing = await routeHttpRequest(workspace, new Request("http://localhost:3000/stitch/nonexistent-page.html"));
expect(missing.status).toBe(404); });
});
