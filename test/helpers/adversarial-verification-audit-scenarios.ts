import { expect } from "bun:test";
import type { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import type { SqliteClient } from "../../src/storage/sqlite-client.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { CLERK, MANAGER, makePdf } from "./adversarial-verification-storage-scenarios.js";

export function runAuditPayloadTamperDetectionScenario(
  workspace: ContainerDossierWorkspace,
  client: SqliteClient,
  ledger: SqliteAuditLedger
): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-TAMPER-01",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-TAMPER-1",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  expect(ledger.verifyIntegrity()).toBe(true);

  client.db.run(
    `UPDATE audit_events SET payload_after = '{"tampered":"malicious"}' WHERE dossier_id = ?`,
    [dossier.id]
  );

  expect(ledger.verifyIntegrity()).toBe(false);
}

export function runAuditDeletionDetectionScenario(
  workspace: ContainerDossierWorkspace,
  client: SqliteClient,
  ledger: SqliteAuditLedger
): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-TAMPER-02",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-TAMPER-2",
      borderGate: "Huu Nghi",
      targetMarket: "CN",
      targetTemperatureC: 13.0,
      declaredNetWeightKg: 18000,
      declaredBoxCount: 900,
    },
    CLERK
  );

  ledger.recordEvent(CLERK, dossier.id, "DOSSIER_UPDATED", "CONTAINER_DOSSIER", dossier.id, null, {
    step: 2,
  });

  expect(ledger.verifyIntegrity()).toBe(true);

  const events = ledger.getEventsForDossier(dossier.id, CLERK.tenantId);
  expect(events.length).toBe(2);
  client.db.run(`DELETE FROM audit_events WHERE id = ?`, [events[0]!.id]);

  expect(ledger.verifyIntegrity()).toBe(false);
}

export function runAuditTamperBlocksExportScenario(
  workspace: ContainerDossierWorkspace,
  client: SqliteClient
): void {
  const dossier = workspace.createDossier(
    {
      dossierCode: "DOS-FAIL-CLOSED",
      containerNumber: "MSKU1234565",
      sealNumber: "SEAL-FC-001",
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
    makePdf("fc-pl"),
    "doc1.pdf",
    "PACKING_LIST",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-FC-001" } }
  );
  const { document: doc2 } = workspace.uploadDocument(
    dossier.id,
    makePdf("fc-phyto"),
    "doc2.pdf",
    "PHYTOSANITARY_CERTIFICATE",
    CLERK,
    { container_number: { raw: "MSKU1234565" }, seal_number: { raw: "SEAL-FC-001" } }
  );
  const { document: doc3 } = workspace.uploadDocument(
    dossier.id,
    makePdf("fc-lab"),
    "doc3.pdf",
    "LAB_TEST_REPORT",
    CLERK,
    { cadmium_mg_kg: { raw: "0.015" } }
  );

  for (const d of [doc1, doc2, doc3]) {
    for (const f of d.extractedFields) {
      workspace.verifyField(dossier.id, d.id, { fieldId: f.id, confirmedValue: f.rawValue }, CLERK);
    }
  }

  workspace.runValidation(dossier.id, CLERK);
  workspace.approveForExport(dossier.id, MANAGER);

  client.db.run(`UPDATE audit_events SET event_hash = 'bad-hash' WHERE dossier_id = ?`, [dossier.id]);

  expect(() => {
    workspace.exportDossier(dossier.id, MANAGER);
  }).toThrow(/Audit log tamper detection triggered/);
}
