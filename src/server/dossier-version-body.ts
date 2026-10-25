/**
 * The version the caller holds, sent on every mutating request. Without it the
 * version guard compares a dossier against itself, so a stale client can never
 * be refused — see the concurrency phase in the plan.
 */
export interface DossierVersionBody {
  readonly version?: number | undefined;
}
