import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateSha256 } from "../ingestion/document-hasher.js";

export interface BlueprintStepVerificationItem {
  readonly stepNumber: number;
  readonly stepTitle: string;
  readonly completedInTasksMd: boolean;
  readonly documentedInPlanMd: boolean;
  readonly requiredArtifactPath: string;
  readonly artifactExists: boolean;
}

export interface Blueprint25StepAuditReport {
  readonly project: "DuriOS";
  readonly auditedAt: string;
  readonly totalSteps: 25;
  readonly completedStepsCount: number;
  readonly allArtifactsPresent: boolean;
  readonly overallPassed: boolean;
  readonly companyJsonSha256: string;
  readonly planMdSha256: string;
  readonly tasksMdSha256: string;
  readonly blueprintCompositeSha256: string;
  readonly steps: readonly BlueprintStepVerificationItem[];
}

const STEP_ARTIFACTS: ReadonlyArray<{ readonly step: number; readonly title: string; readonly artifact: string }> = [ { step: 1, title: "Open-Core Master Framework", artifact: "src/saas/open-core-edition-manifest.ts" }, { step: 2, title: "2026 Truthful Plan Refresh", artifact: "docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md" }, { step: 3, title: "Agentic OS & HITL Governance", artifact: "src/verification/hitl-service.ts" }, { step: 4, title: "Pilot Readiness & Audit Evidence", artifact: "src/export/field-auditor-cli.ts" }, { step: 5, title: "Conditional 5-Stage Sequencing Roadmap", artifact: "docs/product-direction/PRODUCT-PRD-V2.md" }, { step: 6, title: "Economic Truth First & Multi-Revenue Stack", artifact: "docs/product-direction/DURIOS-STRATEGY-V2.json" }, { step: 7, title: "Tri-Tuple Buyer & Operator Personas", artifact: "src/auth/rbac-policy.ts" }, { step: 8, title: "Category Positioning", artifact: "docs/product-direction/PRODUCT-VISION-V2.md" }, { step: 9, title: "Bilingual Open-Source Docs & MIT Verifier", artifact: "src/export/standalone-manifest-verifier.ts" }, { step: 10, title: "Federated Privacy-First Narrative", artifact: "src/sharing/verified-org-profile.ts" }, { step: 11, title: "Field-First Demo & Blind-Fault Testing", artifact: "src/auth/pilot-rehearsal-seeder.ts" }, { step: 12, title: "Case Study Evidence Protocol", artifact: "src/auth/pilot-kpi-extended-types.ts" }, { step: 13, title: "Community-to-Pro Upgrade Trigger", artifact: "src/saas/saas-tier-policy.ts" }, { step: 14, title: "Signed Workspace Portability Funnel", artifact: "src/saas/workspace-portability-bundle.ts" }, { step: 15, title: "Dense Cluster GTM Playbook", artifact: "src/sharing/dense-cluster-readiness.ts" }, { step: 16, title: "North Star & Funnel Metrics", artifact: "src/auth/pilot-kpi-evaluator.ts" }, { step: 17, title: "Strategic & VC Narrative", artifact: "docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V2.md" }, { step: 18, title: "Dual-License IP, Rate Limiting & Hygiene", artifact: "src/server/tenant-rate-limiter.ts" }, { step: 19, title: "On-Premise Resilience & Backup Runbook", artifact: "docs/pilot-readiness/03_SECURITY_AND_ONPREM_RUNBOOK.md" }, { step: 20, title: "Competitive & Regional Benchmarks", artifact: "src/rules/asean-corridor-adapters.ts" }, { step: 21, title: "Evidence-Backed Audit Data Room", artifact: "src/storage/sqlite-audit-ledger.ts" }, { step: 22, title: "Quarterly OKRs", artifact: ".mekong/company.json" }, { step: 23, title: "Dual-Lock Marketplace & Zero-Custody", artifact: "src/marketplace/marketplace-guard.ts" }, { step: 24, title: "Personal Data Protection & Disclaimers", artifact: "docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md" }, { step: 25, title: "9 Hard Kill Criteria & Incident Playbook", artifact: "docs/product-direction/STRATEGY-V2-BACKLOG.md" } ];

export function evaluateBlueprint25Steps(
  rootDir = process.cwd(),
  nowIso = new Date().toISOString()
): Blueprint25StepAuditReport {
  const companyRaw = readFileSync(join(rootDir, ".mekong/company.json"), "utf-8");
  const planRaw = readFileSync(join(rootDir, "plans/company-blueprint/plan.md"), "utf-8");
  const tasksRaw = readFileSync(join(rootDir, "plans/company-blueprint/tasks.md"), "utf-8");

  const companyJsonSha256 = calculateSha256(companyRaw);
  const planMdSha256 = calculateSha256(planRaw);
  const tasksMdSha256 = calculateSha256(tasksRaw);
  const blueprintCompositeSha256 = calculateSha256(
    `${companyJsonSha256}|${planMdSha256}|${tasksMdSha256}`
  );

  const steps: BlueprintStepVerificationItem[] = STEP_ARTIFACTS.map((entry) => {
    const taskRegex = new RegExp(`^- \\[x\\] \\*\\*Step ${entry.step}:`, "m");
    const planRegex = new RegExp(`^## ${entry.step}\\.`, "m");
    const completedInTasksMd = taskRegex.test(tasksRaw);
    const documentedInPlanMd = planRegex.test(planRaw);
    const artifactExists = existsSync(join(rootDir, entry.artifact));

    return {
      stepNumber: entry.step,
      stepTitle: entry.title,
      completedInTasksMd,
      documentedInPlanMd,
      requiredArtifactPath: entry.artifact,
      artifactExists,
    };
  });

  const completedStepsCount = steps.filter(
    (s) => s.completedInTasksMd && s.documentedInPlanMd
  ).length;
  const allArtifactsPresent = steps.every((s) => s.artifactExists);
  const overallPassed = completedStepsCount === 25 && allArtifactsPresent;

  return {
    project: "DuriOS",
    auditedAt: nowIso,
    totalSteps: 25,
    completedStepsCount,
    allArtifactsPresent,
    overallPassed,
    companyJsonSha256,
    planMdSha256,
    tasksMdSha256,
    blueprintCompositeSha256,
    steps,
  };
}
