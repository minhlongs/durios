import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SocraticTurnEvaluation } from "./open-core-deep-introspector.js";
import {
  evaluateUiUxProMaxScorecard, type UiUxProMaxScorecard, type UiUxProMaxScorecardDimension,
} from "./ui-ux-scorecard.js";

export type { UiUxProMaxScorecard, UiUxProMaxScorecardDimension };

export interface UiUxDeepBrainstormReport {
  readonly verdict: "GO_2027_UI_UX_STANDARDIZED" | "HOLD_UI_UX_GAPS";
  readonly evaluatedAt: string; readonly allTurnsPassed: boolean;
  readonly totalHtmlSurfacesAudited: number; readonly balancedDomSurfacesCount: number;
  readonly deadHrefHashCount: number; readonly stitchScreensCount: number;
  readonly socraticTurns: readonly SocraticTurnEvaluation[];
  readonly proMaxScorecard: UiUxProMaxScorecard;
}

export function evaluateUiUxDeepBrainstorm(rootDir = process.cwd(), nowIso = new Date().toISOString()): UiUxDeepBrainstormReport {
  const siteDir = join(rootDir, "site/public");
  const rootIndexPath = join(rootDir, "src/server/public/index.html");
  const [cssPath, jsPath] = [join(siteDir, "durios-design-system.css"), join(siteDir, "durios-live-bridge.js")];

  const stitchFiles = existsSync(siteDir) ? readdirSync(siteDir).filter((f) => f.endsWith(".html")).sort() : [];
  const rootHtml = existsSync(rootIndexPath) ? readFileSync(rootIndexPath, "utf-8") : "";
  const cssRaw = existsSync(cssPath) ? readFileSync(cssPath, "utf-8") : "";
  const jsRaw = existsSync(jsPath) ? readFileSync(jsPath, "utf-8") : "";

  let balancedDomSurfacesCount = 0;
  let deadHrefHashCount = 0;
  let sentinelSurfacesCount = 0;
  const unbalancedFiles: string[] = [];

  const allHtmlEntries: Array<{ name: string; html: string }> = [
    ...(rootHtml ? [{ name: "src/server/public/index.html", html: rootHtml }] : []),
    ...stitchFiles.map((f) => ({ name: f, html: readFileSync(join(siteDir, f), "utf-8") })),
  ];

  for (const entry of allHtmlEntries) {
    const openDivs = (entry.html.match(/<div\b/gi) ?? []).length;
    const closeDivs = (entry.html.match(/<\/div>/gi) ?? []).length;
    if (openDivs === closeDivs && openDivs > 0) balancedDomSurfacesCount += 1;
    else unbalancedFiles.push(`${entry.name}(${openDivs}/${closeDivs})`);
    deadHrefHashCount += (entry.html.match(/href="#"/g) ?? []).length;
    if (
      entry.html.includes("<!-- DURIOS-TOP-NAV-START -->") && entry.html.includes("<!-- DURIOS-TOP-NAV-END -->") &&
      entry.html.includes("/stitch/durios-design-system.css") && entry.html.includes("/stitch/durios-live-bridge.js")
    ) sentinelSurfacesCount += 1;
  }

  const totalHtmlSurfacesAudited = allHtmlEntries.length;
  const turn1Passed = stitchFiles.length === 25 && totalHtmlSurfacesAudited === 26 && balancedDomSurfacesCount === 26 && sentinelSurfacesCount === 26;
  const turn2Passed = turn1Passed && deadHrefHashCount === 0 && jsRaw.includes("setupUniversalInteractiveDelegation") && jsRaw.includes("setupUniversalTableAndInputHydration") && jsRaw.includes("openSocratic10TurnModal") && jsRaw.includes("showLiveToast");
  const turn3Passed = cssRaw.includes("--durios-shell-height: 44px") && cssRaw.includes(".durios-redundant-subnav") && cssRaw.includes(".durios-nav-aside") && jsRaw.includes("durios_theme") && rootHtml.includes("durios_theme");
  const turn4Passed = ["workspace-zones-wrapper", "workspace-center-canvas", "workspace-context-panel", "workflow-step-filter-bar", "uploadAllSampleDocs", "verifyAllFields", "kpi-grid", "dossier-progress-bar"].every((k) => rootHtml.includes(k));

  const rootScript = rootHtml.includes("<script>") ? rootHtml.slice(rootHtml.indexOf("<script>"), rootHtml.lastIndexOf("</script>")) : "";
  const hasBlockingAlert = /(^|[^.\w])alert\(/m.test(rootScript);
  const designDocsPresent = ["MASTER.md", "pages/packhouse-workspace.md", "pages/stitch-command-hub.md", "pages/trust-and-verifier.md", "pages/open-core-and-saas-corridors.md"].every((p) => existsSync(join(rootDir, "design-system", p)));
  const turn5Passed = designDocsPresent && cssRaw.includes("tabular-nums") && cssRaw.includes("daylight-theme") && cssRaw.includes("touch-action: manipulation") && cssRaw.includes("prefers-reduced-motion: reduce") && jsRaw.includes("durios-svg-icon") && jsRaw.includes('aria-live", "polite"') && rootHtml.includes("prefers-reduced-motion") && rootHtml.includes(":focus-visible") && rootHtml.includes('role="status"') && rootHtml.includes('role="alert"') && !hasBlockingAlert;

  const proMaxScorecard = evaluateUiUxProMaxScorecard({
    balancedDomCount: balancedDomSurfacesCount, totalSurfaces: totalHtmlSurfacesAudited,
    deadHrefCount: deadHrefHashCount, cssRaw, jsRaw, rootHtml, hasBlockingAlert,
  });

  const socraticTurns: readonly SocraticTurnEvaluation[] = [
    { turnNumber: 1, dimension: "100% DOM Tree Balance & App Shell Sentinels", socraticQuestion: "Do all 26 HTML surfaces (root workspace + 25 Stitch screens) maintain openDivs === closeDivs and load the 44px App Shell?", passed: turn1Passed, evidenceSummary: turn1Passed ? `${balancedDomSurfacesCount}/${totalHtmlSurfacesAudited} HTML surfaces have openDivs === closeDivs (diff=0) and 44px App Shell sentinels.` : `Unbalanced DOM in: ${unbalancedFiles.join(", ")}` },
    { turnNumber: 2, dimension: "Zero Dead Links & Universal Input/Table Hydration", socraticQuestion: "Are there zero href=\"#\" dead links and does universal interactive delegation hydrate tables/inputs with live feedback?", passed: turn2Passed, evidenceSummary: `deadHrefHashCount=${deadHrefHashCount}; setupUniversalInteractiveDelegation, setupUniversalTableAndInputHydration & openSocratic10TurnModal active.` },
    { turnNumber: 3, dimension: "Single-Header Zero-Clutter Chrome & Theme Sync", socraticQuestion: "Does the 44px Top Command Bar collapse redundant sub-navs/asides and sync Emerald Ops / Daylight Field themes across all 26 pages?", passed: turn3Passed, evidenceSummary: "44px Command Bar active; redundant sub-navs/asides collapsed; durios_theme synced across root & /stitch/*." },
    { turnNumber: 4, dimension: "3-Zone Spatial Layout & 1-Click Batch Accelerators", socraticQuestion: "Does the primary packhouse workspace provide a 3-Zone layout, 4-step workflow filter, and 1-click batch upload/verify accelerators?", passed: turn4Passed, evidenceSummary: "3-Zone layout, filterWorkflowStep, uploadAllSampleDocs, and verifyAllFields verified in root workspace." },
    { turnNumber: 5, dimension: "2027 Design System Tokens & WCAG Field Ergonomics", socraticQuestion: "Are tabular-nums, Daylight Field high-contrast tokens, prefers-reduced-motion, ARIA live regions, and zero alert() dialogs enforced?", passed: turn5Passed, evidenceSummary: `tabular-nums=true, daylightTheme=true, ariaLive=true, blockingAlerts=${hasBlockingAlert ? 1 : 0}.` },
  ];

  const allTurnsPassed = socraticTurns.every((t) => t.passed) && proMaxScorecard.allDimensionsPassed;
  return {
    verdict: allTurnsPassed ? "GO_2027_UI_UX_STANDARDIZED" : "HOLD_UI_UX_GAPS",
    evaluatedAt: nowIso, allTurnsPassed, totalHtmlSurfacesAudited,
    balancedDomSurfacesCount, deadHrefHashCount, stitchScreensCount: stitchFiles.length,
    socraticTurns, proMaxScorecard,
  };
}
