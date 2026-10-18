import { expect } from "bun:test";
import type {
  StagingDossierView, StagingValidationView, WorkspaceAppInstance,
} from "./staging-dress-rehearsal-auth-step.js";

export async function runStagingBlindFaultInjectionStep(
  siteA: WorkspaceAppInstance,
  clerkOtpCookie: string,
  mgrCookie: string
): Promise<void> {
  const blindCreateRes = await siteA.handler(
    new Request("https://durios-pilot.local/api/v1/dossiers", {
      method: "POST", headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        dossierCode: "DOS-CAILAY-BLIND-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-CAILAY-001",
        targetMarket: "CN", borderGate: "Huu Nghi", targetTemperatureC: 13.5,
        declaredNetWeightKg: 18000, declaredBoxCount: 900,
      }),
    })
  );
  expect(blindCreateRes.status).toBe(201);
  const blindDossierId = ((await blindCreateRes.json()) as { data: { id: string } }).data.id;

  const blindDocs = [
    {
      fileName: "blind-pl.pdf", documentType: "PACKING_LIST",
      base64Content: Buffer.from("%PDF-1.7 BLIND-PL-CONTENT").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CAILAY-001" },
        net_weight_kg: { raw: "18000" }, box_count: { raw: "900" },
      },
    },
    {
      fileName: "blind-phyto.pdf", documentType: "PHYTOSANITARY_CERTIFICATE",
      base64Content: Buffer.from("%PDF-1.7 BLIND-PHYTO-CONTENT").toString("base64"),
      fixtureFields: {
        container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-CAILAY-999-MISMATCH" },
        phyto_cert_number: { raw: "PHYTO-SYNTH-BLIND-01" },
      },
    },
    {
      fileName: "blind-lab.pdf", documentType: "LAB_TEST_REPORT",
      base64Content: Buffer.from("%PDF-1.7 BLIND-LAB-CONTENT").toString("base64"),
      fixtureFields: {
        cadmium_mg_kg: { raw: "0.015" }, auramine_o_status: { raw: "NOT_DETECTED" },
        sample_code: { raw: "SMP-BLIND-01" }, sampling_date: { raw: "2026-10-08" },
      },
    },
  ];

  for (const docPayload of blindDocs) {
    const upRes = await siteA.handler(
      new Request(`https://durios-pilot.local/api/v1/dossiers/${blindDossierId}/documents`, {
        method: "POST", headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" },
        body: JSON.stringify(docPayload),
      })
    );
    expect(upRes.status).toBe(201);
  }

  const blindFetchRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${blindDossierId}`, { headers: { Cookie: clerkOtpCookie } })
  );
  const blindFetched = ((await blindFetchRes.json()) as { data: StagingDossierView }).data;

  for (const uploadedDoc of blindFetched.documents) {
    for (const f of uploadedDoc.extractedFields) {
      const verRes = await siteA.handler(
        new Request(
          `https://durios-pilot.local/api/v1/dossiers/${blindDossierId}/documents/${uploadedDoc.id}/fields/${f.id}/verify`,
          { method: "POST", headers: { Cookie: clerkOtpCookie, "Content-Type": "application/json" }, body: JSON.stringify({ confirmedValue: f.rawValue }) }
        )
      );
      expect(verRes.status).toBe(200);
    }
  }

  const blindValRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${blindDossierId}/validate`, { method: "POST", headers: { Cookie: clerkOtpCookie } })
  );
  expect(blindValRes.status).toBe(200);
  const blindValData = ((await blindValRes.json()) as { data: StagingValidationView }).data;
  expect(blindValData.status === "BLOCKED" && blindValData.criticalBlockers > 0).toBe(true);

  const blindAfterValRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${blindDossierId}`, { headers: { Cookie: clerkOtpCookie } })
  );
  expect(((await blindAfterValRes.json()) as { data: StagingDossierView }).data.lifecycleState).toBe("VALIDATION_BLOCKED");

  const blockedApproveRes = await siteA.handler(
    new Request(`https://durios-pilot.local/api/v1/dossiers/${blindDossierId}/approve`, { method: "POST", headers: { Cookie: mgrCookie } })
  );
  expect(blockedApproveRes.status).toBeGreaterThanOrEqual(400);
}
