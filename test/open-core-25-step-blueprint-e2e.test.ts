import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getOpenCoreEditionManifest } from "../src/saas/open-core-edition-manifest.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import type { SignedWorkspacePortabilityBundle } from "../src/saas/workspace-portability-bundle.js";

interface PortabilityApiResponse {
  readonly success: boolean;
  readonly data: { readonly bundle: SignedWorkspacePortabilityBundle; readonly subscription: { readonly edition: string } };
}

describe("Open-Core 25-Step Blueprint & Portability API E2E", () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("Step 1 & 13: delivers Open-Core Edition Manifest with truthful economic constraints", async () => {
    const manifest = getOpenCoreEditionManifest("COMMUNITY_OPEN_CORE");
    expect(manifest.manifestVersion).toBe("1.0.0");
    expect(manifest.economicTruth.vietnamActivePackhouses).toBe(281);
    expect(manifest.economicTruth.proAnnualPriceVnd).toBe(60_000_000);
    expect(manifest.economicTruth.pureVietnamSaasCeilingUsd).toBe(657_643);
    expect(manifest.economicTruth.targetArrUsd).toBe(1_000_000);
    expect(manifest.modules.length).toBeGreaterThanOrEqual(10);

    const rootDir = mkdtempSync(join(tmpdir(), "durios-oc-manifest-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    try {
      const creds = seedTestPilotActor(app.authService, { role: "MANAGER" });
      const res = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/edition-manifest", { headers: { Authorization: `Bearer ${creds.sessionToken}` } })
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; data: { manifest: typeof manifest } };
      expect(body.success && body.data.manifest.economicTruth.targetArrUsd === 1_000_000).toBe(true);
    } finally {
      app.sqliteClient.close();
    }
  });

  it("Step 14: exports and verifies signed portability bundle with HMAC and detects tampering", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-portability-e2e-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    const prevSecret = process.env.DURIOS_PORTABILITY_HMAC_SECRET;
    process.env.DURIOS_PORTABILITY_HMAC_SECRET = "durios-secret-portability-e2e-2026";

    try {
      const creds = seedTestPilotActor(app.authService, { role: "MANAGER" });
      app.workspace.createDossier({
        dossierCode: "DUR-CAILAY-TEST-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-CL-001",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5, declaredNetWeightKg: 18000, declaredBoxCount: 950,
      }, app.authService.authenticateToken(creds.sessionToken));

      const exportRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/portability", { headers: { Authorization: `Bearer ${creds.sessionToken}` } })
      );
      expect(exportRes.status).toBe(200);
      const exportJson = (await exportRes.json()) as PortabilityApiResponse;
      expect(exportJson.success && exportJson.data.bundle.payload.totalDossiersCount === 1).toBe(true);
      expect(exportJson.data.bundle.hmacSignatureSha256).toBeDefined();

      const authJsonHeaders = { Authorization: `Bearer ${creds.sessionToken}`, "Content-Type": "application/json" };
      const verifyRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/portability/verify", { method: "POST", headers: authJsonHeaders, body: JSON.stringify({ bundle: exportJson.data.bundle }) })
      );
      expect(verifyRes.status).toBe(200);
      expect(((await verifyRes.json()) as { data: { valid: boolean } }).data.valid).toBe(true);

      const tamperedBundle = { ...exportJson.data.bundle, payload: { ...exportJson.data.bundle.payload, totalDossiersCount: 999 } };
      const tamperRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/portability/verify", { method: "POST", headers: authJsonHeaders, body: JSON.stringify({ bundle: tamperedBundle }) })
      );
      expect(((await tamperRes.json()) as { data: { valid: boolean } }).data.valid).toBe(false);
    } finally {
      process.env.DURIOS_PORTABILITY_HMAC_SECRET = prevSecret;
      app.sqliteClient.close();
    }
  });

  it("Step 10 & 14: enforces strict tenant isolation on workspace portability exports", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-tenant-iso-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    try {
      const credsA = seedTestPilotActor(app.authService, { role: "MANAGER", tenantId: "TEN-A" });
      const credsB = seedTestPilotActor(app.authService, { role: "MANAGER", tenantId: "TEN-B", phoneNumber: "+84900000002" });
      app.workspace.createDossier({
        dossierCode: "DUR-TEN-A-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-A",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5, declaredNetWeightKg: 18000, declaredBoxCount: 950,
      }, app.authService.authenticateToken(credsA.sessionToken));

      const resB = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/open-core/portability", { headers: { Authorization: `Bearer ${credsB.sessionToken}` } })
      );
      const jsonB = (await resB.json()) as PortabilityApiResponse;
      expect(jsonB.data.bundle.payload.tenantId === "TEN-B" && jsonB.data.bundle.payload.totalDossiersCount === 0).toBe(true);
      expect(jsonB.data.bundle.payload.dossiersSummary).toHaveLength(0);
    } finally {
      app.sqliteClient.close();
    }
  });

  it("Step 1-25: validates complete 25-step blueprint synchronization across artifacts", () => {
    const companyJson = JSON.parse(readFileSync(".mekong/company.json", "utf-8")) as {
      name: string; open_core_manifest_api: { endpoints: readonly string[] };
    };
    expect(companyJson.name).toBe("DuriOS");
    expect(companyJson.open_core_manifest_api.endpoints).toContain("GET /api/v1/open-core/edition-manifest");
    expect((readFileSync("plans/company-blueprint/plan.md", "utf-8").match(/^## \d+\./gm) ?? []).length).toBe(25);
    expect((readFileSync("plans/company-blueprint/tasks.md", "utf-8").match(/\*\*Step \d+:/g) ?? []).length).toBe(25);
  });
});
