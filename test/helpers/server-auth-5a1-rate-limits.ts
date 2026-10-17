import { expect } from "bun:test";
import { FakeOtpProvider } from "../../src/auth/otp-provider.js";
import { executePilotOpsCommand } from "../../src/auth/pilot-ops-cli.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import type { AuthDataPayload, WorkspaceAppInstance } from "./server-auth-5a1-auth-flows.js";

export async function runOtpEnumerationAndRateLimitsScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: WorkspaceAppInstance) => void
): Promise<void> {
  let app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);
  executePilotOpsCommand(app.authService, {
    action: "provision-account",
    id: "ACT-CLERK-01",
    username: "clerk.01",
    password: "ClerkPassword!1",
    phoneNumber: "+84909333444",
    actorName: "Nguyen Van A",
    tenantId: "TENANT-A",
    tenantType: "PACKHOUSE_EXPORTER",
    role: "CLERK",
    persona: "PACKHOUSE_CLERK",
  });

  const unconfOtpRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+84909333444" }),
    })
  );
  expect(unconfOtpRes.status).toBe(503);

  const fakeOtp = new FakeOtpProvider();
  app.authService.setOtpProvider(fakeOtp);

  const unknownPhoneRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+84909000000", channel: "ZALO" }),
    })
  );
  expect(unknownPhoneRes.status).toBe(201);
  const unknownData = ((await unknownPhoneRes.json()) as AuthDataPayload).data;
  expect(unknownData.challengeId).toMatch(/^OTP-/);
  expect(unknownData.providerReference).toBe("OTP-DISPATCH-ACCEPTED");
  expect(fakeOtp.getLatestForPhone("+84909000000")).toBeUndefined();

  for (let i = 0; i < 3; i++) {
    const r = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": `203.0.113.${i + 1}` },
        body: JSON.stringify({ phoneNumber: "+84909333444", channel: "SMS" }),
      })
    );
    expect(r.status).toBe(201);
  }
  const fourthOtpReq = await app.handler(
    new Request("http://127.0.0.1/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.99" },
      body: JSON.stringify({ phoneNumber: "+84909333444", channel: "SMS" }),
    })
  );
  expect(fourthOtpReq.status).toBe(429);

  for (let i = 0; i < 5; i++) {
    const r = await app.handler(
      new Request("http://127.0.0.1/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Real-IP": `10.0.0.${i}` },
        body: JSON.stringify({ username: "clerk.01", password: "WrongPassword" }),
      })
    );
    expect(r.status).toBe(401);
  }
  app.sqliteClient.close();
  app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: fakeOtp });
  setApp(app);
  const lockedPwRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "clerk.01", password: "ClerkPassword!1" }),
    })
  );
  expect(lockedPwRes.status).toBe(429);
}
