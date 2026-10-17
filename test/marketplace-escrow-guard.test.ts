import { describe, expect, it } from "bun:test";
import {
  MarketplaceGuardError, assertMarketplaceFeatureUnlocked,
  assertZeroCustodyCompliance, isMarketplaceFeatureUnlocked,
} from "../src/marketplace/marketplace-guard.js";
import { NonCustodialEscrowCoordinator } from "../src/marketplace/escrow-state-machine.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../src/domain/types.js";

const SELLER_MANAGER: AuthenticatedActor = {
  id: "usr-seller-mgr-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "MANAGER", persona: "PACKHOUSE_MANAGER", name: "Cai Lay Packhouse Manager",
};

const SELLER_CLERK: AuthenticatedActor = {
  id: "usr-seller-clerk-01", tenantId: "ten-cailay-001", tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK", persona: "PACKHOUSE_CLERK", name: "Cai Lay Packhouse Clerk",
};

const APPROVED_BUYER: AuthenticatedActor = {
  id: "usr-buyer-01", tenantId: "ten-buyer-cn-001", tenantType: "BUYER_IMPORTER",
  role: "VIEWER", persona: "BUYER_VIEWER", name: "Guangxi Fruit Importer",
};

const UNAPPROVED_BUYER: AuthenticatedActor = {
  id: "usr-buyer-02", tenantId: "ten-buyer-other-999", tenantType: "BUYER_IMPORTER",
  role: "VIEWER", persona: "BUYER_VIEWER", name: "Unapproved Importer",
};

const AUDITOR: AuthenticatedActor = {
  id: "usr-auditor-01", tenantId: "ten-audit-001", tenantType: "INSPECTION_AUDITOR",
  role: "AUDITOR", persona: "SYSTEM_AUDITOR", name: "Statutory Auditor",
};

function createExportedDossierWithManifest(): {
  dossier: ContainerDossier;
  manifest: DossierExportManifest;
} {
  const ws = new ContainerDossierWorkspace();
  const created = ws.createDossier(
    {
      dossierCode: "DOS-MKT-2026-001", containerNumber: "MSKU1234565", sealNumber: "SL-998822",
      targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18240, declaredBoxCount: 960,
    },
    SELLER_CLERK
  );

  const d1 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x11]), "Packing.pdf", "PACKING_LIST", SELLER_CLERK, {
    container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SL-998822" },
    net_weight_kg: { raw: "18240" }, total_boxes: { raw: "960" },
    PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" },
  });
  const d2 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x12]), "Lab.pdf", "LAB_TEST_REPORT", SELLER_CLERK, {
    cadmium_mg_kg: { raw: "0.015" }, sample_code: { raw: "LAB-01" }, sampling_date: { raw: "2026-10-12" },
  });
  const d3 = ws.uploadDocument(created.id, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x13]), "Phyto.pdf", "PHYTOSANITARY_CERTIFICATE", SELLER_CLERK, {
    phyto_cert_no: { raw: "VN-PHYTO-2026-01" }, inspection_date: { raw: "2026-10-12" },
    PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" }, target_temperature_c: { raw: "14" },
  });

  for (const doc of [d1.document, d2.document, d3.document]) {
    for (const f of doc.extractedFields) {
      ws.verifyField(created.id, doc.id, { fieldId: f.id, confirmedValue: f.rawValue }, SELLER_CLERK);
    }
  }

  ws.runValidation(created.id, SELLER_MANAGER);
  ws.approveForExport(created.id, SELLER_MANAGER);
  const manifest = ws.exportDossier(created.id, SELLER_MANAGER);
  const dossier = ws.getDossier(created.id, SELLER_MANAGER)!;
  return { dossier, manifest };
}

describe("Direction 2: Guarded B2B Marketplace & Non-Custodial Escrow Scaffold (Prompt 6A)", () => {
  it("enforces Dual-Lock fail-closed by default when feature flag or pilot gates are not met", () => {
    expect(isMarketplaceFeatureUnlocked({ env: {}, goForLiveCustomerData: false })).toBe(false);
    expect(isMarketplaceFeatureUnlocked({ env: { DURIOS_FEATURE_B2B_MARKETPLACE: "enabled" }, goForLiveCustomerData: false })).toBe(false);
    expect(isMarketplaceFeatureUnlocked({ env: {}, goForLiveCustomerData: true })).toBe(false);
    expect(() => assertMarketplaceFeatureUnlocked({ env: {}, goForLiveCustomerData: true })).toThrow(MarketplaceGuardError);
    expect(() => assertMarketplaceFeatureUnlocked({ env: { DURIOS_FEATURE_B2B_MARKETPLACE: "enabled" }, goForLiveCustomerData: false })).toThrow("GATE-01..GATE-05");
  });

  it("rejects any custodial fund-holding or payment credential fields under Nghị định 52/2024/NĐ-CP", () => {
    expect(() => assertZeroCustodyCompliance({ walletBalance: 500000000 })).toThrow("Zero-custody violation");
    expect(() => assertZeroCustodyCompliance({}, "PLATFORM_WALLET_CUSTODY")).toThrow("Prohibited custody mode");
  });

  it("coordinates B2B listing, tenant privacy, idempotent bank webhooks, and 100% SHA-256 gated release when unlocked", () => {
    const { dossier, manifest } = createExportedDossierWithManifest();
    const coordinator = new NonCustodialEscrowCoordinator({
      env: { DURIOS_FEATURE_B2B_MARKETPLACE: "enabled" }, goForLiveCustomerData: true,
    });

    const listing = coordinator.createListing(
      dossier,
      {
        dossierId: dossier.id, variety: "MONTHONG", targetMarket: "CN",
        indicativePriceVndPerKg: 115000, approvedBuyerTenantIds: [APPROVED_BUYER.tenantId],
      },
      SELLER_MANAGER
    );

    expect(listing.listingStatus).toBe("PUBLISHED_TO_APPROVED_BUYERS");
    expect(() => coordinator.getListingForActor(listing.listingId, UNAPPROVED_BUYER)).toThrow("not authorized");
    expect(coordinator.getListingForActor(listing.listingId, AUDITOR).indicativePriceVndPerKg).toBeUndefined();

    const escrow = coordinator.initiateEscrowContract(
      {
        listingId: listing.listingId, licensedBankPartnerCode: "VIETCOMBANK_TRADE_ESCROW",
        bankEscrowReferenceNo: "VCB-ESC-2026-9001", expectedManifestSha256: manifest.compositeManifestSha256,
        idempotencyKey: "idem-init-001",
      },
      { listingId: listing.listingId },
      APPROVED_BUYER
    );
    expect(escrow.custodyMode).toBe("ZERO_CUSTODY_LICENSED_BANK_PARTNER");
    expect(escrow.status).toBe("AWAITING_BANK_LOCK");

    const webhookPayload = {
      contractId: escrow.contractId, bankEscrowReferenceNo: "VCB-ESC-2026-9001",
      eventType: "BANK_FUNDS_LOCKED" as const, idempotencyKey: "idem-webhook-lock-001",
    };
    const locked1 = coordinator.handleBankWebhookCallback(webhookPayload);
    const locked2 = coordinator.handleBankWebhookCallback(webhookPayload);
    expect(locked1.status).toBe("BANK_ESCROW_LOCKED");
    expect(locked2.updatedAt).toBe(locked1.updatedAt);

    expect(() =>
      coordinator.authorizeBankEscrowRelease(
        escrow.contractId, dossier, { ...manifest, compositeManifestSha256: "f".repeat(64) }, SELLER_MANAGER
      )
    ).toThrow("Manifest SHA-256 mismatch");

    const released = coordinator.authorizeBankEscrowRelease(escrow.contractId, dossier, manifest, SELLER_MANAGER);
    expect(released.status).toBe("RELEASE_AUTHORIZED_AT_BANK");
    expect(released.verifiedManifestSha256).toBe(manifest.compositeManifestSha256);
  });
});
