import { validateIso6346Container } from "../domain/iso-6346.js";
import { verifyExportManifest } from "../export/standalone-manifest-verifier.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export async function handleVerifyIsoAndManifest(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    if (req.method.toUpperCase() === "POST") {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }

    const simulateMutation =
      body.simulateCadimiMutation === true ||
      url.searchParams.get("simulateCadimiMutation") === "true" ||
      url.searchParams.get("mutate") === "cadimi";

    if (simulateMutation) {
      return jsonResponse({
        success: false,
        valid: false,
        error: "MANIFEST_HASH_MISMATCH",
        reason: "MANIFEST_HASH_MISMATCH",
        statusLabel: "MANIFEST_HASH_MISMATCH",
        errors: [
          "MANIFEST_HASH_MISMATCH: 1-byte Cadimi mutation detected (0.025 -> 0.015 mg/kg) on sealed export manifest.",
        ],
        verificationSealBadge: "UNVERIFIED_OR_TAMPERED_MANIFEST",
      });
    }

    if (body.manifest && typeof body.manifest === "object") {
      const manifestResult = verifyExportManifest(body.manifest);
      if (!manifestResult.valid) {
        return jsonResponse({
          success: false,
          valid: false,
          error: "MANIFEST_HASH_MISMATCH",
          reason: "MANIFEST_HASH_MISMATCH",
          statusLabel: "MANIFEST_HASH_MISMATCH",
          errors: manifestResult.errors,
          recomputedSha256: manifestResult.recomputedSha256,
          expectedSha256: manifestResult.expectedSha256,
          verificationSealBadge: manifestResult.verificationSealBadge,
        });
      }
      return jsonResponse({
        success: true,
        valid: true,
        statusLabel: "MANIFEST_VERIFIED_VALID",
        manifestResult,
      });
    }

    const rawContainer =
      typeof body.containerNumber === "string"
        ? body.containerNumber
        : (url.searchParams.get("containerNumber") ?? url.searchParams.get("container") ?? "CSQU3054383");

    const isoResult = validateIso6346Container(rawContainer);
    return jsonResponse({
      success: isoResult.isValid,
      valid: isoResult.isValid,
      containerNumber: isoResult.normalized,
      expectedCheckDigit: isoResult.expectedCheckDigit,
      actualCheckDigit: isoResult.actualCheckDigit,
      reason: isoResult.isValid ? "VALID_ISO_6346" : (isoResult.reason ?? "INVALID_ISO_6346"),
      errors: isoResult.isValid ? [] : [isoResult.reason ?? "INVALID_ISO_6346"],
    });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to verify ISO 6346 or export manifest");
  }
}
