import { expect } from "bun:test";
import type { createWorkspaceApp } from "../../src/server/server.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
interface DossierCreatedPayload { data: { id: string } }
interface ErrorPayload { errorCode?: string }
interface AuditPayload { data: { events: Array<{ dossierId: string; tenantId: string }> } }
interface OrganicListPayload { evidence: Array<{ issuerClaimedStatus: string; duriosRecordStatus: string }> }
interface ShareGrantPayload { grant: { id: string } }
interface DossierDetailPayload { data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> } }
export async function runSharePurposeMatrixScenario(app: ReturnType<typeof createWorkspaceApp>): Promise<void> {
  const aMgr = seedTestPilotActor(app.authService, { tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER" });
  const bBuyer = seedTestPilotActor(app.authService, { tenantId: "TEN-BUYER", tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const bLogistics = seedTestPilotActor(app.authService, { tenantId: "TEN-LOGISTICS", tenantType: "PACKHOUSE_EXPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const bCustoms = seedTestPilotActor(app.authService, { tenantId: "TEN-CUSTOMS", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
  const bAuditor = seedTestPilotActor(app.authService, { tenantId: "TEN-AUDIT", tenantType: "INSPECTION_AUDITOR", role: "AUDITOR", persona: "SYSTEM_AUDITOR" });
  const bUnshared = seedTestPilotActor(app.authService, { tenantId: "TEN-UNSHARED", tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER" });
  const callHttp = (path: string, cookie: string, method = "GET", body?: unknown) =>
    app.handler(new Request(`http://127.0.0.1${path}`, {
      method, headers: { Cookie: cookie, "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));
  const d1Res = await callHttp("/api/dossiers", aMgr.sessionCookie, "POST", { dossierCode: "DOS-5A4-P1", containerNumber: "MSKU1234565", sealNumber: "SEAL-P1" });
  const dossierId = ((await d1Res.json()) as DossierCreatedPayload).data.id;
  const d2Res = await callHttp("/api/dossiers", aMgr.sessionCookie, "POST", { dossierCode: "DOS-5A4-P2", containerNumber: "MSKU1234565", sealNumber: "SEAL-P2" });
  const otherDossierId = ((await d2Res.json()) as DossierCreatedPayload).data.id;
  await callHttp(`/api/dossiers/${dossierId}/documents`, aMgr.sessionCookie, "POST", {
    fileName: "PL.pdf", documentType: "PACKING_LIST",
    base64Content: Buffer.from("%PDF-1.5 pl 5a4").toString("base64"),
    fixtureFields: { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-P1" } },
  });
  await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aMgr.sessionCookie, "POST", {
    certifierName: "Demo Bio-Inspect Agency (Synthetic)",
    certificateNumber: "SYNTH-CERT-5A4", standardCode: "EU_ORGANIC_2018_848",
    standardDescription: "Synthetic EU Organic", certifiedScope: "Durian Lot 5A4",
    validFrom: "2026-01-01T00:00:00.000Z", validTo: "2027-12-31T23:59:59.000Z",
    issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
  });
  const ownerAuditRes = await callHttp(`/api/dossiers/${dossierId}/audit`, aMgr.sessionCookie, "GET");
  expect(ownerAuditRes.status).toBe(200);
  expect(((await ownerAuditRes.json()) as AuditPayload).data.events.length).toBeGreaterThanOrEqual(3);
  const ownerOrgRes = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aMgr.sessionCookie, "GET");
  expect(ownerOrgRes.status).toBe(200);
  expect(((await ownerOrgRes.json()) as OrganicListPayload).evidence.length).toBe(1);
  expect((await callHttp(`/api/dossiers/${dossierId}/audit`, bUnshared.sessionCookie, "GET")).status).toBe(404);
  expect((await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, bUnshared.sessionCookie, "GET")).status).toBe(404);
  expect((await callHttp("/api/dossiers/DOS-NONEXISTENT/audit", aMgr.sessionCookie, "GET")).status).toBe(404);
  const futureIso = new Date(Date.now() + 3600_000).toISOString();
  await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", { granteeTenantId: "TEN-LOGISTICS", purpose: "LOGISTICS", scope: "READ_ONLY", expiresAt: futureIso });
  await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", { granteeTenantId: "TEN-BUYER", purpose: "BUYER_VERIFICATION", scope: "READ_ONLY", expiresAt: futureIso });
  await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", { granteeTenantId: "TEN-CUSTOMS", purpose: "CUSTOMS_INSPECTION", scope: "READ_AND_VERIFY", expiresAt: futureIso });
  const auditGrantRes = await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", { granteeTenantId: "TEN-AUDIT", purpose: "AUDIT", scope: "READ_ONLY", expiresAt: futureIso });
  const auditGrantId = ((await auditGrantRes.json()) as ShareGrantPayload).grant.id;
  const logAuditRes = await callHttp(`/api/dossiers/${dossierId}/audit`, bLogistics.sessionCookie, "GET");
  expect(logAuditRes.status).toBe(403);
  expect(((await logAuditRes.json()) as ErrorPayload).errorCode).toBe("SHARE_PURPOSE_FORBIDDEN");
  const buyerAuditRes = await callHttp(`/api/dossiers/${dossierId}/audit`, bBuyer.sessionCookie, "GET");
  expect(buyerAuditRes.status).toBe(403);
  expect(((await buyerAuditRes.json()) as ErrorPayload).errorCode).toBe("SHARE_PURPOSE_FORBIDDEN");
  const customsAuditRes = await callHttp(`/api/dossiers/${dossierId}/audit`, bCustoms.sessionCookie, "GET");
  expect(customsAuditRes.status).toBe(200);
  const customsEvents = ((await customsAuditRes.json()) as AuditPayload).data.events;
  expect(customsEvents.length >= 4 && customsEvents.every((e) => e.dossierId === dossierId && e.tenantId === "TEN-A")).toBe(true);
  const d1Detail = ((await (await callHttp(`/api/dossiers/${dossierId}`, bCustoms.sessionCookie, "GET")).json()) as DossierDetailPayload).data;
  const [doc0, fld0] = [d1Detail.documents[0]!, d1Detail.documents[0]!.extractedFields[0]!];
  expect((await callHttp(`/api/dossiers/${dossierId}/documents/${doc0.id}/fields/${fld0.id}/verify`, bCustoms.sessionCookie, "POST", { confirmedValue: fld0.rawValue })).status).toBe(200);
  const auditorAuditRes = await callHttp(`/api/dossiers/${dossierId}/audit`, bAuditor.sessionCookie, "GET");
  expect(auditorAuditRes.status).toBe(200);
  const auditorEvents = ((await auditorAuditRes.json()) as AuditPayload).data.events;
  expect(auditorEvents.length >= 4 && auditorEvents.every((e) => e.dossierId === dossierId && e.tenantId === "TEN-A")).toBe(true);
  expect((await callHttp(`/api/dossiers/${otherDossierId}/audit`, bAuditor.sessionCookie, "GET")).status).toBe(404);
  expect((await callHttp(`/api/dossiers/${otherDossierId}/organic-evidence`, bAuditor.sessionCookie, "GET")).status).toBe(404);
  const logOrgRes = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, bLogistics.sessionCookie, "GET");
  expect(logOrgRes.status).toBe(403);
  expect(((await logOrgRes.json()) as ErrorPayload).errorCode).toBe("SHARE_PURPOSE_FORBIDDEN");
  for (const allowedCookie of [bBuyer.sessionCookie, bCustoms.sessionCookie, bAuditor.sessionCookie]) {
    const r = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, allowedCookie, "GET");
    expect(r.status).toBe(200);
    const evList = ((await r.json()) as OrganicListPayload).evidence;
    expect(evList.length).toBe(1);
    expect(evList[0]!.issuerClaimedStatus).toBe("CERTIFIED");
    expect(evList[0]!.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  }
  const extraBuyerGrantRes = await callHttp(`/api/dossiers/${dossierId}/shares`, aMgr.sessionCookie, "POST", {
    granteeTenantId: "TEN-LOGISTICS", purpose: "BUYER_VERIFICATION", scope: "READ_ONLY", expiresAt: futureIso,
  });
  const extraBuyerGrantId = ((await extraBuyerGrantRes.json()) as ShareGrantPayload).grant.id;
  expect((await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, bLogistics.sessionCookie, "GET")).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dossierId}/audit`, bLogistics.sessionCookie, "GET")).status).toBe(403);
  await callHttp(`/api/dossiers/${dossierId}/shares/${extraBuyerGrantId}/revoke`, aMgr.sessionCookie, "POST", {});
  expect((await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, bLogistics.sessionCookie, "GET")).status).toBe(403);
  await callHttp(`/api/dossiers/${dossierId}/shares/${auditGrantId}/revoke`, aMgr.sessionCookie, "POST", {});
  expect((await callHttp(`/api/dossiers/${dossierId}/audit`, bAuditor.sessionCookie, "GET")).status).toBe(404);
}
