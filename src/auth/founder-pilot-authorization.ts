import { readFileSync } from "node:fs";
import { inspectEvidenceArtifact } from "./gate-evidence-artifact.js";
import type { FounderPilotAuthorizationRecord, FounderPilotAuthorizationStatus } from "./pilot-lifecycle-types.js";

export interface EvaluateFounderAuthInput {
  readonly filePath?: string | undefined;
  readonly recordOverride?: FounderPilotAuthorizationRecord | undefined;
  readonly expectedSiteCode: string;
  readonly expectedTenantId: string;
  readonly gate05AArtifactSha256?: string | undefined;
  readonly nowIso?: string | undefined;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseAuthorizationJson(raw: string): FounderPilotAuthorizationRecord | undefined {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (
      p.authorizationVersion !== "1.0.0" || !isNonEmptyString(p.authorizationId) ||
      !isNonEmptyString(p.siteCode) || !isNonEmptyString(p.tenantId) ||
      !isNonEmptyString(p.authorizedBy) || !isNonEmptyString(p.authorizedAt) ||
      !isNonEmptyString(p.expiresAt) || p.maxContainers !== 5
    ) return undefined;
    return p as unknown as FounderPilotAuthorizationRecord;
  } catch {
    return undefined;
  }
}

export function resolveFounderPilotAuthorization(input: EvaluateFounderAuthInput): FounderPilotAuthorizationStatus {
  const declaredPath = input.filePath?.trim() ?? "";
  if (!input.recordOverride && declaredPath === "") {
    return {
      status: "PENDING_FOUNDER_APPROVAL", valid: false,
      reason: "Chưa có quyết định phê duyệt của Founder (DURIOS_FOUNDER_PILOT_AUTH_FILE). Giữ trạng thái PENDING_FOUNDER_APPROVAL.",
    };
  }
  const artifact = declaredPath !== "" ? inspectEvidenceArtifact(declaredPath) : undefined;
  const artProp = artifact ? { artifact } : {};
  if (declaredPath !== "" && (!artifact || !artifact.exists || !artifact.isFile)) {
    return { status: "INVALID_SCOPE_OR_ARTIFACT", valid: false, reason: `Tệp quyết định Founder tại '${declaredPath}' không tồn tại hoặc không hợp lệ.`, ...artProp };
  }
  const record = input.recordOverride ?? (artifact ? parseAuthorizationJson(readFileSync(artifact.filePath, "utf-8")) : undefined);
  if (!record) {
    return { status: "INVALID_SCOPE_OR_ARTIFACT", valid: false, reason: "Cấu trúc JSON của quyết định Founder không hợp lệ hoặc maxContainers !== 5.", ...artProp };
  }
  if (record.revoked === true || isNonEmptyString(record.holdReason)) {
    return { status: "REVOKED_OR_HOLD", valid: false, reason: `Quyết định Founder đã bị thu hồi hoặc tạm dừng: ${record.holdReason ?? "revoked=true"}.`, record, ...artProp };
  }
  if (record.siteCode !== input.expectedSiteCode || record.tenantId !== input.expectedTenantId) {
    return { status: "INVALID_SCOPE_OR_ARTIFACT", valid: false, reason: `Sai phạm vi ủy quyền: yêu cầu '${input.expectedSiteCode}'/'${input.expectedTenantId}', tệp ghi '${record.siteCode}'/'${record.tenantId}'.`, record, ...artProp };
  }
  if (isNonEmptyString(record.gate05AEvidenceSha256) && record.gate05AEvidenceSha256 !== input.gate05AArtifactSha256) {
    return { status: "INVALID_SCOPE_OR_ARTIFACT", valid: false, reason: "Mã băm SHA-256 của biên bản GATE-05A không khớp với tệp quyết định Founder.", record, ...artProp };
  }
  const nowMs = Date.parse(input.nowIso ?? new Date().toISOString());
  const expMs = Date.parse(record.expiresAt);
  if (!Number.isFinite(expMs) || expMs <= nowMs) {
    return { status: "EXPIRED", valid: false, reason: `Quyết định Founder đã hết hạn tại '${record.expiresAt}'.`, record, ...artProp };
  }
  return {
    status: "AUTHORIZED_FOR_LIMITED_PILOT", valid: true,
    reason: `Đã có quyết định Founder '${record.authorizationId}' do '${record.authorizedBy}' ký cho phép tối đa 5 container tại '${record.siteCode}'.`,
    record, ...artProp,
  };
}
