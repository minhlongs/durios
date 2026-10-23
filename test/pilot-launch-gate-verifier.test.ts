import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { calculateSha256 } from "../src/ingestion/document-hasher.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";
import { createSiteBackup } from "../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../src/server/server.js";

const TEST_ROOT = "./data/test-launch-gates";
const TEST_DB = `${TEST_ROOT}/durios.db`;
const TEST_UPLOADS = `${TEST_ROOT}/uploads`;
const TEST_BACKUP = `${TEST_ROOT}/backup-01`;
const TEST_CONSENT = `${TEST_ROOT}/signed-consent-gate01.md`;

describe("Single-Site Launch Gate Verifier (GATE-01..GATE-05)", () => {
  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  it("fails closed (goForLiveCustomerData: false) when GATE-01 consent or GATE-02 OTP credentials are missing", () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    seedGate05PilotRehearsal({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    createSiteBackup(TEST_DB, TEST_UPLOADS, TEST_BACKUP);

    const report = verifySingleSiteLaunchGates({
      dbPath: TEST_DB,
      dataDir: TEST_UPLOADS,
      backupDir: TEST_BACKUP,
      env: { DURIOS_HOST: "127.0.0.1" },
    });

    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.passedCount).toBe(3); // GATE-03, GATE-04, GATE-05 pass; GATE-01 and GATE-02 pending
    expect(report.gates[0].gateId).toBe("GATE-01");
    expect(report.gates[0].passed).toBe(false);
    expect(report.gates[1].gateId).toBe("GATE-02");
    expect(report.gates[1].passed).toBe(false);
    expect(report.gates[2].passed).toBe(true);
    expect(report.gates[3].passed).toBe(true);
    expect(report.gates[4].passed).toBe(true);
  });

  it("reports goForLiveCustomerData: true only when all 5 blocking gates (GATE-01..GATE-05) pass", async () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const seeded = seedGate05PilotRehearsal({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    createSiteBackup(TEST_DB, TEST_UPLOADS, TEST_BACKUP);
    writeFileSync(TEST_CONSENT, "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)\n", "utf-8");

    const report = verifySingleSiteLaunchGates({
      dbPath: TEST_DB,
      dataDir: TEST_UPLOADS,
      backupDir: TEST_BACKUP,
      consentSignedFilePath: TEST_CONSENT,
      consentVerified: true,
      consentVerifiedByName: "Field Auditor",
      consentAttestedSha256: calculateSha256(readFileSync(TEST_CONSENT)),
      env: {
        DURIOS_HOST: "127.0.0.1",
        DURIOS_OTP_PROVIDER: "ESMS",
        DURIOS_OTP_API_URL: "https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/",
        DURIOS_OTP_API_KEY: "LIVE_KEY_01",
        DURIOS_OTP_SECRET_KEY: "LIVE_SECRET_01",
        DURIOS_OTP_ZALO_OA_ID: "OA-CAILAY-01",
        DURIOS_OTP_ZALO_TEMPLATE_ID: "TPL-OTP-01",
        DURIOS_OTP_SMS_BRANDNAME: "DURIOS",
      },
    });

    expect(report.passedCount).toBe(5);
    expect(report.goForLiveCustomerData).toBe(true);
    for (const gate of report.gates) {
      expect(gate.passed).toBe(true);
      expect(gate.statusLabel).toBe("PASS");
    }


    const app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    try {
      const gatesRes = await app.handler(
        new Request("http://127.0.0.1/api/v1/pilot/gates", {
          method: "GET",
          headers: { "x-pilot-token": seeded.managerPilotToken },
        })
      );
      expect(gatesRes.status).toBe(200);
      const body = (await gatesRes.json()) as {
        success: boolean;
        data: { totalGates: number; gates: ReadonlyArray<{ gateId: string }> };
      };
      expect(body.success).toBe(true);
      expect(body.data.totalGates).toBe(5);
      expect(body.data.gates.length).toBe(5);
    } finally {
      app.sqliteClient.close();
    }
  });
});
