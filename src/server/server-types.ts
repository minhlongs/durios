import { AuthenticationError } from "../auth/auth-types.js";
import { AccessControlError } from "../auth/rbac-policy.js";
import { DossierFsmError } from "../domain/dossier-fsm.js";
import { InvalidOrganicEvidenceError } from "../organic/organic-evidence-manager.js";

export interface CreateDossierRequestBody {
  readonly dossierCode: string;
  readonly containerNumber: string;
  readonly sealNumber: string;
  readonly targetMarket: string;
  readonly borderGate: string;
  readonly targetTemperatureC: number;
  readonly declaredNetWeightKg: number;
  readonly declaredBoxCount: number;
}

export interface VerifyFieldRequestBody {
  readonly confirmedValue: string | number;
  readonly clerkNote?: string | undefined;
  readonly rejectField?: boolean | undefined;
}

/** A named quality manager signing past a blocking finding. The reason is required. */
export interface OverrideBlockerRequestBody {
  readonly reason: string;
}

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T | undefined;
  readonly error?: string | undefined;
  readonly errorCode?: string | undefined;
  readonly message?: string | undefined;
}

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function errorResponse(
  message: string,
  status = 400,
  errorCode?: string
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      ...(errorCode ? { errorCode } : {}),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export function mapDomainErrorToResponse(
  err: unknown,
  fallbackMessage = "Request failed"
): Response {
  if (err instanceof AuthenticationError) {
    return errorResponse(err.message, err.status, err.code);
  }
  if (err instanceof AccessControlError) {
    return errorResponse(err.message, err.status, err.code);
  }
  if (err instanceof DossierFsmError) {
    return errorResponse(err.message, err.status, err.code);
  }
  if (err instanceof InvalidOrganicEvidenceError) {
    return errorResponse(err.message, err.status, err.code);
  }
  const message = err instanceof Error ? err.message : fallbackMessage;
  return errorResponse(message, 400);
}
