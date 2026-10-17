import { validateIncomingFile } from "../ingestion/file-validator.js";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import type {
  DocumentExtractorAdapter,
  ExtractionContext,
  FixtureFieldOverrides,
} from "../extraction/extractor-types.js";
import { defaultExtractorRegistry } from "../extraction/composite-extractor-registry.js";
import { DossierFsmError } from "../domain/dossier-fsm.js";
import type { AuditLedgerLike } from "./workspace-types.js";
import type {
  AuthenticatedActor,
  ContainerDossier,
  DocumentType,
  IngestedDocument,
} from "../domain/types.js";

export function handleDocumentUpload(
  dossier: ContainerDossier,
  fileBuffer: Uint8Array,
  originalFileName: string,
  documentType: DocumentType,
  actor: AuthenticatedActor,
  auditLedger: AuditLedgerLike,
  fixtureFields?: FixtureFieldOverrides,
  extractor?: DocumentExtractorAdapter
): { readonly updatedDossier: ContainerDossier; readonly document: IngestedDocument } {
  if (dossier.isImmutable) {
    throw new DossierFsmError(
      "Cannot upload to sealed dossier",
      dossier.lifecycleState,
      dossier.lifecycleState
    );
  }

  const fileVal = validateIncomingFile(fileBuffer, originalFileName);
  if (!fileVal.isValid) {
    auditLedger.recordEvent(actor, dossier.id, "DOC_UPLOAD_REJECTED", "DOCUMENT", originalFileName, null, {
      reason: fileVal.error,
    });
    throw new Error(`File rejected: ${fileVal.error}`);
  }

  const sha256 = calculateSha256(fileBuffer);
  const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const duplicate = dossier.documents.find((d) => d.sha256Hash === sha256 && !d.isSuperseded);
  if (duplicate) {
    auditLedger.recordEvent(actor, dossier.id, "DUPLICATE_FILE_DETECTED", "DOCUMENT", duplicate.id, null, {
      sha256Hash: sha256,
    });
    return { updatedDossier: dossier, document: duplicate };
  }

  const updatedDocs = dossier.documents.map((d) => {
    if (d.documentType === documentType && !d.isSuperseded) {
      auditLedger.recordEvent(actor, dossier.id, "DOC_SUPERSEDED", "DOCUMENT", d.id, null, {
        supersededBy: docId,
      });
      return { ...d, isSuperseded: true };
    }
    return d;
  });

  const extractionContext: ExtractionContext = {
    documentId: docId,
    documentType,
    fileName: originalFileName,
    mimeType: fileVal.detectedMime,
    sha256Hash: sha256,
  };

  let candidateFields =
    extractor && extractor.isAvailable && extractor.supports(documentType, fileVal.detectedMime)
      ? extractor.extractFields(fileBuffer, extractionContext, fixtureFields)
      : [];

  if (candidateFields.length === 0) {
    candidateFields = defaultExtractorRegistry.extractFieldsSync(
      fileBuffer,
      extractionContext,
      fixtureFields
    );
  }

  const newDoc: IngestedDocument = {
    id: docId,
    dossierId: dossier.id,
    tenantId: actor.tenantId,
    documentType,
    fileName: originalFileName,
    fileSize: fileBuffer.length,
    mimeType: fileVal.detectedMime,
    sha256Hash: sha256,
    uploadedAt: now,
    isSuperseded: false,
    extractedFields: candidateFields,
  };

  const updatedDossier: ContainerDossier = {
    ...dossier,
    lifecycleState: "HUMAN_VERIFICATION_REQUIRED",
    updatedAt: now,
    documents: [...updatedDocs, newDoc],
    latestValidationResult: undefined,
  };

  auditLedger.recordEvent(actor, dossier.id, "DOC_UPLOADED", "DOCUMENT", docId, null, {
    fileName: originalFileName,
    sha256Hash: sha256,
    fieldsExtracted: candidateFields.length,
  });

  return { updatedDossier, document: newDoc };
}
