import {
  OtpProviderDispatchError,
  OtpProviderNotConfiguredError,
  type OtpChannel,
} from "../auth/otp-provider.js";
import type { SqliteAuthService } from "../auth/sqlite-auth-service.js";
import { resolveAuthenticatedActor } from "./actor-resolver.js";
import { errorResponse, jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export function buildSessionCookieHeader(sessionToken: string, expiresAtIso: string, req: Request): string {
  const expDate = new Date(expiresAtIso);
  const maxAgeSec = Math.max(0, Math.floor((expDate.getTime() - Date.now()) / 1000));
  const isProd = process.env.NODE_ENV === "production" || new URL(req.url).protocol === "https:";
  const parts = [
    `durios_session=${encodeURIComponent(sessionToken)}`, "HttpOnly", "Path=/", "SameSite=Strict",
    `Max-Age=${maxAgeSec}`, `Expires=${expDate.toUTCString()}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

function sessionResponseWithCookie(
  payload: unknown, sessionToken: string, expiresAtIso: string, req: Request, status = 200
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": buildSessionCookieHeader(sessionToken, expiresAtIso, req),
    },
  });
}

export async function handlePasswordLogin(
  authService: SqliteAuthService | undefined,
  req: Request
): Promise<Response> {
  if (!authService) {
    return errorResponse("Authentication service unavailable", 503);
  }
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }
  if (!body.username || !body.password) {
    return errorResponse("Missing required fields: username, password", 400);
  }

  try {
    const session = authService.loginWithPassword(String(body.username), String(body.password));
    return sessionResponseWithCookie(
      {
        success: true,
        data: {
          sessionId: session.sessionId,
          authMethod: session.authMethod,
          expiresAt: session.expiresAt,
          actor: session.actor,
        },
      },
      session.sessionToken,
      session.expiresAt,
      req,
      200
    );
  } catch (err) {
    return mapDomainErrorToResponse(err, "Password login failed");
  }
}

export async function handleOtpChallengeRequest(
  authService: SqliteAuthService | undefined,
  req: Request
): Promise<Response> {
  if (!authService) {
    return errorResponse("Authentication service unavailable", 503);
  }
  let body: { phoneNumber?: string; channel?: OtpChannel };
  try {
    body = (await req.json()) as { phoneNumber?: string; channel?: OtpChannel };
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }
  if (!body.phoneNumber) {
    return errorResponse("Missing required field: phoneNumber", 400);
  }

  const channel: OtpChannel = body.channel === "SMS" ? "SMS" : "ZALO";
  try {
    const challenge = await authService.requestOtpChallenge(String(body.phoneNumber), channel);
    return jsonResponse(
      {
        success: true,
        data: {
          challengeId: challenge.challengeId,
          phoneNumber: challenge.phoneNumber,
          channel: challenge.channel,
          expiresAt: challenge.expiresAt,
          providerReference: challenge.providerReference,
        },
      },
      201
    );
  } catch (err) {
    if (err instanceof OtpProviderNotConfiguredError) {
      return errorResponse(err.message, 503, err.code);
    }
    if (err instanceof OtpProviderDispatchError) {
      return errorResponse(err.message, 502, err.code);
    }
    return mapDomainErrorToResponse(err, "Failed to initiate OTP challenge");
  }
}

export async function handleOtpChallengeVerify(
  authService: SqliteAuthService | undefined,
  req: Request
): Promise<Response> {
  if (!authService) {
    return errorResponse("Authentication service unavailable", 503);
  }
  let body: { challengeId?: string; otpCode?: string };
  try {
    body = (await req.json()) as { challengeId?: string; otpCode?: string };
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }
  if (!body.challengeId || !body.otpCode) {
    return errorResponse("Missing required fields: challengeId, otpCode", 400);
  }

  try {
    const session = authService.verifyOtpChallenge(String(body.challengeId), String(body.otpCode));
    return sessionResponseWithCookie(
      {
        success: true,
        data: {
          sessionId: session.sessionId,
          authMethod: session.authMethod,
          expiresAt: session.expiresAt,
          actor: session.actor,
        },
      },
      session.sessionToken,
      session.expiresAt,
      req,
      200
    );
  } catch (err) {
    return mapDomainErrorToResponse(err, "OTP verification failed");
  }
}

export function handleGetAuthenticatedMe(
  authService: SqliteAuthService | undefined,
  req: Request
): Response {
  try {
    const actor = resolveAuthenticatedActor(req, authService);
    return jsonResponse({ success: true, data: { actor } });
  } catch (err) {
    return mapDomainErrorToResponse(err, "Unauthorized");
  }
}
