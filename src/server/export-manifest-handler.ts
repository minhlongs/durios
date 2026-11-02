import type { AuthenticatedActor } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { assertValidActor } from "../auth/rbac-policy.js";
import { redactExportManifestForActor } from "../sharing/export-manifest-redactor.js";
import { errorResponse, jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

/** Purposes that justify holding the sealed record of a container somebody else owns. */
const MANIFEST_PURPOSES = ["BUYER_VERIFICATION", "CUSTOMS_INSPECTION", "AUDIT"] as const;

export function handleGetExportManifest(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string): Response {
  try {
    assertValidActor(actor);
    const manifest = workspace.getExportManifest(dossierId, actor);
    if (!manifest) return errorResponse(`No sealed export manifest found for dossier '${dossierId}'`, 404);
    const dossier = workspace.getDossier(dossierId, actor);
    if (!dossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    // A manifest is the artifact a buyer or inspector is handed, so it is released only
    // for purposes that justify holding it — a LOGISTICS or TRADE_FINANCE grant, which
    // exists for movement and financing, does not carry the sealed verification record.
    workspace.shareManager.assertPurposeAllowed(dossier, actor, [...MANIFEST_PURPOSES], "manifest");
    if (manifest.tenantId === actor.tenantId) return jsonResponse({ success: true, data: manifest });
    const safe = redactExportManifestForActor(manifest, actor, workspace.shareManager);
    return jsonResponse({
      success: true,
      data: safe.manifest,
      redaction: {
        applied: true,
        redactedKeys: safe.redactedKeys,
        quantityKeysVisible: safe.quantityKeysVisible,
        notice:
          "Manifest đã được lọc theo mục đích chia sẻ (Purpose-Bound 5A-5) vì đơn vị truy cập không sở hữu hồ sơ. " +
          "compositeManifestSha256 vẫn là mã băm của bản ghi đầy đủ thuộc đơn vị sở hữu, nên băm lại bản đã lọc sẽ " +
          "KHÔNG khớp — đây không phải dấu hiệu giả mạo.",
      },
    });
  } catch (err) { return mapDomainErrorToResponse(err, "Failed to retrieve export manifest"); }
}
