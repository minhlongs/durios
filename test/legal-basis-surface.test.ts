import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import { createHttpBlockedDossier } from "./helpers/http-blocked-dossier-scenario.js";
import { compileValidationResult, cadmiumLegalBasis } from "./helpers/legal-basis-fixture.js";

const TEST_DB = "./data/test-legal-basis.db";
const TEST_UPLOADS = "./data/test-legal-basis-uploads";

/**
 * The cadmium rule is an internal food-safety control with no verified statutory
 * basis, so its blocker must arrive over the real API tagged "unverified" and must
 * not be presented as a legal conclusion. This is the distinction an operator
 * cannot make today: a CRITICAL_BLOCKER that cannot conclude renders identically
 * to a genuine one.
 */
interface Finding {
  readonly ruleId: string;
  readonly severity: string;
  readonly legalBasis?: string | undefined;
}

describe("Legal basis reaches the operator", () => {
  let appInstance: ReturnType<typeof createWorkspaceApp> | null = null;
  let clerkAuth = "";

  afterEach(() => {
    if (appInstance) { appInstance.sqliteClient.close(); appInstance = null; }
    for (const suffix of ["", "-wal", "-shm"]) if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("tags the cadmium blocker as unverified over the real API", async () => {
    appInstance = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    clerkAuth = seedTestPilotActor(appInstance.authService, { role: "CLERK" }).sessionCookie;
    const handle = appInstance.handler;
    const id = await createHttpBlockedDossier(handle, clerkAuth);

    const res = await handle(new Request(`http://localhost/api/dossiers/${id}`, {
      headers: { cookie: clerkAuth, "x-actor-role": "CLERK" },
    }));
    expect(res.status).toBe(200);
    const dossier = ((await res.json()) as { data: { latestValidationResult: { findings: readonly Finding[] } } }).data;

    const cadmium = dossier.latestValidationResult.findings.find((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK");
    expect(cadmium).toBeDefined();
    expect(cadmium!.severity).toBe("CRITICAL_BLOCKER");
    expect(cadmium!.legalBasis).toBe("unverified");
  });

  it("resolves the real catalogue cadmium rule to unverified", () => {
    // The rule ships as an internal control with no verified statutory basis, so the
    // helper must report it as unable to carry a legal conclusion.
    expect(cadmiumLegalBasis()).toBe("unverified");
  });

  it("keeps a verified rule's finding distinct from the unverified one", () => {
    const { verified, unverified } = compileValidationResult();
    expect(verified.legalBasis).toBe("verified");
    expect(unverified.legalBasis).toBe("unverified");
    expect(verified.legalBasis).not.toBe(unverified.legalBasis);
  });

  it("never leaves a blocking finding untagged", () => {
    const { findings } = compileValidationResult();
    for (const f of findings) {
      if (f.severity === "CRITICAL_BLOCKER") expect(f.legalBasis).toBeDefined();
    }
  });
});
