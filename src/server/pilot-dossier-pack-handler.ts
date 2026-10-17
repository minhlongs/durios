import { AccessControlError, assertValidActor } from "../auth/rbac-policy.js";
import { compilePilotGoLiveDossierPack } from "../export/pilot-dossier-pack-compiler.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export function handleGetPilotGoLivePack(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor
): Response {
  try {
    assertValidActor(actor);
    if (actor.role !== "ADMIN" && actor.role !== "AUDITOR" && actor.role !== "MANAGER") {
      throw new AccessControlError(
        `Role '${actor.role}' is not permitted to access the sealed Pilot Go-Live Dossier Pack; ADMIN, AUDITOR, or MANAGER required.`,
        "INSUFFICIENT_ROLE"
      );
    }
    const report = compilePilotGoLiveDossierPack(workspace, actor);
    return jsonResponse({ success: true, data: report });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to compile pilot go-live pack");
  }
}
