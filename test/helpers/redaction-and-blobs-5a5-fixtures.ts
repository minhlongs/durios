import type { AuthenticatedActor, ContainerDossier } from "../../src/domain/types.js";
import type { FileStorageService } from "../../src/storage/file-storage-service.js";
import type { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import type { SqliteClient } from "../../src/storage/sqlite-client.js";
import type { SqliteDossierRepository } from "../../src/storage/sqlite-dossier-repository.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
export interface Redaction5A5Context {
  tempDir: string; dbPath: string; dataDir: string;
  client: SqliteClient; repo: SqliteDossierRepository;
  ledger: SqliteAuditLedger; fileStorage: FileStorageService;
  workspace: ContainerDossierWorkspace;
}
export interface DossierDocumentFieldPayload { id: string; fieldKey: string; rawValue: string }
export interface DossierDocumentPayload { id: string; storagePath?: string; extractedFields: DossierDocumentFieldPayload[] }
export interface DossierPayload {
  id: string; declaredNetWeightKg?: number; declaredBoxCount?: number;
  documents: DossierDocumentPayload[]; [key: string]: unknown;
}
export interface DossierDetailResponse { data: DossierPayload }
export interface DossierListOrDetailResponse { data: DossierPayload | DossierPayload[] }
export function createPdfBytes(tag: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4 Synthetic PDF Content [${tag}]`);
}
export function makeActor(
  tenantId: string,
  role: "CLERK" | "MANAGER" | "ADMIN" | "AUDITOR" | "VIEWER",
  id = `ACT-${tenantId}-${role}`
): AuthenticatedActor {
  const persona =
    role === "MANAGER" || role === "ADMIN" ? "PACKHOUSE_MANAGER"
      : role === "AUDITOR" ? "SYSTEM_AUDITOR"
      : role === "VIEWER" ? "BUYER_VIEWER"
      : "PACKHOUSE_CLERK";
  const tenantType =
    role === "AUDITOR" ? "INSPECTION_AUDITOR"
      : role === "VIEWER" ? "BUYER_IMPORTER"
      : "PACKHOUSE_EXPORTER";
  return { id, name: `User ${id}`, tenantId, tenantType, role, persona };
}
export function seedAndMakeActor(
  ws: ContainerDossierWorkspace,
  tenantId: string,
  role: "CLERK" | "MANAGER" | "ADMIN" | "AUDITOR" | "VIEWER"
) {
  const actor = makeActor(tenantId, role);
  const seeded = seedTestPilotActor(ws.authService, {
    id: actor.id, actorName: actor.name, tenantId: actor.tenantId,
    tenantType: actor.tenantType, role: actor.role, persona: actor.persona,
  });
  return { ...seeded, actor };
}
export function buildValidDossierReadyForValidation(
  ws: ContainerDossierWorkspace,
  actor: AuthenticatedActor,
  dossierCode: string
): ContainerDossier {
  const dossier = ws.createDossier({
    dossierCode, containerNumber: "MSKU1234565", sealNumber: "SEAL-VALID-01",
    targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
    declaredNetWeightKg: 18000, declaredBoxCount: 900,
  }, actor);
  const requiredDocs: Array<{
    type: "PACKING_LIST" | "LAB_TEST_REPORT" | "PHYTOSANITARY_CERTIFICATE";
    fields: Record<string, { raw: string }>;
  }> = [
    {
      type: "PACKING_LIST",
      fields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-VALID-01" },
        box_count: { raw: "900" }, net_weight_kg: { raw: "18000" },
      },
    },
    {
      type: "LAB_TEST_REPORT",
      fields: {
        cadmium_mg_kg: { raw: "0.028" }, sample_code: { raw: "SYNTH-LAB-2026-9081" }, sampling_date: { raw: "2026-10-06" },
      },
    },
    {
      type: "PHYTOSANITARY_CERTIFICATE",
      fields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-VALID-01" },
        phyto_cert_number: { raw: "SYNTH-KDTV-2026-09928" },
      },
    },
  ];
  for (const item of requiredDocs) {
    const { document } = ws.uploadDocument(
      dossier.id, createPdfBytes(`${dossierCode}-${item.type}`),
      `${item.type.toLowerCase()}.pdf`, item.type, actor, item.fields
    );
    for (const field of document.extractedFields) {
      ws.verifyField(dossier.id, document.id, { fieldId: field.id, confirmedValue: field.rawValue }, actor);
    }
  }
  return ws.getDossier(dossier.id, actor)!;
}
