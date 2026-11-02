import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { Window } from "happy-dom";

// Resolve the served UI relative to this file, so the probe runs from any checkout:
//   mkdir -p /tmp/ui-probe && cd /tmp/ui-probe && npm init -y && npm i happy-dom@21.0.4
//   cp <repo>/docs/reports/arena-stage0-20261029/evidence/ui-render-probe.mjs /tmp/ui-probe/
//   cd /tmp/ui-probe && DURIOS_UI_HTML=<repo>/src/server/public/index.html node ui-render-probe.mjs
// (The copy is needed because Node resolves bare imports next to the SCRIPT, not the cwd;
//  DURIOS_UI_HTML then points it back at the repository's served UI.)
const HTML_PATH = process.env.DURIOS_UI_HTML
  ?? new URL("../../../../src/server/public/index.html", import.meta.url).pathname;
const html = readFileSync(HTML_PATH, "utf-8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

const window = new Window({ url: "http://127.0.0.1:3000/", settings: { disableJavaScriptEvaluation: true } });
window.document.write(html);
// No server is listening inside the probe: every call resolves to a failed request so
// rendering paths that depend on live data are exercised with explicit fixtures instead.
window.fetch = async () => ({ ok: false, status: 500, json: async () => ({ success: false }), text: async () => "", headers: { get: () => null } });
const runtimeErrors = [];
window.addEventListener("error", (event) => runtimeErrors.push(String(event.message)));
window.eval(`${script}\n;globalThis.__h = { ui, renderEmptyWorkspace, renderPilotKpiSection, currentRole, runPilotRehearsalBootstrap, escapeHtml };`);

const ev = (code) => window.eval(`__h.${code}`);
const setUi = (patch) => window.eval(`Object.assign(__h.ui, ${patch});`);
const workspaceHtml = () => window.document.getElementById("workspace-main")?.innerHTML ?? "";

const results = [];
function report(label, fragment, forbidden, required) {
  const foundForbidden = forbidden.filter((needle) => fragment.includes(needle));
  const missingRequired = required.filter((needle) => !fragment.includes(needle));
  const ok = foundForbidden.length === 0 && missingRequired.length === 0;
  results.push({ label, ok, foundForbidden, missingRequired });
  return ok;
}

const syntheticKpi = {
  evaluatedAt: "2026-10-29T00:00:00.000Z", totalContainers: 5, reconciledCount: 5, meanDeltaSeconds: 0.42,
  underFiveMinuteGate: true, underThreeMinuteTarget: true, blindFaultCount: 2, blindFaultsCaught: 2,
  zeroMissGate: true, gate05Passed: true, containerMetrics: [],
  timingEvidenceSource: "SYSTEM_TIMESTAMPS", valueMetricsProvenance: "UNVALIDATED_ASSUMPTION",
  aggregateValueMetrics: { assumptions: [{ key: "MANUAL_BASELINE_MINUTES", value: 35, status: "UNVALIDATED_ASSUMPTION" }] },
};
// Gate payloads carry BOTH counts and the per-gate split, because the UI must never render
// one number for two different questions (machine-checkable criteria vs evidenced launch gates).
const rehearsalGates = {
  evaluatedAt: "2026-10-29T00:00:00.000Z", goForLiveCustomerData: false, passedCount: 5, totalGates: 5,
  machineChecksPassedCount: 5, operationalGatesEvidencedCount: 0,
  evidenceProvenance: "SYNTHETIC_REHEARSAL",
  gates: [
    { gateId: "GATE-01", title: "Tiếp cận Vựa", passed: true, statusLabel: "PASS_SYNTHETIC_REHEARSAL", detail: "diễn tập",
      machineCheck: { passed: true, criteria: ["Tệp tại DURIOS_GATE01_CONSENT_FILE tồn tại"] },
      externalEvidence: { required: ["Biên bản tiếp cận vựa do chủ vựa xác nhận"], recorded: [], status: "PENDING_OPERATOR_EVIDENCE" },
      gateVerdict: "MACHINE_CHECK_ONLY" },
    { gateId: "GATE-03", title: "Bảo mật On-Prem", passed: true, statusLabel: "PASS_SYNTHETIC_REHEARSAL", detail: "loopback",
      machineCheck: { passed: true, criteria: ["DURIOS_HOST là loopback", "verifyIntegrity() === true"] },
      externalEvidence: { required: ["Reverse proxy HTTPS với NODE_ENV=production"], recorded: [], status: "PENDING_OPERATOR_EVIDENCE" },
      gateVerdict: "MACHINE_CHECK_ONLY" },
  ],
};
const operationalGates = {
  evaluatedAt: "2026-10-29T00:00:00.000Z", goForLiveCustomerData: false, passedCount: 2, totalGates: 5,
  machineChecksPassedCount: 2, operationalGatesEvidencedCount: 0,
  evidenceProvenance: "OPERATIONAL",
  gates: [{ gateId: "GATE-03", title: "Bảo mật On-Prem", passed: false, statusLabel: "SECURITY_CONFIG_INCOMPLETE", detail: "AuditChainValid=false",
    machineCheck: { passed: false, criteria: ["DURIOS_HOST là loopback", "verifyIntegrity() === true"] },
    externalEvidence: { required: ["Reverse proxy HTTPS với NODE_ENV=production"], recorded: [], status: "PENDING_OPERATOR_EVIDENCE" },
    gateVerdict: "PENDING" }],
};

const FORBIDDEN_CLAIMS = ["5/5 CỔNG PASS", "5/5 CỔNG ĐẠT", "5/5 CỔNG ĐỦ BẰNG CHỨNG", "5/5 cổng đủ bằng chứng",
  "94.67%", "WORM", "Tiến độ thực tế tại vựa", "< 3 Phút", "&lt; 3 Phút", "GATE-01..GATE-05 Đạt Chuẩn"];

// A. no pilot data at all
setUi("{ pilotKpi: null, pilotGates: null }");
ev("renderEmptyWorkspace()");
const emptyNoData = workspaceHtml();
report("A. empty state with no gate/KPI data reads PENDING instead of asserting results", emptyNoData,
  FORBIDDEN_CLAIMS, ["CHƯA ĐÁNH GIÁ", "CHƯA ĐO", "TỔNG HỢP (SYNTHETIC)"]);

// B. after a synthetic rehearsal
setUi(`{ pilotKpi: ${JSON.stringify(syntheticKpi)}, pilotGates: ${JSON.stringify(rehearsalGates)} }`);
ev("renderEmptyWorkspace()");
const rehearsalEmpty = workspaceHtml();
report("B. empty state after a synthetic rehearsal labels the evidence as rehearsal", rehearsalEmpty,
  FORBIDDEN_CLAIMS, ["0/5 CỔNG ĐỦ BẰNG CHỨNG", "Kiểm tra tự động (máy chấm được): 5/5",
    "Bằng chứng diễn tập tổng hợp", "0.42s / cont", "dấu thời gian hệ thống"]);

// C. operational run that has not passed every gate
setUi(`{ pilotKpi: null, pilotGates: ${JSON.stringify(operationalGates)} }`);
ev("renderEmptyWorkspace()");
report("C. empty state with an operational run whose 2 machine checks are not 2 cleared gates", workspaceHtml(),
  ["5/5 CỔNG PASS", "5/5 CỔNG ĐỦ BẰNG CHỨNG", "CHUỖI BĂM HỢP LỆ"],
  ["0/5 CỔNG ĐỦ BẰNG CHỨNG", "Kiểm tra tự động (máy chấm được): 2/5",
    "cấm nạp dữ liệu khách hàng thật", "CHƯA XÁC MINH"]);

// D. KPI section provenance
setUi(`{ pilotKpi: ${JSON.stringify(syntheticKpi)}, pilotGates: ${JSON.stringify(rehearsalGates)} }`);
const kpiSection = String(ev("renderPilotKpiSection()"));
report("D. KPI badge shows both counts and the callout explains the difference", kpiSection,
  [], ["LAUNCH GATE: 0/5 cổng đủ bằng chứng", "MÁY CHẤM: 5/5", "Hai con số khác nhau",
    "SYSTEM_TIMESTAMPS", "GIẢ ĐỊNH CHƯA KIỂM CHỨNG", "DIỄN TẬP TỔNG HỢP"]);

// E. currentRole follows the server session, not the local select
window.eval("document.getElementById('actor-role').value = 'MANAGER'; __h.ui.actor = null;");
const anonRole = ev("currentRole()");
window.eval("__h.ui.actor = { id: 'ACT-1', name: 'Clerk', role: 'CLERK', tenantId: 'T', tenantType: 'PACKHOUSE_EXPORTER', persona: 'PACKHOUSE_CLERK' };");
const sessionRole = ev("currentRole()");
const selectAfterSession = window.eval("document.getElementById('actor-role').value");
window.eval("__h.ui.actor = { id: 'ACT-2', name: 'Auditor', role: 'AUDITOR', tenantId: 'T', tenantType: 'INSPECTION_AUDITOR', persona: 'SYSTEM_AUDITOR' };");
const auditorRole = ev("currentRole()");
const selectWithUnknownRole = window.eval("document.getElementById('actor-role').value");
report(`E. currentRole(): anonymous=${anonRole}, CLERK session=${sessionRole} (select synced to ${selectAfterSession}), AUDITOR session=${auditorRole} (select kept ${selectWithUnknownRole})`,
  JSON.stringify({ anonRole, sessionRole, selectAfterSession, auditorRole }),
  [], []);
const roleOk = anonRole === "MANAGER" && sessionRole === "CLERK" && selectAfterSession === "CLERK"
  && auditorRole === "AUDITOR" && selectWithUnknownRole === "CLERK";
results[results.length - 1].ok = roleOk;
results[results.length - 1].missingRequired = roleOk ? [] : ["role resolution mismatch"];

// F. rehearsal toast derives from the response
const fnSource = ev("runPilotRehearsalBootstrap.toString()");
report("F. rehearsal toast is derived from the server response, not a fixed 5/5 claim", String(fnSource),
  ["5/5 Gates PASS"], ["passedGateCount", "evidenceProvenance", "goForLiveCustomerData"]);

// G. per-gate rows keep the machine check, the operator evidence and the verdict apart
report("G. each gate row states machine check, operator evidence and verdict separately", kpiSection,
  [], ["[Máy chấm: PASS · Bằng chứng vận hành: PENDING_OPERATOR_EVIDENCE · Kết luận: MACHINE_CHECK_ONLY]",
    "(PASS_SYNTHETIC_REHEARSAL)", "Reverse proxy HTTPS với NODE_ENV=production"]);

// Rendered snapshots are debugging aids, not deliverables: they go to DURIOS_UI_OUT
// (default: the system temp dir) so the probe never writes into a checkout.
const OUT_DIR = process.env.DURIOS_UI_OUT ?? tmpdir();
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/empty-state-no-data.html`, emptyNoData);
writeFileSync(`${OUT_DIR}/empty-state-rehearsal.html`, rehearsalEmpty);

for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
  if (r.foundForbidden.length) console.log(`        forbidden present: ${JSON.stringify(r.foundForbidden)}`);
  if (r.missingRequired.length) console.log(`        required missing:  ${JSON.stringify(r.missingRequired)}`);
}
console.log(runtimeErrors.length ? `runtime error events: ${runtimeErrors.join(" | ")}` : "no runtime error events");
const allOk = results.every((r) => r.ok) && runtimeErrors.length === 0;
console.log(allOk ? "\nUI RENDER PROBE: ALL PASS" : "\nUI RENDER PROBE: FAILURES PRESENT");
process.exit(allOk ? 0 : 1);
