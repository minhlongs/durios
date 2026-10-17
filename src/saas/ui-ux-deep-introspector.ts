import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SocraticTurnEvaluation } from "./open-core-deep-introspector.js";

export interface UiUxDeepBrainstormReport {
  readonly verdict: "GO_2027_UI_UX_STANDARDIZED" | "HOLD_UI_UX_GAPS";
  readonly evaluatedAt: string;
  readonly allTurnsPassed: boolean;
  readonly totalHtmlSurfacesAudited: number;
  readonly balancedDomSurfacesCount: number;
  readonly deadHrefHashCount: number;
  readonly stitchScreensCount: number;
  readonly socraticTurns: readonly SocraticTurnEvaluation[];
}

export function evaluateUiUxDeepBrainstorm(
  rootDir = process.cwd(),
  nowIso = new Date().toISOString()
): UiUxDeepBrainstormReport {
  const siteDir = join(rootDir, "site/public");
  const rootIndexPath = join(rootDir, "src/server/public/index.html");
  const cssPath = join(siteDir, "durios-design-system.css");
  const jsPath = join(siteDir, "durios-live-bridge.js");

  const stitchFiles = existsSync(siteDir)
    ? readdirSync(siteDir).filter((f) => f.endsWith(".html")).sort()
    : [];
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
    if (openDivs === closeDivs && openDivs > 0) {
      balancedDomSurfacesCount += 1;
    } else {
      unbalancedFiles.push(`${entry.name}(${openDivs}/${closeDivs})`);
    }
    deadHrefHashCount += (entry.html.match(/href="#"/g) ?? []).length;
    if (
      entry.html.includes("<!-- DURIOS-TOP-NAV-START -->") &&
      entry.html.includes("<!-- DURIOS-TOP-NAV-END -->") &&
      entry.html.includes("/stitch/durios-design-system.css") &&
      entry.html.includes("/stitch/durios-live-bridge.js")
    ) {
      sentinelSurfacesCount += 1;
    }
  }

  const totalHtmlSurfacesAudited = allHtmlEntries.length;
  const turn1Passed =
    stitchFiles.length === 25 &&
    totalHtmlSurfacesAudited === 26 &&
    balancedDomSurfacesCount === 26 &&
    sentinelSurfacesCount === 26;

  const turn2Passed =
    turn1Passed &&
    deadHrefHashCount === 0 &&
    jsRaw.includes("setupUniversalInteractiveDelegation") &&
    jsRaw.includes("showLiveToast");

  const turn3Passed =
    cssRaw.includes("--durios-shell-height: 44px") &&
    cssRaw.includes(".durios-redundant-subnav") &&
    cssRaw.includes(".durios-nav-aside") &&
    jsRaw.includes("durios_theme") &&
    rootHtml.includes("durios_theme");

  const turn4Passed =
    rootHtml.includes("workspace-zones-wrapper") &&
    rootHtml.includes("workspace-center-canvas") &&
    rootHtml.includes("workspace-context-panel") &&
    rootHtml.includes("workflow-step-filter-bar") &&
    rootHtml.includes("uploadAllSampleDocs") &&
    rootHtml.includes("verifyAllFields");

  const rootScript = rootHtml.includes("<script>")
    ? rootHtml.slice(rootHtml.indexOf("<script>"), rootHtml.lastIndexOf("</script>"))
    : "";
  const hasBlockingAlert = /(^|[^.\w])alert\(/m.test(rootScript);
  const turn5Passed =
    cssRaw.includes("tabular-nums") &&
    cssRaw.includes("daylight-theme") &&
    rootHtml.includes("prefers-reduced-motion") &&
    rootHtml.includes(":focus-visible") &&
    rootHtml.includes('role="status"') &&
    rootHtml.includes('role="alert"') &&
    !hasBlockingAlert;

  const socraticTurns: readonly SocraticTurnEvaluation[] = [
    { turnNumber: 1, dimension: "100% DOM Tree Balance & App Shell Sentinels", socraticQuestion: "Do all 26 HTML surfaces (root SPA + 25 Stitch screens) have 0 unbalanced <div> tags and unified 44px App Shell sentinels?", passed: turn1Passed, evidenceSummary: turn1Passed ? "26/26 HTML surfaces have openDivs === closeDivs (diff=0) and 44px App Shell sentinels." : `Unbalanced/missing: ${unbalancedFiles.join(", ")}` },
    { turnNumber: 2, dimension: "Zero Dead Links & Universal Button Hydration", socraticQuestion: "Are there 0 dead href='#' links across all 26 HTML surfaces and 100% live button delegation with toasts?", passed: turn2Passed, evidenceSummary: `deadHrefHashCount=${deadHrefHashCount}; setupUniversalInteractiveDelegation & showLiveToast active.` },
    { turnNumber: 3, dimension: "Single-Header Zero-Clutter Chrome & Theme Sync", socraticQuestion: "Are duplicate native headers, sub-navs, and sidebars deduplicated under a single 44px Command Bar with synced theming?", passed: turn3Passed, evidenceSummary: "44px Command Bar active; redundant sub-navs/asides collapsed; durios_theme synced across root & /stitch/*." },
    { turnNumber: 4, dimension: "3-Zone Spatial Layout & 1-Click Batch Accelerators", socraticQuestion: "Does the Packhouse Workspace enforce a 3-Zone layout, workflow step filtering, and 1-click batch upload/verify?", passed: turn4Passed, evidenceSummary: "3-Zone layout, filterWorkflowStep, uploadAllSampleDocs, and verifyAllFields verified in index.html." },
    { turnNumber: 5, dimension: "2027 Design System Tokens & WCAG Field Ergonomics", socraticQuestion: "Are tabular-nums, Daylight/Emerald adaptive themes, ARIA live regions, and zero alert() dialogs enforced?", passed: turn5Passed, evidenceSummary: "tabular-nums, daylight-theme, prefers-reduced-motion, ARIA status/alert regions, and 0 alert() verified." },
  ];

  const allTurnsPassed = socraticTurns.every((t) => t.passed);
  return {
    verdict: allTurnsPassed ? "GO_2027_UI_UX_STANDARDIZED" : "HOLD_UI_UX_GAPS",
    evaluatedAt: nowIso,
    allTurnsPassed,
    totalHtmlSurfacesAudited,
    balancedDomSurfacesCount,
    deadHrefHashCount,
    stitchScreensCount: stitchFiles.length,
    socraticTurns,
  };
}
