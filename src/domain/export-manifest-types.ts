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
  /**
   * SHA-256 over the canonical serialization of every other field in this manifest.
   *
   * `compositeManifestSha256` covers only the identity, documents and verified-summary
   * subset, which left `complianceFindingsCount`, `regulatoryDisclaimers`, `exportedBy`
   * and `exportedAt` editable without any verifier noticing — a tampered manifest could
   * still report zero critical blockers and claim to be a customs approval. Optional
   * because manifests sealed before this field existed do not carry it; the standalone
   * verifier reports those as PARTIAL_LEGACY instead of silently trusting them.
   */
  readonly manifestIntegritySha256?: string | undefined;
}
