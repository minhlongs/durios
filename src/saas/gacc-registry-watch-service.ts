import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { DossierExportManifest } from "../domain/types.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export type GaccApprovalStatus = "APPROVED_ACTIVE" | "SUSPENDED_BY_GACC" | "REVOKED";

export interface GaccCodeRegistryEntry {
  readonly code: string; readonly codeType: "PUC" | "PHC"; readonly province: string;
  readonly status: GaccApprovalStatus; readonly updatedAt: string;
  readonly suspensionReasonVi?: string | undefined;
}

export interface GaccWatchEvaluationResult {
  readonly allActive: boolean; readonly checkedPuc: string; readonly checkedPhc: string;
  readonly alertsVi: readonly string[];
}

export interface CrossBorderBuyerRoomLink {
  readonly roomId: string; readonly dossierId: string; readonly manifestSha256: string;
  readonly portalUrl: string; readonly supportedLocales: readonly ["vi-VN", "zh-CN", "en-US"];
  readonly expiresAt: string; readonly revocationTokenHash: string;
}

export function evaluateGaccRegistryWatch(
  pucCode: string,
  phcCode: string,
  env: Record<string, string | undefined> = process.env,
  snapshotFeed?: ReadonlyMap<string, GaccCodeRegistryEntry>,
  expectedTenantId?: string
): GaccWatchEvaluationResult {
  const sub = resolveSaasSubscriptionStatus(env, new Date().toISOString(), expectedTenantId);
  if (!sub.entitlements.gaccLiveRegistryWatch) {
    throw new Error("Live GACC Registry Watch requires a PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription.");
  }
  if (!snapshotFeed || snapshotFeed.size === 0) {
    throw new Error("GACC registry snapshot feed is required (no built-in live GACC feed configured).");
  }

  const alertsVi: string[] = [];
  const pucEntry = snapshotFeed.get(pucCode);
  const phcEntry = snapshotFeed.get(phcCode);

  if (!pucEntry) {
    alertsVi.push(`Mã vùng trồng '${pucCode}' không có trong danh mục GACC đã đồng bộ.`);
  } else if (pucEntry.status !== "APPROVED_ACTIVE") {
    alertsVi.push(
      `CẢNH BÁO KHẨN: Mã vùng trồng '${pucCode}' đang ở trạng thái '${pucEntry.status}' (${pucEntry.suspensionReasonVi ?? "Không được phép xuất khẩu"}).`
    );
  }

  if (!phcEntry) {
    alertsVi.push(`Mã cơ sở đóng gói '${phcCode}' không có trong danh mục GACC đã đồng bộ.`);
  } else if (phcEntry.status !== "APPROVED_ACTIVE") {
    alertsVi.push(`CẢNH BÁO KHẨN: Mã cơ sở đóng gói '${phcCode}' đang ở trạng thái '${phcEntry.status}'.`);
  }

  return { allActive: alertsVi.length === 0, checkedPuc: pucCode, checkedPhc: phcCode, alertsVi };
}

export function issueCrossBorderBuyerVerificationRoom(
  manifest: DossierExportManifest,
  shareGrantId: string,
  expiresAt: string,
  env: Record<string, string | undefined> = process.env,
  portalBaseUrl?: string
): CrossBorderBuyerRoomLink {
  const sub = resolveSaasSubscriptionStatus(env, new Date().toISOString(), manifest.tenantId);
  if (!sub.entitlements.crossBorderBuyerPortal) {
    throw new Error(
      "Managed Cross-Border Buyer Verification Portal requires a PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription."
    );
  }

  const trimmedGrantId = shareGrantId.trim();
  if (!trimmedGrantId) throw new Error("shareGrantId is required to issue a Cross-Border Buyer Verification Room.");

  const parsedExpiry = Date.parse(expiresAt);
  if (Number.isNaN(parsedExpiry) || parsedExpiry <= Date.now()) {
    throw new Error("expiresAt must be a valid future ISO timestamp.");
  }

  const baseUrl = (portalBaseUrl ?? env.DURIOS_BUYER_PORTAL_BASE_URL)?.trim();
  if (
    !baseUrl ||
    (!baseUrl.startsWith("https://") && !baseUrl.startsWith("http://127.0.0.1") && !baseUrl.startsWith("http://localhost"))
  ) {
    throw new Error(
      "Explicit buyer portal base URL (https://, http://127.0.0.1, or http://localhost) is required via portalBaseUrl or DURIOS_BUYER_PORTAL_BASE_URL."
    );
  }

  const roomId = `ROOM-${manifest.dossierCode}-${trimmedGrantId.slice(-6)}`;
  const revocationTokenHash = calculateSha256(`${roomId}|${manifest.compositeManifestSha256}|${expiresAt}`);
  const cleanBase = baseUrl.replace(/\/+$/, "");

  return {
    roomId, dossierId: manifest.dossierId, manifestSha256: manifest.compositeManifestSha256,
    portalUrl: `${cleanBase}/rooms/${roomId}?sig=${revocationTokenHash.slice(0, 24)}`,
    supportedLocales: ["vi-VN", "zh-CN", "en-US"], expiresAt, revocationTokenHash,
  };
}
