import { afterEach, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { validateIso6346Container } from "../src/domain/iso-6346.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { compileStandaloneGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "../src/export/pilot-dossier-pack-compiler.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { buildGateSite, runRawSql, type GateSite } from "./helpers/gate-site-fixture.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

/**
 * Adversarial checks for launch-gate provenance (FINDINGS F-14, handover item 3): renaming rows,
 * mixing in one synthetic container under an innocent code, and deleting the audit rows that
 * record synthetic origin. Every site below already has all five machine checks green and five
 * evidence files declared by the test itself, so what is attacked is the provenance decision.
 */
const sites: GateSite[] = [];

function site(kind: "rehearsal" | "operational"): GateSite {
  const built = buildGateSite(kind);
  sites.push(built);
  return built;
}

describe("Adversarial: gates cannot be opened by renaming, mixing or erasing provenance", () => {
  afterEach(() => {
    for (const built of sites.splice(0)) rmSync(built.root, { recursive: true, force: true });
  });

  it("renaming rehearsal dossier codes to customer-looking codes opens nothing", () => {
    const target = site("rehearsal");
    runRawSql(target.dbPath, "UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-' || substr(id, -6)");
    const report = verifySingleSiteLaunchGates(target.options);
    expect(report.machineChecksPassedCount).toBe(5);
    expect(report.gates.every((g) => g.externalEvidence.status === "RECORDED_BY_OPERATOR")).toBe(true);
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.cohortProvenance?.synthetic).toBe(true);
    // The name-based signal is gone — the hash-chained ledger is what held.
    expect(report.cohortProvenance?.signals.every((s) => !s.startsWith("REHEARSAL_DOSSIER_CODE:"))).toBe(true);
    expect(report.cohortProvenance?.signals.some((s) => s.startsWith("REHEARSAL_DOSSIER_SEEDED:"))).toBe(true);
    expect(report.cohortProvenance?.signals.some((s) => s.startsWith("SYNTHETIC_DOCUMENT_INGESTED:"))).toBe(true);
    expect(report.gates.every((g) => g.gateVerdict === "MACHINE_CHECK_ONLY")).toBe(true);
  });

  it("mixing one synthetic container, with an arbitrary code, into an operational cohort closes the gates again", () => {
    const target = site("operational");
    const clean = verifySingleSiteLaunchGates(target.options);
    expect([clean.cohortProvenance?.synthetic, clean.machineChecksPassedCount, clean.operationalGatesEvidencedCount]).toEqual([false, 5, 5]);

    const app = createWorkspaceApp({ dbPath: target.dbPath, dataDir: target.dataDir });
    try {
      const provisioned = seedTestPilotActor(app.authService, { role: "CLERK", tenantId: "TENANT-CAILAY-PILOT-01", tenantType: "PACKHOUSE_EXPORTER" });
      const actor = app.authService.authenticateToken(provisioned.managedToken);
      const injected = app.workspace.createDossier({
        dossierCode: "DOS-TG-CUSTOMER-77", containerNumber: `TCLU123456${validateIso6346Container("TCLU1234560").expectedCheckDigit ?? 0}`,
        sealNumber: "VN-SEAL-INJ-77", targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14.0,
        declaredNetWeightKg: 18240, declaredBoxCount: 960,
      }, actor);
      // Fixture fields are only accepted in synthetic mode, and that ingest is written to the
      // ledger: the code looks like a customer dossier, the ledger says otherwise.
      app.workspace.uploadDocument(injected.id, new TextEncoder().encode("%PDF-1.5\n% injected synthetic\n%%EOF\n"),
        "PackingList-INJECTED.pdf", "PACKING_LIST", actor, { net_weight_kg: { raw: "18240" } });
    } finally {
      app.sqliteClient.close();
    }
    const mixed = verifySingleSiteLaunchGates(target.options);
    expect(mixed.kpiSummary.totalContainers).toBe(6);
    expect(mixed.cohortProvenance?.synthetic).toBe(true);
    expect(mixed.cohortProvenance?.signals.some((s) => s.startsWith("SYNTHETIC_DOCUMENT_INGESTED:"))).toBe(true);
    expect(mixed.operationalGatesEvidencedCount).toBe(0);
    expect(mixed.goForLiveCustomerData).toBe(false);
  });

  it("erasing the ledger rows that record synthetic origin makes provenance unprovable, not operational", () => {
    const target = site("rehearsal");
    // Renamed first, so the only remaining provenance signals are the ledger rows being deleted.
    runRawSql(target.dbPath, "UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-' || substr(id, -6)");
    runRawSql(target.dbPath, "DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')");
    const report = verifySingleSiteLaunchGates(target.options);
    expect(report.ledgerIntegrityVerified).toBe(false);
    expect(report.gates.find((g) => g.gateId === "GATE-03")?.machineCheck.passed).toBe(false);
    expect(report.machineChecksPassedCount).toBe(4);
    // An unverifiable ledger proves nothing about where the data came from, so it is reported as
    // unproven — never as OPERATIONAL — and no gate counts as evidenced.
    expect(report.evidenceProvenance).toBe("UNPROVEN_LEDGER_INTEGRITY");
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.gates.every((g) => g.gateVerdict !== "EVIDENCED_FOR_LAUNCH")).toBe(true);

    const pack = compileStandaloneGoLiveDossierPack("CLI-FIELD-AUDITOR", "AUDITOR", { ...target.options, siteCode: "SITE-CAILAY-TIENGIANG-01" });
    expect(pack.overallVerdict).toBe("HOLD_BLOCKERS_REMAIN");
    expect(pack.evidenceProvenance).toBe("UNPROVEN_LEDGER_INTEGRITY");
    expect(pack.goForLiveCustomerData).toBe(false);
    expect(pack.mandatoryDisclaimers.some((d) => d.includes("UNPROVEN LEDGER INTEGRITY"))).toBe(true);
    expect(verifyPilotGoLiveDossierPackIntegrity(pack)).toBe(true);
  });
});
