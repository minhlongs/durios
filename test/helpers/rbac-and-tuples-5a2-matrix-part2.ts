import { expect } from "bun:test";
import type { RbacMatrixContext } from "./rbac-and-tuples-5a2-matrix-part1.js";
import {
  type DossierDetailPayload,
  type ErrorCodePayload,
  makeDocPayloads,
} from "./rbac-and-tuples-5a2-tuples.js";

export async function runRbacMatrixOrganicApproveExportSealedSteps(
  ctx: RbacMatrixContext
): Promise<void> {
  const {
    app, callHttp, aClerk, aMgr, aAdmin, aViewer, aAuditor,
    bClerk, bMgr, bAdmin, dosClerkId, dosMgrId, dosAdmId, d0, clerkDocs,
  } = ctx;

  // 5. recordOrganicEvidence & runValidation
  const makeOrgPayload = (num: string) => ({
    certifierName: "Demo Bio-Inspect Agency (Synthetic)", certificateNumber: num, standardCode: "TCVN_11041",
    standardDescription: "TCVN", certifiedScope: "Durian", validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2027-12-31T23:59:59.000Z", issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
  });

  const preOrgAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aViewer, aAuditor, bClerk, bMgr, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/organic-evidence`, denied.sessionCookie, "POST", makeOrgPayload("DENIED"))).status).toBe(403);
    expect((await callHttp(`/api/dossiers/${dosClerkId}/validate`, denied.sessionCookie, "POST")).status).toBe(403);
  }
  expect(app.workspace.organicEvidenceManager.listEvidenceForDossier(dosClerkId, true).length).toBe(0);
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preOrgAudit);

  expect((await callHttp(`/api/dossiers/${dosClerkId}/organic-evidence`, aClerk.sessionCookie, "POST", makeOrgPayload("CERT-C"))).status).toBe(201);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/organic-evidence`, aMgr.sessionCookie, "POST", makeOrgPayload("CERT-M"))).status).toBe(201);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/organic-evidence`, aAdmin.sessionCookie, "POST", makeOrgPayload("CERT-A"))).status).toBe(201);
  expect(app.workspace.organicEvidenceManager.listEvidenceForDossier(dosClerkId, true).length).toBe(3);

  expect((await callHttp(`/api/dossiers/${dosClerkId}/validate`, aClerk.sessionCookie, "POST")).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/validate`, aMgr.sessionCookie, "POST")).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dosClerkId}/validate`, aAdmin.sessionCookie, "POST")).status).toBe(200);

  // 6. approveForExport & exportDossier
  const preApproveAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aClerk, aViewer, aAuditor, bMgr, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/approve`, denied.sessionCookie, "POST")).status).toBe(403);
  }
  expect(app.workspace.getRawDossier(dosClerkId)?.lifecycleState).toBe("READY_FOR_REVIEW");
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preApproveAudit);

  // 6a. MANAGER approves and MANAGER exports on dosClerkId
  expect((await callHttp(`/api/dossiers/${dosClerkId}/approve`, aMgr.sessionCookie, "POST")).status).toBe(200);
  const preExportAudit = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const denied of [aClerk, aViewer, aAuditor, bMgr, bAdmin]) {
    expect((await callHttp(`/api/dossiers/${dosClerkId}/export`, denied.sessionCookie, "POST")).status).toBe(403);
  }
  expect(app.workspace.getRawDossier(dosClerkId)?.isImmutable).toBe(false);
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(preExportAudit);

  const mgrExportRes = await callHttp(`/api/dossiers/${dosClerkId}/export`, aMgr.sessionCookie, "POST");
  expect(mgrExportRes.status).toBe(200);
  expect(((await mgrExportRes.json()) as DossierDetailPayload).data.lifecycleState).toBe("EXPORTED");

  // 6b. Prepare dosAdmId -> ADMIN approves (200) and ADMIN exports (200)
  for (const docPayload of makeDocPayloads("SEAL-A", "A")) {
    expect((await callHttp(`/api/dossiers/${dosAdmId}/documents`, aAdmin.sessionCookie, "POST", docPayload)).status).toBe(201);
  }
  const admDetail = ((await (await callHttp(`/api/dossiers/${dosAdmId}`, aAdmin.sessionCookie, "GET")).json()) as DossierDetailPayload).data;
  for (const doc of admDetail.documents) {
    for (const f of doc.extractedFields) {
      expect((await callHttp(`/api/dossiers/${dosAdmId}/documents/${doc.id}/fields/${f.id}/verify`, aAdmin.sessionCookie, "POST", { confirmedValue: f.rawValue })).status).toBe(200);
    }
  }
  expect((await callHttp(`/api/dossiers/${dosAdmId}/validate`, aAdmin.sessionCookie, "POST")).status).toBe(200);
  expect((await callHttp(`/api/dossiers/${dosAdmId}/approve`, aAdmin.sessionCookie, "POST")).status).toBe(200);
  const admExportRes = await callHttp(`/api/dossiers/${dosAdmId}/export`, aAdmin.sessionCookie, "POST");
  expect(admExportRes.status).toBe(200);
  expect(((await admExportRes.json()) as DossierDetailPayload).data.lifecycleState).toBe("EXPORTED");

  // 7. Sealed dossier invariants (409 DOSSIER_IMMUTABLE with 0 side effects)
  const sealedAuditCount = app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length;
  for (const res of [
    await callHttp(`/api/dossiers/${dosClerkId}/documents`, aAdmin.sessionCookie, "POST", clerkDocs[0]),
    await callHttp(`/api/dossiers/${dosClerkId}/documents/${d0.id}/fields/${d0.extractedFields[0]!.id}/verify`, aAdmin.sessionCookie, "POST", { confirmedValue: "TAMPER" }),
    await callHttp(`/api/dossiers/${dosClerkId}/validate`, aAdmin.sessionCookie, "POST"),
    await callHttp(`/api/dossiers/${dosClerkId}/organic-evidence`, aAdmin.sessionCookie, "POST", makeOrgPayload("CERT-SEALED")),
  ]) {
    expect(res.status).toBe(409);
    expect(((await res.json()) as ErrorCodePayload).errorCode).toBe("DOSSIER_IMMUTABLE");
  }
  expect(app.workspace.auditLedger.getEventsForDossier(dosClerkId, "TEN-A").length).toBe(sealedAuditCount);
  expect(dosMgrId).toBeDefined();
}
