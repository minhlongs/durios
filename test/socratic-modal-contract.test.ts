import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateCodebaseModularityDeep } from "../src/saas/codebase-modularity-deep-introspector.js";

describe("Socratic 15-turn modal & asset parity contract", () => {
  const bridgeJs = readFileSync(join(process.cwd(), "site/public/durios-live-bridge.js"), "utf-8");
  const queueJs = readFileSync(join(process.cwd(), "queue/durios-live-bridge.js"), "utf-8");
  const siteCss = readFileSync(join(process.cwd(), "site/public/durios-design-system.css"), "utf-8");
  const queueCss = readFileSync(join(process.cwd(), "queue/durios-design-system.css"), "utf-8");

  it("verifies site/public and queue/ are byte-identical mirrors for both bridge JS and design CSS", () => {
    expect(bridgeJs.length).toBeGreaterThan(1000);
    expect(bridgeJs === queueJs).toBe(true);
    expect(siteCss.length).toBeGreaterThan(1000);
    expect(siteCss === queueCss).toBe(true);
  });

  it("exposes the 3-pillar schema, truthful error/pending notices, and modularity filter in the live bridge", () => {
    expect(bridgeJs).toContain("openSocratic10TurnModal");
    expect(bridgeJs).toContain('key: "modularity"');
    expect(bridgeJs).toContain('data-socratic-pillar="\' + b.key + \'"');
    expect(bridgeJs).toContain('id="modal-filter-\' + b.key + \'"');
    expect(bridgeJs).toContain("Pillar C: 5 Codebase Modularity & Type-Safety Turns");
    expect(bridgeJs).toContain("Loading live audit results… No turn is shown as passed until the server responds.");
    expect(bridgeJs).toContain("No verified results are available; sign in and press Re-Run to retry.");
    expect(bridgeJs).not.toContain("DEFAULT_OPEN_CORE_TURNS");
    expect(bridgeJs).not.toContain("DEFAULT_UIUX_PRO_MAX_TURNS");
  });

  it("fails closed on Modularity Turn 5 if site and queue bridge scripts drift", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "durios-mod-drift-"));
    try {
      const siteDir = join(tempDir, "site/public");
      const queueDir = join(tempDir, "queue");
      const dsDir = join(tempDir, "design-system/pages");
      const fs = require("node:fs");
      fs.mkdirSync(siteDir, { recursive: true });
      fs.mkdirSync(queueDir, { recursive: true });
      fs.mkdirSync(dsDir, { recursive: true });
      fs.writeFileSync(join(tempDir, "design-system/MASTER.md"), "# Master");
      for (const p of ["packhouse-workspace", "stitch-command-hub", "trust-and-verifier", "open-core-and-saas-corridors"]) {
        fs.writeFileSync(join(dsDir, `${p}.md`), `# ${p}`);
      }
      for (let i = 1; i <= 25; i++) {
        fs.writeFileSync(join(siteDir, `preview-${String(i).padStart(2, "0")}.png`), "png");
      }
      fs.writeFileSync(join(siteDir, "durios-design-system.css"), siteCss);
      fs.writeFileSync(join(queueDir, "durios-design-system.css"), siteCss);
      fs.writeFileSync(join(siteDir, "durios-live-bridge.js"), bridgeJs);
      fs.writeFileSync(join(queueDir, "durios-live-bridge.js"), bridgeJs + "\n/* drift */");

      const report = evaluateCodebaseModularityDeep(tempDir);
      const turn5 = report.socraticTurns.find((t) => t.turnNumber === 5);
      expect(turn5?.passed).toBe(false);
      expect(report.verdict).toBe("HOLD_MODULARITY_VIOLATIONS");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
