import { describe, expect, it, beforeEach } from "bun:test";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import {
  assertTenantRateLimit,
  type TenantRateLimitPolicy,
} from "../src/server/tenant-rate-limiter.js";
import { AuthenticationError } from "../src/auth/auth-types.js";

describe("TenantRateLimiter", () => {
  let client: SqliteClient;

  beforeEach(() => {
    client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
  });

  it("permits requests within allowed quota", () => {
    const policy: TenantRateLimitPolicy = { maxRequests: 3, windowMs: 1000 };
    expect(() => assertTenantRateLimit(client, "tenant-1", "uploadDocument", policy)).not.toThrow();
    expect(() => assertTenantRateLimit(client, "tenant-1", "uploadDocument", policy)).not.toThrow();
    expect(() => assertTenantRateLimit(client, "tenant-1", "uploadDocument", policy)).not.toThrow();
  });

  it("throws RATE_LIMITED when tenant exceeds request limit", () => {
    const policy: TenantRateLimitPolicy = { maxRequests: 2, windowMs: 5000 };
    assertTenantRateLimit(client, "tenant-2", "uploadDocument", policy);
    assertTenantRateLimit(client, "tenant-2", "uploadDocument", policy);

    expect(() => {
      assertTenantRateLimit(client, "tenant-2", "uploadDocument", policy);
    }).toThrow(AuthenticationError);
  });

  it("isolates rate limit buckets between different tenants", () => {
    const policy: TenantRateLimitPolicy = { maxRequests: 1, windowMs: 5000 };
    assertTenantRateLimit(client, "tenant-a", "uploadDocument", policy);

    // tenant-b should still be allowed
    expect(() => {
      assertTenantRateLimit(client, "tenant-b", "uploadDocument", policy);
    }).not.toThrow();

    // tenant-a should be blocked
    expect(() => {
      assertTenantRateLimit(client, "tenant-a", "uploadDocument", policy);
    }).toThrow(AuthenticationError);
  });
});
