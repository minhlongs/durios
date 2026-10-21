import { describe, expect, it } from "bun:test";
import {
  exportWorkspacePortabilityBundle,
  verifyWorkspacePortabilityBundle,
} from "../src/saas/workspace-portability-bundle.js";
import type { ContainerDossier, AuditEvent } from "../src/domain/types.js";
function buildMockDossier(id: string): ContainerDossier {
  return {
    id,
    tenantId: "TEN-CAILAY-01",
    dossierCode: `DUR-2026-${id}`,
    containerNumber: "MSCU1234567",
    sealNumber: "SEAL-889900",
    targetMarket: "CN",
    borderGate: "Hữu Nghị",
    targetTemperatureC: 13.5,
    lifecycleState: "APPROVED_FOR_EXPORT",
    isImmutable: true,
    createdAt: "2026-10-17T08:00:00.000Z",
    updatedAt: "2026-10-17T08:04:00.000Z",
    documents: [],
  };
}
function buildMockAuditEvent(id: string): AuditEvent {
  return {
    id,
    tenantId: "TEN-CAILAY-01",
    dossierId: "DOS-1",
    actorId: "ACT-01",
    actorRole: "MANAGER",
    eventType: "DOSSIER_APPROVED",
    entityType: "DOSSIER",
    entityId: "DOS-1",
    payloadBefore: null,
    payloadAfter: { approved: true },
    timestamp: "2026-10-17T08:04:00.000Z",
    eventHash: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
    previousHash: "GENESIS-0000000000000000000000000000000000000000000000000000000000000000",
  };
}
describe("Step 14: Signed Workspace Portability Funnel (Community -> Pro/Enterprise)", () => {
  const secret = "durios-super-secret-portability-key-2026";
  it("exports and verifies a signed workspace portability bundle with HMAC", () => {
    const dossiers = [buildMockDossier("DOS-1"), buildMockDossier("DOS-2")];
    const events = [buildMockAuditEvent("AUD-1")];
    const bundle = exportWorkspacePortabilityBundle(
      "TEN-CAILAY-01",
      "Vựa Sầu Riêng Cai Lậy",
      "PACKHOUSE_EXPORTER",
      dossiers,
      events,
      secret
    );
    expect(bundle.payload.tenantId).toBe("TEN-CAILAY-01");
    expect(bundle.payload.totalDossiersCount).toBe(2);
    expect(bundle.payload.profile.verifiedShipmentsCount).toBe(2);
    expect(bundle.payload.profile.unresolvedSealMismatches).toBe(0);
    expect(bundle.hmacSignatureSha256).toBeDefined();
    const verification = verifyWorkspacePortabilityBundle(bundle, secret);
    expect(verification.valid).toBe(true);
  });
  it("rejects bundle if payload is tampered with", () => {
    const dossiers = [buildMockDossier("DOS-1")];
    const events = [buildMockAuditEvent("AUD-1")];
    const bundle = exportWorkspacePortabilityBundle(
      "TEN-CAILAY-01",
      "Vựa Sầu Riêng Cai Lậy",
      "PACKHOUSE_EXPORTER",
      dossiers,
      events,
      secret
    );
    const tamperedBundle = {
      ...bundle,
      payload: {
        ...bundle.payload,
        totalDossiersCount: 999, // tampered!
      },
    };
    const verification = verifyWorkspacePortabilityBundle(tamperedBundle, secret);
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("SHA-256 hash mismatch");
  });
  it("rejects bundle if HMAC signature does not match secret", () => {
    const dossiers = [buildMockDossier("DOS-1")];
    const events = [buildMockAuditEvent("AUD-1")];
    const bundle = exportWorkspacePortabilityBundle(
      "TEN-CAILAY-01",
      "Vựa Sầu Riêng Cai Lậy",
      "PACKHOUSE_EXPORTER",
      dossiers,
      events,
      secret
    );
    const verification = verifyWorkspacePortabilityBundle(bundle, "wrong-shared-secret-key-12345");
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("HMAC signature verification failed");
  });
});
