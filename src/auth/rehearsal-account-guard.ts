import { AuthenticationError } from "./auth-types.js";
import { isSyntheticExtractionEnabled } from "../extraction/synthetic-extraction-mode.js";
import { isRehearsalBootstrapEnabled } from "../server/rehearsal-bootstrap-guard.js";

export const PUBLIC_REHEARSAL_USERNAMES: readonly string[] = ["clerk.cailay", "manager.cailay"];
export const PUBLIC_REHEARSAL_ACCOUNT_IDS: readonly string[] = ["ACC-CAILAY-CLERK-01", "ACC-CAILAY-MGR-01"];
export const PUBLIC_REHEARSAL_PHONES: readonly string[] = ["+84901000111", "+84901000222"];

export interface RehearsalAccountIdentityCandidate {
  readonly id?: string | null | undefined;
  readonly username?: string | null | undefined;
  readonly phoneNumber?: string | null | undefined;
}

export function isPublicRehearsalAccount(candidate: RehearsalAccountIdentityCandidate): boolean {
  const id = candidate.id?.trim();
  if (id && PUBLIC_REHEARSAL_ACCOUNT_IDS.includes(id)) return true;
  const username = candidate.username?.trim().toLowerCase();
  if (username && PUBLIC_REHEARSAL_USERNAMES.includes(username)) return true;
  const phone = candidate.phoneNumber?.trim();
  if (phone && PUBLIC_REHEARSAL_PHONES.includes(phone)) return true;
  return false;
}

export function isRehearsalAccountAuthAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return isSyntheticExtractionEnabled(env) || isRehearsalBootstrapEnabled(env);
}

/**
 * Rehearsal accounts (clerk.cailay / manager.cailay) use passwords published in the repository.
 * Even if an operator accidentally copies a rehearsal database or provisions one of those
 * usernames, they must never authenticate or receive tokens unless the process explicitly runs
 * in synthetic rehearsal mode (DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true or
 * DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP=true).
 */
export function assertRehearsalAccountAllowedInCurrentMode(
  candidate: RehearsalAccountIdentityCandidate,
  env: Readonly<Record<string, string | undefined>> = process.env
): void {
  if (!isPublicRehearsalAccount(candidate)) return;
  if (isRehearsalAccountAuthAllowed(env)) return;
  throw new AuthenticationError(
    "Public rehearsal account (clerk.cailay / manager.cailay) is disabled outside declared synthetic rehearsal mode.",
    "ACCOUNT_DISABLED"
  );
}
