import { createHmac, timingSafeEqual } from "node:crypto";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { ContainerDossier, AuditEvent } from "../domain/types.js";
import {
  compileVerifiedOrganizationProfile,
  type VerifiedOrganizationProfile,
} from "../sharing/verified-org-profile.js";

export interface WorkspacePortabilityPayload {
  readonly bundleVersion: "1.0.0";
  readonly exportedAt: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantType: string;
  readonly profile: VerifiedOrganizationProfile;
  readonly dossiersSummary: readonly {
    readonly id: string;
    readonly dossierCode: string;
    readonly containerNumber: string;
    readonly lifecycleState: string;
    readonly isImmutable: boolean;
    readonly createdAt: string;
  }[];
  readonly auditEventsDigestSha256: string;
  readonly totalDossiersCount: number;
}

export interface SignedWorkspacePortabilityBundle {
  readonly payload: WorkspacePortabilityPayload;
  readonly payloadSha256: string;
  readonly hmacSignatureSha256?: string | undefined;
}

export function exportWorkspacePortabilityBundle(
  tenantId: string, tenantName: string, tenantType: string, dossiers: readonly ContainerDossier[], auditEvents: readonly AuditEvent[], portabilitySecret?: string, nowIso = new Date().toISOString()
): SignedWorkspacePortabilityBundle {
  const profile = compileVerifiedOrganizationProfile(tenantId, tenantName, tenantType, dossiers, nowIso);
  const dossiersSummary = dossiers.map((d) => ({ id: d.id, dossierCode: d.dossierCode, containerNumber: d.containerNumber, lifecycleState: d.lifecycleState, isImmutable: d.isImmutable, createdAt: d.createdAt }));
  const eventsConcat = auditEvents.map((e) => e.eventHash).join("|");
  const auditEventsDigestSha256 = calculateSha256(eventsConcat);
  const payload: WorkspacePortabilityPayload = { bundleVersion: "1.0.0", exportedAt: nowIso, tenantId, tenantName, tenantType, profile, dossiersSummary, auditEventsDigestSha256, totalDossiersCount: dossiers.length };
  const payloadJson = JSON.stringify(payload);
  const payloadSha256 = calculateSha256(payloadJson);
  let hmacSignatureSha256: string | undefined;
  if (portabilitySecret && portabilitySecret.trim().length >= 16) hmacSignatureSha256 = createHmac("sha256", portabilitySecret.trim()).update(payloadSha256).digest("hex");
  return { payload, payloadSha256, hmacSignatureSha256 };
}

export function verifyWorkspacePortabilityBundle(
  bundle: SignedWorkspacePortabilityBundle,
  portabilitySecret?: string
): { readonly valid: boolean; readonly error?: string } {
  const calculatedHash = calculateSha256(JSON.stringify(bundle.payload));
  if (calculatedHash !== bundle.payloadSha256) {
    return { valid: false, error: "Bundle payload SHA-256 hash mismatch." };
  }

  if (portabilitySecret && bundle.hmacSignatureSha256) {
    const expectedHmac = createHmac("sha256", portabilitySecret.trim())
      .update(calculatedHash)
      .digest("hex");
    const expectedBuf = Buffer.from(expectedHmac, "utf-8");
    const providedBuf = Buffer.from(bundle.hmacSignatureSha256, "utf-8");
    if (
      expectedBuf.length !== providedBuf.length ||
      !timingSafeEqual(expectedBuf, providedBuf)
    ) {
      return { valid: false, error: "HMAC signature verification failed." };
    }
  }

  return { valid: true };
}
