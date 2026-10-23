import { readFileSync } from "node:fs";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { AuditEvent } from "../domain/types.js";
import type { ConsentEvidenceReport } from "./consent-evidence-verifier.js";

/**
 * A consent attestation recorded in the audit ledger. Recording the attestation as a
 * chain-linked event makes it attributable and tamper-evident, which a plain caller
 * argument is not: an option can be set without a human act, an event cannot be
 * rewritten without breaking the audit chain GATE-03 verifies.
 */
export const CONSENT_ATTESTATION_EVENT_TYPE = "SITE_CONSENT_ATTESTED";

export interface RecordedConsentAttestation {
  readonly attestedByName: string;
  readonly attestedSha256: string;
  readonly attestedPath: string;
  readonly recordedAt: string;
  readonly eventId: string;
}

export function findRecordedConsentAttestation(
  events: readonly AuditEvent[]
): RecordedConsentAttestation | null {
  // Most recent first, so a re-attestation supersedes an earlier one.
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event?.eventType !== CONSENT_ATTESTATION_EVENT_TYPE) continue;
    const parsed = parseAttestationPayload(event.payloadAfter, event.id, event.timestamp);
    if (parsed) return parsed;
  }
  return null;
}

function parseAttestationPayload(
  payload: Record<string, unknown> | null, eventId: string, timestamp: string
): RecordedConsentAttestation | null {
  const name = typeof payload?.["attestedByName"] === "string" ? payload["attestedByName"].trim() : "";
  const sha = typeof payload?.["consentSha256"] === "string" ? payload["consentSha256"].trim() : "";
  const path = typeof payload?.["consentSignedFilePath"] === "string" ? payload["consentSignedFilePath"].trim() : "";
  if (!sha || !path) return null;
  return { attestedByName: name, attestedSha256: sha, attestedPath: path, recordedAt: timestamp, eventId };
}

export function attestationMatchesFile(attestation: RecordedConsentAttestation, path: string): boolean {
  if (attestation.attestedPath !== path) return false;
  return calculateSha256(readFileSync(path)).toLowerCase() === attestation.attestedSha256.toLowerCase();
}

export function recordedAttestationForFile(
  events: readonly AuditEvent[] | undefined, consentPath: string
): RecordedConsentAttestation | null {
  if (!events) return null;
  const found = findRecordedConsentAttestation(events);
  return found && attestationMatchesFile(found, consentPath) ? found : null;
}

export function consentPassFromLedger(consentPath: string, recorded: RecordedConsentAttestation): ConsentEvidenceReport {
  const by = recorded.attestedByName || "(chưa ghi tên)";
  return {
    passed: true,
    statusLabel: "PASS",
    detail: `Kiểm toán viên ${by} đã xác nhận biên bản chấp thuận đã ký tại '${consentPath}' trong sổ cái kiểm toán (sự kiện ${recorded.eventId}, SHA-256 khớp).`,
  };
}
