import type { ExtractedField, DocumentType } from "../domain/types.js";
import type { DocumentExtractorAdapter, ExtractionContext } from "./extractor-types.js";
import { formatFieldLabel, getDefaultTemplateFields } from "./fixture-template-fields.js";
import { isSyntheticExtractionEnabled } from "./synthetic-extraction-mode.js";

/** Text-bearing formats the synthetic fixture extractor may stand in for, in synthetic mode. */
export const SYNTHETIC_FIXTURE_SUPPORTED_MIME_TYPES: ReadonlySet<string> = new Set([
  "text/plain", "application/pdf", "application/json",
]);

export interface SyntheticDocumentFixture {
  readonly documentType: DocumentType;
  readonly fileName: string;
  readonly sha256Hash: string;
  readonly extractedFields: Record<string, { readonly raw: string; readonly confirmed?: string; readonly status?: string }>;
}

export { getDefaultTemplateFields, formatFieldLabel } from "./fixture-template-fields.js";

/**
 * Builds fixture fields for a declared synthetic rehearsal.
 *
 * Without explicit `fixtureData` this needs template values, and template values are only
 * reachable in synthetic mode: in the ordinary flow the answer to "what does this document
 * say?" is "nothing was read", not a plausible-looking default.
 */
export function extractSyntheticFields(
  documentId: string, docType: DocumentType, fixtureData?: Record<string, { raw: string; confirmed?: string }>
): readonly ExtractedField[] {
  const synthetic = isSyntheticExtractionEnabled();
  if (!fixtureData && !synthetic) return [];
  const fields: ExtractedField[] = [];
  const source = fixtureData ?? getDefaultTemplateFields(docType);
  let idx = 1;
  for (const [key, val] of Object.entries(source)) {
    const rawValue = val.raw;
    const num = Number.parseFloat(rawValue);
    const normalizedValue = Number.isNaN(num) ? rawValue : num;
    fields.push({
      id: `${documentId}-fld-${idx}`, documentId, fieldKey: key, label: formatFieldLabel(key),
      rawValue, normalizedValue, confidenceScore: 0.96,
      boundingBox: { pageNumber: 1, x: 100, y: 80 * idx, width: 250, height: 25 }, verificationStatus: "DRAFT",
    });
    idx++;
  }
  return fields;
}

export class FixtureDocumentExtractorAdapter implements DocumentExtractorAdapter {
  public readonly extractorId = "fixture-synthetic-extractor";
  public readonly extractorName = "Deterministic Synthetic Fixture Extractor";
  public readonly isAvailable = true;

  /**
   * Two conditions, both required:
   *  1. the process declared synthetic mode — an ordinary instance never offers fixture
   *     values, so a document it cannot read reports NOT_EXTRACTED instead;
   *  2. the format carries text a reader could in principle parse. Image formats are
   *     excluded because claiming to have read a scan produced invented cadmium,
   *     container and seal values at 0.96 confidence (finding F-05).
   */
  public supports(_docType: DocumentType, mimeType: string): boolean {
    return isSyntheticExtractionEnabled() && SYNTHETIC_FIXTURE_SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase());
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
