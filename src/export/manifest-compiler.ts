import { calculateSha256 } from "../ingestion/document-hasher.js";
import type {
  AuthenticatedActor,
  ContainerDossier,
  DossierExportManifest,
} from "../domain/types.js";

export function compileExportManifest(
  dossier: ContainerDossier,
  actor: AuthenticatedActor
): DossierExportManifest {
  const activeDocs = dossier.documents.filter((d) => !d.isSuperseded);

  const verifiedDataSummary: Record<string, unknown> = {
    containerNumber: dossier.containerNumber,
    sealNumber: dossier.sealNumber,
    targetMarket: dossier.targetMarket,
    borderGate: dossier.borderGate,
    targetTemperatureC: dossier.targetTemperatureC,
    declaredNetWeightKg: dossier.declaredNetWeightKg,
    declaredBoxCount: dossier.declaredBoxCount,
  };

  for (const doc of activeDocs) {
    const docFields: Record<string, unknown> = {};
    for (const f of doc.extractedFields) {
      if (f.verificationStatus === "HUMAN_VERIFIED") {
        docFields[f.fieldKey] = f.confirmedValue ?? f.rawValue;
      }
    }
    verifiedDataSummary[doc.documentType.toLowerCase()] = docFields;
  }

  const docManifestItems = activeDocs.map((d) => ({
    documentId: d.id,
    documentType: d.documentType,
    fileName: d.fileName,
    sha256Hash: d.sha256Hash,
    verifiedFieldCount: d.extractedFields.filter((f) => f.verificationStatus === "HUMAN_VERIFIED").length,
  }));

  const compositeContent = JSON.stringify({
    dossierId: dossier.id,
    dossierCode: dossier.dossierCode,
    tenantId: dossier.tenantId,
    containerNumber: dossier.containerNumber,
    sealNumber: dossier.sealNumber,
    documents: docManifestItems,
    verifiedDataSummary,
  });

  const compositeManifestSha256 = calculateSha256(compositeContent);

  const criticalBlockers = dossier.latestValidationResult?.criticalBlockers ?? 0;
  const advisoryWarnings = dossier.latestValidationResult?.advisoryWarnings ?? 0;

  return {
    manifestVersion: "1.0.0",
    dossierId: dossier.id,
    dossierCode: dossier.dossierCode,
    tenantId: dossier.tenantId,
    containerNumber: dossier.containerNumber,
    sealNumber: dossier.sealNumber,
    lifecycleState: dossier.lifecycleState,
    isImmutable: dossier.isImmutable,
    exportedAt: new Date().toISOString(),
    exportedBy: actor.name,
    compositeManifestSha256,
    documents: docManifestItems,
    verifiedDataSummary,
    complianceFindingsCount: {
      criticalBlockers,
      advisoryWarnings,
    },
    regulatoryDisclaimers: [
      "DISCLAIMER: This manifest certifies cryptographic data integrity and Human-In-The-Loop verification only.",
      "This document does NOT constitute official customs clearance, sanitary certification, or guaranteed border passage.",
      "Clearance authority resides exclusively with the General Administration of Customs of the People's Republic of China (GACC).",
    ],
  };
}
