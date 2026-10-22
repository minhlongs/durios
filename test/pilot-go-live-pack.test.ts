import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compilePilotGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "../src/export/pilot-dossier-pack-compiler.js";
import { runFieldAuditorCli } from "../src/export/field-auditor-cli.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";
import { createSiteBackup } from "../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";
import type { AuthenticatedActor } from "../src/domain/types.js";
const AUDITOR: AuthenticatedActor = {
  id: "usr-auditor-pack-01", tenantId: "TENANT-CAILAY-PILOT-01", tenantType: "INSPECTION_AUDITOR",
  role: "AUDITOR", persona: "SYSTEM_AUDITOR", name: "Field Auditor Cai Lay",
};
describe("Direction 1: Single-Site Pilot Go-Live Dossier Pack & Field Auditor Tool", () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  it("compiles a sealed Go-Live Readiness Report with 5 checklist items and verifies SHA-256 integrity", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-golive-pack-"));
    tempDirs.push(rootDir);
    const [dbPath, dataDir, backupDir, consentFile] = [
      join(rootDir, "durios.db"), join(rootDir, "uploads"), join(rootDir, "backup"), join(rootDir, "consent-91-2025-signed.pdf"),
    ];
    writeFileSync(consentFile, "%PDF-1.5 Signed Consent 91/2025/QH15", "utf-8");
    seedGate05PilotRehearsal({ dbPath, dataDir });
    createSiteBackup(dbPath, dataDir, backupDir);
    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      const report = compilePilotGoLiveDossierPack(app.workspace, AUDITOR, {
        siteCode: "SITE-CAILAY-TIENGIANG-01", dbPath, dataDir, backupDir, consentSignedFilePath: consentFile,
        env: {
          DURIOS_OTP_PROVIDER: "ESMS_VN", DURIOS_OTP_API_URL: "https://otp.example.vn/send",
          DURIOS_OTP_API_KEY: "live-staging-key-001", DURIOS_HOST: "127.0.0.1",
        },
        forcedTimestamp: "2026-10-17T08:00:00.000Z",
      });
      // GATE-01 is closed by an auditor's confirmation of the signed paper original,
      // which a written fixture cannot produce. So this pack exercises the compiler and
      // integrity hash against a 4-of-5 gate run, and asserts that the pack reports the
      // withheld gate instead of pretending consent was verified.
      expect(report.goForLiveCustomerData).toBe(false);
      expect(report.overallVerdict).toBe("HOLD_BLOCKERS_REMAIN");
      expect(report.passedGateCount === 4 && report.fieldAuditorChecklist.length === 5).toBe(true);
      expect(report.fieldAuditorChecklist.filter((c) => c.linkedGateId === "GATE-01")[0]?.status).toBe("ACTION_REQUIRED");
      expect(verifyPilotGoLiveDossierPackIntegrity(report)).toBe(true);
      const tampered = { ...report, passedGateCount: 5 };
      expect(verifyPilotGoLiveDossierPackIntegrity(tampered)).toBe(false);
    } finally {
      app.sqliteClient.close();
    }
  });
  it("supports CLI --output-dir export and --verify cryptographic verification round-trip", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-auditor-cli-"));
    tempDirs.push(rootDir);
    const [dbPath, dataDir, outDir] = [join(rootDir, "durios.db"), join(rootDir, "uploads"), join(rootDir, "audit-out")];
    seedGate05PilotRehearsal({ dbPath, dataDir });
    const genResult = runFieldAuditorCli({ siteCode: "SITE-CAILAY-CLI", dbPath, dataDir, outputDir: outDir });
    expect(genResult.exitCode === 0 && genResult.integrityVerified && Boolean(genResult.outputFilePath)).toBe(true);
    const verifyResult = runFieldAuditorCli({ verifyFilePath: genResult.outputFilePath });
    expect(verifyResult.exitCode === 0 && verifyResult.integrityVerified).toBe(true);
    expect(verifyResult.report.reportSha256).toBe(genResult.report.reportSha256);
  });
  it("serves GET /api/v1/pilot/go-live-pack to AUDITOR/MANAGER and blocks CLERK with 403", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "durios-golive-http-"));
    tempDirs.push(rootDir);
    const app = createWorkspaceApp({ dbPath: join(rootDir, "durios.db"), dataDir: join(rootDir, "uploads") });
    try {
      const auditorCreds = seedTestPilotActor(app.authService, { role: "AUDITOR", persona: "SYSTEM_AUDITOR", tenantType: "INSPECTION_AUDITOR" });
      const clerkCreds = seedTestPilotActor(app.authService, { role: "CLERK", persona: "PACKHOUSE_CLERK", tenantType: "PACKHOUSE_EXPORTER" });
      const auditorRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/pilot/go-live-pack", { headers: { Authorization: `Bearer ${auditorCreds.sessionToken}` } })
      );
      expect(auditorRes.status).toBe(200);
      const body = (await auditorRes.json()) as {
        success: boolean; data: { reportSha256: string; fieldAuditorChecklist: unknown[] };
      };
      expect(body.success && body.data.reportSha256.length === 64 && body.data.fieldAuditorChecklist.length === 5).toBe(true);
      const clerkRes = await routeHttpRequest(
        app.workspace,
        new Request("http://127.0.0.1:3000/api/v1/pilot/go-live-pack", { headers: { Authorization: `Bearer ${clerkCreds.sessionToken}` } })
      );
      expect(clerkRes.status).toBe(403);
    } finally {
      app.sqliteClient.close();
    }
  });
});