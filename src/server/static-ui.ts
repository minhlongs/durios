import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let cachedHtml: string | null = null;

export function serveIndexHtml(): Response {
  if (!cachedHtml) {
    const htmlPath = join(process.cwd(), "src/server/public/index.html");
    if (existsSync(htmlPath)) {
      cachedHtml = readFileSync(htmlPath, "utf-8");
    } else {
      cachedHtml = "<html><body><h1>DuriOS Server Running</h1><p>index.html not found</p></body></html>";
    }
  }

  return new Response(cachedHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
