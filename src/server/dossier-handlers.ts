import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { errorResponse, jsonResponse, type CreateDossierRequestBody } from "./server-types.js";

export async function handleListDossiers(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor
): Promise<Response> {
  const dossiers = workspace.listDossiers(actor);
  return jsonResponse({ success: true, count: dossiers.length, data: dossiers });
}

export async function handleCreateDossier(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  req: Request
): Promise<Response> {
  let body: CreateDossierRequestBody;
  try {
    body = (await req.json()) as CreateDossierRequestBody;
  } catch {
    return errorResponse("Invalid JSON payload in request body", 400);
  }

  if (!body.dossierCode || !body.containerNumber || !body.sealNumber) {
    return errorResponse("Missing required fields: dossierCode, containerNumber, sealNumber", 400);
  }

  try {
    const dossier = workspace.createDossier(
      {
        dossierCode: String(body.dossierCode).trim(),
        containerNumber: String(body.containerNumber).trim(),
        sealNumber: String(body.sealNumber).trim(),
        targetMarket: String(body.targetMarket ?? "CN").trim(),
        borderGate: String(body.borderGate ?? "Huu Nghi").trim(),
        targetTemperatureC: Number(body.targetTemperatureC ?? 14.5),
        declaredNetWeightKg: Number(body.declaredNetWeightKg ?? 18000),
        declaredBoxCount: Number(body.declaredBoxCount ?? 900),
      },
      actor
    );
    return jsonResponse({ success: true, data: dossier }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create dossier";
    return errorResponse(message, 400);
  }
}

export function handleGetDossier(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  const dossier = workspace.getDossier(dossierId, actor);
  if (!dossier) {
    return errorResponse(`Dossier '${dossierId}' not found`, 404);
  }
  return jsonResponse({ success: true, data: dossier });
}

export function handleRunValidation(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  try {
    const result = workspace.runValidation(dossierId, actor);
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation run failed";
    return errorResponse(message, 400);
  }
}

export function handleApproveForExport(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  try {
    const dossier = workspace.approveForExport(dossierId, actor);
    return jsonResponse({ success: true, data: dossier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export approval rejected";
    return errorResponse(message, 403);
  }
}

export function handleExportDossier(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  try {
    const manifest = workspace.exportDossier(dossierId, actor);
    return jsonResponse({ success: true, data: manifest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export compilation failed";
    return errorResponse(message, 400);
  }
}

export function handleGetExportManifest(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  const manifest = workspace.getExportManifest(dossierId, actor);
  if (!manifest) {
    return errorResponse(`No sealed export manifest found for dossier '${dossierId}'`, 404);
  }
  return jsonResponse({ success: true, data: manifest });
}
