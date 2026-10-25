import type { ComplianceRule } from "../domain/types.js";

/**
 * The packhouse's own cadmium controls, kept apart from the statutory catalogue.
 *
 * Both rules make no legal claim. `RUL-CD-INTERNAL-BLOCK` stops a lot above the
 * internal limit; `RUL-INT-CD-WARN` gives early notice below it. Neither may be
 * phrased as a legal determination, because the primary legal text is not held —
 * see `RUL-GB2762-CD` in rule-catalog.ts for the statutory rule that was withdrawn
 * on exactly that ground.
 */
export const CADMIUM_CONTROL_RULES: readonly ComplianceRule[] = [
  {
    ruleId: "RUL-CD-INTERNAL-BLOCK",
    name: "Packhouse Internal Cadmium Food-Safety Block",
    severity: "CRITICAL_BLOCKER",
    description: "Blocks a lot whose lab-reported cadmium exceeds the packhouse internal food-safety control limit of 0.050 mg/kg. An internal control, not a legal determination: no verified statutory basis is held, so it never asserts a legal conclusion.",
    governingAuthority: "DuriOS Packhouse Internal Standard (Non-statutory, unverified)",
    statutoryReference: "Internal Quality Control Protocol Rev 2.1 — no verified statutory basis held",
    isActive: true,
    isStatutoryVerified: false, // INTENTIONALLY UNVERIFIED: internal control, not a legal claim
    statutoryClaim: "INTERNAL_FOOD_SAFETY",
    fieldKeyRef: "cadmium_mg_kg",
    threshold: 0.050,
    unit: "mg/kg",
    evaluationType: "NUMERIC_THRESHOLD",
  },
  {
    ruleId: "RUL-INT-CD-WARN",
    name: "Internal Packhouse Advisory Cadmium Warning",
    severity: "ADVISORY_WARNING",
    description: "Warns when Cadmium level exceeds internal packhouse safety buffer of 0.040 mg/kg.",
    governingAuthority: "DuriOS Packhouse Internal Standard (Non-statutory)",
    statutoryReference: "Internal Quality Control Protocol Rev 2.1 (Non-statutory)",
    isActive: true,
    isStatutoryVerified: false, // Non-statutory advisory buffer
    statutoryClaim: "NON_STATUTORY",
    fieldKeyRef: "cadmium_mg_kg",
    threshold: 0.040,
    unit: "mg/kg",
    evaluationType: "NUMERIC_THRESHOLD",
  },
];
