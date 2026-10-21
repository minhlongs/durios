import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { evaluateGate05PilotKpi } from "../src/auth/pilot-kpi-evaluator.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";
import { createWorkspaceApp } from "../src/server/server.js";
const TEST_DB = "./data/test-rehearsal-seeder.db";
const TEST_UPLOADS = "./data/test-rehearsal-uploads";
interface CompanyBlueprintJson {
  readonly name: string;
  readonly stage: string;
readonly next_steps?: readonly string[]; }
describe("GATE-05 Pilot Rehearsal Seeder, KPI Evaluator & Company Blueprint", () => {
  afterEach(() => {
    for (const suffix of ["", "-wal", "-shm"]) {
if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true }); }
if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true }); });
  it("validates .mekong/company.json 25-step zero-stage blueprint and blueprint docs", () => {
    const companyPath = join(process.cwd(), ".mekong/company.json");
    expect(existsSync(companyPath)).toBe(true);
    const parsed = JSON.parse(readFileSync(companyPath, "utf-8")) as CompanyBlueprintJson;
    expect(parsed.name).toBe("DuriOS");
    expect(parsed.stage).toBe("zero");
    expect((parsed.next_steps ?? []).length).toBe(5);
    const planText = readFileSync(join(process.cwd(), "plans/company-blueprint/plan.md"), "utf-8");
    const stepHeaders = planText.match(/^## \d+\./gm) ?? [];
    expect(stepHeaders.length).toBe(25);
    const tasksText = readFileSync(join(process.cwd(), "plans/company-blueprint/tasks.md"), "utf-8");
    expect(planText).toContain("91/2025/QH15");
    expect(planText).toContain("122/2025/QH15");
    expect(tasksText).toContain("GATE-01");
expect(tasksText).toContain("GATE-05"); });
  it("provisions Cai Lay CLERK/MANAGER accounts, 5 rehearsal dossiers with 2 blind faults, and passes GATE-05 KPI evaluation", async () => {
    const seeded = seedGate05PilotRehearsal({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    expect(seeded.tenantId).toBe("TENANT-CAILAY-PILOT-01");
    expect(seeded.clerkUsername).toBe("clerk.cailay");
    expect(seeded.managerUsername).toBe("manager.cailay");
    expect(seeded.dossiers.length).toBe(5);
    const r01 = seeded.dossiers.find((d) => d.dossierCode === "DOS-CAILAY-R01")!;
    const r04 = seeded.dossiers.find((d) => d.dossierCode === "DOS-CAILAY-R04")!;
    const r05 = seeded.dossiers.find((d) => d.dossierCode === "DOS-CAILAY-R05")!;
    expect(r01.scenario).toBe("CLEAN_READY");
    expect(r01.lifecycleState).toBe("READY_FOR_REVIEW");
    expect(r04.scenario).toBe("BLIND_FAULT_SEAL_MISMATCH");
    expect(r04.lifecycleState).toBe("VALIDATION_BLOCKED");
    expect(r05.scenario).toBe("BLIND_FAULT_UNVERIFIED_EVIDENCE");
    expect(r05.lifecycleState).toBe("HUMAN_VERIFICATION_REQUIRED");
    const kpiReport = evaluateGate05PilotKpi({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    expect(kpiReport.totalContainers).toBe(5);
    expect(kpiReport.underFiveMinuteGate).toBe(true);
    expect(kpiReport.blindFaultCount).toBe(2);
    expect(kpiReport.blindFaultsCaught).toBe(2);
    expect(kpiReport.zeroMissGate).toBe(true);
    expect(kpiReport.gate05Passed).toBe(true);
    const app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    try {
      const kpiHttpRes = await app.handler(
        new Request("http://127.0.0.1/api/v1/pilot/kpi", {
method: "GET", headers: { "x-pilot-token": seeded.managerPilotToken },
}) );
      expect(kpiHttpRes.status).toBe(200);
      const kpiBody = (await kpiHttpRes.json()) as {
        success: boolean;
data: { gate05Passed: boolean; totalContainers: number; blindFaultsCaught: number }; };
      expect(kpiBody.success).toBe(true);
      expect(kpiBody.data.gate05Passed).toBe(true);
      expect(kpiBody.data.totalContainers).toBe(5);
      expect(kpiBody.data.blindFaultsCaught).toBe(2);
      const approveCleanRes = await app.handler(
        new Request(`http://127.0.0.1/api/v1/dossiers/${r01.id}/approve`, {
method: "POST", headers: { "x-pilot-token": seeded.managerPilotToken },
}) );
      expect(approveCleanRes.status).toBe(200);
      const approveSealFaultRes = await app.handler(
        new Request(`http://127.0.0.1/api/v1/dossiers/${r04.id}/approve`, {
method: "POST", headers: { "x-pilot-token": seeded.managerPilotToken },
}) );
      expect(approveSealFaultRes.status).toBe(400);
      const approveUnverifiedFaultRes = await app.handler(
        new Request(`http://127.0.0.1/api/v1/dossiers/${r05.id}/approve`, {
method: "POST", headers: { "x-pilot-token": seeded.managerPilotToken },
}) );
expect(approveUnverifiedFaultRes.status).toBe(400); } finally {
app.sqliteClient.close(); }
}); });
