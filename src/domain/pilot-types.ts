export type SharePurpose =
  | "CUSTOMS_INSPECTION"
  | "BUYER_VERIFICATION"
  | "AUDIT"
  | "LOGISTICS";

export type ShareScope = "READ_ONLY" | "READ_AND_VERIFY";

export interface ShareAccessGrant {
  readonly id: string;
  readonly dossierId: string;
  readonly ownerTenantId: string;
  readonly granteeTenantId: string;
  readonly purpose: SharePurpose;
  readonly scope: ShareScope;
  readonly grantedAt: string;
  readonly grantedBy: string;
  readonly expiresAt: string;
  readonly isRevoked: boolean;
  readonly revokedAt?: string | undefined;
  readonly revokedBy?: string | undefined;
  readonly revocationReason?: string | undefined;
}

export type OrganicStandardCode =
  | "TCVN_11041"
  | "USDA_NOP_EQUIVALENT"
  | "EU_ORGANIC_2018_848"
  | "JAS"
  | "GLOBAL_G.A.P_ORGANIC_CONVERSION";

export type IssuerClaimedOrganicStatus =
  | "IN_CONVERSION"
  | "CERTIFIED"
  | "EXPIRED"
  | "SUSPENDED";

export type OrganicEvidenceStatus = IssuerClaimedOrganicStatus;

export type DuriosOrganicRecordStatus = "EVIDENCE_STORED_NOT_CERTIFIED";

export const DURIOS_ORGANIC_RECORD_STATUS: DuriosOrganicRecordStatus =
  "EVIDENCE_STORED_NOT_CERTIFIED";

export interface OrganicCertificationEvidence {
  readonly id: string;
  readonly dossierId: string;
  readonly tenantId: string;
  readonly certifierName: string;
  readonly certifierAccreditationNumber?: string | undefined;
  readonly certificateNumber: string;
  readonly standardCode: OrganicStandardCode;
  readonly standardDescription: string;
  readonly certifiedScope: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly issuingDate: string;
  readonly issuerClaimedStatus: IssuerClaimedOrganicStatus;
  readonly duriosRecordStatus: DuriosOrganicRecordStatus;
  readonly evidenceDocumentId?: string | undefined;
  readonly sourceDocumentUrl?: string | undefined;
  readonly regulatoryDisclaimer: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
}

export const DURIOS_ORGANIC_DISCLAIMER =
  "DuriOS không cấp giấy chứng nhận hữu cơ và không thay thế cơ quan kiểm định độc lập. " +
  "Hệ thống chỉ lưu trữ bằng chứng, nguồn cấp, phạm vi và thời hạn hiệu lực do tổ chức chứng nhận độc lập ban hành.";
