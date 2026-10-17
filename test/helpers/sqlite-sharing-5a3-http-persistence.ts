import { expect } from "bun:test";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";
import { createWorkspaceApp } from "../../src/server/server.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
import type { WorkspaceAppInstance } from "./sqlite-sharing-5a3-v4-upgrade.js";

interface DossierListPayload { data: Array<{ id: string }> }
interface DossierDetailPayload { data: { id: string; documents: Array<{ id: string; extractedFields: Array<{ id: string }> }> } }
interface EvidenceResponsePayload { evidence: { issuerClaimedStatus: string; duriosRecordStatus: string; regulatoryDisclaimer: string } }
interface EvidenceListPayload { evidence: Array<Record<string, unknown>> }
interface ShareGrantItem { id: string; isRevoked: boolean; revocationReason?: string; revokedBy?: string }
interface ShareGrantResponse { grant: ShareGrantItem }
interface ShareGrantsListResponse { grants: ShareGrantItem[] }

export async function runShareGrantsAndEvidencePersistenceScenario(
  testDb: string,
  testUploads: string,
  setApp: (app: WorkspaceAppInstance) => void
): Promise<void> {
  let app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);

  const aMgr = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" });
  const aClerk = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
  const bClerk = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
  const bViewer = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const bAuditor = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "INSPECTION_AUDITOR", role: "AUDITOR", persona: "SYSTEM_AUDITOR" });
  const cViewer = seedTestPilotActor(app.authService, { tenantId: "TEN-C", tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });

  const callHttp = (path: string, cookie: string, method = "GET", body?: unknown) =>
    app.handler(
      new Request(`http://127.0.0.1${path}`, {
        method,
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
    );

  // 1. Create dossier & upload document in TEN-A
  const createRes = await callHttp("/api/dossiers", aClerk.sessionCookie, "POST", {
    dossierCode: "DOS-5A3-001", containerNumber: "MSKU1234565", sealNumber: "SEAL-5A3",
  });
  expect(createRes.status).toBe(201);
  const dossierId = ((await createRes.json()) as DossierDetailPayload).data.id;

  const upRes = await callHttp(`/api/dossiers/${dossierId}/documents`, aClerk.sessionCookie, "POST", {
    fileName: "PackingList.pdf", documentType: "PACKING_LIST",
    base64Content: Buffer.from("%PDF-1.5 packing list 5a3").toString("base64"),
    fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-5A3" } },
  });
  expect(upRes.status).toBe(201);

  // 2. Record organic evidence with all optional and required fields
  const orgInput = {
    certifierName: "Demo Bio-Inspect Services (Synthetic)",
    certifierAccreditationNumber: "ISO-IEC-17065-DEMO-99",
    certificateNumber: "ORG-CERT-2026-888",
    standardCode: "EU_ORGANIC_2018_848",
    standardDescription: "EU Organic Regulation 2018/848",
    certifiedScope: "Fresh Durian Monthong & Ri6 — Lot 042",
    validFrom: "2026-01-15T00:00:00.000Z",
    validTo: "2027-01-14T23:59:59.000Z",
    issuingDate: "2026-01-15",
    issuerClaimedStatus: "CERTIFIED",
    evidenceDocumentId: "DOC-ORG-SCAN-01",
    sourceDocumentUrl: "https://demo-certifier.example/verify/ORG-CERT-2026-888",
  };
  const orgRes = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aClerk.sessionCookie, "POST", orgInput);
  expect(orgRes.status).toBe(201);
  const createdEvidence = ((await orgRes.json()) as EvidenceResponsePayload).evidence;
  expect(createdEvidence.issuerClaimedStatus).toBe("CERTIFIED");
  expect(createdEvidence.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(createdEvidence.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);

  // 3. Before sharing: TEN-B and TEN-C cannot see dossier in list or detail
  expect(((await (await callHttp("/api/dossiers", bViewer.sessionCookie, "GET")).json()) as DossierListPayload).data.length).toBe(0);
  expect((await callHttp(`/api/dossiers/${dossierId}`, bViewer.sessionCookie, "GET")).status).toBe(404);

  // 4. Grant READ_ONLY to TEN-B (grant #1), then restart SQLite and verify persistence
  const expIso = new Date(Date.now() + 3600_000).toISOString();
  const roGrantRes = await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", {
    granteeTenantId: "TEN-B", purpose: "LOGISTICS", scope: "READ_ONLY", expiresAt: expIso,
  });
  expect(roGrantRes.status).toBe(201);
  const roGrantId = ((await roGrantRes.json()) as ShareGrantResponse).grant.id;

  app.sqliteClient.close();
  app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);

  const orgListAfterRestart = ((await (await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aClerk.sessionCookie, "GET")).json()) as EvidenceListPayload).evidence;
  expect(orgListAfterRestart.length).toBe(1);
  expect(orgListAfterRestart[0]).toMatchObject({
    ...orgInput, duriosRecordStatus: "EVIDENCE_STORED_NOT_CERTIFIED", dossierId,
    tenantId: "TEN-A", regulatoryDisclaimer: DURIOS_ORGANIC_DISCLAIMER, recordedBy: aClerk.accountId,
  });

  const listB = ((await (await callHttp("/api/dossiers", bViewer.sessionCookie, "GET")).json()) as DossierListPayload).data;
  expect(listB.length).toBe(1);
  expect(listB[0]?.id).toBe(dossierId);

  const detailB = await callHttp(`/api/dossiers/${dossierId}`, bViewer.sessionCookie, "GET");
  expect(detailB.status).toBe(200);
  const detailData = ((await detailB.json()) as DossierDetailPayload).data;
  const docId = detailData.documents[0]!.id;
  const fieldId = detailData.documents[0]!.extractedFields[0]!.id;

  expect(((await (await callHttp("/api/dossiers", cViewer.sessionCookie, "GET")).json()) as DossierListPayload).data.length).toBe(0);
  expect((await callHttp(`/api/dossiers/${dossierId}`, cViewer.sessionCookie, "GET")).status).toBe(404);

  // 5. With only READ_ONLY grant, bClerk is denied verifyField (403) with zero side effects
  const auditBeforeDeniedVerify = app.workspace.auditLedger.getEventsForDossier(dossierId, "TEN-A").length;
  const deniedVerifyRes = await callHttp(`/api/dossiers/${dossierId}/documents/${docId}/fields/${fieldId}/verify`, bClerk.sessionCookie, "POST", { confirmedValue: "MSKU1234565" });
  expect(deniedVerifyRes.status).toBe(403);
  expect(app.workspace.auditLedger.getEventsForDossier(dossierId, "TEN-A").length).toBe(auditBeforeDeniedVerify);

  // 6. Query-order independence with multiple grants
  const rvGrantRes = await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", {
    granteeTenantId: "TEN-B", purpose: "CUSTOMS_INSPECTION", scope: "READ_AND_VERIFY", expiresAt: expIso,
  });
  expect(rvGrantRes.status).toBe(201);
  const rvGrantId = ((await rvGrantRes.json()) as ShareGrantResponse).grant.id;

  const roGrant2Res = await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", {
    granteeTenantId: "TEN-B", purpose: "BUYER_VERIFICATION", scope: "READ_ONLY", expiresAt: expIso,
  });
  expect(roGrant2Res.status).toBe(201);
  const roGrant2Id = ((await roGrant2Res.json()) as ShareGrantResponse).grant.id;

  expect((await callHttp(`/api/dossiers/${dossierId}/documents/${docId}/fields/${fieldId}/verify`, bViewer.sessionCookie, "POST", { confirmedValue: "MSKU1234565" })).status).toBe(403);
  expect((await callHttp(`/api/dossiers/${dossierId}/documents/${docId}/fields/${fieldId}/verify`, bAuditor.sessionCookie, "POST", { confirmedValue: "MSKU1234565" })).status).toBe(403);
  expect((await callHttp(`/api/dossiers/${dossierId}/documents/${docId}/fields/${fieldId}/verify`, bClerk.sessionCookie, "POST", { confirmedValue: "MSKU1234565" })).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dossierId}/validate`, bClerk.sessionCookie, "POST")).status).toBe(403);
  expect((await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, bClerk.sessionCookie, "POST", orgInput)).status).toBe(403);

  // 7. Revoke ONLY the READ_AND_VERIFY grant, restart SQLite, and verify
  const revRvRes = await callHttp(`/api/dossiers/${dossierId}/shares/${rvGrantId}/revoke`, aMgr.sessionCookie, "POST", { reason: "Verification phase finished" });
  expect(revRvRes.status).toBe(200);

  app.sqliteClient.close();
  app = createWorkspaceApp({ dbPath: testDb, dataDir: testUploads });
  setApp(app);

  const sharesListAfterRestart = ((await (await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "GET")).json()) as ShareGrantsListResponse).grants;
  const persistedRevokedGrant = sharesListAfterRestart.find((g) => g.id === rvGrantId)!;
  expect(persistedRevokedGrant.isRevoked).toBe(true);
  expect(persistedRevokedGrant.revocationReason).toBe("Verification phase finished");
  expect(persistedRevokedGrant.revokedBy).toBe(aMgr.accountId);

  expect((await callHttp(`/api/dossiers/${dossierId}`, bClerk.sessionCookie, "GET")).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dossierId}/documents/${docId}/fields/${fieldId}/verify`, bClerk.sessionCookie, "POST", { confirmedValue: "MSKU1234565" })).status).toBe(403);

  // 8. Revoke grant #1 and expire grant #3 -> TEN-B immediately loses read access
  await callHttp(`/api/dossiers/${dossierId}/shares/${roGrantId}/revoke`, aMgr.sessionCookie, "POST", { reason: "Revoke #1" });
  app.sqliteClient.db.run("UPDATE share_grants SET expires_at = ? WHERE id = ?", [new Date(Date.now() - 10_000).toISOString(), roGrant2Id]);

  expect(((await (await callHttp("/api/dossiers", bClerk.sessionCookie, "GET")).json()) as DossierListPayload).data.length).toBe(0);
  expect((await callHttp(`/api/dossiers/${dossierId}`, bClerk.sessionCookie, "GET")).status).toBe(404);
}
