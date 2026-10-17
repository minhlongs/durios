import { expect } from "bun:test";
import { seedTestPilotActor } from "./auth-test-helper.js";
import {
  createHttpCaller, type DocumentDetailItem, type DossierDetailPayload,
  type GrantResponsePayload, type HttpCaller, makeDocPayloads,
  type SeededActor, type WorkspaceAppInstance,
} from "./rbac-and-tuples-5a2-tuples.js";

export interface RbacMatrixContext {
  app: WorkspaceAppInstance;
  callHttp: HttpCaller;
  aClerk: SeededActor;
  aMgr: SeededActor;
  aAdmin: SeededActor;
  aViewer: SeededActor;
  aAuditor: SeededActor;
  coopOfficer: SeededActor;
  bClerk: SeededActor;
  bMgr: SeededActor;
  bAdmin: SeededActor;
  bViewer: SeededActor;
  bAuditor: SeededActor;
  dosClerkId: string;
  dosMgrId: string;
  dosAdmId: string;
  d0: DocumentDetailItem;
  clerkDocs: ReturnType<typeof makeDocPayloads>;
}

export async function runRbacMatrixCreateUploadShareVerifySteps(
  app: WorkspaceAppInstance
): Promise<RbacMatrixContext> {
  const callHttp = createHttpCaller(app.handler);

  const aClerk = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
  const aMgr = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" });
  const aAdmin = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "ADMIN", persona: "PACKHOUSE_MANAGER" });
  const aViewer = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const aAuditor = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "AUDITOR", persona: "SYSTEM_AUDITOR" });
  const coopOfficer = seedTestPilotActor(app.authService, { tenantId: "TEN-COOP", tenantType: "ORCHARD_COOP", role: "MANAGER", persona: "ORCHARD_OFFICER" });

  const bClerk = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
  const bMgr = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" });
  const bAdmin = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "PACKHOUSE_EXPORTER", role: "ADMIN", persona: "PACKHOUSE_MANAGER" });
  const bViewer = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const bAuditor = seedTestPilotActor(app.authService, { tenantId: "TEN-B", tenantType: "INSPECTION_AUDITOR", role: "AUDITOR", persona: "SYSTEM_AUDITOR" });

  // 1. createDossier
  for (const denied of [aViewer, aAuditor, coopOfficer]) {
    const r = await callHttp("/api/dossiers", denied.sessionCookie, "POST", {
      dossierCode: "DOS-DENIED", containerNumber: "MSKU1234565", sealNumber: "S-1",
    });
    expect(r.status).toBe(403);
  }
  expect(app.workspace.listDossiers({ id: aClerk.accountId, name: "c", tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" }).length).toBe(0);

  const clerkDosRes = await callHttp("/api/dossiers", aClerk.sessionCookie, "POST", {
    dossierCode: "DOS-BY-CLERK", containerNumber: "MSKU1234565", sealNumber: "SEAL-C",
  });
  expect(clerkDosRes.status).toBe(201);
  const dosClerkId = ((await clerkDosRes.json()) as DossierDetailPayload).data.id;

  const mgrDosRes = await callHttp("/api/dossiers", aMgr.sessionCookie, "POST", {
    dossierCode: "DOS-BY-MGR", containerNumber: "MSKU1234565", sealNumber: "SEAL-M",
  });
  expect(mgrDosRes.status).toBe(201);
  const dosMgrId = ((await mgrDosRes.json()) as DossierDetailPayload).data.id;

  const admDosRes = await callHttp("/api/dossiers", aAdmin.sessionCookie, "POST", {
    dossierCode: "DOS-BY-ADMIN", containerNumber: "MSKU1234565", sealNumber: "SEAL-A",
  });
  expect(admDosRes.status).toBe(201);
  const dosAdmId = ((await admDosRes.json()) as DossierDetailPayload).data.id;

  // 2. uploadDocument
  const clerkDocs = makeDocPayloads("SEAL-C", "C");
  const preUploadAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aViewer, aAuditor, bAdmin, bClerk]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents`, denied.sessionCookie, "POST", clerkDocs[0])).status).toBe(403);
  }
  expect(app.workspace.getRawDossier(dosClerkId)?.documents.length).toBe(0);
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preUploadAudit);

  expect((await callHttp(`/api/dossiers/${dosClerkId}/documents`, aClerk.sessionCookie, "POST", clerkDocs[0])).status).toBe(201);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/documents`, aMgr.sessionCookie, "POST", clerkDocs[1])).status).toBe(201);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/documents`, aAdmin.sessionCookie, "POST", clerkDocs[2])).status).toBe(201);
  expect(app.workspace.getRawDossier(dosClerkId)?.documents.length).toBe(3);

  // 3. grantShare & revokeShare
  const shareBase = { granteeTenantId: "TEN-B", purpose: "CUSTOMS_INSPECTION", scope: "READ_ONLY", expiresAt: new Date(Date.now() + 3600_000).toISOString() };
  const preShareAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aClerk, aViewer, aAuditor, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/shares`, denied.sessionCookie, "POST", shareBase)).status).toBe(403);
  }
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preShareAudit);

  const mgrGrantRes = await callHttp(`/api/dossiers/${dosClerkId}/shares`, aMgr.sessionCookie, "POST", shareBase);
  expect(mgrGrantRes.status).toBe(201);
  const mgrGrantId = ((await mgrGrantRes.json()) as GrantResponsePayload).grant.id;

  for (const denied of [aClerk, aViewer, aAuditor, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/shares/${mgrGrantId}/revoke`, denied.sessionCookie, "POST", {})).status).toBe(403);
  }
  const mgrRevokeRes = await callHttp(`/api/dossiers/${dosClerkId}/shares/${mgrGrantId}/revoke`, aMgr.sessionCookie, "POST", { reason: "Mgr revoked" });
  expect(mgrRevokeRes.status).toBe(200);
  expect(((await mgrRevokeRes.json()) as GrantResponsePayload).grant.isRevoked).toBe(true);

  const admGrantRes = await callHttp(`/api/dossiers/${dosClerkId}/shares`, aAdmin.sessionCookie, "POST", shareBase);
  expect(admGrantRes.status).toBe(201);
  const admGrantId = ((await admGrantRes.json()) as GrantResponsePayload).grant.id;

  const admRevokeRes = await callHttp(`/api/dossiers/${dosClerkId}/shares/${admGrantId}/revoke`, aAdmin.sessionCookie, "POST", { reason: "Admin revoked" });
  expect(admRevokeRes.status).toBe(200);
  expect(((await admRevokeRes.json()) as GrantResponsePayload).grant.isRevoked).toBe(true);

  // 4. verifyField
  const detail1 = ((await (await callHttp(`/api/dossiers/${dosClerkId}`, aClerk.sessionCookie, "GET")).json()) as DossierDetailPayload).data;
  const [d0, d1, d2] = detail1.documents as [DocumentDetailItem, DocumentDetailItem, DocumentDetailItem];

  const roGrant = await callHttp(`/api/dossiers/${dosClerkId}/shares`, aMgr.sessionCookie, "POST", shareBase);
  const roGrantId = ((await roGrant.json()) as GrantResponsePayload).grant.id;
  const preVerifyAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aViewer, aAuditor, bClerk, bMgr, bAdmin, bViewer, bAuditor]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d0.id}/fields/${d0.extractedFields[0]!.id}/verify`, denied.sessionCookie, "POST", { confirmedValue: d0.extractedFields[0]!.rawValue })).status).toBe(403);
  }
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preVerifyAudit);
  await callHttp(`/api/dossiers/${dosClerkId}/shares/${roGrantId}/revoke`, aMgr.sessionCookie, "POST", {});

  for (const f of d0.extractedFields) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d0.id}/fields/${f.id}/verify`, aClerk.sessionCookie, "POST", { confirmedValue: f.rawValue })).status).toBe(200);
  }
  for (const f of d1.extractedFields) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d1.id}/fields/${f.id}/verify`, aMgr.sessionCookie, "POST", { confirmedValue: f.rawValue })).status).toBe(200);
  }
  for (const f of d2.extractedFields) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d2.id}/fields/${f.id}/verify`, aAdmin.sessionCookie, "POST", { confirmedValue: f.rawValue })).status).toBe(200);
  }

  expect((await callHttp(`/api/dossiers/${dosClerkId}/shares`, aAdmin.sessionCookie, "POST", { ...shareBase, scope: "READ_AND_VERIFY" })).status).toBe(201);
  for (const deniedPartner of [bViewer, bAuditor]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d0.id}/fields/${d0.extractedFields[0]!.id}/verify`, deniedPartner.sessionCookie, "POST", { confirmedValue: d0.extractedFields[0]!.rawValue })).status).toBe(403);
  }
  for (const allowedPartner of [bClerk, bMgr, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/documents/${d0.id}/fields/${d0.extractedFields[0]!.id}/verify`, allowedPartner.sessionCookie, "POST", { confirmedValue: d0.extractedFields[0]!.rawValue })).status).toBe(200);
  }
  expect((await callHttp(`/api/dossiers/${dosClerkId}/documents`, bAdmin.sessionCookie, "POST", clerkDocs[0])).status).toBe(403);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/validate`, bAdmin.sessionCookie, "POST")).status).toBe(403);

  return {
    app, callHttp, aClerk, aMgr, aAdmin, aViewer, aAuditor, coopOfficer,
    bClerk, bMgr, bAdmin, bViewer, bAuditor, dosClerkId, dosMgrId, dosAdmId, d0, clerkDocs,
  };
}
