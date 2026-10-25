import type { DossierLifecycleState, DocumentType } from "./types.js";

/**
 * The sealed export artifact: an immutable record of what left the packhouse.
 *
 * It lives apart from `ContainerDossier` because it is produced once at export
 * time, never mutated afterwards, and is the object a regulator or a buyer
 * would actually be handed. Keeping it separate keeps the dossier type focused
 * on the mutable aggregate that produces it.
 */
export interface DossierExportManifest {
  readonly manifestVersion: "1.0.0";
  readonly dossierId: string; readonly dossierCode: string; readonly tenantId: string;
  readonly containerNumber: string; readonly sealNumber: string;
  readonly lifecycleState: DossierLifecycleState; readonly isImmutable: boolean;
  readonly exportedAt: string; readonly exportedBy: string; readonly compositeManifestSha256: string;
  readonly documents: readonly { readonly documentId: string; readonly documentType: DocumentType; readonly fileName: string; readonly sha256Hash: string; readonly verifiedFieldCount: number; }[];
  readonly verifiedDataSummary: Record<string, unknown>;
  readonly complianceFindingsCount: { readonly criticalBlockers: number; readonly advisoryWarnings: number };
  readonly regulatoryDisclaimers: readonly string[];
}
