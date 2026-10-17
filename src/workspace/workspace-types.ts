import type {
  AuditEvent,
  AuthenticatedActor,
  ContainerDossier,
  DossierExportManifest,
} from "../domain/types.js";

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
  save(dossier: ContainerDossier): void;
  findById(dossierId: string, actor: AuthenticatedActor): ContainerDossier | undefined;
  findRaw?(dossierId: string): ContainerDossier | undefined;
  hasDocumentReferencingBlob?(storagePath: string, sha256Hash: string): boolean;
  setAccessChecker?(checker: (dossierId: string, ownerTenantId: string, actorTenantId: string) => boolean): void;
  getOrThrow(dossierId: string, actor: AuthenticatedActor): ContainerDossier;
  listForTenant(actor: AuthenticatedActor): readonly ContainerDossier[];
  saveExportManifest?(manifest: DossierExportManifest, actor: AuthenticatedActor): void;
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
