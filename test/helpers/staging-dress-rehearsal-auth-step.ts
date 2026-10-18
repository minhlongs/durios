import { expect } from "bun:test";
import { runPilotOpsCliArgs } from "../../src/auth/pilot-ops-cli.js";
import type { createWorkspaceApp } from "../../src/server/server.js";
import { extractSessionCookiePair } from "./auth-test-helper.js";

export type WorkspaceAppInstance = ReturnType<typeof createWorkspaceApp>;
export interface StagingCliAccountResult { id: string }
export interface StagingCliTokenResult { rawToken: string }

export interface StagingExtractedField {
  id: string; fieldKey: string; rawValue: string; confirmedValue?: string;
}
export interface StagingDocumentView {
  id: string; storagePath?: string; extractedFields: StagingExtractedField[];
}
export interface StagingDossierView {
  id: string; lifecycleState: string; isImmutable?: boolean; documents: StagingDocumentView[];
}
export interface StagingValidationView { status: string; criticalBlockers: number }

export interface StagingAuthContext {
  clerkOtpCookie: string; mgrCookie: string; buyerRawToken: string; futureIso: string;
}

export async function provisionAndVerifyStagingAccounts(
  siteA: WorkspaceAppInstance,
  getLastDispatchedOtp: () => string
): Promise<StagingAuthContext> {
  const clerkAcct = runPilotOpsCliArgs(
    [
      "provision-account", "--id", "ACT-CAILAY-CLERK-01", "--username", "clerk_cailay01",
      "--name", "Nguyen Van Clerk (Cai Lay)", "--phone", "+84901112233", "--tenant", "TENANT-CAILAY-01",
      "--tenant-type", "PACKHOUSE_EXPORTER", "--role", "CLERK", "--persona", "PACKHOUSE_CLERK",
    ],
    siteA.authService,
    { DURIOS_PILOT_PASSWORD: "CaiLayClerk!2026" }
  ) as unknown as StagingCliAccountResult;
  expect(clerkAcct.id).toBe("ACT-CAILAY-CLERK-01");

  const mgrAcct = runPilotOpsCliArgs(
    [
      "provision-account", "--id", "ACT-CAILAY-MGR-01", "--username", "mgr_cailay01",
      "--name", "Tran Thi Manager (Cai Lay)", "--phone", "+84901112244", "--tenant", "TENANT-CAILAY-01",
      "--tenant-type", "PACKHOUSE_EXPORTER", "--role", "MANAGER", "--persona", "PACKHOUSE_MANAGER",
    ],
    siteA.authService,
    { DURIOS_PILOT_PASSWORD: "CaiLayMgr!2026" }
  ) as unknown as StagingCliAccountResult;
  expect(mgrAcct.id).toBe("ACT-CAILAY-MGR-01");

  const buyerAcct = runPilotOpsCliArgs(
    [
      "provision-account", "--id", "ACT-BUYER-CN-01", "--username", "buyer_cn01",
      "--name", "Guangxi Fruit Importer (Synthetic)", "--phone", "+84901112255", "--tenant", "TENANT-BUYER-CN-01",
      "--tenant-type", "BUYER_IMPORTER", "--role", "VIEWER", "--persona", "BUYER_VIEWER",
    ],
    siteA.authService,
    { DURIOS_PILOT_PASSWORD: "BuyerViewer!2026" }
  ) as unknown as StagingCliAccountResult;

  const futureIso = new Date(Date.now() + 30 * 86400_000).toISOString();
  const clerkManagedToken = runPilotOpsCliArgs(
    ["issue-token", "--account-id", clerkAcct.id, "--device", "PC-BAN-GIAY-CAILAY-01", "--expires-at", futureIso],
    siteA.authService
  ) as unknown as StagingCliTokenResult;
  const buyerManagedToken = runPilotOpsCliArgs(
    ["issue-token", "--account-id", buyerAcct.id, "--device", "BUYER-PORTAL-01", "--expires-at", futureIso],
    siteA.authService
  ) as unknown as StagingCliTokenResult;

  const pwLoginRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "clerk_cailay01", password: "CaiLayClerk!2026" }),
    })
  );
  expect(pwLoginRes.status).toBe(200);
  expect(pwLoginRes.headers.get("set-cookie")).toContain("Secure");
  const clerkPwCookie = extractSessionCookiePair(pwLoginRes.headers.get("set-cookie"));

  const otpReqRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/auth/otp/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+84901112233", channel: "ZALO" }),
    })
  );
  expect(otpReqRes.status).toBe(201);
  const challengeId = ((await otpReqRes.json()) as { data: { challengeId: string } }).data.challengeId;

  const otpVerifyRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/auth/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, otpCode: getLastDispatchedOtp() }),
    })
  );
  expect(otpVerifyRes.status).toBe(200);
  const clerkOtpCookie = extractSessionCookiePair(otpVerifyRes.headers.get("set-cookie"));

  for (const hdr of [{ Cookie: clerkPwCookie }, { Cookie: clerkOtpCookie }, { Authorization: `Bearer ${clerkManagedToken.rawToken}` }]) {
    const meRes = await siteA.handler(new Request("https://durios-pilot.local/api/auth/me", { headers: hdr }));
    expect(meRes.status).toBe(200);
    expect(((await meRes.json()) as { data: { actor: Record<string, unknown> } }).data.actor).toEqual({
      id: "ACT-CAILAY-CLERK-01", name: "Nguyen Van Clerk (Cai Lay)", tenantId: "TENANT-CAILAY-01",
      tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
    });
  }

  const mgrLoginRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "mgr_cailay01", password: "CaiLayMgr!2026" }),
    })
  );
  const mgrCookie = extractSessionCookiePair(mgrLoginRes.headers.get("set-cookie"));

  return { clerkOtpCookie, mgrCookie, buyerRawToken: buyerManagedToken.rawToken, futureIso };
}
