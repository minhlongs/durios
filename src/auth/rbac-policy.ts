import type {
  AuthenticatedActor, ProductPersona, TenantType, UserRole,
} from "../domain/types.js";

export type AccessErrorCode =
  | "INVALID_IDENTITY_TUPLE"
  | "INSUFFICIENT_ROLE"
  | "CROSS_TENANT_FORBIDDEN"
  | "INVALID_TENANT_TYPE"
  | "SHARE_PURPOSE_FORBIDDEN";

export class AccessControlError extends Error {
  public readonly status = 403 as const;
  constructor(
    message: string,
    public readonly code: AccessErrorCode = "INSUFFICIENT_ROLE"
  ) {
    super(message);
    this.name = "AccessControlError";
  }
}

interface AllowedTupleRule {
  readonly persona: ProductPersona;
  readonly allowedTenantTypes: readonly TenantType[];
  readonly allowedRoles: readonly UserRole[];
}

const ALLOWED_IDENTITY_TUPLES: readonly AllowedTupleRule[] = [
  { persona: "ORCHARD_OFFICER", allowedTenantTypes: ["ORCHARD_COOP"], allowedRoles: ["CLERK", "MANAGER", "ADMIN"] },
  { persona: "PACKHOUSE_CLERK", allowedTenantTypes: ["PACKHOUSE_EXPORTER"], allowedRoles: ["CLERK"] },
  { persona: "PACKHOUSE_MANAGER", allowedTenantTypes: ["PACKHOUSE_EXPORTER"], allowedRoles: ["MANAGER", "ADMIN"] },
  { persona: "BUYER_VIEWER", allowedTenantTypes: ["BUYER_IMPORTER", "PACKHOUSE_EXPORTER"], allowedRoles: ["VIEWER"] },
  { persona: "SYSTEM_AUDITOR", allowedTenantTypes: ["INSPECTION_AUDITOR", "PACKHOUSE_EXPORTER", "ORCHARD_COOP"], allowedRoles: ["AUDITOR"] },
];

export function isValidIdentityTuple(persona: unknown, tenantType: unknown, role: unknown): boolean {
  if (typeof persona !== "string" || typeof tenantType !== "string" || typeof role !== "string") return false;
  const rule = ALLOWED_IDENTITY_TUPLES.find((r) => r.persona === persona);
  if (!rule) return false;
  return (
    rule.allowedTenantTypes.includes(tenantType as TenantType) &&
    rule.allowedRoles.includes(role as UserRole)
  );
}

export function assertValidIdentityTuple(persona: unknown, tenantType: unknown, role: unknown): void {
  if (!isValidIdentityTuple(persona, tenantType, role)) {
    throw new AccessControlError(
      `Invalid identity tuple (${String(persona)}, ${String(tenantType)}, ${String(role)}): combination is prohibited and no fallback role is permitted.`,
      "INVALID_IDENTITY_TUPLE"
    );
  }
}

export function assertValidActor(actor: AuthenticatedActor | undefined | null): void {
  if (!actor || !actor.id?.trim() || !actor.tenantId?.trim()) {
    throw new AccessControlError("Invalid or incomplete actor identity.", "INVALID_IDENTITY_TUPLE");
  }
  assertValidIdentityTuple(actor.persona, actor.tenantType, actor.role);
}

export function isReadOnlyRole(role: UserRole): boolean {
  return role === "VIEWER" || role === "AUDITOR";
}

export function assertCanCreateContainerDossier(actor: AuthenticatedActor): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' is read-only and prohibited from creating container dossiers.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantType !== "PACKHOUSE_EXPORTER") {
    throw new AccessControlError(`Tenant type '${actor.tenantType}' (${actor.persona}) is not permitted to create packhouse container dossiers.`, "INVALID_TENANT_TYPE");
  }
  if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new AccessControlError(`Role '${actor.role}' is not permitted to create container dossiers.`, "INSUFFICIENT_ROLE");
  }
}

export function assertOwnerOperationalRole(actor: AuthenticatedActor, dossierTenantId: string, operationName: string): void {
  assertValidActor(actor);
  if (isReadOnlyRole(actor.role)) {
    throw new AccessControlError(`Role '${actor.role}' is read-only and prohibited from '${operationName}'.`, "INSUFFICIENT_ROLE");
  }
  if (actor.tenantId !== dossierTenantId) {
    throw new AccessControlError(
      `Cross-tenant '${operationName}' is prohibited: actor belongs to '${actor.tenantId}', dossier belongs to '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
  if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new AccessControlError(`Role '${actor.role}' is not permitted to execute '${operationName}'.`, "INSUFFICIENT_ROLE");
  }
}

export function assertOwnerManagementRole(actor: AuthenticatedActor, dossierTenantId: string, operationName: string): void {
  assertValidActor(actor);
  if (actor.tenantId !== dossierTenantId) {
    throw new AccessControlError(
      `Cross-tenant '${operationName}' is prohibited: actor belongs to '${actor.tenantId}', dossier belongs to '${dossierTenantId}'.`,
      "CROSS_TENANT_FORBIDDEN"
    );
  }
  if (actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new AccessControlError(
      `Role '${actor.role}' is unauthorized for '${operationName}'; MANAGER or ADMIN of owning tenant required.`,
      "INSUFFICIENT_ROLE"
    );
  }
}
