import type { ExtractedField } from "../domain/types.js";
import type {
  DocumentExtractorAdapter,
  ExtractionContext,
  FixtureFieldOverrides,
} from "./extractor-types.js";
import { defaultFixtureExtractor } from "./fixture-extractor.js";
import { resolveExtractionFallback } from "./extractor-fallback.js";
import { assertSyntheticFixtureRequestAllowed } from "./synthetic-extraction-mode.js";
import { LocalHeuristicTextExtractorAdapter } from "./local-text-extractor.js";

export class CompositeExtractorRegistry {
  private readonly adapters: DocumentExtractorAdapter[] = [];

  constructor(customAdapters?: readonly DocumentExtractorAdapter[]) {
    if (customAdapters && customAdapters.length > 0) {
      this.adapters.push(...customAdapters);
    } else {
      this.adapters.push(new LocalHeuristicTextExtractorAdapter());
      this.adapters.push(defaultFixtureExtractor);
    }
  }

  public registerAdapter(adapter: DocumentExtractorAdapter, highPriority = false): void {
    if (highPriority) {
      this.adapters.unshift(adapter);
    } else {
      this.adapters.push(adapter);
    }
  }

  public getAdapters(): readonly DocumentExtractorAdapter[] {
    return this.adapters;
  }

  public extractFieldsSync(
    fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: FixtureFieldOverrides
  ): readonly ExtractedField[] {
    if (fixtureOverrides && Object.keys(fixtureOverrides).length > 0) {
      assertSyntheticFixtureRequestAllowed();
      return defaultFixtureExtractor.extractFields(fileBuffer, context, fixtureOverrides);
    }

    for (const adapter of this.adapters) {
      if (!adapter.isAvailable || !adapter.supports(context.documentType, context.mimeType)) {
        continue;
      }
      try {
        const result = adapter.extractFields(fileBuffer, context, fixtureOverrides);
        if (result.length > 0) {
          return result;
        }
      } catch {
        // Fallback to next registered adapter when an adapter fails
      }
    }

    return resolveExtractionFallback(fileBuffer, context, fixtureOverrides);
  }

  public async extractFields(
    fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: FixtureFieldOverrides
  ): Promise<readonly ExtractedField[]> {
    if (fixtureOverrides && Object.keys(fixtureOverrides).length > 0) {
      assertSyntheticFixtureRequestAllowed();
      return defaultFixtureExtractor.extractFields(fileBuffer, context, fixtureOverrides);
    }

    for (const adapter of this.adapters) {
      if (!adapter.isAvailable || !adapter.supports(context.documentType, context.mimeType)) {
        continue;
      }
      try {
        const result = adapter.extractFieldsAsync
          ? await adapter.extractFieldsAsync(fileBuffer, context, fixtureOverrides)
          : adapter.extractFields(fileBuffer, context, fixtureOverrides);
        if (result.length > 0) {
          return result;
        }
      } catch {
        // Fallback to next registered adapter when an adapter fails
      }
    }

    return resolveExtractionFallback(fileBuffer, context, fixtureOverrides);
  }
}

export const defaultExtractorRegistry = new CompositeExtractorRegistry();
