import type { AuthenticatedActor } from "../domain/types.js";
import { AccessControlError, assertValidActor, isReadOnlyRole } from "./rbac-policy.js";

/**
 * Signs a named actor past a food-safety blocker.
 *
 * Deliberately narrower than the export approval gate, which admits `ADMIN` too:
 * signing past a blocker is the one decision the pilot requires to be a single
 * accountable person, so this admits `MANAGER` alone.
 */
export function assertCanOverrideBlocker(actor: AuthenticatedActor, dossierTenantId: string): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' (${actor.persona}) is read-only and prohibited from overriding a blocker.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantId !== dossierTenantId) {
    throw new AccessControlError(
      `Cross-tenant blocker override is prohibited: actor belongs to '${actor.tenantId}', dossier belongs to '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
  if (actor.tenantType !== "PACKHOUSE_EXPORTER") {
    throw new AccessControlError(
      `Tenant type '${actor.tenantType}' (${actor.persona}) is not permitted to override a packhouse blocker.`,
      "INVALID_TENANT_TYPE"
    );
  }
  if (actor.persona !== "PACKHOUSE_MANAGER") {
    throw new AccessControlError(`Persona '${actor.persona}' is unauthorized to override a blocker; PACKHOUSE_MANAGER required.`, "INSUFFICIENT_ROLE");
  }
  if (actor.role !== "MANAGER") {
    throw new AccessControlError(`${actor.role} role is unauthorized to override a blocker; a single named quality manager must sign.`, "INSUFFICIENT_ROLE");
  }
}
