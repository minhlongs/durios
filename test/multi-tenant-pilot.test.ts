import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import {
  makeMultiTenantActor,
  runMultiTenantHttpRouterScenario,
  runOrganicEvidenceWorkspaceScenario,
} from "./helpers/multi-tenant-pilot-scenarios.js";

describe("Prompt 5A: Closed Multi-Tenant Pilot & Security Invariants", () => {
  it("enforces tenant isolation: Tenant B cannot view Tenant A dossier without grant", () => {
    const ws = new ContainerDossierWorkspace();
    const owner = makeMultiTenantActor("TENANT-A", "MANAGER");
    const intruder = makeMultiTenantActor("TENANT-B", "MANAGER");

    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-TEST-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-001",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      },
      owner
    );

    expect(ws.getDossier(dossier.id, owner)).toBeDefined();
    expect(ws.getDossier(dossier.id, intruder)).toBeUndefined();
    expect(ws.listDossiers(intruder).some((d) => d.id === dossier.id)).toBe(false);
  });

  it("permits delegated sharing: grant access, list shared, and immediate revoke", () => {
    const ws = new ContainerDossierWorkspace();
    const owner = makeMultiTenantActor("TENANT-A", "ADMIN");
    const partner = makeMultiTenantActor("TENANT-B", "VIEWER");

    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-SHARE-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-002",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      },
      owner
    );

    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    const grant = ws.shareManager.grantAccess(
      dossier, "TENANT-B", "CUSTOMS_INSPECTION", "READ_ONLY", expiresAt, owner, ws.auditLedger
    );

    expect(grant.isRevoked).toBe(false);
    expect(ws.getDossier(dossier.id, partner)).toBeDefined();
    expect(ws.listDossiers(partner).some((d) => d.id === dossier.id)).toBe(true);

    const revoked = ws.shareManager.revokeAccess(
      grant.id, dossier, "Inspection complete", owner, ws.auditLedger
    );
    expect(revoked.isRevoked).toBe(true);
    expect(ws.getDossier(dossier.id, partner)).toBeUndefined();
    expect(ws.listDossiers(partner).some((d) => d.id === dossier.id)).toBe(false);
  });

  it("enforces role allow/deny: CLERK cannot approve/export, only ADMIN/MANAGER can", () => {
    const ws = new ContainerDossierWorkspace();
    const clerk = makeMultiTenantActor("TENANT-A", "CLERK");

    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-ROLE-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-003",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      },
      clerk
    );

    expect(() => ws.approveForExport(dossier.id, clerk)).toThrow();
    expect(() => ws.exportDossier(dossier.id, clerk)).toThrow();
  });

  it("blocks modifications on sealed/immutable dossiers", () => {
    const ws = new ContainerDossierWorkspace();
    const admin = makeMultiTenantActor("TENANT-A", "ADMIN");

    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-SEAL-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-004",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 14.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      },
      admin
    );

    const rawDossier = ws.getDossier(dossier.id, admin)!;
    const mutableDossier = rawDossier as unknown as { isImmutable: boolean; lifecycleState: string };
    mutableDossier.isImmutable = true;
    mutableDossier.lifecycleState = "EXPORTED";

    const dummyFile = new TextEncoder().encode("dummy file content");
    expect(() => ws.uploadDocument(dossier.id, dummyFile, "test.pdf", "PACKING_LIST", admin)).toThrow(
      "Cannot upload to sealed dossier"
    );

    expect(() =>
      ws.organicEvidenceManager.recordEvidence(
        rawDossier,
        {
          certifierName: "Demo Bio-Inspect Agency (Synthetic)",
          certificateNumber: "SYNTH-ORG-12345", standardCode: "TCVN_11041",
          standardDescription: "Vietnamese Organic", certifiedScope: "Fresh Durian",
          validFrom: "2026-01-01T00:00:00.000Z", validTo: "2027-12-31T23:59:59.000Z",
          issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
        },
        admin,
        ws.auditLedger
      )
    ).toThrow("Cannot attach evidence to sealed dossier");
  });

  it("manages independent organic certification evidence with disclaimer & audit trail", () => {
    runOrganicEvidenceWorkspaceScenario();
  });

  it("exposes REST endpoints for sharing and organic evidence over HTTP router", async () => {
    await runMultiTenantHttpRouterScenario();
  });
});
