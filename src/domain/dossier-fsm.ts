import type {
  AuthenticatedActor,
  ContainerDossier,
  DossierLifecycleState,
} from "./types.js";
import { assertValidActor } from "../auth/rbac-policy.js";

export type DossierFsmErrorCode =
  | "INVALID_TRANSITION"
  | "ILLEGAL_TRANSITION"
  | "DOSSIER_IMMUTABLE"
  | "CROSS_TENANT_FORBIDDEN"
  | "INSUFFICIENT_ROLE";

export class DossierFsmError extends Error {
  public readonly status: 400 | 403 | 409;

  constructor(
    message: string,
    public readonly fromState: DossierLifecycleState,
    public readonly attemptedState: DossierLifecycleState,
    public readonly code: DossierFsmErrorCode = "INVALID_TRANSITION"
  ) {
    super(message);
    this.name = "DossierFsmError";
    if (code === "DOSSIER_IMMUTABLE") {
      this.status = 409;
    } else if (code === "CROSS_TENANT_FORBIDDEN" || code === "INSUFFICIENT_ROLE") {
      this.status = 403;
    } else {
      this.status = 400;
    }
  }
}

const ALLOWED_TRANSITIONS: Readonly<Record<DossierLifecycleState, readonly DossierLifecycleState[]>> = {
  DRAFT: ["DOCUMENTS_PENDING", "CANCELLED"],
  DOCUMENTS_PENDING: ["PROCESSING", "DOCUMENTS_PENDING", "CANCELLED"],
  PROCESSING: ["HUMAN_VERIFICATION_REQUIRED", "CANCELLED"],
  HUMAN_VERIFICATION_REQUIRED: ["VALIDATION_BLOCKED", "REVIEW_REQUIRED", "READY_FOR_REVIEW", "CANCELLED"],
  VALIDATION_BLOCKED: ["HUMAN_VERIFICATION_REQUIRED", "CANCELLED"],
  REVIEW_REQUIRED: ["APPROVED_FOR_EXPORT", "HUMAN_VERIFICATION_REQUIRED", "CANCELLED"],
  READY_FOR_REVIEW: ["APPROVED_FOR_EXPORT", "HUMAN_VERIFICATION_REQUIRED", "CANCELLED"],
  APPROVED_FOR_EXPORT: ["EXPORTED", "CANCELLED"],
  EXPORTED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function isDossierSealed(dossier: ContainerDossier): boolean {
  return (
    dossier.isImmutable ||
    dossier.lifecycleState === "EXPORTED" ||
    dossier.lifecycleState === "CLOSED" ||
    dossier.lifecycleState === "CANCELLED"
  );
}

export function assertDossierMutable(dossier: ContainerDossier, actionLabel = "modify"): void {
  if (isDossierSealed(dossier)) {
    throw new DossierFsmError(
      `Cannot ${actionLabel} sealed dossier: Dossier is sealed and immutable; mutations and re-evaluations are prohibited on immutable or closed dossiers.`,
      dossier.lifecycleState,
      dossier.lifecycleState,
      "DOSSIER_IMMUTABLE"
    );
  }
}

export function canTransition(
  fromState: DossierLifecycleState,
  toState: DossierLifecycleState
): boolean {
  return ALLOWED_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

export function assertCanTransition(
  dossier: ContainerDossier,
  toState: DossierLifecycleState,
  actor: AuthenticatedActor
): void {
  assertValidActor(actor);

  if (dossier.tenantId !== actor.tenantId) {
    throw new DossierFsmError(
      "Actor tenant does not match dossier tenant.",
      dossier.lifecycleState,
      toState,
      "CROSS_TENANT_FORBIDDEN"
    );
  }

  if (toState === "APPROVED_FOR_EXPORT") {
    if (actor.tenantType !== "PACKHOUSE_EXPORTER" || actor.persona !== "PACKHOUSE_MANAGER" || (actor.role !== "MANAGER" && actor.role !== "ADMIN")) {
      const label = actor.role === "CLERK" ? "Clerk" : actor.role;
      throw new DossierFsmError(
        `${label} role is unauthorized for manager export sign-off.`,
        dossier.lifecycleState,
        toState,
        "INSUFFICIENT_ROLE"
      );
    }
  } else if (toState === "EXPORTED" || toState === "CLOSED") {
    if (actor.tenantType !== "PACKHOUSE_EXPORTER" || actor.persona !== "PACKHOUSE_MANAGER" || (actor.role !== "MANAGER" && actor.role !== "ADMIN")) {
      const label = actor.role === "CLERK" ? "Clerk" : actor.role;
      throw new DossierFsmError(
        `${label} role is unauthorized to export dossier.`,
        dossier.lifecycleState,
        toState,
        "INSUFFICIENT_ROLE"
      );
    }
  } else if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new DossierFsmError(
      `${actor.role} role is read-only and unauthorized to transition dossier state.`,
      dossier.lifecycleState,
      toState,
      "INSUFFICIENT_ROLE"
    );
  }

  if (dossier.isImmutable && toState !== "CLOSED") {
    throw new DossierFsmError(
      "Dossier is cryptographically sealed (WORM locked) and immutable.",
      dossier.lifecycleState,
      toState,
      "DOSSIER_IMMUTABLE"
    );
  }

  if (!canTransition(dossier.lifecycleState, toState)) {
    throw new DossierFsmError(
      `Illegal transition from '${dossier.lifecycleState}' to '${toState}'.`,
      dossier.lifecycleState,
      toState,
      "ILLEGAL_TRANSITION"
    );
  }
}

export function assertCanValidate(
  dossier: ContainerDossier,
  actor: AuthenticatedActor
): void {
  assertValidActor(actor);

  if (dossier.tenantId !== actor.tenantId) {
    throw new DossierFsmError(
      "Actor tenant does not match dossier tenant.",
      dossier.lifecycleState,
      dossier.lifecycleState,
      "CROSS_TENANT_FORBIDDEN"
    );
  }

  if (actor.role !== "CLERK" && actor.role !== "MANAGER" && actor.role !== "ADMIN") {
    throw new DossierFsmError(
      `Role '${actor.role}' is read-only and unauthorized to run validation.`,
      dossier.lifecycleState,
      dossier.lifecycleState,
      "INSUFFICIENT_ROLE"
    );
  }

  assertDossierMutable(dossier, "validate");
}
