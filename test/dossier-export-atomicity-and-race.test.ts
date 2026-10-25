import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import { completeDossierDocuments } from "./helpers/complete-dossier-documents.js";


const ATOMIC_IDENTIFIERS = { containerNumber: "MSKU1234565", sealNumber: "SEAL-ATOMIC" };
const TEST_DB = "./data/test-export-atomic.db";
const TEST_UPLOADS = "./data/test-export-atomic-uploads";

function removeIfPresent(path: string, recursive = false): void {
  if (!existsSync(path)) return;
  rmSync(path, { recursive, force: true });
}

function cleanUp(): void {
  for (const suffix of ["", "-wal", "-shm"]) removeIfPresent(`${TEST_DB}${suffix}`);
  removeIfPresent(TEST_UPLOADS, true);
}

describe("Export seal and its manifest", () => {
  afterEach(() => cleanUp());

  it("validates, approves and seals a clean dossier end to end over the real routes", async () => {
    const app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    try {
      const clerk = seedTestPilotActor(app.authService, { role: "CLERK" }).sessionCookie;
      const manager = seedTestPilotActor(app.authService, { role: "MANAGER" }).sessionCookie;
      const createRes = await app.handler(new Request("http://127.0.0.1/api/dossiers", {
        method: "POST", headers: { "Content-Type": "application/json", Cookie: clerk },
        body: JSON.stringify({ dossierCode: "DOS-ATOMIC", containerNumber: "MSKU1234565", sealNumber: "SEAL-ATOMIC", targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.0, declaredNetWeightKg: 18000, declaredBoxCount: 900 }),
      }));
      expect(createRes.status).toBe(201);
      const id = ((await createRes.json()) as { data: { id: string; version: number } }).data.id;
      let version = await completeDossierDocuments(app.handler, id, clerk, 1, ATOMIC_IDENTIFIERS);

      const validate = await app.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/validate`, {
        method: "POST", headers: { "Content-Type": "application/json", Cookie: clerk }, body: JSON.stringify({ version }),
      })) as Response;
      expect(validate.status).toBe(200);
      version = ((await validate.json()) as { data: { status: string; version: number } }).data.version;

      const approve = await app.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/approve`, {
        method: "POST", headers: { "Content-Type": "application/json", Cookie: manager }, body: JSON.stringify({ version }),
      })) as Response;
      expect(approve.status).toBe(200);
      version = ((await approve.json()) as { data: { version: number } }).data.version;

      const exported = await app.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/export`, {
        method: "POST", headers: { "Content-Type": "application/json", Cookie: manager }, body: JSON.stringify({ version }),
      })) as Response;
      expect(exported.status).toBe(200);
      const sealedHash = ((await exported.json()) as { data: { compositeManifestSha256: string } }).data.compositeManifestSha256;

      const manifest = await app.handler(new Request(`http://127.0.0.1/api/dossiers/${id}/manifest`, { headers: { Cookie: manager } })) as Response;
      expect(manifest.status).toBe(200);
      expect(((await manifest.json()) as { data: { compositeManifestSha256: string } }).data.compositeManifestSha256).toBe(sealedHash);
    } finally {
      app.sqliteClient.close();
    }
  });
});
