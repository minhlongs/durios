import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { injectReviewVocabularies } from "./review-state-injection.js";

let cachedHtml: string | null = null;

/**
 * Serve the workspace with the shared review vocabulary already substituted in.
 *
 * The page is a single HTML file with one inline script, so a browser cannot
 * import `src/ui/*` directly — those are TypeScript modules with `.js` specifiers
 * and no transpile step. Substituting the values here keeps one source of truth
 * for the labels the operator reads, without a build step. The cache stores the
 * substituted result, so the substitution cost is paid once per process.
 */
export function serveIndexHtml(): Response {
  if (!cachedHtml) {
    const htmlPath = join(process.cwd(), "src/server/public/index.html");
    const raw = existsSync(htmlPath)
      ? readFileSync(htmlPath, "utf-8")
      : "<html><body><h1>DuriOS Server Running</h1><p>index.html not found</p></body></html>";
    cachedHtml = injectReviewVocabularies(raw);
  }

  return new Response(cachedHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
