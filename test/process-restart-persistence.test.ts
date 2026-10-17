import { afterAll, describe, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  runEndToEndProcessRestartScenario,
  runShareOrganicSealedRestartScenario,
  type ProcessRestartHarnessContext,
} from "./helpers/process-restart-scenarios.js";
import { runSingleSiteStagingDressRehearsalScenario } from "./helpers/staging-dress-rehearsal-scenario.js";

describe("Section 1: True OS Process-Level Restart Persistence Integration Test", () => {
  const testDir = mkdtempSync(join(tmpdir(), "durios-restart-test-"));
  const dbPath = join(testDir, "durios.db");
  const dataDir = join(testDir, "uploads");
  const port = 31088;
  const baseUrl = `http://127.0.0.1:${port}`;

  let runningProc: ReturnType<typeof Bun.spawn> | null = null;

  async function startServerProcess(): Promise<ReturnType<typeof Bun.spawn>> {
    const proc = Bun.spawn(["bun", "run", "src/server/server.ts"], {
      env: {
        ...process.env,
        PORT: String(port),
        DURIOS_DB_PATH: dbPath,
        DURIOS_DATA_DIR: dataDir,
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const startTime = Date.now();
    let isReady = false;
    while (Date.now() - startTime < 7000) {
      try {
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.status === 200) {
          isReady = true;
          break;
        }
      } catch {
        // still starting up
      }
      await Bun.sleep(100);
    }

    if (!isReady) {
      proc.kill("SIGKILL");
      throw new Error("Server process failed to bind and respond to health check within timeout");
    }

    runningProc = proc;
    return proc;
  }

  async function terminateProcess(proc: ReturnType<typeof Bun.spawn>): Promise<void> {
    proc.kill("SIGTERM");
    await proc.exited;
  }

  const ctx: ProcessRestartHarnessContext = {
    dbPath,
    dataDir,
    baseUrl,
    startServerProcess,
    terminateProcess,
    setRunningProc: (proc) => {
      runningProc = proc;
    },
  };

  afterAll(async () => {
    if (runningProc) {
      try {
        runningProc.kill("SIGKILL");
        await runningProc.exited;
      } catch {
        // ignore
      }
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("proves end-to-end data persistence across full OS process termination and restart", async () => {
    await runEndToEndProcessRestartScenario(ctx);
  });

  it("persists share grants (active + revoked), organic evidence boundaries, and enforces 409 DOSSIER_IMMUTABLE across real OS process restart", async () => {
    await runShareOrganicSealedRestartScenario(ctx);
  });

  it("completes Single-Site On-Prem Staging Dress Rehearsal: 3 auth methods, blind fault-injection, <3m KPI dossier flow, hot backup, tamper detection, and clean restore", async () => {
    await runSingleSiteStagingDressRehearsalScenario();
  });
});
