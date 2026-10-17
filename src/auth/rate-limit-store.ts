import type { SqliteClient } from "../storage/sqlite-client.js";
import { AuthenticationError } from "./auth-types.js";

interface RateLimitRow {
  bucket_key: string;
  attempt_count: number;
  window_started_at: string;
  blocked_until: string | null;
  updated_at: string;
}

export interface RateLimitPolicy {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly blockDurationMs: number;
}

export const PASSWORD_LOGIN_LIMIT_POLICY: RateLimitPolicy = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

export const OTP_REQUEST_LIMIT_POLICY: RateLimitPolicy = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

export const OTP_VERIFY_LIMIT_POLICY: RateLimitPolicy = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

export function assertRateLimitAllowed(
  client: SqliteClient,
  bucketKey: string,
  errorMessage: string
): void {
  const row = client.db
    .query<RateLimitRow, [string]>("SELECT * FROM auth_rate_limits WHERE bucket_key = ?")
    .get(bucketKey);
  if (!row || !row.blocked_until) return;

  if (new Date(row.blocked_until).getTime() > Date.now()) {
    throw new AuthenticationError(errorMessage, "RATE_LIMITED");
  }
}

export function recordRateLimitAttempt(
  client: SqliteClient,
  bucketKey: string,
  policy: RateLimitPolicy,
  errorMessage: string
): void {
  const now = new Date();
  const nowMs = now.getTime();
  const row = client.db
    .query<RateLimitRow, [string]>("SELECT * FROM auth_rate_limits WHERE bucket_key = ?")
    .get(bucketKey);

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new AuthenticationError(errorMessage, "RATE_LIMITED");
  }

  const windowExpired =
    !row || nowMs - new Date(row.window_started_at).getTime() >= policy.windowMs;
  const nextCount = windowExpired ? 1 : row.attempt_count + 1;
  const windowStartIso = windowExpired ? now.toISOString() : row.window_started_at;
  const blockedUntilIso =
    nextCount >= policy.maxAttempts
      ? new Date(nowMs + policy.blockDurationMs).toISOString()
      : null;

  client.db.run(
    `INSERT INTO auth_rate_limits (bucket_key, attempt_count, window_started_at, blocked_until, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(bucket_key) DO UPDATE SET
       attempt_count = excluded.attempt_count,
       window_started_at = excluded.window_started_at,
       blocked_until = excluded.blocked_until,
       updated_at = excluded.updated_at`,
    [bucketKey, nextCount, windowStartIso, blockedUntilIso, now.toISOString()]
  );

  if (nextCount > policy.maxAttempts) {
    throw new AuthenticationError(errorMessage, "RATE_LIMITED");
  }
}

export function clearRateLimitBucket(client: SqliteClient, bucketKey: string): void {
  client.db.run("DELETE FROM auth_rate_limits WHERE bucket_key = ?", [bucketKey]);
}
