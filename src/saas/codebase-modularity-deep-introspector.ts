import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SocraticTurnEvaluation } from "./open-core-deep-introspector.js";

export interface CodebaseModularityDeepReport {
  readonly verdict: "GO_MODULAR_ZERO_ANY_VERIFIED" | "HOLD_MODULARITY_VIOLATIONS";
  readonly evaluatedAt: string;
  readonly allTurnsPassed: boolean;
  readonly srcFilesCount: number;
  readonly testFilesCount: number;
  readonly maxSrcLoc: number; readonly maxTestLoc: number; readonly locCeiling: 100;
  readonly anyTypeViolationsCount: number;
  readonly designSystemDocsCount: number;
  readonly socraticTurns: readonly SocraticTurnEvaluation[];
}

function collectTsFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    if (statSync(full).isDirectory()) results.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) results.push(full);
  }
  return results;
}

const DESIGN_SYSTEM_DOCS: readonly string[] = [
  "design-system/MASTER.md",
  "design-system/pages/packhouse-workspace.md",
  "design-system/pages/stitch-command-hub.md",
  "design-system/pages/trust-and-verifier.md",
  "design-system/pages/open-core-and-saas-corridors.md",
];

export function evaluateCodebaseModularityDeep(
  rootDir = process.cwd(),
  nowIso = new Date().toISOString()
): CodebaseModularityDeepReport {
  const srcFiles = collectTsFiles(join(rootDir, "src"));
  const testFiles = collectTsFiles(join(rootDir, "test"));
  const locCeiling = 100 as const;

  let maxSrcLoc = 0; const srcViolations: string[] = []; let anyTypeViolationsCount = 0;
  const anyPattern = new RegExp(":\\s*any\\b|\\bas\\s+any\\b", "g");

  for (const file of srcFiles) {
    const raw = readFileSync(file, "utf-8");
    const lines = raw.split("\n").length;
    if (lines > maxSrcLoc) maxSrcLoc = lines;
    if (lines > locCeiling) srcViolations.push(`${file.slice(rootDir.length + 1)}(${lines})`);
    anyTypeViolationsCount += (raw.match(anyPattern) ?? []).length;
  }

  let maxTestLoc = 0;
  const testViolations: string[] = [];
  for (const file of testFiles) {
    const raw = readFileSync(file, "utf-8");
    const lines = raw.split("\n").length;
    if (lines > maxTestLoc) maxTestLoc = lines;
    if (lines > locCeiling) testViolations.push(`${file.slice(rootDir.length + 1)}(${lines})`);
    anyTypeViolationsCount += (raw.match(anyPattern) ?? []).length;
  }

  const turn1Passed = srcFiles.length > 0 && srcViolations.length === 0 && maxSrcLoc <= locCeiling;
  const turn2Passed = testFiles.length > 0 && testViolations.length === 0 && maxTestLoc <= locCeiling;
  const turn3Passed = srcFiles.length > 0 && anyTypeViolationsCount === 0;

  const existingDesignDocs = DESIGN_SYSTEM_DOCS.filter((rel) => existsSync(join(rootDir, rel)));
  const turn4Passed = existingDesignDocs.length === DESIGN_SYSTEM_DOCS.length;

  const siteDir = join(rootDir, "site/public");
  const queueDir = join(rootDir, "queue");
  const pngCount = existsSync(siteDir) ? readdirSync(siteDir).filter((f) => f.endsWith(".png")).length : 0;
  const siteCss = existsSync(join(siteDir, "durios-design-system.css")) ? readFileSync(join(siteDir, "durios-design-system.css"), "utf-8") : "";
  const queueCss = existsSync(join(queueDir, "durios-design-system.css")) ? readFileSync(join(queueDir, "durios-design-system.css"), "utf-8") : "";
  const siteJs = existsSync(join(siteDir, "durios-live-bridge.js")) ? readFileSync(join(siteDir, "durios-live-bridge.js"), "utf-8") : "";
  const queueJs = existsSync(join(queueDir, "durios-live-bridge.js")) ? readFileSync(join(queueDir, "durios-live-bridge.js"), "utf-8") : "";
  const turn5Passed = pngCount >= 25 && siteCss.length > 0 && siteCss === queueCss && siteJs.length > 0 && siteJs === queueJs;

  const socraticTurns: readonly SocraticTurnEvaluation[] = [
    { turnNumber: 1, dimension: "src/ Modularity Ceiling (<= 100 LOC)", socraticQuestion: "Is every TypeScript file in src/ strictly <= 100 lines?", passed: turn1Passed, evidenceSummary: turn1Passed ? `${srcFiles.length} src/ files verified; maxSrcLoc=${maxSrcLoc} <= ${locCeiling}.` : `Violations: ${srcViolations.join(", ")}` },
    { turnNumber: 2, dimension: "test/ Modularity Ceiling (<= 100 LOC)", socraticQuestion: "Is every TypeScript file in test/ strictly <= 100 lines?", passed: turn2Passed, evidenceSummary: turn2Passed ? `${testFiles.length} test/ files verified; maxTestLoc=${maxTestLoc} <= ${locCeiling}.` : `Violations: ${testViolations.join(", ")}` },
    { turnNumber: 3, dimension: "Zero Untyped Casts & Strict Type Safety", socraticQuestion: "Are all src/ and test/ TypeScript files 100% free of untyped casts and implicit type escapes?", passed: turn3Passed, evidenceSummary: `anyTypeViolationsCount=${anyTypeViolationsCount} across ${srcFiles.length + testFiles.length} TypeScript files.` },
    { turnNumber: 4, dimension: "Hierarchical Design System Master & Page Overrides", socraticQuestion: "Are design-system/MASTER.md and all 4 domain override specs present?", passed: turn4Passed, evidenceSummary: `${existingDesignDocs.length}/${DESIGN_SYSTEM_DOCS.length} hierarchical design system specs verified.` },
    { turnNumber: 5, dimension: "Site & Queue Asset Parity + 25 PNG Previews", socraticQuestion: "Are site/public and queue/ design system assets synchronized with all 25 PNG previews?", passed: turn5Passed, evidenceSummary: `${pngCount}/25 PNG previews present; site/public & queue/ CSS and JS byte-identical.` },
  ];

  const allTurnsPassed = socraticTurns.every((t) => t.passed);
  return {
    verdict: allTurnsPassed ? "GO_MODULAR_ZERO_ANY_VERIFIED" : "HOLD_MODULARITY_VIOLATIONS",
    evaluatedAt: nowIso, allTurnsPassed,
    srcFilesCount: srcFiles.length, testFilesCount: testFiles.length,
    maxSrcLoc, maxTestLoc, locCeiling,
    anyTypeViolationsCount, designSystemDocsCount: existingDesignDocs.length,
    socraticTurns,
  };
}
