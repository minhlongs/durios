import type { DocumentType } from "../domain/types.js";

/**
 * Template values used ONLY inside declared synthetic mode.
 *
 * These are not document data. They exist so a rehearsal can produce a complete dossier
 * without a reader being integrated; every one of them still has to be human-verified
 * before validation passes, and the field carries the fixture extractor's identity.
 * Outside synthetic mode nothing in this file is reachable: see
 * `synthetic-extraction-mode.ts` and `fixture-extractor.ts`.
 */
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

/** Values a reviewer can search for to prove no template reached a dossier. */
export const TEMPLATE_CANARY_VALUES: readonly string[] = [
  "0.028", "EF-2026-VN-9081", "2026-10-06", "MSKU1234567", "SL-998822", "960",
  "18240.00", "KDTV-2026-VN-09928",
];

export function formatFieldLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
