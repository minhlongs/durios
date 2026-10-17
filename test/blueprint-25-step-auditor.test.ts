import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  evaluateBlueprint25Steps,
  type Blueprint25StepAuditReport,
} from "../src/saas/blueprint-25-step-auditor.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

describe("25-Step Blueprint Deep Auditor & HTTP Status Endpoint", () => {
  it("evaluates all 25 steps and confirms 100% artifact existence and SHA-256 sealing", () => {
    const report = evaluateBlueprint25Steps();
    expect(report.project).toBe("DuriOS");
    expect(report.totalSteps).toBe(25);
    expect(report.completedStepsCount).toBe(25);
    expect(report.allArtifactsPresent).toBe(true);
    expect(report.overallPassed).toBe(true);
    expect(report.blueprintCompositeSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.steps.length).toBe(25);

    for (const step of report.steps) {
      expect(step.completedInTasksMd).toBe(true);
      expect(step.documentedInPlanMd).toBe(true);
      expect(step.artifactExists).toBe(true);
    }
  });

  it("serves GET /api/v1/open-core/blueprint-status with 25/25 verified report", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-blueprint-status-"));
    const app = createWorkspaceApp({
      dbPath: join(rootDir, "durios.db"),
      dataDir: join(rootDir, "uploads"),
    });

    try {
      const creds = seedTestPilotActor(app.authService, {
        role: "MANAGER",
        tenantId: "TEN-CAILAY-01",
      });

      const res = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/blueprint-status", {
          headers: { Authorization: `Bearer ${creds.sessionToken}` },
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        readonly success: boolean;
        readonly data: Blueprint25StepAuditReport;
      };
      expect(body.success).toBe(true);
      expect(body.data.overallPassed).toBe(true);
      expect(body.data.completedStepsCount).toBe(25);
      expect(body.data.allArtifactsPresent).toBe(true);
      expect(body.data.blueprintCompositeSha256).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      app.sqliteClient.close();
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
