import { seedRehearsalDossiersForActor } from "../server/ecosystem-rehearsal-seeder.js";
import { createWorkspaceApp } from "../server/server.js";

export interface RehearsalSeedResult {
  readonly tenantId: string;
  readonly clerkUsername: string;
  readonly managerUsername: string;
  readonly clerkPilotToken: string;
  readonly managerPilotToken: string;
  readonly dossiers: ReadonlyArray<{
    readonly id: string;
    readonly dossierCode: string;
    readonly scenario: "CLEAN_READY" | "BLIND_FAULT_SEAL_MISMATCH" | "BLIND_FAULT_UNVERIFIED_EVIDENCE";
    readonly lifecycleState: string;
  }>;
}

export function seedGate05PilotRehearsal(options: { dbPath?: string; dataDir?: string } = {}): RehearsalSeedResult {
  const app = createWorkspaceApp(options);
  try {
    const tenantId = "TENANT-CAILAY-PILOT-01";
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

    const clerkAcc = app.authService.provisionPilotAccount({
      id: "ACC-CAILAY-CLERK-01", username: "clerk.cailay", password: "PilotClerk#2026",
      phoneNumber: "+84901000111", actorName: "Nguyễn Thị Chứng Từ (Clerk)",
      tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
    });
    const managerAcc = app.authService.provisionPilotAccount({
      id: "ACC-CAILAY-MGR-01", username: "manager.cailay", password: "PilotManager#2026",
      phoneNumber: "+84901000222", actorName: "Trần Văn Quản Lý (Manager)",
      tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER",
    });

    const clerkToken = app.authService.issueManagedPilotToken(clerkAcc.id, "CAILAY-CLERK-WS01", expiresAt);
    const managerToken = app.authService.issueManagedPilotToken(managerAcc.id, "CAILAY-MGR-WS01", expiresAt);
    const clerkActor = app.authService.authenticateToken(clerkToken.rawToken);
    const { dossiers } = seedRehearsalDossiersForActor(app.workspace, clerkActor);

    return {
      tenantId, clerkUsername: clerkAcc.username, managerUsername: managerAcc.username,
      clerkPilotToken: clerkToken.rawToken, managerPilotToken: managerToken.rawToken,
      dossiers: dossiers.map((d) => ({
        id: d.id, dossierCode: d.dossierCode, scenario: d.scenario, lifecycleState: d.lifecycleState,
      })),
    };
  } finally {
    app.sqliteClient.close();
  }
}

if (import.meta.main) {
  process.stdout.write(`${JSON.stringify(seedGate05PilotRehearsal(), null, 2)}\n`);
}
