#!/usr/bin/env bun
import { evaluateBlueprint25Steps } from "./blueprint-25-step-auditor.js";
import { evaluateOpenCoreDeepBrainstorm } from "./open-core-deep-introspector.js";

const isJson = process.argv.includes("--json");
const isDeep = process.argv.includes("--deep");

if (isDeep) {
  const deepReport = evaluateOpenCoreDeepBrainstorm();
  if (isJson) {
    process.stdout.write(JSON.stringify(deepReport, null, 2) + "\n");
  } else {
    process.stdout.write("=====================================================\n");
    process.stdout.write(" DuriOS Deep Open-Core & SaaS Brainstorm (--deep)\n");
    process.stdout.write("=====================================================\n");
    process.stdout.write(`Idea Verdict: ${deepReport.ideaVerdict}\n`);
    process.stdout.write(`UI/UX 2027 Verdict: ${deepReport.uiUxDeepAudit.verdict} (${deepReport.uiUxDeepAudit.balancedDomSurfacesCount}/${deepReport.uiUxDeepAudit.totalHtmlSurfacesAudited} HTML Surfaces, ${deepReport.uiUxDeepAudit.deadHrefHashCount} Dead Links)\n`);
    process.stdout.write(`All 10 Socratic Turns Passed: ${deepReport.allTurnsPassed && deepReport.uiUxDeepAudit.allTurnsPassed ? "YES (10/10)" : "NO"}\n`);
    process.stdout.write(`25-Step Blueprint Passed: ${deepReport.blueprintAudit.overallPassed ? "YES (25/25)" : "NO"}\n`);
    process.stdout.write(
      `Container Gross Margin: ${deepReport.unitEconomicsVerification.containerGrossMarginPct}% (150k VND vs 8k COGS)\n`
    );
    process.stdout.write("-----------------------------------------------------\n");
    for (const turn of deepReport.socraticTurns) {
      const badge = turn.passed ? "[PASS]" : "[FAIL]";
      process.stdout.write(`${badge} Open-Core Turn ${turn.turnNumber} (${turn.dimension}): ${turn.evidenceSummary}\n`);
    }
    for (const turn of deepReport.uiUxDeepAudit.socraticTurns) {
      const badge = turn.passed ? "[PASS]" : "[FAIL]";
      process.stdout.write(`${badge} UI/UX Turn ${turn.turnNumber} (${turn.dimension}): ${turn.evidenceSummary}\n`);
    }
    process.stdout.write("=====================================================\n");
  }
  if (!deepReport.allTurnsPassed || !deepReport.uiUxDeepAudit.allTurnsPassed || !deepReport.blueprintAudit.overallPassed) {
    process.exit(1);
  }
  process.exit(0);
}

const report = evaluateBlueprint25Steps();

if (isJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  process.stdout.write("=====================================================\n");
  process.stdout.write(" DuriOS 25-Step Company Blueprint Verification Report\n");
  process.stdout.write("=====================================================\n");
  process.stdout.write(`Project: ${report.project}\n`);
  process.stdout.write(`Audited At: ${report.auditedAt}\n`);
  process.stdout.write(`Completed Steps: ${report.completedStepsCount}/${report.totalSteps}\n`);
  process.stdout.write(`All Artifacts Present: ${report.allArtifactsPresent ? "YES" : "NO"}\n`);
  process.stdout.write(`Composite SHA-256: ${report.blueprintCompositeSha256}\n`);
  process.stdout.write(`Overall Verdict: ${report.overallPassed ? "PASSED (100%)" : "FAILED"}\n`);
  process.stdout.write("-----------------------------------------------------\n");

  for (const s of report.steps) {
    const mark = s.completedInTasksMd && s.artifactExists ? "[PASS]" : "[FAIL]";
    process.stdout.write(
      `${mark} Step ${s.stepNumber.toString().padStart(2, " ")}: ${s.stepTitle} (${s.requiredArtifactPath})\n`
    );
  }
  process.stdout.write("=====================================================\n");
}

if (!report.overallPassed) {
  process.exit(1);
}
