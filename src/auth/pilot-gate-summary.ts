import type { SingleSiteLaunchGateReport } from "./pilot-gate-types.js";

/**
 * One report, two answers, printed so they cannot be read as the same thing.
 *
 * "2/5" from a staging box means two machine-checkable criteria passed. It says nothing
 * about whether any launch gate is cleared: a gate opens only when the machine check
 * passes AND a human recorded the evidence the documented criterion requires.
 */
export function formatGateCounts(machine: number, evidenced: number, total: number): string {
  return `KIỂM TRA TỰ ĐỘNG (máy chấm được): ${machine}/${total} tiêu chí đạt\n` +
    `LAUNCH GATE VẬN HÀNH (đủ bằng chứng hợp lệ): ${evidenced}/${total} cổng được mở`;
}

const VERDICT_LABEL: Record<string, string> = {
  EVIDENCED_FOR_LAUNCH: "ĐÃ MỞ (máy đạt + người ghi nhận bằng chứng)",
  MACHINE_CHECK_ONLY: "CHỈ MÁY ĐẠT — thiếu bằng chứng vận hành",
  PENDING: "CHƯA ĐẠT",
};

const PROVENANCE_LABEL: Record<string, string> = {
  OPERATIONAL: "VẬN HÀNH",
  SYNTHETIC_REHEARSAL: "TỔNG HỢP/DIỄN TẬP",
  UNPROVEN_LEDGER_INTEGRITY: "KHÔNG CHỨNG MINH ĐƯỢC (sổ kiểm toán không toàn vẹn)",
};

/** Which data the run measured, and why — provenance comes from the audit ledger, not names. */
export function formatCohortProvenance(report: SingleSiteLaunchGateReport): string {
  const label = PROVENANCE_LABEL[report.evidenceProvenance] ?? report.evidenceProvenance;
  const integrity = report.ledgerIntegrityVerified ? "chuỗi băm kiểm toán: XÁC MINH ĐẠT" : "chuỗi băm kiểm toán: KHÔNG XÁC MINH ĐẠT";
  const provenance = report.cohortProvenance;
  if (!provenance) return `DỮ LIỆU ĐÁNH GIÁ: ${label} — ${integrity}`;
  const signals = provenance.synthetic
    ? ` — tín hiệu: ${provenance.signals.slice(0, 4).join(", ")}`
    : " — không có tín hiệu tổng hợp trong sổ kiểm toán";
  return `DỮ LIỆU ĐÁNH GIÁ: ${label} (${provenance.cohortSize} hồ sơ)${signals}; ${integrity}`;
}

export function summarizeGateReport(report: SingleSiteLaunchGateReport): string {
  const lines = [
    formatGateCounts(report.machineChecksPassedCount, report.operationalGatesEvidencedCount, report.totalGates),
    formatCohortProvenance(report),
    `VÒNG ĐỜI PILOT: ${report.pilotLifecycleState} (policyStatus=${report.policyStatus}, canStart5ContainerPilot=${report.canStartLimitedFiveContainerPilot}, quota=${report.liveContainerQuota.usedContainers}/${report.liveContainerQuota.maxContainers})`,
    `  GATE-05A (Diễn tập trước cutover): ${VERDICT_LABEL[report.gate05Split.gate05A.gateVerdict] ?? report.gate05Split.gate05A.gateVerdict}`,
    `  GATE-05B (Nghiệm thu 5 container thật): ${VERDICT_LABEL[report.gate05Split.gate05B.gateVerdict] ?? report.gate05Split.gate05B.gateVerdict}`,
    `  Ủy quyền Founder: ${report.founderAuthorization.status} — ${report.founderAuthorization.reason}`,
  ];
  for (const gate of report.gates) {
    const artifact = gate.externalEvidence.artifact;
    lines.push(
      `  ${gate.gateId}: ${VERDICT_LABEL[gate.gateVerdict] ?? gate.gateVerdict}` +
        ` (máy: ${gate.machineCheck.passed ? "PASS" : "FAIL"}; bằng chứng: ${gate.externalEvidence.status}` +
        `${artifact && artifact.isFile ? `, tệp ${artifact.bytes} byte SHA-256 ${artifact.sha256.slice(0, 16)}…` : ""})`
    );
    if (gate.gateVerdict !== "EVIDENCED_FOR_LAUNCH") {
      lines.push(`    còn thiếu: ${gate.externalEvidence.required.join("; ")}`);
    }
  }
  lines.push(
    report.goForLiveCustomerData
      ? "goForLiveCustomerData: true — cả 5 cổng có bằng chứng vận hành được ghi nhận (PILOT_COMPLETED)."
      : "goForLiveCustomerData: false — CHƯA được nạp dữ liệu khách hàng thật đại trà."
  );
  if (report.evidenceProvenance === "SYNTHETIC_REHEARSAL") {
    lines.push("evidenceProvenance: SYNTHETIC_REHEARSAL — bằng chứng do lệnh diễn tập tự tạo, không có giá trị phê duyệt.");
  } else if (report.evidenceProvenance === "UNPROVEN_LEDGER_INTEGRITY") {
    lines.push("evidenceProvenance: UNPROVEN_LEDGER_INTEGRITY — chuỗi băm kiểm toán không toàn vẹn nên không chứng minh được nguồn gốc dữ liệu; không cổng nào được ghi nhận bằng chứng. Phải khôi phục hoặc điều tra sổ kiểm toán trước.");
  }
  return lines.join("\n");
}
