import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculateSha256 } from "../../src/ingestion/document-hasher.js";
import type { GateEvidenceOverride } from "../../src/auth/pilot-gate-types.js";
import type { FounderPilotAuthorizationRecord } from "../../src/auth/pilot-lifecycle-types.js";

/**
 * Operator-recorded evidence for the launch gates: a real file plus the human who recorded it.
 *
 * Nothing here is machine-derived, and the system never judges what the file *means* — it checks
 * that a file exists, records its size and SHA-256, and names who declared it
 * (`RECORDED_BY_OPERATOR`). Tests use these fixtures to prove a gate opens only when both halves
 * exist: a passed machine check and a recorded human artifact.
 *
 * The files are plain text written by the test, exactly like the artifacts a real operator would
 * have to supply. They carry no signature and no field verification.
 */
export function createOperatorEvidence(dir: string, attestedBy = "Người vận hành vựa Cai Lậy (ký 2026-10-30)"): Readonly<Record<string, GateEvidenceOverride>> {
  mkdirSync(dir, { recursive: true });
  const artifacts: ReadonlyArray<[string, string, string]> = [
    ["GATE-01", "gate01-site-consent-signed.md", "Biên bản tiếp cận vựa + Biểu mẫu chấp thuận dữ liệu 91/2025/QH15 (fixture)"],
    ["GATE-02", "gate02-otp-staging-trial.md", "Biên bản gửi/nhận OTP thật trên staging (fixture)"],
    ["GATE-03", "gate03-onprem-network-attestation.md", "Reverse proxy HTTPS, giới hạn mạng, mã hóa đĩa, secrets 0600 (fixture)"],
    ["GATE-04", "gate04-backup-restore-drill-minutes.md", "Biên bản diễn tập backup/verify/restore có người ký (fixture)"],
    ["GATE-05", "gate05-stopwatch-5-containers.md", "Biên bản bấm giờ 5 container + 2 ca gài lỗi mù (fixture)"],
  ];
  const evidence: Record<string, GateEvidenceOverride> = {};
  for (const [gateId, fileName, body] of artifacts) {
    const filePath = join(dir, fileName);
    writeFileSync(filePath, `# ${gateId}\n${body}\n`, "utf-8");
    evidence[gateId] = { filePath, attestedBy };
  }
  return evidence;
}

/** Evidence declarations pointing at paths that do not exist — must never count as recorded. */
export const MISSING_FILE_EVIDENCE: Readonly<Record<string, GateEvidenceOverride>> = {
  "GATE-01": { filePath: "/nonexistent/gate01-consent.pdf", attestedBy: "Người vận hành" },
  "GATE-03": { filePath: "/nonexistent/gate03-attestation.pdf", attestedBy: "Người vận hành" },
};

/** Provider configuration that makes the GATE-02 machine check pass without sending any OTP. */
export const OTP_CONFIGURED_ENV: Readonly<Record<string, string>> = {
  DURIOS_HOST: "127.0.0.1",
  DURIOS_OTP_PROVIDER: "ESMS",
  DURIOS_OTP_API_URL: "https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/",
  DURIOS_OTP_API_KEY: "LIVE_KEY_01",
};

export const GATE_EVIDENCE_PENDING_LABEL = "MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE";

export function createValidFounderAuth(
  gate05AFilePath: string,
  overrides: Partial<FounderPilotAuthorizationRecord> = {}
): FounderPilotAuthorizationRecord {
  return {
    authorizationVersion: "1.0.0",
    authorizationId: "AUTH-CAILAY-TEST-01",
    siteCode: "SITE-CAILAY-TIENGIANG-01",
    tenantId: "TENANT-CAILAY-PILOT-01",
    authorizedBy: "Founder Minh Long",
    authorizedAt: "2026-10-01T00:00:00.000Z",
    expiresAt: "2027-12-31T23:59:59.000Z",
    maxContainers: 5,
    gate05AEvidenceSha256: calculateSha256(readFileSync(gate05AFilePath)),
    ...overrides,
  };
}

