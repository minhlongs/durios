import { describe, expect, it } from "bun:test";
import { LocalHeuristicTextExtractorAdapter } from "../src/extraction/local-text-extractor.js";
import { CompositeExtractorRegistry } from "../src/extraction/composite-extractor-registry.js";
import type { DocumentExtractorAdapter, ExtractionContext } from "../src/extraction/extractor-types.js";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import type { AuthenticatedActor, DocumentType, ExtractedField } from "../src/domain/types.js";

const CLERK: AuthenticatedActor = {
  id: "usr-clerk-ext-01",
  tenantId: "ten-cailay-001",
  tenantType: "PACKHOUSE_EXPORTER",
  role: "CLERK",
  persona: "PACKHOUSE_CLERK",
  name: "Clerk Extraction Tester",
};

describe("Direction 3: Pluggable Document Extractor & OCR Adapter Suite", () => {
  it("extracts ISO 6346 container, seal, net weight, boxes, PUC, and PHC from UTF-8 PDF stream", () => {
    const adapter = new LocalHeuristicTextExtractorAdapter();
    const pdfStream = new TextEncoder().encode(
      "%PDF-1.5\n" +
        "PACKING LIST - CAI LAY DURIAN PACKHOUSE\n" +
        "Container: MSKU1234565\n" +
        "Seal No: SL-889900\n" +
        "Net Weight: 18240 kg\n" +
        "Total Boxes: 960\n" +
        "PUC: VN-TG-ORCHARD-0042\n" +
        "PHC: VN-TG-PACK-0018\n" +
        "%%EOF"
    );

    const ctx: ExtractionContext = {
      documentId: "DOC-TEST-01",
      documentType: "PACKING_LIST",
      fileName: "PackingList.pdf",
      mimeType: "application/pdf",
      sha256Hash: "0".repeat(64),
    };

    const fields = adapter.extractFields(pdfStream, ctx);
    const byKey = new Map(fields.map((f) => [f.fieldKey, f]));

    expect(byKey.get("container_number")?.rawValue).toBe("MSKU1234565");
    expect(byKey.get("seal_number")?.rawValue).toBe("SL-889900");
    expect(byKey.get("net_weight_kg")?.normalizedValue).toBe(18240);
    expect(byKey.get("box_count")?.normalizedValue).toBe(960);
    expect(byKey.get("PUC")?.rawValue).toBe("VN-TG-ORCHARD-0042");
    expect(byKey.get("PHC")?.rawValue).toBe("VN-TG-PACK-0018");
  });

  it("extracts cadmium level, sample code, and sampling date from LAB_TEST_REPORT stream", () => {
    const adapter = new LocalHeuristicTextExtractorAdapter();
    const labBytes = new TextEncoder().encode(
      "%PDF-1.5\nLAB REPORT\nSample Code: LAB-TG-2026-99\nCadmium: 0.014 mg/kg\nDate: 2026-10-12\n%%EOF"
    );
    const ctx: ExtractionContext = {
      documentId: "DOC-LAB-01",
      documentType: "LAB_TEST_REPORT",
      fileName: "LabReport.pdf",
      mimeType: "application/pdf",
      sha256Hash: "1".repeat(64),
    };

    const fields = adapter.extractFields(labBytes, ctx);
    const byKey = new Map(fields.map((f) => [f.fieldKey, f]));

    expect(byKey.get("cadmium_mg_kg")?.normalizedValue).toBe(0.014);
    expect(byKey.get("sample_code")?.rawValue).toBe("LAB-TG-2026-99");
    expect(byKey.get("sampling_date")?.rawValue).toBe("2026-10-12");
  });

  it("falls back to subsequent adapter in CompositeExtractorRegistry when primary throws or returns empty", async () => {
    const failingSidecarAdapter: DocumentExtractorAdapter = {
      extractorId: "failing-ocr-sidecar",
      extractorName: "Simulated Unreachable OCR Sidecar",
      isAvailable: true,
      supports: (_docType: DocumentType, _mime: string) => true,
      extractFields: (): readonly ExtractedField[] => {
        throw new Error("OCR sidecar timeout");
      },
    };

    const registry = new CompositeExtractorRegistry();
    registry.registerAdapter(failingSidecarAdapter, true);

    const barePdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const ctx: ExtractionContext = {
      documentId: "DOC-FALLBACK-01",
      documentType: "PHYTOSANITARY_CERTIFICATE",
      fileName: "Phyto.pdf",
      mimeType: "application/pdf",
      sha256Hash: "2".repeat(64),
    };

    const fieldsSync = registry.extractFieldsSync(barePdfHeader, ctx);
    expect(fieldsSync.length).toBeGreaterThan(0);

    const fieldsAsync = await registry.extractFields(barePdfHeader, ctx);
    expect(fieldsAsync.length).toBe(fieldsSync.length);
  });

  it("integrates LocalHeuristicTextExtractorAdapter seamlessly into ContainerDossierWorkspace.uploadDocument", () => {
    const ws = new ContainerDossierWorkspace();
    const dossier = ws.createDossier(
      {
        dossierCode: "DOS-EXT-2026-01",
        containerNumber: "MSKU1234565",
        sealNumber: "SL-776655",
        targetMarket: "CN",
        borderGate: "Huu Nghi",
        targetTemperatureC: 13.5,
        declaredNetWeightKg: 18240,
        declaredBoxCount: 960,
      },
      CLERK
    );

    const phytoPdfStream = new TextEncoder().encode(
      "%PDF-1.5\nPHYTOSANITARY CERTIFICATE\nKDTV: VN-KDTV-2026-88811\nContainer: MSKU1234565\nSeal: SL-776655\nTemperature: 13.5 C\n%%EOF"
    );

    const { document } = ws.uploadDocument(
      dossier.id,
      phytoPdfStream,
      "Phyto_Cert.pdf",
      "PHYTOSANITARY_CERTIFICATE",
      CLERK
    );

    const certField = document.extractedFields.find((f) => f.fieldKey === "phyto_cert_number");
    expect(certField?.rawValue).toBe("VN-KDTV-2026-88811");
    expect(document.extractedFields.every((f) => f.verificationStatus === "DRAFT")).toBe(true);
  });
});
