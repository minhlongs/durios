import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import { AccessControlError } from "../auth/rbac-policy.js";

export type AccessCheckerFn = (
  dossierId: string,
  ownerTenantId: string,
  actorTenantId: string
) => boolean;

export class DossierRepository {
  private readonly dossiers: Map<string, ContainerDossier> = new Map();
  private accessChecker?: AccessCheckerFn | undefined;

  public setAccessChecker(checker: AccessCheckerFn): void {
    this.accessChecker = checker;
  }

  public save(dossier: ContainerDossier): void {
    this.dossiers.set(dossier.id, dossier);
  }

  public findRaw(dossierId: string): ContainerDossier | undefined {
    return this.dossiers.get(dossierId);
  }

  public hasDocumentReferencingBlob(storagePath: string, sha256Hash: string): boolean {
    for (const dossier of this.dossiers.values()) {
      for (const doc of dossier.documents) {
        if (doc.storagePath === storagePath || doc.sha256Hash === sha256Hash) {
          return true;
        }
      }
    }
    return false;
  }

  public findById(
    dossierId: string,
    actor: AuthenticatedActor
  ): ContainerDossier | undefined {
    const dossier = this.dossiers.get(dossierId);
    if (!dossier) return undefined;
    if (dossier.tenantId === actor.tenantId) {
      return dossier;
    }
    if (this.accessChecker?.(dossierId, dossier.tenantId, actor.tenantId)) {
      return dossier;
    }
    return undefined;
  }

  public getOrThrow(
    dossierId: string,
    actor: AuthenticatedActor
  ): ContainerDossier {
    const dossier = this.findById(dossierId, actor);
    if (dossier) {
      return dossier;
    }
    const raw = this.findRaw(dossierId);
    if (raw) {
      throw new AccessControlError(
        `Cross-tenant access prohibited for dossier '${dossierId}'.`,
        "CROSS_TENANT_FORBIDDEN"
      );
    }
    throw new Error(
      `Dossier '${dossierId}' not found for tenant '${actor.tenantId}'.`
    );
  }

  public listForTenant(
    actor: AuthenticatedActor
  ): readonly ContainerDossier[] {
    return Array.from(this.dossiers.values()).filter(
      (d) =>
        d.tenantId === actor.tenantId ||
        Boolean(this.accessChecker?.(d.id, d.tenantId, actor.tenantId))
    );
  }
}
