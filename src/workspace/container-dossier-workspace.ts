import { validateIso6346Container } from "../domain/iso-6346.js";
import { assertCanTransition } from "../domain/dossier-fsm.js";
import { HitlVerificationService, type HumanVerificationInput } from "../verification/hitl-service.js";
import { DeterministicRuleEngine } from "../rules/deterministic-engine.js";
import { STATUTORY_COMPLIANCE_RULES } from "../rules/rule-catalog.js";
import { AuditLedger } from "../audit/audit-ledger.js";
import { compileExportManifest } from "../export/manifest-compiler.js";
import { DossierRepository } from "./dossier-repository.js";
import { handleDocumentUpload } from "./document-ingestion-orchestrator.js";
import type { FileStorageService } from "../storage/file-storage-service.js";
import type { AuditLedgerLike, CreateDossierInput, DossierRepositoryLike } from "./workspace-types.js";
import type {
  AuthenticatedActor,
  ContainerDossier,
  DocumentType,
  DossierExportManifest,
  IngestedDocument,
  ValidationRunResult,
} from "../domain/types.js";

export class ContainerDossierWorkspace {
  public readonly auditLedger: AuditLedgerLike;
  public readonly hitlService: HitlVerificationService;
  public readonly ruleEngine: DeterministicRuleEngine;
  public readonly fileStorage?: FileStorageService | undefined;
  private readonly repo: DossierRepositoryLike;

  constructor(
    repo?: DossierRepositoryLike,
    auditLedger?: AuditLedgerLike,
    fileStorage?: FileStorageService | undefined
  ) {
    this.repo = repo ?? new DossierRepository();
    this.auditLedger = auditLedger ?? new AuditLedger();
    this.hitlService = new HitlVerificationService(this.auditLedger as any);
    this.ruleEngine = new DeterministicRuleEngine(STATUTORY_COMPLIANCE_RULES);
    this.fileStorage = fileStorage;
  }

  public createDossier(input: CreateDossierInput, actor: AuthenticatedActor): ContainerDossier {
    const isoResult = validateIso6346Container(input.containerNumber);
    if (!isoResult.isValid) {
      throw new Error(`Invalid container number: ${isoResult.reason ?? "ISO 6346 check digit failure"}`);
    }
    const id = `DOS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const dossier: ContainerDossier = {
      id, tenantId: actor.tenantId, dossierCode: input.dossierCode,
      containerNumber: isoResult.normalized, sealNumber: input.sealNumber.trim(),
      targetMarket: input.targetMarket, borderGate: input.borderGate,
      targetTemperatureC: input.targetTemperatureC, declaredNetWeightKg: input.declaredNetWeightKg,
      declaredBoxCount: input.declaredBoxCount, lifecycleState: "DRAFT", isImmutable: false,
      createdAt: now, updatedAt: now, documents: [],
    };
    this.repo.save(dossier);
    this.auditLedger.recordEvent(actor, id, "DOSSIER_CREATED", "CONTAINER_DOSSIER", id, null, {
      dossierCode: input.dossierCode, containerNumber: dossier.containerNumber,
    });
    return dossier;
  }

  public uploadDocument(
    dossierId: string, fileBuffer: Uint8Array, originalFileName: string,
    documentType: DocumentType, actor: AuthenticatedActor,
    fixtureFields?: Record<string, { raw: string; confirmed?: string }>
  ): { readonly dossier: ContainerDossier; readonly document: IngestedDocument } {
    const dossier = this.repo.getOrThrow(dossierId, actor);
    const { updatedDossier, document } = handleDocumentUpload(
      dossier, fileBuffer, originalFileName, documentType, actor, this.auditLedger as any, fixtureFields
    );
    if (this.fileStorage) {
      this.fileStorage.storeFile(fileBuffer, originalFileName, document.id);
    }
    this.repo.save(updatedDossier);
    return { dossier: updatedDossier, document };
  }

  public verifyField(
    dossierId: string, documentId: string, verification: HumanVerificationInput, actor: AuthenticatedActor
  ): ContainerDossier {
    const dossier = this.repo.getOrThrow(dossierId, actor);
    if (dossier.isImmutable) throw new Error("Dossier is sealed and immutable.");
    const docIndex = dossier.documents.findIndex((d) => d.id === documentId && !d.isSuperseded);
    if (docIndex === -1) throw new Error(`Active document '${documentId}' not found.`);

    const updatedDoc = this.hitlService.verifyOrCorrectField(dossier.documents[docIndex]!, verification, actor);
    const updatedDocuments = [...dossier.documents];
    updatedDocuments[docIndex] = updatedDoc;
    const updatedDossier: ContainerDossier = {
      ...dossier, documents: updatedDocuments, latestValidationResult: undefined, updatedAt: new Date().toISOString(),
    };
    this.repo.save(updatedDossier);
    return updatedDossier;
  }

  public runValidation(dossierId: string, actor: AuthenticatedActor): ValidationRunResult {
    const dossier = this.repo.getOrThrow(dossierId, actor);
    const result = this.ruleEngine.evaluate(dossier);
    let nextState = dossier.lifecycleState;
    if (result.status === "PASSED") nextState = "READY_FOR_REVIEW";
    else if (result.status === "BLOCKED") nextState = "VALIDATION_BLOCKED";
    else if (result.status === "REVIEW_REQUIRED") nextState = "REVIEW_REQUIRED";
    else if (result.status === "HUMAN_VERIFICATION_REQUIRED") nextState = "HUMAN_VERIFICATION_REQUIRED";

    const updatedDossier: ContainerDossier = {
      ...dossier, lifecycleState: nextState, latestValidationResult: result, updatedAt: new Date().toISOString(),
    };
    this.repo.save(updatedDossier);
    this.auditLedger.recordEvent(
      actor, dossierId, result.status === "PASSED" ? "VALIDATION_RUN_PASSED" : "VALIDATION_RUN_FAILED",
      "CONTAINER_DOSSIER", dossierId, { previousState: dossier.lifecycleState },
      { nextState, status: result.status, blockers: result.criticalBlockers, warnings: result.advisoryWarnings }
    );
    return result;
  }

  public approveForExport(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const dossier = this.repo.getOrThrow(dossierId, actor);
    assertCanTransition(dossier, "APPROVED_FOR_EXPORT", actor);
    if (dossier.latestValidationResult?.status !== "PASSED" && dossier.lifecycleState !== "REVIEW_REQUIRED") {
      throw new Error("Cannot approve dossier without clean validation run or acknowledged review.");
    }
    const updatedDossier: ContainerDossier = {
      ...dossier, lifecycleState: "APPROVED_FOR_EXPORT", updatedAt: new Date().toISOString(),
    };
    this.repo.save(updatedDossier);
    this.auditLedger.recordEvent(actor, dossierId, "DOSSIER_APPROVED_FOR_EXPORT", "CONTAINER_DOSSIER", dossierId, null, {
      approvedBy: actor.name, role: actor.role,
    });
    return updatedDossier;
  }

  public exportDossier(dossierId: string, actor: AuthenticatedActor): DossierExportManifest {
    const dossier = this.repo.getOrThrow(dossierId, actor);
    assertCanTransition(dossier, "EXPORTED", actor);
    const now = new Date().toISOString();
    const sealedDossier: ContainerDossier = {
      ...dossier, lifecycleState: "EXPORTED", isImmutable: true, exportSealedAt: now, updatedAt: now,
    };
    const manifest = compileExportManifest(sealedDossier, actor);
    this.repo.save(sealedDossier);
    this.repo.saveExportManifest?.(manifest, actor);
    this.auditLedger.recordEvent(actor, dossierId, "DOSSIER_SEALED_EXPORTED", "CONTAINER_DOSSIER", dossierId, null, {
      compositeSha256: manifest.compositeManifestSha256, exportedAt: now,
    });
    return manifest;
  }

  public getDossier(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined {
    return this.repo.findById(dossierId, actor);
  }

  public listDossiers(actor: AuthenticatedActor): readonly ContainerDossier[] {
    return this.repo.listForTenant(actor);
  }

  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined {
    return this.repo.getExportManifest?.(dossierId, actor);
  }
}
