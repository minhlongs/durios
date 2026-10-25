import type {
  AuditEvent,
  AuthenticatedActor,
  ContainerDossier,
  DossierExportManifest,
  ValidationRunResult,
} from "../domain/types.js";

/**
 * A validation run plus the version the store holds after it. Every mutating
 * request bumps the version, so the caller must learn the new one to keep
 * writing; returning only the result would leave the caller's copy stale.
 */
export interface ValidationRunOutcome {
  readonly result: ValidationRunResult;
  readonly version: number;
}

export interface CreateDossierInput {
  readonly dossierCode: string;
  readonly containerNumber: string;
  readonly sealNumber: string;
  readonly targetMarket: string;
  readonly borderGate: string;
  readonly targetTemperatureC: number;
  readonly declaredNetWeightKg: number;
  readonly declaredBoxCount: number;
}

export interface DossierRepositoryLike {
  /**
   * Persists the dossier and returns it with the version the store now holds. The
   * second argument is the version the caller believes is current; omitting it writes
   * without a precondition, which only the first save of a new dossier should do.
   */
  save(dossier: ContainerDossier, expectedVersion?: number): ContainerDossier;
  findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined;
  findRaw?(dossierId: string): ContainerDossier | undefined;
  hasDocumentReferencingBlob?(storagePath: string, sha256Hash: string): boolean;
  setAccessChecker?(checker: (dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean): void;
  getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier;
  listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[];
  saveExportManifest?(manifest: DossierExportManifest, actor: AuthenticatedActor): void;
  /**
   * Seals the dossier and records its manifest atomically, when the store supports
   * manifests at all. A store without manifests falls back to the plain save.
   */
  sealExport?(dossier: ContainerDossier, manifest: DossierExportManifest, actor: AuthenticatedActor, expectedVersion?: number): ContainerDossier;
  getExportManifest?(dossierId: string, actor: AuthenticatedActor): DossierExportManifest | undefined;
}

export interface AuditLedgerLike {
  recordEvent(
    actor: AuthenticatedActor,
    dossierId: string | null,
    eventType: string,
    entityType: string,
    entityId: string,
    payloadBefore: Record<string, unknown> | null,
    payloadAfter: Record<string, unknown> | null,
    forcedTimestamp?: string
  ): AuditEvent;
  getEventsForDossier(dossierId: string, tenantId: string): readonly AuditEvent[];
  getAllEvents(): readonly AuditEvent[];
  verifyIntegrity(): boolean;
}
