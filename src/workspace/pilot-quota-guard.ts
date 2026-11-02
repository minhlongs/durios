import { selectOwnTenantDossiers } from "../auth/pilot-kpi-evaluator.js";
import type { PilotLifecycleState } from "../auth/pilot-lifecycle-types.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type { AuditLedgerLike, CreateDossierInput, DossierRepositoryLike } from "./workspace-types.js";

export interface PilotWorkspaceQuotaPolicy {
  readonly enabled: boolean;
  readonly lifecycleState: PilotLifecycleState;
  readonly maxContainers?: number | undefined;
  readonly allowedTenantId?: string | undefined;
}

export function countUsedPilotContainers(
  repo: DossierRepositoryLike,
  auditLedger: AuditLedgerLike,
  actor: AuthenticatedActor
): number {
  const activeCount = selectOwnTenantDossiers(repo.listForTenant(actor), actor.tenantId).length;
  const createdIds = new Set(
    auditLedger
      .getAllEvents()
      .filter((e) => e.eventType === "DOSSIER_CREATED" && e.tenantId === actor.tenantId && e.dossierId)
      .map((e) => e.dossierId!)
  );
  return Math.max(activeCount, createdIds.size);
}

export function assertPilotQuotaOnCreate(
  repo: DossierRepositoryLike,
  auditLedger: AuditLedgerLike,
  _input: CreateDossierInput,
  actor: AuthenticatedActor,
  policy?: PilotWorkspaceQuotaPolicy | undefined
): void {
  if (!policy || !policy.enabled) return;
  if (policy.allowedTenantId && actor.tenantId !== policy.allowedTenantId) {
    throw new Error(
      `PILOT_SCOPE_DENIED: Tenant '${actor.tenantId}' không nằm trong phạm vi được Founder cấp phép ('${policy.allowedTenantId}').`
    );
  }
  const state = policy.lifecycleState;
  if (state === "BLOCKED" || state === "READY_FOR_FOUNDER_REVIEW" || state === "PILOT_HOLD") {
    throw new Error(
      `PILOT_LIFECYCLE_${state}: Chưa được phép tạo container vận hành thật khi vòng đời đang ở trạng thái '${state}'.`
    );
  }
  if (state === "LIMITED_PILOT_AUTHORIZED") {
    const maxContainers = policy.maxContainers ?? 5;
    const used = countUsedPilotContainers(repo, auditLedger, actor);
    if (used >= maxContainers) {
      throw new Error(
        `PILOT_QUOTA_EXCEEDED: Đã đạt trần cứng ${used}/${maxContainers} container trong giai đoạn LIMITED_PILOT_AUTHORIZED. Phải hoàn tất nghiệm thu GATE-05B (PILOT_COMPLETED) trước khi nạp container thứ ${maxContainers + 1}.`
      );
    }
  }
}
