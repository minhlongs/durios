/**
 * F-05 closure demo: the fixture extractor runs ONLY in explicitly enabled synthetic mode.
 *
 * Phase 1a drives the extractor registry directly (the layer where fixture values used to be
 * invented) for text/plain, application/pdf, application/json and three image types.
 * Phase 1b drives the real workspace/API layer: an image scan, an unreadable PDF stub, a .txt
 * upload and an attempt to smuggle `fixtureFields` in — with the audit events each produces.
 * Phase 2 enables synthetic mode and shows the rehearsal flow still works.
 *
 * Everything runs in throwaway temp directories on synthetic bytes only. No OCR is implemented:
 * the ordinary flow reports "cannot read this" instead of guessing.
 *
 * usage: bun extraction-mode-demo.ts
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceApp } from "../../../../src/server/server.js";
import { seedTestPilotActor } from "../../../../test/helpers/auth-test-helper.js";
import { defaultExtractorRegistry } from "../../../../src/extraction/composite-extractor-registry.js";
import {
  SYNTHETIC_EXTRACTION_ENV_FLAG, SyntheticExtractionDisabledError, enableSyntheticExtractionForRehearsal,
} from "../../../../src/extraction/synthetic-extraction-mode.js";
import { TEMPLATE_CANARY_VALUES } from "../../../../src/extraction/fixture-template-fields.js";
import type { ExtractionContext } from "../../../../src/extraction/extractor-types.js";
import type { AuthenticatedActor, DocumentType } from "../../../../src/domain/types.js";

const bytes = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, "utf-8"));
const png = (tag: string): Uint8Array => new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(tag)]));
const jpeg = (tag: string): Uint8Array => new Uint8Array(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(tag)]));
const tiff = (tag: string): Uint8Array => new Uint8Array(Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0x00]), Buffer.from(tag)]));
const pdfStub = (): Uint8Array => bytes("%PDF-1.5\n% stub this build cannot parse\n%%EOF\n");
const ctx = (documentType: DocumentType, mimeType: string, fileName: string): ExtractionContext =>
  ({ documentId: "DOC-DEMO-1", documentType, fileName, mimeType, sha256Hash: "0".repeat(64) });

let failures = 0;
const check = (label: string, ok: boolean, detail = ""): void => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};
const pairs = (fields: ReadonlyArray<{ fieldKey: string; rawValue: string }>): string =>
  JSON.stringify(fields.map((f) => [f.fieldKey, f.rawValue]));

const SHEET = "CONTAINER: MSKU1234565\nSEAL NUMBER: SEAL-ORD-77\nCADMIUM: 0.062 MG/KG\nNET WEIGHT: 17500 KG\nTOTAL BOXES: 880\n";
const canaryHits: string[] = [];
const scanForCanaries = (label: string, haystack: string): void => {
  for (const canary of TEMPLATE_CANARY_VALUES) if (haystack.includes(canary)) canaryHits.push(`${label}:${canary}`);
};

// ------------------------------------------------------- phase 1a: registry, ordinary mode
delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
console.log(`# extraction mode demo — ${new Date().toISOString()}`);
console.log(`# phase 1a: extractor registry, ORDINARY flow (${SYNTHETIC_EXTRACTION_ENV_FLAG} unset)`);

const packingText = defaultExtractorRegistry.extractFieldsSync(bytes(SHEET), ctx("PACKING_LIST", "text/plain", "packing-list.txt"));
console.log(`  text/plain PACKING_LIST   -> ${packingText.length} field(s) ${pairs(packingText)}`);
scanForCanaries("text/packing", pairs(packingText));
check("text/plain yields only values literally present in the uploaded bytes",
  packingText.length > 0 && packingText.every((f) => SHEET.includes(f.rawValue)),
  `${packingText.length} field(s), every rawValue is a substring of the source text`);

const labText = defaultExtractorRegistry.extractFieldsSync(bytes(SHEET), ctx("LAB_TEST_REPORT", "text/plain", "lab-report.txt"));
console.log(`  text/plain LAB_TEST_REPORT-> ${labText.length} field(s) ${pairs(labText)}`);
scanForCanaries("text/lab", pairs(labText));
check("the same bytes read as a lab report give the cadmium value that is really there",
  labText.some((f) => f.fieldKey === "cadmium_mg_kg" && f.rawValue === "0.062"),
  "no template cadmium (0.028 mg/kg) is supplied, and container/weight keys are out of scope for this document type");

for (const [mime, name, blob] of [
  ["application/pdf", "packing.pdf", pdfStub()], ["application/json", "blob.json", bytes('{"note":"a json payload with no document fields at all"}')],
  ["image/png", "scan.png", png("scan")], ["image/jpeg", "scan.jpg", jpeg("scan")], ["image/tiff", "scan.tiff", tiff("scan")],
] as ReadonlyArray<readonly [string, string, Uint8Array]>) {
  const fields = defaultExtractorRegistry.extractFieldsSync(blob, ctx("PACKING_LIST", mime, name));
  console.log(`  ${mime.padEnd(18)} ${name.padEnd(14)} -> ${fields.length} field(s) ${pairs(fields)}`);
  scanForCanaries(name, pairs(fields));
  check(`${mime} carrying no document data produces ZERO extracted fields`, fields.length === 0);
}

// A JSON payload that literally states a container number is read from those bytes - that is the
// file's own content, not a template default. What must never happen is a value nobody wrote.
const jsonWithData = '{"container_number":"MSKU1234565","note":"declared in the payload"}';
const jsonFields = defaultExtractorRegistry.extractFieldsSync(bytes(jsonWithData), ctx("PACKING_LIST", "application/json", "declared.json"));
console.log(`  application/json declared.json -> ${jsonFields.length} field(s) ${pairs(jsonFields)}`);
scanForCanaries("json/declared", pairs(jsonFields));
check("application/json only ever returns values literally present in the payload",
  jsonFields.every((f) => jsonWithData.includes(f.rawValue)), pairs(jsonFields));

// ------------------------------------------------------- phase 1b: workspace API, ordinary
console.log("# phase 1b: workspace/API layer, ORDINARY flow");
const ordinary = (() => {
  const dir = mkdtempSync(join(tmpdir(), "durios-extraction-ord-"));
  const app = createWorkspaceApp({ dbPath: join(dir, "durios.db"), dataDir: join(dir, "uploads") });
  const provisioned = seedTestPilotActor(app.authService, { role: "MANAGER", tenantId: "TENANT-DEMO-ORD" });
  return { dir, app, actor: app.authService.authenticateToken(provisioned.managedToken) };
})();
try {
  const workspace = ordinary.app.workspace;
  const dossierId = workspace.createDossier({
    dossierCode: "DOS-DEMO-ORD-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-ORD-77", targetMarket: "CN",
    borderGate: "Hữu Nghị", targetTemperatureC: 14.0, declaredNetWeightKg: 17500, declaredBoxCount: 880,
  }, ordinary.actor).id;

  workspace.uploadDocument(dossierId, png("photo-of-lab-report"), "lab-scan.png", "LAB_TEST_REPORT", ordinary.actor);
  workspace.uploadDocument(dossierId, pdfStub(), "packing.pdf", "PACKING_LIST", ordinary.actor);
  const docs = workspace.getRawDossier(dossierId)?.documents ?? [];
  const uploadedFields = docs.flatMap((d) => d.extractedFields.map((f) => [f.fieldKey, f.rawValue, f.verificationStatus]));
  console.log(`  uploaded 1 image scan + 1 unreadable pdf stub -> documents=${docs.length}, extracted fields=${uploadedFields.length}`);
  scanForCanaries("api/uploads", JSON.stringify(uploadedFields));
  check("an image scan and an unreadable PDF stub upload with ZERO extracted fields", uploadedFields.length === 0);

  const result = workspace.runValidation(dossierId, ordinary.actor);
  const unreadable = result.findings.filter((f) => f.ruleId === "RUL-DOC-UNREADABLE");
  console.log(`  validation -> status=${result.status}, criticalBlockers=${result.criticalBlockers}, RUL-DOC-UNREADABLE=${unreadable.length}`);
  check("the dossier is BLOCKED as unreadable instead of passing on invented values",
    result.status === "BLOCKED" && unreadable.length >= 1, `${unreadable.length} × RUL-DOC-UNREADABLE`);

  let textRefusal = "";
  try {
    workspace.uploadDocument(dossierId, bytes(SHEET), "packing-list.txt", "PACKING_LIST", ordinary.actor);
  } catch (err: unknown) {
    textRefusal = err instanceof Error ? err.message : String(err);
  }
  console.log(`  upload of a .txt sheet -> ${textRefusal.slice(0, 140)}`);
  check("a plain-text file is refused at the door (only PDF/PNG/JPEG/TIFF are accepted)",
    textRefusal.includes("Supported formats"));

  let fixtureRefusal = "";
  try {
    workspace.uploadDocument(dossierId, png("scan"), "packing.png", "PACKING_LIST", ordinary.actor,
      { container_number: { raw: "MSKU1234567" }, seal_number: { raw: "SL-998822" } });
  } catch (err: unknown) {
    fixtureRefusal = err instanceof SyntheticExtractionDisabledError ? `${err.name}: ${err.message}` : `unexpected: ${String(err)}`;
  }
  const rejected = workspace.auditLedger.getEventsForDossier(dossierId, "TENANT-DEMO-ORD").filter((e) => e.eventType === "DOC_UPLOAD_REJECTED");
  const syntheticRefusals = rejected.filter((e) => JSON.stringify(e.payloadAfter).includes("SYNTHETIC_EXTRACTION_DISABLED"));
  console.log(`  upload WITH fixtureFields -> ${fixtureRefusal.slice(0, 150)}`);
  console.log(`  audit DOC_UPLOAD_REJECTED events=${rejected.length} (SYNTHETIC_EXTRACTION_DISABLED=${syntheticRefusals.length}); fields now on the dossier=${(workspace.getRawDossier(dossierId)?.documents ?? []).flatMap((d) => d.extractedFields).length}`);
  check("an ordinary instance refuses fixtureFields with SyntheticExtractionDisabledError",
    fixtureRefusal.startsWith("SyntheticExtractionDisabledError"));
  console.log(`  (all DOC_UPLOAD_REJECTED reasons on this dossier: ${JSON.stringify(rejected.map((e) => e.payloadAfter?.reason))})`);
  check("the refusal is recorded in the audit ledger with its reason", syntheticRefusals.length === 1);
  check("the unsupported-.txt refusal is recorded in the audit ledger too",
    rejected.some((e) => String(e.payloadAfter?.reason ?? "").includes("Supported formats")));
  check("the refused upload wrote no document fields",
    (workspace.getRawDossier(dossierId)?.documents ?? []).flatMap((d) => d.extractedFields).length === 0);
} finally {
  ordinary.app.sqliteClient.close();
  rmSync(ordinary.dir, { recursive: true, force: true });
}

check("no template canary value appeared anywhere in the ordinary flow", canaryHits.length === 0,
  canaryHits.length ? canaryHits.join(", ") : `${TEMPLATE_CANARY_VALUES.length} canary values checked against every output above`);

// ------------------------------------------------------- phase 2: synthetic mode enabled
enableSyntheticExtractionForRehearsal("evidence/extraction-mode-demo.ts");
console.log(`# phase 2: SYNTHETIC flow (${SYNTHETIC_EXTRACTION_ENV_FLAG}=${process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]})`);
const syntheticFields = defaultExtractorRegistry.extractFieldsSync(pdfStub(), ctx("PACKING_LIST", "application/pdf", "packing.pdf"));
console.log(`  unreadable pdf stub -> ${syntheticFields.length} field(s) ${pairs(syntheticFields).slice(0, 220)} …`);
check("the synthetic flow still fills a document this build cannot read", syntheticFields.length > 0);

const synthetic = (() => {
  const dir = mkdtempSync(join(tmpdir(), "durios-extraction-syn-"));
  const app = createWorkspaceApp({ dbPath: join(dir, "durios.db"), dataDir: join(dir, "uploads") });
  const provisioned = seedTestPilotActor(app.authService, { role: "MANAGER", tenantId: "TENANT-DEMO-SYN" });
  return { dir, app, actor: app.authService.authenticateToken(provisioned.managedToken) };
})();
try {
  const workspace = synthetic.app.workspace;
  const dossierId = workspace.createDossier({
    dossierCode: "DOS-DEMO-SYN-01", containerNumber: "CSQU3054383", sealNumber: "VN-SEAL-DEMO", targetMarket: "CN",
    borderGate: "Hữu Nghị", targetTemperatureC: 14.0, declaredNetWeightKg: 18240, declaredBoxCount: 960,
  }, synthetic.actor).id;
  workspace.uploadDocument(dossierId, png("scan"), "packing.png", "PACKING_LIST", synthetic.actor,
    { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-DEMO" } });
  const fields = (workspace.getRawDossier(dossierId)?.documents ?? []).flatMap((d) => d.extractedFields.map((f) => [f.fieldKey, f.rawValue, f.verificationStatus]));
  console.log(`  upload WITH fixtureFields -> ${fields.length} field(s) ${JSON.stringify(fields)}`);
  check("declared fixture fields are honoured once synthetic mode is enabled",
    fields.some((f) => f[0] === "seal_number" && f[1] === "VN-SEAL-DEMO"));
  check("fixture fields still arrive unverified, so HITL confirmation is still required",
    fields.every((f) => f[2] !== "HUMAN_VERIFIED"));
} finally {
  synthetic.app.sqliteClient.close();
  rmSync(synthetic.dir, { recursive: true, force: true });
}

console.log(`== summary == failures=${failures}`);
process.exit(failures === 0 ? 0 : 1);
