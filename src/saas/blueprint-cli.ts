#!/usr/bin/env bun
import { evaluateBlueprint25Steps } from "./blueprint-25-step-auditor.js";
import { evaluateOpenCoreDeepBrainstorm } from "./open-core-deep-introspector.js";

const isJson = process.argv.includes("--json");
const isDeep = process.argv.includes("--deep");

if (isDeep) {
  const deepReport = evaluateOpenCoreDeepBrainstorm();
  const all15Passed =
    deepReport.allTurnsPassed &&
    deepReport.uiUxDeepAudit.allTurnsPassed &&
    deepReport.modularityDeepAudit.allTurnsPassed;
  if (isJson) {
    process.stdout.write(JSON.stringify(deepReport, null, 2) + "\n");
  } else {
    process.stdout.write("=====================================================\n");
    process.stdout.write(" DuriOS Deep Open-Core, UI/UX & Modularity (--deep)\n");
    process.stdout.write("=====================================================\n");
    process.stdout.write(`Idea Verdict: ${deepReport.ideaVerdict}\n`);
    process.stdout.write(`UI/UX 2027 Verdict: ${deepReport.uiUxDeepAudit.verdict} (${deepReport.uiUxDeepAudit.balancedDomSurfacesCount}/${deepReport.uiUxDeepAudit.totalHtmlSurfacesAudited} HTML Surfaces, ${deepReport.uiUxDeepAudit.deadHrefHashCount} Dead Links)\n`);
    process.stdout.write(`Modularity Verdict: ${deepReport.modularityDeepAudit.verdict} (maxSrcLoc=${deepReport.modularityDeepAudit.maxSrcLoc}, maxTestLoc=${deepReport.modularityDeepAudit.maxTestLoc} <= ${deepReport.modularityDeepAudit.locCeiling}, any=${deepReport.modularityDeepAudit.anyTypeViolationsCount})\n`);
    process.stdout.write(`All 15 Socratic Turns Passed: ${all15Passed ? "YES (15/15)" : "NO"}\n`);
    process.stdout.write(`UI/UX Pro Max Scorecard: ${deepReport.uiUxDeepAudit.proMaxScorecard.totalScore}/${deepReport.uiUxDeepAudit.proMaxScorecard.maxScore}\n`);
    process.stdout.write(`25-Step Blueprint Passed: ${deepReport.blueprintAudit.overallPassed ? "YES (25/25)" : "NO"}\n`);
    process.stdout.write(`Container Gross Margin: ${deepReport.unitEconomicsVerification.containerGrossMarginPct}% (150k VND vs 8k COGS)\n`);
    process.stdout.write("-----------------------------------------------------\n");
    for (const turn of deepReport.socraticTurns) {
      process.stdout.write(`${turn.passed ? "[PASS]" : "[FAIL]"} Open-Core Turn ${turn.turnNumber} (${turn.dimension}): ${turn.evidenceSummary}\n`);
    }
    for (const turn of deepReport.uiUxDeepAudit.socraticTurns) {
      process.stdout.write(`${turn.passed ? "[PASS]" : "[FAIL]"} UI/UX Turn ${turn.turnNumber} (${turn.dimension}): ${turn.evidenceSummary}\n`);
    }
    for (const turn of deepReport.modularityDeepAudit.socraticTurns) {
      process.stdout.write(`${turn.passed ? "[PASS]" : "[FAIL]"} Modularity Turn ${turn.turnNumber} (${turn.dimension}): ${turn.evidenceSummary}\n`);
    }
    process.stdout.write("=====================================================\n");
  }
  if (!all15Passed || !deepReport.blueprintAudit.overallPassed) process.exit(1);
  process.exit(0);
}

const report = evaluateBlueprint25Steps();
if (isJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  process.stdout.write("=====================================================\n");
  process.stdout.write(" DuriOS 25-Step Company Blueprint Verification CLI\n");
  process.stdout.write("=====================================================\n");
  process.stdout.write(`Audited At: ${report.auditedAt}\n`);
  process.stdout.write(`Overall Passed: ${report.overallPassed ? "YES (100%)" : "NO"}\n`);
  process.stdout.write(`Completed Steps: ${report.completedStepsCount} / ${report.totalSteps}\n`);
  process.stdout.write(`Blueprint SHA-256: ${report.blueprintCompositeSha256}\n`);
  process.stdout.write("-----------------------------------------------------\n");
  for (const step of report.steps) {
    const ok = step.completedInTasksMd && step.documentedInPlanMd && step.artifactExists;
    const badge = ok ? "[PASS]" : "[FAIL]";
    process.stdout.write(`${badge} Step ${String(step.stepNumber).padStart(2, "0")}: ${step.stepTitle} (${step.requiredArtifactPath})\n`);
  }
  process.stdout.write("=====================================================\n");
}
if (!report.overallPassed) process.exit(1);
