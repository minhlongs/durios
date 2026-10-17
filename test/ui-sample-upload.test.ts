import { describe, expect, it, afterEach } from "bun:test";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createWorkspaceApp } from "../src/server/server.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

/**
 * Regression test for the browser "upload sample document" buttons.
 * Previously all three buttons sent no file content, so the server hashed the same
 * fallback bytes and duplicate detection collapsed them into a single Packing List.
 * This replays the exact payloads defined in index.html (SAMPLE_DOCUMENTS).
 */
const TEST_DB = "./data/test-ui-sample-upload.db";
const TEST_UPLOADS = "./data/test-ui-sample-uploads";

interface SampleDocument { type: string; fileName: string; content: string }
interface ExtractedFieldView { id: string; fieldKey: string; rawValue: string; confirmedValue?: string }
interface DocumentView { id: string; documentId?: string; documentType: string; sha256Hash: string; isSuperseded: boolean; extractedFields: ExtractedFieldView[] }
interface DossierView { id: string; containerNumber: string; sealNumber: string; documents: DocumentView[] }
interface ValidationResultView { status: string; findings: Array<{ messageVi: string; ruleName: string }> }
interface ExportManifestView { compositeManifestSha256: string; documents: unknown[] }

function readSampleDocuments(): SampleDocument[] {
  const html = readFileSync(join(process.cwd(), "src/server/public/index.html"), "utf-8");
  const match = html.match(/\/\* SAMPLE_DOCUMENTS_START \*\/([\s\S]*?)\/\* SAMPLE_DOCUMENTS_END \*\//);
  if (!match?.[1]) throw new Error("SAMPLE_DOCUMENTS markers not found in index.html");
  return JSON.parse(match[1]) as SampleDocument[];
}

describe("UI sample document upload flow", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;
  let roleTokens: Record<"CLERK" | "MANAGER", string> = { CLERK: "", MANAGER: "" };

  afterEach(() => {
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  function initAppWithTokens() {
    app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    roleTokens = {
      CLERK: seedTestPilotActor(app.authService, { role: "CLERK" }).sessionToken,
      MANAGER: seedTestPilotActor(app.authService, { role: "MANAGER" }).sessionToken,
    };
  }

  async function call<T = Record<string, unknown>>(
    path: string,
    role: "CLERK" | "MANAGER",
    init: { method?: string; body?: unknown } = {}
  ): Promise<{ success: boolean; data: T; error?: string }> {
    const res = await app!.handler(new Request(`http://127.0.0.1${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${roleTokens[role]}`, "Content-Type": "application/json" },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    }));
    return (await res.json()) as { success: boolean; data: T; error?: string };
  }

  it("creates three distinct documents and reaches EXPORTED through the UI payloads", async () => {
    initAppWithTokens();
    const samples = readSampleDocuments();
    expect(samples.map((s) => s.type)).toEqual(["PACKING_LIST", "LAB_TEST_REPORT", "PHYTOSANITARY_CERTIFICATE"]);

    const created = await call<DossierView>("/api/dossiers", "CLERK", {
      method: "POST",
      body: {
        dossierCode: "DOS-UI-TEST-001", containerNumber: "MSKU1234565", sealNumber: "VN-SEAL-8899",
        borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 14, declaredNetWeightKg: 18240, declaredBoxCount: 960,
      },
    });
    expect(created.success).toBe(true);
    const id = created.data.id;

    const hashes = new Set<string>();
    for (const s of samples) {
      const up = await call<DocumentView>(`/api/dossiers/${id}/documents`, "CLERK", {
        method: "POST",
        body: { documentType: s.type, fileName: s.fileName, base64Content: Buffer.from(s.content).toString("base64") },
      });
      expect(up.success).toBe(true);
      expect(up.data.documentType).toBe(s.type);
      hashes.add(up.data.sha256Hash);
    }
    expect(hashes.size).toBe(3);

    let dossier = (await call<DossierView>(`/api/dossiers/${id}`, "CLERK")).data;
    const active = dossier.documents.filter((d) => !d.isSuperseded);
    expect(active).toHaveLength(3);
    const fieldCount = active.reduce((n, d) => n + d.extractedFields.length, 0);
    expect(fieldCount).toBe(10);

    for (const doc of active) {
      for (const f of doc.extractedFields) {
        const r = await call(`/api/dossiers/${id}/documents/${doc.id}/fields/${f.id}/verify`, "CLERK", {
          method: "POST", body: { confirmedValue: f.rawValue },
        });
        expect(r.success).toBe(true);
      }
    }
    const blocked = await call<ValidationResultView>(`/api/dossiers/${id}/validate`, "CLERK", { method: "POST" });
    expect(blocked.data.status).toBe("BLOCKED");
    for (const finding of blocked.data.findings) {
      expect(typeof finding.messageVi).toBe("string");
      expect(typeof finding.ruleName).toBe("string");
    }

    dossier = (await call<DossierView>(`/api/dossiers/${id}`, "CLERK")).data;
    for (const doc of dossier.documents.filter((d) => !d.isSuperseded)) {
      for (const f of doc.extractedFields) {
        const value = f.fieldKey === "container_number" ? dossier.containerNumber
          : f.fieldKey === "seal_number" ? dossier.sealNumber : f.confirmedValue;
        await call(`/api/dossiers/${id}/documents/${doc.id}/fields/${f.id}/verify`, "CLERK", {
          method: "POST", body: { confirmedValue: value },
        });
      }
    }
    const passed = await call<ValidationResultView>(`/api/dossiers/${id}/validate`, "CLERK", { method: "POST" });
    expect(passed.data.status).toBe("PASSED");

    const clerkApprove = await call(`/api/dossiers/${id}/approve`, "CLERK", { method: "POST" });
    expect(clerkApprove.success).toBe(false);
    const managerApprove = await call(`/api/dossiers/${id}/approve`, "MANAGER", { method: "POST" });
    expect(managerApprove.success).toBe(true);

    const exported = await call<ExportManifestView>(`/api/dossiers/${id}/export`, "MANAGER", { method: "POST" });
    expect(exported.success).toBe(true);
    expect(exported.data.compositeManifestSha256).toMatch(/^[a-f0-9]{64}$/);

    const manifest = await call<ExportManifestView>(`/api/dossiers/${id}/manifest`, "CLERK");
    expect(manifest.success).toBe(true);
    expect(manifest.data.documents).toHaveLength(3);
  });

  it("re-uploading the same sample is detected as a duplicate, not a new document", async () => {
    initAppWithTokens();
    const [lab] = readSampleDocuments().filter((s) => s.type === "LAB_TEST_REPORT");
    const created = await call<DossierView>("/api/dossiers", "CLERK", {
      method: "POST", body: { dossierCode: "DOS-UI-DUP", containerNumber: "MSKU1234565", sealNumber: "S-1" },
    });
    const id = created.data.id;
    const body = { documentType: lab!.type, fileName: lab!.fileName, base64Content: Buffer.from(lab!.content).toString("base64") };
    const first = await call<DocumentView>(`/api/dossiers/${id}/documents`, "CLERK", { method: "POST", body });
    const second = await call<DocumentView>(`/api/dossiers/${id}/documents`, "CLERK", { method: "POST", body });
    expect(second.data.documentId).toBe(first.data.documentId);
  });
});
