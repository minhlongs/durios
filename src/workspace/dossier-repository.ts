import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";

export class DossierRepository {
  private readonly dossiers: Map<string, ContainerDossier> = new Map();

  public save(dossier: ContainerDossier): void {
    this.dossiers.set(dossier.id, dossier);
  }

  public findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined {
    const dossier = this.dossiers.get(dossierId);
    if (!dossier) return undefined;
    if (dossier.tenantId !== actor.tenantId) {
      return undefined; // Single-tenant isolation
    }
    return dossier;
  }

  public getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const dossier = this.findById(dossierId, actor);
    if (!dossier) {
      throw new Error(`Dossier '${dossierId}' not found for tenant '${actor.tenantId}'.`);
    }
    return dossier;
  }

  public listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[] {
    return Array.from(this.dossiers.values()).filter((d) => d.tenantId === actor.tenantId);
  }
}
