import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { ContainerDossier } from "../src/domain/types.js";
import {
  ADMIN,
  ATTACKER_TENANT_B,
  CLERK,
  MANAGER,
  createPassingDossier,
} from "./helpers/security-export-fixtures.js";

interface WorkspaceWithInternalRepo {
  repo: {
    save: (dossier: ContainerDossier) => void;
  };
}

describe("DuriOS Security & Export Suite", () => {
  it("T09: Cross-tenant data access is isolated and clerk unauthorized sign-off is blocked", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-202610-001",
        containerNumber: "MSKU1234565",
        sealNumber: "SL-998822",
        targetMarket: "CN",
        borderGate: "Huu Nghi",
        targetTemperatureC: 14.0,
        declaredNetWeightKg: 18240,
        declaredBoxCount: 960,
      },
      CLERK
    );

    const tenantBQuery = ws.getDossier(dossier.id, ATTACKER_TENANT_B);
    expect(tenantBQuery).toBeUndefined();

    expect(() => {
      ws.approveForExport(dossier.id, CLERK);
    }).toThrow(/Clerk role is unauthorized/);
  });

  it("T10: Export generates immutable sealed manifest with composite SHA-256 and disclaimers", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = createPassingDossier(ws, "DOS-202610-001");
    const pdfBytes1 = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x11]);

    const validation = ws.runValidation(dossier.id, CLERK);
    expect(validation.status).toBe("PASSED");

    ws.approveForExport(dossier.id, MANAGER);
    const manifest = ws.exportDossier(dossier.id, MANAGER);

    expect(manifest.lifecycleState).toBe("EXPORTED");
    expect(manifest.isImmutable).toBe(true);
    expect(manifest.compositeManifestSha256).toHaveLength(64);
    expect(manifest.regulatoryDisclaimers.length).toBeGreaterThan(0);
    expect(manifest.documents.length).toBe(3);

    expect(() => {
      ws.uploadDocument(dossier.id, pdfBytes1, "Extra.pdf", "BILL_OF_LADING", CLERK);
    }).toThrow(/Cannot upload to sealed dossier/);

    expect(() => {
      ws.runValidation(dossier.id, CLERK);
    }).toThrow(/Cannot validate sealed dossier/);
  });

  it("T11: Prohibits validation on sealed (EXPORTED, CLOSED, or isImmutable) dossiers without side effects", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = createPassingDossier(ws, "DOS-VAL-SEALED");

    const initialVal = ws.runValidation(dossier.id, CLERK);
    expect(initialVal.status).toBe("PASSED");
    ws.approveForExport(dossier.id, MANAGER);
    const manifest = ws.exportDossier(dossier.id, MANAGER);
    expect(manifest.isImmutable).toBe(true);

    const exportedDossier = ws.getDossier(dossier.id, CLERK)!;
    expect(exportedDossier.lifecycleState).toBe("EXPORTED");
    expect(exportedDossier.isImmutable).toBe(true);
    const initialEventCount = ws.auditLedger.getEventsForDossier(dossier.id, CLERK.tenantId).length;

    expect(() => {
      ws.runValidation(dossier.id, CLERK);
    }).toThrow(/Cannot validate sealed dossier/);

    expect(() => {
      ws.runValidation(dossier.id, MANAGER);
    }).toThrow(/Cannot validate sealed dossier/);

    const repo = (ws as unknown as WorkspaceWithInternalRepo).repo;
    const closedDossier: ContainerDossier = { ...exportedDossier, lifecycleState: "CLOSED" };
    repo.save(closedDossier);
    expect(() => {
      ws.runValidation(dossier.id, CLERK);
    }).toThrow(/Cannot validate sealed dossier/);

    const draftImmutable: ContainerDossier = { ...closedDossier, lifecycleState: "DRAFT", isImmutable: true };
    repo.save(draftImmutable);
    expect(() => {
      ws.runValidation(dossier.id, CLERK);
    }).toThrow(/Cannot validate sealed dossier/);

    const exportedNotImmutable: ContainerDossier = { ...closedDossier, lifecycleState: "EXPORTED", isImmutable: false };
    repo.save(exportedNotImmutable);
    expect(() => {
      ws.runValidation(dossier.id, CLERK);
    }).toThrow(/Cannot validate sealed dossier/);

    repo.save(exportedDossier);
    const postDossier = ws.getDossier(dossier.id, CLERK)!;
    expect(postDossier.lifecycleState).toBe("EXPORTED");
    expect(postDossier.isImmutable).toBe(true);
    expect(postDossier.latestValidationResult?.status).toBe("PASSED");
    expect(postDossier.updatedAt).toBe(exportedDossier.updatedAt);

    const postEventCount = ws.auditLedger.getEventsForDossier(dossier.id, CLERK.tenantId).length;
    expect(postEventCount).toBe(initialEventCount);

    expect(manifest.compositeManifestSha256).toHaveLength(64);
    expect(manifest.lifecycleState).toBe("EXPORTED");
    expect(manifest.isImmutable).toBe(true);
  });

  it("T12: Prohibits CLERK from exporting dossier; MANAGER and ADMIN are authorized", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = createPassingDossier(ws, "DOS-AUTH-EXPORT");

    ws.runValidation(dossier.id, CLERK);
    ws.approveForExport(dossier.id, MANAGER);

    const approvedDossier = ws.getDossier(dossier.id, CLERK)!;
    expect(approvedDossier.lifecycleState).toBe("APPROVED_FOR_EXPORT");
    expect(approvedDossier.isImmutable).toBe(false);
    const initialEvents = ws.auditLedger.getEventsForDossier(dossier.id, CLERK.tenantId).length;

    expect(() => {
      ws.exportDossier(dossier.id, CLERK);
    }).toThrow(/Clerk role is unauthorized to export dossier/);

    const afterReject = ws.getDossier(dossier.id, CLERK)!;
    expect(afterReject.lifecycleState).toBe("APPROVED_FOR_EXPORT");
    expect(afterReject.isImmutable).toBe(false);
    expect(ws.getExportManifest(dossier.id, CLERK)).toBeUndefined();
    expect(ws.auditLedger.getEventsForDossier(dossier.id, CLERK.tenantId).length).toBe(initialEvents);

    const mgrManifest = ws.exportDossier(dossier.id, MANAGER);
    expect(mgrManifest.lifecycleState).toBe("EXPORTED");
    expect(mgrManifest.isImmutable).toBe(true);

    const dossier2 = createPassingDossier(ws, "DOS-ADMIN-EXP");
    ws.runValidation(dossier2.id, CLERK);
    ws.approveForExport(dossier2.id, ADMIN);
    const adminManifest = ws.exportDossier(dossier2.id, ADMIN);
    expect(adminManifest.lifecycleState).toBe("EXPORTED");
    expect(adminManifest.isImmutable).toBe(true);
  });
});
