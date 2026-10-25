import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import { completeDossierDocuments } from "./helpers/complete-dossier-documents.js";

const TEST_DB = "./data/test-concurrency.db";
const TEST_UPLOADS = "./data/test-concurrency-uploads";

/** Distinct bytes per upload: identical content is deduplicated by hash. */
const syntheticPdf = (name: string): string => Buffer.from(`%PDF-1.5 synthetic ${name}`).toString("base64");


/** The identifiers the openDossier helper writes, which the documents must repeat. */
const RACE_IDENTIFIERS = { containerNumber: "MSKU1234565", sealNumber: "SEAL-RACE" };

describe("Optimistic concurrency on dossier writes", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  function boot(): { clerk: string; manager: string } {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    return {
      clerk: seedTestPilotActor(app.authService, { role: "CLERK" }).sessionCookie,
      manager: seedTestPilotActor(app.authService, { role: "MANAGER" }).sessionCookie,
    };
  }

  async function openDossier(cookie: string): Promise<{ id: string; version: number }> {
    const res = await app!.handler(new Request("http://127.0.0.1/api/dossiers", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ dossierCode: "DOS-RACE-1", containerNumber: "MSKU1234565", sealNumber: "SEAL-RACE", targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 12.0, declaredNetWeightKg: 19000, declaredBoxCount: 950 }),
    }));
    expect(res.status).toBe(201);
    const body = ((await res.json()) as { data: { id: string; version: number } }).data;
    return { id: body.id, version: body.version };
  }

  async function upload(id: string, cookie: string, name: string, version: number): Promise<Response> {
    return app!.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/documents`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ fileName: name, documentType: "PACKING_LIST", version, base64Content: syntheticPdf(name) }),
    })) as Promise<Response>;
  }

  it("refuses a second upload built from a version the first upload superseded", async () => {
    const { clerk } = boot();
    const { id, version } = await openDossier(clerk);

    const first = await upload(id, clerk, "OperatorA.pdf", version);
    expect(first.status).toBe(201);

    const second = await upload(id, clerk, "OperatorB.pdf", version);
    expect(second.status).toBe(409);
  });

  it("accepts the version the response returns, so a reload-then-write succeeds", async () => {
    const { clerk } = boot();
    const { id, version } = await openDossier(clerk);

    const first = await upload(id, clerk, "OperatorA.pdf", version);
    expect(first.status).toBe(201);
    const afterFirst = ((await first.json()) as { data: { version: number } }).data.version;
    expect(afterFirst).toBe(version + 1);

    const second = await upload(id, clerk, "OperatorB.pdf", afterFirst);
    expect(second.status).toBe(201);
  });

  /**
   * Validation writes, so it bumps the version. An operator still holding the
   * pre-validation snapshot tries to approve: the write is refused as stale, because
   * acting on it would discard the validated state the dossier now holds.
   */
  it("refuses an approval built from a version a concurrent validation superseded", async () => {
    const { clerk, manager } = boot();
    const { id, version } = await openDossier(clerk);
    const ready = await completeDossierDocuments(app!.handler, id, clerk, version, RACE_IDENTIFIERS);

    const validate = await app!.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/validate`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: clerk }, body: JSON.stringify({ version: ready }),
    })) as Response;
    expect(validate.status).toBe(200);

    const approving = await app!.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: manager }, body: JSON.stringify({ version: ready }),
    })) as Response;
    expect(approving.status).toBe(409);
    expect(((await approving.json()) as { errorCode: string }).errorCode).toBe("STALE_DOSSIER_VERSION");
  });
});
