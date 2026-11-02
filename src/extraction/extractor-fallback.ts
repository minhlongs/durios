import type { ExtractedField } from "../domain/types.js";
import type { ExtractionContext, FixtureFieldOverrides } from "./extractor-types.js";
import { defaultFixtureExtractor } from "./fixture-extractor.js";

/**
 * Last resort when no registered adapter produced anything.
 *
 * The synthetic fixture extractor may stand in only when the process declared synthetic
 * mode AND the format carries text a reader could in principle parse. Otherwise — an
 * ordinary instance, an image scan, an unknown binary — this returns no fields and the
 * rule engine blocks the dossier on RUL-DOC-UNREADABLE. Inventing values for a document
 * nothing could read is how a fabricated cadmium result reaches a sealed pack.
 */
export function resolveExtractionFallback(
  fileBuffer: Uint8Array,
  context: ExtractionContext,
  fixtureOverrides?: FixtureFieldOverrides
): readonly ExtractedField[] {
  if (!defaultFixtureExtractor.supports(context.documentType, context.mimeType)) return [];
  return defaultFixtureExtractor.extractFields(fileBuffer, context, fixtureOverrides);
}
