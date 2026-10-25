export type UserRole = "CLERK" | "MANAGER" | "ADMIN" | "AUDITOR" | "VIEWER";
export type TenantType = "ORCHARD_COOP" | "PACKHOUSE_EXPORTER" | "BUYER_IMPORTER" | "INSPECTION_AUDITOR";
export type ProductPersona = "ORCHARD_OFFICER" | "PACKHOUSE_CLERK" | "PACKHOUSE_MANAGER" | "BUYER_VIEWER" | "SYSTEM_AUDITOR";

export interface AuthenticatedActor {
  readonly id: string; readonly tenantId: string; readonly role: UserRole;
  readonly name: string; readonly tenantType: TenantType; readonly persona: ProductPersona;
}

export type DossierLifecycleState = "DRAFT" | "DOCUMENTS_PENDING" | "PROCESSING" | "HUMAN_VERIFICATION_REQUIRED" | "VALIDATION_BLOCKED" | "REVIEW_REQUIRED" | "READY_FOR_REVIEW" | "APPROVED_FOR_EXPORT" | "EXPORTED" | "CLOSED" | "CANCELLED";
export type DocumentType = "LAB_TEST_REPORT" | "PACKING_LIST" | "PHYTOSANITARY_CERTIFICATE" | "CUSTOMS_DECLARATION" | "BILL_OF_LADING";
export type FieldVerificationStatus = "DRAFT" | "HUMAN_VERIFIED" | "REJECTED";

export interface BoundingBox { readonly pageNumber: number; readonly x: number; readonly y: number; readonly width: number; readonly height: number; }

export interface ExtractedField {
  readonly id: string; readonly documentId: string; readonly fieldKey: string;
  readonly label: string; readonly rawValue: string;
  readonly normalizedValue: string | number | null; readonly confidenceScore: number;
  readonly boundingBox: BoundingBox; readonly verificationStatus: FieldVerificationStatus;
  readonly confirmedValue?: string | number | null | undefined;
  readonly verifiedBy?: string | undefined; readonly verifiedAt?: string | undefined;
  readonly clerkNote?: string | undefined;
}

export interface IngestedDocument {
  readonly id: string; readonly dossierId: string; readonly tenantId: string;
  readonly documentType: DocumentType; readonly fileName: string;
  readonly fileSize: number; readonly mimeType: string; readonly sha256Hash: string;
  readonly storagePath?: string | undefined; readonly uploadedAt: string;
  readonly isSuperseded: boolean; readonly extractedFields: readonly ExtractedField[];
}

export type RuleSeverity = "CRITICAL_BLOCKER" | "ADVISORY_WARNING";

/**
 * Whether a rule asserts a legal basis it must prove. An unverified blocker is held
 * by the fail-closed branch, so this tier decides whether a rule may block without
 * legal review. Absent means `"STATUTORY"`, so older records cannot conclude.
 */
export type StatutoryClaim = "STATUTORY" | "INTERNAL_FOOD_SAFETY" | "NON_STATUTORY";

export interface ComplianceRule {
  readonly ruleId: string; readonly name: string; readonly severity: RuleSeverity;
  readonly description: string; readonly governingAuthority: string;
  readonly statutoryReference: string; readonly isActive: boolean;
  readonly isStatutoryVerified: boolean; readonly fieldKeyRef?: string | undefined;
  readonly threshold?: number | undefined; readonly unit?: string | undefined;
  readonly statutoryClaim?: StatutoryClaim | undefined;
  readonly evaluationType: "DOCUMENT_PRESENCE" | "NUMERIC_THRESHOLD" | "ALGORITHMIC_CHECKSUM" | "CROSS_DOCUMENT_EQUALITY" | "CHRONOLOGICAL_SANITY";
}

export interface ValidationFinding {
  readonly ruleId: string; readonly severity: RuleSeverity; readonly ruleName: string;
  readonly citation: string; readonly observedValue: string; readonly thresholdValue: string;
  readonly messageVi: string; readonly messageEn: string;
  /** Whether this finding may carry a legal conclusion. Absent means untagged. */
  readonly legalBasis?: "verified" | "unverified" | "advisory" | "inactive" | undefined;
}

export interface ValidationRunResult {
  readonly status: "PASSED" | "BLOCKED" | "REVIEW_REQUIRED" | "DOCUMENTS_MISSING" | "HUMAN_VERIFICATION_REQUIRED" | "RULE_UNVERIFIED";
  readonly criticalBlockers: number; readonly advisoryWarnings: number;
  readonly evaluatedRulesCount: number; readonly findings: readonly ValidationFinding[];
  readonly evaluatedAt: string;
}

export interface AuditEvent {
  readonly id: string; readonly tenantId: string; readonly dossierId: string;
  readonly actorId: string; readonly actorRole: UserRole; readonly eventType: string;
  readonly entityType: string; readonly entityId: string;
  readonly payloadBefore: Record<string, unknown> | null;
  readonly payloadAfter: Record<string, unknown> | null;
  readonly timestamp: string; readonly eventHash: string; readonly previousHash: string;
}

export interface ContainerDossier {
  readonly id: string; readonly tenantId: string; readonly dossierCode: string;
  readonly containerNumber: string; readonly sealNumber: string;
  readonly targetMarket: string; readonly borderGate: string;
  readonly targetTemperatureC: number;
  readonly declaredNetWeightKg?: number | undefined;
  readonly declaredBoxCount?: number | undefined;
  readonly lifecycleState: DossierLifecycleState; readonly isImmutable: boolean;
  readonly createdAt: string; readonly updatedAt: string;
  readonly exportSealedAt?: string | undefined;
  /**
   * Monotonic per-dossier counter. A save carrying a version older than the stored
   * one is refused, so two editors cannot silently overwrite each other's work.
   */
  readonly version: number;
  readonly documents: readonly IngestedDocument[];
  readonly latestValidationResult?: ValidationRunResult | undefined;
}

/** Re-exported so existing deep imports keep resolving; defined in export-manifest-types.ts. */
export type { DossierExportManifest } from "./export-manifest-types.js";
export type { Lot, Organization, Permission, ProductionSource, TestEvidence } from "./traceability-entities.js";

