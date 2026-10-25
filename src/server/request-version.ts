import type { DossierVersionBody } from "./dossier-version-body.js";

/** Reads the client's held version from a parsed body, or undefined when it sent none. */
export function readExpectedVersion(body: DossierVersionBody): number | undefined {
  return typeof body.version === "number" ? body.version : undefined;
}

/** Parses a request body, tolerating an empty one so a bare POST still works. */
export async function readJsonBody(req: Request): Promise<DossierVersionBody> {
  try { return (await req.json()) as DossierVersionBody; } catch { return {}; }
}

/** Reads the version from a request whose body may be absent. */
export async function readExpectedVersionFromRequest(req: Request): Promise<number | undefined> {
  return readExpectedVersion(await readJsonBody(req));
}
