import { expect } from "bun:test";
import type {
  StagingDossierView, StagingValidationView, WorkspaceAppInstance,
} from "./staging-dress-rehearsal-auth-step.js";

export async function runStagingLiveDossierKpiStep(
  siteA: WorkspaceAppInstance,
  clerkOtpCookie: string,
  mgrCookie: string,
  futureIso: string
): Promise<string> {
  const kpiStartMs = Date.now();
  const createRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/v1/dossiers", {
      method: "POST",
      headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        dossierCode: "DOS-CAILAY-LIVE-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-CAILAY-888",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
        declaredNetWeightKg: 18500, declaredBoxCount: 925,
      }),
    })
  );
  expect(createRes.status).toBe(201);
  const liveDossierId = ((await createRes.json()) as { data: { id: string } }).data.id;

  const liveDocs = [
    {
      fileName: "cailay-pl.pdf", documentType: "PACKING_LIST",
      base64Content: Buffer.from("%PDF-1.7 CAILAY-LIVE-PL-BYTES").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CAILAY-888" },
        net_weight_kg: { raw: "18500" }, box_count: { raw: "925" },
        buyer_name: { raw: "Synthetic Buyer Confidential Corp" },
      },
    },
    {
      fileName: "cailay-phyto.pdf", documentType: "PHYTOSANITARY_CERTIFICATE",
      base64Content: Buffer.from("%PDF-1.7 CAILAY-LIVE-PHYTO-BYTES").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CAILAY-888" },
        phyto_cert_number: { raw: "PHYTO-SYNTH-CAILAY-01" },
      },
    },
    {
      fileName: "cailay-lab.pdf", documentType: "LAB_TEST_REPORT",
      base64Content: Buffer.from("%PDF-1.7 CAILAY-LIVE-LAB-BYTES").toString("base64"),
      fixtureFields: {
        cadmium_mg_kg: { raw: "0.018" }, auramine_o_status: { raw: "NOT_DETECTED" },
        sample_code: { raw: "SMP-CAILAY-01" }, sampling_date: { raw: "2026-10-08" },
      },
    },
    {
      fileName: "cailay-invoice.pdf", documentType: "COMMERCIAL_INVOICE",
      base64Content: Buffer.from("%PDF-1.7 CAILAY-LIVE-INVOICE-BYTES").toString("base64"),
      fixtureFields: { invoice_value: { raw: "72000.00 USD" } },
    },
  ];

  for (const docPayload of liveDocs) {
    const upRes = await siteA.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/documents`, {
        method: "POST", headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" },
        body: JSON.stringify(docPayload),
      })
    );
    expect(upRes.status).toBe(201);
  }

  const liveFetchRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}`, { headers: { Cookie: clerkOtpCookie } })
  );
  const liveFetched = ((await liveFetchRes.json()) as { data: StagingDossierView }).data;

  for (const uploadedDoc of liveFetched.documents) {
    for (const f of uploadedDoc.extractedFields) {
      const verRes = await siteA.handler(
        new Request(
          `https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/documents/${uploadedDoc.id}/fields/${f.id}/verify`,
          {
            method: "POST", headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ confirmedValue: f.rawValue }),
          }
        )
      );
      expect(verRes.status).toBe(200);
    }
  }

  const liveValRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/validate`, {
      method: "POST", headers: { Cookie: clerkOtpCookie },
    })
  );
  expect(liveValRes.status).toBe(200);
  const liveValData = ((await liveValRes.json()) as { data: StagingValidationView }).data;
  expect(["PASSED", "REVIEW_REQUIRED"]).toContain(liveValData.status);
  expect(liveValData.criticalBlockers).toBe(0);
  expect(Date.now() - kpiStartMs).toBeLessThan(180_000);

  const orgRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/organic-evidence`, {
      method: "POST", headers: { Cookie: mgrCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        certifierName: "Demo Mekong Organic Certifier (Synthetic)",
        certificateNumber: "SYNTH-CAILAY-ORG-01", standardCode: "TCVN_11041",
        standardDescription: "TCVN 11041-2:2017 Organic Crops", certifiedScope: "Fresh Durian Ri6",
        validFrom: "2026-01-01T00:00:00.000Z", validTo: "2028-12-31T23:59:59.000Z",
        issuingDate: "2026-01-01", issuerClaimedStatus: "CERTIFIED",
      }),
    })
  );
  expect(orgRes.status).toBe(201);

  const appRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/approve`, {
      method: "POST", headers: { Cookie: mgrCookie },
    })
  );
  expect(appRes.status).toBe(200);

  const expRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/export`, {
      method: "POST", headers: { Cookie: mgrCookie },
    })
  );
  expect(expRes.status).toBe(200);

  const shareRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${liveDossierId}/shares`, {
      method: "POST", headers: { Cookie: mgrCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        granteeTenantId: "TENANT-BUYER-CN-01", purpose: "BUYER_VERIFICATION",
        scope: "READ_ONLY", expiresAt: futureIso,
      }),
    })
  );
  expect(shareRes.status).toBe(201);
  return liveDossierId;
}
