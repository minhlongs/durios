/**
 * Adversarial proof for launch-gate provenance (FINDINGS F-14 / F-14b, handover item 3).
 *
 * Six runs against real SQLite databases. Every site starts with all five machine checks green and
 * five evidence files declared by *this script*, so what is under attack is the provenance decision
 * itself, not the machine checks:
 *
 *   A0  rehearsal cohort as seeded (codes DOS-CAILAY-R*)                 -> baseline, must stay closed
 *   A1  ATTACK: rename every dossier code to a customer-looking one      -> must stay closed
 *   B0  operational cohort (no synthetic ingest anywhere)                -> baseline, may open (fixture)
 *   B1  ATTACK: mix one synthetic container with an arbitrary code       -> must close again
 *   C1  ATTACK: delete the audit rows recording synthetic origin         -> must fail GATE-03, unproven
 *   D1  ATTACK: declare five "evidence files" that are not files         -> must stay closed
 *
 * Every case has an EXPECTED result and this script exits non-zero if reality differs, so it can be
 * used as an acceptance check rather than as a printout. Every database, document and "evidence"
 * file is a fixture written here or by pilot:seed-rehearsal: nothing in the output is a launch
 * decision and no real customer data is used.
 *
 * usage: bun gate-provenance-adversarial.ts <rootDir>
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { validateIso6346Container } from "../../../../src/domain/iso-6346.js";
import { verifySingleSiteLaunchGates } from "../../../../src/auth/pilot-launch-gate-verifier.js";
import { seedGate05PilotRehearsal } from "../../../../src/auth/pilot-rehearsal-seeder.js";
import { SYNTHETIC_EXTRACTION_ENV_FLAG } from "../../../../src/extraction/synthetic-extraction-mode.js";
import { createSiteBackup } from "../../../../src/auth/site-backup-manager.js";
import { createWorkspaceApp } from "../../../../src/server/server.js";
import { compileStandaloneGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "../../../../src/export/pilot-dossier-pack-compiler.js";
import { createOperatorEvidence, MISSING_FILE_EVIDENCE, OTP_CONFIGURED_ENV } from "../../../../test/helpers/gate-operator-evidence.js";
import { seedOperationalGateSite } from "../../../../test/helpers/operational-cohort-fixture.js";
import { seedTestPilotActor } from "../../../../test/helpers/auth-test-helper.js";
import type { GateEvidenceOverride, SingleSiteLaunchGateReport } from "../../../../src/auth/pilot-gate-types.js";

const root = process.argv[2];
if (!root) {
  process.stderr.write("usage: bun gate-provenance-adversarial.ts <rootDir>\n");
  process.exit(2);
}
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
// Declared up front: attack B1 needs the synthetic/fixture ingest path to be the thing under test.
process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = "true";

let failures = 0;
let checks = 0;

function expect(label: string, actual: unknown, wanted: unknown): void {
  checks++;
  const ok = JSON.stringify(actual) === JSON.stringify(wanted);
  if (!ok) failures++;
  process.stdout.write(`  ${ok ? "PASS" : "FAIL"} | ${label} | actual=${JSON.stringify(actual)} expected=${JSON.stringify(wanted)}\n`);
}

interface Site {
  dbPath: string; dataDir: string; backupDir: string; consentSignedFilePath: string;
  gateEvidence: Readonly<Record<string, GateEvidenceOverride>>; env: Record<string, string>;
}

const ATTESTATION = "Người vận hành fixture (ký bởi script, không phải người thật)";

function rehearsalSite(name: string): Site {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, "durios.db");
  const dataDir = join(dir, "uploads");
  const backupDir = join(dir, "backup");
  const consentSignedFilePath = join(dir, "consent.pdf");
  seedGate05PilotRehearsal({ dbPath, dataDir });
  writeFileSync(consentSignedFilePath, "%PDF-1.5 FIXTURE consent artifact — unsigned, written by gate-provenance-adversarial.ts\n", "utf-8");
  createSiteBackup(dbPath, dataDir, backupDir);
  return {
    dbPath, dataDir, backupDir, consentSignedFilePath,
    gateEvidence: createOperatorEvidence(join(dir, "evidence"), ATTESTATION),
    env: { ...OTP_CONFIGURED_ENV, DURIOS_GATE01_CONSENT_FILE: consentSignedFilePath },
  };
}

function operationalSite(name: string, evidence?: Readonly<Record<string, GateEvidenceOverride>>): Site {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, "durios.db");
  const dataDir = join(dir, "uploads");
  const backupDir = join(dir, "backup");
  const consentSignedFilePath = join(dir, "consent.pdf");
  seedOperationalGateSite({ dbPath, dataDir, backupDir, consentFilePath: consentSignedFilePath });
  return {
    dbPath, dataDir, backupDir, consentSignedFilePath,
    gateEvidence: evidence ?? createOperatorEvidence(join(dir, "evidence"), ATTESTATION),
    env: { ...OTP_CONFIGURED_ENV, DURIOS_GATE01_CONSENT_FILE: consentSignedFilePath },
  };
}

function runSql(dbPath: string, sql: string): void {
  const db = new Database(dbPath);
  try {
    db.run(sql);
  } finally {
    db.close();
  }
}

interface Expected {
  containers: number; machine: number; evidenced: number;
  provenance: SingleSiteLaunchGateReport["evidenceProvenance"]; goLive: boolean; integrity: boolean;
}

function report(label: string, site: Site, wanted: Expected): SingleSiteLaunchGateReport {
  const result = verifySingleSiteLaunchGates(site);
  const provenance = result.cohortProvenance;
  const declared = result.gates.filter((g) => g.externalEvidence.status === "RECORDED_BY_OPERATOR").length;
  const first = result.gates[0].externalEvidence;
  process.stdout.write(`\n=== ${label} ===\n`);
  process.stdout.write(`  containers=${result.kpiSummary.totalContainers} integrityGATE03=${result.gates.find((g) => g.gateId === "GATE-03")?.machineCheck.passed}\n`);
  process.stdout.write(`  machineChecksPassedCount=${result.machineChecksPassedCount}/5  operationalGatesEvidencedCount=${result.operationalGatesEvidencedCount}/5\n`);
  process.stdout.write(`  evidenceProvenance=${result.evidenceProvenance}  ledgerIntegrityVerified=${result.ledgerIntegrityVerified}  cohortSynthetic=${provenance?.synthetic}  goForLiveCustomerData=${result.goForLiveCustomerData}\n`);
  process.stdout.write(`  evidenceRecorded=${declared}/5 (counted only when an existing file AND a named human are on record)\n`);
  process.stdout.write(`  gate01Evidence status=${first.status} bytes=${first.artifact?.bytes ?? 0} sha256=${(first.artifact?.sha256 ?? "").slice(0, 16)}… attestedBy=${first.attestedBy ?? "(không ai)"}\n`);
  process.stdout.write(`  provenanceSignals=${JSON.stringify(provenance?.signals.slice(0, 3) ?? [])}\n`);
  process.stdout.write(`  gateVerdicts=${result.gates.map((g) => `${g.gateId}:${g.gateVerdict}`).join(" ")}\n`);
  expect(`${label} → totalContainers`, result.kpiSummary.totalContainers, wanted.containers);
  expect(`${label} → machineChecksPassedCount`, result.machineChecksPassedCount, wanted.machine);
  expect(`${label} → operationalGatesEvidencedCount`, result.operationalGatesEvidencedCount, wanted.evidenced);
  expect(`${label} → evidenceProvenance`, result.evidenceProvenance, wanted.provenance);
  expect(`${label} → goForLiveCustomerData`, result.goForLiveCustomerData, wanted.goLive);
  expect(`${label} → ledgerIntegrityVerified`, result.ledgerIntegrityVerified, wanted.integrity);
  return result;
}

process.stdout.write(`# gate provenance adversarial proof — ${new Date().toISOString()}\n`);
process.stdout.write(`# root ${root} — every database, document and evidence file below is a fixture\n`);
process.stdout.write(`# each case states an EXPECTED result; the script exits 1 if any expectation fails\n`);

const rehearsal = rehearsalSite("rehearsal");
const a0 = report("A0 baseline: rehearsal cohort as seeded, all machine checks green, 5 evidence files declared", rehearsal,
  { containers: 5, machine: 5, evidenced: 0, provenance: "SYNTHETIC_REHEARSAL", goLive: false, integrity: true });
expect("A0 → every gate is MACHINE_CHECK_ONLY (evidence declared but cohort synthetic)",
  a0.gates.every((g) => g.gateVerdict === "MACHINE_CHECK_ONLY"), true);
expect("A0 → all five declared files were recorded as artifacts", a0.gates.filter((g) => g.externalEvidence.status === "RECORDED_BY_OPERATOR").length, 5);
expect("A0 → legacy dossier-code signal is present before the rename",
  a0.cohortProvenance?.signals.some((s) => s.startsWith("REHEARSAL_DOSSIER_CODE:")), true);

runSql(rehearsal.dbPath, "UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-' || substr(id, -6)");
process.stdout.write("\nATTACK A1: UPDATE container_dossiers SET dossier_code = 'DOS-TG-CUSTOMER-…' (raw SQL, no application code)\n");
const a1 = report("A1 after renaming every rehearsal dossier code to a customer-looking code", rehearsal,
  { containers: 5, machine: 5, evidenced: 0, provenance: "SYNTHETIC_REHEARSAL", goLive: false, integrity: true });
expect("A1 → the name-based signal is gone (proves the rename worked)",
  a1.cohortProvenance?.signals.every((s) => !s.startsWith("REHEARSAL_DOSSIER_CODE:")), true);
expect("A1 → the ledger signal still holds the gate (REHEARSAL_DOSSIER_SEEDED)",
  a1.cohortProvenance?.signals.some((s) => s.startsWith("REHEARSAL_DOSSIER_SEEDED:")), true);
expect("A1 → the ledger signal still holds the gate (SYNTHETIC_DOCUMENT_INGESTED)",
  a1.cohortProvenance?.signals.some((s) => s.startsWith("SYNTHETIC_DOCUMENT_INGESTED:")), true);

const operational = operationalSite("operational");
const b0 = report("B0 baseline: operational cohort (nothing ingested in synthetic mode), 5 evidence files declared", operational,
  { containers: 5, machine: 5, evidenced: 5, provenance: "OPERATIONAL", goLive: true, integrity: true });
expect("B0 → every gate is EVIDENCED_FOR_LAUNCH (fixture demo of the mechanism, not a launch decision)",
  b0.gates.every((g) => g.gateVerdict === "EVIDENCED_FOR_LAUNCH"), true);

const app = createWorkspaceApp({ dbPath: operational.dbPath, dataDir: operational.dataDir });
try {
  const provisioned = seedTestPilotActor(app.authService, { role: "CLERK", tenantId: "TENANT-CAILAY-PILOT-01", tenantType: "PACKHOUSE_EXPORTER" });
  const actor = app.authService.authenticateToken(provisioned.managedToken);
  const checkDigit = validateIso6346Container("TCLU1234560").expectedCheckDigit ?? 0;
  const injected = app.workspace.createDossier({
    dossierCode: "DOS-TG-CUSTOMER-77", containerNumber: `TCLU123456${checkDigit}`, sealNumber: "VN-SEAL-INJ-77",
    targetMarket: "CN", borderGate: "Hữu Nghị", targetTemperatureC: 14.0, declaredNetWeightKg: 18240, declaredBoxCount: 960,
  }, actor);
  app.workspace.uploadDocument(injected.id, new TextEncoder().encode("%PDF-1.5\n% injected synthetic packing list\n%%EOF\n"),
    "PackingList-INJECTED.pdf", "PACKING_LIST", actor, { net_weight_kg: { raw: "18240" } });
} finally {
  app.sqliteClient.close();
}
process.stdout.write("\nATTACK B1: one container created through the synthetic/fixture path, coded DOS-TG-CUSTOMER-77, mixed into the green cohort\n");
const b1 = report("B1 after mixing one synthetic container into the operational cohort", operational,
  { containers: 6, machine: 5, evidenced: 0, provenance: "SYNTHETIC_REHEARSAL", goLive: false, integrity: true });
expect("B1 → no gate stays open after one synthetic container joins the cohort",
  b1.gates.every((g) => g.gateVerdict !== "EVIDENCED_FOR_LAUNCH"), true);

process.stdout.write("\nATTACK C1: DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')\n");
runSql(rehearsal.dbPath, "DELETE FROM audit_events WHERE event_type IN ('SYNTHETIC_DOCUMENT_INGESTED','REHEARSAL_DOSSIER_SEEDED')");
const c1 = report("C1 after erasing the ledger rows that record synthetic origin", rehearsal,
  { containers: 5, machine: 4, evidenced: 0, provenance: "UNPROVEN_LEDGER_INTEGRITY", goLive: false, integrity: false });
expect("C1 → GATE-03 machine check fails because the hash chain is broken",
  c1.gates.find((g) => g.gateId === "GATE-03")?.machineCheck.passed, false);
const c1Pack = compileStandaloneGoLiveDossierPack("CLI-FIELD-AUDITOR", "AUDITOR", { ...rehearsal, siteCode: "SITE-CAILAY-TIENGIANG-01" });
expect("C1 → the sealed pack is HOLD_BLOCKERS_REMAIN", c1Pack.overallVerdict, "HOLD_BLOCKERS_REMAIN");
expect("C1 → the sealed pack carries UNPROVEN_LEDGER_INTEGRITY", c1Pack.evidenceProvenance, "UNPROVEN_LEDGER_INTEGRITY");
expect("C1 → the sealed pack says goForLiveCustomerData=false", c1Pack.goForLiveCustomerData, false);
expect("C1 → the sealed pack carries the ledger-integrity disclaimer",
  c1Pack.mandatoryDisclaimers.some((d) => d.includes("UNPROVEN LEDGER INTEGRITY")), true);
expect("C1 → the sealed pack still verifies against its own SHA-256", verifyPilotGoLiveDossierPackIntegrity(c1Pack), true);

const bogusEvidence: Record<string, GateEvidenceOverride> = {};
for (const gate of ["GATE-01", "GATE-02", "GATE-03", "GATE-04", "GATE-05"] as const) {
  // GATE-02 points at a directory: a path that exists but is not a file. The rest point at
  // nothing at all. Both must be refused, because a declaration is not an artifact.
  bogusEvidence[gate] = gate === "GATE-02"
    ? { filePath: join(root, "operational-bogus-evidence", "uploads"), attestedBy: "Người khai không có tệp" }
    : { filePath: join(root, "does-not-exist", `${gate}.pdf`), attestedBy: "Người khai không có tệp" };
}
const bogus = operationalSite("operational-bogus-evidence", bogusEvidence);
process.stdout.write("\nATTACK D1: declare five 'evidence files' that are not files, on an otherwise green operational site\n");
const d1 = report("D1 after declaring evidence paths that are not existing files", bogus,
  { containers: 5, machine: 5, evidenced: 0, provenance: "OPERATIONAL", goLive: false, integrity: true });
expect("D1 → nothing was recorded as operator evidence",
  d1.gates.filter((g) => g.externalEvidence.status === "RECORDED_BY_OPERATOR").length, 0);
expect("D1 → GATE-01 note says the declared path does not exist", d1.gates[0].externalEvidence.note.includes("không tồn tại"), true);
expect("D1 → GATE-02 note says the declared path is not a file", d1.gates[1].externalEvidence.note.includes("không phải là tệp"), true);
expect("D1 → MISSING_FILE_EVIDENCE fixture is refused the same way",
  verifySingleSiteLaunchGates({ ...bogus, gateEvidence: MISSING_FILE_EVIDENCE }).operationalGatesEvidencedCount, 0);

process.stdout.write(`
== summary == checks=${checks} failures=${failures}

# RESIDUAL LIMITS (stated, not hidden)
#  1. This mechanism detects data that came through the synthetic/fixture path or the rehearsal
#     seeder, because that path writes to the append-only hash-chained audit ledger at ingest time.
#  2. A dossier whose fields were typed in by hand from an invented document is NOT distinguishable
#     from real keyed-in data by any machine check here. Only operator evidence review and Founder
#     sign-off on the sealed pack can catch that.
#  3. The declared evidence artifact is checked for existence, size and SHA-256, and attributed to
#     a named human. Its CONTENT is never machine-verified: a blank page hashes as happily as a
#     signed consent form. Reading it stays a human act.
#  4. No HTTP endpoint accepts gate evidence. Only the environment of the on-premises server
#     process - or whoever invokes the pilot:verify-gates / pilot:audit-pack CLI - can declare it.
#  5. Scope boundary agreed for Stage 0: the machine administrator is trusted. Someone with shell
#     access who deletes rows AND recomputes the whole hash chain is out of scope by decision; the
#     checks above cover renaming, mixing and plain deletion, not a full chain re-forgery.
`);
process.exit(failures === 0 ? 0 : 1);
