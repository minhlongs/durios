export type DurianVariety = "RI6" | "MONTHONG" | "MUSANG_KING";

export type MarketplaceListingStatus =
  | "DRAFT"
  | "PUBLISHED_TO_APPROVED_BUYERS"
  | "MATCHED"
  | "CLOSED"
  | "CANCELLED";

export type EscrowConditionStatus =
  | "AWAITING_BANK_LOCK"
  | "BANK_ESCROW_LOCKED"
  | "RELEASE_AUTHORIZED_AT_BANK"
  | "SETTLED_DIRECTLY_BY_BANK"
  | "DISPUTED_AT_BANK"
  | "CANCELLED";

export interface DurianMarketplaceListing {
  readonly listingId: string;
  readonly dossierId: string;
  readonly sellerTenantId: string;
  readonly variety: DurianVariety;
  readonly targetMarket: "CN" | "VN";
  readonly borderGate: string;
  readonly quantityBoxes: number;
  readonly netWeightKg: number;
  readonly indicativePriceVndPerKg?: number | undefined;
  readonly listingStatus: MarketplaceListingStatus;
  readonly approvedBuyerTenantIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly statutoryDisclaimer: string;
}

export interface NonCustodialEscrowContract {
  readonly contractId: string;
  readonly listingId: string;
  readonly dossierId: string;
  readonly sellerTenantId: string;
  readonly buyerTenantId: string;
  readonly custodyMode: "ZERO_CUSTODY_LICENSED_BANK_PARTNER";
  readonly licensedBankPartnerCode: string;
  readonly bankEscrowReferenceNo: string;
  readonly expectedManifestSha256: string;
  readonly verifiedManifestSha256?: string | undefined;
  readonly status: EscrowConditionStatus;
  readonly lastIdempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly releaseAuthorizedAt?: string | undefined;
  readonly releaseAuthorizedByActorId?: string | undefined;
  readonly statutoryNotice: string;
}

export interface CreateMarketplaceListingInput {
  readonly dossierId: string;
  readonly variety: DurianVariety;
  readonly targetMarket: "CN" | "VN";
  readonly indicativePriceVndPerKg: number;
  readonly approvedBuyerTenantIds: readonly string[];
}

export interface InitiateNonCustodialEscrowInput {
  readonly listingId: string;
  readonly licensedBankPartnerCode: string;
  readonly bankEscrowReferenceNo: string;
  readonly expectedManifestSha256: string;
  readonly idempotencyKey: string;
  readonly custodyMode?: string;
}

export interface BankEscrowWebhookCallbackInput {
  readonly contractId: string;
  readonly bankEscrowReferenceNo: string;
  readonly eventType: "BANK_FUNDS_LOCKED" | "BANK_SETTLEMENT_COMPLETED" | "BANK_DISPUTE_RAISED";
  readonly idempotencyKey: string;
}
