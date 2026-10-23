import { readFileSync } from "node:fs";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import { CONSENT_ATTESTATION_EVENT_TYPE } from "./consent-attestation-ledger.js";
import { createWorkspaceApp } from "../server/server.js";

export interface RecordConsentAttestationOptions {
  readonly dbPath?: string | undefined;
  readonly attestedBy: string;
  readonly consentPath?: string | undefined;
  readonly attestationSha256?: string | undefined;
  readonly siteCode?: string | undefined;
}

/**
 * Appends the auditor attestation as an audit-ledger event. This is the write half of
 * Option D: GATE-01 reads the event, so without this only tests could ever open it.
 */
export function recordConsentAttestationEvent(options: RecordConsentAttestationOptions): void {
  if (!options.consentPath || !options.attestedBy.trim()) return;
  const app = createWorkspaceApp({ dbPath: options.dbPath ?? "./data/durios.db" });
  try {
    app.workspace.auditLedger.recordEvent(
      { id: "ACC-FIELD-AUDITOR", name: options.attestedBy, role: "AUDITOR", tenantId: "TENANT-CAILAY", tenantType: "INSPECTION_AUDITOR", persona: "SYSTEM_AUDITOR" },
      null, CONSENT_ATTESTATION_EVENT_TYPE, "SITE_CONSENT", options.siteCode ?? "SITE-CAILAY-TIENGIANG-01",
      null, { attestedByName: options.attestedBy, consentSignedFilePath: options.consentPath, consentSha256: options.attestationSha256 ?? calculateSha256Of(options.consentPath) },
    );
  } finally {
    app.sqliteClient.close();
  }
}

function calculateSha256Of(path: string): string {
  return calculateSha256(readFileBytes(path));
}

function readFileBytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(path));
}
