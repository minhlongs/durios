import type {
  AuthenticatedActor,
  ProductPersona,
  TenantType,
  UserRole,
} from "../domain/types.js";
import type { OtpChannel } from "./otp-provider.js";

export type AuthMethod = "PASSWORD_SESSION" | "OTP_SESSION" | "MANAGED_PILOT_TOKEN";

export interface ProvisionPilotAccountInput {
  readonly id?: string | undefined;
  readonly username: string;
  readonly password: string;
  readonly phoneNumber?: string | undefined;
  readonly actorName: string;
  readonly tenantId: string;
  readonly tenantType: TenantType;
  readonly role: UserRole;
  readonly persona: ProductPersona;
}

export interface PilotAccountRecord {
  readonly id: string;
  readonly username: string;
  readonly phoneNumber?: string | undefined;
  readonly actorName: string;
  readonly tenantId: string;
  readonly tenantType: TenantType;
  readonly role: UserRole;
  readonly persona: ProductPersona;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IssuedAuthSession {
  readonly sessionId: string;
  readonly sessionToken: string;
  readonly authMethod: "PASSWORD_SESSION" | "OTP_SESSION";
  readonly expiresAt: string;
  readonly actor: AuthenticatedActor;
}

export interface IssuedManagedPilotToken {
  readonly tokenId: string;
  readonly rawToken: string;
  readonly accountId: string;
  readonly deviceLabel: string;
  readonly expiresAt: string;
  readonly actor: AuthenticatedActor;
}

export interface IssuedOtpChallenge {
  readonly challengeId: string;
  readonly phoneNumber: string;
  readonly channel: OtpChannel;
  readonly expiresAt: string;
  readonly providerReference: string;
}

export type AuthErrorCode =
  | "MISSING_CREDENTIALS"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_CONSUMED"
  | "OTP_MAX_ATTEMPTS"
  | "RATE_LIMITED"
  | "ACCOUNT_DISABLED";

export class AuthenticationError extends Error {
  public readonly status: 401 | 429;

  constructor(
    message: string,
    public readonly code: AuthErrorCode = "INVALID_CREDENTIALS"
  ) {
    super(message);
    this.name = "AuthenticationError";
    this.status = code === "RATE_LIMITED" || code === "OTP_MAX_ATTEMPTS" ? 429 : 401;
  }
}
