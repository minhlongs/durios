import type { DocumentType, ExtractedField } from "../domain/types.js";

export type FixtureFieldOverrides = Record<
  string,
  { readonly raw: string; readonly confirmed?: string; readonly confidence?: number }
>;

export interface ExtractionContext {
  readonly documentId: string;
  readonly documentType: DocumentType;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sha256Hash: string;
}

export interface DocumentExtractorAdapter {
  readonly extractorId: string;
  readonly extractorName: string;
  readonly isAvailable: boolean;
  supports(docType: DocumentType, mimeType: string): boolean;
  extractFields(
    fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: FixtureFieldOverrides
  ): readonly ExtractedField[];
  extractFieldsAsync?(
    fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: FixtureFieldOverrides
  ): Promise<readonly ExtractedField[]>;
}
