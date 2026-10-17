import type { ExtractedField, DocumentType } from "../domain/types.js";
import type { DocumentExtractorAdapter, ExtractionContext } from "./extractor-types.js";

export interface SyntheticDocumentFixture {
  readonly documentType: DocumentType;
  readonly fileName: string;
  readonly sha256Hash: string;
  readonly extractedFields: Record<
    string,
    {
      readonly raw: string;
      readonly confirmed?: string;
      readonly status?: string;
    }
  >;
}

export function extractSyntheticFields(
  documentId: string,
  docType: DocumentType,
  fixtureData?: Record<string, { raw: string; confirmed?: string }>
): readonly ExtractedField[] {
  const fields: ExtractedField[] = [];
  const source = fixtureData ?? getDefaultTemplateFields(docType);

  let idx = 1;
  for (const [key, val] of Object.entries(source)) {
    const rawValue = val.raw;
    const num = Number.parseFloat(rawValue);
    const normalizedValue = Number.isNaN(num) ? rawValue : num;

    fields.push({
      id: `${documentId}-fld-${idx}`,
      documentId,
      fieldKey: key,
      label: formatFieldLabel(key),
      rawValue,
      normalizedValue,
      confidenceScore: 0.96,
      boundingBox: {
        pageNumber: 1,
        x: 100,
        y: 80 * idx,
        width: 250,
        height: 25,
      },
      verificationStatus: "DRAFT",
    });
    idx++;
  }

  return fields;
}

export class FixtureDocumentExtractorAdapter implements DocumentExtractorAdapter {
  public readonly extractorId = "fixture-synthetic-extractor";
  public readonly extractorName = "Deterministic Synthetic Fixture Extractor";
  public readonly isAvailable = true;

  public supports(_docType: DocumentType, _mimeType: string): boolean {
    return true;
  }

  public extractFields(
    _fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: Record<string, { raw: string; confirmed?: string }>
  ): readonly ExtractedField[] {
    return extractSyntheticFields(context.documentId, context.documentType, fixtureOverrides);
  }
}

export const defaultFixtureExtractor = new FixtureDocumentExtractorAdapter();

function formatFieldLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getDefaultTemplateFields(
  docType: DocumentType
): Record<string, { raw: string }> {
  switch (docType) {
    case "LAB_TEST_REPORT":
      return {
        cadmium_mg_kg: { raw: "0.028" },
        sample_code: { raw: "EF-2026-VN-9081" },
        sampling_date: { raw: "2026-10-06" },
      };
    case "PACKING_LIST":
      return {
        container_number: { raw: "MSKU1234567" },
        seal_number: { raw: "SL-998822" },
        box_count: { raw: "960" },
        net_weight_kg: { raw: "18240.00" },
      };
    case "PHYTOSANITARY_CERTIFICATE":
      return {
        container_number: { raw: "MSKU1234567" },
        seal_number: { raw: "SL-998822" },
        phyto_cert_number: { raw: "KDTV-2026-VN-09928" },
      };
    default:
      return {};
  }
}
