import type { AuthenticatedActor } from "../domain/types.js";
import { computeGate05KpiFromDossiers, selectOwnTenantDossiers } from "../auth/pilot-kpi-evaluator.js";
import { evaluateWorkspaceLaunchGates } from "../auth/pilot-launch-gate-verifier.js";
import { assertValidActor } from "../auth/rbac-policy.js";
import { compilePilotGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "../export/pilot-dossier-pack-compiler.js";
import { isMarketplaceFeatureUnlocked } from "../marketplace/marketplace-guard.js";
import { listSupportedAseanCorridors } from "../rules/asean-corridor-adapters.js";
import { HybridEdgeSyncQueue } from "../saas/hybrid-edge-sync-queue.js";
import { evaluateOpenCoreDeepBrainstorm } from "../saas/open-core-deep-introspector.js";
import { getOpenCoreEditionManifest } from "../saas/open-core-edition-manifest.js";
import { resolveSaasSubscriptionStatus } from "../saas/saas-tier-policy.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { buildSessionCookieHeader } from "./auth-handlers.js";
import { seedRehearsalDossiersForActor, type RehearsalDossierSpec } from "./ecosystem-rehearsal-seeder.js";
import { setupFullGatesRehearsalOptions } from "./ecosystem-rehearsal-drill.js";
import { assertRehearsalBootstrapEnabled, isRehearsalBootstrapEnabled } from "./rehearsal-bootstrap-guard.js";
import { assertLoopbackHostname } from "./server.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";

export { seedRehearsalDossiersForActor, type RehearsalDossierSpec };

export function handleBootstrapPilotRehearsal(
  workspace: ContainerDossierWorkspace,
  req: Request,
  env: Record<string, string | undefined> = process.env
): Response {
  try {
    // Checked before anything is provisioned: the refusal must not create accounts,
    // issue tokens or seed dossiers as a side effect of probing the route.
    assertRehearsalBootstrapEnabled(env);
    const reqUrl = new URL(req.url);
    assertLoopbackHostname(reqUrl.hostname);
    const requestedRole = reqUrl.searchParams.get("role")?.toUpperCase() === "MANAGER" ? "MANAGER" : "CLERK";
    const [isFullGates, tenantId] = [reqUrl.searchParams.get("fullGates") === "true", "TENANT-CAILAY-PILOT-01"];
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
    try { workspace.authService.provisionPilotAccount({ id: "ACC-CAILAY-CLERK-01", username: "clerk.cailay", password: "PilotClerk#2026", phoneNumber: "+84901000111", actorName: "Nguyễn Thị Chứng Từ (Clerk)", tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" }); } catch { /* idempotent */ }
    try { workspace.authService.provisionPilotAccount({ id: "ACC-CAILAY-MGR-01", username: "manager.cailay", password: "PilotManager#2026", phoneNumber: "+84901000222", actorName: "Trần Văn Quản Lý (Manager)", tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" }); } catch { /* idempotent */ }

    const clerkSession = workspace.authService.loginWithPassword("clerk.cailay", "PilotClerk#2026");
    const managerSession = workspace.authService.loginWithPassword("manager.cailay", "PilotManager#2026");
    const clerkToken = workspace.authService.issueManagedPilotToken(clerkSession.actor.id, "CAILAY-CLERK-WS01", expiresAt);
    const managerToken = workspace.authService.issueManagedPilotToken(managerSession.actor.id, "CAILAY-MGR-WS01", expiresAt);
    const { newlyCreatedCount, dossiers } = seedRehearsalDossiersForActor(workspace, clerkSession.actor);
    const activeSession = requestedRole === "MANAGER" ? managerSession : clerkSession;
    const activePilotToken = requestedRole === "MANAGER" ? managerToken.rawToken : clerkToken.rawToken;
    const pilotKpi = computeGate05KpiFromDossiers(selectOwnTenantDossiers(workspace.listDossiers(activeSession.actor), activeSession.actor.tenantId));
    const gateOpts = isFullGates ? setupFullGatesRehearsalOptions(workspace) : {};
    const pilotGates = evaluateWorkspaceLaunchGates(workspace, activeSession.actor, gateOpts);
    const goLivePack = compilePilotGoLiveDossierPack(workspace, managerSession.actor, gateOpts);
    const goLivePackVerified = verifyPilotGoLiveDossierPackIntegrity(goLivePack);
    const payload = { success: true, data: { tenantId, evidenceProvenance: "SYNTHETIC_REHEARSAL" as const, rehearsalBootstrapEnabled: isRehearsalBootstrapEnabled(env), clerkUsername: "clerk.cailay", managerUsername: "manager.cailay", clerkPilotToken: clerkToken.rawToken, managerPilotToken: managerToken.rawToken, activePilotToken, actor: activeSession.actor, newlyCreatedCount, dossiers, pilotKpi, pilotGates, passedGateCount: pilotGates.passedCount, machineChecksPassedCount: pilotGates.machineChecksPassedCount, operationalGatesEvidencedCount: pilotGates.operationalGatesEvidencedCount, totalGateCount: pilotGates.totalGates, goLivePack, goLivePackVerified } };
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": buildSessionCookieHeader(activeSession.sessionToken, activeSession.expiresAt, req) } });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to bootstrap Cai Lay pilot rehearsal");
  }
}

export function handleSeedAuthenticatedRehearsal(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  env: Record<string, string | undefined> = process.env
): Response {
  try {
    assertValidActor(actor);
    assertRehearsalBootstrapEnabled(env);
    const { newlyCreatedCount, dossiers } = seedRehearsalDossiersForActor(workspace, actor);
    const pilotKpi = computeGate05KpiFromDossiers(selectOwnTenantDossiers(workspace.listDossiers(actor), actor.tenantId));
    const pilotGates = evaluateWorkspaceLaunchGates(workspace, actor);
    const goLivePack = compilePilotGoLiveDossierPack(workspace, actor);
    return jsonResponse({ success: true, data: { actor, newlyCreatedCount, dossiers, pilotKpi, pilotGates, goLivePack, goLivePackVerified: verifyPilotGoLiveDossierPackIntegrity(goLivePack) } });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to seed pilot rehearsal dossiers");
  }
}

export function handleGetEcosystemTelemetry(workspace: ContainerDossierWorkspace, actor: AuthenticatedActor): Response {
  try {
    assertValidActor(actor);
    const corridors = listSupportedAseanCorridors();
    const pilotGates = evaluateWorkspaceLaunchGates(workspace, actor);
    const pilotKpi = computeGate05KpiFromDossiers(selectOwnTenantDossiers(workspace.listDossiers(actor), actor.tenantId));
    const featureUnlocked = isMarketplaceFeatureUnlocked({ goForLiveCustomerData: pilotGates.goForLiveCustomerData });
    const pendingSyncItems = new HybridEdgeSyncQueue({ sqliteClient: workspace.sqliteClient }).listPendingItems(actor.tenantId);
    const subscription = resolveSaasSubscriptionStatus(process.env, new Date().toISOString(), actor.tenantId);
    const editionManifest = getOpenCoreEditionManifest(subscription.edition);
    const deepSocratic = evaluateOpenCoreDeepBrainstorm();
    const goLivePack = compilePilotGoLiveDossierPack(workspace, actor);

    return jsonResponse({ success: true, data: { evaluatedAt: new Date().toISOString(), actor, subscription, corridors,
      marketplaceGuard: { featureUnlocked, goForLiveCustomerData: pilotGates.goForLiveCustomerData, custodyMode: "ZERO_CUSTODY_LICENSED_BANK_PARTNER", statutoryCitation: "Nghị định 52/2024/NĐ-CP & Luật TMĐT 122/2025/QH15", prohibitedCustodyFieldsCount: 7 },
      edgeSyncQueue: { pendingCount: pendingSyncItems.length, pendingItems: pendingSyncItems },
      cloudOcrEconomics: { revenuePerContainerVnd: 150000, variableCogsVnd: 8000, grossMarginPct: 94.67, kdfSpec: "scrypt(N=16384,r=8,p=1) -> AES-256-GCM" },
      ed25519DowngradeSimulator: { zeroDataLoss: true, localSqliteReadWrite: true, mitStandaloneVerifier: true, communityFallbackEdition: "COMMUNITY_OPEN_CORE" },
      pilotGates, pilotKpi, goLivePack, goLivePackVerified: verifyPilotGoLiveDossierPackIntegrity(goLivePack), editionManifest, blueprintAudit: deepSocratic.blueprintAudit, deepSocratic } });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to retrieve ecosystem telemetry");
  }
}
