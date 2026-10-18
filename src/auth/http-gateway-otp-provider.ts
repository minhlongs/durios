import {
  type OtpDispatchRequest, type OtpDispatchResult, type OtpProviderAdapter, UnconfiguredOtpProvider,
} from "./otp-provider.js";

export class OtpProviderDispatchError extends Error {
  public readonly code = "OTP_PROVIDER_DISPATCH_FAILED";
  constructor(message = "OTP provider gateway failed to dispatch the challenge.") {
    super(message);
    this.name = "OtpProviderDispatchError";
  }
}

export interface HttpGatewayOtpProviderConfig {
  readonly providerName: string; readonly apiUrl: string; readonly apiKey: string;
  readonly secretKey?: string | undefined; readonly zaloOaId?: string | undefined;
  readonly zaloTemplateId?: string | undefined; readonly smsBrandname?: string | undefined;
  readonly timeoutMs?: number | undefined; readonly fetchImpl?: typeof fetch | undefined;
}

export class HttpGatewayOtpProvider implements OtpProviderAdapter {
  public readonly providerName: string; public readonly isConfigured = true;
  private readonly apiUrl: string; private readonly apiKey: string; private readonly secretKey: string | undefined;
  private readonly zaloOaId: string | undefined; private readonly zaloTemplateId: string | undefined;
  private readonly smsBrandname: string | undefined; private readonly timeoutMs: number; private readonly fetchImpl: typeof fetch;

  constructor(config: HttpGatewayOtpProviderConfig) {
    const [providerName, apiUrl, apiKey] = [config.providerName.trim(), config.apiUrl.trim(), config.apiKey.trim()];
    if (!providerName || !apiUrl || !apiKey) {
      throw new Error("HttpGatewayOtpProvider requires non-empty providerName, apiUrl, and apiKey.");
    }
    const parsedUrl = new URL(apiUrl);
    const isLocalhost =
      parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost" || parsedUrl.hostname === "::1";
    if (parsedUrl.protocol !== "https:" && !(isLocalhost && parsedUrl.protocol === "http:")) {
      throw new Error("OTP gateway URL must use https:// (or http:// on loopback for local staging).");
    }
    this.providerName = providerName;
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.secretKey = config.secretKey?.trim() || undefined;
    this.zaloOaId = config.zaloOaId?.trim() || undefined;
    this.zaloTemplateId = config.zaloTemplateId?.trim() || undefined;
    this.smsBrandname = config.smsBrandname?.trim() || undefined;
    this.timeoutMs = config.timeoutMs ?? 8000;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  public async sendOtp(request: OtpDispatchRequest): Promise<OtpDispatchResult> {
    if (request.channel === "ZALO" && (!this.zaloOaId || !this.zaloTemplateId)) {
      throw new OtpProviderDispatchError(`Zalo ZNS dispatch requires DURIOS_OTP_ZALO_OA_ID and DURIOS_OTP_ZALO_TEMPLATE_ID on '${this.providerName}'.`);
    }
    if (request.channel === "SMS" && !this.smsBrandname) {
      throw new OtpProviderDispatchError(`SMS Brandname dispatch requires DURIOS_OTP_SMS_BRANDNAME on '${this.providerName}'.`);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json", Accept: "application/json", "X-Api-Key": this.apiKey,
      ...(this.secretKey ? { "X-Secret-Key": this.secretKey } : {}),
    };
    const payload = {
      challengeId: request.challengeId, phoneNumber: request.phoneNumber,
      channel: request.channel, otpCode: request.otpCode, expiresAt: request.expiresAt,
      zaloOaId: request.channel === "ZALO" ? this.zaloOaId : undefined,
      zaloTemplateId: request.channel === "ZALO" ? this.zaloTemplateId : undefined,
      smsBrandname: request.channel === "SMS" ? this.smsBrandname : undefined,
    };

    let response: Response;
    try {
      response = await this.fetchImpl(this.apiUrl, {
        method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new OtpProviderDispatchError(`Network or timeout error while connecting to OTP gateway '${this.providerName}'.`);
    }
    if (!response.ok) {
      throw new OtpProviderDispatchError(`OTP gateway '${this.providerName}' rejected dispatch with HTTP ${response.status}.`);
    }

    let body: Record<string, unknown> = {};
    try { body = (await response.json()) as Record<string, unknown>; } catch {
      throw new OtpProviderDispatchError(`OTP gateway '${this.providerName}' returned malformed JSON.`);
    }

    const codeResult = body["CodeResult"] !== undefined ? String(body["CodeResult"]) : undefined;
    if (body["delivered"] === false || body["success"] === false || (codeResult !== undefined && codeResult !== "100" && codeResult !== "0")) {
      throw new OtpProviderDispatchError(`OTP gateway '${this.providerName}' reported delivery failure.`);
    }

    const providerReference = String(
      body["providerReference"] ?? body["SMSID"] ?? body["messageId"] ?? body["msgId"] ?? `${this.providerName}-${request.challengeId}`
    );
    return { delivered: true, providerReference };
  }
}

export function createOtpProviderFromEnv(
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: typeof fetch | undefined
): OtpProviderAdapter {
  const providerType = env["DURIOS_OTP_PROVIDER"]?.trim().toUpperCase();
  if (!providerType || providerType === "UNCONFIGURED" || providerType === "NONE") {
    return new UnconfiguredOtpProvider();
  }
  const [apiUrl, apiKey] = [env["DURIOS_OTP_API_URL"]?.trim(), env["DURIOS_OTP_API_KEY"]?.trim()];
  if (!apiUrl || !apiKey) return new UnconfiguredOtpProvider();
  const timeoutRaw = env["DURIOS_OTP_TIMEOUT_MS"] ? Number(env["DURIOS_OTP_TIMEOUT_MS"]) : 8000;
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 8000;

  try {
    return new HttpGatewayOtpProvider({
      providerName: providerType, apiUrl, apiKey,
      secretKey: env["DURIOS_OTP_SECRET_KEY"], zaloOaId: env["DURIOS_OTP_ZALO_OA_ID"],
      zaloTemplateId: env["DURIOS_OTP_ZALO_TEMPLATE_ID"], smsBrandname: env["DURIOS_OTP_SMS_BRANDNAME"],
      timeoutMs, fetchImpl,
    });
  } catch {
    return new UnconfiguredOtpProvider();
  }
}
