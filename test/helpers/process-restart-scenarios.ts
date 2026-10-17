import { expect } from "bun:test";
import {
  runEndToEndProcessRestartScenario,
  type ProcessRestartHarnessContext,
} from "./process-restart-e2e-step.js";
import {
  seedSealedRestartActors,
  setupSealedDossierBeforeRestart,
} from "./process-restart-sealed-setup-step.js";
import { verifySealedDossierAfterRestart } from "./process-restart-sealed-verify-step.js";

export { runEndToEndProcessRestartScenario, type ProcessRestartHarnessContext };

export async function runShareOrganicSealedRestartScenario(
  ctx: ProcessRestartHarnessContext
): Promise<void> {
  const { dbPath, baseUrl, startServerProcess, terminateProcess, setRunningProc } = ctx;
  let runningProc: ReturnType<typeof Bun.spawn> | null = null;
  try {
    const actorHeaders = seedSealedRestartActors(dbPath);

    runningProc = await startServerProcess();
    const pidA = runningProc.pid;

    const setupState = await setupSealedDossierBeforeRestart(baseUrl, actorHeaders);

    await terminateProcess(runningProc);
    runningProc = null;

    runningProc = await startServerProcess();
    const pidB = runningProc.pid;
    expect(pidB).not.toBe(pidA);

    await verifySealedDossierAfterRestart(baseUrl, dbPath, setupState);

    await terminateProcess(runningProc);
    runningProc = null;
  } finally {
    setRunningProc(runningProc);
  }
}
