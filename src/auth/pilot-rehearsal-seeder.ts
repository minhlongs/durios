import { validateIso6346Container } from "../domain/iso-6346.js";
import type { AuthenticatedActor, DocumentType } from "../domain/types.js";
import { createWorkspaceApp } from "../server/server.js";

export interface RehearsalSeedResult {
  readonly tenantId: string;
  readonly clerkUsername: string;
  readonly managerUsername: string;
  readonly clerkPilotToken: string;
  readonly managerPilotToken: string;
  readonly dossiers: ReadonlyArray<{
    readonly id: string;
    readonly dossierCode: string;
    readonly scenario: "CLEAN_READY" | "BLIND_FAULT_SEAL_MISMATCH" | "BLIND_FAULT_UNVERIFIED_EVIDENCE";
    readonly lifecycleState: string;
  }>;
}

function buildValidContainerNumber(prefix10: string): string {
  const res = validateIso6346Container(`${prefix10}0`);
  return `${prefix10}${res.expectedCheckDigit ?? 0}`;
}

function pdfBytes(tag: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.5\n% DuriOS GATE-05 synthetic rehearsal: ${tag}\n%%EOF\n`);
}

function uploadAndOptionallyVerifyTriad(
  workspace: ReturnType<typeof createWorkspaceApp>["workspace"],
  dossierId: string,
  actor: AuthenticatedActor,
  sealInDoc: string,
  verifyAllFields: boolean
): void {
  const docs: ReadonlyArray<{ type: DocumentType; fileName: string; fields: Record<string, { raw: string }> }> = [
    {
      type: "PACKING_LIST",
      fileName: `PackingList-${dossierId}.pdf`,
      fields: {
        net_weight_kg: { raw: "18240" }, total_boxes: { raw: "960" }, seal_number: { raw: sealInDoc },
        PUC: { raw: "VN-TG-ORCHARD-0042" }, PHC: { raw: "VN-TG-PACK-0018" },
      },
    },
    {
      type: "LAB_TEST_REPORT",
      fileName: `LabReport-${dossierId}.pdf`,
      fields: { cadmium_mg_kg: { raw: "0.025" }, sample_code: { raw: `LAB-${dossierId}` }, sampling_date: { raw: "2026-10-10" } },
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
      dossierId, pdfBytes(`${dossierId}-${spec.type}-${sealInDoc}`), spec.fileName, spec.type, actor, spec.fields
    );
    if (verifyAllFields) {
      for (const fld of document.extractedFields) {
        workspace.verifyField(dossierId, document.id, { fieldId: fld.id, confirmedValue: fld.rawValue }, actor);
      }
    }
  }
}

export function seedGate05PilotRehearsal(options: { dbPath?: string; dataDir?: string } = {}): RehearsalSeedResult {
  const app = createWorkspaceApp(options);
  try {
    const tenantId = "TENANT-CAILAY-PILOT-01";
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

    const clerkAcc = app.authService.provisionPilotAccount({
      id: "ACC-CAILAY-CLERK-01", username: "clerk.cailay", password: "PilotClerk#2026",
      phoneNumber: "+84901000111", actorName: "Nguyễn Thị Chứng Từ (Clerk)",
      tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "CLERK", persona: "PACKHOUSE_CLERK",
    });
    const managerAcc = app.authService.provisionPilotAccount({
      id: "ACC-CAILAY-MGR-01", username: "manager.cailay", password: "PilotManager#2026",
      phoneNumber: "+84901000222", actorName: "Trần Văn Quản Lý (Manager)",
      tenantId, tenantType: "PACKHOUSE_EXPORTER", role: "MANAGER", persona: "PACKHOUSE_MANAGER",
    });

    const clerkToken = app.authService.issueManagedPilotToken(clerkAcc.id, "CAILAY-CLERK-WS01", expiresAt);
    const managerToken = app.authService.issueManagedPilotToken(managerAcc.id, "CAILAY-MGR-WS01", expiresAt);
    const clerkActor = app.authService.authenticateToken(clerkToken.rawToken);

    const specs = [
      { code: "DOS-CAILAY-R01", prefix10: "CSQU305438", seal: "VN-SEAL-9001", docSeal: "VN-SEAL-9001", verify: true, scenario: "CLEAN_READY" as const },
      { code: "DOS-CAILAY-R02", prefix10: "MSCU601234", seal: "VN-SEAL-9002", docSeal: "VN-SEAL-9002", verify: true, scenario: "CLEAN_READY" as const },
      { code: "DOS-CAILAY-R03", prefix10: "MAEU712345", seal: "VN-SEAL-9003", docSeal: "VN-SEAL-9003", verify: true, scenario: "CLEAN_READY" as const },
      { code: "DOS-CAILAY-R04", prefix10: "CMAU823456", seal: "VN-SEAL-9004", docSeal: "VN-SEAL-9999", verify: true, scenario: "BLIND_FAULT_SEAL_MISMATCH" as const },
      { code: "DOS-CAILAY-R05", prefix10: "OOLU934567", seal: "VN-SEAL-9005", docSeal: "VN-SEAL-9005", verify: false, scenario: "BLIND_FAULT_UNVERIFIED_EVIDENCE" as const },
    ];

    const seededDossiers: Array<{
      id: string; dossierCode: string;
      scenario: "CLEAN_READY" | "BLIND_FAULT_SEAL_MISMATCH" | "BLIND_FAULT_UNVERIFIED_EVIDENCE";
      lifecycleState: string;
    }> = [];

    for (const s of specs) {
      const created = app.workspace.createDossier(
        {
          dossierCode: s.code, containerNumber: buildValidContainerNumber(s.prefix10),
          sealNumber: s.seal, targetMarket: "CN", borderGate: "Hữu Nghị",
          targetTemperatureC: 14.0, declaredNetWeightKg: 18240, declaredBoxCount: 960,
        },
        clerkActor
      );
      uploadAndOptionallyVerifyTriad(app.workspace, created.id, clerkActor, s.docSeal, s.verify);
      if (s.verify) app.workspace.runValidation(created.id, clerkActor);
      const updated = app.workspace.getDossier(created.id, clerkActor)!;
      seededDossiers.push({
        id: updated.id, dossierCode: updated.dossierCode,
        scenario: s.scenario, lifecycleState: updated.lifecycleState,
      });
    }

    return {
      tenantId, clerkUsername: clerkAcc.username, managerUsername: managerAcc.username,
      clerkPilotToken: clerkToken.rawToken, managerPilotToken: managerToken.rawToken,
      dossiers: seededDossiers,
    };
  } finally {
    app.sqliteClient.close();
  }
}

if (import.meta.main) {
  const res = seedGate05PilotRehearsal();
  process.stdout.write(`${JSON.stringify(res, null, 2)}\n`);
}
