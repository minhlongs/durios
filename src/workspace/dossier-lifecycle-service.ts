import { assertCanTransition, assertCanValidate } from "../domain/dossier-fsm.js";
import { compileExportManifest } from "../export/manifest-compiler.js";
import type { DeterministicRuleEngine } from "../rules/deterministic-engine.js";
import type { AuditLedgerLike, DossierRepositoryLike } from "./workspace-types.js";
import type { AuthenticatedActor, ContainerDossier, DossierExportManifest, ValidationRunResult } from "../domain/types.js";

export function executeValidation(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, ruleEngine: DeterministicRuleEngine, auditLedger: AuditLedgerLike): ValidationRunResult {
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanValidate(dossier, actor);
  const result = ruleEngine.evaluate(dossier);
  let nextState = dossier.lifecycleState;
  if (result.status === "PASSED") nextState = "READY_FOR_REVIEW";
  else if (result.status === "BLOCKED") nextState = "VALIDATION_BLOCKED";
  else if (result.status === "REVIEW_REQUIRED") nextState = "REVIEW_REQUIRED";
  else if (result.status === "HUMAN_VERIFICATION_REQUIRED") nextState = "HUMAN_VERIFICATION_REQUIRED";
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: nextState, latestValidationResult: result, updatedAt: new Date().toISOString() };
  repo.save(updatedDossier);
  auditLedger.recordEvent(actor, dossierId, result.status === "PASSED" ? "VALIDATION_RUN_PASSED" : "VALIDATION_RUN_FAILED", "CONTAINER_DOSSIER", dossierId, { previousState: dossier.lifecycleState }, { nextState, status: result.status, blockers: result.criticalBlockers, warnings: result.advisoryWarnings });
  return result;
}

export function executeApproveForExport(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, auditLedger: AuditLedgerLike): ContainerDossier {
  const dossier = repo.findRaw?.(dossierId) ?? repo.getOrThrow(dossierId, actor);
  assertCanTransition(dossier, "APPROVED_FOR_EXPORT", actor);
  if (dossier.latestValidationResult?.status !== "PASSED" && dossier.lifecycleState !== "REVIEW_REQUIRED") {
    throw new Error("Cannot approve dossier without clean validation run or acknowledged review.");
  }
  const updatedDossier: ContainerDossier = { ...dossier, lifecycleState: "APPROVED_FOR_EXPORT", updatedAt: new Date().toISOString() };
  repo.save(updatedDossier);
  auditLedger.recordEvent(actor, dossierId, "DOSSIER_APPROVED_FOR_EXPORT", "CONTAINER_DOSSIER", dossierId, null, { approvedBy: actor.name, role: actor.role });
  return updatedDossier;
}

export function executeExportDossier(dossierId: string, actor: AuthenticatedActor, repo: DossierRepositoryLike, auditLedger: AuditLedgerLike): DossierExportManifest {
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
  repo.save(sealedDossier);
  repo.saveExportManifest?.(manifest, actor);
  auditLedger.recordEvent(actor, dossierId, "DOSSIER_SEALED_EXPORTED", "CONTAINER_DOSSIER", dossierId, null, { compositeSha256: manifest.compositeManifestSha256, exportedAt: now });
  return manifest;
}
