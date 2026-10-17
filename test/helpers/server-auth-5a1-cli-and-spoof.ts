import { expect } from "bun:test";
import { runPilotOpsCliArgs } from "../../src/auth/pilot-ops-cli.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import { extractSessionCookiePair } from "./auth-test-helper.js";
import type { WorkspaceAppInstance } from "./server-auth-5a1-auth-flows.js";

interface LoginAndDossierPayload {
  data: {
    sessionId?: string;
    actor?: Record<string, unknown>;
    id: string;
    tenantId: string;
  };
}

export async function runCliSecurityAndSpoofedHeadersScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: WorkspaceAppInstance) => void
): Promise<void> {
  let app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);

  // 1. Reject --password in CLI argv
  expect(() =>
    runPilotOpsCliArgs(
      [
        "provision-account", "--username", "bad.cli", "--password", "PlaintextArgvSecret",
        "--name", "Bad CLI", "--tenant", "TENANT-A", "--tenant-type", "PACKHOUSE_EXPORTER",
        "--role", "CLERK", "--persona", "PACKHOUSE_CLERK",
      ],
      app.authService
    )
  ).toThrow(/prohibited/i);

  // 2. Reject missing explicit --tenant-type / --role / --persona (no implicit defaults)
  expect(() =>
    runPilotOpsCliArgs(
      ["provision-account", "--username", "missing.role", "--name", "No Role", "--tenant", "TENANT-A"],
      app.authService,
      { DURIOS_PILOT_PASSWORD: "ValidPassword#1" }
    )
  ).toThrow(/no implicit defaults/i);

  // 3. Provision valid account via CLI and login via Cookie
  runPilotOpsCliArgs(
    [
      "provision-account", "--id", "ACT-CLI-01", "--username", "clerk.cli",
      "--name", "Le Van Clerk", "--tenant", "TENANT-REAL-01", "--tenant-type", "PACKHOUSE_EXPORTER",
      "--role", "CLERK", "--persona", "PACKHOUSE_CLERK",
    ],
    app.authService,
    { DURIOS_PILOT_PASSWORD: "CliPassword#1" }
  );

  const loginRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "clerk.cli", password: "CliPassword#1" }),
    })
  );
  const cookiePair = extractSessionCookiePair(loginRes.headers.get("set-cookie"));
  const sessionId = ((await loginRes.json()) as LoginAndDossierPayload).data.sessionId as string;

  // 4. Spoofed headers/query ignored when authenticating via cookie or when unauthenticated
  const unauthSpoofRes = await app.handler(
    new Request(
      "http://127.0.0.1/api/dossiers?actorId=ACT-SPOOF&tenantId=TENANT-SPOOF&tenantType=INSPECTION_AUDITOR&role=ADMIN&persona=PACKHOUSE_MANAGER",
      {
        headers: {
          "x-actor-id": "ACT-SPOOF", "x-actor-name": "Spoofed Admin",
          "x-tenant-id": "TENANT-SPOOF", "x-tenant-type": "INSPECTION_AUDITOR",
          "x-actor-role": "ADMIN", "x-persona": "PACKHOUSE_MANAGER",
        },
      }
    )
  );
  expect(unauthSpoofRes.status).toBe(401);

  const meSpoofRes = await app.handler(
    new Request(
      "http://127.0.0.1/api/auth/me?actorId=ACT-SPOOF&tenantId=TENANT-SPOOF&tenantType=BUYER_IMPORTER&role=ADMIN&persona=PACKHOUSE_MANAGER",
      {
        headers: {
          Cookie: cookiePair, "x-actor-id": "ACT-SPOOF", "x-actor-name": "Spoofed Admin",
          "x-tenant-id": "TENANT-SPOOF", "x-tenant-type": "BUYER_IMPORTER",
          "x-actor-role": "ADMIN", "x-persona": "PACKHOUSE_MANAGER",
        },
      }
    )
  );
  expect(meSpoofRes.status).toBe(200);
  expect(((await meSpoofRes.json()) as LoginAndDossierPayload).data.actor).toEqual({
    id: "ACT-CLI-01", name: "Le Van Clerk", tenantId: "TENANT-REAL-01",
    tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
  });

  const createWithSpoofRes = await app.handler(
    new Request(
      "http://127.0.0.1/api/dossiers?actorId=ACT-SPOOF&tenantId=TENANT-SPOOF&role=ADMIN",
      {
        method: "POST",
        headers: {
          Cookie: cookiePair, "Content-Type": "application/json",
          "x-actor-id": "ACT-SPOOF", "x-actor-name": "Spoofed Admin",
          "x-tenant-id": "TENANT-SPOOF", "x-actor-role": "ADMIN",
        },
        body: JSON.stringify({
          dossierCode: "DOS-SPOOF-CHECK-01", containerNumber: "MSKU1234565",
          sealNumber: "SEAL-SPOOF-01", targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
        }),
      }
    )
  );
  expect(createWithSpoofRes.status).toBe(201);
  const createdSpoofDossier = ((await createWithSpoofRes.json()) as LoginAndDossierPayload).data;
  expect(createdSpoofDossier.tenantId).toBe("TENANT-REAL-01");
  const spoofAuditEvents = app.workspace.auditLedger.getEventsForDossier(createdSpoofDossier.id, "TENANT-REAL-01");
  expect(spoofAuditEvents[0]?.actorId).toBe("ACT-CLI-01");
  expect(spoofAuditEvents[0]?.actorRole).toBe("CLERK");
  expect(spoofAuditEvents[0]?.tenantId).toBe("TENANT-REAL-01");
  const rawAuditRow = app.sqliteClient.db
    .query<{ actor_name: string }, [string]>("SELECT actor_name FROM audit_events WHERE dossier_id = ? LIMIT 1")
    .get(createdSpoofDossier.id);
  expect(rawAuditRow?.actor_name).toBe("Le Van Clerk");

  // 5. Revoke session via CLI command and verify immediate 401 across restart
  runPilotOpsCliArgs(["revoke-session", "--session-id", sessionId, "--reason", "Shift ended"], app.authService);
  app.sqliteClient.close();
  app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);
  const afterRevokeRes = await app.handler(
    new Request("http://127.0.0.1/api/auth/me", { headers: { Cookie: cookiePair } })
  );
  expect(afterRevokeRes.status).toBe(401);
}
