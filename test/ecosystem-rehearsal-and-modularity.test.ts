import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";

function collectTsFiles(dirPath: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

describe("Ecosystem Rehearsal Endpoints & Codebase Modularity Guard", () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("bootstraps Cai Lay pilot rehearsal idempotently and serves live ecosystem telemetry", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-rehearsal-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    try {
      const bootRes1 = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap", { method: "POST" })
      );
      expect(bootRes1.status).toBe(200);
      expect(bootRes1.headers.get("set-cookie")).toContain("durios_session=");
      const bootBody1 = (await bootRes1.json()) as {
        success: boolean;
        data: {
          newlyCreatedCount: number;
          clerkPilotToken: string;
          dossiers: ReadonlyArray<{ dossierCode: string; scenario: string }>;
          pilotKpi: { totalContainers: number; blindFaultCount: number; blindFaultsCaught: number };
        };
      };
      expect(bootBody1.success).toBe(true);
      expect(bootBody1.data.newlyCreatedCount).toBe(5);
      expect(bootBody1.data.dossiers).toHaveLength(5);
      expect(bootBody1.data.pilotKpi.totalContainers).toBe(5);
      expect(bootBody1.data.pilotKpi.blindFaultCount).toBe(2);
      expect(bootBody1.data.pilotKpi.blindFaultsCaught).toBe(2);

      const token = bootBody1.data.clerkPilotToken;
      const seedRes2 = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/pilot/rehearsal/seed", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(seedRes2.status).toBe(200);
      const seedBody2 = (await seedRes2.json()) as { data: { newlyCreatedCount: number; dossiers: unknown[] } };
      expect(seedBody2.data.newlyCreatedCount).toBe(0);
      expect(seedBody2.data.dossiers).toHaveLength(5);

      const telemetryRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/ecosystem-telemetry", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(telemetryRes.status).toBe(200);
      const telemetryBody = (await telemetryRes.json()) as {
        success: boolean;
        data: {
          corridors: unknown[];
          marketplaceGuard: { custodyMode: string; prohibitedCustodyFieldsCount: number };
          deepSocratic: { allTurnsPassed: boolean; blueprintAudit: { completedStepsCount: number } };
        };
      };
      expect(telemetryBody.success).toBe(true);
      expect(telemetryBody.data.corridors).toHaveLength(4);
      expect(telemetryBody.data.marketplaceGuard.custodyMode).toBe("ZERO_CUSTODY_LICENSED_BANK_PARTNER");
      expect(telemetryBody.data.marketplaceGuard.prohibitedCustodyFieldsCount).toBe(7);
      expect(telemetryBody.data.deepSocratic.allTurnsPassed).toBe(true);
      expect(telemetryBody.data.deepSocratic.blueprintAudit.completedStepsCount).toBe(25);
    } finally {
      app.sqliteClient.close();
    }
  });

  it("enforces strict codebase modularity across all src/ (<= 160 LOC) and test/ (<= 160 LOC) files", () => {
    const repoRoot = process.cwd();
    const srcViolations = collectTsFiles(join(repoRoot, "src"))
      .map((f) => ({ file: f.slice(repoRoot.length + 1), lines: readFileSync(f, "utf-8").split("\n").length }))
      .filter((x) => x.lines > 160);

    const testViolations = collectTsFiles(join(repoRoot, "test"))
      .map((f) => ({ file: f.slice(repoRoot.length + 1), lines: readFileSync(f, "utf-8").split("\n").length }))
      .filter((x) => x.lines > 160);

    expect(srcViolations).toEqual([]);
    expect(testViolations).toEqual([]);
  });
});
