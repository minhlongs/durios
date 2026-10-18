import type { AuthenticatedActor } from "../domain/types.js";
import { AccessControlError, assertValidActor, isReadOnlyRole } from "./rbac-policy.js";

export function assertCanUploadDocument(actor: AuthenticatedActor, dossierTenantId: string): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' (${actor.persona}) is read-only and prohibited from uploading documents.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantId !== dossierTenantId) {
    throw new AccessControlError(
      `Cross-tenant document upload is prohibited: actor belongs to '${actor.tenantId}', dossier belongs to '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
  if (actor.tenantType !== "PACKHOUSE_EXPORTER") {
    throw new AccessControlError(
      `Tenant type '${actor.tenantType}' (${actor.persona}) is not permitted to upload packhouse export documents.`,
      "INVALID_TENANT_TYPE"
    );
  }
  if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new AccessControlError(`Role '${actor.role}' is not permitted to upload documents.`, "INSUFFICIENT_ROLE");
  }
}

export function assertCanVerifyField(
  actor: AuthenticatedActor,
  dossierTenantId: string,
  hasReadAndVerifyScope: boolean
): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' (${actor.persona}) is read-only and prohibited from verifying fields.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantId === dossierTenantId) {
    if (actor.tenantType !== "PACKHOUSE_EXPORTER") {
      throw new AccessControlError(`Tenant type '${actor.tenantType}' is not permitted to perform packhouse field verification.`, "INVALID_TENANT_TYPE");
    }
    if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
      throw new AccessControlError(`Role '${actor.role}' is not permitted to verify fields.`, "INSUFFICIENT_ROLE");
    }
    return;
  }
  if (!hasReadAndVerifyScope) {
    throw new AccessControlError(
      `Actor tenant '${actor.tenantId}' does not have READ_AND_VERIFY share scope on dossier of tenant '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
}

export function assertCanApproveOrExport(
  actor: AuthenticatedActor,
  dossierTenantId: string,
  operationName: "approveForExport" | "exportDossier"
): void {
  assertValidActor(actor);
  if (actor.tenantId !== dossierTenantId) {
    throw new AccessControlError(
      `Cross-tenant '${operationName}' is prohibited: actor belongs to '${actor.tenantId}', dossier belongs to '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
  if (actor.tenantType !== "PACKHOUSE_EXPORTER") {
    throw new AccessControlError(
      `Tenant type '${actor.tenantType}' (${actor.persona}) is not permitted to execute '${operationName}'.`,
      "INVALID_TENANT_TYPE"
    );
  }
  if (actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    const label = actor.role === "CLERK" ? "Clerk" : actor.role;
    const actionDesc = operationName === "approveForExport" ? "for manager export sign-off" : "to export dossier";
    throw new AccessControlError(`${label} role is unauthorized ${actionDesc}.`, "INSUFFICIENT_ROLE");
  }
  if (actor.persona !== "PACKHOUSE_MANAGER") {
    throw new AccessControlError(`Persona '${actor.persona}' is unauthorized for '${operationName}'; PACKHOUSE_MANAGER required.`, "INSUFFICIENT_ROLE");
  }
}

export function assertCanRecordOrganicEvidence(actor: AuthenticatedActor): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' (${actor.persona}) is read-only and prohibited from recording organic evidence.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantType !== "PACKHOUSE_EXPORTER" && actor.tenantType !== "ORCHARD_COOP") {
    throw new AccessControlError(`Tenant type '${actor.tenantType}' (${actor.persona}) is not permitted to record organic evidence.`, "INVALID_TENANT_TYPE");
  }
}
