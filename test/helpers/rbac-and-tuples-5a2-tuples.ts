import { expect } from "bun:test";
import { generateSaltHex, hashOpaqueToken, hashSecretWithSalt } from "../../src/auth/crypto-helpers.js";
import { FakeOtpProvider } from "../../src/auth/otp-provider.js";
import { AccessControlError, assertValidIdentityTuple } from "../../src/auth/rbac-policy.js";
import type { ProductPersona, TenantType, UserRole } from "../../src/domain/types.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import { seedTestPilotActor } from "./auth-test-helper.js";

export type WorkspaceAppInstance = ReturnType<typeof createWorkspaceApp>;
export type SeededActor = ReturnType<typeof seedTestPilotActor>;
export type HttpCaller = (path: string, cookie: string, method?: string, body?: unknown) => Promise<Response>;

export interface ExtractedFieldItem { id: string; rawValue: string }
export interface DocumentDetailItem { id: string; extractedFields: ExtractedFieldItem[] }
export interface DossierDetailPayload { data: { id: string; lifecycleState?: string; documents: DocumentDetailItem[] } }
export interface GrantResponsePayload { grant: { id: string; isRevoked: boolean } }
export interface ErrorCodePayload { errorCode?: string; data?: { challengeId: string } }

export function createHttpCaller(handler: WorkspaceAppInstance["handler"]): HttpCaller {
  return (path: string, cookie: string, method = "POST", body?: unknown) =>
    handler(new Request(`http://127.0.0.1${path}`, {
      method, headers: { Cookie: cookie, "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));
}

export function makeDocPayloads(seal: string, tag: string) {
  return [
    {
      fileName: `PL_${tag}.pdf`, documentType: "PACKING_LIST",
      base64Content: Buffer.from(`%PDF-1.5 pl ${tag}`).toString("base64"),
      fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: seal }, box_count: { raw: "900" }, net_weight_kg: { raw: "18000" } },
    },
    {
      fileName: `Lab_${tag}.pdf`, documentType: "LAB_TEST_REPORT",
      base64Content: Buffer.from(`%PDF-1.5 lab ${tag}`).toString("base64"),
      fixtureFields: { cadmium_mg_kg: { raw: "0.025" }, sample_code: { raw: `S-${tag}` }, sampling_date: { raw: "2026-10-06" } },
    },
    {
      fileName: `Phyto_${tag}.pdf`, documentType: "PHYTOSANITARY_CERTIFICATE",
      base64Content: Buffer.from(`%PDF-1.5 phyto ${tag}`).toString("base64"),
      fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: seal }, phyto_cert_number: { raw: `P-${tag}` } },
    },
  ];
}

export async function runIdentityTupleValidationScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: WorkspaceAppInstance) => void
): Promise<void> {
  const fakeOtp = new FakeOtpProvider();
  const app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads, otpProvider: fakeOtp });
  setApp(app);

  const validTuples: Array<[ProductPersona, TenantType, UserRole]> = [
    ["ORCHARD_OFFICER", "ORCHARD_COOP", "CLERK"], ["ORCHARD_OFFICER", "ORCHARD_COOP", "MANAGER"],
    ["ORCHARD_OFFICER", "ORCHARD_COOP", "ADMIN"], ["PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK"],
    ["PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "MANAGER"], ["PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "ADMIN"],
    ["BUYER_VIEWER", "BUYER_IMPORTER", "VIEWER"], ["BUYER_VIEWER", "PACKHOUSE_EXPORTER", "VIEWER"],
    ["SYSTEM_AUDITOR", "INSPECTION_AUDITOR", "AUDITOR"], ["SYSTEM_AUDITOR", "PACKHOUSE_EXPORTER", "AUDITOR"],
    ["SYSTEM_AUDITOR", "ORCHARD_COOP", "AUDITOR"],
  ];
  for (const [persona, tenantType, role] of validTuples) {
    expect(() => assertValidIdentityTuple(persona, tenantType, role)).not.toThrow();
    const seeded = seedTestPilotActor(app.authService, { persona, tenantType, role, tenantId: "TEN-VALID" });
    expect((await app.handler(new Request("http://127.0.0.1/api/auth/me", { headers: { Cookie: seeded.sessionCookie } }))).status).toBe(200);
  }

  const invalidTuples: Array<[unknown, unknown, unknown]> = [
    ["BUYER_VIEWER", "BUYER_IMPORTER", "MANAGER"], ["BUYER_VIEWER", "BUYER_IMPORTER", "CLERK"],
    ["PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "MANAGER"], ["PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "VIEWER"],
    ["SYSTEM_AUDITOR", "INSPECTION_AUDITOR", "CLERK"], ["SYSTEM_AUDITOR", "INSPECTION_AUDITOR", "ADMIN"],
    ["ORCHARD_OFFICER", "BUYER_IMPORTER", "CLERK"], ["PACKHOUSE_MANAGER", "ORCHARD_COOP", "MANAGER"],
    ["UNKNOWN_PERSONA", "PACKHOUSE_EXPORTER", "CLERK"], [undefined, "PACKHOUSE_EXPORTER", "CLERK"],
  ];
  for (const [persona, tenantType, role] of invalidTuples) {
    expect(() =>
      app.authService.provisionPilotAccount({
        username: `bad_${String(persona)}_${String(role)}`, password: "Pass#123",
        actorName: "Invalid Tuple Actor", tenantId: "TEN-BAD",
        tenantType: tenantType as TenantType, role: role as UserRole, persona: persona as ProductPersona,
      })
    ).toThrow(AccessControlError);
  }

  const salt = generateSaltHex();
  const [pwHash, now] = [hashSecretWithSalt("LegacyPass#1", salt), new Date().toISOString()];
  app.sqliteClient.db.run(
    `INSERT INTO pilot_accounts VALUES ('ACT-LEGACY-BAD', 'legacy.bad', '+84911000999', ?, ?, 'Legacy Bad', 'TEN-BAD', 'BUYER_IMPORTER', 'MANAGER', 'BUYER_VIEWER', 1, ?, ?)`,
    [pwHash, salt, now, now]
  );
  app.sqliteClient.db.run(
    `INSERT INTO managed_pilot_tokens VALUES ('MPT-LEG-BAD', ?, 'ACT-LEGACY-BAD', 'BadDevice', ?, NULL, NULL, ?)`,
    [hashOpaqueToken("dpt_legacy_bad_token"), new Date(Date.now() + 600_000).toISOString(), now]
  );

  const sessionsBefore = (app.sqliteClient.db.query<{ c: number }, []>("SELECT COUNT(*) as c FROM auth_sessions").get())!.c;

  const pwBadRes = await app.handler(new Request("http://127.0.0.1/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "legacy.bad", password: "LegacyPass#1" }),
  }));
  expect(pwBadRes.status === 403 && pwBadRes.headers.get("set-cookie") === null).toBe(true);
  expect(((await pwBadRes.json()) as ErrorCodePayload).errorCode).toBe("INVALID_IDENTITY_TUPLE");

  const otpReq = await app.handler(new Request("http://127.0.0.1/api/auth/otp/request", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: "+84911000999", channel: "ZALO" }),
  }));
  const chId = ((await otpReq.json()) as ErrorCodePayload).data!.challengeId;
  const otpCode = fakeOtp.getLatestForPhone("+84911000999")!.otpCode;
  const otpVerBad = await app.handler(new Request("http://127.0.0.1/api/auth/otp/verify", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId: chId, otpCode }),
  }));
  expect(otpVerBad.status === 403 && otpVerBad.headers.get("set-cookie") === null).toBe(true);
  expect((app.sqliteClient.db.query<{ c: number }, []>("SELECT COUNT(*) as c FROM auth_sessions").get())!.c).toBe(sessionsBefore);
  expect((await app.handler(new Request("http://127.0.0.1/api/dossiers", { headers: { "x-pilot-token": "dpt_legacy_bad_token" } }))).status).toBe(403);
}
