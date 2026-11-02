import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { seedOperationalGateSite } from "./helpers/operational-cohort-fixture.js";
import { summarizeGateReport, formatGateCounts } from "../src/auth/pilot-gate-summary.js";
import { createOperatorEvidence, OTP_CONFIGURED_ENV, GATE_EVIDENCE_PENDING_LABEL } from "./helpers/gate-operator-evidence.js";

const ROOT = "./data/test-gate-split";
const DB = `${ROOT}/durios.db`;
const UPLOADS = `${ROOT}/uploads`;
const BACKUP = `${ROOT}/backup-01`;
const CONSENT = `${ROOT}/signed-consent-gate01.md`;

/** An OPERATIONAL cohort where every machine check can pass: consent file, backup, 5 containers. */
function allMachineChecksGreen(): void {
  seedOperationalGateSite({ dbPath: DB, dataDir: UPLOADS, backupDir: BACKUP, consentFilePath: CONSENT });
}

describe("Machine checks and launch gates are reported as two different things", () => {
  afterEach(() => {
    if (existsSync(ROOT)) rmSync(ROOT, { recursive: true, force: true });
  });

  it("keeps goForLiveCustomerData false when all 5 machine checks pass but nobody recorded evidence", () => {
    allMachineChecksGreen();
    const report = verifySingleSiteLaunchGates({
      dbPath: DB, dataDir: UPLOADS, backupDir: BACKUP, consentSignedFilePath: CONSENT, env: { ...OTP_CONFIGURED_ENV },
    });

    expect(report.machineChecksPassedCount).toBe(5);
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.gates.every((g) => g.gateVerdict === "MACHINE_CHECK_ONLY")).toBe(true);
    expect(report.gates.every((g) => g.statusLabel === GATE_EVIDENCE_PENDING_LABEL)).toBe(true);
    // Every gate still names the human artifact it is waiting for.
    expect(report.gates[4].externalEvidence.required.join(" ")).toContain("bấm giờ");
  });

  it("ignores an evidence file nobody signed for, and accepts it once a recorder is named", () => {
    allMachineChecksGreen();
    const base = { dbPath: DB, dataDir: UPLOADS, backupDir: BACKUP, consentSignedFilePath: CONSENT };

    const anonymous = verifySingleSiteLaunchGates({ ...base, env: { ...OTP_CONFIGURED_ENV, DURIOS_GATE03_EVIDENCE_FILE: CONSENT } });
    expect(anonymous.gates[2].externalEvidence.status).toBe("PENDING_OPERATOR_EVIDENCE");
    expect(anonymous.gates[2].externalEvidence.attestedBy).toBeUndefined();
    expect(anonymous.operationalGatesEvidencedCount).toBe(0);

    const named = verifySingleSiteLaunchGates({
      ...base, env: { ...OTP_CONFIGURED_ENV, DURIOS_GATE03_EVIDENCE_FILE: CONSENT, DURIOS_GATE_EVIDENCE_ATTESTED_BY: "Người vận hành Mini PC" },
    });
    expect(named.gates[2].externalEvidence.status).toBe("RECORDED_BY_OPERATOR");
    expect(named.gates[2].externalEvidence.attestedBy).toBe("Người vận hành Mini PC");
    expect(named.gates[2].gateVerdict).toBe("EVIDENCED_FOR_LAUNCH");
    expect(named.operationalGatesEvidencedCount).toBe(1);
    expect(named.goForLiveCustomerData).toBe(false);
  });

  it("never lets rehearsal evidence open a gate, however green the checks are", () => {
    allMachineChecksGreen();
    const rehearsal = verifySingleSiteLaunchGates({
      dbPath: DB, dataDir: UPLOADS, backupDir: BACKUP, consentSignedFilePath: CONSENT,
      gateEvidence: createOperatorEvidence(`${ROOT}/evidence-artifacts`), env: { ...OTP_CONFIGURED_ENV }, rehearsalMode: true,
    });
    expect(rehearsal.machineChecksPassedCount).toBe(5);
    expect(rehearsal.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(rehearsal.gates.every((g) => g.statusLabel === "PASS_SYNTHETIC_REHEARSAL")).toBe(true);
    expect(rehearsal.goForLiveCustomerData).toBe(false);
  });

  it("prints the two counts separately in the operator summary", () => {
    allMachineChecksGreen();
    const report = verifySingleSiteLaunchGates({
      dbPath: DB, dataDir: UPLOADS, backupDir: BACKUP, consentSignedFilePath: CONSENT, env: { ...OTP_CONFIGURED_ENV },
    });
    expect(formatGateCounts(2, 0, 5)).toContain("KIỂM TRA TỰ ĐỘNG (máy chấm được): 2/5");
    expect(formatGateCounts(2, 0, 5)).toContain("LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): 0/5");
    const summary = summarizeGateReport(report);
    expect(summary).toContain("KIỂM TRA TỰ ĐỘNG (máy chấm được): 5/5");
    expect(summary).toContain("LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): 0/5");
    expect(summary).toContain("CHỈ MÁY ĐẠT — thiếu bằng chứng vận hành");
    expect(summary).toContain("goForLiveCustomerData: false");
    expect(summary).not.toContain("goForLiveCustomerData: true");
  });
});
