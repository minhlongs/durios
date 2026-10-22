import type { ContainerDossier } from "../domain/types.js";
import type { AuditLedgerLike } from "../workspace/workspace-types.js";
import type { ShareAccessManager } from "../sharing/share-access-manager.js";
import { FinancialAttestationService } from "../saas/financial-attestation-service.js";

export interface WorkspaceLike {
  getRawDossier(dossierId: string): ContainerDossier | undefined;
  readonly shareManager: ShareAccessManager;
  readonly auditLedger: AuditLedgerLike;
}

let cachedService: FinancialAttestationService | undefined;

/** Lazily builds the process-wide attestation service so the single-use burn map is shared. */
export function resolveAttestationService(): FinancialAttestationService {
  cachedService ??= new FinancialAttestationService(
    process.env.DURIOS_FINANCIAL_ATTESTATION_SECRET ?? ""
  );
  return cachedService;
}

export function resetAttestationServiceForTests(): void {
  cachedService = undefined;
}
