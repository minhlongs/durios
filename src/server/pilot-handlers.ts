import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type { SharePurpose, ShareScope } from "../domain/pilot-types.js";
import type { RecordOrganicEvidenceInput } from "../organic/organic-evidence-manager.js";
import { assertOwnerManagementRole, assertOwnerOperationalRole, assertValidActor } from "../auth/rbac-policy.js";
import { assertCanRecordOrganicEvidence } from "../auth/rbac-persona-assertions.js";
import { computeGate05KpiFromDossiers } from "../auth/pilot-kpi-evaluator.js";
import { evaluateWorkspaceLaunchGates } from "../auth/pilot-launch-gate-verifier.js";
import { issueCrossBorderBuyerVerificationRoom } from "../saas/gacc-registry-watch-service.js";
import { errorResponse, jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export async function handleGrantShare(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string, req: Request): Promise<Response> {
  try {
    assertValidActor(actor);
    const dossier = workspace.getRawDossier(dossierId);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    assertOwnerManagementRole(actor, dossier.tenantId, "grantShare");
    const body = (await req.json()) as { granteeTenantId?: string; purpose?: SharePurpose; scope?: ShareScope; expiresAt?: string };
    if (!body.granteeTenantId || !body.purpose || !body.scope || !body.expiresAt) return errorResponse("Missing required fields: granteeTenantId, purpose, scope, expiresAt", 400);
    const grant = workspace.shareManager.grantAccess(dossier, body.granteeTenantId, body.purpose, body.scope, body.expiresAt, actor, workspace.auditLedger);
    const manifest = body.purpose === "BUYER_VERIFICATION" ? workspace.getExportManifest(dossierId, actor) : undefined;
    let buyerRoom;
    if (manifest) { try { buyerRoom = issueCrossBorderBuyerVerificationRoom(manifest, grant.id, body.expiresAt); } catch { buyerRoom = undefined; } }
    return jsonResponse(buyerRoom ? { grant, buyerRoom } : { grant }, 201);
  } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to grant share access"); }
}

export function handleListShares(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    assertValidActor(actor);
    const dossier = workspace.getDossier(dossierId, actor);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    return jsonResponse({ grants: workspace.shareManager.listGrantsForDossier(dossier, actor) });
  } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to list shares"); }
}

export async function handleRevokeShare(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string, grantId: string, req: Request): Promise<Response> {
  try {
    assertValidActor(actor);
    const dossier = workspace.getRawDossier(dossierId);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    assertOwnerManagementRole(actor, dossier.tenantId, "revokeShare");
    const body = (await req.json().catch(() => ({}))) as { reason?: string };
    const grant = workspace.shareManager.revokeAccess(grantId, dossier, body.reason ?? "Revoked by owner", actor, workspace.auditLedger);
    return jsonResponse({ grant });
  } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to revoke share access"); }
}

export async function handleRecordOrganicEvidence(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string, req: Request): Promise<Response> {
  try {
    assertValidActor(actor);
    const dossier = workspace.getRawDossier(dossierId);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    assertOwnerOperationalRole(actor, dossier.tenantId, "recordOrganicEvidence");
    assertCanRecordOrganicEvidence(actor);
    const body = (await req.json()) as RecordOrganicEvidenceInput;
    const evidence = workspace.organicEvidenceManager.recordEvidence(dossier, body, actor, workspace.auditLedger);
    return jsonResponse({ evidence }, 201);
  } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to record organic evidence"); }
}

export function handleListOrganicEvidence(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    assertValidActor(actor);
    const dossier = workspace.getDossier(dossierId, actor);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    workspace.shareManager.assertPurposeAllowed(dossier, actor, ["BUYER_VERIFICATION", "CUSTOMS_INSPECTION", "AUDIT"], "organic-evidence");
    const evidence = workspace.organicEvidenceManager.listEvidenceForDossier(dossierId, true, dossier.tenantId);
    return jsonResponse({ evidence });
  } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to list organic evidence"); }
}

export function handleGetPilotKpi(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Response {
  try { assertValidActor(actor); return jsonResponse({ success: true, data: computeGate05KpiFromDossiers(workspace.listDossiers(actor)) }); } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to evaluate pilot KPI"); }
}

export function handleGetPilotGates(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Response {
  try { assertValidActor(actor); return jsonResponse({ success: true, data: evaluateWorkspaceLaunchGates(workspace, actor) }); } catch (err: unknown) { return mapDomainErrorToResponse(err, "Failed to evaluate pilot launch gates"); }
}
