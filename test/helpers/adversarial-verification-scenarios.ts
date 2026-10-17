import { expect } from "bun:test";
import { resolveLocalActor } from "../../src/server/actor-resolver.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  runAuditDeletionDetectionScenario,
  runAuditPayloadTamperDetectionScenario,
  runAuditTamperBlocksExportScenario,
} from "./adversarial-verification-audit-scenarios.js";
import {
  runExportManifestIntegrityScenario,
  runLocalhostBindingAndMalformedRequestsScenario,
} from "./adversarial-verification-export-network-scenarios.js";
import { CLERK, makePdf } from "./adversarial-verification-storage-scenarios.js";

export {
  runAuditDeletionDetectionScenario,
  runAuditPayloadTamperDetectionScenario,
  runAuditTamperBlocksExportScenario,
  runExportManifestIntegrityScenario,
  runLocalhostBindingAndMalformedRequestsScenario,
};

export function runActorSpoofingRejectionScenario(workspace: ContainerDossierWorkspace): void {
  const spoofedReq = new Request("http://localhost/api/dossiers", {
    headers: { "x-actor-role": "ADMIN" },
  });
  expect(() => resolveLocalActor(spoofedReq, workspace.authService)).toThrow();

  workspace.authService.provisionPilotAccount({
    id: "ACT-SEC5-CLERK",
    username: "sec5.clerk",
    password: "Password#Sec5",
    actorName: "Nguyen Van A (Clerk)",
    tenantId: "TENANT-LOCAL-001",
    tenantType: "PACKHOUSE_EXPORTER",
    role: "CLERK",
    persona: "PACKHOUSE_CLERK",
  });
  workspace.authService.provisionPilotAccount({
    id: "ACT-SEC5-MGR",
    username: "sec5.mgr",
    password: "Password#Sec5",
    actorName: "Tran Thi B (Manager)",
    tenantId: "TENANT-LOCAL-001",
    tenantType: "PACKHOUSE_EXPORTER",
    role: "MANAGER",
    persona: "PACKHOUSE_MANAGER",
  });

  const clerkSess = workspace.authService.loginWithPassword("sec5.clerk", "Password#Sec5");
  const mgrSess = workspace.authService.loginWithPassword("sec5.mgr", "Password#Sec5");

  const reqWithClerk = new Request("http://localhost/api/dossiers", {
    headers: { Authorization: `Bearer ${clerkSess.sessionToken}`, "x-actor-role": "ADMIN" },
  });
  const actor1 = resolveLocalActor(reqWithClerk, workspace.authService);
  expect(actor1.role).toBe("CLERK");
  expect(actor1.name).toBe("Nguyen Van A (Clerk)");

  const reqWithMgr = new Request("http://localhost/api/dossiers", {
    headers: { Authorization: `Bearer ${mgrSess.sessionToken}`, "x-actor-role": "CLERK" },
  });
  const actor2 = resolveLocalActor(reqWithMgr, workspace.authService);
  expect(actor2.role).toBe("MANAGER");
  expect(actor2.name).toBe("Tran Thi B (Manager)");
}

export function runClerkRoleApprovalGateScenario(workspace: ContainerDossierWorkspace): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-ROLE-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-ROLE-1",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  const { document: doc1 } = workspace.uploadDocument(
    dossier.id,
    makePdf("role-pl"),
    "doc1.pdf",
    "PACKING_LIST",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-ROLE-1" } }
  );
  const { document: doc2 } = workspace.uploadDocument(
    dossier.id,
    makePdf("role-phyto"),
    "doc2.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-ROLE-1" } }
  );
  const { document: doc3 } = workspace.uploadDocument(
    dossier.id,
    makePdf("role-lab"),
    "doc3.pdf",
    "LAB_TEST_REPORT",
    CLERK,
    { cadmium_mg_kg: { raw: "0.020" } }
  );

  for (const d of [doc1, doc2, doc3]) {
    for (const f of d.extractedFields) {
      workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  workspace.runValidation(dossier.id, CLERK);

  expect(() => {
    workspace.approveForExport(dossier.id, CLERK);
  }).toThrow(/Clerk role is unauthorized/);
}
