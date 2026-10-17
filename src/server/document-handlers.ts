import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, DocumentType } from "../domain/types.js";
import { assertOwnerOperationalRole, assertValidActor, AccessControlError, isReadOnlyRole } from "../auth/rbac-policy.js";
import { redactDossierForActor } from "../sharing/dossier-redactor.js";
import { assertTenantRateLimit } from "./tenant-rate-limiter.js";
import {
  errorResponse, jsonResponse, mapDomainErrorToResponse, type VerifyFieldRequestBody,
} from "./server-types.js";

export async function handleUploadDocument(
  workspace: ContainerDossierWorkspace, actor: AuthenticatedActor, dossierId: string, req: Request
): Promise<Response> {
  try {
    assertValidActor(actor);
    const rawDossier = workspace.getRawDossier(dossierId);
    if (!rawDossier) return errorResponse(`Dossier '${dossierId}' not found`, 404);
    assertOwnerOperationalRole(actor, rawDossier.tenantId, "uploadDocument");
    assertTenantRateLimit(workspace.sqliteClient, actor.tenantId, "uploadDocument");
  } catch (err) {
    return mapDomainErrorToResponse(err, "Unauthorized to upload document");
  }

  const contentType = req.headers.get("content-type") ?? "";
  let fileBuffer: Uint8Array;
  let fileName = "uploaded_document.pdf";
  let documentType: DocumentType = "PACKING_LIST";
  let fixtureFields: Record<string, { raw: string; confirmed?: string }> | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fileEntry = formData.get("file");
      if (!fileEntry || typeof fileEntry === "string") {
        return errorResponse("Missing file in form-data ('file' field required)", 400);
      }
      const fileObj = fileEntry as File;
      fileName = fileObj.name || fileName;
      fileBuffer = new Uint8Array(await fileObj.arrayBuffer());
      const typeEntry = formData.get("documentType");
      if (typeEntry && typeof typeEntry === "string") {
        documentType = typeEntry as DocumentType;
      }
      const fixtureEntry = formData.get("fixtureFields");
      if (fixtureEntry && typeof fixtureEntry === "string") {
        fixtureFields = JSON.parse(fixtureEntry);
      }
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      fileName = String(body["fileName"] ?? "document.pdf");
      documentType = (body["documentType"] ?? "PACKING_LIST") as DocumentType;
      if (body["base64Content"] && typeof body["base64Content"] === "string") {
        fileBuffer = Uint8Array.from(Buffer.from(body["base64Content"], "base64"));
      } else {
        fileBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a]);
      }
      if (body["fixtureFields"]) {
        fixtureFields = body["fixtureFields"] as Record<string, { raw: string; confidence?: number }>;
      }
    }

    const { dossier, document } = workspace.uploadDocument(
      dossierId,
      fileBuffer,
      fileName,
      documentType,
      actor,
      fixtureFields
    );

    return jsonResponse(
      {
        success: true,
        data: {
          documentId: document.id,
          fileName: document.fileName,
          documentType: document.documentType,
          sha256Hash: document.sha256Hash,
          fileSize: document.fileSize,
          extractedFieldsCount: document.extractedFields.length,
          dossierLifecycleState: dossier.lifecycleState,
        },
      },
      201
    );
  } catch (err) {
    return mapDomainErrorToResponse(err, "Document upload failed");
  }
}

export async function handleVerifyField(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string,
  docId: string,
  fieldId: string,
  req: Request
): Promise<Response> {
  try {
    assertValidActor(actor);
    if (isReadOnlyRole(actor.role)) {
      throw new AccessControlError(
        `Role '${actor.role}' is read-only and prohibited from verifying fields.`,
        "INSUFFICIENT_ROLE"
      );
    }
    if (!workspace.getRawDossier(dossierId)) {
      return errorResponse(`Dossier '${dossierId}' not found`, 404);
    }
  } catch (err) {
    return mapDomainErrorToResponse(err, "Unauthorized to verify field");
  }

  let body: VerifyFieldRequestBody;
  try {
    body = (await req.json()) as VerifyFieldRequestBody;
  } catch {
    return errorResponse("Invalid JSON payload in request body", 400);
  }

  if (body.confirmedValue === undefined && !body.rejectField) {
    return errorResponse("Missing confirmedValue or rejectField", 400);
  }

  try {
    const updatedDossier = workspace.verifyField(
      dossierId,
      docId,
      {
        fieldId,
        confirmedValue: body.confirmedValue,
        clerkNote: body.clerkNote,
        rejectField: body.rejectField,
      },
      actor
    );

    const safeDossier = redactDossierForActor(updatedDossier, actor, workspace.shareManager);
    return jsonResponse({ success: true, data: safeDossier });
  } catch (err) {
    return mapDomainErrorToResponse(err, "Field verification failed");
  }
}

export function handleGetAuditTrail(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierId: string
): Response {
  try {
    assertValidActor(actor);
    const dossier = workspace.getDossier(dossierId, actor);
    if (!dossier) {
      return errorResponse(`Dossier '${dossierId}' not found`, 404);
    }
    workspace.shareManager.assertPurposeAllowed(
      dossier,
      actor,
      ["AUDIT", "CUSTOMS_INSPECTION"],
      "audit"
    );

    const events = workspace.auditLedger.getEventsForDossier(dossier.id, dossier.tenantId);
    const isChainValid = workspace.auditLedger.verifyIntegrity();

    return jsonResponse({
      success: true,
      data: {
        count: events.length,
        isChainValid,
        events,
      },
    });
  } catch (err) {
    return mapDomainErrorToResponse(err, "Failed to retrieve audit trail");
  }
}
