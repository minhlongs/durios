import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createWorkspaceApp } from "../src/server/server.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { runFieldAuditorCli } from "../src/export/field-auditor-cli.js";

let DIR = "";

beforeEach(() => { DIR = mkdtempSync(join(tmpdir(), "gate01-ledger-test-")); });
const CONTENT = "Signed Cai Lay Packhouse Data Consent (91/2025/QH15)";
const AUDITOR_NAME = "Trần Văn Quản Lý";

function shaOf(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

describe("GATE-01 reads the attestation from the audit ledger", () => {
  afterEach(() => rmSync(DIR, { recursive: true, force: true }));

  it("opens only when a matching consent attestation event exists in the ledger", () => {
    mkdirSync(DIR, { recursive: true });
    const dbPath = join(DIR, "durios.db");
    const dataDir = join(DIR, "uploads");
    const consentPath = join(DIR, "signed-consent.pdf");
    writeFileSync(consentPath, CONTENT, "utf-8");
    const attestedSha = shaOf(CONTENT);

    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      app.workspace.auditLedger.recordEvent(
        { id: "ACC-AUDITOR-01", name: AUDITOR_NAME, role: "AUDITOR", tenantId: "TENANT-CAILAY", tenantType: "INSPECTION_AUDITOR", persona: "SYSTEM_AUDITOR" },
        null, "SITE_CONSENT_ATTESTED", "SITE_CONSENT", "SITE-CAILAY-TIENGIANG-01",
        null, { consentSignedFilePath: consentPath, consentSha256: attestedSha },
      );
    } finally {
      app.sqliteClient.close();
    }

    const report = verifySingleSiteLaunchGates({ dbPath, dataDir, consentSignedFilePath: consentPath });
    const gate01 = report.gates.find((g) => g.gateId === "GATE-01");
    expect(gate01?.passed).toBe(true);
  });
});

  it("stays closed when the attested file was replaced after the ledger event", () => {
    mkdirSync(DIR, { recursive: true });
    const dbPath = join(DIR, "durios.db");
    const dataDir = join(DIR, "uploads");
    const consentPath = join(DIR, "signed-consent.pdf");
    writeFileSync(consentPath, CONTENT, "utf-8");
    const attestedSha = shaOf(CONTENT);

    const app = createWorkspaceApp({ dbPath, dataDir });
    try {
      app.workspace.auditLedger.recordEvent(
        { id: "ACC-AUDITOR-01", name: AUDITOR_NAME, role: "AUDITOR", tenantId: "TENANT-CAILAY", tenantType: "INSPECTION_AUDITOR", persona: "SYSTEM_AUDITOR" },
        null, "SITE_CONSENT_ATTESTED", "SITE_CONSENT", "SITE-CAILAY-TIENGIANG-01",
        null, { attestedByName: AUDITOR_NAME, consentSignedFilePath: consentPath, consentSha256: attestedSha },
      );
    } finally {
      app.sqliteClient.close();
    }

    writeFileSync(consentPath, "replaced with something else", "utf-8");

    const report = verifySingleSiteLaunchGates({ dbPath, dataDir, consentSignedFilePath: consentPath });
    const gate01 = report.gates.find((g) => g.gateId === "GATE-01");
    expect(gate01?.passed).toBe(false);
  });

  it("stays closed when there is no attestation event in the ledger", () => {
    mkdirSync(DIR, { recursive: true });
    const dbPath = join(DIR, "durios.db");
    const dataDir = join(DIR, "uploads");
    const consentPath = join(DIR, "signed-consent.pdf");
    writeFileSync(consentPath, CONTENT, "utf-8");
    const report = verifySingleSiteLaunchGates({ dbPath, dataDir, consentSignedFilePath: consentPath });
    const gate01 = report.gates.find((g) => g.gateId === "GATE-01");
    expect(gate01?.passed).toBe(false);
    expect(gate01?.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
  });

  it("opens the gate after the field-auditor CLI records the attestation", () => {
    mkdirSync(DIR, { recursive: true });
    const dbPath = join(DIR, "durios.db");
    const dataDir = join(DIR, "uploads");
    const consentPath = join(DIR, "signed-consent.pdf");
    writeFileSync(consentPath, CONTENT, "utf-8");
    const attestedSha = shaOf(CONTENT);

    const before = verifySingleSiteLaunchGates({ dbPath, dataDir, consentSignedFilePath: consentPath });
    expect(before.gates.find((g) => g.gateId === "GATE-01")?.passed).toBe(false);

    runFieldAuditorCli({ dbPath, dataDir, consentSignedFilePath: consentPath, consentVerifiedBy: AUDITOR_NAME, consentAttestedSha256: attestedSha });

    const after = verifySingleSiteLaunchGates({ dbPath, dataDir, consentSignedFilePath: consentPath });
    const gate01 = after.gates.find((g) => g.gateId === "GATE-01");
    expect(gate01?.passed).toBe(true);
    expect(gate01?.detail).toContain(AUDITOR_NAME);
  });
