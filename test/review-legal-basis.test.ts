import { describe, it, expect } from "bun:test";
import { legalBasisOf, ruleCarriesLegalConclusion, reviewProgress } from "../src/ui/review-legal-basis.js";
import { REVIEW_STATE } from "../src/ui/review-state.js";

describe("rule legal basis — an unverified statutory rule may never read as clean", () => {
  it("an active, statutory-verified rule is verified", () => {
    expect(legalBasisOf({ isActive: true, isStatutoryVerified: true, severity: "CRITICAL_BLOCKER" })).toBe("verified");
  });

  it("an active but statutory-unverified blocker is reported unverified, not verified", () => {
    expect(legalBasisOf({ isActive: true, isStatutoryVerified: false, severity: "CRITICAL_BLOCKER" })).toBe(
      "unverified"
    );
  });

  it("an active advisory warning is advisory, not verified", () => {
    expect(legalBasisOf({ isActive: true, isStatutoryVerified: false, severity: "ADVISORY_WARNING" })).toBe(
      "advisory"
    );
  });

  it("an inactive rule is inactive and never counted as passed", () => {
    expect(legalBasisOf({ isActive: false, isStatutoryVerified: true })).toBe("inactive");
  });

  it("a rule record with no severity fails safe to unverified, not advisory", () => {
    expect(legalBasisOf({ isActive: true, isStatutoryVerified: false })).toBe("unverified");
  });

  it("ruleCarriesLegalConclusion refuses an unverified blocker and an inactive rule", () => {
    expect(ruleCarriesLegalConclusion({ isActive: true, isStatutoryVerified: false, severity: "CRITICAL_BLOCKER" })).toEqual(
      { allowed: false, reasonKey: "rule.unverifiedStatutory" }
    );
    expect(ruleCarriesLegalConclusion({ isActive: false })).toEqual({ allowed: false, reasonKey: "rule.inactive" });
    expect(
      ruleCarriesLegalConclusion({ isActive: true, isStatutoryVerified: true, severity: "CRITICAL_BLOCKER" })
    ).toEqual({ allowed: true, reasonKey: "" });
  });

  it("an internal advisory is not refused — it is simply not statutory", () => {
    expect(
      ruleCarriesLegalConclusion({ isActive: true, isStatutoryVerified: false, severity: "ADVISORY_WARNING" }).allowed
    ).toBe(true);
  });
});

describe("review-state — review progress uses the configured checklist denominator", () => {
  it("counts only human-confirmed items and reports the denominator it used", () => {
    const progress = reviewProgress([
      { state: REVIEW_STATE.CONFIRMED_DATA },
      { state: REVIEW_STATE.CONFIRMED_DATA },
      { state: REVIEW_STATE.DISCREPANCY },
      { state: REVIEW_STATE.NEEDS_REVIEW },
    ]);
    expect(progress).toEqual({ total: 4, confirmed: 2, remaining: 2, denominatorKnown: true });
  });

  it("does not invent a denominator when nothing is configured", () => {
    expect(reviewProgress([])).toEqual({
      total: 0,
      confirmed: 0,
      remaining: 0,
      denominatorKnown: false,
    });
  });

  it("never counts a blocked or not-applicable item as confirmed", () => {
    const progress = reviewProgress([
      { state: REVIEW_STATE.NEEDS_EVIDENCE },
      { state: REVIEW_STATE.NEEDS_REASSESSMENT },
      { state: REVIEW_STATE.SOURCE_CHANGED },
    ]);
    expect(progress.confirmed).toBe(0);
    expect(progress.remaining).toBe(3);
  });
});
