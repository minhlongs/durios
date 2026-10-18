import { expect } from "bun:test";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";

export async function createActiveAndRevokedShareGrants(
  baseUrl: string,
  dossierId: string,
  adminHeaders: Record<string, string>
): Promise<{ activeGrantId: string; revokedGrantId: string }> {
  const expiresAt = new Date(Date.now() + 86400_000).toISOString();
  const activeGrantRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/shares`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({
      granteeTenantId: "TENANT-CUSTOMS-RST", purpose: "CUSTOMS_INSPECTION", scope: "READ_ONLY", expiresAt,
    }),
  });
  expect(activeGrantRes.status).toBe(201);
  const activeGrantId = ((await activeGrantRes.json()) as { grant: { id: string } }).grant.id;

  const revokedGrantCreateRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/shares`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({
      granteeTenantId: "TENANT-BUYER-RST", purpose: "BUYER_VERIFICATION", scope: "READ_ONLY", expiresAt,
    }),
  });
  expect(revokedGrantCreateRes.status).toBe(201);
  const revokedGrantId = ((await revokedGrantCreateRes.json()) as { grant: { id: string } }).grant.id;

  const revokeRes = await fetch(
    `${baseUrl}/api/v1/dossiers/${dossierId}/shares/${revokedGrantId}/revoke`,
    { method: "POST", headers: adminHeaders, body: JSON.stringify({ reason: "Revoked prior to OS restart" }) }
  );
  expect(revokeRes.status).toBe(200);

  return { activeGrantId, revokedGrantId };
}

export async function verifyAndRecordOrganicAndSeal(
  baseUrl: string,
  dossierId: string,
  adminHeaders: Record<string, string>
): Promise<void> {
  const baseInvalidOrg = {
    standardCode: "TCVN_11041", standardDescription: "Vietnamese Organic Standard",
    certifiedScope: "Durian", issuerClaimedStatus: "CERTIFIED",
  };
  for (const badOrganic of [
    {
      ...baseInvalidOrg, certifierName: "Demo Organic Certifier (Synthetic)", certificateNumber: "SYNTH-EXP-01",
      validFrom: "2024-01-01T00:00:00.000Z", validTo: "2025-01-01T00:00:00.000Z", issuingDate: "2024-01-01",
    },
    {
      ...baseInvalidOrg, certifierName: "   ", certificateNumber: "SYNTH-MISSING-CERTIFIER",
      validFrom: "2026-01-01T00:00:00.000Z", validTo: "2028-01-01T00:00:00.000Z", issuingDate: "2026-01-01",
    },
    {
      ...baseInvalidOrg, certifierName: "Demo Organic Certifier (Synthetic)", certificateNumber: "",
      validFrom: "2026-01-01T00:00:00.000Z", validTo: "2028-01-01T00:00:00.000Z", issuingDate: "2026-01-01",
    },
  ]) {
    const badOrgRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/organic-evidence`, {
      method: "POST", headers: adminHeaders, body: JSON.stringify(badOrganic),
    });
    expect(badOrgRes.status).toBe(422);
    expect(((await badOrgRes.json()) as { errorCode: string }).errorCode).toBe("INVALID_ORGANIC_EVIDENCE");
  }

  const goodOrgRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/organic-evidence`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({
      certifierName: "Demo Bio-Inspect Agency (Synthetic)", certifierAccreditationNumber: "SYNTH-ACC-5A6",
      certificateNumber: "SYNTH-ORG-5A6-VALID", standardCode: "TCVN_11041",
      standardDescription: "TCVN 11041 Organic Agriculture", certifiedScope: "Fresh Durian",
      validFrom: "2026-01-01T00:00:00.000Z", validTo: "2028-12-31T23:59:59.000Z",
      issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
    }),
  });
  expect(goodOrgRes.status).toBe(201);
  const recordedEvidence = ((await goodOrgRes.json()) as {
    evidence: { issuerClaimedStatus: string; duriosRecordStatus: string; regulatoryDisclaimer: string };
  }).evidence;
  expect(recordedEvidence.issuerClaimedStatus).toBe("CERTIFIED");
  expect(recordedEvidence.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(recordedEvidence.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);

  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/validate`, { method: "POST", headers: adminHeaders })).status).toBe(200);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/approve`, { method: "POST", headers: adminHeaders })).status).toBe(200);
  expect((await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/export`, { method: "POST", headers: adminHeaders })).status).toBe(200);
}
