import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import type { AuthenticatedActor } from "../domain/types.js";
import {
  errorResponse, jsonResponse, mapDomainErrorToResponse, type OverrideBlockerRequestBody,
} from "./server-types.js";
import { readExpectedVersion } from "./request-version.js";

/**
 * A quality manager signs past a blocking finding.
 *
 * Deliberately its own route rather than a flag on `/approve`: signing past a
 * blocker and approving for export are two separate decisions taken in two
 * separate steps, and collapsing them into one call would make the sign-off
 * untestable.
 */
export async function handleOverrideBlocker(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string,
  req: Request
): Promise<Response> {
  try {
    if (!workspace.getRawDossier(dossierId)) return errorResponse(`Dossier '${dossierId}' not found`, 404);
  } catch (err) { return mapDomainErrorToResponse(err, "Override failed"); }
  let body: OverrideBlockerRequestBody;
  try { body = (await req.json()) as OverrideBlockerRequestBody; } catch { return errorResponse("Invalid JSON payload in request body", 400); }
  if (typeof body.reason !== "string" || body.reason.trim().length === 0) {
    return errorResponse("Missing required field: reason (a signed override must explain the decision)", 400);
  }
  try {
    return jsonResponse({ success: true, data: workspace.overrideBlocker(dossierId, body.reason, actor, readExpectedVersion(body)) });
  } catch (err) { return mapDomainErrorToResponse(err, "Blocker override rejected"); }
}
