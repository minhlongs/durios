import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getCliArgValue, parsePilotCliDbOptions } from "../src/auth/cli-db-args.js";
import { runPilotOpsCliArgs } from "../src/auth/pilot-ops-cli.js";
import { seedGate05PilotRehearsal } from "../src/auth/pilot-rehearsal-seeder.js";

describe("Pilot CLI database path flag parity and ./data/durios.db isolation", () => {
  const dirs: string[] = [];
  const tempDir = (): string => { const d = mkdtempSync(join(tmpdir(), "cli-db-iso-")); dirs.push(d); return d; };
  afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

  it("parses both --db and --db-path (space-separated and = syntax) across CLI helpers", () => {
    expect(getCliArgValue(["--db", "/tmp/a.db"], "--db", "--db-path")).toBe("/tmp/a.db");
    expect(getCliArgValue(["--db-path=/tmp/b.db"], "--db", "--db-path")).toBe("/tmp/b.db");
    const parsed = parsePilotCliDbOptions(["--db-path", "/tmp/c.db", "--data-dir", "/tmp/up", "--tenant-id", "T-01"], {});
    expect(parsed).toEqual({ dbPath: "/tmp/c.db", dataDir: "/tmp/up", tenantId: "T-01" });
  });

  it("falls back to DURIOS_DB_PATH and DURIOS_DATA_DIR environment variables when CLI flags are absent", () => {
    const parsed = parsePilotCliDbOptions([], { DURIOS_DB_PATH: "/tmp/env.db", DURIOS_DATA_DIR: "/tmp/env-up" });
    expect(parsed).toEqual({ dbPath: "/tmp/env.db", dataDir: "/tmp/env-up" });
  });

  it("runs backup-site, verify-backup, and restore-site via runPilotOpsCliArgs without an AuthService or touching ./data/durios.db", () => {
    const root = tempDir();
    const [srcDb, srcUp, backupDir, restoredDb, restoredUp] = [join(root, "src.db"), join(root, "src-uploads"), join(root, "backup"), join(root, "restored.db"), join(root, "restored-uploads")];
    seedGate05PilotRehearsal({ dbPath: srcDb, dataDir: srcUp });
    const manifest = runPilotOpsCliArgs(["backup-site", "--db-path", srcDb, "--data-dir", srcUp, "--backup-dir", backupDir], undefined, {});
    expect("databaseSha256" in manifest && manifest.auditChainValid).toBe(true);
    const verified = runPilotOpsCliArgs(["verify-backup", "--backup-dir", backupDir], undefined, {});
    expect("valid" in verified && verified.valid).toBe(true);
    const restored = runPilotOpsCliArgs(["restore-site", "--backup-dir", backupDir, "--target-db", restoredDb, "--target-data-dir", restoredUp], undefined, {});
    expect("valid" in restored && restored.valid).toBe(true);
    expect(existsSync(restoredDb)).toBe(true);
    expect(existsSync("./data/durios.db")).toBe(false);
  });

  it("runs verify-backup in a child bun process without DURIOS_DB_PATH and leaves ./data/durios.db untouched", () => {
    const root = tempDir();
    const [srcDb, srcUp, backupDir] = [join(root, "src.db"), join(root, "src-uploads"), join(root, "backup")];
    seedGate05PilotRehearsal({ dbPath: srcDb, dataDir: srcUp });
    runPilotOpsCliArgs(["backup-site", "--db", srcDb, "--data-dir", srcUp, "--backup-dir", backupDir], undefined, {});
    const env = { ...process.env };
    delete env.DURIOS_DB_PATH;
    delete env.DURIOS_DATA_DIR;
    const proc = Bun.spawnSync(["bun", "run", "src/auth/pilot-ops-cli.ts", "verify-backup", "--backup-dir", backupDir], { cwd: process.cwd(), env });
    expect(proc.exitCode).toBe(0);
    const out = JSON.parse(new TextDecoder().decode(proc.stdout)) as { success: boolean; result: { valid: boolean } };
    expect(out.result.valid).toBe(true);
    expect(existsSync(join(process.cwd(), "data/durios.db"))).toBe(false);
  });

  it("refuses account/token CLI subcommands when neither --db/--db-path nor DURIOS_DB_PATH is provided", () => {
    const env = { ...process.env };
    delete env.DURIOS_DB_PATH;
    const proc = Bun.spawnSync(["bun", "run", "src/auth/pilot-ops-cli.ts", "revoke-token", "--token-id", "MPT-1"], { cwd: process.cwd(), env });
    expect(proc.exitCode).not.toBe(0);
    expect(new TextDecoder().decode(proc.stderr)).toContain("Missing required database path");
    expect(existsSync(join(process.cwd(), "data/durios.db"))).toBe(false);
  });

  it("accepts --db-path on pilot-kpi-evaluator and pilot-launch-gate-verifier CLI entrypoints", () => {
    const root = tempDir();
    const [dbPath, dataDir] = [join(root, "rehearsal.db"), join(root, "uploads")];
    seedGate05PilotRehearsal({ dbPath, dataDir });
    const env = { ...process.env };
    delete env.DURIOS_DB_PATH;
    delete env.DURIOS_DATA_DIR;
    const kpiProc = Bun.spawnSync(["bun", "run", "src/auth/pilot-kpi-evaluator.ts", "--db-path", dbPath, "--data-dir", dataDir], { cwd: process.cwd(), env });
    expect(kpiProc.exitCode).toBe(0);
    const kpiJson = JSON.parse(new TextDecoder().decode(kpiProc.stdout)) as { totalContainers: number; gate05Passed: boolean };
    expect(kpiJson.totalContainers).toBe(5);
    expect(kpiJson.gate05Passed).toBe(true);
    const gateProc = Bun.spawnSync(["bun", "run", "src/auth/pilot-launch-gate-verifier.ts", "--db-path", dbPath, "--data-dir", dataDir], { cwd: process.cwd(), env });
    expect(gateProc.exitCode).toBe(1);
    const gateJson = JSON.parse(new TextDecoder().decode(gateProc.stdout)) as { evidenceProvenance: string; goForLiveCustomerData: boolean };
    expect(gateJson.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(gateJson.goForLiveCustomerData).toBe(false);
    expect(existsSync(join(process.cwd(), "data/durios.db"))).toBe(false);
  });

  it("accepts --db-path on pilot-rehearsal-seeder and field-auditor-cli without creating ./data/durios.db", () => {
    const root = tempDir();
    const [dbPath, dataDir] = [join(root, "seeded.db"), join(root, "seeded-uploads")];
    const env = { ...process.env };
    delete env.DURIOS_DB_PATH;
    delete env.DURIOS_DATA_DIR;
    const seedProc = Bun.spawnSync(["bun", "run", "src/auth/pilot-rehearsal-seeder.ts", "--db-path", dbPath, "--data-dir", dataDir], { cwd: process.cwd(), env });
    expect(seedProc.exitCode).toBe(0);
    const auditProc = Bun.spawnSync(["bun", "run", "src/export/field-auditor-cli.ts", "--db-path", dbPath, "--data-dir", dataDir], { cwd: process.cwd(), env });
    expect(auditProc.exitCode).toBe(0);
    expect(existsSync(join(process.cwd(), "data/durios.db"))).toBe(false);
  });
});
