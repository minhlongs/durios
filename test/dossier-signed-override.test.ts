import { describe, expect, it } from "bun:test";
import {
  OVERRIDE_ADMIN, OVERRIDE_CLERK, OVERRIDE_MANAGER, buildBlockedDossier,
} from "./helpers/blocked-dossier-fixture.js";

describe("Signed override past a cadmium blocker", () => {
  it("T-OV-01: a manager moves a blocked dossier to REVIEW_REQUIRED with a reason", () => {
    const { ws, dossierId } = buildBlockedDossier();
    expect(ws.getRawDossier(dossierId)!.lifecycleState).toBe("VALIDATION_BLOCKED");

    const updated = ws.overrideBlocker(dossierId, "Returned to supplier; certificate attached", OVERRIDE_MANAGER);

    expect(updated.lifecycleState).toBe("REVIEW_REQUIRED");
  });

  it("T-OV-02: the override keeps the cadmium finding as evidence on the dossier", () => {
    const { ws, dossierId } = buildBlockedDossier();
    const before = ws.runValidation(dossierId, OVERRIDE_CLERK);
    ws.overrideBlocker(dossierId, "Supplier certificate verified on site", OVERRIDE_MANAGER);

    const after = ws.getRawDossier(dossierId)!;
    expect(after.latestValidationResult?.findings.some((f) => f.ruleId === "RUL-CD-INTERNAL-BLOCK")).toBe(true);
    expect(before.criticalBlockers).toBeGreaterThan(0);
  });

  it("T-OV-03: the reason and signing actor land in the audit ledger", () => {
    const { ws, dossierId } = buildBlockedDossier();
    ws.overrideBlocker(dossierId, "Emergency release approved by QA", OVERRIDE_MANAGER);

    const events = ws.auditLedger.getEventsForDossier(dossierId, OVERRIDE_MANAGER.tenantId);
    const override = events.find((e) => e.eventType === "DOSSIER_BLOCKER_OVERRIDDEN");
    expect(override?.actorId).toBe(OVERRIDE_MANAGER.id);
    expect(JSON.stringify(override?.payloadAfter)).toContain("Emergency release approved by QA");
  });

  it("T-OV-04: a clerk cannot sign past the blocker", () => {
    const { ws, dossierId } = buildBlockedDossier();

    expect(() => ws.overrideBlocker(dossierId, "Clerk attempt", OVERRIDE_CLERK)).toThrow(/unauthorized|read-only|INSUFFICIENT/i);
    expect(ws.getRawDossier(dossierId)!.lifecycleState).toBe("VALIDATION_BLOCKED");
  });

  it("T-OV-05: an ADMIN with the manager persona is not a valid single signer", () => {
    const { ws, dossierId } = buildBlockedDossier();

    expect(() => ws.overrideBlocker(dossierId, "Admin attempt", OVERRIDE_ADMIN)).toThrow(/unauthorized|manager|single/i);
    expect(ws.getRawDossier(dossierId)!.lifecycleState).toBe("VALIDATION_BLOCKED");
  });

  it("T-OV-06: an empty or whitespace reason is refused", () => {
    const { ws, dossierId } = buildBlockedDossier();

    expect(() => ws.overrideBlocker(dossierId, "   ", OVERRIDE_MANAGER)).toThrow(/reason/i);
    expect(ws.getRawDossier(dossierId)!.lifecycleState).toBe("VALIDATION_BLOCKED");
  });

  it("T-OV-07: the override is refused once the dossier is approved and sealed", () => {
    const { ws, dossierId } = buildBlockedDossier();
    ws.overrideBlocker(dossierId, "QA release with supplier certificate", OVERRIDE_MANAGER);
    ws.approveForExport(dossierId, OVERRIDE_MANAGER);

    expect(() => ws.overrideBlocker(dossierId, "Second attempt", OVERRIDE_MANAGER)).toThrow();
  });

  /**
   * The override bumps the version like every other write. Returning the pre-save
   * object hands back a version the store has already moved past, so the operator's
   * next write is refused — proven here by using the returned version immediately.
   */
  it("T-OV-08: the override returns the version the store now holds", () => {
    const { ws, dossierId } = buildBlockedDossier();
    const updated = ws.overrideBlocker(dossierId, "Signed past the cadmium blocker", OVERRIDE_MANAGER);

    expect(updated.version).toBe(ws.getRawDossier(dossierId)!.version);
  });
});
