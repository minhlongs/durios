export type UserRole = "CLERK" | "MANAGER" | "ADMIN";

export interface AuthenticatedActor {
  readonly id: string;
  readonly tenantId: string;
  readonly role: UserRole;
  readonly name: string;
}

export type DossierLifecycleState =
  | "DRAFT"
  | "DOCUMENTS_PENDING"
  | "PROCESSING"
  | "HUMAN_VERIFICATION_REQUIRED"
  | "VALIDATION_BLOCKED"
  | "REVIEW_REQUIRED"
  | "READY_FOR_REVIEW"
  | "APPROVED_FOR_EXPORT"
  | "EXPORTED"
  | "CLOSED"
  | "CANCELLED";

export type DocumentType =
  | "LAB_TEST_REPORT"
  | "PACKING_LIST"
  | "PHYTOSANITARY_CERTIFICATE"
  | "CUSTOMS_DECLARATION"
  | "BILL_OF_LADING";

export type FieldVerificationStatus = "DRAFT" | "HUMAN_VERIFIED" | "REJECTED";

export interface BoundingBox {
  readonly pageNumber: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ExtractedField {
  readonly id: string;
  readonly documentId: string;
  readonly fieldKey: string;
  readonly label: string;
  readonly rawValue: string;
  readonly normalizedValue: string | number | null;
  readonly confidenceScore: number;
  readonly boundingBox: BoundingBox;
  readonly verificationStatus: FieldVerificationStatus;
  readonly confirmedValue?: string | number | null | undefined;
  readonly verifiedBy?: string | undefined;
  readonly verifiedAt?: string | undefined;
  readonly clerkNote?: string | undefined;
}

export interface IngestedDocument {
  readonly id: string;
  readonly dossierId: string;
  readonly tenantId: string;
  readonly documentType: DocumentType;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly sha256Hash: string;
  readonly uploadedAt: string;
  readonly isSuperseded: boolean;
  readonly extractedFields: readonly ExtractedField[];
}

export type RuleSeverity = "CRITICAL_BLOCKER" | "ADVISORY_WARNING";

export interface ComplianceRule {
  readonly ruleId: string;
  readonly name: string;
  readonly severity: RuleSeverity;
  readonly description: string;
  readonly governingAuthority: string;
  readonly statutoryReference: string;
  readonly isActive: boolean;
  readonly isStatutoryVerified: boolean;
  readonly fieldKeyRef?: string | undefined;
  readonly threshold?: number | undefined;
  readonly unit?: string | undefined;
  readonly evaluationType:
    | "DOCUMENT_PRESENCE"
    | "NUMERIC_THRESHOLD"
    | "ALGORITHMIC_CHECKSUM"
    | "CROSS_DOCUMENT_EQUALITY"
    | "CHRONOLOGICAL_SANITY";
}

export interface ValidationFinding {
  readonly ruleId: string;
  readonly severity: RuleSeverity;
  readonly ruleName: string;
  readonly citation: string;
  readonly observedValue: string;
  readonly thresholdValue: string;
  readonly messageVi: string;
  readonly messageEn: string;
}

export interface ValidationRunResult {
  readonly status:
    | "PASSED"
    | "BLOCKED"
    | "REVIEW_REQUIRED"
    | "DOCUMENTS_MISSING"
    | "HUMAN_VERIFICATION_REQUIRED"
    | "RULE_UNVERIFIED";
  readonly criticalBlockers: number;
  readonly advisoryWarnings: number;
  readonly evaluatedRulesCount: number;
  readonly findings: readonly ValidationFinding[];
  readonly evaluatedAt: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly tenantId: string;
  readonly dossierId: string;
  readonly actorId: string;
  readonly actorRole: UserRole;
  readonly eventType: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly payloadBefore: Record<string, unknown> | null;
  readonly payloadAfter: Record<string, unknown> | null;
  readonly timestamp: string;
  readonly eventHash: string;
  readonly previousHash: string;
}

export interface ContainerDossier {
  readonly id: string;
  readonly tenantId: string;
  readonly dossierCode: string;
  readonly containerNumber: string;
  readonly sealNumber: string;
  readonly targetMarket: string;
  readonly borderGate: string;
  readonly targetTemperatureC: number;
  readonly declaredNetWeightKg?: number | undefined;
  readonly declaredBoxCount?: number | undefined;
  readonly lifecycleState: DossierLifecycleState;
  readonly isImmutable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly exportSealedAt?: string | undefined;
  readonly documents: readonly IngestedDocument[];
  readonly latestValidationResult?: ValidationRunResult | undefined;
}

export interface DossierExportManifest {
  readonly manifestVersion: "1.0.0";
  readonly dossierId: string;
  readonly dossierCode: string;
  readonly tenantId: string;
  readonly containerNumber: string;
  readonly sealNumber: string;
  readonly lifecycleState: DossierLifecycleState;
  readonly isImmutable: boolean;
  readonly exportedAt: string;
  readonly exportedBy: string;
  readonly compositeManifestSha256: string;
  readonly documents: readonly {
    readonly documentId: string;
    readonly documentType: DocumentType;
    readonly fileName: string;
    readonly sha256Hash: string;
    readonly verifiedFieldCount: number;
  }[];
  readonly verifiedDataSummary: Record<string, unknown>;
  readonly complianceFindingsCount: {
    readonly criticalBlockers: number;
    readonly advisoryWarnings: number;
  };
  readonly regulatoryDisclaimers: readonly string[];
}
