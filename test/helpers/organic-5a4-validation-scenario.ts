import { expect } from "bun:test";
import { DURIOS_ORGANIC_DISCLAIMER } from "../../src/domain/pilot-types.js";
import type { createWorkspaceApp } from "../../src/server/server.js";
import { seedTestPilotActor } from "./auth-test-helper.js";

interface DossierCreatedPayload { data: { id: string } }
interface ErrorPayload { errorCode?: string }
interface OrganicCreatedPayload {
  evidence: Record<string, unknown> & {
    issuerClaimedStatus: string;
    duriosRecordStatus: string;
    regulatoryDisclaimer: string;
  };
}

export async function runOrganicStatusValidationScenario(
  app: ReturnType<typeof createWorkspaceApp>
): Promise<void> {
  const fixedNow = new Date("2026-10-14T12:00:00.000Z");
  app.workspace.organicEvidenceManager.setClock(() => fixedNow);

  const aClerk = seedTestPilotActor(app.authService, {
    tenantId: "TEN-A", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
  });

  const callHttp = (path: string, cookie: string, method = "GET", body?: unknown) =>
    app.handler(new Request(`http://127.0.0.1${path}`, {
      method, headers: { Cookie: cookie, "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));

  const createRes = await callHttp("/api/dossiers", aClerk.sessionCookie, "POST", {
    dossierCode: "DOS-5A4-ORG", containerNumber: "MSKU1234565", sealNumber: "SEAL-5A4",
  });
  const dossierId = ((await createRes.json()) as DossierCreatedPayload).data.id;

  const baseValidPayload = {
    certifierName: "Demo Bio-Inspect Agency (Synthetic)", certifierAccreditationNumber: "SYNTH-ACC-2026",
    certificateNumber: "SYNTH-CERT-001", standardCode: "USDA_NOP_EQUIVALENT",
    standardDescription: "Synthetic USDA Equivalent", certifiedScope: "Fresh Durian Lot Synthetic",
    validFrom: "2026-01-01T00:00:00.000Z", validTo: "2026-12-31T23:59:59.000Z",
    issuingDate: "2026-01-01", issuerClaimedStatus: "IN_CONVERSION",
  };

  const auditCountBefore = app.workspace.auditLedger.getEventsForDossier(dossierId, "TEN-A").length;

  for (const invalidPayload of [
    { ...baseValidPayload, duriosRecordStatus: "EVIDENCE_STORED_NOT_CERTIFIED" },
    { ...baseValidPayload, issuerClaimedStatus: "EXPIRED" },
    { ...baseValidPayload, issuerClaimedStatus: "SUSPENDED" },
    { ...baseValidPayload, validTo: "2026-10-14T11:59:59.000Z" },
    { ...baseValidPayload, validTo: fixedNow.toISOString() },
  ]) {
    const res = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aClerk.sessionCookie, "POST", invalidPayload);
    expect(res.status).toBe(422);
    expect(((await res.json()) as ErrorPayload).errorCode).toBe("INVALID_ORGANIC_EVIDENCE");
  }

  expect(app.workspace.organicEvidenceManager.listEvidenceForDossier(dossierId, true, "TEN-A").length).toBe(0);
  expect(app.workspace.auditLedger.getEventsForDossier(dossierId, "TEN-A").length).toBe(auditCountBefore);

  const okRes = await callHttp(`/api/dossiers/${dossierId}/organic-evidence`, aClerk.sessionCookie, "POST", baseValidPayload);
  expect(okRes.status).toBe(201);
  const okEv = ((await okRes.json()) as OrganicCreatedPayload).evidence;
  expect(okEv.issuerClaimedStatus).toBe("IN_CONVERSION");
  expect(okEv.duriosRecordStatus).toBe("EVIDENCE_STORED_NOT_CERTIFIED");
  expect(okEv.regulatoryDisclaimer).toBe(DURIOS_ORGANIC_DISCLAIMER);
  expect(okEv["status"]).toBeUndefined();
}
