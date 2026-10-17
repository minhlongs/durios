import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { assertLoopbackHostname, createWorkspaceApp, startLocalServer } from "../src/server/server.js";
import { extractSessionCookiePair } from "./helpers/auth-test-helper.js";

const TEST_DB = "./data/test-gate03-runbook.db";
const TEST_UPLOADS = "./data/test-gate03-uploads";

describe("GATE-03 On-Premise Runbook & /api/v1/auth/* Contract", () => {
  afterEach(() => {
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("enforces loopback-only hostname binding per GATE-03 runbook", () => {
    expect(assertLoopbackHostname("127.0.0.1")).toBe("127.0.0.1");
    expect(assertLoopbackHostname("localhost")).toBe("localhost");
    expect(assertLoopbackHostname("::1")).toBe("::1");
    expect(() => assertLoopbackHostname("0.0.0.0")).toThrow(/GATE-03 Security Violation/);
    expect(() => assertLoopbackHostname("192.168.1.50")).toThrow(/GATE-03 Security Violation/);
    expect(() => startLocalServer({ hostname: "0.0.0.0", port: 0, dbPath: TEST_DB, dataDir: TEST_UPLOADS })).toThrow(
      /GATE-03 Security Violation/
    );
  });

  it("routes /api/health, /api/auth/login, /api/auth/me, and /api/v1/dossiers as required by Disaster Recovery SOP", async () => {
    const app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    try {
      const healthRes = await app.handler(new Request("http://127.0.0.1/api/health"));
      expect(healthRes.status).toBe(200);
      const healthBody = (await healthRes.json()) as { status: string; service: string };
      expect(healthBody.status).toBe("healthy");

      app.authService.provisionPilotAccount({
        id: "ACC-DR-MGR-01",
        username: "mgr_cailay01",
        password: "StrongPilotPassword#2026",
        phoneNumber: "+84901000111",
        actorName: "Quản lý Vựa Cai Lậy 01",
        tenantId: "TENANT-CAILAY-01",
        tenantType: "PACKHOUSE_EXPORTER",
        role: "MANAGER",
        persona: "PACKHOUSE_MANAGER",
      });

      const loginRes = await app.handler(
        new Request("http://127.0.0.1/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "mgr_cailay01", password: "StrongPilotPassword#2026" }),
        })
      );
      expect(loginRes.status).toBe(200);
      const cookiePair = extractSessionCookiePair(loginRes.headers.get("set-cookie") ?? "");
      const loginBody = (await loginRes.json()) as {
        success: boolean;
        data: { sessionId: string; actor: { id: string; role: string } };
      };
      expect(loginBody.success).toBe(true);
      expect(loginBody.data.actor.role).toBe("MANAGER");

      const meRes = await app.handler(
        new Request("http://127.0.0.1/api/auth/me", {
          method: "GET",
          headers: { Cookie: cookiePair },
        })
      );
      expect(meRes.status).toBe(200);
      const meBody = (await meRes.json()) as {
        success: boolean;
        data: { actor: { id: string; tenantId: string } };
      };
      expect(meBody.success).toBe(true);
      expect(meBody.data.actor.tenantId).toBe("TENANT-CAILAY-01");

      const listRes = await app.handler(
        new Request("http://127.0.0.1/api/v1/dossiers", {
          method: "GET",
          headers: { Cookie: cookiePair },
        })
      );
      expect(listRes.status).toBe(200);
    } finally {
      app.sqliteClient.close();
    }
  });
});
