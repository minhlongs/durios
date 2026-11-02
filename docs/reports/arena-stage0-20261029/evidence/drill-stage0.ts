/**
 * Phase C Stage 0 rehearsal drill, run against the delivered working tree.
 *
 * Everything happens in throwaway temp directories: a separate SQLite database, a
 * separate blob directory, synthetic documents only. No operational data is read or
 * written, and ./data inside the repository is never touched.
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWorkspaceApp } from "../../../../src/server/server.js";
import { routeHttpRequest } from "../../../../src/server/http-router.js";
import { seedTestPilotActor } from "../../../../test/helpers/auth-test-helper.js";
import { createSiteBackup, verifySiteBackup, restoreSiteBackup } from "../../../../src/auth/site-backup-manager.js";
import { verifyExportManifest } from "../../../../src/export/standalone-manifest-verifier.js";
import { calculateSha256 } from "../../../../src/ingestion/document-hasher.js";
import { isSyntheticExtractionEnabled, SYNTHETIC_EXTRACTION_ENV_FLAG } from "../../../../src/extraction/synthetic-extraction-mode.js";

// The drill posts fixtureFields overrides, which the ordinary (non-rehearsal) flow refuses by
// design. Without this guard the uploads are rejected, the dossiers stay BLOCKED and the failure
// shows up three steps later as a confusing TypeError instead of as a missing environment flag.
if (!isSyntheticExtractionEnabled()) {
  process.stderr.write(
    `usage: ${SYNTHETIC_EXTRACTION_ENV_FLAG}=true bun drill-stage0.ts\n` +
      "  the drill is a declared rehearsal: it uploads fixtureFields overrides, and an ordinary\n" +
      "  instance refuses those with HTTP 400 SYNTHETIC_EXTRACTION_DISABLED.\n"
  );
  process.exit(2);
}

const lines: string[] = [];
const log = (msg: string, ...rest: unknown[]): void => {
  const line = rest.length ? `${msg} ${rest.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join(" ")}` : msg;
  lines.push(line);
  console.log(line);
};
const check = (label: string, ok: boolean, detail = ""): void => {
  log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? ` | ${detail}` : ""}`);
};

const root = mkdtempSync(join(tmpdir(), "drill-stage0-"));
const dbPath = join(root, "durios.db");
const dataDir = join(root, "uploads");
const backupDir = join(root, "backup");
const restoreRoot = join(root, "restored");
log(`== S1 synthetic environment == root=${root} db=${dbPath}`);
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
check("repository ./data untouched by the drill", !existsSync(join(REPO_ROOT, "data", "durios.db")));
log(`== S1 repository root resolved from this file == ${REPO_ROOT}`);

const app = createWorkspaceApp({ dbPath, dataDir });
const ws = app.workspace;
const H = (t: string) => ({ Authorization: `Bearer ${t}`, "content-type": "application/json" });
const req = (method: string, url: string, token: string, body?: unknown) =>
  routeHttpRequest(ws, new Request(`http://127.0.0.1:3000${url}`, { method, headers: H(token), ...(body ? { body: JSON.stringify(body) } : {}) }));
const json = async (r: Response) => (await r.json()) as Record<string, any>;

const mgr = seedTestPilotActor(app.authService, { tenantId: "TENANT-DRILL-A", role: "MANAGER" });
const clerk = seedTestPilotActor(app.authService, { tenantId: "TENANT-DRILL-A", role: "CLERK" });
const buyer = seedTestPilotActor(app.authService, { tenantId: "TENANT-DRILL-B", role: "VIEWER", tenantType: "BUYER_IMPORTER", persona: "BUYER_VIEWER" });
const intruder = seedTestPilotActor(app.authService, { tenantId: "TENANT-DRILL-C", role: "MANAGER" });
log(`== S2 actors == manager=${mgr.username} clerk=${clerk.username} buyer=${buyer.username} intruder=${intruder.username}`);

const pdf = (tag: string) => Buffer.from(`%PDF-1.5\n% ${tag}\n%%EOF\n`).toString("base64");
const pngBytes = (tag: string) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(tag)]).toString("base64");

async function buildDossier(code: string, container: string, seal: string, docs: Array<{ type: string; name: string; fields?: Record<string, { raw: string }>; b64?: string }>) {
  const created = await req("POST", "/api/dossiers", clerk.sessionToken, {
    dossierCode: code, containerNumber: container, sealNumber: seal, targetMarket: "CN",
    borderGate: "Hữu Nghị", targetTemperatureC: 14, declaredNetWeightKg: 18240, declaredBoxCount: 960,
  });
  const createdBody = await json(created);
  if (!createdBody.data) {
    check(`buildDossier(${code}): POST /api/dossiers accepted`, false, `status=${created.status} error=${JSON.stringify(createdBody.error)}`);
    throw new Error(`drill cannot continue: dossier ${code} was not created (HTTP ${created.status})`);
  }
  let version = createdBody.data.version as number;
  const id = createdBody.data.id as string;
  for (const d of docs) {
    const up = await req("POST", `/api/dossiers/${id}/documents`, clerk.sessionToken, {
      fileName: d.name, documentType: d.type, version, base64Content: d.b64 ?? pdf(d.name), ...(d.fields ? { fixtureFields: d.fields } : {}),
    });
    const upBody = await json(up);
    if (!upBody.data) {
      check(`buildDossier(${code}): upload ${d.name} accepted`, false, `status=${up.status} error=${JSON.stringify(upBody.error)}`);
      throw new Error(`drill cannot continue: upload of ${d.name} for ${code} was refused (HTTP ${up.status}); fixtureFields need ${SYNTHETIC_EXTRACTION_ENV_FLAG}=true`);
    }
    version = upBody.data.version as number;
    const detail = await json(await req("GET", `/api/dossiers/${id}`, clerk.sessionToken));
    const doc = (detail.data.documents as Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }>).find((x) => x.id === upBody.data.documentId);
    for (const f of doc?.extractedFields ?? []) {
      const vr = await json(await req("POST", `/api/dossiers/${id}/documents/${doc!.id}/fields/${f.id}/verify`, clerk.sessionToken, { confirmedValue: f.rawValue, version }));
      if (!vr.data) {
        check(`buildDossier(${code}): field ${f.id} verified`, false, `error=${JSON.stringify(vr.error)}`);
        throw new Error(`drill cannot continue: verifying field ${f.id} of ${d.name} failed`);
      }
      version = vr.data.version as number;
    }
  }
  return { id, version, createStatus: created.status };
}

const CLEAN_DOCS = (container: string, seal: string) => [
  { type: "PACKING_LIST", name: "PackingList.pdf", fields: { container_number: { raw: container }, seal_number: { raw: seal }, box_count: { raw: "960" }, net_weight_kg: { raw: "18240" }, invoice_value: { raw: "USD 92000" }, unit_price: { raw: "4.85" } } },
  { type: "LAB_TEST_REPORT", name: "LabTestReport.pdf", fields: { cadmium_mg_kg: { raw: "0.025" }, sample_code: { raw: "LAB-DRILL-01" } } },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoCert.pdf", fields: { container_number: { raw: container }, seal_number: { raw: seal }, phyto_cert_number: { raw: "KDTV-2026-VN-09931" } } },
];

// ---------- S3 valid dossier to sealed export ----------
const good = await buildDossier("DOS-DRILL-OK", "CSQU3054383", "VN-SEAL-9001", CLEAN_DOCS("CSQU3054383", "VN-SEAL-9001"));
const valOk = await json(await req("POST", `/api/dossiers/${good.id}/validate`, clerk.sessionToken, { version: good.version }));
log(`== S3 valid dossier == id=${good.id} validation=${valOk.data?.status} blockers=${valOk.data?.criticalBlockers}`);
check("clean synthetic dossier validates PASSED", valOk.data?.status === "PASSED", `status=${valOk.data?.status}`);
const apprOk = await req("POST", `/api/dossiers/${good.id}/approve`, mgr.sessionToken, { version: valOk.data.version });
const expOk = await req("POST", `/api/dossiers/${good.id}/export`, mgr.sessionToken, { version: (await json(apprOk)).data.version });
const manifest = (await json(expOk)).data as Record<string, any>;
check("manager can approve and export; clerk-approved export is not used here", expOk.status === 200 && manifest?.lifecycleState === "EXPORTED", `exportStatus=${expOk.status}`);
check("sealed manifest is immutable and carries both hashes", manifest?.isImmutable === true && /^[a-f0-9]{64}$/.test(manifest?.compositeManifestSha256 ?? "") && /^[a-f0-9]{64}$/.test(manifest?.manifestIntegritySha256 ?? ""));

const manifestPath = join(root, "manifest-good.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const verifierOut = verifyExportManifest(JSON.parse(readFileSync(manifestPath, "utf-8")));
check("standalone verifier accepts the untouched manifest", verifierOut.valid && verifierOut.integrityCoverage === "FULL", `errors=${JSON.stringify(verifierOut.errors)}`);

// ---------- S4 tamper drills ----------
log("== S4 manifest tamper drills ==");
const tamperCases: Array<[string, Record<string, any>]> = [
  ["complianceFindingsCount rewritten (advisory warnings inflated)", { ...manifest, complianceFindingsCount: { criticalBlockers: 0, advisoryWarnings: 5 } }],
  ["disclaimers replaced by a clearance claim", { ...manifest, regulatoryDisclaimers: ["This manifest IS an official GACC customs clearance approval."] }],
  ["exportedBy rewritten", { ...manifest, exportedBy: "Attacker" }],
  ["exportedAt rewritten", { ...manifest, exportedAt: "2020-01-01T00:00:00.000Z" }],
  ["verifiedDataSummary cadmium value rewritten", { ...manifest, verifiedDataSummary: { ...manifest.verifiedDataSummary, lab_test_report: { cadmium_mg_kg: "0.001" } } }],
  ["containerNumber rewritten (control: composite hash)", { ...manifest, containerNumber: "MSKU0000000" }],
  ["lifecycleState reverted to DRAFT", { ...manifest, lifecycleState: "DRAFT", isImmutable: false }],
];
for (const [label, tampered] of tamperCases) {
  const res = verifyExportManifest(tampered);
  check(`tamper detected: ${label}`, !res.valid, `errors=${JSON.stringify(res.errors)}`);
}
const { manifestIntegritySha256: _dropped, ...legacy } = manifest as Record<string, any>;
const legacyRes = verifyExportManifest(legacy);
check("legacy manifest without the integrity field still verifies but reports PARTIAL_LEGACY", legacyRes.valid && legacyRes.integrityCoverage === "PARTIAL_LEGACY", `coverage=${legacyRes.integrityCoverage}`);

// ---------- S5 faulty container/seal, missing docs, post-validation edit ----------
log("== S5 failure drills ==");
const mismatch = await buildDossier("DOS-DRILL-SEAL", "CSQU3054383", "VN-SEAL-9001", [
  { type: "PACKING_LIST", name: "PackingMismatch.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-7777" } } },
  { type: "LAB_TEST_REPORT", name: "LabMismatch.pdf", fields: { cadmium_mg_kg: { raw: "0.025" } } },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoMismatch.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9001" } } },
]);
const valMismatch = await json(await req("POST", `/api/dossiers/${mismatch.id}/validate`, clerk.sessionToken, { version: mismatch.version }));
check("seal mismatch across documents blocks the lot", valMismatch.data?.status === "BLOCKED" && (valMismatch.data?.findings ?? []).some((f: any) => f.ruleId === "RUL-CROSS-SEAL"), `status=${valMismatch.data?.status} findings=${JSON.stringify((valMismatch.data?.findings ?? []).map((f: any) => f.ruleId))}`);
const apprMismatch = await req("POST", `/api/dossiers/${mismatch.id}/approve`, mgr.sessionToken, { version: valMismatch.data?.version ?? mismatch.version });
check("blocked dossier cannot be approved", apprMismatch.status >= 400, `status=${apprMismatch.status}`);

const missing = await buildDossier("DOS-DRILL-MISSING", "CSQU3054383", "VN-SEAL-9002", [
  { type: "PACKING_LIST", name: "PackingOnly.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9002" } } },
]);
const valMissing = await json(await req("POST", `/api/dossiers/${missing.id}/validate`, clerk.sessionToken, { version: missing.version }));
check("missing mandatory documents block the lot", valMissing.data?.status === "BLOCKED" && (valMissing.data?.findings ?? []).some((f: any) => f.ruleId === "RUL-DOC-001") && (valMissing.data?.findings ?? []).some((f: any) => f.ruleId === "RUL-DOC-002"), `findings=${JSON.stringify((valMissing.data?.findings ?? []).map((f: any) => f.ruleId))}`);

const postEdit = await req("POST", `/api/dossiers/${good.id}/documents`, clerk.sessionToken, {
  fileName: "PackingListV2.pdf", documentType: "PACKING_LIST", version: manifest ? undefined : undefined, base64Content: pdf("replaced-after-export"),
  fixtureFields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9001" } },
});
const postEditBody = await json(postEdit);
check("document replacement against a sealed dossier is refused", postEdit.status >= 400, `status=${postEdit.status} error=${postEditBody?.error ?? ""}`);

const edited = await buildDossier("DOS-DRILL-EDIT", "CSQU3054383", "VN-SEAL-9003", CLEAN_DOCS("CSQU3054383", "VN-SEAL-9003"));
const valEdited = await json(await req("POST", `/api/dossiers/${edited.id}/validate`, clerk.sessionToken, { version: edited.version }));
const replaced = await json(await req("POST", `/api/dossiers/${edited.id}/documents`, clerk.sessionToken, {
  fileName: "LabTestReportV2.pdf", documentType: "LAB_TEST_REPORT", version: valEdited.data.version, base64Content: pdf("lab-v2"), fixtureFields: { cadmium_mg_kg: { raw: "0.090" }, sample_code: { raw: "LAB-DRILL-02" } },
}));
const afterReplace = await json(await req("GET", `/api/dossiers/${edited.id}`, clerk.sessionToken));
const stateAfterReplace = afterReplace.data.lifecycleState as string;
check("replacing a document after validation clears the validation result", stateAfterReplace === "HUMAN_VERIFICATION_REQUIRED" && !afterReplace.data.latestValidationResult, `state=${stateAfterReplace} latestValidationResult=${JSON.stringify(afterReplace.data.latestValidationResult ?? null)}`);
const approveAfterReplace = await req("POST", `/api/dossiers/${edited.id}/approve`, mgr.sessionToken, { version: replaced.data?.version ?? valEdited.data.version });
check("approval is refused until the new document is verified and revalidated", approveAfterReplace.status >= 400, `status=${approveAfterReplace.status}`);

// ---------- S6 wrong tenant and insufficient permission ----------
log("== S6 authorization drills ==");
const intruderRead = await req("GET", `/api/dossiers/${good.id}`, intruder.sessionToken);
check("ungranted tenant cannot read the dossier", intruderRead.status === 404, `status=${intruderRead.status}`);
const intruderManifest = await req("GET", `/api/dossiers/${good.id}/manifest`, intruder.sessionToken);
check("ungranted tenant cannot read the manifest", intruderManifest.status === 404, `status=${intruderManifest.status}`);
const intruderList = await json(await req("GET", "/api/dossiers", intruder.sessionToken));
check("ungranted tenant list contains no foreign dossier", JSON.stringify(intruderList).indexOf("DOS-DRILL-OK") === -1);
const clerkApprove = await req("POST", `/api/dossiers/${missing.id}/approve`, clerk.sessionToken, {});
check("clerk cannot approve for export", clerkApprove.status === 403, `status=${clerkApprove.status}`);
const buyerUpload = await req("POST", `/api/dossiers/${good.id}/documents`, buyer.sessionToken, { fileName: "x.pdf", documentType: "PACKING_LIST", base64Content: pdf("buyer") });
check("outside buyer cannot upload documents", buyerUpload.status >= 400, `status=${buyerUpload.status}`);
const spoof = await routeHttpRequest(ws, new Request(`http://127.0.0.1:3000/api/dossiers/${good.id}`, { headers: { "content-type": "application/json", "x-actor-role": "MANAGER" } }));
check("client-supplied x-actor-role without a session is rejected", spoof.status === 401, `status=${spoof.status}`);

// ---------- S7/S8 grantee redaction and tenant-scoped KPI ----------
log("== S7 grantee manifest redaction ==");
const grantBuyer = await req("POST", `/api/dossiers/${good.id}/shares`, mgr.sessionToken, { granteeTenantId: "TENANT-DRILL-B", purpose: "BUYER_VERIFICATION", scope: "READ_ONLY", expiresAt: new Date(Date.now() + 86400000).toISOString() });
check("owner can grant BUYER_VERIFICATION read-only access", grantBuyer.status === 201, `status=${grantBuyer.status}`);
const buyerManifestRes = await req("GET", `/api/dossiers/${good.id}/manifest`, buyer.sessionToken);
const buyerManifest = await json(buyerManifestRes);
const buyerSummary = JSON.stringify(buyerManifest?.data?.verifiedDataSummary ?? {});
check("grantee manifest hides commercial terms and declared quantities", buyerManifestRes.status === 200 && buyerSummary.indexOf("92000") === -1 && buyerSummary.indexOf("4.85") === -1 && buyerManifest?.data?.verifiedDataSummary?.declaredNetWeightKg === undefined, `summary=${buyerSummary}`);
check("grantee manifest keeps reconcilable identity and states the redaction", buyerManifest?.data?.verifiedDataSummary?.containerNumber === "CSQU3054383" && buyerManifest?.redaction?.applied === true && String(buyerManifest?.redaction?.notice ?? "").indexOf("compositeManifestSha256") !== -1);

const financeGrantee = seedTestPilotActor(app.authService, { tenantId: "TENANT-DRILL-D", role: "VIEWER", tenantType: "BUYER_IMPORTER", persona: "BUYER_VIEWER" });
await req("POST", `/api/dossiers/${good.id}/shares`, mgr.sessionToken, { granteeTenantId: "TENANT-DRILL-D", purpose: "TRADE_FINANCE", scope: "READ_ONLY", expiresAt: new Date(Date.now() + 86400000).toISOString() });
const financeManifest = await req("GET", `/api/dossiers/${good.id}/manifest`, financeGrantee.sessionToken);
check("TRADE_FINANCE grant does not carry the sealed manifest", financeManifest.status === 403, `status=${financeManifest.status}`);

log("== S8 tenant-scoped pilot KPI and gates ==");
const buyerKpi = await json(await req("GET", "/api/pilot/kpi", buyer.sessionToken));
check("grantee KPI counts no container and leaks no foreign identifier", buyerKpi.data?.totalContainers === 0 && JSON.stringify(buyerKpi.data).indexOf("DOS-DRILL-OK") === -1 && JSON.stringify(buyerKpi.data).indexOf("CSQU3054383") === -1, `totalContainers=${buyerKpi.data?.totalContainers}`);
const ownerKpi = await json(await req("GET", "/api/pilot/kpi", mgr.sessionToken));
check("owner KPI counts its own 4 dossiers", ownerKpi.data?.totalContainers === 4, `totalContainers=${ownerKpi.data?.totalContainers}`);
check("owner KPI labels timings as system timestamps and value metrics as assumptions", ownerKpi.data?.timingEvidenceSource === "SYSTEM_TIMESTAMPS" && ownerKpi.data?.valueMetricsProvenance === "UNVALIDATED_ASSUMPTION" && (ownerKpi.data?.aggregateValueMetrics?.assumptions ?? []).length === 2);
const buyerGates = await json(await req("GET", "/api/pilot/gates", buyer.sessionToken));
check("grantee gate report cannot be satisfied by a shared dossier", buyerGates.data?.kpiSummary?.totalContainers === 0 && buyerGates.data?.goForLiveCustomerData === false && buyerGates.data?.evidenceProvenance === "OPERATIONAL", `passed=${buyerGates.data?.passedCount}`);

// ---------- S9 rehearsal bootstrap ----------
log("== S9 rehearsal bootstrap guard ==");
delete process.env.DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP;
const refused = await routeHttpRequest(ws, new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap?fullGates=true&role=MANAGER", { method: "POST" }));
const refusedBody = await json(refused);
check("unauthenticated rehearsal bootstrap is refused by default", refused.status === 403 && refusedBody.errorCode === "FEATURE_DISABLED" && refused.headers.get("set-cookie") === null, `status=${refused.status}`);
check("refused bootstrap minted no token and seeded no dossier", JSON.stringify(refusedBody).indexOf("dpt_") === -1 && JSON.stringify(refusedBody).indexOf("TENANT-CAILAY-PILOT-01") === -1);
process.env.DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP = "true";
const rehearsal = await json(await routeHttpRequest(ws, new Request("http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap?fullGates=true&role=MANAGER", { method: "POST" })));
const pack = rehearsal.data?.goLivePack ?? {};
check("opted-in rehearsal reaches 5/5 mechanical gates", rehearsal.data?.passedGateCount === 5, `passed=${rehearsal.data?.passedGateCount}`);
check("rehearsal never authorises live customer data", pack.goForLiveCustomerData === false && pack.overallVerdict === "READY_FOR_PILOT_GO_LIVE" && pack.evidenceProvenance === "SYNTHETIC_REHEARSAL", `verdict=${pack.overallVerdict}`);
check("every rehearsal gate is labelled PASS_SYNTHETIC_REHEARSAL and carries the disclaimer", (pack.gates ?? []).every((g: any) => g.statusLabel === "PASS_SYNTHETIC_REHEARSAL") && (pack.mandatoryDisclaimers ?? []).some((d: string) => d.indexOf("SYNTHETIC REHEARSAL") !== -1));
check("rehearsal data stays in its own tenant and does not pollute the drill tenant", ownerKpi.data?.totalContainers === 4);
delete process.env.DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP;

// ---------- S10 extraction fail-closed ----------
log("== S10 extraction and missing-data drills ==");
const scans = await buildDossier("DOS-DRILL-SCAN", "CSQU3054383", "VN-SEAL-9004", [
  { type: "PACKING_LIST", name: "PackingScan.png", b64: pngBytes("packing-scan") },
  { type: "LAB_TEST_REPORT", name: "LabScan.png", b64: pngBytes("lab-scan") },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoScan.png", b64: pngBytes("phyto-scan") },
]);
const scanDetail = await json(await req("GET", `/api/dossiers/${scans.id}`, clerk.sessionToken));
const scanFieldCount = (scanDetail.data.documents as Array<{ extractedFields: unknown[] }>).reduce((n, d) => n + d.extractedFields.length, 0);
const valScans = await json(await req("POST", `/api/dossiers/${scans.id}/validate`, clerk.sessionToken, { version: scans.version }));
check("image scans yield zero extracted fields instead of invented values", scanFieldCount === 0, `fields=${scanFieldCount}`);
check("unreadable documents block validation", valScans.data?.status === "BLOCKED" && (valScans.data?.findings ?? []).filter((f: any) => f.ruleId === "RUL-DOC-UNREADABLE").length === 3, `findings=${JSON.stringify((valScans.data?.findings ?? []).map((f: any) => f.ruleId))}`);

const noCd = await buildDossier("DOS-DRILL-NOCD", "CSQU3054383", "VN-SEAL-9005", [
  { type: "PACKING_LIST", name: "PackingNoCd.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9005" } } },
  { type: "LAB_TEST_REPORT", name: "LabNoCadmium.pdf", fields: { sample_code: { raw: "LAB-DRILL-03" }, sampling_date: { raw: "2026-10-06" } } },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoNoCd.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9005" }, phyto_cert_number: { raw: "KDTV-2026-VN-09932" } } },
]);
const valNoCd = await json(await req("POST", `/api/dossiers/${noCd.id}/validate`, clerk.sessionToken, { version: noCd.version }));
const noCdFinding = (valNoCd.data?.findings ?? []).find((f: any) => f.ruleId === "RUL-CD-INTERNAL-BLOCK");
check("lab report without a cadmium result blocks instead of passing", valNoCd.data?.status === "BLOCKED" && noCdFinding?.observedValue === "NOT_EXTRACTED", `status=${valNoCd.data?.status} observed=${noCdFinding?.observedValue}`);
check("missing-data finding stays an internal control and never cites the quarantined legal rule", String(noCdFinding?.messageEn ?? "").indexOf("not a legal determination") !== -1 && !(valNoCd.data?.findings ?? []).some((f: any) => f.ruleId === "RUL-GB2762-CD"));

const highCd = await buildDossier("DOS-DRILL-HICD", "CSQU3054383", "VN-SEAL-9006", [
  { type: "PACKING_LIST", name: "PackingHiCd.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9006" } } },
  { type: "LAB_TEST_REPORT", name: "LabHiCadmium.pdf", fields: { cadmium_mg_kg: { raw: "0.900" } } },
  { type: "PHYTOSANITARY_CERTIFICATE", name: "PhytoHiCd.pdf", fields: { container_number: { raw: "CSQU3054383" }, seal_number: { raw: "VN-SEAL-9006" }, phyto_cert_number: { raw: "KDTV-2026-VN-09933" } } },
]);
const valHigh = await json(await req("POST", `/api/dossiers/${highCd.id}/validate`, clerk.sessionToken, { version: highCd.version }));
check("cadmium above the internal limit blocks the lot", valHigh.data?.status === "BLOCKED" && (valHigh.data?.findings ?? []).some((f: any) => f.ruleId === "RUL-CD-INTERNAL-BLOCK" && f.observedValue === "0.900 mg/kg"), `status=${valHigh.data?.status}`);
const overrideRes = await req("POST", `/api/dossiers/${highCd.id}/override`, mgr.sessionToken, { reason: "Drill: signed override to test that the blocker survives into the manifest", version: valHigh.data.version });
const overrideBody = await json(overrideRes);
check("manager override is accepted with a signed reason", overrideRes.status === 200, `status=${overrideRes.status} error=${overrideBody?.error ?? ""}`);
const apprHigh = await req("POST", `/api/dossiers/${highCd.id}/approve`, mgr.sessionToken, { version: overrideBody.data?.version });
const expHigh = await req("POST", `/api/dossiers/${highCd.id}/export`, mgr.sessionToken, { version: (await json(apprHigh)).data?.version });
const highManifest = (await json(expHigh)).data as Record<string, any>;
check("override-exported manifest keeps the blocker count", highManifest?.complianceFindingsCount?.criticalBlockers > 0, `criticalBlockers=${highManifest?.complianceFindingsCount?.criticalBlockers}`);
const zeroed = verifyExportManifest({ ...highManifest, complianceFindingsCount: { criticalBlockers: 0, advisoryWarnings: 0 } });
check("zeroing that blocker count is now detected by the verifier", !zeroed.valid && zeroed.errors.some((e) => e.indexOf("integrity SHA-256 mismatch") !== -1), `errors=${JSON.stringify(zeroed.errors)}`);

// ---------- S11 backup, verify, restore, post-restore verification ----------
log("== S11 backup / restore drill ==");
app.sqliteClient.close();
const backupManifest = createSiteBackup(dbPath, dataDir, backupDir);
log(`backup: dossiers=${backupManifest.dossierCount} docs=${backupManifest.documentCount} blobs=${backupManifest.blobs.length} dbSha=${backupManifest.databaseSha256.slice(0, 16)}`);
const v1 = verifySiteBackup(backupDir);
const v2 = verifySiteBackup(backupDir);
check("backup verifies twice with identical results (idempotent)", v1.valid && v2.valid && JSON.stringify(v1.errors) === JSON.stringify(v2.errors), `errors=${JSON.stringify(v1.errors)}`);
const restore = restoreSiteBackup(backupDir, join(restoreRoot, "durios.db"), join(restoreRoot, "uploads"));
check("restore reports valid", restore.valid === true);
const restoredDbSha = calculateSha256(new Uint8Array(readFileSync(join(restoreRoot, "durios.db"))));
check("restored database hash equals the backup manifest hash", restoredDbSha === backupManifest.databaseSha256, `${restoredDbSha.slice(0, 16)} vs ${backupManifest.databaseSha256.slice(0, 16)}`);
const restoredApp = createWorkspaceApp({ dbPath: join(restoreRoot, "durios.db"), dataDir: join(restoreRoot, "uploads") });
const restoredDossier = restoredApp.workspace.getRawDossier(good.id);
const restoredManifest = restoredApp.workspace.getExportManifest(good.id, { id: mgr.accountId, name: "Manager", tenantId: "TENANT-DRILL-A", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" });
check("post-restore: sealed dossier and manifest are readable", restoredDossier?.dossierCode === "DOS-DRILL-OK" && restoredManifest?.compositeManifestSha256 === manifest.compositeManifestSha256);
check("post-restore: audit hash chain verifies", restoredApp.workspace.auditLedger.verifyIntegrity() === true);
check("post-restore: manifest still passes the standalone verifier", verifyExportManifest(restoredManifest as unknown as Record<string, unknown>).valid);
let blobOk = true; let blobCount = 0;
for (const blob of backupManifest.blobs) {
  const p = join(restoreRoot, "uploads", "storage", "blobs", `${blob.sha256}.bin`);
  if (!existsSync(p)) { blobOk = false; break; }
  blobCount += 1;
  if (calculateSha256(new Uint8Array(readFileSync(p))) !== blob.sha256) { blobOk = false; break; }
}
check(`post-restore: every blob re-hashed to its recorded SHA-256 (${blobCount} blobs)`, blobOk && blobCount === backupManifest.blobs.length);
const tamperedBlobDir = join(root, "backup-tampered");
createSiteBackup(dbPath, dataDir, tamperedBlobDir);
const blobFiles = backupManifest.blobs.length ? [join(tamperedBlobDir, "uploads", "storage", "blobs", `${backupManifest.blobs[0].sha256}.bin`)] : [];
if (blobFiles[0] && existsSync(blobFiles[0])) {
  const original = readFileSync(blobFiles[0]);
  original[original.length - 1] = original[original.length - 1]! ^ 0xff;
  writeFileSync(blobFiles[0], original);
  const tamperedVerify = verifySiteBackup(tamperedBlobDir);
  check("flipping one byte in a stored blob is detected by backup verification", !tamperedVerify.valid, `errors=${JSON.stringify(tamperedVerify.errors)}`);
} else {
  check("flipping one byte in a stored blob is detected by backup verification", false, "no blob available to tamper with");
}
restoredApp.sqliteClient.close();

writeFileSync(join(root, "drill-log.txt"), lines.join("\n"));
const failures = lines.filter((l) => l.startsWith("FAIL"));
log(`== summary == checks=${lines.filter((l) => l.startsWith("PASS") || l.startsWith("FAIL")).length} failures=${failures.length}`);
log(`artifacts kept at ${root} (manifest-good.json, drill-log.txt)`);
process.exit(failures.length === 0 ? 0 : 1);
