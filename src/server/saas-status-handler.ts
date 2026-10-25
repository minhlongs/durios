import { assertValidActor } from "../auth/rbac-policy.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { isMarketplaceFeatureUnlocked } from "../marketplace/marketplace-guard.js";
import { resolveSaasSubscriptionStatus } from "../saas/saas-tier-policy.js";
import { computeTenantUsageAndRoiReport } from "../saas/usage-metering-service.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export function handleGetSaasStatus(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor
): Response {
  try {
    assertValidActor(actor);
    const subscription = resolveSaasSubscriptionStatus(
      process.env,
      new Date().toISOString(),
      actor.tenantId
    );
    const dossiers = workspace.listDossiers(actor);
    const usageAndRoi = computeTenantUsageAndRoiReport(
      actor.tenantId,
      dossiers,
      subscription.edition
    );
    const marketplaceUnlocked = isMarketplaceFeatureUnlocked({
      goForLiveCustomerData: false,
      env: process.env,
    });
    return jsonResponse({
      success: true,
      data: {
        subscription,
        usageAndRoi,
        marketplaceUnlocked,
      },
    });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to evaluate SaaS status");
  }
}
