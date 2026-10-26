import { HOMEPAGE_SHOWROOM_CSS } from "./homepage-showroom-css.js";
import { buildHomepageShowroomHtml } from "./homepage-showroom-html.js";

/**
 * Injects the 2027 3-in-1 Homepage Showroom & 1-Click Workspace Switcher
 * directly above `<div class="layout">` in the served workspace index HTML.
 *
 * Keeps `<div class="layout">`, `#dossier-nav`, and `#workspace-main` intact
 * and avoids adding any `<script>...</script>` block inside `<body>` so
 * `test/review-state-injection.test.ts` continues to parse the workspace script cleanly.
 */
export function injectHomepageShowroom(rawHtml: string): string {
  if (rawHtml.includes('id="durios-home-showroom"')) {
    return rawHtml;
  }

  const styleBlock = `<style id="durios-home-showroom-styles">${HOMEPAGE_SHOWROOM_CSS}</style>`;
  const showroomMarkup = buildHomepageShowroomHtml();

  let enriched = rawHtml.includes("</head>")
    ? rawHtml.replace("</head>", `${styleBlock}\n</head>`)
    : `${styleBlock}\n${rawHtml}`;

  const layoutAnchor = '<div class="layout">';
  if (enriched.includes(layoutAnchor)) {
    enriched = enriched.replace(layoutAnchor, `${showroomMarkup}\n  ${layoutAnchor}`);
  } else if (enriched.includes("</body>")) {
    enriched = enriched.replace("</body>", `${showroomMarkup}\n</body>`);
  } else {
    enriched = `${enriched}\n${showroomMarkup}`;
  }

  return enriched;
}
