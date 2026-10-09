import type {
  AuthenticatedActor,
  ContainerDossier,
  DossierLifecycleState,
} from "./types.js";

export class DossierFsmError extends Error {
  constructor(
    message: string,
    public readonly fromState: DossierLifecycleState,
    public readonly attemptedState: DossierLifecycleState,
    public readonly code: string = "INVALID_TRANSITION"
  ) {
    super(message);
    this.name = "DossierFsmError";
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
  if (dossier.isImmutable && toState !== "CLOSED") {
    throw new DossierFsmError(
      "Dossier is cryptographically sealed (WORM locked) and immutable.",
      dossier.lifecycleState,
      toState,
      "DOSSIER_IMMUTABLE"
    );
  }

  if (dossier.tenantId !== actor.tenantId) {
    throw new DossierFsmError(
      "Actor tenant does not match dossier tenant.",
      dossier.lifecycleState,
      toState,
      "CROSS_TENANT_FORBIDDEN"
    );
  }

  if (toState === "APPROVED_FOR_EXPORT" && actor.role === "CLERK") {
    throw new DossierFsmError(
      "Clerk role is unauthorized for manager export sign-off.",
      dossier.lifecycleState,
      toState,
      "INSUFFICIENT_ROLE"
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
