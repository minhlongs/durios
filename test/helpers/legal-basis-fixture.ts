import { enrichValidationResult } from "../../src/rules/dossier-finding-enricher.js";
import { STATUTORY_COMPLIANCE_RULES } from "../../src/rules/rule-catalog.js";
import { legalBasisOf, type LegalBasis } from "../../src/ui/review-legal-basis.js";
import type { ComplianceRule, ValidationFinding, ValidationRunResult } from "../../src/domain/types.js";

/**
 * Two blockers run through the production enricher: one from a rule whose statutory
 * basis is verified, one from a rule that makes no legal claim at all. The pair is
 * what proves the operator can tell them apart, so it is built from the real
 * catalogue and the real mapping rather than from literals a test could agree with.
 */
const VERIFIED_RULE: ComplianceRule = {
  ruleId: "RUL-DOC-001", name: "Required Lab Test Report", severity: "CRITICAL_BLOCKER",
  description: "Lab report must be present.", governingAuthority: "VNATAP",
  statutoryReference: "GB 2762-2022", isActive: true, isStatutoryVerified: true,
  evaluationType: "DOCUMENT_PRESENCE",
};

const UNVERIFIED_RULE: ComplianceRule = {
  ruleId: "RUL-CD-INTERNAL-BLOCK", name: "Cadmium internal limit", severity: "CRITICAL_BLOCKER",
  description: "Cadmium above the internal limit stops the lot for a human decision.",
  governingAuthority: "Packhouse QA", statutoryReference: "Internal food-safety control",
  isActive: true, isStatutoryVerified: false, statutoryClaim: "INTERNAL_FOOD_SAFETY",
  threshold: 0.050, unit: "mg/kg", evaluationType: "NUMERIC_THRESHOLD",
};

function blockingFinding(rule: ComplianceRule): ValidationFinding {
  return {
    ruleId: rule.ruleId, severity: rule.severity, ruleName: rule.name,
    citation: rule.statutoryReference, observedValue: "0.900", thresholdValue: String(rule.threshold ?? 0),
    messageVi: "Cadmium over the internal limit.", messageEn: "Cadmium over the internal limit.",
  };
}

/** The catalogue's own cadmium rule, resolved through the same helper the UI uses. */
export function cadmiumLegalBasis(): LegalBasis {
  const cadmium = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-CD-INTERNAL-BLOCK");
  if (!cadmium) throw new Error("RUL-CD-INTERNAL-BLOCK is missing from the rule catalogue.");
  return legalBasisOf({
    ruleId: cadmium.ruleId,
    isActive: cadmium.isActive,
    isStatutoryVerified: cadmium.isStatutoryVerified,
    severity: cadmium.severity,
  });
}

export interface BasisPair {
  readonly verified: ValidationFinding;
  readonly unverified: ValidationFinding;
  readonly findings: readonly ValidationFinding[];
}

/** A validation result holding one blocker of each kind, enriched by production code. */
export function compileValidationResult(): BasisPair {
  const result: ValidationRunResult = {
    status: "BLOCKED", criticalBlockers: 2, advisoryWarnings: 0, evaluatedRulesCount: 2,
    findings: [blockingFinding(VERIFIED_RULE), blockingFinding(UNVERIFIED_RULE)],
    evaluatedAt: new Date().toISOString(),
  };
  const enriched = enrichValidationResult(result, [VERIFIED_RULE, UNVERIFIED_RULE]);
  const [verified, unverified] = enriched.findings;
  if (!verified || !unverified) throw new Error("Both blockers must survive enrichment.");
  return { verified, unverified, findings: enriched.findings };
}
