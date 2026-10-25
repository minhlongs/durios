import type { ComplianceRule, ValidationFinding, ValidationRunResult } from "../domain/types.js";
import { legalBasisOf, type LegalBasis } from "../ui/review-legal-basis.js";

/**
 * Attach each finding's legal basis so the workspace can tell a real blocker from
 * one the system refuses to conclude on.
 *
 * The basis is derived server-side from rule metadata the browser is never sent, so
 * the operator view cannot re-derive — or mis-derive — a legal conclusion from a
 * finding alone. A rule absent from the catalog resolves to "inactive", the
 * conservative answer: the engine skipped it, so it cannot carry a conclusion.
 *
 * A finding with no legalBasis is tagged the same way, so a result produced before
 * this field existed is enriched on read rather than shipped mislabelled.
 */
function legalBasisOfFinding(finding: ValidationFinding, rules: ReadonlyMap<string, ComplianceRule>): LegalBasis {
  if (finding.legalBasis) return finding.legalBasis;
  const rule = rules.get(finding.ruleId);
  if (!rule) return "inactive";
  return legalBasisOf({
    ruleId: rule.ruleId,
    isActive: rule.isActive,
    isStatutoryVerified: rule.isStatutoryVerified,
    severity: rule.severity,
  });
}

/** Tag every finding in a validation result using the rules that produced them. */
export function enrichValidationResult(
  result: ValidationRunResult,
  rules: readonly ComplianceRule[]
): ValidationRunResult {
  const byId = new Map(rules.map((r) => [r.ruleId, r]));
  return {
    ...result,
    findings: result.findings.map((f) => ({ ...f, legalBasis: legalBasisOfFinding(f, byId) })),
  };
}
