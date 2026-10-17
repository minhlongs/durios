export type OtpChannel = "ZALO" | "SMS";

export interface OtpDispatchRequest {
  readonly challengeId: string;
  readonly phoneNumber: string;
  readonly otpCode: string;
  readonly channel: OtpChannel;
  readonly expiresAt: string;
}

export interface OtpDispatchResult {
  readonly delivered: boolean;
  readonly providerReference: string;
}

export interface OtpProviderAdapter {
  readonly providerName: string;
  readonly isConfigured: boolean;
  sendOtp(request: OtpDispatchRequest): Promise<OtpDispatchResult> | OtpDispatchResult;
}

export class OtpProviderNotConfiguredError extends Error {
  public readonly code = "OTP_PROVIDER_NOT_CONFIGURED";

  constructor(
    message = "OTP provider (Zalo/SMS) is not configured. Refusing to simulate OTP delivery in unconfigured mode."
  ) {
    super(message);
    this.name = "OtpProviderNotConfiguredError";
  }
}

export class UnconfiguredOtpProvider implements OtpProviderAdapter {
  public readonly providerName = "UNCONFIGURED_OTP_PROVIDER";
  public readonly isConfigured = false;

  public sendOtp(_request: OtpDispatchRequest): never {
    throw new OtpProviderNotConfiguredError();
  }
}

export interface RecordedFakeOtpMessage {
  readonly challengeId: string;
  readonly phoneNumber: string;
  readonly otpCode: string;
  readonly channel: OtpChannel;
  readonly expiresAt: string;
  readonly sentAt: string;
}

export class FakeOtpProvider implements OtpProviderAdapter {
  public readonly providerName = "FAKE_TEST_OTP_PROVIDER";
  public readonly isConfigured = true;
  private readonly outbox: RecordedFakeOtpMessage[] = [];

  public sendOtp(request: OtpDispatchRequest): OtpDispatchResult {
    const record: RecordedFakeOtpMessage = {
      challengeId: request.challengeId,
      phoneNumber: request.phoneNumber,
      otpCode: request.otpCode,
      channel: request.channel,
      expiresAt: request.expiresAt,
      sentAt: new Date().toISOString(),
    };
    this.outbox.push(record);
    return {
      delivered: true,
      providerReference: `FAKE-OTP-${request.challengeId}`,
    };
  }

  public getOutbox(): readonly RecordedFakeOtpMessage[] {
    return [...this.outbox];
  }

  public getLatestForPhone(phoneNumber: string): RecordedFakeOtpMessage | undefined {
    for (let i = this.outbox.length - 1; i >= 0; i--) {
      if (this.outbox[i]?.phoneNumber === phoneNumber) {
        return this.outbox[i];
      }
    }
    return undefined;
  }

  public clear(): void {
    this.outbox.length = 0;
  }
}

export {
  createOtpProviderFromEnv,
  HttpGatewayOtpProvider,
  type HttpGatewayOtpProviderConfig,
  OtpProviderDispatchError,
} from "./http-gateway-otp-provider.js";
