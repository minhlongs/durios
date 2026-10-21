import { expect } from "bun:test";
import { startLocalServer } from "../../src/server/server.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { CLERK, MANAGER, makePdf } from "./adversarial-verification-storage-scenarios.js";
export function runExportManifestIntegrityScenario(workspace: ContainerDossierWorkspace): void {
  const dossier = workspace.createDossier({ dossierCode: "DOS-EXP-INT-01", containerNumber: "MSKU1234565", sealNumber: "SEAL-EXP-1", borderGate: "Huu Nghi", targetMarket: "CN", targetTemperatureC: 13.0, declaredNetWeightKg: 18000, declaredBoxCount: 900 }, CLERK);
  const { document: docP } = workspace.uploadDocument(dossier.id, makePdf("exp-pl"), "docP.pdf", "PACKING_LIST", CLERK, { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-EXP-1" } });
  const { document: docY } = workspace.uploadDocument(dossier.id, makePdf("exp-phyto"), "docY.pdf", "PHYTOSANITARY_CERTIFICATE", CLERK, { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-EXP-1" } });
  const { document: docL } = workspace.uploadDocument(dossier.id, makePdf("exp-lab"), "docL.pdf", "LAB_TEST_REPORT", CLERK, { cadmium_mg_kg: { raw: "0.020" } });
  for (const d of [docP, docY, docL]) { for (const f of d.extractedFields) { workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK); } }
  workspace.runValidation(dossier.id, CLERK);
  workspace.approveForExport(dossier.id, MANAGER);
  const manifest = workspace.exportDossier(dossier.id, MANAGER);
  expect(manifest.compositeManifestSha256).toBeDefined();
  expect(manifest.compositeManifestSha256.length).toBe(64);
  expect(manifest.regulatoryDisclaimers.length).toBeGreaterThan(0);
  expect(manifest.regulatoryDisclaimers[1]).toContain("does NOT constitute official customs clearance");
  expect(manifest.regulatoryDisclaimers[2]).toContain("Clearance authority resides exclusively with the General Administration of Customs");
  expect(manifest.documents.length).toBe(3);
  for (const doc of manifest.documents) { expect(doc.sha256Hash.length).toBe(64); }
}
export async function runLocalhostBindingAndMalformedRequestsScenario(dbPath: string, dataDir: string): Promise<void> {
  const serverInstance = startLocalServer({ port: 31099, dbPath, dataDir });
  try {
    expect(serverInstance.url).toContain("127.0.0.1:31099");
    const healthRes = await fetch("http://127.0.0.1:31099/api/health");
    expect(healthRes.status).toBe(200);
    serverInstance.authService.provisionPilotAccount({ id: "ACT-SEC8-CLERK", username: "sec8.clerk", password: "Password#Sec8", actorName: "Clerk Sec8", tenantId: "TENANT-LOCAL-001", tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK" });
    const clerkSession = serverInstance.authService.loginWithPassword("sec8.clerk", "Password#Sec8");
    const authHeader = { Authorization: `Bearer ${clerkSession.sessionToken}` };
    const badJsonRes = await fetch("http://127.0.0.1:31099/api/dossiers", { method: "POST", headers: { "Content-Type": "application/json", ...authHeader }, body: "{ broken json..." });
    expect(badJsonRes.status).toBe(400);
    const badJsonData = (await badJsonRes.json()) as { error: string };
    expect(badJsonData.error).toContain("Invalid JSON");
    const notFoundRes = await fetch("http://127.0.0.1:31099/api/nonexistent", { headers: authHeader });
    expect(notFoundRes.status).toBe(404);
  } finally { serverInstance.stop(); }
}
