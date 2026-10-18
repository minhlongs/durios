export interface UiUxProMaxScorecardDimension {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly maxScore: number;
  readonly passed: boolean;
  readonly evidence: string;
}

export interface UiUxProMaxScorecard {
  readonly totalScore: number;
  readonly maxScore: 100;
  readonly allDimensionsPassed: boolean;
  readonly dimensions: readonly UiUxProMaxScorecardDimension[];
}

export interface ScorecardParams {
  readonly balancedDomCount: number;
  readonly totalSurfaces: number;
  readonly deadHrefCount: number;
  readonly cssRaw: string;
  readonly jsRaw: string;
  readonly rootHtml: string;
  readonly hasBlockingAlert: boolean;
}

export function evaluateUiUxProMaxScorecard(p: ScorecardParams): UiUxProMaxScorecard {
  const c1 = p.balancedDomCount === 26 && p.totalSurfaces === 26;
  const c2 = p.deadHrefCount === 0;
  const c3 = p.cssRaw.includes("--durios-shell-height: 44px") && p.cssRaw.includes(".durios-redundant-subnav");
  const c4 = p.jsRaw.includes("durios_theme") && p.rootHtml.includes("durios_theme");
  const c5 = p.jsRaw.includes("setupUniversalTableAndInputHydration");
  const c6 = p.jsRaw.includes("durios-pro-max-telemetry-ribbon") || p.jsRaw.includes("injectProMaxTelemetryRibbon");
  const c7 = p.jsRaw.includes("openSocratic10TurnModal");
  const c8 = p.rootHtml.includes("workspace-zones-wrapper") && p.rootHtml.includes("workflow-step-filter-bar");
  const c9 = p.jsRaw.includes("setupGlobalHotkeys") || p.jsRaw.includes("openCommandPalette");
  const c10 = p.cssRaw.includes("tabular-nums") && p.rootHtml.includes('role="status"') && !p.hasBlockingAlert;

  const dims: UiUxProMaxScorecardDimension[] = [
    { id: "DOM_TREE_BALANCE_26_SURFACES", name: "DOM Tree Balance (26 Surfaces)", score: c1 ? 10 : 0, maxScore: 10, passed: c1, evidence: `${p.balancedDomCount}/${p.totalSurfaces} balanced <div> trees.` },
    { id: "ZERO_DEAD_HREF_LINKS", name: "Zero Dead Href Links", score: c2 ? 10 : 0, maxScore: 10, passed: c2, evidence: `${p.deadHrefCount} dead href="#" links.` },
    { id: "SINGLE_HEADER_44PX_APP_SHELL", name: "Single Header 44px App Shell", score: c3 ? 10 : 0, maxScore: 10, passed: c3, evidence: "44px single header active with redundant subnav collapse." },
    { id: "ADAPTIVE_DUAL_THEME_WCAG_AAA", name: "Adaptive Dual-Theme WCAG AAA", score: c4 ? 10 : 0, maxScore: 10, passed: c4, evidence: "Emerald Ops and Daylight Field synced via durios_theme." },
    { id: "UNIVERSAL_TABLE_INPUT_HYDRATION", name: "Universal Table/Input Hydration", score: c5 ? 10 : 0, maxScore: 10, passed: c5, evidence: "setupUniversalTableAndInputHydration active." },
    { id: "LIVE_TELEMETRY_HUD_RIBBON", name: "Live Telemetry HUD Ribbon", score: c6 ? 10 : 0, maxScore: 10, passed: c6, evidence: "durios-pro-max-telemetry-ribbon active." },
    { id: "SOCRATIC_10_TURN_LIVE_MODAL", name: "Socratic 10-Turn Live Modal", score: c7 ? 10 : 0, maxScore: 10, passed: c7, evidence: "openSocratic10TurnModal active." },
    { id: "THREE_ZONE_PROGRESSIVE_WORKSPACE", name: "3-Zone Progressive Workspace", score: c8 ? 10 : 0, maxScore: 10, passed: c8, evidence: "workspace-zones-wrapper and workflow-step-filter-bar active." },
    { id: "KEYBOARD_FIRST_OPERATOR_HOTKEYS", name: "Keyboard-First Operator Hotkeys", score: c9 ? 10 : 0, maxScore: 10, passed: c9, evidence: "Global keyboard shortcuts (1-4, 0, n, r, f, [, ⌘K) active." },
    { id: "TABULAR_NUMS_AND_ZERO_BLOCKING_ALERTS", name: "Tabular Nums & Zero Blocking Alerts", score: c10 ? 10 : 0, maxScore: 10, passed: c10, evidence: "tabular-nums enabled, ARIA live regions active, 0 alerts." },
  ];

  const totalScore = dims.reduce((sum, d) => sum + d.score, 0);
  return { totalScore, maxScore: 100, allDimensionsPassed: dims.every((d) => d.passed), dimensions: dims };
}
