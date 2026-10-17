import { validateIso6346Container } from "../domain/iso-6346.js";
import type { AuthenticatedActor, DocumentType } from "../domain/types.js";
import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";

export interface RehearsalDossierSpec {
  readonly code: string;
  readonly prefix10: string;
  readonly seal: string;
  readonly docSeal: string;
  readonly verify: boolean;
  readonly scenario:
    | "CLEAN_READY"
    | "BLIND_FAULT_SEAL_MISMATCH"
    | "BLIND_FAULT_UNVERIFIED_EVIDENCE";
}

const CAILAY_REHEARSAL_SPECS: readonly RehearsalDossierSpec[] = [
  { code: "DOS-CAILAY-R01", prefix10: "CSQU305438", seal: "VN-SEAL-9001", docSeal: "VN-SEAL-9001", verify: true, scenario: "CLEAN_READY" },
  { code: "DOS-CAILAY-R02", prefix10: "MSCU601234", seal: "VN-SEAL-9002", docSeal: "VN-SEAL-9002", verify: true, scenario: "CLEAN_READY" },
  { code: "DOS-CAILAY-R03", prefix10: "MAEU712345", seal: "VN-SEAL-9003", docSeal: "VN-SEAL-9003", verify: true, scenario: "CLEAN_READY" },
  { code: "DOS-CAILAY-R04", prefix10: "CMAU823456", seal: "VN-SEAL-9004", docSeal: "VN-SEAL-9999", verify: true, scenario: "BLIND_FAULT_SEAL_MISMATCH" },
  { code: "DOS-CAILAY-R05", prefix10: "OOLU934567", seal: "VN-SEAL-9005", docSeal: "VN-SEAL-9005", verify: false, scenario: "BLIND_FAULT_UNVERIFIED_EVIDENCE" },
];

function buildValidContainerNumber(prefix10: string): string {
  const res = validateIso6346Container(`${prefix10}0`);
  return `${prefix10}${res.expectedCheckDigit ?? 0}`;
}

function pdfBytes(tag: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.5\n% DuriOS GATE-05 synthetic rehearsal: ${tag}\n%%EOF\n`);
}

function uploadAndOptionallyVerifyTriad(
  workspace: ContainerDossierWorkspace,
  dossierId: string,
  actor: AuthenticatedActor,
  sealInDoc: string,
  verifyAllFields: boolean
): void {
  const docs: ReadonlyArray<{
    type: DocumentType;
    fileName: string;
    fields: Record<string, { raw: string }>;
  }> = [
    {
      type: "PACKING_LIST",
      fileName: `PackingList-${dossierId}.pdf`,
      fields: {
        net_weight_kg: { raw: "18240" }, total_boxes: { raw: "960" },
        seal_number: { raw: sealInDoc }, PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" },
      },
    },
    {
      type: "LAB_TEST_REPORT",
      fileName: `LabReport-${dossierId}.pdf`,
      fields: {
        cadmium_mg_kg: { raw: "0.025" }, sample_code: { raw: `LAB-${dossierId}` }, sampling_date: { raw: "2026-10-10" },
      },
    },
    {
      type: "PHYTOSANITARY_CERTIFICATE",
      fileName: `Phyto-${dossierId}.pdf`,
      fields: {
        phyto_cert_no: { raw: `VN-PHYTO-${dossierId}` }, inspection_date: { raw: "2026-10-12" },
        PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" }, target_temperature_c: { raw: "14" },
      },
    },
  ];

  for (const spec of docs) {
    const { document } = workspace.uploadDocument(
      dossierId, pdfBytes(`${dossierId}-${spec.type}-${sealInDoc}`),
      spec.fileName, spec.type, actor, spec.fields
    );
    if (verifyAllFields) {
      for (const fld of document.extractedFields) {
        workspace.verifyField(dossierId, document.id, { fieldId: fld.id, confirmedValue: fld.rawValue }, actor);
      }
    }
  }
}

export function seedRehearsalDossiersForActor(
  workspace: ContainerDossierWorkspace,
  actor: AuthenticatedActor
): {
  readonly newlyCreatedCount: number;
  readonly dossiers: ReadonlyArray<{
    readonly id: string;
    readonly dossierCode: string;
    readonly containerNumber: string;
    readonly scenario: RehearsalDossierSpec["scenario"];
    readonly lifecycleState: string;
  }>;
} {
  const existingByCode = new Map(workspace.listDossiers(actor).map((d) => [d.dossierCode, d]));
  let newlyCreatedCount = 0;
  const seeded: Array<{
    readonly id: string; readonly dossierCode: string; readonly containerNumber: string;
    readonly scenario: RehearsalDossierSpec["scenario"]; readonly lifecycleState: string;
  }> = [];

  for (const s of CAILAY_REHEARSAL_SPECS) {
    let target = existingByCode.get(s.code);
    if (!target) {
      const created = workspace.createDossier(
        {
          dossierCode: s.code, containerNumber: buildValidContainerNumber(s.prefix10),
          sealNumber: s.seal, targetMarket: "CN", borderGate: "Hữu Nghị",
          targetTemperatureC: 14.0, declaredNetWeightKg: 18240, declaredBoxCount: 960,
        },
        actor
      );
      uploadAndOptionallyVerifyTriad(workspace, created.id, actor, s.docSeal, s.verify);
      if (s.verify) workspace.runValidation(created.id, actor);
      target = workspace.getDossier(created.id, actor) ?? created;
      newlyCreatedCount++;
    }
    seeded.push({
      id: target.id, dossierCode: target.dossierCode, containerNumber: target.containerNumber,
      scenario: s.scenario, lifecycleState: target.lifecycleState,
    });
  }
  return { newlyCreatedCount, dossiers: seeded };
}
