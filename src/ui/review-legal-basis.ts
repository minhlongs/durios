import { REVIEW_STATE } from "./review-state.js";

/** The rule fields the legal-basis decision depends on. */
export interface LegalBasisRule {
  readonly ruleId?: string;
  readonly isActive?: boolean;
  readonly isStatutoryVerified?: boolean;
  readonly severity?: string;
}

export type LegalBasis = "verified" | "unverified" | "advisory" | "inactive";

/**
 * Which legal-basis state a rule is in. When severity is absent we assume the
 * strictest case, so a malformed rule record degrades to "cannot draw a legal
 * conclusion" rather than silently to "harmless advisory".
 */
export function legalBasisOf(rule: LegalBasisRule = {}): LegalBasis {
  if (rule.isActive !== true) return "inactive";
  if (rule.isStatutoryVerified !== true) {
    return (rule.severity ?? "CRITICAL_BLOCKER") === "CRITICAL_BLOCKER" ? "unverified" : "advisory";
  }
  return "verified";
}

export interface LegalConclusion {
  readonly allowed: boolean;
  readonly reasonKey: "" | "rule.inactive" | "rule.unverifiedStatutory";
}

/** Whether a blocking rule may carry a legal conclusion for the operator. */
export function ruleCarriesLegalConclusion(rule: LegalBasisRule = {}): LegalConclusion {
  const basis = legalBasisOf(rule);
  if (basis === "unverified") return { allowed: false, reasonKey: "rule.unverifiedStatutory" };
  if (basis === "inactive") return { allowed: false, reasonKey: "rule.inactive" };
  return { allowed: true, reasonKey: "" };
}

export interface ReviewProgress {
  readonly total: number;
  readonly confirmed: number;
  readonly remaining: number;
  /** False when no checklist is configured, so the UI never invents a total. */
  readonly denominatorKnown: boolean;
}

/**
 * Review progress must come from the configured checklist and is never
 * presented as a regulatory compliance percentage.
 */
export function reviewProgress(
  items: readonly { readonly state?: string }[] = []
): ReviewProgress {
  const total = items.length;
  if (total === 0) {
    return { total: 0, confirmed: 0, remaining: 0, denominatorKnown: false };
  }
  const confirmed = items.filter((i) => i.state === REVIEW_STATE.CONFIRMED_DATA).length;
  return { total, confirmed, remaining: total - confirmed, denominatorKnown: true };
}
