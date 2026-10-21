import { createHmac, timingSafeEqual } from "node:crypto";
import type { DocumentType, ExtractedField } from "../domain/types.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export interface PartnerWebhookPayload {
  readonly webhookId: string; readonly idempotencyKey: string;
  readonly partnerCode: string; readonly partnerType: "ACCREDITED_CADMIUM_LAB" | "COLD_CHAIN_LOGISTICS";
  readonly tenantId: string; readonly dossierId: string; readonly documentId: string;
  readonly documentType: DocumentType; readonly reportedFields: Readonly<Record<string, string | number>>;
  readonly issuedAt: string; readonly signatureSha256: string;
}

export interface PartnerWebhookIngestionResult {
  readonly duplicateIgnored: boolean;
  readonly partnerCode: string;
  readonly candidateFields: readonly ExtractedField[];
}

function buildCanonicalPartnerWebhookPayload(payload: Omit<PartnerWebhookPayload, "signatureSha256">): string {
  const sortedReportedFields: Record<string, string | number> = {};
  for (const key of Object.keys(payload.reportedFields).sort()) sortedReportedFields[key] = payload.reportedFields[key]!;
  return JSON.stringify({ webhookId: payload.webhookId, idempotencyKey: payload.idempotencyKey, partnerCode: payload.partnerCode, partnerType: payload.partnerType, tenantId: payload.tenantId, dossierId: payload.dossierId, documentId: payload.documentId, documentType: payload.documentType, reportedFields: sortedReportedFields, issuedAt: payload.issuedAt });
}

export function signPartnerWebhookPayload(payload: Omit<PartnerWebhookPayload, "signatureSha256">, partnerSharedSecret: string): string {
  const secret = partnerSharedSecret.trim();
  if (secret.length < 16) throw new Error("Partner webhook shared secret must be at least 16 characters.");
  return createHmac("sha256", secret).update(buildCanonicalPartnerWebhookPayload(payload), "utf-8").digest("hex");
}

export class PartnerLabWebhookIngestor {
  private readonly processedKeys = new Map<string, { readonly payloadDigest: string; readonly result: PartnerWebhookIngestionResult }>();

  public ingestWebhook(payload: PartnerWebhookPayload, partnerSharedSecret: string, env: Record<string, string | undefined> = process.env): PartnerWebhookIngestionResult {
    const sub = resolveSaasSubscriptionStatus(env, payload.issuedAt || new Date().toISOString(), payload.tenantId);
    if (!sub.licenseValid) throw new Error("Automated Partner Lab & Logistics Webhook Ingestion requires a PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription.");

    const secret = partnerSharedSecret.trim();
    if (secret.length < 16) throw new Error("Partner webhook shared secret must be at least 16 characters.");

    const canonical = buildCanonicalPartnerWebhookPayload(payload);
    const expectedSig = createHmac("sha256", secret).update(canonical, "utf-8").digest("hex");
    const expectedBuf = Buffer.from(expectedSig, "utf-8");
    const providedBuf = Buffer.from(payload.signatureSha256 ?? "", "utf-8");
    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      throw new Error(`Partner webhook signature verification failed for partner '${payload.partnerCode}'.`);
    }

    const payloadDigest = createHmac("sha256", "canonical-digest").update(canonical, "utf-8").digest("hex");
    const scopedKey = `${payload.tenantId}:${payload.idempotencyKey}`;
    const existing = this.processedKeys.get(scopedKey);
    if (existing) {
      if (existing.payloadDigest !== payloadDigest) {
        throw new Error(`Conflicting webhook payload for idempotencyKey '${payload.idempotencyKey}'.`);
      }
      return { ...existing.result, duplicateIgnored: true };
    }

    const candidateFields: ExtractedField[] = [];
    let index = 1;
    for (const key of Object.keys(payload.reportedFields).sort()) {
      const rawVal = payload.reportedFields[key]!;
      const strVal = String(rawVal).trim();
      const numVal = Number(strVal);
      candidateFields.push({
        id: `${payload.documentId}-partner-${index}`,
        documentId: payload.documentId, fieldKey: key,
        label: key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        rawValue: strVal,
        normalizedValue: !Number.isNaN(numVal) && strVal !== "" ? numVal : strVal,
        confidenceScore: 0.99,
        boundingBox: { pageNumber: 1, x: 30, y: index * 32, width: 240, height: 22 },
        verificationStatus: "DRAFT",
      });
      index++;
    }
    const result: PartnerWebhookIngestionResult = { duplicateIgnored: false, partnerCode: payload.partnerCode, candidateFields };
    this.processedKeys.set(scopedKey, { payloadDigest, result });
    return result;
  }
}
