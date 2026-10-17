import { validateIso6346Container } from "../domain/iso-6346.js";
import { assertDossierMutable } from "../domain/dossier-fsm.js";
import { HitlVerificationService, type HumanVerificationInput } from "../verification/hitl-service.js";
import { DeterministicRuleEngine } from "../rules/deterministic-engine.js";
import { STATUTORY_COMPLIANCE_RULES } from "../rules/rule-catalog.js";
import { AuditLedger } from "../audit/audit-ledger.js";
import { DossierRepository } from "./dossier-repository.js";
import { handleDocumentUpload } from "./document-ingestion-orchestrator.js";
import { executeValidation, executeApproveForExport, executeExportDossier } from "./dossier-lifecycle-service.js";
import { ShareAccessManager } from "../sharing/share-access-manager.js";
import { OrganicEvidenceManager } from "../organic/organic-evidence-manager.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import { SqliteDossierRepository } from "../storage/sqlite-dossier-repository.js";
import { SqliteAuthService } from "../auth/sqlite-auth-service.js";
import { assertCanCreateContainerDossier, assertValidActor } from "../auth/rbac-policy.js";
import { assertCanUploadDocument, assertCanVerifyField, assertCanApproveOrExport } from "../auth/rbac-persona-assertions.js";
import type { FileStorageService, LegacyBlobReconciliationReport, StoredBlobResult } from "../storage/file-storage-service.js";
import type { AuditLedgerLike, CreateDossierInput, DossierRepositoryLike } from "./workspace-types.js";
import type { AuthenticatedActor, ContainerDossier, DocumentType, DossierExportManifest, IngestedDocument, ValidationRunResult } from "../domain/types.js";

export class ContainerDossierWorkspace {
  public readonly auditLedger: AuditLedgerLike;
  public readonly hitlService: HitlVerificationService;
  public readonly ruleEngine: DeterministicRuleEngine;
  public readonly fileStorage?: FileStorageService | undefined;
  public readonly legacyBlobReconciliationReport?: LegacyBlobReconciliationReport | undefined;
  public readonly shareManager: ShareAccessManager;
  public readonly organicEvidenceManager: OrganicEvidenceManager;
  public readonly authService: SqliteAuthService;
  public readonly sqliteClient: SqliteClient;
  private readonly repo: DossierRepositoryLike;

  constructor(
    repo?: DossierRepositoryLike, auditLedger?: AuditLedgerLike, fileStorage?: FileStorageService | undefined,
    authService?: SqliteAuthService | undefined, sqliteClient?: SqliteClient | undefined
  ) {
    this.repo = repo ?? new DossierRepository();
    this.auditLedger = auditLedger ?? new AuditLedger();
    this.hitlService = new HitlVerificationService(this.auditLedger);
    this.ruleEngine = new DeterministicRuleEngine(STATUTORY_COMPLIANCE_RULES);
    this.fileStorage = fileStorage;
    const repoClient = this.repo instanceof SqliteDossierRepository ? this.repo.client : (this.repo as { client?: unknown }).client;
    const resolvedSqlite = sqliteClient ?? (repoClient instanceof SqliteClient ? repoClient : new SqliteClient({ dbPath: ":memory:", inMemory: true }));
    this.sqliteClient = resolvedSqlite;
    this.shareManager = new ShareAccessManager(resolvedSqlite);
    this.organicEvidenceManager = new OrganicEvidenceManager(resolvedSqlite);
    this.authService = authService ?? new SqliteAuthService(resolvedSqlite);
    this.repo.setAccessChecker?.((dId, oTId, aTId) => this.shareManager.checkAccess(dId, oTId, aTId).hasAccess);
    if (this.fileStorage && this.repo instanceof SqliteDossierRepository) {
      this.legacyBlobReconciliationReport = this.fileStorage.reconcileLegacyDocumentBlobs(this.repo.client.db);
    }
  }

  public createDossier(input: CreateDossierInput, actor: AuthenticatedActor): ContainerDossier {
    assertCanCreateContainerDossier(actor);
    const isoResult = validateIso6346Container(input.containerNumber);
    if (!isoResult.isValid) throw new Error(`Invalid container number: ${isoResult.reason ?? "ISO 6346 check digit failure"}`);
    const id = `DOS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const dossier: ContainerDossier = {
      id, tenantId: actor.tenantId, dossierCode: input.dossierCode, containerNumber: isoResult.normalized,
      sealNumber: input.sealNumber.trim(), targetMarket: input.targetMarket, borderGate: input.borderGate,
      targetTemperatureC: input.targetTemperatureC, declaredNetWeightKg: input.declaredNetWeightKg,
      declaredBoxCount: input.declaredBoxCount, lifecycleState: "DRAFT", isImmutable: false, createdAt: now, updatedAt: now, documents: [],
    };
    this.repo.save(dossier);
    this.auditLedger.recordEvent(actor, id, "DOSSIER_CREATED", "CONTAINER_DOSSIER", id, null, {
      dossierCode: input.dossierCode, containerNumber: dossier.containerNumber,
    });
    return dossier;
  }

  public uploadDocument(
    dossierId: string, fileBytes: Uint8Array, fileName: string, documentType: DocumentType,
    actor: AuthenticatedActor, fixtureExtractedFields?: Record<string, { raw: string; confidence?: number }>
  ): { dossier: ContainerDossier; document: IngestedDocument } {
    assertValidActor(actor);
    const dossier = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    assertCanUploadDocument(actor, dossier.tenantId);
    assertDossierMutable(dossier, "upload to");

    let { updatedDossier, document } = handleDocumentUpload(
      dossier, fileBytes, fileName, documentType, actor, this.auditLedger, fixtureExtractedFields
    );
    let storedBlob: StoredBlobResult | undefined;
    if (this.fileStorage && !dossier.documents.some((d) => d.id === document.id && !d.isSuperseded)) {
      storedBlob = this.fileStorage.storeFile(fileBytes, fileName, document.id);
      document = { ...document, storagePath: storedBlob.storagePath };
      updatedDossier = { ...updatedDossier, documents: updatedDossier.documents.map((d) => (d.id === document.id ? document : d)) };
    }
    try {
      this.repo.save(updatedDossier);
    } catch (saveError) {
      if (this.fileStorage && storedBlob?.createdNew && !(this.repo.hasDocumentReferencingBlob?.(storedBlob.storagePath, storedBlob.sha256) ?? false)) {
        try { this.fileStorage.deleteFile(storedBlob.storagePath); } catch { /* best effort */ }
      }
      throw saveError;
    }
    return { dossier: updatedDossier, document };
  }

  public verifyField(
    dossierId: string, documentId: string, verification: HumanVerificationInput, actor: AuthenticatedActor
  ): ContainerDossier {
    assertValidActor(actor);
    const dossier = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    const hasReadAndVerify = actor.tenantId === dossier.tenantId ||
      (() => { const acc = this.shareManager.checkAccess(dossier.id, dossier.tenantId, actor.tenantId); return acc.hasAccess && acc.scope === "READ_AND_VERIFY"; })();
    assertCanVerifyField(actor, dossier.tenantId, hasReadAndVerify);
    assertDossierMutable(dossier, "verify fields on");

    const docIndex = dossier.documents.findIndex((d) => d.id === documentId && !d.isSuperseded);
    if (docIndex === -1) throw new Error(`Active document '${documentId}' not found.`);

    const updatedDoc = this.hitlService.verifyOrCorrectField(dossier.documents[docIndex]!, verification, actor);
    const updatedDocuments = [...dossier.documents];
    updatedDocuments[docIndex] = updatedDoc;
    const updatedDossier: ContainerDossier = {
      ...dossier, lifecycleState: "HUMAN_VERIFICATION_REQUIRED", latestValidationResult: undefined, documents: updatedDocuments, updatedAt: new Date().toISOString(),
    };
    this.repo.save(updatedDossier);
    return updatedDossier;
  }

  public runValidation(dossierId: string, actor: AuthenticatedActor): ValidationRunResult { return executeValidation(dossierId, actor, this.repo, this.ruleEngine, this.auditLedger); }
  public approveForExport(dossierId: string, actor: AuthenticatedActor): ContainerDossier {
    const d = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    assertCanApproveOrExport(actor, d.tenantId, "approveForExport"); return executeApproveForExport(dossierId, actor, this.repo, this.auditLedger);
  }
  public exportDossier(dossierId: string, actor: AuthenticatedActor): DossierExportManifest {
    const d = this.repo.findRaw?.(dossierId) ?? this.repo.getOrThrow(dossierId, actor);
    assertCanApproveOrExport(actor, d.tenantId, "exportDossier"); return executeExportDossier(dossierId, actor, this.repo, this.auditLedger);
  }
  public getDossier(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined { assertValidActor(actor); return this.repo.findById(dossierId, actor); }
  public getRawDossier(dossierId: string): ContainerDossier | undefined { return this.repo.findRaw?.(dossierId); }
  public listDossiers(actor: AuthenticatedActor): readonly ContainerDossier[] { assertValidActor(actor); return this.repo.listForTenant(actor); }
  public getExportManifest(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined { assertValidActor(actor); return this.repo.getExportManifest?.(dossierId, actor); }
}
