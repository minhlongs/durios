import { expect } from "bun:test";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";
import { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../../src/storage/sqlite-client.js";
import type { SealedRestartSetupState } from "./process-restart-sealed-setup-step.js";
export async function verifySealedDossierAfterRestart(
  baseUrl: string,
  dbPath: string,
  state: SealedRestartSetupState
): Promise<void> {
  const {
    dossierId, firstDocPayload, firstDocId, firstFieldId,
    activeGrantId, revokedGrantId, adminHeaders, customsHeaders, buyerHeaders,
  } = state;
  const sharesResAfter = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/shares`, { headers: adminHeaders });
  expect(sharesResAfter.status).toBe(200);
  const grantsAfter = ((await sharesResAfter.json()) as { grants: Array<{ id: string; isRevoked: boolean }> }).grants;
  expect(grantsAfter.find((g) => g.id === activeGrantId)?.isRevoked).toBe(false);
  expect(grantsAfter.find((g) => g.id === revokedGrantId)?.isRevoked).toBe(true);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}`, { headers: customsHeaders })).status).toBe(200);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/audit`, { headers: customsHeaders })).status).toBe(200);
  const customsOrgRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/organic-evidence`, { headers: customsHeaders });
  expect(customsOrgRes.status).toBe(200);
  const customsOrgJson = (await customsOrgRes.json()) as {
    evidence: Array<{ issuerClaimedStatus: string; duriosRecordStatus: string; regulatoryDisclaimer: string }>;
  };
  expect(customsOrgJson.evidence.length).toBe(1);
  expect(customsOrgJson.evidence[0]?.issuerClaimedStatus).toBe("CERTIFIED");
  expect(customsOrgJson.evidence[0]?.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(customsOrgJson.evidence[0]?.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}`, { headers: buyerHeaders })).status).toBe(404);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/organic-evidence`, { headers: buyerHeaders })).status).toBe(404);
  const auditBeforeRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/audit`, { headers: adminHeaders });
  const auditBeforeMutations = (await auditBeforeRes.json()) as { data: { isChainValid: boolean; count: number } };
  expect(auditBeforeMutations.data.isChainValid).toBe(true);
  const preSealedEventCount = auditBeforeMutations.data.count;
  const inspectClient1 = new SqliteClient({ dbPath });
  expect(new SqliteAuditLedger(inspectClient1).verifyIntegrity()).toBe(true);
  inspectClient1.close();
  for (const prefix of ["/api/dossiers", "/api/v1/dossiers"]) {
    const sealedUpload = await fetch(`${baseUrl}${prefix}/${dossierId}/documents`, {
      method: "POST", headers: adminHeaders, body: JSON.stringify(firstDocPayload),
    });
    expect(sealedUpload.status).toBe(409);
    expect(((await sealedUpload.json()) as { errorCode: string }).errorCode).toBe("DOSSIER_IMMUTABLE");
    const sealedVerify = await fetch(
      `${baseUrl}${prefix}/${dossierId}/documents/${firstDocId}/fields/${firstFieldId}/verify`,
      { method: "POST", headers: adminHeaders, body: JSON.stringify({ confirmedValue: "TAMPERED-VALUE" }) }
    );
    expect(sealedVerify.status).toBe(409);
    expect(((await sealedVerify.json()) as { errorCode: string }).errorCode).toBe("DOSSIER_IMMUTABLE");
    const sealedValidate = await fetch(`${baseUrl}${prefix}/${dossierId}/validate`, {
      method: "POST", headers: adminHeaders,
    });
    expect(sealedValidate.status).toBe(409);
    expect(((await sealedValidate.json()) as { errorCode: string }).errorCode).toBe("DOSSIER_IMMUTABLE");
    const sealedOrganic = await fetch(`${baseUrl}${prefix}/${dossierId}/organic-evidence`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({
        certifierName: "Demo Bio-Inspect Agency (Synthetic)", certificateNumber: "SYNTH-ORG-AFTER-SEAL",
        standardCode: "TCVN_11041", standardDescription: "TCVN 11041 Organic Agriculture",
        certifiedScope: "Fresh Durian", validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2028-12-31T23:59:59.000Z", issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
      }),
    });
    expect(sealedOrganic.status).toBe(409);
    expect(((await sealedOrganic.json()) as { errorCode: string }).errorCode).toBe("DOSSIER_IMMUTABLE");
  }
  const dossierAfterRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}`, { headers: adminHeaders });
  const dossierAfter = ((await dossierAfterRes.json()) as {
    data: {
      lifecycleState: string; isImmutable: boolean;
      documents: Array<{ extractedFields: Array<{ confirmedValue: string }> }>;
    };
  }).data;
  expect(dossierAfter.lifecycleState).toBe("EXPORTED");
  expect(dossierAfter.isImmutable).toBe(true);
  expect(dossierAfter.documents.length).toBe(3);
  expect(dossierAfter.documents[0]?.extractedFields[0]?.confirmedValue).toBe("MSKU1234565");
  const orgAfterRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/organic-evidence`, { headers: adminHeaders });
  expect(((await orgAfterRes.json()) as { evidence: Array<Record<string, unknown>> }).evidence.length).toBe(1);
  const auditAfterRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/audit`, { headers: adminHeaders });
  const auditAfterMutations = (await auditAfterRes.json()) as { data: { isChainValid: boolean; count: number } };
  expect(auditAfterMutations.data.isChainValid).toBe(true);
  expect(auditAfterMutations.data.count).toBe(preSealedEventCount);
  const inspectClient2 = new SqliteClient({ dbPath });
  expect(new SqliteAuditLedger(inspectClient2).verifyIntegrity()).toBe(true);
  inspectClient2.close();
}
