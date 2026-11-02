import type { SingleSiteLaunchGateReport } from "../auth/pilot-launch-gate-verifier.js";
import type { FieldAuditorChecklistItem } from "../domain/pilot-dossier-pack-types.js";

/**
 * One checklist item per launch gate. An item is `VERIFIED_READY` only when the gate itself is
 * `EVIDENCED_FOR_LAUNCH` — a passed machine check without recorded operator evidence stays
 * `ACTION_REQUIRED`, and the detail line names both halves so the pack cannot be read as
 * "the machine approved this".
 */
export function buildChecklistFromGates(gateReport: SingleSiteLaunchGateReport): readonly FieldAuditorChecklistItem[] {
  const [g1, g2, g3, g4, g5] = gateReport.gates;
  return [
    { itemId: "CHK-01", linkedGateId: "GATE-01", category: "PDPL_CONSENT", titleVi: "Biên bản chấp thuận xử lý dữ liệu tại vựa & phê duyệt địa điểm", titleEn: "Signed Site Data Processing Consent & Site Approval", statutoryReference: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15", status: g1.gateVerdict === "EVIDENCED_FOR_LAUNCH" ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g1.gateVerdict === "EVIDENCED_FOR_LAUNCH", evidenceDetail: `${g1.detail} [Máy chấm: ${g1.machineCheck.passed ? "PASS" : "FAIL"} | Bằng chứng vận hành: ${g1.externalEvidence.status}]` },
    { itemId: "CHK-02", linkedGateId: "GATE-02", category: "OTP_CHANNEL", titleVi: "Xác thực kênh OTP thật (Zalo ZNS / SMS) hoặc khóa fail-closed", titleEn: "Verified Live OTP Channel or Fail-Closed Gate", statutoryReference: "Luật Giao dịch điện tử 20/2023/QH15", status: g2.gateVerdict === "EVIDENCED_FOR_LAUNCH" ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g2.gateVerdict === "EVIDENCED_FOR_LAUNCH", evidenceDetail: `${g2.detail} [Máy chấm: ${g2.machineCheck.passed ? "PASS" : "FAIL"} | Bằng chứng vận hành: ${g2.externalEvidence.status}]` },
    { itemId: "CHK-03", linkedGateId: "GATE-03", category: "ONPREM_LOOPBACK_AUDIT", titleVi: "Ràng buộc mạng cục bộ 127.0.0.1 & toàn vẹn chuỗi băm sổ cái", titleEn: "On-Prem 127.0.0.1 Loopback Binding & Audit Hash-Chain Integrity", statutoryReference: "GATE-03 On-Prem Security Runbook", status: g3.gateVerdict === "EVIDENCED_FOR_LAUNCH" ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g3.gateVerdict === "EVIDENCED_FOR_LAUNCH", evidenceDetail: `${g3.detail} [Máy chấm: ${g3.machineCheck.passed ? "PASS" : "FAIL"} | Bằng chứng vận hành: ${g3.externalEvidence.status}]` },
    { itemId: "CHK-04", linkedGateId: "GATE-04", category: "BACKUP_RESTORE_DRILL", titleVi: "Diễn tập sao lưu & khôi phục khớp 100% mã băm SHA-256", titleEn: "Verified Site Backup & Restore Drill (100% SHA-256 Match)", statutoryReference: "GATE-04 Backup & Restore Protocol", status: g4.gateVerdict === "EVIDENCED_FOR_LAUNCH" ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g4.gateVerdict === "EVIDENCED_FOR_LAUNCH", evidenceDetail: `${g4.detail} [Máy chấm: ${g4.machineCheck.passed ? "PASS" : "FAIL"} | Bằng chứng vận hành: ${g4.externalEvidence.status}]` },
    { itemId: "CHK-05", linkedGateId: "GATE-05", category: "REHEARSAL_AND_BLIND_FAULTS", titleVi: "Diễn tập 5 container (< 5 phút/container) & chặn 100% lỗi gài mù", titleEn: "5-Container Rehearsal (< 5 min/container) & 100% Blind-Fault Catch", statutoryReference: "GATE-05 Pilot KPI Protocol", status: g5.gateVerdict === "EVIDENCED_FOR_LAUNCH" ? "VERIFIED_READY" : "ACTION_REQUIRED", passed: g5.gateVerdict === "EVIDENCED_FOR_LAUNCH", evidenceDetail: `${g5.detail} [Máy chấm: ${g5.machineCheck.passed ? "PASS" : "FAIL"} | Bằng chứng vận hành: ${g5.externalEvidence.status}]` },
  ];
}
