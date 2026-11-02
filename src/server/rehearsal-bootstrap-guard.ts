import { AccessControlError } from "../auth/rbac-policy.js";

/**
 * Opt-in switch for the unauthenticated rehearsal bootstrap route.
 *
 * `POST /api/auth/pilot-rehearsal-bootstrap` provisions the Cai Lậy rehearsal
 * accounts from credentials that are published in this repository, logs in as both
 * of them and returns a MANAGER pilot token plus a session cookie in the response
 * body. Loopback binding alone does not contain it: every process on the host, every
 * web page through a cross-origin POST, and every reverse proxy forwarding
 * `Host: 127.0.0.1:3000` (the nginx `proxy_set_header Host $proxy_host` default) can
 * reach it, and the caller ends up holding manager rights over the pilot tenant.
 *
 * The route is therefore refused unless the operator explicitly declares that this
 * instance is a rehearsal sandbox. The operational path — provision accounts with
 * `src/auth/pilot-ops-cli.ts`, then log in — needs no flag.
 */
export const REHEARSAL_BOOTSTRAP_ENV_FLAG = "DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP";

export function isRehearsalBootstrapEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[REHEARSAL_BOOTSTRAP_ENV_FLAG]?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function assertRehearsalBootstrapEnabled(
  env: Record<string, string | undefined> = process.env
): void {
  if (isRehearsalBootstrapEnabled(env)) return;
  throw new AccessControlError(
    "Rehearsal bootstrap is disabled on this instance. It provisions pilot accounts with published " +
      "credentials and returns a MANAGER token without authentication, so it is refused unless the " +
      `operator starts the server with ${REHEARSAL_BOOTSTRAP_ENV_FLAG}=true on a synthetic rehearsal ` +
      "database. For an operational pilot, provision accounts with src/auth/pilot-ops-cli.ts and log in.",
    "FEATURE_DISABLED"
  );
}
