import { expect } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { SqliteAuthService } from "../../src/auth/sqlite-auth-service.js";
import { SqliteClient } from "../../src/storage/sqlite-client.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
export interface ProcessRestartHarnessContext {
  readonly dbPath: string; readonly dataDir: string; readonly baseUrl: string;
  startServerProcess: () => Promise<ReturnType<typeof Bun.spawn>>;
  terminateProcess: (proc: ReturnType<typeof Bun.spawn>) => Promise<void>;
  setRunningProc: (proc: ReturnType<typeof Bun.spawn> | null) => void;
}
export async function runEndToEndProcessRestartScenario(ctx: ProcessRestartHarnessContext): Promise<void> {
  const { dbPath, dataDir, baseUrl, startServerProcess, terminateProcess, setRunningProc } = ctx;
  let runningProc: ReturnType<typeof Bun.spawn> | null = null;
  try {
    const seedClient = new SqliteClient({ dbPath });
    const clerkActor = seedTestPilotActor(new SqliteAuthService(seedClient), { role: "CLERK", tenantId: "TENANT-LOCAL-001" });
    seedClient.close();
    const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${clerkActor.sessionToken}` };
    runningProc = await startServerProcess();
    const pid1 = runningProc.pid;
    expect(pid1).toBeGreaterThan(0);
    const createRes = await fetch(`${baseUrl}/api/dossiers`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({
        dossierCode: "DOS-RESTART-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-RST-999",
        borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 13.5, declaredNetWeightKg: 18400, declaredBoxCount: 920,
      }),
    });
    expect(createRes.status).toBe(201);
    const dossierId = ((await createRes.json()) as { success: boolean; data: { id: string } }).data.id;
    expect(dossierId).toBeDefined();
    const uploadRes = await fetch(`${baseUrl}/api/dossiers/${dossierId}/documents`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({
        fileName: "PackingList_RestartTest.pdf", documentType: "PACKING_LIST",
        base64Content: Buffer.from("%PDF-1.5 Synthetic Packing List for Process Restart Test").toString("base64"),
        fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-RST-999" } },
      }),
    });
    expect(uploadRes.status).toBe(201);
    const { documentId, sha256Hash: originalDocSha } = ((await uploadRes.json()) as { success: boolean; data: { documentId: string; sha256Hash: string } }).data;
    expect(documentId && originalDocSha).toBeTruthy();
    const getRes1 = await fetch(`${baseUrl}/api/dossiers/${dossierId}`, { headers: authHeaders });
    const dossier1 = (await getRes1.json()) as {
      data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; fieldKey: string; rawValue: string }> }> };
    };
    const targetDoc = dossier1.data.documents.find((d) => d.id === documentId);
    const targetField = targetDoc?.extractedFields.find((f) => f.fieldKey === "container_number");
    expect(targetDoc && targetField).toBeTruthy();
    const fieldId = targetField!.id;
    const verifyRes = await fetch(
      `${baseUrl}/api/dossiers/${dossierId}/documents/${documentId}/fields/${fieldId}/verify`,
      { method: "POST", headers: authHeaders, body: JSON.stringify({ confirmedValue: "MSKU1234565" }) }
    );
    expect(verifyRes.status).toBe(200);
    const auditRes1 = await fetch(`${baseUrl}/api/dossiers/${dossierId}/audit`, { headers: authHeaders });
    const auditData1 = (await auditRes1.json()) as { success: boolean; data: { count: number; isChainValid: boolean; events: Array<{ eventType: string }> } };
    expect(auditData1.success && auditData1.data.events.length >= 3).toBe(true);
    expect(existsSync(dbPath) && existsSync(dataDir) && readdirSync(dataDir).length > 0).toBe(true);
    await terminateProcess(runningProc);
    runningProc = null;
    let serverIsDown = false;
    try { await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(500) }); } catch { serverIsDown = true; }
    expect(serverIsDown).toBe(true);
    runningProc = await startServerProcess();
    const pid2 = runningProc.pid;
    expect(pid2 > 0 && pid2 !== pid1).toBe(true);
    const getRes2 = await fetch(`${baseUrl}/api/dossiers/${dossierId}`, { headers: authHeaders });
    expect(getRes2.status).toBe(200);
    const dossier2 = (await getRes2.json()) as {
      success: boolean;
      data: {
        id: string; dossierCode: string; containerNumber: string; sealNumber: string; lifecycleState: string;
        documents: Array<{
          id: string; sha256Hash: string;
          extractedFields: Array<{ id: string; fieldKey: string; confirmedValue: string; verificationStatus: string }>;
        }>;
      };
    };
    expect(dossier2.success && dossier2.data.id === dossierId && dossier2.data.dossierCode === "DOS-RESTART-001").toBe(true);
    expect(dossier2.data.containerNumber === "MSKU1234565" && dossier2.data.sealNumber === "SEAL-RST-999").toBe(true);
    const reloadedDoc = dossier2.data.documents.find((d) => d.id === documentId);
    expect(reloadedDoc?.sha256Hash).toBe(originalDocSha);
    const reloadedField = reloadedDoc?.extractedFields.find((f) => f.id === fieldId);
    expect(reloadedField?.confirmedValue === "MSKU1234565" && reloadedField?.verificationStatus === "HUMAN_VERIFIED").toBe(true);
    const auditRes2 = await fetch(`${baseUrl}/api/dossiers/${dossierId}/audit`, { headers: authHeaders });
    expect(auditRes2.status).toBe(200);
    const auditData2 = (await auditRes2.json()) as { success: boolean; data: { count: number; isChainValid: boolean; events: Array<{ id: string }> } };
    expect(auditData2.success && auditData2.data.isChainValid && auditData2.data.events.length === auditData1.data.events.length).toBe(true);
    await terminateProcess(runningProc);
    runningProc = null;
  } finally {
    setRunningProc(runningProc);
  }
}
