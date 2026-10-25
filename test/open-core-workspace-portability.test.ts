import { describe, expect, it } from "bun:test";
import {
  exportWorkspacePortabilityBundle,
  verifyWorkspacePortabilityBundle,
  type SignedWorkspacePortabilityBundle,
} from "../src/saas/workspace-portability-bundle.js";
import type { ContainerDossier, AuditEvent } from "../src/domain/types.js";

const TENANT = { id: "TEN-CAILAY-01", name: "Vựa Sầu Riêng Cai Lậy", type: "PACKHOUSE_EXPORTER" };
const SECRET = "durios-super-secret-portability-key-2026";

function buildMockDossier(id: string): ContainerDossier {
  return {
    id,
    tenantId: TENANT.id,
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
    version: 1,
    documents: [],
  };
}
function buildMockAuditEvent(id: string): AuditEvent {
  return {
    id,
    tenantId: TENANT.id,
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
function exportSigned(
  dossiers: readonly ContainerDossier[],
  events: readonly AuditEvent[]
): SignedWorkspacePortabilityBundle {
  return exportWorkspacePortabilityBundle(TENANT.id, TENANT.name, TENANT.type, dossiers, events, SECRET);
}
describe("Step 14: Signed Workspace Portability Funnel (Community -> Pro/Enterprise)", () => {
  it("exports and verifies a signed workspace portability bundle with HMAC", () => {
    const bundle = exportSigned(
      [buildMockDossier("DOS-1"), buildMockDossier("DOS-2")],
      [buildMockAuditEvent("AUD-1")]
    );
    expect(bundle.payload.tenantId).toBe(TENANT.id);
    expect(bundle.payload.totalDossiersCount).toBe(2);
    expect(bundle.payload.profile.verifiedShipmentsCount).toBe(2);
    expect(bundle.payload.profile.unresolvedSealMismatches).toBe(0);
    expect(bundle.hmacSignatureSha256).toBeDefined();
    expect(verifyWorkspacePortabilityBundle(bundle, SECRET).valid).toBe(true);
  });
  it("rejects bundle if payload is tampered with", () => {
    const bundle = exportSigned([buildMockDossier("DOS-1")], [buildMockAuditEvent("AUD-1")]);
    const verification = verifyWorkspacePortabilityBundle({
      ...bundle,
      payload: { ...bundle.payload, totalDossiersCount: 999 },
    }, SECRET);
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("SHA-256 hash mismatch");
  });
  it("rejects bundle if HMAC signature does not match secret", () => {
    const bundle = exportSigned([buildMockDossier("DOS-1")], [buildMockAuditEvent("AUD-1")]);
    const verification = verifyWorkspacePortabilityBundle(bundle, "wrong-shared-secret-key-12345");
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("HMAC signature verification failed");
  });
});
