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

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T | undefined;
  readonly error?: string | undefined;
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

export function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
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
