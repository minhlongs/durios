import { expect } from "bun:test";
import { FakeOtpProvider } from "../../src/auth/otp-provider.js";
import { runPilotOpsCliArgs } from "../../src/auth/pilot-ops-cli.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import { extractSessionCookiePair } from "./auth-test-helper.js";

export type WorkspaceAppInstance = ReturnType<typeof createWorkspaceApp>;

export interface AuthDataPayload {
  data: {
    sessionToken?: string; challengeId?: string; providerReference?: string;
    sessionId?: string; actor?: Record<string, unknown>;
  };
}

export async function runCookieOtpAndMptUnificationScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: WorkspaceAppInstance) => void,
  restoreNodeEnv: () => void
): Promise<void> {
  const fakeOtp = new FakeOtpProvider();
  const app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: fakeOtp });
  setApp(app);
  const rawPassword = "StrongPilotPassword#2026";
  runPilotOpsCliArgs(
    [
      "provision-account", "--id", "ACT-CAILAY-MGR-01", "--username", "mgr.cailay",
      "--phone", "+84909111222", "--name", "Tran Thi B (Packhouse Manager)",
      "--tenant", "TENANT-CAILAY-01", "--tenant-type", "PACKHOUSE_EXPORTER",
      "--role", "MANAGER", "--persona", "PACKHOUSE_MANAGER",
    ],
    app.authService,
    { DURIOS_PILOT_PASSWORD: rawPassword }
  );

  process.env.NODE_ENV = "production";
  const pwRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "mgr.cailay", password: rawPassword }),
    })
  );
  expect(pwRes.status).toBe(200);
  expect(pwRes.headers.get("cache-control")).toBe("no-store");
  const pwSetCookie = pwRes.headers.get("set-cookie") ?? "";
  for (const part of ["HttpOnly", "SameSite=Strict", "Path=/", "Max-Age=", "Expires=", "Secure"]) {
    expect(pwSetCookie).toContain(part);
  }
  const pwBody = (await pwRes.json()) as AuthDataPayload;
  expect(pwBody.data.sessionToken).toBeUndefined();
  const pwCookiePair = extractSessionCookiePair(pwSetCookie);

  restoreNodeEnv();
  const otpReqRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/otp/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+84909111222", channel: "ZALO" }),
    })
  );
  expect(otpReqRes.status).toBe(201);
  const challengeId = ((await otpReqRes.json()) as AuthDataPayload).data.challengeId as string;
  const deliveredOtp = fakeOtp.getLatestForPhone("+84909111222")!;

  const otpVerRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, otpCode: deliveredOtp.otpCode }),
    })
  );
  expect(otpVerRes.status).toBe(200);
  const otpBody = (await otpVerRes.json()) as AuthDataPayload;
  expect(otpBody.data.sessionToken).toBeUndefined();
  const otpCookiePair = extractSessionCookiePair(otpVerRes.headers.get("set-cookie"));

  const issuedMpt = runPilotOpsCliArgs(
    [
      "issue-token", "--account-id", "ACT-CAILAY-MGR-01",
      "--device", "CaiLay-Scanner-Tablet-01", "--expires-at", new Date(Date.now() + 3600_000).toISOString(),
    ],
    app.authService
  );
  if (!("rawToken" in issuedMpt)) throw new Error("Expected issued token");

  const mePw = (await (await app.handler(new Request("http://127.0.0.1/api/auth/me", { headers: { Cookie: pwCookiePair } }))).json()) as AuthDataPayload;
  const meOtp = (await (await app.handler(new Request("http://127.0.0.1/api/auth/me", { headers: { Cookie: otpCookiePair } }))).json()) as AuthDataPayload;
  const meMpt = (await (await app.handler(new Request("http://127.0.0.1/api/auth/me", { headers: { "x-pilot-token": issuedMpt.rawToken } }))).json()) as AuthDataPayload;

  const expectedActor = {
    id: "ACT-CAILAY-MGR-01", name: "Tran Thi B (Packhouse Manager)",
    tenantId: "TENANT-CAILAY-01", tenantType: "PACKHOUSE_EXPORTER",
    role: "MANAGER", persona: "PACKHOUSE_MANAGER",
  };
  expect(mePw.data.actor).toEqual(expectedActor);
  expect(meOtp.data.actor).toEqual(expectedActor);
  expect(meMpt.data.actor).toEqual(expectedActor);

  const dbDump = JSON.stringify({
    accounts: app.sqliteClient.db.query("SELECT * FROM pilot_accounts").all(),
    sessions: app.sqliteClient.db.query("SELECT * FROM auth_sessions").all(),
    challenges: app.sqliteClient.db.query("SELECT * FROM otp_challenges").all(),
    tokens: app.sqliteClient.db.query("SELECT * FROM managed_pilot_tokens").all(),
  });
  expect(dbDump).not.toContain(rawPassword);
  expect(dbDump).not.toContain(deliveredOtp.otpCode);
  expect(dbDump).not.toContain(issuedMpt.rawToken);
}
