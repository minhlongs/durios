import { assertCanTransition, assertCanValidate, assertDossierMutable } from "../domain/dossier-fsm.js";
import { compileExportManifest } from "../export/manifest-compiler.js";
import { assertCanOverrideBlocker } from "../auth/override-authorization.js";
import { enrichValidationResult } from "../rules/dossier-finding-enricher.js";
import { STATUTORY_COMPLIANCE_RULES } from "../rules/rule-catalog.js";
import type { DeterministicRuleEngine } from "../rules/deterministic-engine.js";
import type { AuditLedgerLike, DossierRepositoryLike, ValidationRunOutcome } from "./workspace-types.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest } from "../domain/types.js";

export function executeValidation(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, ruleEngine: DeterministicRuleEngine, auditLedger: AuditLedgerLike, expectedVersion?: number): ValidationRunOutcome {
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanValidate(dossier, actor);
  // Tag each finding with its legal basis at the point it is produced, so a result
  // reloaded from storage later still tells an operator which findings carry weight.
  // A finding produced before this field existed is tagged on read, not left bare.
  const result = enrichValidationResult(ruleEngine.evaluate(dossier), STATUTORY_COMPLIANCE_RULES);
  let nextState = dossier.lifecycleState;
  if (result.status === "PASSED") nextState = "READY_FOR_REVIEW";
  else if (result.status === "BLOCKED") nextState = "VALIDATION_BLOCKED";
  else if (result.status === "REVIEW_REQUIRED") nextState = "REVIEW_REQUIRED";
  else if (result.status === "HUMAN_VERIFICATION_REQUIRED") nextState = "HUMAN_VERIFICATION_REQUIRED";
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: nextState, latestValidationResult: result, updatedAt: new Date().toISOString() };
  const saved = repo.save(updatedDossier, expectedVersion ?? dossier.version);
  auditLedger.recordEvent(actor, dossierId, result.status === "PASSED" ? "VALIDATION_RUN_PASSED" : "VALIDATION_RUN_FAILED", "CONTAINER_DOSSIER", dossierId, { previousState: dossier.lifecycleState }, { nextState, status: result.status, blockers: result.criticalBlockers, warnings: result.advisoryWarnings });
  return { result, version: saved.version };
}

export function executeApproveForExport(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, auditLedger: AuditLedgerLike, expectedVersion?: number): ContainerDossier {
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanTransition(dossier, "APPROVED_FOR_EXPORT", actor);
  if (dossier.latestValidationResult?.status !== "PASSED" && dossier.lifecycleState !== "REVIEW_REQUIRED") {
    throw new Error("Cannot approve dossier without clean validation run or acknowledged review.");
  }
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: "APPROVED_FOR_EXPORT", updatedAt: new Date().toISOString() };
  const saved = repo.save(updatedDossier, expectedVersion ?? dossier.version);
  auditLedger.recordEvent(actor, dossierId, "DOSSIER_APPROVED_FOR_EXPORT", "CONTAINER_DOSSIER", dossierId, null, { approvedBy: actor.name, role: actor.role });
  return saved;
}

export function executeExportDossier(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, auditLedger: AuditLedgerLike, expectedVersion?: number): DossierExportManifest {
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanTransition(dossier, "EXPORTED", actor);
  if (typeof auditLedger.verifyIntegrity === "function") {
    if (!auditLedger.verifyIntegrity()) {
      throw new Error("Audit log tamper detection triggered: export refused due to audit chain integrity failure.");
    }
  }
  const now = new Date().toISOString();
  const sealedDossier: ContainerDossier = { ...dossier, lifecycleState: "EXPORTED", isImmutable: true, exportSealedAt: now, updatedAt: now };
  const manifest = compileExportManifest(sealedDossier, actor);
  const precondition = expectedVersion ?? dossier.version;
  if (repo.sealExport) repo.sealExport(sealedDossier, manifest, actor, precondition);
  else {
    repo.save(sealedDossier, precondition);
    repo.saveExportManifest?.(manifest, actor);
  }
  auditLedger.recordEvent(actor, dossierId, "DOSSIER_SEALED_EXPORTED", "CONTAINER_DOSSIER", dossierId, null, { compositeSha256: manifest.compositeManifestSha256, exportedAt: now });
  return manifest;
}

/**
 * A named quality manager signs past a blocking finding so the lot can proceed.
 *
 * The blocking finding is deliberately left on the dossier: the override records
 * a decision, it does not retract the evidence that prompted it. Approval still
 * requires its own step afterwards, so signing past a blocker never becomes an
 * approval by accident.
 */
export function executeBlockerOverride(
  dossierId: string,
  reason: string,
  actor: AuthenticatedActor,
  repo: DossierRepositoryLike,
  auditLedger: AuditLedgerLike,
  expectedVersion?: number
): ContainerDossier {
  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0) {
    throw new Error("A signed override requires a non-empty reason explaining the decision.");
  }
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanOverrideBlocker(actor, dossier.tenantId);
  assertDossierMutable(dossier, "override a blocker on");
  if (dossier.lifecycleState !== "VALIDATION_BLOCKED") {
    throw new Error(`Cannot override a blocker from '${dossier.lifecycleState}': only a blocked dossier can be signed past.`);
  }
  assertCanTransition(dossier, "REVIEW_REQUIRED", actor);
  const blockers: readonly string[] = dossier.latestValidationResult?.findings
    .filter((f) => f.severity === "CRITICAL_BLOCKER")
    .map((f) => f.ruleId) ?? [];
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: "REVIEW_REQUIRED", updatedAt: new Date().toISOString() };
  const saved = repo.save(updatedDossier, expectedVersion ?? dossier.version);
  auditLedger.recordEvent(actor, dossierId, "DOSSIER_BLOCKER_OVERRIDDEN", "CONTAINER_DOSSIER", dossierId, { previousState: dossier.lifecycleState, blockers }, { nextState: "REVIEW_REQUIRED", signedBy: actor.name, role: actor.role, reason: trimmedReason });
  // The save takes the version forward, so the object it returns is the one whose
  // version is current. Returning the pre-save object would hand the operator a
  // version the store has already moved past, and their next write would be refused.
  return saved;
}
