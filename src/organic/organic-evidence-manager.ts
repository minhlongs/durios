import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import { assertDossierMutable } from "../domain/dossier-fsm.js";
import { assertOwnerOperationalRole } from "../auth/rbac-policy.js";
import {
  type IssuerClaimedOrganicStatus, type OrganicCertificationEvidence, type OrganicStandardCode,
  DURIOS_ORGANIC_DISCLAIMER, DURIOS_ORGANIC_RECORD_STATUS,
} from "../domain/pilot-types.js";
import type { AuditLedgerLike } from "../workspace/workspace-types.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import {
  insertOrganicEvidenceRow, queryOrganicEvidenceByDossier, queryOrganicEvidenceById,
} from "./organic-evidence-store.js";

export class InvalidOrganicEvidenceError extends Error {
  public readonly status = 422 as const;
  public readonly code = "INVALID_ORGANIC_EVIDENCE" as const;
  constructor(message: string) { super(message); this.name = "InvalidOrganicEvidenceError"; }
}

export interface RecordOrganicEvidenceInput {
  readonly certifierName: string; readonly certifierAccreditationNumber?: string | undefined;
  readonly certificateNumber: string; readonly standardCode: OrganicStandardCode;
  readonly standardDescription: string; readonly certifiedScope: string;
  readonly validFrom: string; readonly validTo: string; readonly issuingDate: string;
  readonly issuerClaimedStatus: IssuerClaimedOrganicStatus;
  readonly evidenceDocumentId?: string | undefined; readonly sourceDocumentUrl?: string | undefined;
}

const VALID_ISSUER_STATUSES: readonly IssuerClaimedOrganicStatus[] = [
  "IN_CONVERSION", "CERTIFIED", "EXPIRED", "SUSPENDED",
];

export class OrganicEvidenceManager {
  private readonly client: SqliteClient;
  private clock: () => Date = () => new Date();

  constructor(client?: SqliteClient | undefined) {
    this.client = client ?? new SqliteClient({ dbPath: ":memory:", inMemory: true });
  }
  public setClock(clockFn: () => Date): void { this.clock = clockFn; }

  public recordEvidence(
    dossier: ContainerDossier,
    input: RecordOrganicEvidenceInput,
    actor: AuthenticatedActor,
    auditLedger?: AuditLedgerLike,
    referenceNow?: Date | string
  ): OrganicCertificationEvidence {
    assertOwnerOperationalRole(actor, dossier.tenantId, "recordOrganicEvidence");
    assertDossierMutable(dossier, "attach evidence to");
    const rawPayload = input as unknown as Record<string, unknown>;
    if (rawPayload && ("duriosRecordStatus" in rawPayload || "durios_record_status" in rawPayload)) throw new InvalidOrganicEvidenceError("Client is prohibited from supplying 'duriosRecordStatus'; DuriOS assigns 'EVIDENCE_STORED_NOT_CERTIFIED' exclusively.");
    if (rawPayload && "status" in rawPayload) throw new InvalidOrganicEvidenceError("Legacy field 'status' is no longer accepted; provide 'issuerClaimedStatus' only.");
    if (!input.certifierName?.trim()) throw new InvalidOrganicEvidenceError("Certifier name is required.");
    if (!input.certificateNumber?.trim()) throw new InvalidOrganicEvidenceError("Certificate number is required.");
    if (!VALID_ISSUER_STATUSES.includes(input.issuerClaimedStatus)) throw new InvalidOrganicEvidenceError(`Invalid issuerClaimedStatus '${String(input.issuerClaimedStatus)}'.`);
    if (input.issuerClaimedStatus === "EXPIRED" || input.issuerClaimedStatus === "SUSPENDED") throw new InvalidOrganicEvidenceError(`Cannot record organic evidence with issuerClaimedStatus '${input.issuerClaimedStatus}' as active proof.`);
    const [fromDate, toDate] = [new Date(input.validFrom), new Date(input.validTo)];
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || toDate <= fromDate) throw new InvalidOrganicEvidenceError("Certificate validTo date must be strictly after validFrom date.");
    const nowDate = referenceNow instanceof Date ? referenceNow : typeof referenceNow === "string" ? new Date(referenceNow) : this.clock();
    if (isNaN(nowDate.getTime())) throw new InvalidOrganicEvidenceError("Invalid reference clock timestamp.");
    if (toDate.getTime() <= nowDate.getTime()) throw new InvalidOrganicEvidenceError(`Cannot record expired organic evidence: validTo (${toDate.toISOString()}) must be strictly after current time (${nowDate.toISOString()}).`);
    const evidenceId = `ORG-${nowDate.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const evidence: OrganicCertificationEvidence = { id: evidenceId, dossierId: dossier.id, tenantId: dossier.tenantId, certifierName: input.certifierName.trim(), certifierAccreditationNumber: input.certifierAccreditationNumber?.trim(), certificateNumber: input.certificateNumber.trim(), standardCode: input.standardCode, standardDescription: input.standardDescription.trim(), certifiedScope: input.certifiedScope.trim(), validFrom: fromDate.toISOString(), validTo: toDate.toISOString(), issuingDate: input.issuingDate, issuerClaimedStatus: input.issuerClaimedStatus, duriosRecordStatus: DURIOS_ORGANIC_RECORD_STATUS, evidenceDocumentId: input.evidenceDocumentId, sourceDocumentUrl: input.sourceDocumentUrl, regulatoryDisclaimer: DURIOS_ORGANIC_DISCLAIMER, recordedAt: nowDate.toISOString(), recordedBy: actor.id };
    this.client.transaction(() => {
      insertOrganicEvidenceRow(this.client, dossier, evidence);
      auditLedger?.recordEvent(actor, dossier.id, "ORGANIC_EVIDENCE_RECORDED", "CONTAINER_DOSSIER", evidenceId, null, { certifierName: evidence.certifierName, certificateNumber: evidence.certificateNumber, standardCode: evidence.standardCode, issuerClaimedStatus: evidence.issuerClaimedStatus, duriosRecordStatus: evidence.duriosRecordStatus, validFrom: evidence.validFrom, validTo: evidence.validTo, disclaimerAccepted: true });
    });
    return evidence;
  }

  public listEvidenceForDossier(dossierId: string, hasDossierAccess: boolean, ownerTenantId?: string | undefined): readonly OrganicCertificationEvidence[] {
    return hasDossierAccess ? queryOrganicEvidenceByDossier(this.client, dossierId, ownerTenantId) : [];
  }

  public getEvidence(evidenceId: string, hasDossierAccess: boolean, ownerTenantId?: string | undefined): OrganicCertificationEvidence | undefined {
    return hasDossierAccess ? queryOrganicEvidenceById(this.client, evidenceId, ownerTenantId) : undefined;
  }
}
