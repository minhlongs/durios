import { expect } from "bun:test";
import {
  createOtpProviderFromEnv,
  HttpGatewayOtpProvider,
} from "../../src/auth/otp-provider.js";
import { executePilotOpsCommand } from "../../src/auth/pilot-ops-cli.js";
import { createWorkspaceApp } from "../../src/server/server.js";

interface OtpResponsePayload {
  data: {
    challengeId: string;
    providerReference: string;
    actor: { id: string };
  };
}

interface CapturedGatewayBody {
  challengeId?: string;
  channel?: string;
  zaloOaId?: string;
  otpCode?: string;
}

export async function runHttpGatewayOtpProviderScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: ReturnType<typeof createWorkspaceApp> | null) => void
): Promise<void> {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;
  try {
    // 1. Unconfigured or non-HTTPS remote URL falls back to UnconfiguredOtpProvider (fail-closed)
    expect(createOtpProviderFromEnv({}).isConfigured).toBe(false);
    expect(
      createOtpProviderFromEnv({
        DURIOS_OTP_PROVIDER: "ESMS",
        DURIOS_OTP_API_URL: "http://remote-insecure.example.com/otp",
        DURIOS_OTP_API_KEY: "key-1",
        DURIOS_OTP_SECRET_KEY: "sec-1",
      }).isConfigured
    ).toBe(false);

    // 2. Configured gateway dispatches ZALO and SMS and never leaks otpCode/secrets on error
    const capturedRequests: Array<{ url: string; headers: Record<string, string>; body: CapturedGatewayBody }> = [];
    let gatewayShouldFail = false;

    const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const rawBody = (init?.body ? JSON.parse(String(init.body)) : {}) as CapturedGatewayBody;
      const hdrs = (init?.headers ?? {}) as Record<string, string>;
      capturedRequests.push({ url: String(input), headers: hdrs, body: rawBody });

      if (gatewayShouldFail) {
        return new Response(JSON.stringify({ CodeResult: "99", ErrorMessage: "Gateway quota exceeded" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          CodeResult: "100",
          SMSID: `ESMS-REF-${rawBody.challengeId ?? ""}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const envGateway = createOtpProviderFromEnv(
      {
        DURIOS_OTP_PROVIDER: "ESMS",
        DURIOS_OTP_API_URL: "https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/",
        DURIOS_OTP_API_KEY: "TOP_SECRET_API_KEY",
        DURIOS_OTP_SECRET_KEY: "TOP_SECRET_KEY_VALUE",
        DURIOS_OTP_ZALO_OA_ID: "OA-CAILAY-01",
        DURIOS_OTP_ZALO_TEMPLATE_ID: "TPL-ZNS-8899",
        DURIOS_OTP_SMS_BRANDNAME: "DURIOS_VN",
      },
      mockFetch
    );
    expect(envGateway.isConfigured).toBe(true);
    expect(envGateway).toBeInstanceOf(HttpGatewayOtpProvider);

    app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: envGateway });
    executePilotOpsCommand(app.authService, {
      action: "provision-account",
      id: "ACT-GW-01",
      username: "cailay.clerk.gw",
      password: "ClerkGwPassword!2026",
      phoneNumber: "+84905556677",
      actorName: "Vo Thi Cai Lay",
      tenantId: "TENANT-CAILAY-01",
      tenantType: "PACKHOUSE_EXPORTER",
      role: "CLERK",
      persona: "PACKHOUSE_CLERK",
    });

    // Request OTP via ZALO
    const zaloRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+84905556677", channel: "ZALO" }),
      })
    );
    expect(zaloRes.status).toBe(201);
    const zaloData = ((await zaloRes.json()) as OtpResponsePayload).data;
    expect(zaloData.providerReference).toBe("OTP-DISPATCH-ACCEPTED");
    expect(capturedRequests.length).toBe(1);
    expect(capturedRequests[0]?.body.channel).toBe("ZALO");
    expect(capturedRequests[0]?.body.zaloOaId).toBe("OA-CAILAY-01");

    const dispatchedOtp = capturedRequests[0]?.body.otpCode ?? "";
    expect(dispatchedOtp).toMatch(/^\d{6}$/);

    // Verify OTP creates authenticated session
    const verifyRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: zaloData.challengeId, otpCode: dispatchedOtp }),
      })
    );
    expect(verifyRes.status).toBe(200);
    expect(((await verifyRes.json()) as OtpResponsePayload).data.actor.id).toBe("ACT-GW-01");

    // Request OTP via SMS when gateway fails -> returns 502 without leaking secret or OTP
    gatewayShouldFail = true;
    const failRes = await app.handler(
      new Request("http://127.0.0.1/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+84905556677", channel: "SMS" }),
      })
    );
    expect(failRes.status).toBe(502);
    const failText = await failRes.text();
    expect(failText).toContain("OTP_PROVIDER_DISPATCH_FAILED");
    expect(failText).not.toContain("TOP_SECRET_API_KEY");
    expect(failText).not.toContain("TOP_SECRET_KEY_VALUE");
    const lastOtp = capturedRequests[capturedRequests.length - 1]?.body.otpCode ?? "";
    expect(failText).not.toContain(lastOtp);
  } finally {
    setApp(app);
  }
}
