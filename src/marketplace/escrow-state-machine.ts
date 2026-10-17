import { AccessControlError, assertValidActor } from "../auth/rbac-policy.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../domain/types.js";
import type {
  BankEscrowWebhookCallbackInput, CreateMarketplaceListingInput,
  DurianMarketplaceListing, InitiateNonCustodialEscrowInput, NonCustodialEscrowContract,
} from "../domain/marketplace-types.js";
import {
  assertMarketplaceFeatureUnlocked, assertZeroCustodyCompliance, type MarketplaceDualLockContext,
} from "./marketplace-guard.js";

const STATUTORY_ESCROW_NOTICE = "DuriOS chỉ điều phối trạng thái chứng từ; hợp đồng mua bán thuộc bên mua và bên bán; tiền ký quỹ do ngân hàng được cấp phép nắm giữ theo Nghị định 52/2024/NĐ-CP và Luật TMĐT 122/2025/QH15.";

export class NonCustodialEscrowCoordinator {
  private readonly listings = new Map<string, DurianMarketplaceListing>();
  private readonly contracts = new Map<string, NonCustodialEscrowContract>();
  private readonly processedIdempotencyKeys = new Map<string, NonCustodialEscrowContract>();
  constructor(private lockContext: MarketplaceDualLockContext) {}
  public updateLockContext(newContext: MarketplaceDualLockContext): void { this.lockContext = newContext; }

  public createListing(dossier: ContainerDossier, input: CreateMarketplaceListingInput, actor: AuthenticatedActor): DurianMarketplaceListing {
    assertMarketplaceFeatureUnlocked(this.lockContext);
    assertValidActor(actor);
    if (actor.tenantType !== "PACKHOUSE_EXPORTER" || actor.tenantId !== dossier.tenantId) {
      throw new AccessControlError("Only owning PACKHOUSE_EXPORTER tenant can list a dossier.", "CROSS_TENANT_FORBIDDEN");
    }
    if (actor.role !== "MANAGER" && actor.role !== "ADMIN") {
      throw new AccessControlError("Only MANAGER or ADMIN can publish a B2B listing.", "INSUFFICIENT_ROLE");
    }
    const now = new Date().toISOString();
    const listing: DurianMarketplaceListing = {
      listingId: `LST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      dossierId: dossier.id, sellerTenantId: dossier.tenantId,
      variety: input.variety, targetMarket: input.targetMarket, borderGate: dossier.borderGate,
      quantityBoxes: dossier.declaredBoxCount ?? 0, netWeightKg: dossier.declaredNetWeightKg ?? 0,
      indicativePriceVndPerKg: input.indicativePriceVndPerKg,
      listingStatus: "PUBLISHED_TO_APPROVED_BUYERS",
      approvedBuyerTenantIds: [...input.approvedBuyerTenantIds],
      createdAt: now, updatedAt: now, statutoryDisclaimer: STATUTORY_ESCROW_NOTICE,
    };
    this.listings.set(listing.listingId, listing);
    return listing;
  }

  public getListingForActor(listingId: string, actor: AuthenticatedActor): DurianMarketplaceListing {
    assertMarketplaceFeatureUnlocked(this.lockContext);
    assertValidActor(actor);
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error(`Listing '${listingId}' not found.`);
    const isOwner = actor.tenantId === listing.sellerTenantId;
    const isApprovedBuyer = listing.approvedBuyerTenantIds.includes(actor.tenantId);
    if (!isOwner && !isApprovedBuyer && actor.role !== "AUDITOR") {
      throw new AccessControlError(`Tenant '${actor.tenantId}' is not authorized to view listing '${listingId}'.`, "CROSS_TENANT_FORBIDDEN");
    }
    return actor.role === "AUDITOR" ? { ...listing, indicativePriceVndPerKg: undefined } : listing;
  }

  public initiateEscrowContract(
    input: InitiateNonCustodialEscrowInput, rawPayload: Record<string, unknown>, actor: AuthenticatedActor
  ): NonCustodialEscrowContract {
    assertMarketplaceFeatureUnlocked(this.lockContext);
    assertValidActor(actor);
    assertZeroCustodyCompliance(rawPayload, input.custodyMode);
    const existing = this.processedIdempotencyKeys.get(input.idempotencyKey);
    if (existing) return existing;

    const listing = this.listings.get(input.listingId);
    if (!listing) throw new Error(`Listing '${input.listingId}' not found.`);
    if (!listing.approvedBuyerTenantIds.includes(actor.tenantId)) {
      throw new AccessControlError(`Buyer tenant '${actor.tenantId}' is not approved on listing '${listing.listingId}'.`, "CROSS_TENANT_FORBIDDEN");
    }

    const now = new Date().toISOString();
    const contract: NonCustodialEscrowContract = {
      contractId: `ESC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      listingId: listing.listingId, dossierId: listing.dossierId,
      sellerTenantId: listing.sellerTenantId, buyerTenantId: actor.tenantId,
      custodyMode: "ZERO_CUSTODY_LICENSED_BANK_PARTNER",
      licensedBankPartnerCode: input.licensedBankPartnerCode,
      bankEscrowReferenceNo: input.bankEscrowReferenceNo,
      expectedManifestSha256: input.expectedManifestSha256,
      status: "AWAITING_BANK_LOCK", lastIdempotencyKey: input.idempotencyKey,
      createdAt: now, updatedAt: now, statutoryNotice: STATUTORY_ESCROW_NOTICE,
    };
    this.contracts.set(contract.contractId, contract);
    this.processedIdempotencyKeys.set(input.idempotencyKey, contract);
    this.listings.set(listing.listingId, { ...listing, listingStatus: "MATCHED", updatedAt: now });
    return contract;
  }

  public handleBankWebhookCallback(callback: BankEscrowWebhookCallbackInput): NonCustodialEscrowContract {
    assertMarketplaceFeatureUnlocked(this.lockContext);
    const cached = this.processedIdempotencyKeys.get(callback.idempotencyKey);
    if (cached) return cached;
    const contract = this.contracts.get(callback.contractId);
    if (!contract) throw new Error(`Escrow contract '${callback.contractId}' not found.`);
    if (contract.bankEscrowReferenceNo !== callback.bankEscrowReferenceNo) throw new Error("Bank escrow reference mismatch.");
    if (callback.eventType === "BANK_SETTLEMENT_COMPLETED" && contract.status !== "RELEASE_AUTHORIZED_AT_BANK") {
      throw new Error("Cannot settle escrow before release is authorized at bank.");
    }
    const nextStatus =
      callback.eventType === "BANK_FUNDS_LOCKED" ? "BANK_ESCROW_LOCKED"
        : callback.eventType === "BANK_SETTLEMENT_COMPLETED" ? "SETTLED_DIRECTLY_BY_BANK" : "DISPUTED_AT_BANK";
    const updated: NonCustodialEscrowContract = {
      ...contract, status: nextStatus, lastIdempotencyKey: callback.idempotencyKey, updatedAt: new Date().toISOString(),
    };
    this.contracts.set(contract.contractId, updated);
    this.processedIdempotencyKeys.set(callback.idempotencyKey, updated);
    return updated;
  }

  public authorizeBankEscrowRelease(
    contractId: string, dossier: ContainerDossier, exportManifest: DossierExportManifest, actor: AuthenticatedActor
  ): NonCustodialEscrowContract {
    assertMarketplaceFeatureUnlocked(this.lockContext);
    assertValidActor(actor);
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Escrow contract '${contractId}' not found.`);
    if (actor.tenantId !== contract.sellerTenantId && actor.tenantId !== contract.buyerTenantId) {
      throw new AccessControlError("Only participating buyer or seller tenant can authorize bank escrow release.", "CROSS_TENANT_FORBIDDEN");
    }
    if (contract.status !== "BANK_ESCROW_LOCKED") throw new Error(`Cannot authorize release when escrow status is '${contract.status}'.`);
    if (dossier.id !== contract.dossierId || dossier.lifecycleState !== "EXPORTED" || !dossier.isImmutable) {
      throw new Error("Escrow release requires a sealed EXPORTED container dossier.");
    }
    if (exportManifest.compositeManifestSha256 !== contract.expectedManifestSha256) {
      throw new Error(`Manifest SHA-256 mismatch: expected '${contract.expectedManifestSha256}', got '${exportManifest.compositeManifestSha256}'.`);
    }
    const now = new Date().toISOString();
    const updated: NonCustodialEscrowContract = {
      ...contract, status: "RELEASE_AUTHORIZED_AT_BANK",
      verifiedManifestSha256: exportManifest.compositeManifestSha256,
      releaseAuthorizedAt: now, releaseAuthorizedByActorId: actor.id, updatedAt: now,
    };
    this.contracts.set(contractId, updated);
    return updated;
  }
}
