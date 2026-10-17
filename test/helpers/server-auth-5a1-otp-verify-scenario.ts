import { expect } from "bun:test";
import { FakeOtpProvider } from "../../src/auth/otp-provider.js";
import { executePilotOpsCommand } from "../../src/auth/pilot-ops-cli.js";
import { createWorkspaceApp } from "../../src/server/server.js";

interface OtpChallengeResponse {
  data: {
    challengeId: string;
  };
}

export async function runOtpVerifyRateLimitPersistenceScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: ReturnType<typeof createWorkspaceApp> | null) => void
): Promise<void> {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;
  try {
    const fakeOtp = new FakeOtpProvider();
    app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: fakeOtp });

    // 1. Provision account and request a valid OTP challenge
    executePilotOpsCommand(app.authService, {
      action: "provision-account",
      id: "ACT-OTP-LOCK-01",
      username: "otp.lock.user",
      password: "OtpLockPassword!1",
      phoneNumber: "+84908765432",
      actorName: "Pham Van OTP",
      tenantId: "TENANT-OTP-01",
      tenantType: "PACKHOUSE_EXPORTER",
      role: "CLERK",
      persona: "PACKHOUSE_CLERK",
    });

    const otpReqRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+84908765432", channel: "ZALO" }),
      })
    );
    expect(otpReqRes.status).toBe(201);
    const challengeId = ((await otpReqRes.json()) as OtpChallengeResponse).data.challengeId;
    const delivered = fakeOtp.getLatestForPhone("+84908765432")!;
    expect(delivered).toBeDefined();
    const correctOtp = delivered.otpCode;
    const wrongOtp = correctOtp === "999999" ? "000000" : "999999";

    // 2. Submit wrong OTP below threshold (attempts 1..4 -> HTTP 401)
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wrongRes = await app.handler(
        new Request("http://127.0.0.1/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId, otpCode: wrongOtp }),
        })
      );
      expect(wrongRes.status).toBe(401);
      expect(wrongRes.headers.get("set-cookie")).toBeNull();
    }

    // 3. Reach configured failure threshold (attempt 5 -> HTTP 429)
    const fifthWrongRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otpCode: wrongOtp }),
      })
    );
    expect(fifthWrongRes.status).toBe(429);
    expect(fifthWrongRes.headers.get("set-cookie")).toBeNull();

    // Verify otp_verify:<phone> bucket is persisted with blocked_until in SQLite
    const rateLimitRow = app.sqliteClient.db
      .query<{ bucket_key: string; attempt_count: number; blocked_until: string | null }, [string]>(
        "SELECT bucket_key, attempt_count, blocked_until FROM auth_rate_limits WHERE bucket_key = ?"
      )
      .get("otp_verify:+84908765432");
    expect(rateLimitRow?.attempt_count).toBe(5);
    expect(rateLimitRow?.blocked_until).not.toBeNull();

    // 4. Close and reopen the app on the same SQLite DB; submitting the CORRECT OTP still returns 429
    app.sqliteClient.close();
    app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: fakeOtp });

    const correctAfterRestartRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otpCode: correctOtp }),
      })
    );
    expect(correctAfterRestartRes.status).toBe(429);
    expect(correctAfterRestartRes.headers.get("set-cookie")).toBeNull();

    // 5. Request decoy challenge for unregistered phone and verify wrong OTP is rejected without creating any session
    const decoyReqRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+84900000111", channel: "SMS" }),
      })
    );
    expect(decoyReqRes.status).toBe(201);
    const decoyChallengeId = ((await decoyReqRes.json()) as OtpChallengeResponse).data.challengeId;

    const decoyVerifyRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: decoyChallengeId, otpCode: "123456" }),
      })
    );
    expect(decoyVerifyRes.status).toBe(401);
    expect(decoyVerifyRes.headers.get("set-cookie")).toBeNull();

    const sessionCount = app.sqliteClient.db
      .query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM auth_sessions")
      .get();
    expect(sessionCount?.cnt).toBe(0);
  } finally {
    setApp(app);
  }
}
