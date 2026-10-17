import { readFileSync } from "node:fs";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import { validateIso6346Container } from "../domain/iso-6346.js";

export interface ManifestVerificationResult {
  readonly valid: boolean;
  readonly recomputedSha256: string;
  readonly expectedSha256: string;
  readonly iso6346ContainerValid: boolean;
  readonly allDocumentsHaveSha256: boolean;
  readonly zeroCriticalBlockers: boolean;
  readonly verificationSealBadge: string;
  readonly publicVerificationUrl?: string | undefined;
  readonly errors: readonly string[];
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function verifyExportManifest(
  manifest: unknown,
  baseVerifyUrl?: string
): ManifestVerificationResult {
  const errors: string[] = [];
  const rec = asObjectRecord(manifest) ?? {};

  if (rec.manifestVersion !== "1.0.0") {
    errors.push(`Invalid or missing manifestVersion: expected '1.0.0', got '${String(rec.manifestVersion ?? "")}'.`);
  }

  const dossierId = typeof rec.dossierId === "string" ? rec.dossierId.trim() : "";
  const dossierCode = typeof rec.dossierCode === "string" ? rec.dossierCode.trim() : "";
  const tenantId = typeof rec.tenantId === "string" ? rec.tenantId.trim() : "";
  if (!dossierId || !dossierCode || !tenantId) {
    errors.push("Manifest is missing required non-empty dossierId, dossierCode, or tenantId.");
  }

  const containerNumber = typeof rec.containerNumber === "string" ? rec.containerNumber : "";
  const sealNumber = typeof rec.sealNumber === "string" ? rec.sealNumber : "";
  const expectedSha256 = typeof rec.compositeManifestSha256 === "string" ? rec.compositeManifestSha256 : "";

  const documents = Array.isArray(rec.documents) ? rec.documents : [];
  if (!Array.isArray(rec.documents) || rec.documents.length === 0) {
    errors.push("Manifest must include a non-empty documents array.");
  }

  if (
    !Array.isArray(rec.regulatoryDisclaimers) ||
    rec.regulatoryDisclaimers.length === 0 ||
    !rec.regulatoryDisclaimers.every((item) => typeof item === "string" && item.trim().length > 0)
  ) {
    errors.push("Manifest must include a non-empty regulatoryDisclaimers array.");
  }

  const compositeContent = JSON.stringify({
    dossierId: rec.dossierId, dossierCode: rec.dossierCode, tenantId: rec.tenantId,
    containerNumber: rec.containerNumber, sealNumber, documents: rec.documents,
    verifiedDataSummary: rec.verifiedDataSummary,
  });

  const recomputedSha256 = calculateSha256(compositeContent);
  if (!expectedSha256 || recomputedSha256 !== expectedSha256) {
    errors.push(`Composite SHA-256 mismatch: expected '${expectedSha256}', recomputed '${recomputedSha256}'.`);
  }

  const iso6346ContainerValid = containerNumber.length > 0 && validateIso6346Container(containerNumber).isValid;
  if (!iso6346ContainerValid) {
    errors.push(`Container number '${containerNumber}' failed ISO 6346 check-digit validation.`);
  }

  const allDocumentsHaveSha256 =
    documents.length > 0 &&
    documents.every((d) => {
      const docObj = asObjectRecord(d);
      return docObj !== null && typeof docObj.sha256Hash === "string" && /^[a-f0-9]{64}$/i.test(docObj.sha256Hash);
    });
  if (!allDocumentsHaveSha256) {
    errors.push("One or more manifest documents are missing a valid 64-hex SHA-256 digest.");
  }

  const findingsObj = asObjectRecord(rec.complianceFindingsCount);
  const criticalBlockers =
    findingsObj && typeof findingsObj.criticalBlockers === "number" ? findingsObj.criticalBlockers : -1;
  const zeroCriticalBlockers = criticalBlockers === 0;
  if (!zeroCriticalBlockers) {
    errors.push(
      `Manifest contains ${criticalBlockers < 0 ? "missing or invalid" : criticalBlockers} unresolved critical compliance blocker(s).`
    );
  }

  if (rec.lifecycleState !== "EXPORTED" || rec.isImmutable !== true) {
    errors.push("Manifest dossier is not in a sealed, immutable EXPORTED state.");
  }

  const valid = errors.length === 0;
  const trimmedBaseUrl = baseVerifyUrl?.trim();
  const publicVerificationUrl = trimmedBaseUrl
    ? `${trimmedBaseUrl.replace(/\/+$/, "")}/${dossierCode}?sha256=${expectedSha256}`
    : undefined;

  return {
    valid, recomputedSha256, expectedSha256, iso6346ContainerValid,
    allDocumentsHaveSha256, zeroCriticalBlockers,
    verificationSealBadge: valid
      ? "DuriOS Local Manifest Hash Check Passed (MIT Verifier)"
      : "UNVERIFIED_OR_TAMPERED_MANIFEST",
    ...(publicVerificationUrl ? { publicVerificationUrl } : {}),
    errors,
  };
}

if (import.meta.main) {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write("Usage: bun run src/export/standalone-manifest-verifier.ts <manifest.json>\n");
    process.exit(1);
  }
  const result = verifyExportManifest(JSON.parse(readFileSync(filePath, "utf-8")));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.valid ? 0 : 1);
}
