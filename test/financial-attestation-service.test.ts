import { describe, expect, it } from "bun:test";
import type { AuthenticatedActor, ContainerDossier } from "../src/domain/types.js";
import { FinancialAttestationService } from "../src/saas/financial-attestation-service.js";

const SECRET = "financial-attestation-service-secret";

const manager: AuthenticatedActor = {
  id: "ACTOR-MANAGER",
  tenantId: "TENANT-PACKHOUSE-1",
  role: "MANAGER",
  name: "Packhouse Manager",
  tenantType: "PACKHOUSE_EXPORTER",
  persona: "PACKHOUSE_MANAGER",
};

function dossier(): ContainerDossier {
  return { id: "DOS-1", tenantId: "TENANT-PACKHOUSE-1" } as unknown as ContainerDossier;
}

describe("Financial Attestation Service (mint, single-use replay guard)", () => {
  it("mints a verifiable token bound to the dossier and purpose", () => {
    const service = new FinancialAttestationService(SECRET);
    const token = service.mintAttestation(
      { dossier: dossier(), purpose: "TRADE_FINANCE", institutionTenantId: "TENANT-BANK-1" },
      manager
    );
    const result = service.verifyAndBurn(token);
    expect(result.valid).toBe(true);
    expect(result.payload?.dossierId).toBe("DOS-1");
    expect(result.payload?.institutionTenantId).toBe("TENANT-BANK-1");
  });

  it("burns a nonce on first use and rejects the second presentation (replay)", () => {
    const service = new FinancialAttestationService(SECRET);
    const token = service.mintAttestation(
      { dossier: dossier(), purpose: "MARINE_INSURANCE", institutionTenantId: "TENANT-INSURER-1" },
      manager
    );
    expect(service.verifyAndBurn(token).reason).toBe("ATTESTATION_VALID");
    expect(service.verifyAndBurn(token).reason).toBe("ATTESTATION_ALREADY_USED");
  });

  it("refuses non-owning tenants from minting an attestation", () => {
    const service = new FinancialAttestationService(SECRET);
    const outsider: AuthenticatedActor = { ...manager, id: "ACTOR-OTHER", tenantId: "TENANT-RIVAL" };
    expect(() =>
      service.mintAttestation(
        { dossier: dossier(), purpose: "TRADE_FINANCE", institutionTenantId: "TENANT-BANK-1" },
        outsider
      )
    ).toThrow();
  });

  it("rejects minting for the owning tenant itself as the institution", () => {
    const service = new FinancialAttestationService(SECRET);
    expect(() =>
      service.mintAttestation(
        { dossier: dossier(), purpose: "TRADE_FINANCE", institutionTenantId: "TENANT-PACKHOUSE-1" },
        manager
      )
    ).toThrow();
  });

  it("tracks burned nonces for observability", () => {
    const service = new FinancialAttestationService(SECRET);
    const token = service.mintAttestation(
      { dossier: dossier(), purpose: "TRADE_FINANCE", institutionTenantId: "TENANT-BANK-1" },
      manager
    );
    const first = service.verifyAndBurn(token);
    expect(first.payload).toBeDefined();
    expect(service.isBurned(first.payload!.nonce)).toBe(true);
  });

  it("claims each nonce exactly once via consumeNonce", () => {
    const service = new FinancialAttestationService(SECRET);
    expect(service.consumeNonce("nonce-x")).toBe(true);
    expect(service.consumeNonce("nonce-x")).toBe(false);
  });

  it("rejects a constructor secret below the minimum length", () => {
    expect(() => new FinancialAttestationService("short")).toThrow();
  });
});
