import type { AuthenticatedActor, ContainerDossier, IngestedDocument } from "../domain/types.js";
import type { FileStorageService, StoredBlobResult } from "../storage/file-storage-service.js";
import type { DossierRepositoryLike } from "./workspace-types.js";
import type { HumanVerificationInput } from "../verification/hitl-service.js";
import type { HitlVerificationService } from "../verification/hitl-service.js";

/** Uploads a document, storing its blob and rolling the blob back if the save fails. */
export function persistUploadedDocument(
  dossier: ContainerDossier,
  updatedDossier: ContainerDossier,
  document: IngestedDocument,
  fileBytes: Uint8Array,
  fileName: string,
  storage: FileStorageService | undefined,
  repo: DossierRepositoryLike
): { dossier: ContainerDossier; document: IngestedDocument } {
  if (!storage) {
    repo.save(updatedDossier);
    return { dossier: updatedDossier, document };
  }
  if (dossier.documents.some((d) => d.id === document.id && !d.isSuperseded)) {
    repo.save(updatedDossier);
    return { dossier: updatedDossier, document };
  }
  let storedBlob: StoredBlobResult;
  try {
    storedBlob = storage.storeFile(fileBytes, fileName, document.id);
  } catch {
    repo.save(updatedDossier);
    return { dossier: updatedDossier, document };
  }
  const withPath: IngestedDocument = { ...document, storagePath: storedBlob.storagePath };
  const withDocument: ContainerDossier = {
    ...updatedDossier,
    documents: updatedDossier.documents.map((d) => (d.id === document.id ? withPath : d)),
  };
  try {
    repo.save(withDocument);
    return { dossier: withDocument, document: withPath };
  } catch (saveError) {
    if (storedBlob.createdNew && !(repo.hasDocumentReferencingBlob?.(storedBlob.storagePath, storedBlob.sha256) ?? false)) {
      try { storage.deleteFile(storedBlob.storagePath); } catch { /* best effort */ }
    }
    throw saveError;
  }
}

/** Records a human decision on one field, moving the dossier back to verification. */
export function persistFieldVerification(
  dossier: ContainerDossier,
  documentId: string,
  verification: HumanVerificationInput,
  actor: AuthenticatedActor,
  hitl: HitlVerificationService,
  repo: DossierRepositoryLike
): ContainerDossier {
  const docIndex = dossier.documents.findIndex((d) => d.id === documentId && !d.isSuperseded);
  if (docIndex === -1) throw new Error(`Active document '${documentId}' not found.`);
  const updatedDocuments = [...dossier.documents];
  updatedDocuments[docIndex] = hitl.verifyOrCorrectField(dossier.documents[docIndex]!, verification, actor);
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: "HUMAN_VERIFICATION_REQUIRED", latestValidationResult: undefined, documents: updatedDocuments, updatedAt: new Date().toISOString() };
  repo.save(updatedDossier);
  return updatedDossier;
}
