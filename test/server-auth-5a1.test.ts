import { afterEach, describe, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import type { createWorkspaceApp } from "../src/server/server.js";
import { runCookieOtpAndMptUnificationScenario } from "./helpers/server-auth-5a1-auth-flows.js";
import { runCliSecurityAndSpoofedHeadersScenario } from "./helpers/server-auth-5a1-cli-and-spoof.js";
import { runOtpEnumerationAndRateLimitsScenario } from "./helpers/server-auth-5a1-rate-limits.js";
import {
  runHttpGatewayOtpProviderScenario,
  runLegacyV2ToV3UpgradeScenario,
  runOtpVerifyRateLimitPersistenceScenario,
} from "./helpers/server-auth-5a1-scenarios.js";

const TEST_DB = "./data/test-auth-5a1.db";
const TEST_UPLOADS = "./data/test-auth-5a1-uploads";

describe("Prompt 5A-1 & 5A-1.1: Server-Side Authentication & Hardening (HTTP + SQLite)", () => {
  let app: ReturnType<typeof createWorkspaceApp> | null = null;
  const originalNodeEnv = process.env.NODE_ENV;

  function restoreNodeEnv() {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }

  afterEach(() => {
    restoreNodeEnv();
    app?.sqliteClient.close();
    app = null;
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${TEST_DB}${suffix}`)) rmSync(`${TEST_DB}${suffix}`, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) rmSync(TEST_UPLOADS, { recursive: true, force: true });
  });

  it("authenticates via HttpOnly Cookie (no sessionToken in JSON), sets Secure in production, and unifies all 3 methods into identical AuthenticatedActor", async () => {
    await runCookieOtpAndMptUnificationScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    }, restoreNodeEnv);
  });

  it("prevents OTP phone enumeration, enforces SQLite-persisted OTP/password rate limits ignoring spoofed IP headers, and rejects unconfigured OTP (503)", async () => {
    await runOtpEnumerationAndRateLimitsScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });

  it("enforces CLI security rules (no --password in argv, no implicit defaults, revoke-session CLI) and ignores spoofed headers", async () => {
    await runCliSecurityAndSpoofedHeadersScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });

  it("upgrades a pre-5A-1.1 legacy V2 database (NOT NULL account_id, missing auth_rate_limits) to V3 while preserving data and persisting OTP rate limits across restart", async () => {
    await runLegacyV2ToV3UpgradeScenario();
  });

  it("enforces OTP verification failure rate limit (otp_verify:<phone>), persists lock across SQLite restart, and expires cleanly after lock window", async () => {
    await runOtpVerifyRateLimitPersistenceScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });

  it("validates HttpGatewayOtpProvider & createOtpProviderFromEnv for ZALO ZNS and SMS with strict credential/timeout/gateway-failure checks", async () => {
    await runHttpGatewayOtpProviderScenario(TEST_DB, TEST_UPLOADS, (nextApp) => {
      app = nextApp;
    });
  });
});
