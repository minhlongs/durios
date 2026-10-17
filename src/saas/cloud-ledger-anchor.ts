import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuditEvent } from "../domain/types.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export interface CloudLedgerAnchorReceipt {
  readonly anchorVersion: "1.0.0";
  readonly anchorMode: "LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA";
  readonly anchorId: string;
  readonly tenantId: string;
  readonly dossierId: string;
  readonly anchoredEventId: string;
  readonly anchoredEventHash: string;
  readonly anchoredSequenceLength: number;
  readonly anchoredAtIso: string;
  readonly authoritySignatureSha256: string;
}

export function anchorAuditLedgerHeadToCloud(
  tenantId: string,
  dossierId: string,
  dossierEvents: readonly AuditEvent[],
  env: Record<string, string | undefined> = process.env,
  anchoredAtIso = new Date().toISOString()
): CloudLedgerAnchorReceipt {
  const sub = resolveSaasSubscriptionStatus(env, anchoredAtIso, tenantId);
  if (!sub.licenseValid) {
    throw new Error(
      "Cloud Ledger Timestamping Authority requires an active PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription."
    );
  }

  const signingKey = (
    env.DURIOS_LEDGER_ANCHOR_SIGNING_KEY ?? env.DURIOS_TSA_SIGNING_SECRET
  )?.trim();
  if (!signingKey || signingKey.length < 16) {
    throw new Error(
      "Explicit DURIOS_LEDGER_ANCHOR_SIGNING_KEY (min 16 characters) is required to sign a ledger anchor receipt."
    );
  }

  if (dossierEvents.length === 0) {
    throw new Error("Cannot anchor an empty audit event chain.");
  }

  const headEvent = dossierEvents[dossierEvents.length - 1]!;
  if (headEvent.tenantId !== tenantId || headEvent.dossierId !== dossierId) {
    throw new Error(
      "Audit event head tenantId/dossierId does not match requested anchor target."
    );
  }

  const anchorId = `ANC-${dossierId}-${dossierEvents.length}`;
  const payload = `${anchorId}|${tenantId}|${dossierId}|${headEvent.id}|${headEvent.eventHash}|${dossierEvents.length}|${anchoredAtIso}`;
  const authoritySignatureSha256 = createHmac("sha256", signingKey)
    .update(payload, "utf-8")
    .digest("hex");

  return {
    anchorVersion: "1.0.0",
    anchorMode: "LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA",
    anchorId,
    tenantId,
    dossierId,
    anchoredEventId: headEvent.id,
    anchoredEventHash: headEvent.eventHash,
    anchoredSequenceLength: dossierEvents.length,
    anchoredAtIso,
    authoritySignatureSha256,
  };
}

export function verifyCloudLedgerAnchorReceipt(
  receipt: CloudLedgerAnchorReceipt,
  currentHeadEventHash: string,
  env: Record<string, string | undefined> = process.env,
  expectedTenantId?: string
): boolean {
  const signingKey = (
    env.DURIOS_LEDGER_ANCHOR_SIGNING_KEY ?? env.DURIOS_TSA_SIGNING_SECRET
  )?.trim();
  if (
    !signingKey ||
    signingKey.length < 16 ||
    receipt.anchorMode !== "LOCAL_HMAC_SHA256_RECEIPT_NOT_RFC3161_TSA" ||
    receipt.anchoredEventHash !== currentHeadEventHash ||
    (expectedTenantId !== undefined && receipt.tenantId !== expectedTenantId)
  ) {
    return false;
  }

  const payload = `${receipt.anchorId}|${receipt.tenantId}|${receipt.dossierId}|${receipt.anchoredEventId}|${receipt.anchoredEventHash}|${receipt.anchoredSequenceLength}|${receipt.anchoredAtIso}`;
  const expectedSig = createHmac("sha256", signingKey).update(payload, "utf-8").digest("hex");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  const providedBuf = Buffer.from(receipt.authoritySignatureSha256 ?? "", "utf-8");
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}
