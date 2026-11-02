import { afterEach, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { compileStandaloneGoLiveDossierPack } from "../src/export/pilot-dossier-pack-compiler.js";
import { createWorkspaceApp } from "../src/server/server.js";
import { cohortContainsRehearsalData, resolveCohortProvenance } from "../src/auth/gate-cohort-provenance.js";
import { buildGateSite, type GateSite } from "./helpers/gate-site-fixture.js";
import { cohortMetric, provenanceAuditEvent } from "./helpers/gate-provenance-fixture.js";
import { seedOperationalGate05Cohort } from "./helpers/operational-cohort-fixture.js";

const sites: GateSite[] = [];

function rehearsalSite(): GateSite {
  const site = buildGateSite("rehearsal");
  sites.push(site);
  return site;
}

describe("Cohort provenance: synthetic containers cannot open a launch gate", () => {
  afterEach(() => {
    for (const site of sites.splice(0)) rmSync(site.root, { recursive: true, force: true });
  });

  it("classifies a cohort from audit-ledger signals, not from dossier names", () => {
    expect(resolveCohortProvenance([cohortMetric("d1", "DOS-OP-01")], []))
      .toEqual({ synthetic: false, signals: [], cohortSize: 1 });
    // A synthetic ingest recorded against a cohort member is enough, whatever the code says.
    expect(resolveCohortProvenance([cohortMetric("d1", "DOS-OP-01")], [provenanceAuditEvent("d1", "SYNTHETIC_DOCUMENT_INGESTED")]).signals)
      .toEqual(["SYNTHETIC_DOCUMENT_INGESTED:d1"]);
    // Signals about dossiers outside the measured cohort do not contaminate it.
    expect(resolveCohortProvenance([cohortMetric("d1", "DOS-OP-01")], [provenanceAuditEvent("d9", "REHEARSAL_DOSSIER_SEEDED")]).synthetic).toBe(false);
    // Legacy databases are still recognised by name, but the name is no longer the mechanism.
    expect(resolveCohortProvenance([cohortMetric("d1", "DOS-CAILAY-R01")], []).signals).toEqual(["REHEARSAL_DOSSIER_CODE:DOS-CAILAY-R01"]);
    expect(cohortContainsRehearsalData(["DOS-CAILAY-OP01", "DOS-CAILAY-R05"])).toBe(true);
  });

  it("reports a rehearsal-seeded database as SYNTHETIC_REHEARSAL even with all five evidence files declared", () => {
    const report = verifySingleSiteLaunchGates(rehearsalSite().options);

    expect(report.machineChecksPassedCount).toBe(5);
    // Declared evidence over synthetic containers opens nothing.
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.cohortProvenance?.synthetic).toBe(true);
    expect(report.cohortProvenance?.signals.some((s) => s.startsWith("REHEARSAL_DOSSIER_SEEDED:"))).toBe(true);
    expect(report.cohortProvenance?.signals.some((s) => s.startsWith("SYNTHETIC_DOCUMENT_INGESTED:"))).toBe(true);
    expect(report.gates.every((g) => g.gateVerdict === "MACHINE_CHECK_ONLY")).toBe(true);
    expect(report.gates.every((g) => g.statusLabel === "PASS_SYNTHETIC_REHEARSAL")).toBe(true);
  });

  it("still reports SYNTHETIC_REHEARSAL when operational dossiers are added next to rehearsal ones", () => {
    const site = rehearsalSite();
    const app = createWorkspaceApp({ dbPath: site.dbPath, dataDir: site.dataDir });
    try {
      seedOperationalGate05Cohort(app.workspace, app.authService);
    } finally {
      app.sqliteClient.close();
    }
    const mixed = verifySingleSiteLaunchGates(site.options);
    expect(mixed.kpiSummary.totalContainers).toBe(10);
    expect(mixed.cohortProvenance?.synthetic).toBe(true);
    expect(mixed.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(mixed.operationalGatesEvidencedCount).toBe(0);
    expect(mixed.goForLiveCustomerData).toBe(false);
  });

  it("compiles the pack for that database as a rehearsal result, never as GO_FOR_LIVE_CUSTOMER_DATA", () => {
    const pack = compileStandaloneGoLiveDossierPack("CLI-FIELD-AUDITOR", "AUDITOR", {
      ...rehearsalSite().options, siteCode: "SITE-CAILAY-TIENGIANG-01",
    });

    expect(pack.overallVerdict).toBe("READY_FOR_PILOT_GO_LIVE");
    expect(pack.goForLiveCustomerData).toBe(false);
    expect(pack.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(pack.operationalGatesEvidencedCount).toBe(0);
    expect(pack.cohortProvenance?.synthetic).toBe(true);
    expect(pack.mandatoryDisclaimers.some((d) => d.includes("SYNTHETIC REHEARSAL"))).toBe(true);
    expect(pack.fieldAuditorChecklist.every((item) => item.status === "ACTION_REQUIRED" && !item.passed)).toBe(true);
  });
});
