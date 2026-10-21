import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { assertCanCreateContainerDossier, assertValidActor } from "../auth/rbac-policy.js";
import { redactDossierForActor, redactDossierListForActor } from "../sharing/dossier-redactor.js";
import {
  errorResponse, jsonResponse, mapDomainErrorToResponse, type CreateDossierRequestBody,
} from "./server-types.js";

export async function handleListDossiers(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Promise<Response> {
  try {
    assertValidActor(actor);
    const safeDossiers = redactDossierListForActor(workspace.listDossiers(actor), actor, workspace.shareManager);
    return jsonResponse({ success: true, count: safeDossiers.length, data: safeDossiers });
  } catch (err) {
    return mapDomainErrorToResponse(err, "Failed to list dossiers");
  }
}

export async function handleCreateDossier(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, req: Request): Promise<Response> {
  try { assertCanCreateContainerDossier(actor); } catch (err) { return mapDomainErrorToResponse(err, "Unauthorized to create dossier"); }
  let body: CreateDossierRequestBody;
  try { body = (await req.json()) as CreateDossierRequestBody; } catch { return errorResponse("Invalid JSON payload in request body", 400); }
  if (!body.dossierCode || !body.containerNumber || !body.sealNumber) return errorResponse("Missing required fields: dossierCode, containerNumber, sealNumber", 400);
  try {
    const dossier = workspace.createDossier({
      dossierCode: String(body.dossierCode).trim(), containerNumber: String(body.containerNumber).trim(), sealNumber: String(body.sealNumber).trim(),
      targetMarket: String(body.targetMarket ?? "CN").trim(), borderGate: String(body.borderGate ?? "Huu Nghi").trim(),
      targetTemperatureC: Number(body.targetTemperatureC ?? 14.5), declaredNetWeightKg: Number(body.declaredNetWeightKg ?? 18000),
      declaredBoxCount: Number(body.declaredBoxCount ?? 900),
    }, actor);
    return jsonResponse({ success: true, data: dossier }, 201);
  } catch (err) { return mapDomainErrorToResponse(err, "Failed to create dossier"); }
}

export function handleGetDossier(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  try {
    assertValidActor(actor);
    const dossier = workspace.getDossier(dossierId, actor);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    return jsonResponse({ success: true, data: redactDossierForActor(dossier, actor, workspace.shareManager) });
  } catch (err) {
    return mapDomainErrorToResponse(err, "Failed to retrieve dossier");
  }
}

export function handleRunValidation(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    if (!workspace.getRawDossier(dossierId)) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    return jsonResponse({ success: true, data: workspace.runValidation(dossierId, actor) });
  } catch (err) { return mapDomainErrorToResponse(err, "Validation run failed"); }
}

export function handleApproveForExport(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    if (!workspace.getRawDossier(dossierId)) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    return jsonResponse({ success: true, data: workspace.approveForExport(dossierId, actor) });
  } catch (err) { return mapDomainErrorToResponse(err, "Export approval rejected"); }
}

export function handleExportDossier(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    if (!workspace.getRawDossier(dossierId)) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    return jsonResponse({ success: true, data: workspace.exportDossier(dossierId, actor) });
  } catch (err) { return mapDomainErrorToResponse(err, "Export compilation failed"); }
}

export function handleGetExportManifest(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    assertValidActor(actor);
    const manifest = workspace.getExportManifest(dossierId, actor);
    if (!manifest) return errorResponse(`No sealed export manifest found for dossier '${dossierId}'`, 404);
    return jsonResponse({ success: true, data: manifest });
  } catch (err) { return mapDomainErrorToResponse(err, "Failed to retrieve export manifest"); }
}
