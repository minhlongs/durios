import { expect } from "bun:test";
import { SqliteAuthService } from "../../src/auth/sqlite-auth-service.js";
import { SqliteClient } from "../../src/storage/sqlite-client.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
import { createActiveAndRevokedShareGrants, verifyAndRecordOrganicAndSeal } from "./process-restart-sealed-organic-step.js";
export interface SealedRestartActorsHeaders {
  adminHeaders: Record<string, string>; customsHeaders: Record<string, string>; buyerHeaders: Record<string, string>;
}
export interface SealedRestartSetupState extends SealedRestartActorsHeaders {
  dossierId: string; firstDocPayload: Record<string, unknown>;
  firstDocId: string; firstFieldId: string; activeGrantId: string; revokedGrantId: string;
}
export function seedSealedRestartActors(dbPath: string): SealedRestartActorsHeaders {
  const seedClient = new SqliteClient({ dbPath });
  const seedAuth = new SqliteAuthService(seedClient);
  const ownerAdmin = seedTestPilotActor(seedAuth, {
    id: "ACT-OWNER-ADM-RST", username: "owner.admin.rst", tenantId: "TENANT-LOCAL-001",
    tenantType: "PACKHOUSE_EXPORTER", role: "ADMIN", persona: "PACKHOUSE_MANAGER",
  });
  const partnerCustoms = seedTestPilotActor(seedAuth, {
    id: "ACT-PARTNER-CUST-RST", username: "partner.cust.rst", tenantId: "TENANT-CUSTOMS-RST",
    tenantType: "INSPECTION_AUDITOR", role: "AUDITOR", persona: "SYSTEM_AUDITOR",
  });
  const partnerBuyer = seedTestPilotActor(seedAuth, {
    id: "ACT-PARTNER-BUYER-RST", username: "partner.buyer.rst", tenantId: "TENANT-BUYER-RST",
    tenantType: "BUYER_IMPORTER", role: "VIEWER", persona: "BUYER_VIEWER",
  });
  seedClient.close();
  return {
    adminHeaders: { "Content-Type": "application/json", Authorization: `Bearer ${ownerAdmin.sessionToken}` },
    customsHeaders: { Authorization: `Bearer ${partnerCustoms.sessionToken}` },
    buyerHeaders: { Authorization: `Bearer ${partnerBuyer.sessionToken}` },
  };
}
export async function setupSealedDossierBeforeRestart(baseUrl: string, headers: SealedRestartActorsHeaders): Promise<SealedRestartSetupState> {
  const { adminHeaders } = headers;
  const createRes = await fetch(`${baseUrl}/api/v1/dossiers`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({
      dossierCode: "DOS-RESTART-5A6-SEAL", containerNumber: "MSKU1234565", sealNumber: "SEAL-RST-5A6",
      borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 13.5,
      declaredNetWeightKg: 18400, declaredBoxCount: 920,
    }),
  });
  expect(createRes.status).toBe(201);
  const dossierId = ((await createRes.json()) as { data: { id: string } }).data.id;
  const docs: Array<Record<string, unknown>> = [
    {
      fileName: "pl_5a6.pdf", documentType: "PACKING_LIST",
      base64Content: Buffer.from("%PDF-1.5 PackingList 5A6").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-RST-5A6" },
        net_weight_kg: { raw: "18400" }, box_count: { raw: "920" }, invoice_value: { raw: "52000 USD" },
      },
    },
    {
      fileName: "lab_5a6.pdf", documentType: "LAB_TEST_REPORT",
      base64Content: Buffer.from("%PDF-1.5 LabReport 5A6").toString("base64"),
      fixtureFields: {
        cadmium_mg_kg: { raw: "0.021" }, auramine_o_status: { raw: "NOT_DETECTED" },
        sample_code: { raw: "SMP-5A6-01" }, sampling_date: { raw: "2026-10-08" },
      },
    },
    {
      fileName: "phyto_5a6.pdf", documentType: "PHYTOSANITARY_CERTIFICATE",
      base64Content: Buffer.from("%PDF-1.5 Phyto 5A6").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-RST-5A6" },
        phyto_cert_number: { raw: "PHYTO-SYNTH-5A6" },
      },
    },
  ];
  for (const d of docs) {
    const uRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}/documents`, {
      method: "POST", headers: adminHeaders, body: JSON.stringify(d),
    });
    expect(uRes.status).toBe(201);
  }
  const detailRes = await fetch(`${baseUrl}/api/v1/dossiers/${dossierId}`, { headers: adminHeaders });
  const detailBeforeVerify = ((await detailRes.json()) as {
    data: { documents: Array<{ id: string; extractedFields: Array<{ id: string; rawValue: string }> }> };
  }).data;
  const [firstDocId, firstFieldId] = [detailBeforeVerify.documents[0]!.id, detailBeforeVerify.documents[0]!.extractedFields[0]!.id];
  for (const doc of detailBeforeVerify.documents) {
    for (const f of doc.extractedFields) {
      const vRes = await fetch(
        `${baseUrl}/api/v1/dossiers/${dossierId}/documents/${doc.id}/fields/${f.id}/verify`,
        { method: "POST", headers: adminHeaders, body: JSON.stringify({ confirmedValue: f.rawValue }) }
      );
      expect(vRes.status).toBe(200);
    }
  }
  const { activeGrantId, revokedGrantId } = await createActiveAndRevokedShareGrants(baseUrl, dossierId, adminHeaders);
  await verifyAndRecordOrganicAndSeal(baseUrl, dossierId, adminHeaders);
  return {
    ...headers, dossierId, firstDocPayload: docs[0]!,
    firstDocId, firstFieldId, activeGrantId, revokedGrantId,
  };
}
