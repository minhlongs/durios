import { describe, expect, it } from "bun:test";
import { STATUTORY_COMPLIANCE_RULES } from "../src/rules/rule-catalog.js";
import { DeterministicRuleEngine } from "../src/rules/deterministic-engine.js";
import { CADMIUM_CLERK, buildCadmiumDossier } from "./helpers/cadmium-dossier-fixture.js";

function evaluateCadmiumRuleOn(cadmium: string, code: string) {
  const { ws, dossierId } = buildCadmiumDossier(cadmium, code);
  return ws.runValidation(dossierId, CADMIUM_CLERK);
}

describe("Cadmium food-safety block (internal, unverified statutory basis)", () => {
  it("T-CD-01: a lot above 0.050 mg/kg is blocked and names the threshold", () => {
    const result = evaluateCadmiumRuleOn("0.900", "CD-01");

    expect(result.status).toBe("BLOCKED");
    const finding = result.findings.find((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK");
    expect(finding?.severity).toBe("CRITICAL_BLOCKER");
    expect(finding?.thresholdValue).toContain("0.050");
    expect(finding?.observedValue).toContain("0.900");
    expect(finding?.messageVi).toContain("0.900");
  });

  it("T-CD-02: the block is presented as an internal check, never a legal conclusion", () => {
    const finding = evaluateCadmiumRuleOn("0.900", "CD-02")
      .findings.find((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK");

    expect(finding?.messageVi).toContain("NỘI BỘ");
    expect(finding?.messageEn).toContain("internal");
    // The phrasing used by the disabled statutory rule must not be reused here.
    expect(finding?.messageVi).not.toContain("ngưỡng pháp định");
    expect(finding?.messageEn).not.toContain("statutory limit");
    expect(finding?.ruleName.toLowerCase()).not.toContain("statutory maximum");
  });

  it("T-CD-03: a lot below the limit is not blocked by the new rule", () => {
    const result = evaluateCadmiumRuleOn("0.020", "CD-03");

    expect(result.status).not.toBe("BLOCKED");
    expect(result.criticalBlockers).toBe(0);
    expect(result.findings.some((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK")).toBe(false);
  });

  it("T-CD-04: the legacy unverified statutory rule stays disabled and unrun", () => {
    const legacy = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-GB2762-CD");
    expect(legacy?.isActive).toBe(false);
    expect(legacy?.isStatutoryVerified).toBe(false);

    const result = evaluateCadmiumRuleOn("0.900", "CD-04");
    expect(result.findings.some((f) => f.ruleId === "RUL-GB2762-CD")).toBe(false);
  });

  it("T-CD-05: the internal advisory at 0.040 still keeps its own meaning", () => {
    const result = evaluateCadmiumRuleOn("0.045", "CD-05");

    const advisory = result.findings.find((f) => f.ruleId === "RUL-INT-CD-WARN");
    expect(advisory?.severity).toBe("ADVISORY_WARNING");
    expect(advisory?.messageVi).toContain("CẢNH BÁO NỘI BỘ");
    expect(result.findings.some((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK")).toBe(false);
  });
});

describe("Statutory-claim discriminator", () => {
  function evaluateRule(ruleId: string, cadmium: string, code: string) {
    const rule = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === ruleId);
    expect(rule).toBeDefined();
    const engine = new DeterministicRuleEngine([rule!]);
    const { ws, dossierId } = buildCadmiumDossier(cadmium, code);
    return engine.evaluate(ws.getRawDossier(dossierId)!);
  }

  it("T-CD-06: a rule claiming statutory authority still fails closed when unverified", () => {
    const { statutoryClaim: _tier, ...withoutTier } =
      STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-GB2762-CD")!;
    const engine = new DeterministicRuleEngine([{ ...withoutTier, isActive: true }]);
    const { ws, dossierId } = buildCadmiumDossier("0.900", "CD-06");

    expect(engine.evaluate(ws.getRawDossier(dossierId)!).findings[0]?.observedValue)
      .toBe("UNVERIFIED_STATUTORY_RULE");
  });

  it("T-CD-07: a rule record omitting the discriminator is treated as a statutory claim", () => {
    // Strip the tier to model a rule record predating the field, then activate it.
    const { statutoryClaim: _tier, ...withoutTier } =
      STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleId === "RUL-CD-INTERNAL-BLOCK")!;
    const engine = new DeterministicRuleEngine([{ ...withoutTier, isActive: true }]);
    const { ws, dossierId } = buildCadmiumDossier("0.900", "CD-07");

    // Fail closed: an absent tier must not become a licence to conclude legally.
    expect(engine.evaluate(ws.getRawDossier(dossierId)!).findings.some(
      (f) => f.observedValue === "UNVERIFIED_STATUTORY_RULE"
    )).toBe(true);
  });

  it("T-CD-08: an internal-food-safety rule at blocker severity is evaluated normally", () => {
    const result = evaluateRule("RUL-CD-INTERNAL-BLOCK", "0.900", "CD-08");

    expect(result.findings.some((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK")).toBe(true);
  });
});
