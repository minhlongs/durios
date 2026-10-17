import type { SqliteClient } from "../storage/sqlite-client.js";
import { AuthenticationError } from "../auth/auth-types.js";

export interface TenantRateLimitPolicy {
  readonly maxRequests: number;
  readonly windowMs: number;
}

export const UPLOAD_RATE_LIMIT_POLICY: TenantRateLimitPolicy = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

interface RateLimitRow {
  bucket_key: string;
  attempt_count: number;
  window_started_at: string;
  blocked_until: string | null;
  updated_at: string;
}

export function assertTenantRateLimit(
  client: SqliteClient,
  tenantId: string,
  action: string,
  policy: TenantRateLimitPolicy = UPLOAD_RATE_LIMIT_POLICY
): void {
  const bucketKey = `tenant_rate:${tenantId}:${action}`;
  const now = new Date();
  const nowMs = now.getTime();

  const row = client.db
    .query<RateLimitRow, [string]>("SELECT * FROM auth_rate_limits WHERE bucket_key = ?")
    .get(bucketKey);

  const windowExpired = !row || nowMs - new Date(row.window_started_at).getTime() >= policy.windowMs;
  const nextCount = windowExpired ? 1 : (row.attempt_count + 1);
  const windowStartIso = windowExpired ? now.toISOString() : row.window_started_at;

  client.db.run(
    `INSERT INTO auth_rate_limits (bucket_key, attempt_count, window_started_at, blocked_until, updated_at)
     VALUES (?, ?, ?, NULL, ?)
     ON CONFLICT(bucket_key) DO UPDATE SET
       attempt_count = excluded.attempt_count,
       window_started_at = excluded.window_started_at,
       updated_at = excluded.updated_at`,
    [bucketKey, nextCount, windowStartIso, now.toISOString()]
  );

  if (nextCount > policy.maxRequests) {
    throw new AuthenticationError(
      `Tenant '${tenantId}' exceeded request rate limit (${policy.maxRequests} req/min) for action '${action}'.`,
      "RATE_LIMITED"
    );
  }
}
