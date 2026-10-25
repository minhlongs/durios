import type { DocumentType, FieldVerificationStatus, ProductPersona, TenantType, UserRole } from "./types.js";

/**
 * Canonical Grab-standard P1/P2 domain entities for Vietnamese durian export:
 * - Organization & Permission (Step 01: GACC registered legal exporter entity + RBAC permissions)
 * - ProductionSource (Step 02: MARD-issued Production Unit Code / PUC orchard registry, 1,599 orchards)
 * - Lot (Step 04: Atomic Lot lineage binding PUC orchard harvest to container dossier)
 * - TestEvidence (Step 07: ISO 17025 accredited lab heavy-metal / cadmium test evidence)
 */
export type Permission =
  | "DOSSIER_CREATE"
  | "DOCUMENT_UPLOAD"
  | "FIELD_VERIFY"
  | "VALIDATION_RUN"
  | "BLOCKER_OVERRIDE"
  | "DOSSIER_APPROVE"
  | "DOSSIER_EXPORT"
  | "SHARE_GRANT"
  | "AUDIT_READ";

export interface Organization {
  readonly id: string;
  readonly tenantId: string;
  readonly legalNameVi: string;
  readonly taxCodeMst: string;
  readonly tenantType: TenantType;
  readonly gaccPhcCode?: string | undefined;
  readonly defaultRolePermissions: Readonly<Record<UserRole, readonly Permission[]>>;
  readonly primaryPersona: ProductPersona;
}

export interface ProductionSource {
  readonly pucCode: string;
  readonly orchardNameVi: string;
  readonly province: string;
  readonly district: string;
  readonly mardIssuedStatus: "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly registeredHectares: number;
}

export interface Lot {
  readonly lotId: string;
  readonly dossierId: string;
  readonly pucCode: string;
  readonly phcCode: string;
  readonly harvestDateIso: string;
  readonly netWeightKg: number;
  readonly boxCount: number;
  readonly cultivar: "RI6" | "MONTHONG" | "MUSANG_KING";
}

export interface TestEvidence {
  readonly evidenceId: string;
  readonly dossierId: string;
  readonly lotId?: string | undefined;
  readonly documentType: Extract<DocumentType, "LAB_TEST_REPORT">;
  readonly labName: string;
  readonly iso17025AccreditationCode: string;
  readonly cadmiumMgKg: number;
  readonly auramineODetected: boolean;
  readonly verificationStatus: FieldVerificationStatus;
  readonly testedAtIso: string;
}
