import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  evaluateOpenCoreDeepBrainstorm,
  type OpenCoreDeepBrainstormReport,
} from "../src/saas/open-core-deep-introspector.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

describe("Deep Brainstorm & 25-Step Open-Core Public GitHub + SaaS Introspector (--deep)", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes all 5 Socratic turns and verifies GO_OPEN_CORE_SAAS with 94.67% margin", () => {
    const report = evaluateOpenCoreDeepBrainstorm(process.cwd(), "2026-10-17T10:00:00.000Z");

    expect(report.ideaVerdict).toBe("GO_OPEN_CORE_SAAS");
    expect(report.allTurnsPassed).toBe(true);
    expect(report.blueprintAudit.overallPassed).toBe(true);
    expect(report.blueprintAudit.completedStepsCount).toBe(25);
    expect(report.socraticTurns).toHaveLength(5);
    for (const turn of report.socraticTurns) {
      expect(turn.passed).toBe(true);
    }

    expect(report.uiUxDeepAudit.verdict).toBe("GO_2027_UI_UX_STANDARDIZED");
    expect(report.uiUxDeepAudit.allTurnsPassed).toBe(true);
    expect(report.uiUxDeepAudit.totalHtmlSurfacesAudited).toBe(26);
    expect(report.uiUxDeepAudit.balancedDomSurfacesCount).toBe(26);
    expect(report.uiUxDeepAudit.deadHrefHashCount).toBe(0);
    expect(report.uiUxDeepAudit.stitchScreensCount).toBe(25);
    expect(report.uiUxDeepAudit.socraticTurns).toHaveLength(5);
    for (const turn of report.uiUxDeepAudit.socraticTurns) {
      expect(turn.passed).toBe(true);
    }

    expect(report.editionModuleCounts.communityOpenCore).toBeGreaterThanOrEqual(6);
    expect(report.editionModuleCounts.packhouseProSaas).toBeGreaterThanOrEqual(4);
    expect(report.editionModuleCounts.exporterEnterprise).toBeGreaterThanOrEqual(2);

    expect(report.unitEconomicsVerification.containerPriceVnd).toBe(150_000);
    expect(report.unitEconomicsVerification.estimatedVariableCogsVnd).toBe(8_000);
    expect(report.unitEconomicsVerification.containerGrossMarginPct).toBe(94.67);
    expect(report.unitEconomicsVerification.pureVietnamSaasCeilingUsd).toBe(657_643);
    expect(report.unitEconomicsVerification.targetArrUsd).toBe(1_000_000);
    expect(report.unitEconomicsVerification.multiRevenueStackMandatory).toBe(true);
  });

  it("fails closed on Turn 1 and Turn 2 if MIT boundary or governance files are contaminated/missing", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-deep-neg-"));
    tempDirs.push(rootDir);

    mkdirSync(join(rootDir, ".mekong"), { recursive: true });
    mkdirSync(join(rootDir, "plans/company-blueprint"), { recursive: true });
    mkdirSync(join(rootDir, "src/domain"), { recursive: true });
    writeFileSync(join(rootDir, ".mekong/company.json"), "{}");
    writeFileSync(join(rootDir, "plans/company-blueprint/plan.md"), "# Plan");
    writeFileSync(join(rootDir, "plans/company-blueprint/tasks.md"), "# Tasks");
    writeFileSync(
      join(rootDir, "src/domain/iso-6346.ts"),
      'import { something } from "../saas/saas-tier-policy.js";'
    );

    const report = evaluateOpenCoreDeepBrainstorm(rootDir, "2026-10-17T10:00:00.000Z");
    expect(report.allTurnsPassed).toBe(false);
    expect(report.socraticTurns[0]?.passed).toBe(false);
    expect(report.socraticTurns[0]?.evidenceSummary).toContain("/saas/");
    expect(report.socraticTurns[1]?.passed).toBe(false);
    expect(report.uiUxDeepAudit.allTurnsPassed).toBe(false);
  });

  it("serves deep Socratic brainstorm report over GET /api/v1/open-core/blueprint-status?deep=true", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-deep-http-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({
      dbPath: join(rootDir, "durios.db"),
      dataDir: join(rootDir, "uploads"),
    });

    try {
      const creds = seedTestPilotActor(app.authService, { role: "MANAGER" });
      const res = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/blueprint-status?deep=true", {
          headers: { Authorization: `Bearer ${creds.sessionToken}` },
        })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        readonly success: boolean;
        readonly data: OpenCoreDeepBrainstormReport;
      };
      expect(body.success).toBe(true);
      expect(body.data.ideaVerdict).toBe("GO_OPEN_CORE_SAAS");
      expect(body.data.allTurnsPassed).toBe(true);
      expect(body.data.socraticTurns).toHaveLength(5);
      expect(body.data.uiUxDeepAudit.verdict).toBe("GO_2027_UI_UX_STANDARDIZED");
      expect(body.data.uiUxDeepAudit.allTurnsPassed).toBe(true);
    } finally {
      app.sqliteClient.close();
    }
  });
});
