import type { SqliteClient } from "../storage/sqlite-client.js";
import {
  generateNumericOtpCode, generateSaltHex, hashSecretWithSalt, verifySecretWithSalt,
} from "./crypto-helpers.js";
import type { OtpChannel, OtpProviderAdapter } from "./otp-provider.js";
import { AuthenticationError, type IssuedOtpChallenge } from "./auth-types.js";
import {
  assertRateLimitAllowed, clearRateLimitBucket,
  OTP_REQUEST_LIMIT_POLICY, OTP_VERIFY_LIMIT_POLICY, recordRateLimitAttempt,
} from "./rate-limit-store.js";

export async function createOtpChallengeRecord(
  client: SqliteClient,
  otpProvider: OtpProviderAdapter,
  accountId: string | null,
  phoneNumber: string,
  channel: OtpChannel,
  ttlMs: number
): Promise<IssuedOtpChallenge> {
  const reqBucket = `otp_req:${phoneNumber}`;
  recordRateLimitAttempt(
    client, reqBucket, OTP_REQUEST_LIMIT_POLICY,
    "Too many OTP requests for this phone number. Please wait before retrying."
  );

  const challengeId = `OTP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const otpCode = generateNumericOtpCode();
  const salt = generateSaltHex();
  const codeHash = hashSecretWithSalt(otpCode, salt);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  if (accountId !== null) {
    await otpProvider.sendOtp({ challengeId, phoneNumber, otpCode, channel, expiresAt });
  }

  client.db.run(
    `INSERT INTO otp_challenges (
      id, account_id, phone_number, channel, code_hash, code_salt,
      expires_at, consumed_at, attempts, max_attempts, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 5, ?)`,
    [challengeId, accountId, phoneNumber, channel, codeHash, salt, expiresAt, now.toISOString()]
  );

  return { challengeId, phoneNumber, channel, expiresAt, providerReference: "OTP-DISPATCH-ACCEPTED" };
}

export function consumeVerifiedOtpChallenge(
  client: SqliteClient,
  challengeId: string,
  otpCode: string
): string {
  const ch = client.db
    .query<
      {
        id: string; account_id: string | null; phone_number: string;
        code_hash: string; code_salt: string; expires_at: string;
        consumed_at: string | null; attempts: number; max_attempts: number;
      },
      [string]
    >("SELECT * FROM otp_challenges WHERE id = ?")
    .get(challengeId.trim());

  if (!ch) throw new AuthenticationError("Invalid or expired OTP verification code.", "OTP_INVALID");

  const verifyBucket = `otp_verify:${ch.phone_number}`;
  assertRateLimitAllowed(
    client, verifyBucket, "Too many failed OTP verification attempts. Please wait before retrying."
  );

  if (ch.consumed_at) throw new AuthenticationError("OTP challenge has already been consumed.", "OTP_CONSUMED");
  if (ch.attempts >= ch.max_attempts) {
    throw new AuthenticationError("OTP maximum verification attempts exceeded.", "OTP_MAX_ATTEMPTS");
  }
  if (new Date(ch.expires_at).getTime() <= Date.now()) {
    throw new AuthenticationError("OTP challenge has expired.", "OTP_EXPIRED");
  }

  const codeMatches = verifySecretWithSalt(otpCode.trim(), ch.code_salt, ch.code_hash);
  if (!codeMatches || ch.account_id === null) {
    client.db.run("UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?", [ch.id]);
    recordRateLimitAttempt(
      client, verifyBucket, OTP_VERIFY_LIMIT_POLICY,
      "Too many failed OTP verification attempts. Please wait before retrying."
    );
    if (ch.attempts + 1 >= ch.max_attempts) {
      throw new AuthenticationError("OTP maximum verification attempts exceeded.", "OTP_MAX_ATTEMPTS");
    }
    throw new AuthenticationError("Invalid or expired OTP verification code.", "OTP_INVALID");
  }

  clearRateLimitBucket(client, verifyBucket);
  client.db.run("UPDATE otp_challenges SET consumed_at = ? WHERE id = ?", [new Date().toISOString(), ch.id]);
  return ch.account_id;
}
