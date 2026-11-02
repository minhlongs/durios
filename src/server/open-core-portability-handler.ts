import { assertValidActor } from "../auth/rbac-policy.js";
import { selectOwnTenantDossiers } from "../auth/pilot-kpi-evaluator.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { getOpenCoreEditionManifest } from "../saas/open-core-edition-manifest.js";
import { resolveSaasSubscriptionStatus } from "../saas/saas-tier-policy.js";
import { exportWorkspacePortabilityBundle, verifyWorkspacePortabilityBundle, type SignedWorkspacePortabilityBundle } from "../saas/workspace-portability-bundle.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { errorResponse, jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

function isSignedBundle(value: unknown): value is SignedWorkspacePortabilityBundle {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.payload === "object" &&
    candidate.payload !== null &&
    typeof candidate.payloadSha256 === "string"
  );
}

export function handleGetOpenCoreEditionManifest(_workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Response {
  try {
    assertValidActor(actor);
    const subscription = resolveSaasSubscriptionStatus(process.env, new Date().toISOString(), actor.tenantId);
    const manifest = getOpenCoreEditionManifest(subscription.edition);
    return jsonResponse({ success: true, data: { subscription, manifest } });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to retrieve Open-Core edition manifest");
  }
}

export function handleExportWorkspacePortability(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Response {
  try {
    assertValidActor(actor);
    const dossiers = selectOwnTenantDossiers(workspace.listDossiers(actor), actor.tenantId);
    const tenantEvents = workspace.auditLedger
      .getAllEvents()
      .filter((e) => e.tenantId === actor.tenantId);
    const secret = process.env.DURIOS_PORTABILITY_HMAC_SECRET?.trim();
    const bundle = exportWorkspacePortabilityBundle(
      actor.tenantId,
      actor.name,
      actor.tenantType,
      dossiers,
      tenantEvents,
      secret
    );
    const subscription = resolveSaasSubscriptionStatus(process.env, new Date().toISOString(), actor.tenantId);
    return jsonResponse({ success: true, data: { bundle, subscription } });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to export workspace portability bundle");
  }
}

export async function handleVerifyWorkspacePortability(
  _workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  req: Request
): Promise<Response> {
  try {
    assertValidActor(actor);
    let bodyUnknown: unknown;
    try {
      bodyUnknown = await req.json();
    } catch {
      return errorResponse("Invalid JSON payload", 400);
    }
    if (typeof bodyUnknown !== "object" || bodyUnknown === null) {
      return errorResponse("Request body must be a JSON object", 400);
    }
    const body = bodyUnknown as Record<string, unknown>;
    if (!isSignedBundle(body.bundle)) {
      return errorResponse("Missing or invalid 'bundle' property in request body", 400);
    }
    const secret =
      typeof body.portabilitySecret === "string" && body.portabilitySecret.trim().length > 0
        ? body.portabilitySecret.trim()
        : process.env.DURIOS_PORTABILITY_HMAC_SECRET?.trim();

    const verification = verifyWorkspacePortabilityBundle(body.bundle, secret);
    return jsonResponse({
      success: true,
      data: verification,
    });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to verify workspace portability bundle");
  }
}
