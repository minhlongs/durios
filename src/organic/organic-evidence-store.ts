import type { ContainerDossier } from "../domain/types.js";
import type {
  DuriosOrganicRecordStatus,
  IssuerClaimedOrganicStatus,
  OrganicCertificationEvidence,
  OrganicStandardCode,
} from "../domain/pilot-types.js";
import type { SqliteClient } from "../storage/sqlite-client.js";
import { ensureDossierRowInSqlite } from "../sharing/share-grant-store.js";

export interface OrganicEvidenceRow {
  id: string;
  dossier_id: string;
  tenant_id: string;
  certifier_name: string;
  certifier_accreditation_number: string | null;
  certificate_number: string;
  standard_code: OrganicStandardCode;
  standard_description: string;
  certified_scope: string;
  valid_from: string;
  valid_to: string;
  issuing_date: string;
  issuer_claimed_status: IssuerClaimedOrganicStatus;
  durios_record_status: DuriosOrganicRecordStatus;
  evidence_document_id: string | null;
  source_document_url: string | null;
  regulatory_disclaimer: string;
  recorded_at: string;
  recorded_by: string;
}

export function mapRowToOrganicEvidence(row: OrganicEvidenceRow): OrganicCertificationEvidence {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    tenantId: row.tenant_id,
    certifierName: row.certifier_name,
    certifierAccreditationNumber: row.certifier_accreditation_number ?? undefined,
    certificateNumber: row.certificate_number,
    standardCode: row.standard_code,
    standardDescription: row.standard_description,
    certifiedScope: row.certified_scope,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    issuingDate: row.issuing_date,
    issuerClaimedStatus: row.issuer_claimed_status,
    duriosRecordStatus: row.durios_record_status,
    evidenceDocumentId: row.evidence_document_id ?? undefined,
    sourceDocumentUrl: row.source_document_url ?? undefined,
    regulatoryDisclaimer: row.regulatory_disclaimer,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by,
  };
}

export function insertOrganicEvidenceRow(
  client: SqliteClient,
  dossier: ContainerDossier,
  evidence: OrganicCertificationEvidence
): void {
  ensureDossierRowInSqlite(client, dossier);
  client.db.run(
    `INSERT INTO organic_evidence (
      id, dossier_id, tenant_id, certifier_name, certifier_accreditation_number,
      certificate_number, standard_code, standard_description, certified_scope,
      valid_from, valid_to, issuing_date, issuer_claimed_status, durios_record_status,
      evidence_document_id, source_document_url, regulatory_disclaimer, recorded_at, recorded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      evidence.id,
      evidence.dossierId,
      evidence.tenantId,
      evidence.certifierName,
      evidence.certifierAccreditationNumber ?? null,
      evidence.certificateNumber,
      evidence.standardCode,
      evidence.standardDescription,
      evidence.certifiedScope,
      evidence.validFrom,
      evidence.validTo,
      evidence.issuingDate,
      evidence.issuerClaimedStatus,
      evidence.duriosRecordStatus,
      evidence.evidenceDocumentId ?? null,
      evidence.sourceDocumentUrl ?? null,
      evidence.regulatoryDisclaimer,
      evidence.recordedAt,
      evidence.recordedBy,
    ]
  );
}

export function queryOrganicEvidenceByDossier(
  client: SqliteClient,
  dossierId: string,
  ownerTenantId?: string | undefined
): readonly OrganicCertificationEvidence[] {
  if (ownerTenantId) {
    return client.db
      .query<OrganicEvidenceRow, [string, string]>(
        "SELECT * FROM organic_evidence WHERE dossier_id = ? AND tenant_id = ? ORDER BY recorded_at ASC, id ASC"
      )
      .all(dossierId, ownerTenantId)
      .map(mapRowToOrganicEvidence);
  }
  return client.db
    .query<OrganicEvidenceRow, [string]>(
      "SELECT * FROM organic_evidence WHERE dossier_id = ? ORDER BY recorded_at ASC, id ASC"
    )
    .all(dossierId)
    .map(mapRowToOrganicEvidence);
}

export function queryOrganicEvidenceById(
  client: SqliteClient,
  evidenceId: string,
  ownerTenantId?: string | undefined
): OrganicCertificationEvidence | undefined {
  if (ownerTenantId) {
    const row = client.db
      .query<OrganicEvidenceRow, [string, string]>(
        "SELECT * FROM organic_evidence WHERE id = ? AND tenant_id = ?"
      )
      .get(evidenceId, ownerTenantId);
    return row ? mapRowToOrganicEvidence(row) : undefined;
  }
  const row = client.db
    .query<OrganicEvidenceRow, [string]>("SELECT * FROM organic_evidence WHERE id = ?")
    .get(evidenceId);
  return row ? mapRowToOrganicEvidence(row) : undefined;
}
