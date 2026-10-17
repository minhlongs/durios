import { assertValidActor } from "../auth/rbac-policy.js";
import type { AuthenticatedActor } from "../domain/types.js";
import { evaluateBlueprint25Steps } from "../saas/blueprint-25-step-auditor.js";
import { evaluateOpenCoreDeepBrainstorm } from "../saas/open-core-deep-introspector.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export function handleGetBlueprintStatus(
  _workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  req?: Request
): Response {
  try {
    assertValidActor(actor);
    const isDeep = req ? new URL(req.url).searchParams.get("deep") === "true" : false;
    if (isDeep) {
      const deepReport = evaluateOpenCoreDeepBrainstorm();
      return jsonResponse({
        success: true,
        data: deepReport,
      });
    }
    const auditReport = evaluateBlueprint25Steps();
    return jsonResponse({
      success: true,
      data: auditReport,
    });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to retrieve blueprint verification status");
  }
}
