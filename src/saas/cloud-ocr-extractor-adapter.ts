import type { DocumentType, ExtractedField } from "../domain/types.js";
import type {
  DocumentExtractorAdapter,
  ExtractionContext,
  FixtureFieldOverrides,
} from "../extraction/extractor-types.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export interface CloudOcrFieldCandidate {
  readonly raw: string;
  readonly confidence: number;
}

export type CloudOcrTransport = (
  fileBuffer: Uint8Array,
  context: ExtractionContext
) => Readonly<Record<string, CloudOcrFieldCandidate>>;

export interface CloudVisionOcrOptions {
  readonly env?: Record<string, string | undefined> | undefined;
  readonly expectedTenantId?: string | undefined;
  readonly ocrTransport?: CloudOcrTransport | undefined;
  readonly simulatedCloudResponse?: Readonly<
    Record<string, CloudOcrFieldCandidate>
  > | undefined;
}

export type CloudVisionOcrConfig = CloudVisionOcrOptions;

export class CloudVisionOcrExtractorAdapter implements DocumentExtractorAdapter {
  public readonly extractorId = "durios-cloud-vision-ocr";
  public readonly extractorName = "DuriOS Pro SaaS Managed Cloud Vision OCR";
  private readonly env: Record<string, string | undefined>;
  private readonly expectedTenantId?: string | undefined;
  private readonly ocrTransport?: CloudOcrTransport | undefined;
  private readonly simulatedCloudResponse?:
    | Readonly<Record<string, CloudOcrFieldCandidate>>
    | undefined;

  constructor(options: CloudVisionOcrOptions = {}) {
    this.env = options.env ?? process.env;
    this.expectedTenantId = options.expectedTenantId;
    this.ocrTransport = options.ocrTransport;
    this.simulatedCloudResponse = options.simulatedCloudResponse;
  }

  public get isAvailable(): boolean {
    const sub = resolveSaasSubscriptionStatus(
      this.env,
      new Date().toISOString(),
      this.expectedTenantId
    );
    return (
      sub.entitlements.cloudVisionOcr &&
      Boolean(this.ocrTransport ?? this.simulatedCloudResponse)
    );
  }

  public supports(_docType: DocumentType, mimeType: string): boolean {
    return (
      mimeType === "application/pdf" ||
      mimeType === "image/jpeg" ||
      mimeType === "image/png"
    );
  }

  public extractFields(
    fileBuffer: Uint8Array,
    context: ExtractionContext,
    fixtureOverrides?: FixtureFieldOverrides
  ): readonly ExtractedField[] {
    if (!this.isAvailable) {
      return [];
    }
    if (fixtureOverrides && Object.keys(fixtureOverrides).length > 0) {
      return [];
    }

    const candidates = this.ocrTransport
      ? this.ocrTransport(fileBuffer, context)
      : this.simulatedCloudResponse!;

    const fields: ExtractedField[] = [];
    let idx = 1;
    for (const [key, entry] of Object.entries(candidates)) {
      const cleaned = entry.raw.trim();
      const numCandidate = Number(cleaned.replace(/,/g, ""));
      const normalizedValue =
        cleaned !== "" && !Number.isNaN(numCandidate) && /^[0-9.,]+$/.test(cleaned)
          ? numCandidate
          : cleaned;

      fields.push({
        id: `${context.documentId}-cloud-ocr-${idx}`,
        documentId: context.documentId,
        fieldKey: key,
        label: key
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        rawValue: cleaned,
        normalizedValue,
        confidenceScore: entry.confidence,
        boundingBox: {
          pageNumber: 1,
          x: 60,
          y: idx * 42,
          width: 320,
          height: 26,
        },
        verificationStatus: "DRAFT",
      });
      idx++;
    }
    return fields;
  }
}
