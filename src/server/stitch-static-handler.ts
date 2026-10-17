import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { errorResponse } from "./server-types.js";

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

export function serveStitchStaticAsset(pathname: string): Response | undefined {
  if (!pathname.startsWith("/stitch/")) {
    return undefined;
  }

  const subPath = pathname.slice("/stitch/".length).replace(/^\/+/, "");
  const safeFilename = subPath === "" ? "index.html" : subPath;

  if (safeFilename.includes("..") || safeFilename.includes("\\")) {
    return errorResponse("Path traversal forbidden", 403, "FORBIDDEN_PATH_TRAVERSAL");
  }

  const publicDir = join(process.cwd(), "site", "public");
  const fullPath = join(publicDir, safeFilename);

  if (!existsSync(fullPath)) {
    return errorResponse(`Stitch asset '${safeFilename}' not found.`, 404, "STITCH_PAGE_NOT_FOUND");
  }

  const ext = safeFilename.slice(safeFilename.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";
  const fileBytes = readFileSync(fullPath);

  return new Response(fileBytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "X-DuriOS-Stitch-Static": "true",
    },
  });
}
