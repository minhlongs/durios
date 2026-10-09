import type {
  ContainerDossier,
  DocumentType,
  DossierLifecycleState,
  ExtractedField,
  IngestedDocument,
  ValidationRunResult,
} from "../domain/types.js";

export interface DossierRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly dossier_code: string;
  readonly container_number: string;
  readonly seal_number: string;
  readonly target_market: string;
  readonly border_gate: string;
  readonly target_temperature_c: number;
  readonly declared_net_weight_kg: number | null;
  readonly declared_box_count: number | null;
  readonly lifecycle_state: string;
  readonly is_immutable: number;
  readonly export_sealed_at: string | null;
  readonly latest_validation_result: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface DocumentRow {
  readonly id: string;
  readonly dossier_id: string;
  readonly tenant_id: string;
  readonly document_type: string;
  readonly file_name: string;
  readonly file_size_bytes: number;
  readonly mime_type: string;
  readonly sha256_hash: string;
  readonly storage_path: string;
  readonly uploaded_at: string;
  readonly is_superseded: number;
}

export interface FieldRow {
  readonly id: string;
  readonly document_id: string;
  readonly dossier_id: string;
  readonly tenant_id: string;
  readonly field_key: string;
  readonly raw_value: string;
  readonly confirmed_value: string | null;
  readonly confidence: number;
  readonly bounding_box: string | null;
  readonly verification_status: string;
  readonly verified_by_actor_id: string | null;
  readonly verified_at: string | null;
}

function formatLabel(key: string): string {
  return key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function mapRowsToDossier(
  dossierRow: DossierRow,
  docRows: readonly DocumentRow[],
  fieldRows: readonly FieldRow[]
): ContainerDossier {
  const fieldsByDoc = new Map<string, ExtractedField[]>();
  for (const f of fieldRows) {
    const list = fieldsByDoc.get(f.document_id) ?? [];
    list.push({
      id: f.id,
      documentId: f.document_id,
      fieldKey: f.field_key,
      label: formatLabel(f.field_key),
      rawValue: f.raw_value,
      normalizedValue: f.confirmed_value ?? f.raw_value,
      confidenceScore: f.confidence,
      boundingBox: f.bounding_box ? JSON.parse(f.bounding_box) : { pageNumber: 1, x: 0, y: 0, width: 0, height: 0 },
      verificationStatus: f.verification_status as any,
      confirmedValue: f.confirmed_value ?? undefined,
      verifiedBy: f.verified_by_actor_id ?? undefined,
      verifiedAt: f.verified_at ?? undefined,
    });
    fieldsByDoc.set(f.document_id, list);
  }

  const documents: IngestedDocument[] = docRows.map((d) => ({
    id: d.id,
    dossierId: d.dossier_id,
    tenantId: d.tenant_id,
    documentType: d.document_type as DocumentType,
    fileName: d.file_name,
    fileSize: d.file_size_bytes,
    mimeType: d.mime_type,
    sha256Hash: d.sha256_hash,
    uploadedAt: d.uploaded_at,
    isSuperseded: Boolean(d.is_superseded),
    extractedFields: fieldsByDoc.get(d.id) ?? [],
  }));

  const validationResult: ValidationRunResult | undefined = dossierRow.latest_validation_result
    ? JSON.parse(dossierRow.latest_validation_result)
    : undefined;

  return {
    id: dossierRow.id,
    tenantId: dossierRow.tenant_id,
    dossierCode: dossierRow.dossier_code,
    containerNumber: dossierRow.container_number,
    sealNumber: dossierRow.seal_number,
    targetMarket: dossierRow.target_market as "CN",
    borderGate: dossierRow.border_gate,
    targetTemperatureC: dossierRow.target_temperature_c,
    declaredNetWeightKg: dossierRow.declared_net_weight_kg ?? undefined,
    declaredBoxCount: dossierRow.declared_box_count ?? undefined,
    lifecycleState: dossierRow.lifecycle_state as DossierLifecycleState,
    isImmutable: Boolean(dossierRow.is_immutable),
    createdAt: dossierRow.created_at,
    updatedAt: dossierRow.updated_at,
    exportSealedAt: dossierRow.export_sealed_at ?? undefined,
    latestValidationResult: validationResult,
    documents,
  };
}
