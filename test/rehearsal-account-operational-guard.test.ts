import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AuthenticationError } from "../src/auth/auth-types.js";
import { FakeOtpProvider } from "../src/auth/otp-provider.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";
import { assertRehearsalAccountAllowedInCurrentMode, isPublicRehearsalAccount } from "../src/auth/rehearsal-account-guard.js";
import { SYNTHETIC_EXTRACTION_ENV_FLAG } from "../src/extraction/synthetic-extraction-mode.js";
import { REHEARSAL_BOOTSTRAP_ENV_FLAG } from "../src/server/rehearsal-bootstrap-guard.js";
import { createWorkspaceApp } from "../src/server/server.js";

describe("Operational guard for public rehearsal accounts (clerk.cailay / manager.cailay)", () => {
  const dirs: string[] = [];
  const tempDir = (): string => { const d = mkdtempSync(join(tmpdir(), "rehearsal-acc-guard-")); dirs.push(d); return d; };
  let [savedSynthetic, savedBootstrap]: [string | undefined, string | undefined] = [undefined, undefined];
  const clearFlags = (): void => { delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; delete process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG]; };

  beforeEach(() => { savedSynthetic = process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; savedBootstrap = process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG]; });
  afterEach(() => {
    if (savedSynthetic === undefined) delete process.env[SYNTHETIC_EXTRACTION_ENV_FLAG]; else process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = savedSynthetic;
    if (savedBootstrap === undefined) delete process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG]; else process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG] = savedBootstrap;
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it("identifies public rehearsal accounts by id, username (case-insensitive), or phone number", () => {
    expect(isPublicRehearsalAccount({ username: "clerk.cailay" })).toBe(true);
    expect(isPublicRehearsalAccount({ username: "  MANAGER.CAILAY " })).toBe(true);
    expect(isPublicRehearsalAccount({ id: "ACC-CAILAY-CLERK-01" })).toBe(true);
    expect(isPublicRehearsalAccount({ phoneNumber: "+84901000222" })).toBe(true);
    expect(isPublicRehearsalAccount({ username: "clerk_cailay01", id: "ACT-OPS-01", phoneNumber: "+84909999999" })).toBe(false);
  });

  it("refuses provisioning a public rehearsal account when neither synthetic nor bootstrap mode is active", () => {
    clearFlags();
    const root = tempDir();
    const app = createWorkspaceApp({ dbPath: join(root, "ops.db"), dataDir: join(root, "uploads") });
    try {
      expect(() => app.authService.provisionPilotAccount({ username: "clerk.cailay", password: "PilotClerk#2026", actorName: "Clerk", tenantId: "TENANT-OPS", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" })).toThrow(AuthenticationError);
    } finally { app.sqliteClient.close(); }
  });

  it("refuses password login for clerk.cailay and manager.cailay when synthetic rehearsal mode is turned off", async () => {
    const root = tempDir();
    const [dbPath, dataDir] = [join(root, "rehearsal.db"), join(root, "uploads")];
    seedGate05PilotRehearsal({ dbPath, dataDir });
    clearFlags();
    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      expect(() => app.authService.loginWithPassword("clerk.cailay", "PilotClerk#2026")).toThrow(/disabled outside declared synthetic rehearsal mode/);
      const res = await app.handler(new Request("http://127.0.0.1/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "manager.cailay", password: "PilotManager#2026" }) }));
      expect(res.status).toBe(401);
      expect(((await res.json()) as { errorCode?: string }).errorCode).toBe("ACCOUNT_DISABLED");
    } finally { app.sqliteClient.close(); }
  });

  it("refuses token authentication and token issuance for seeded rehearsal accounts outside rehearsal mode", async () => {
    const root = tempDir();
    const [dbPath, dataDir] = [join(root, "rehearsal.db"), join(root, "uploads")];
    const seeded = seedGate05PilotRehearsal({ dbPath, dataDir });
    clearFlags();
    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      expect(() => app.authService.authenticateToken(seeded.managerPilotToken)).toThrow(AuthenticationError);
      expect(() => app.authService.issueManagedPilotToken("ACC-CAILAY-MGR-01", "WS-02", new Date(Date.now() + 86400000).toISOString())).toThrow(AuthenticationError);
      const meRes = await app.handler(new Request("http://127.0.0.1/api/auth/me", { headers: { "x-pilot-token": seeded.clerkPilotToken } }));
      expect(meRes.status).toBe(401);
    } finally { app.sqliteClient.close(); }
  });

  it("refuses OTP challenge requests for public rehearsal phone numbers when synthetic mode is off", async () => {
    const root = tempDir();
    const [dbPath, dataDir] = [join(root, "rehearsal.db"), join(root, "uploads")];
    seedGate05PilotRehearsal({ dbPath, dataDir });
    clearFlags();
    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      app.authService.setOtpProvider(new FakeOtpProvider());
      await expect(app.authService.requestOtpChallenge("+84901000111", "ZALO")).rejects.toThrow(AuthenticationError);
    } finally { app.sqliteClient.close(); }
  });

  it("allows rehearsal accounts when DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION or DURIOS_ALLOW_PILOT_REHEARSAL_BOOTSTRAP is true", () => {
    expect(() => assertRehearsalAccountAllowedInCurrentMode({ username: "clerk.cailay" }, { [SYNTHETIC_EXTRACTION_ENV_FLAG]: "true" })).not.toThrow();
    expect(() => assertRehearsalAccountAllowedInCurrentMode({ username: "manager.cailay" }, { [REHEARSAL_BOOTSTRAP_ENV_FLAG]: "true" })).not.toThrow();
    expect(() => assertRehearsalAccountAllowedInCurrentMode({ username: "clerk.cailay" }, {})).toThrow(AuthenticationError);
  });

  it("keeps non-rehearsal operational accounts working normally when synthetic mode is off", () => {
    clearFlags();
    const root = tempDir();
    const app = createWorkspaceApp({ dbPath: join(root, "ops.db"), dataDir: join(root, "uploads") });
    try {
      const acc = app.authService.provisionPilotAccount({ username: "clerk_cailay_ops", password: "OpsPassword#2026!", actorName: "Clerk Ops", tenantId: "TENANT-CAILAY-OPS", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
      const sess = app.authService.loginWithPassword(acc.username, "OpsPassword#2026!");
      expect(app.authService.authenticateToken(sess.sessionToken).id).toBe(acc.id);
    } finally { app.sqliteClient.close(); }
  });
});
