import { describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { defaultExtractorRegistry } from "../src/extraction/composite-extractor-registry.js";
import type { ExtractionContext } from "../src/extraction/extractor-types.js";
import type { AuthenticatedActor, DocumentType } from "../src/domain/types.js";
import { makeMultiTenantActor } from "./helpers/multi-tenant-pilot-scenarios.js";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_BYTES = new Uint8Array(Buffer.concat([PNG_MAGIC, Buffer.from("scan")]));
const PDF_BYTES = new Uint8Array(Buffer.from("%PDF-1.5\n%%EOF\n"));
// Uploads are content-addressed, so each document needs distinct bytes or the second
// upload is (correctly) reported as a duplicate of the first instead of a new document.
const syntheticPdf = (tag: string): Uint8Array => new Uint8Array(Buffer.from(`%PDF-1.5\n% ${tag}\n%%EOF\n`));
const syntheticPng = (tag: string): Uint8Array => new Uint8Array(Buffer.concat([PNG_MAGIC, Buffer.from(tag)]));
const CONTAINER = "MSKU1234565";

const context = (documentType: DocumentType, mimeType: string, fileName: string): ExtractionContext =>
  ({ documentId: "DOC-TEST-1", documentType, fileName, mimeType, sha256Hash: "0".repeat(64) });

function newWorkspace(): { ws: ContainerDossierWorkspace; clerk: AuthenticatedActor; manager: AuthenticatedActor; dossierId: string } {
  const ws = new ContainerDossierWorkspace();
  const clerk = makeMultiTenantActor("TENANT-FC", "CLERK");
  const manager = makeMultiTenantActor("TENANT-FC", "MANAGER");
  const dossier = ws.createDossier({
    dossierCode: "DOS-FC-001", containerNumber: CONTAINER, sealNumber: "SEAL-FC-1", targetMarket: "CN",
    borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, manager);
  return { ws, clerk, manager, dossierId: dossier.id };
}

function verifyEveryExtractedField(ws: ContainerDossierWorkspace, dossierId: string, actor: AuthenticatedActor): void {
  const dossier = ws.getRawDossier(dossierId);
  if (!dossier) throw new Error(`dossier ${dossierId} missing`);
  for (const doc of dossier.documents.filter((d) => !d.isSuperseded)) {
    for (const field of doc.extractedFields) {
      ws.verifyField(dossierId, doc.id, { fieldId: field.id, confirmedValue: field.rawValue }, actor);
    }
  }
}

describe("Missing and unreadable evidence never validates as PASSED (F-04, F-05)", () => {
  it("blocks a lab report whose cadmium result is absent instead of passing it silently", () => {
    const { ws, clerk, manager, dossierId } = newWorkspace();
    ws.uploadDocument(dossierId, syntheticPdf("packing"), "PackingList.pdf", "PACKING_LIST", clerk, {
      container_number: { raw: CONTAINER }, seal_number: { raw: "SEAL-FC-1" }, box_count: { raw: "900" },
    });
    ws.uploadDocument(dossierId, syntheticPdf("phyto"), "PhytoCert.pdf", "PHYTOSANITARY_CERTIFICATE", clerk, {
      container_number: { raw: CONTAINER }, seal_number: { raw: "SEAL-FC-1" }, phyto_cert_number: { raw: "KDTV-2026-VN-09930" },
    });
    // A lab report that carries a sample code but no cadmium reading.
    ws.uploadDocument(dossierId, syntheticPdf("lab"), "LabTestReport.pdf", "LAB_TEST_REPORT", clerk, {
      sample_code: { raw: "EF-2026-VN-9082" }, sampling_date: { raw: "2026-10-06" },
    });
    verifyEveryExtractedField(ws, dossierId, clerk);

    const result = ws.runValidation(dossierId, manager);
    expect(result.status).toBe("BLOCKED");
    const finding = result.findings.find((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK");
    expect(finding?.severity).toBe("CRITICAL_BLOCKER");
    expect(finding?.observedValue).toBe("NOT_EXTRACTED");
    expect(finding?.messageVi).toContain("KHÔNG ĐỌC ĐƯỢC KẾT QUẢ CADMI");
    // The finding stays an internal control: no legal conclusion, and the quarantined
    // statutory rule never fires.
    expect(finding?.messageEn).toContain("not a legal determination");
    expect(result.findings.some((f) => f.ruleId === "RUL-GB2762-CD")).toBe(false);
    expect(() => ws.approveForExport(dossierId, manager)).toThrow();
  });

  it("extracts nothing from an image this build cannot read", () => {
    // Previously the registry fell through to the synthetic fixture extractor for any
    // mime type, inventing cadmium, container and seal values at 0.96 confidence.
    expect(defaultExtractorRegistry.extractFieldsSync(PNG_BYTES, context("LAB_TEST_REPORT", "image/png", "LabScan.png"))).toHaveLength(0);
    expect(defaultExtractorRegistry.extractFieldsSync(PNG_BYTES, context("PACKING_LIST", "image/jpeg", "PackingScan.jpg"))).toHaveLength(0);
    // The documented synthetic fallback for text-bearing rehearsal documents is kept.
    expect(defaultExtractorRegistry.extractFieldsSync(PDF_BYTES, context("LAB_TEST_REPORT", "application/pdf", "Lab.pdf")).length).toBeGreaterThan(0);
  });

  it("blocks a dossier whose documents yielded no extracted fields", () => {
    const { ws, clerk, manager, dossierId } = newWorkspace();
    const uploaded = ws.uploadDocument(dossierId, syntheticPng("lab-scan"), "LabScan.png", "LAB_TEST_REPORT", clerk);
    expect(uploaded.document.mimeType).toBe("image/png");
    expect(uploaded.document.extractedFields).toHaveLength(0);
    ws.uploadDocument(dossierId, syntheticPng("packing-scan"), "PackingScan.png", "PACKING_LIST", clerk);
    ws.uploadDocument(dossierId, syntheticPng("phyto-scan"), "PhytoScan.png", "PHYTOSANITARY_CERTIFICATE", clerk);
    verifyEveryExtractedField(ws, dossierId, clerk);

    const result = ws.runValidation(dossierId, manager);
    expect(result.status).toBe("BLOCKED");
    const unreadable = result.findings.filter((f) => f.ruleId === "RUL-DOC-UNREADABLE");
    expect(unreadable).toHaveLength(3);
    expect(unreadable[0]?.severity).toBe("CRITICAL_BLOCKER");
    expect(unreadable[0]?.messageEn).toContain("No data could be extracted");
    expect(result.criticalBlockers).toBeGreaterThanOrEqual(3);
    expect(() => ws.approveForExport(dossierId, manager)).toThrow();
    expect(() => ws.exportDossier(dossierId, manager)).toThrow();
  });
});
