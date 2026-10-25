/**
 * Raised when a save carries a version older than the stored one. It lives in the
 * domain layer so the workspace can refuse a stale write without depending on the
 * storage implementation, and the server maps it to HTTP 409.
 */
export class StaleDossierVersionError extends Error {
  constructor(
    readonly dossierId: string,
    readonly providedVersion: number,
    readonly storedVersion: number
  ) {
    super(
      `Dossier '${dossierId}' was changed by someone else (your version ${providedVersion}, current version ${storedVersion}). Reload the dossier to continue.`
    );
    this.name = "StaleDossierVersionError";
  }
}

/** Whether an error is a stale-version conflict, for callers that catch unknown. */
export function isStaleDossierVersionError(err: unknown): err is StaleDossierVersionError {
  return err instanceof StaleDossierVersionError;
}
