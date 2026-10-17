import { describe, expect, it } from "bun:test";
import {
  assertCanCreateContainerDossier,
  assertValidIdentityTuple,
  isValidIdentityTuple,
} from "../src/auth/rbac-policy.js";
import {
  assertCanApproveOrExport,
  assertCanRecordOrganicEvidence,
  assertCanUploadDocument,
  assertCanVerifyField,
} from "../src/auth/rbac-persona-assertions.js";
import type { AuthenticatedActor } from "../src/domain/types.js";

function makeActor(
  persona: AuthenticatedActor["persona"],
  tenantType: AuthenticatedActor["tenantType"],
  role: AuthenticatedActor["role"],
  tenantId = "TENANT-TEST-001"
): AuthenticatedActor {
  return {
    id: `ACTOR-${persona}-${role}`,
    name: `Test Actor ${persona}`,
    tenantId,
    tenantType,
    role,
    persona,
  };
}

describe("Tri-Tuple Persona RBAC Matrix (ProductPersona x TenantType x UserRole)", () => {
  it("validates permissible identity tuples according to PRD v1.0 section 5.2.3", () => {
    expect(isValidIdentityTuple("ORCHARD_OFFICER", "ORCHARD_COOP", "CLERK")).toBe(true);
    expect(isValidIdentityTuple("ORCHARD_OFFICER", "ORCHARD_COOP", "MANAGER")).toBe(true);
    expect(isValidIdentityTuple("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK")).toBe(true);
    expect(isValidIdentityTuple("PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "MANAGER")).toBe(true);
    expect(isValidIdentityTuple("PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "ADMIN")).toBe(true);
    expect(isValidIdentityTuple("BUYER_VIEWER", "BUYER_IMPORTER", "VIEWER")).toBe(true);
    expect(isValidIdentityTuple("SYSTEM_AUDITOR", "INSPECTION_AUDITOR", "AUDITOR")).toBe(true);
  });

  it("strictly rejects forbidden identity tuples with zero fallback", () => {
    expect(isValidIdentityTuple("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "MANAGER")).toBe(false);
    expect(isValidIdentityTuple("PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "CLERK")).toBe(false);
    expect(isValidIdentityTuple("BUYER_VIEWER", "ORCHARD_COOP", "CLERK")).toBe(false);
    expect(isValidIdentityTuple("SYSTEM_AUDITOR", "BUYER_IMPORTER", "AUDITOR")).toBe(false);
    expect(isValidIdentityTuple("ORCHARD_OFFICER", "PACKHOUSE_EXPORTER", "CLERK")).toBe(false);

    expect(() =>
      assertValidIdentityTuple("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "MANAGER")
    ).toThrow("Invalid identity tuple");
  });

  it("enforces dossier creation boundaries by persona and tenant type", () => {
    const packhouseClerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK");
    const packhouseMgr = makeActor("PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "MANAGER");
    const orchardOfficer = makeActor("ORCHARD_OFFICER", "ORCHARD_COOP", "MANAGER");
    const buyerViewer = makeActor("BUYER_VIEWER", "BUYER_IMPORTER", "VIEWER");

    expect(() => assertCanCreateContainerDossier(packhouseClerk)).not.toThrow();
    expect(() => assertCanCreateContainerDossier(packhouseMgr)).not.toThrow();
    expect(() => assertCanCreateContainerDossier(orchardOfficer)).toThrow(
      "not permitted to create packhouse container dossiers"
    );
    expect(() => assertCanCreateContainerDossier(buyerViewer)).toThrow("read-only and prohibited");
  });

  it("enforces document upload rights strictly for packhouse actors in owning tenant", () => {
    const clerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK", "TENANT-001");
    const otherTenantClerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK", "TENANT-002");
    const orchardOfficer = makeActor("ORCHARD_OFFICER", "ORCHARD_COOP", "CLERK", "TENANT-001");
    const auditor = makeActor("SYSTEM_AUDITOR", "INSPECTION_AUDITOR", "AUDITOR", "TENANT-001");

    expect(() => assertCanUploadDocument(clerk, "TENANT-001")).not.toThrow();
    expect(() => assertCanUploadDocument(otherTenantClerk, "TENANT-001")).toThrow("Cross-tenant");
    expect(() => assertCanUploadDocument(orchardOfficer, "TENANT-001")).toThrow(
      "not permitted to upload packhouse export documents"
    );
    expect(() => assertCanUploadDocument(auditor, "TENANT-001")).toThrow("read-only and prohibited");
  });

  it("enforces field verification rights with scope checks", () => {
    const clerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK", "TENANT-001");
    const buyer = makeActor("BUYER_VIEWER", "BUYER_IMPORTER", "VIEWER", "TENANT-BUYER");
    const foreignClerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK", "TENANT-002");

    expect(() => assertCanVerifyField(clerk, "TENANT-001", true)).not.toThrow();
    expect(() => assertCanVerifyField(buyer, "TENANT-001", true)).toThrow("read-only and prohibited");
    expect(() => assertCanVerifyField(foreignClerk, "TENANT-001", false)).toThrow("READ_AND_VERIFY");
    expect(() => assertCanVerifyField(foreignClerk, "TENANT-001", true)).not.toThrow();
  });

  it("restricts export approval and sealing strictly to PACKHOUSE_MANAGER", () => {
    const mgr = makeActor("PACKHOUSE_MANAGER", "PACKHOUSE_EXPORTER", "MANAGER", "TENANT-001");
    const clerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK", "TENANT-001");
    const orchardMgr = makeActor("ORCHARD_OFFICER", "ORCHARD_COOP", "MANAGER", "TENANT-001");

    expect(() => assertCanApproveOrExport(mgr, "TENANT-001", "approveForExport")).not.toThrow();
    expect(() => assertCanApproveOrExport(mgr, "TENANT-001", "exportDossier")).not.toThrow();
    expect(() => assertCanApproveOrExport(clerk, "TENANT-001", "approveForExport")).toThrow(
      "Clerk role is unauthorized"
    );
    const nonPackhouseMgr = makeActor("ORCHARD_OFFICER", "PACKHOUSE_EXPORTER" as unknown as AuthenticatedActor["tenantType"], "MANAGER", "TENANT-001");
    expect(() => assertCanApproveOrExport(nonPackhouseMgr, "TENANT-001", "approveForExport")).toThrow(
      "Invalid identity tuple"
    );
    expect(() => assertCanApproveOrExport(orchardMgr, "TENANT-001", "approveForExport")).toThrow(
      "not permitted to execute 'approveForExport'"
    );
    expect(() => assertCanApproveOrExport(mgr, "TENANT-OTHER", "approveForExport")).toThrow(
      "Cross-tenant 'approveForExport' is prohibited"
    );
  });

  it("allows both packhouse and orchard co-op actors to record organic evidence", () => {
    const orchardClerk = makeActor("ORCHARD_OFFICER", "ORCHARD_COOP", "CLERK");
    const packhouseClerk = makeActor("PACKHOUSE_CLERK", "PACKHOUSE_EXPORTER", "CLERK");
    const buyer = makeActor("BUYER_VIEWER", "BUYER_IMPORTER", "VIEWER");

    expect(() => assertCanRecordOrganicEvidence(orchardClerk)).not.toThrow();
    expect(() => assertCanRecordOrganicEvidence(packhouseClerk)).not.toThrow();
    expect(() => assertCanRecordOrganicEvidence(buyer)).toThrow("read-only and prohibited");
  });
});
