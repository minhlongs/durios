import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ShareAccessManager } from "./share-access-manager.js";
import { cloneValue, keysToRedactForGrantee, redactObjectDeep } from "./redaction-policy.js";

export { selectiveDisclosure } from "./redaction-policy.js";

export function redactDossierForActor(
  dossier: ContainerDossier,
  actor: AuthenticatedActor,
  shareManager: ShareAccessManager
): ContainerDossier {
  if (dossier.tenantId === actor.tenantId) return cloneValue(dossier);

  const activeGrants = shareManager.getActiveGrantsForTenant(
    dossier.id, dossier.tenantId, actor.tenantId
  );
  const { keys } = keysToRedactForGrantee(activeGrants);
  return redactObjectDeep(dossier, keys) as ContainerDossier;
}

export function redactDossierListForActor(
  dossiers: readonly ContainerDossier[],
  actor: AuthenticatedActor,
  shareManager: ShareAccessManager
): readonly ContainerDossier[] {
  return dossiers.map((dossier) => redactDossierForActor(dossier, actor, shareManager));
}
