import { calculateSha256 } from "../ingestion/document-hasher.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export type ZnsAlertTemplateType =
  | "VALIDATION_BLOCKED_ALERT"
  | "GACC_PUC_SUSPENDED_ALERT"
  | "DOSSIER_EXPORT_SEALED_NOTICE";

export interface ZnsAlertDispatchRequest {
  readonly tenantId: string;
  readonly dossierCode: string;
  readonly containerNumber: string;
  readonly recipientPhoneE164: string;
  readonly templateType: ZnsAlertTemplateType;
  readonly summaryVi: string;
}

export interface ZnsTransportReceipt {
  readonly providerMessageId: string;
  readonly deliveredAt?: string | undefined;
}

export type ZnsAlertTransport = (req: ZnsAlertDispatchRequest) => ZnsTransportReceipt;

export interface ZnsAlertDispatchReceipt {
  readonly receiptId: string;
  readonly providerMessageId: string;
  readonly tenantId: string;
  readonly templateType: ZnsAlertTemplateType;
  readonly channel: "ZALO_ZNS_MANAGED_RELAY";
  readonly delivered: true;
  readonly remainingMonthlyQuota: number;
  readonly messageDigestSha256: string;
  readonly dispatchedAt: string;
}

const PRO_MONTHLY_QUOTA = 500;
const ENTERPRISE_MONTHLY_QUOTA = 5000;

export class ManagedSaasZnsAlertRelay {
  private readonly usageByTenant = new Map<string, number>();

  constructor(private readonly transport?: ZnsAlertTransport) {}

  public getQuotaLimit(
    env: Record<string, string | undefined> = process.env,
    expectedTenantId?: string
  ): number {
    const sub = resolveSaasSubscriptionStatus(env, new Date().toISOString(), expectedTenantId);
    if (!sub.entitlements.managedZaloZnsRelay) return 0;
    return sub.edition === "EXPORTER_ENTERPRISE"
      ? ENTERPRISE_MONTHLY_QUOTA
      : PRO_MONTHLY_QUOTA;
  }

  public getDispatchedCount(tenantId: string): number {
    return this.usageByTenant.get(tenantId) ?? 0;
  }

  public dispatchAlert(
    request: ZnsAlertDispatchRequest,
    env: Record<string, string | undefined> = process.env,
    dispatchedAt = new Date().toISOString(),
    transportOverride?: ZnsAlertTransport
  ): ZnsAlertDispatchReceipt {
    const sub = resolveSaasSubscriptionStatus(env, dispatchedAt, request.tenantId);
    if (!sub.entitlements.managedZaloZnsRelay) {
      throw new Error(
        "Managed Zalo ZNS & SMS Alert Relay requires an active PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription."
      );
    }
    if (!/^\+84\d{8,10}$/.test(request.recipientPhoneE164)) {
      throw new Error(
        `Invalid Vietnam E.164 recipient phone '${request.recipientPhoneE164}'.`
      );
    }

    const quotaLimit =
      sub.edition === "EXPORTER_ENTERPRISE"
        ? ENTERPRISE_MONTHLY_QUOTA
        : PRO_MONTHLY_QUOTA;
    const used = this.getDispatchedCount(request.tenantId);
    if (used >= quotaLimit) {
      throw new Error(
        `Monthly Zalo ZNS quota (${quotaLimit}) exceeded for tenant '${request.tenantId}'.`
      );
    }

    const transport = transportOverride ?? this.transport;
    if (!transport) {
      throw new Error("Managed Zalo ZNS transport is not configured (fail-closed).");
    }

    const providerReceipt = transport(request);
    const providerMessageId = providerReceipt?.providerMessageId?.trim();
    if (!providerMessageId) {
      throw new Error(
        "Zalo ZNS transport returned an invalid or empty providerMessageId (fail-closed)."
      );
    }

    const nextUsed = used + 1;
    this.usageByTenant.set(request.tenantId, nextUsed);
    const effectiveDispatchedAt = providerReceipt.deliveredAt ?? dispatchedAt;

    const messageDigestSha256 = calculateSha256(
      `${request.tenantId}|${request.dossierCode}|${request.containerNumber}|${request.templateType}|${request.summaryVi}|${effectiveDispatchedAt}`
    );

    return {
      receiptId: `ZNS-${request.dossierCode}-${nextUsed}`,
      providerMessageId,
      tenantId: request.tenantId,
      templateType: request.templateType,
      channel: "ZALO_ZNS_MANAGED_RELAY",
      delivered: true,
      remainingMonthlyQuota: quotaLimit - nextUsed,
      messageDigestSha256,
      dispatchedAt: effectiveDispatchedAt,
    };
  }
}
