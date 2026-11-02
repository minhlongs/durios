import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { defaultExtractorRegistry } from "../src/extraction/composite-extractor-registry.js";
import { SYNTHETIC_EXTRACTION_ENV_FLAG, SyntheticExtractionDisabledError } from "../src/extraction/synthetic-extraction-mode.js";
import type { ExtractionContext } from "../src/extraction/extractor-types.js";
import type { AuthenticatedActor, DocumentType } from "../src/domain/types.js";
import { makeMultiTenantActor } from "./helpers/multi-tenant-pilot-scenarios.js";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const bytes = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, "utf-8"));
const pdfStub = (tag: string): Uint8Array => bytes(`%PDF-1.5\n% ${tag}\n%%EOF\n`);
const png = (tag: string): Uint8Array => new Uint8Array(Buffer.concat([PNG_MAGIC, Buffer.from(tag)]));
const ctx = (documentType: DocumentType, mimeType: string, fileName: string): ExtractionContext =>
  ({ documentId: "DOC-SYN-1", documentType, fileName, mimeType, sha256Hash: "0".repeat(64) });
// Values only a template could produce. A reviewer can search a dossier for these to prove
// nothing was invented; numeric template values are excluded because real text can contain them.
const TEMPLATE_ONLY_VALUES = ["MSKU1234567", "SL-998822", "EF-2026-VN-9081", "KDTV-2026-VN-09928"];
const CONTAINER = "MSKU1234565";

function newWorkspace(): { ws: ContainerDossierWorkspace; clerk: AuthenticatedActor; manager: AuthenticatedActor; dossierId: string } {
  const ws = new ContainerDossierWorkspace();
  const clerk = makeMultiTenantActor("TENANT-SYN", "CLERK");
  const manager = makeMultiTenantActor("TENANT-SYN", "MANAGER");
  const dossier = ws.createDossier({
    dossierCode: "DOS-SYN-001", containerNumber: CONTAINER, sealNumber: "SEAL-SYN-1", targetMarket: "CN",
    borderGate: "Huu Nghi", targetTemperatureC: 14.5, declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, manager);
  return { ws, clerk, manager, dossierId: dossier.id };
}

describe("Fixture extraction runs only in declared synthetic mode (F-05 residual)", () => {
  let saved: string | undefined;
  // bunfig.toml preloads the suite in synthetic mode; these cases assert the ORDINARY flow.
  beforeEach(() => { saved = process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; });
  afterEach(() => {
    if (saved === undefined) delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG];
    else process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = saved;
  });

  it("reads text/plain from the bytes themselves, not from a template", () => {
    const sheet = `CONTAINER: ${CONTAINER}\nSEAL NUMBER: SEAL-ORD-77\nCADMIUM: 0.062 MG/KG\nNET WEIGHT: 17500 KG\nTOTAL BOXES: 880\n`;
    const packing = defaultExtractorRegistry.extractFieldsSync(bytes(sheet), ctx("PACKING_LIST", "text/plain", "packing-list.txt"));
    const packingByKey = new Map(packing.map((f) => [f.fieldKey, f.rawValue]));
    expect(packingByKey.get("container_number")).toBe(CONTAINER);
    expect(packingByKey.get("seal_number")).toBe("SEAL-ORD-77");
    expect(packingByKey.get("net_weight_kg")).toBe("17500");
    expect(packingByKey.get("box_count")).toBe("880");
    // A lab report read from the same bytes yields the cadmium value that is actually there,
    // not the 0.028 mg/kg a template used to supply.
    const lab = defaultExtractorRegistry.extractFieldsSync(bytes(sheet), ctx("LAB_TEST_REPORT", "text/plain", "lab-report.txt"));
    expect(new Map(lab.map((f) => [f.fieldKey, f.rawValue])).get("cadmium_mg_kg")).toBe("0.062");
    expect([...packing, ...lab].map((f) => f.rawValue).some((v) => TEMPLATE_ONLY_VALUES.includes(v))).toBe(false);
  });

  it("reports NOT_EXTRACTED for an application/pdf whose bytes carry no readable field", () => {
    const fields = defaultExtractorRegistry.extractFieldsSync(pdfStub("unreadable-scan-of-a-real-lab-report"), ctx("LAB_TEST_REPORT", "application/pdf", "Lab.pdf"));
    expect(fields).toHaveLength(0);
  });

  it("reports NOT_EXTRACTED for an application/json that holds no document field", () => {
    const fields = defaultExtractorRegistry.extractFieldsSync(bytes(`{"note":"handwritten sheet, retype later"}`), ctx("PACKING_LIST", "application/json", "packing.json"));
    expect(fields).toHaveLength(0);
  });

  it("reports NOT_EXTRACTED for images in every format the build cannot read", () => {
    for (const mimeType of ["image/png", "image/jpeg", "image/tiff"]) {
      expect(defaultExtractorRegistry.extractFieldsSync(png(mimeType), ctx("LAB_TEST_REPORT", mimeType, `scan-${mimeType.split("/")[1]}.img`))).toHaveLength(0);
    }
  });

  it("refuses caller-supplied fixtureFields on an ordinary instance and audits the refusal", () => {
    const { ws, clerk, dossierId } = newWorkspace();
    expect(() => ws.uploadDocument(dossierId, pdfStub("ordinary-instance"), "LabTestReport.pdf", "LAB_TEST_REPORT", clerk, {
      cadmium_mg_kg: { raw: "0.010" }, sample_code: { raw: "EF-2026-VN-9082" },
    })).toThrow(SyntheticExtractionDisabledError);
    const dossier = ws.getRawDossier(dossierId);
    expect(dossier?.documents).toHaveLength(0);
    const refusal = ws.auditLedger.getAllEvents().find((e) => e.eventType === "DOC_UPLOAD_REJECTED");
    expect(refusal?.payloadAfter?.reason).toBe("SYNTHETIC_EXTRACTION_DISABLED");
    expect(JSON.stringify(dossier)).not.toContain("0.010");
  });

  it("keeps the declared synthetic rehearsal flow working", () => {
    process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = "true";
    const { ws, clerk, dossierId } = newWorkspace();
    const withOverrides = ws.uploadDocument(dossierId, pdfStub("synthetic-overrides"), "LabTestReport.pdf", "LAB_TEST_REPORT", clerk, {
      cadmium_mg_kg: { raw: "0.010" }, sample_code: { raw: "EF-2026-VN-9082" },
    });
    expect(withOverrides.document.extractedFields.map((f) => f.rawValue)).toContain("0.010");
    // Templates are reachable again, because this process declared itself a rehearsal.
    expect(defaultExtractorRegistry.extractFieldsSync(pdfStub("synthetic-template"), ctx("PACKING_LIST", "application/pdf", "Packing.pdf")).length).toBeGreaterThan(0);
    // Images stay unreadable even in synthetic mode: that is what F-05 fixed.
    expect(defaultExtractorRegistry.extractFieldsSync(png("synthetic-scan"), ctx("LAB_TEST_REPORT", "image/png", "Scan.png"))).toHaveLength(0);
  });
});
