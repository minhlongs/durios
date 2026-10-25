import { validateIso6346Container } from "../domain/iso-6346.js";
import { assertDossierMutable } from "../domain/dossier-fsm.js";
import { HitlVerificationService, type HumanVerificationInput } from "../verification/hitl-service.js";
import { DeterministicRuleEngine } from "../rules/deterministic-engine.js";
import { STATUTORY_COMPLIANCE_RULES } from "../rules/rule-catalog.js";
import { AuditLedger } from "../audit/audit-ledger.js";
import { DossierRepository } from "./dossier-repository.js";
import { handleDocumentUpload } from "./document-ingestion-orchestrator.js";
import { executeValidation, executeApproveForExport, executeExportDossier, executeBlockerOverride } from "./dossier-lifecycle-service.js";
import { buildWorkspaceCollaborators } from "./workspace-collaborators.js";
import { persistUploadedDocument, persistFieldVerification } from "./document-persistence-flow.js";
import { ShareAccessManager } from "../sharing/share-access-manager.js";
import { OrganicEvidenceManager } from "../organic/organic-evidence-manager.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import { SqliteDossierRepository } from "../storage/sqlite-dossier-repository.js";
import { SqliteAuthService } from "../auth/sqlite-auth-service.js";
import { assertCanCreateContainerDossier, assertValidActor } from "../auth/rbac-policy.js";
import { assertCanUploadDocument, assertCanVerifyField, assertCanApproveOrExport, assertCanOverrideBlocker } from "../auth/rbac-persona-assertions.js";
import type { FileStorageService, LegacyBlobReconciliationReport } from "../storage/file-storage-service.js";
import type { AuditLedgerLike, CreateDossierInput, DossierRepositoryLike, ValidationRunOutcome } from "./workspace-types.js";
import type { AuthenticatedActor, ContainerDossier, DocumentType, DossierExportManifest, IngestedDocument, ValidationRunResult } from "../domain/types.js";

export class ContainerDossierWorkspace {
  public readonly auditLedger: AuditLedgerLike; public readonly hitlService: HitlVerificationService; public readonly ruleEngine: DeterministicRuleEngine; public readonly fileStorage: FileStorageService | undefined; public readonly legacyBlobReconciliationReport: LegacyBlobReconciliationReport | undefined; public readonly shareManager: ShareAccessManager; public readonly organicEvidenceManager: OrganicEvidenceManager; public readonly authService: SqliteAuthService; public readonly sqliteClient: SqliteClient; private readonly repo: DossierRepositoryLike;
  constructor(
    repo?: DossierRepositoryLike, auditLedger?: AuditLedgerLike, fileStorage?: FileStorageService | undefined,
    authService?: SqliteAuthService | undefined, sqliteClient?: SqliteClient | undefined
  ) {
    this.repo = repo ?? new DossierRepository();
    this.auditLedger = auditLedger ?? new AuditLedger();
    this.hitlService = new HitlVerificationService(this.auditLedger);
    this.ruleEngine = new DeterministicRuleEngine(STATUTORY_COMPLIANCE_RULES);
    this.fileStorage = fileStorage;
    const collaborators = buildWorkspaceCollaborators(this.repo, sqliteClient);
    this.sqliteClient = collaborators.sqliteClient;
    this.shareManager = collaborators.shareManager;
    this.organicEvidenceManager = collaborators.organicEvidenceManager;
    this.authService = authService ?? new SqliteAuthService(collaborators.sqliteClient);
    this.repo.setAccessChecker?.((dId, oTId, aTId) => collaborators.shareManager.checkAccess(dId, oTId, aTId).hasAccess);
    if (this.fileStorage && this.repo instanceof SqliteDossierRepository) {
      this.legacyBlobReconciliationReport = this.fileStorage.reconcileLegacyDocumentBlobs(collaborators.sqliteClient.db);
    }
  }
  public createDossier(input: CreateDossierInput, actor: AuthenticatedActor): ContainerDossier {
    assertCanCreateContainerDossier(actor);
    const isoResult = validateIso6346Container(input.containerNumber);
    if (!isoResult.isValid) throw new Error(`Invalid container number: ${isoResult.reason ?? "ISO 6346 check digit failure"}`);
    const [id, now] = [`DOS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, new Date().toISOString()];
    const dossier: ContainerDossier = { id, tenantId: actor.tenantId, dossierCode: input.dossierCode, containerNumber: isoResult.normalized, sealNumber: input.sealNumber.trim(), targetMarket: input.targetMarket, borderGate: input.borderGate, targetTemperatureC: input.targetTemperatureC, declaredNetWeightKg: input.declaredNetWeightKg, declaredBoxCount: input.declaredBoxCount, lifecycleState: "DRAFT", isImmutable: false, createdAt: now, updatedAt: now, version: 1, documents: [] };
    this.repo.save(dossier);
    this.auditLedger.recordEvent(actor, id, "DOSSIER_CREATED", "CONTAINER_DOSSIER", id, null, { dossierCode: input.dossierCode, containerNumber: dossier.containerNumber });
    return dossier;
  }
  public uploadDocument(
    dossierId: string, fileBytes: Uint8Array, fileName: string, documentType: DocumentType,
    actor: AuthenticatedActor, fixtureExtractedFields?: Record<string, { raw: string; confidence?: number }>,
    expectedVersion?: number
  ): { dossier: ContainerDossier; document: IngestedDocument } {
    assertValidActor(actor);
    const dossier = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    assertCanUploadDocument(actor, dossier.tenantId);
    assertDossierMutable(dossier, "upload to");
    const { updatedDossier, document } = handleDocumentUpload(dossier, fileBytes, fileName, documentType, actor, this.auditLedger, fixtureExtractedFields);
    return persistUploadedDocument(dossier, updatedDossier, document, fileBytes, fileName, this.fileStorage, this.repo, expectedVersion);
  }

  public verifyField(dossierId: string, documentId: string, verification: HumanVerificationInput, actor: AuthenticatedActor): ContainerDossier {
    assertValidActor(actor);
    const dossier = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    const hasReadAndVerify = actor.tenantId === dossier.tenantId || (() => { const acc = this.shareManager.checkAccess(dossier.id, dossier.tenantId, actor.tenantId); return acc.hasAccess && acc.scope === "READ_AND_VERIFY"; })();
    assertCanVerifyField(actor, dossier.tenantId, hasReadAndVerify);
    assertDossierMutable(dossier, "verify fields on");
    return persistFieldVerification(dossier, documentId, verification, actor, this.hitlService, this.repo);
  }

  public runValidation(dossierId: string, actor: AuthenticatedActor, expectedVersion?: number): ValidationRunResult { return executeValidation(dossierId, actor, this.repo, this.ruleEngine, this.auditLedger, expectedVersion).result; }
  /** Validates and reports the new version, which the caller needs for its next write. */
  public runValidationOutcome(dossierId: string, actor: AuthenticatedActor, expectedVersion?: number): ValidationRunOutcome { return executeValidation(dossierId, actor, this.repo, this.ruleEngine, this.auditLedger, expectedVersion); }
  public overrideBlocker(dossierId: string, reason: string, actor: AuthenticatedActor, expectedVersion?: number): ContainerDossier {
    const d = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    assertCanOverrideBlocker(actor, d.tenantId);
    return executeBlockerOverride(dossierId, reason, actor, this.repo, this.auditLedger, expectedVersion);
  }
  public approveForExport(dossierId: string, actor: AuthenticatedActor, expectedVersion?: number): ContainerDossier { const d = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor); assertCanApproveOrExport(actor, d.tenantId, "approveForExport"); return executeApproveForExport(dossierId, actor, this.repo, this.auditLedger, expectedVersion); }
  public exportDossier(dossierId: string, actor: AuthenticatedActor, expectedVersion?: number): DossierExportManifest { const d = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor); assertCanApproveOrExport(actor, d.tenantId, "exportDossier"); return executeExportDossier(dossierId, actor, this.repo, this.auditLedger, expectedVersion); }
  public getDossier(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined { assertValidActor(actor); return this.repo.findById(dossierId, actor); }
  public getRawDossier(dossierId: string): ContainerDossier | undefined { return this.repo.findRaw?.(dossierId); }
  public listDossiers(actor: AuthenticatedActor): readonly ContainerDossier[] { assertValidActor(actor); return this.repo.listForTenant(actor); }
  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined { assertValidActor(actor); return this.repo.getExportManifest?.(dossierId, actor); }
}
