import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import { createHttpBlockedDossier, postOverride } from "./helpers/http-blocked-dossier-scenario.js";

const TEST_DB = "./data/test-http-override.db";
const TEST_UPLOADS = "./data/test-http-override-uploads";

interface OverrideBody {
  readonly success: boolean;
  readonly data?: { lifecycleState: string } | undefined;
  readonly error?: string | undefined;
}

describe("POST /api/dossiers/:id/override", () => {
  let appInstance: ReturnType<typeof createWorkspaceApp> | null = null;
  let clerkAuth = "";
  let managerAuth = "";
  let adminAuth = "";

  afterEach(() => {
    if (appInstance) { appInstance.sqliteClient.close(); appInstance = null; }
    for (const suffix of ["", "-wal", "-shm"]) if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  function getApp() {
    appInstance = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    clerkAuth = seedTestPilotActor(appInstance.authService, { role: "CLERK" }).sessionCookie;
    managerAuth = seedTestPilotActor(appInstance.authService, { role: "MANAGER" }).sessionCookie;
    adminAuth = seedTestPilotActor(appInstance.authService, { role: "ADMIN" }).sessionCookie;
    return appInstance.handler;
  }

  it("T-HTTP-OV-01: a manager signs past the blocker and gets REVIEW_REQUIRED", async () => {
    const handle = getApp();
    const id = await createHttpBlockedDossier(handle, clerkAuth);

    const res = await postOverride(handle, id, managerAuth, "Supplier certificate attached and QA signed");

    expect(res.status).toBe(200);
    expect(((await res.json()) as OverrideBody).data?.lifecycleState).toBe("REVIEW_REQUIRED");
  });

  it("T-HTTP-OV-02: a clerk is refused", async () => {
    const handle = getApp();
    const id = await createHttpBlockedDossier(handle, clerkAuth);

    expect((await postOverride(handle, id, clerkAuth, "Clerk attempt")).status).toBe(403);
  });

  it("T-HTTP-OV-03: a missing reason is refused with 400 and names the field", async () => {
    const handle = getApp();
    const id = await createHttpBlockedDossier(handle, clerkAuth);

    const res = await postOverride(handle, id, managerAuth);
    expect(res.status).toBe(400);
    expect(((await res.json()) as OverrideBody).error).toContain("reason");
  });

  it("T-HTTP-OV-04: an override on an unknown dossier is refused with 404", async () => {
    const handle = getApp();

    expect((await postOverride(handle, "DOS-MISSING", managerAuth, "Never reached")).status).toBe(404);
  });

  it("T-HTTP-OV-05: the ADMIN export role is not the single signer this gate requires", async () => {
    const handle = getApp();
    const id = await createHttpBlockedDossier(handle, clerkAuth);

    expect((await postOverride(handle, id, adminAuth, "Admin attempt")).status).toBe(403);
  });
});
