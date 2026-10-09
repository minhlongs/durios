import { describe, expect, it, afterEach } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { createWorkspaceApp } from "../src/server/server.js";

const TEST_DB = "./data/test-http-api.db";
const TEST_UPLOADS = "./data/test-http-uploads";

describe("Phase B & C: Local HTTP API Integration", () => {
  let appInstance: ReturnType<typeof createWorkspaceApp> | null = null;

  afterEach(() => {
    if (appInstance) {
      appInstance.sqliteClient.close();
      appInstance = null;
    }
    if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
    if (existsSync(`${TEST_DB}-wal`)) rmSync(`${TEST_DB}-wal`, { force: true });
    if (existsSync(`${TEST_DB}-shm`)) rmSync(`${TEST_DB}-shm`, { force: true });
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  function getApp() {
    appInstance = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    return appInstance.handler;
  }

  it("serves health status and index html", async () => {
    const handle = getApp();
    const healthRes = await handle(new Request("http://127.0.0.1/api/health"));
    expect(healthRes.status).toBe(200);
    const healthData = (await healthRes.json()) as { status: string };
    expect(healthData.status).toBe("healthy");

    const htmlRes = await handle(new Request("http://127.0.0.1/"));
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
  });

  it("handles complete dossier lifecycle over HTTP", async () => {
    const handle = getApp();

    // 1. Create dossier
    const createReq = new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dossierCode: "DOS-HTTP-001",
        containerNumber: "MSKU1234565",
        sealNumber: "SEAL-HTTP-99",
        borderGate: "Huu Nghi",
        targetMarket: "CN",
        targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000,
        declaredBoxCount: 900,
      }),
    });
    const createRes = await handle(createReq);
    expect(createRes.status).toBe(201);
    const createBody = (await createRes.json()) as { success: boolean; data: { id: string } };
    expect(createBody.success).toBe(true);
    const dossierId = createBody.data.id;

    // 2. Upload all 3 mandatory documents with distinct file content and matching fields
    const docTypes = [
      {
        type: "PACKING_LIST",
        name: "PackingList.pdf",
        content: Buffer.from("%PDF-1.5 Packing List synthetic content").toString("base64"),
        fixtureFields: {
          container_number: { raw: "MSKU1234565" },
          seal_number: { raw: "SEAL-HTTP-99" },
          box_count: { raw: "900" },
          net_weight_kg: { raw: "18000" },
        },
      },
      {
        type: "LAB_TEST_REPORT",
        name: "LabTestReport.pdf",
        content: Buffer.from("%PDF-1.5 Lab Test Cadmium synthetic content").toString("base64"),
        fixtureFields: {
          cadmium_mg_kg: { raw: "0.028" },
          sample_code: { raw: "EF-2026-VN-9081" },
          sampling_date: { raw: "2026-10-06" },
        },
      },
      {
        type: "PHYTOSANITARY_CERTIFICATE",
        name: "PhytoCert.pdf",
        content: Buffer.from("%PDF-1.5 Phytosanitary Certificate synthetic content").toString("base64"),
        fixtureFields: {
          container_number: { raw: "MSKU1234565" },
          seal_number: { raw: "SEAL-HTTP-99" },
          phyto_cert_number: { raw: "KDTV-2026-VN-09928" },
        },
      },
    ];
    for (const d of docTypes) {
      const uploadReq = new Request(`http://127.0.0.1/api/dossiers/${dossierId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: d.name,
          documentType: d.type,
          base64Content: d.content,
          fixtureFields: d.fixtureFields,
        }),
      });
      const uploadRes = await handle(uploadReq);
      expect(uploadRes.status).toBe(201);
    }

    // 3. Verify fields for all documents
    const getRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}`));
    const dossierData = ((await getRes.json()) as { data: any }).data;
    expect(dossierData.documents.length).toBe(3);

    for (const doc of dossierData.documents) {
      for (const f of doc.extractedFields) {
        const verifyReq = new Request(
          `http://127.0.0.1/api/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmedValue: f.rawValue }),
          }
        );
        const verifyRes = await handle(verifyReq);
        expect(verifyRes.status).toBe(200);
      }
    }

    // 4. Run validation
    const valReq = new Request(`http://127.0.0.1/api/dossiers/${dossierId}/validate`, {
      method: "POST",
    });
    const valRes = await handle(valReq);
    expect(valRes.status).toBe(200);

    // 5. Test role authorization for approval
    const clerkApproveReq = new Request(`http://127.0.0.1/api/dossiers/${dossierId}/approve`, {
      method: "POST",
      headers: { "x-actor-role": "CLERK" },
    });
    const clerkApproveRes = await handle(clerkApproveReq);
    expect(clerkApproveRes.status).toBe(403);

    const mgrApproveReq = new Request(`http://127.0.0.1/api/dossiers/${dossierId}/approve`, {
      method: "POST",
      headers: { "x-actor-role": "MANAGER" },
    });
    const mgrApproveRes = await handle(mgrApproveReq);
    expect(mgrApproveRes.status).toBe(200);

    // 6. Export dossier
    const exportReq = new Request(`http://127.0.0.1/api/dossiers/${dossierId}/export`, {
      method: "POST",
    });
    const exportRes = await handle(exportReq);
    expect(exportRes.status).toBe(200);

    // 7. Verify audit trail and hash chain integrity
    const auditRes = await handle(new Request(`http://127.0.0.1/api/dossiers/${dossierId}/audit`));
    const auditData = ((await auditRes.json()) as { data: any }).data;
    expect(auditData.isChainValid).toBe(true);
    expect(auditData.count).toBeGreaterThan(3);
  });

  it("returns controlled errors for malformed input and unknown routes", async () => {
    const handle = getApp();

    const notFoundRes = await handle(new Request("http://127.0.0.1/api/unknown-endpoint"));
    expect(notFoundRes.status).toBe(404);

    const badJsonReq = new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });
    const badJsonRes = await handle(badJsonReq);
    expect(badJsonRes.status).toBe(400);

    const missingFieldsReq = new Request("http://127.0.0.1/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dossierCode: "ONLY_ONE" }),
    });
    const missingRes = await handle(missingFieldsReq);
    expect(missingRes.status).toBe(400);
  });
});
