import { createWorkspaceApp, type ServerOptions } from "../../src/server/server.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
import { existsSync, rmSync } from "node:fs";
import { resetAttestationServiceForTests } from "../../src/server/financial-verification-context.js";
import { FINANCIAL_TEST_DB, FINANCIAL_TEST_UPLOADS, TEST_ATTESTATION_SECRET } from "./financial-verification-http-fixtures.js";
export { TEST_ATTESTATION_SECRET };

export interface FinancialTestApp {
  readonly handle: ReturnType<typeof createWorkspaceApp>["handler"];
  readonly managerAuth: string;
  readonly sqliteClient: ReturnType<typeof createWorkspaceApp>["sqliteClient"];
  /** Provisions a manager under a distinct tenant, for cross-tenant rejection tests. */
  readonly seedRivalTenantActor: () => string;
}

export function startFinancialVerificationApp(): FinancialTestApp {
  process.env.DURIOS_FINANCIAL_ATTESTATION_SECRET = TEST_ATTESTATION_SECRET;
  const app = createWorkspaceApp({
    dbPath: FINANCIAL_TEST_DB, dataDir: FINANCIAL_TEST_UPLOADS,
  } satisfies ServerOptions);
  const manager = seedTestPilotActor(app.authService, { role: "MANAGER" });
  return {
    handle: app.handler,
    managerAuth: manager.sessionCookie,
    sqliteClient: app.sqliteClient,
    seedRivalTenantActor: (): string =>
      seedTestPilotActor(app.authService, {
        role: "MANAGER", tenantId: "TENANT-RIVAL-002", tenantType: "PACKHOUSE_EXPORTER",
      }).sessionCookie,
  };
}

export function stopFinancialVerificationApp(sqliteClient: FinancialTestApp["sqliteClient"]): void {
  sqliteClient.close();
  resetAttestationServiceForTests();
  for (const suffix of ["", "-wal", "-shm"]) {
    if (existsSync(FINANCIAL_TEST_DB + suffix)) rmSync(FINANCIAL_TEST_DB + suffix, { force: true });
  }
  if (existsSync(FINANCIAL_TEST_UPLOADS)) rmSync(FINANCIAL_TEST_UPLOADS, { recursive: true, force: true });
}
