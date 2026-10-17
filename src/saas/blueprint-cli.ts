#!/usr/bin/env bun
import { evaluateBlueprint25Steps } from "./blueprint-25-step-auditor.js";

const report = evaluateBlueprint25Steps();
const isJson = process.argv.includes("--json");

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
    process.stdout.write(`${mark} Step ${s.stepNumber.toString().padStart(2, " ")}: ${s.stepTitle} (${s.requiredArtifactPath})\n`);
  }
  process.stdout.write("=====================================================\n");
}

if (!report.overallPassed) {
  process.exit(1);
}
