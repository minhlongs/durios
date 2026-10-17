import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import { runHttpDossierLifecycleScenario } from "./helpers/http-api-lifecycle-scenario.js";
import { runHttpAdminExportScenario } from "./helpers/http-api-admin-scenario.js";

const TEST_DB = "./data/test-http-api.db";
const TEST_UPLOADS = "./data/test-http-uploads";

describe("Phase B & C: Local HTTP API Integration", () => {
  let appInstance: ReturnType<typeof createWorkspaceApp> | null = null;
  let clerkAuth = "";
  let managerAuth = "";
  let adminAuth = "";

  afterEach(() => {
    if (appInstance) {
      appInstance.sqliteClient.close();
      appInstance = null;
    }
    if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
    if (existsSync(`${TEST_DB}-wal`)) rmSync(`${TEST_DB}-wal`, { force: true });
    if (existsSync(`${TEST_DB}-shm`)) rmSync(`${TEST_DB}-shm`, { force: true });
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  function getApp() {
    appInstance = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    clerkAuth = seedTestPilotActor(appInstance.authService, { role: "CLERK" }).sessionCookie;
    managerAuth = seedTestPilotActor(appInstance.authService, { role: "MANAGER" }).sessionCookie;
    adminAuth = seedTestPilotActor(appInstance.authService, { role: "ADMIN" }).sessionCookie;
    return appInstance.handler;
  }

  it("serves health status and index html", async () => {
    const handle = getApp();
    const healthRes = await handle(new Request("http://127.0.0.1/api/health"));
    expect(healthRes.status).toBe(200);
    const healthData = (await healthRes.json()) as { status: string };
    expect(healthData.status).toBe("healthy");

    const htmlRes = await handle(new Request("http://127.0.0.1/"));
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
  });

  it("handles complete dossier lifecycle over HTTP", async () => {
    const handle = getApp();
    await runHttpDossierLifecycleScenario(handle, clerkAuth, managerAuth);
  });

  it("returns controlled errors for malformed input and unknown routes", async () => {
    const handle = getApp();

    const notFoundRes = await handle(
      new Request("http://127.0.0.1/api/unknown-endpoint", {
        headers: { Cookie: clerkAuth },
      })
    );
    expect(notFoundRes.status).toBe(404);

    const badJsonReq = new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: clerkAuth },
      body: "{ invalid json",
    });
    const badJsonRes = await handle(badJsonReq);
    expect(badJsonRes.status).toBe(400);

    const missingFieldsReq = new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: clerkAuth },
      body: JSON.stringify({ dossierCode: "ONLY_ONE" }),
    });
    const missingRes = await handle(missingFieldsReq);
    expect(missingRes.status).toBe(400);
  });

  it("allows ADMIN actor to approve and export dossier over HTTP", async () => {
    const handle = getApp();
    await runHttpAdminExportScenario(handle, adminAuth);
  });

  it("supports approved /api/v1 route groups and isolates out-of-scope paths", async () => {
    const handle = getApp();

    const v1Health = await handle(
      new Request("http://127.0.0.1/api/v1/health", {
        headers: { Cookie: clerkAuth },
      })
    );
    expect(v1Health.status).toBe(404);

    const v1Dossiers = await handle(
      new Request("http://127.0.0.1/api/v1/dossiers", {
        headers: { Cookie: clerkAuth },
      })
    );
    expect(v1Dossiers.status).toBe(200);

    const v1Kpi = await handle(
      new Request("http://127.0.0.1/api/v1/pilot/kpi", {
        headers: { Cookie: clerkAuth },
      })
    );
    expect(v1Kpi.status).toBe(200);
  });
});
