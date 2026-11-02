import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { createOperatorEvidence, createValidFounderAuth, OTP_CONFIGURED_ENV, GATE_EVIDENCE_PENDING_LABEL } from "./helpers/gate-operator-evidence.js";
import { seedOperationalGateSite } from "./helpers/operational-cohort-fixture.js";

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
    seedOperationalGateSite({ dbPath: TEST_DB, dataDir: TEST_UPLOADS, backupDir: TEST_BACKUP, consentFilePath: TEST_CONSENT });

    const report = verifySingleSiteLaunchGates({
      dbPath: TEST_DB, dataDir: TEST_UPLOADS, backupDir: TEST_BACKUP, env: { DURIOS_HOST: "127.0.0.1" },
    });

    expect(report.evidenceProvenance).toBe("OPERATIONAL");
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.passedCount).toBe(3); // GATE-03, GATE-04, GATE-05 pass; GATE-01 and GATE-02 pending
    // "3/5" answers the machine question only. No launch gate is cleared without operator evidence,
    // so the two counts are reported separately and never collapsed into one number.
    expect(report.machineChecksPassedCount).toBe(3);
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.gates[0].gateId).toBe("GATE-01");
    expect(report.gates[0].passed).toBe(false);
    expect(report.gates[0].gateVerdict).toBe("PENDING");
    expect(report.gates[1].gateId).toBe("GATE-02");
    expect(report.gates[1].passed).toBe(false);
    expect(report.gates[2].passed).toBe(true);
    expect(report.gates[2].gateVerdict).toBe("MACHINE_CHECK_ONLY");
    expect(report.gates[2].statusLabel).toBe(GATE_EVIDENCE_PENDING_LABEL);
    expect(report.gates[2].externalEvidence.status).toBe("PENDING_OPERATOR_EVIDENCE");
    expect(report.gates[2].externalEvidence.required.length).toBeGreaterThan(0);
    expect(report.gates[3].passed).toBe(true);
    expect(report.gates[4].passed).toBe(true);
  });

  it("reports goForLiveCustomerData: true only when all 5 gates hold machine checks AND recorded operator evidence", async () => {
    const cohort = seedOperationalGateSite({ dbPath: TEST_DB, dataDir: TEST_UPLOADS, backupDir: TEST_BACKUP, consentFilePath: TEST_CONSENT });
    // Written after the site is seeded: afterEach removes TEST_ROOT, so evidence artifacts must
    // exist at the moment of the run — which is exactly what the verifier now requires.
    const testEvidence = createOperatorEvidence(`${TEST_ROOT}/evidence-artifacts`);

    const report = verifySingleSiteLaunchGates({
      dbPath: TEST_DB, dataDir: TEST_UPLOADS, backupDir: TEST_BACKUP,
      consentSignedFilePath: TEST_CONSENT, gateEvidence: testEvidence, founderAuthorization: createValidFounderAuth(testEvidence["GATE-05"]!.filePath!), env: { ...OTP_CONFIGURED_ENV },
    });

    expect(report.passedCount).toBe(5);
    expect(report.machineChecksPassedCount).toBe(5);
    expect(report.operationalGatesEvidencedCount).toBe(5);
    expect(report.evidenceProvenance).toBe("OPERATIONAL");
    expect(report.goForLiveCustomerData).toBe(true);
    for (const gate of report.gates) {
      expect(gate.passed).toBe(true);
      expect(gate.gateVerdict).toBe("EVIDENCED_FOR_LAUNCH");
      expect(gate.externalEvidence.status).toBe("RECORDED_BY_OPERATOR");
      expect(gate.externalEvidence.attestedBy?.length).toBeGreaterThan(0);
      expect(gate.statusLabel).toBe("PASS");
    }

    const app = createWorkspaceApp({ dbPath: TEST_DB, dataDir: TEST_UPLOADS });
    try {
      const gatesRes = await app.handler(
        new Request("http://127.0.0.1/api/v1/pilot/gates", { method: "GET", headers: { "x-pilot-token": cohort.managedToken } })
      );
      expect(gatesRes.status).toBe(200);
      const body = (await gatesRes.json()) as {
        success: boolean;
        data: { totalGates: number; machineChecksPassedCount: number; operationalGatesEvidencedCount: number; gates: ReadonlyArray<{ gateId: string }> };
      };
      expect(body.success).toBe(true);
      expect(body.data.totalGates).toBe(5);
      expect(body.data.gates.length).toBe(5);
      // The HTTP surface carries both counts, so a UI cannot show one number for two concepts.
      // This request goes through the server's own environment (no consent file, no backup dir,
      // no operator evidence), so it can never report more than the machine checks allow.
      expect(typeof body.data.machineChecksPassedCount).toBe("number");
      expect(typeof body.data.operationalGatesEvidencedCount).toBe("number");
      expect(body.data.operationalGatesEvidencedCount).toBeLessThanOrEqual(body.data.machineChecksPassedCount);
      expect(body.data.operationalGatesEvidencedCount).toBe(0);
    } finally {
      app.sqliteClient.close();
    }
  });
});
