import type { AuthenticatedActor } from "../domain/types.js";
import { AuthenticationError } from "../auth/auth-types.js";
import type { SqliteAuthService } from "../auth/sqlite-auth-service.js";

function extractCookieToken(cookieHeader: string | null, cookieName: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === cookieName && rest.length > 0) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return undefined;
}

export function extractRequestCredentialToken(req: Request): string | undefined {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  const pilotTokenHeader = req.headers.get("x-pilot-token")?.trim();
  if (pilotTokenHeader) {
    return pilotTokenHeader;
  }

  const cookieToken = extractCookieToken(req.headers.get("cookie"), "durios_session");
  if (cookieToken) {
    return cookieToken;
  }

  return undefined;
}

/**
 * Resolves the authenticated server-side actor strictly from a verified
 * session token or managed pilot token stored in SQLite.
 *
 * Client-supplied identity headers/query params (x-actor-role, x-tenant-id,
 * x-actor-id, x-actor-name, ?role=, ?tenantId=) are NEVER trusted.
 * Missing or invalid credentials fail closed with AuthenticationError (401).
 */
export function resolveAuthenticatedActor(
  req: Request,
  authService?: SqliteAuthService | undefined
): AuthenticatedActor {
  if (!authService) {
    throw new AuthenticationError(
      "Server authentication service is not initialized; unauthenticated requests are rejected.",
      "MISSING_CREDENTIALS"
    );
  }

  const rawToken = extractRequestCredentialToken(req);
  if (!rawToken) {
    throw new AuthenticationError(
      "Authentication required: missing Bearer token, session cookie, or managed pilot token.",
      "MISSING_CREDENTIALS"
    );
  }

  return authService.authenticateToken(rawToken);
}

/**
 * Deprecated alias retained only for import compatibility; delegates strictly
 * to server-verified authentication and fails closed without credentials.
 */
export function resolveLocalActor(
  req: Request,
  authService?: SqliteAuthService | undefined
): AuthenticatedActor {
  return resolveAuthenticatedActor(req, authService);
}
