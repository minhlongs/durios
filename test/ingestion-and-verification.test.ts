import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { calculateSha256 } from "../src/ingestion/document-hasher.js";
import type { AuthenticatedActor } from "../src/domain/types.js";

const CLERK: AuthenticatedActor = {
  id: "usr-clerk-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK",
  persona: "PACKHOUSE_CLERK",
  name: "Clerk Le",
};

describe("DuriOS Ingestion & HITL Verification Suite", () => {
  it("T01: Valid document upload calculates server-side SHA-256 and transitions state", () => {
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

    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const expectedHash = calculateSha256(validPdfBytes);

    const { dossier: updatedDossier, document: doc } = ws.uploadDocument(
      dossier.id,
      validPdfBytes,
      "PackingList.pdf",
      "PACKING_LIST",
      CLERK
    );

    expect(doc.sha256Hash).toBe(expectedHash);
    expect(doc.mimeType).toBe("application/pdf");
    expect(updatedDossier.lifecycleState).toBe("HUMAN_VERIFICATION_REQUIRED");
    expect(doc.extractedFields.length).toBeGreaterThan(0);
  });

  it("T02: Malformed or unsupported file rejected at ingestion boundary", () => {
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

    const executableBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ executable header
    expect(() => {
      ws.uploadDocument(dossier.id, executableBytes, "malicious.exe", "PACKING_LIST", CLERK);
    }).toThrow(/Rejected malformed or unsupported file type/);

    const fresh = ws.getDossier(dossier.id, CLERK);
    expect(fresh?.documents.length).toBe(0);
  });

  it("T03: Server-side SHA-256 calculation matches byte stream hashing identically", () => {
    const sampleBytes = new TextEncoder().encode("DuriOS Phytosanitary Evidence Certificate 2026");
    const hash = calculateSha256(sampleBytes);
    expect(hash).toHaveLength(64);
    expect(calculateSha256(sampleBytes)).toBe(hash);
  });

  it("T04: Unverified fields block finalized validation run", () => {
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

    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    ws.uploadDocument(dossier.id, validPdfBytes, "PackingList.pdf", "PACKING_LIST", CLERK);

    // Attempt to run validation while fields are still in DRAFT status
    const result = ws.runValidation(dossier.id, CLERK);
    expect(result.status).toBe("HUMAN_VERIFICATION_REQUIRED");
    expect(result.findings[0]?.ruleId).toBe("RUL-GATE-UNVERIFIED");

    const fresh = ws.getDossier(dossier.id, CLERK);
    expect(fresh?.lifecycleState).toBe("HUMAN_VERIFICATION_REQUIRED");
  });

  it("T05: Human correction preserves original raw value and records audit event", () => {
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

    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const { document: doc } = ws.uploadDocument(
      dossier.id,
      validPdfBytes,
      "PackingList.pdf",
      "PACKING_LIST",
      CLERK
    );

    const targetField = doc.extractedFields.find((f) => f.fieldKey === "box_count")!;

    const updated = ws.verifyField(
      dossier.id,
      doc.id,
      {
        fieldId: targetField.id,
        confirmedValue: "980", // Correct machine raw 960 to 980
        clerkNote: "Correction based on physical pallet recount",
      },
      CLERK
    );

    const activeDoc = updated.documents.find((d) => d.id === doc.id)!;
    const verifiedField = activeDoc.extractedFields.find((f) => f.id === targetField.id)!;

    expect(verifiedField.rawValue).toBe("960");
    expect(verifiedField.confirmedValue).toBe("980");
    expect(verifiedField.verificationStatus).toBe("HUMAN_VERIFIED");

    const auditEvents = ws.auditLedger.getEventsForDossier(dossier.id, CLERK.tenantId);
    const editEvent = auditEvents.find((e) => e.eventType === "FIELD_MANUALLY_EDITED");
    expect(editEvent).toBeDefined();
    expect(editEvent?.payloadBefore?.["rawValue"]).toBe("960");
    expect(editEvent?.payloadAfter?.["confirmedValue"]).toBe("980");
  });
});
