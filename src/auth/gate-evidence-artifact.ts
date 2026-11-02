import { existsSync, readFileSync, statSync } from "node:fs";
import { calculateSha256 } from "../ingestion/document-hasher.js";

/** Files above this size are not hashed on every gate run; the declaration is still recorded. */
export const EVIDENCE_ARTIFACT_HASH_LIMIT_BYTES = 25 * 1024 * 1024;
export const EVIDENCE_ARTIFACT_TOO_LARGE = "NOT_HASHED_FILE_TOO_LARGE";

export interface EvidenceArtifact {
  readonly filePath: string;
  readonly exists: boolean;
  readonly isFile: boolean;
  readonly bytes: number;
  readonly sha256: string;
}

/**
 * What the system can honestly establish about a declared evidence artifact: that a *file* is
 * there, how big it is, and what it hashes to. It cannot tell a signed site-consent form from a
 * blank page — reading the artifact stays a human act, and the hash is what lets a reviewer
 * confirm later that the file on record has not been swapped.
 */
export function inspectEvidenceArtifact(filePath: string): EvidenceArtifact {
  const trimmed = filePath.trim();
  if (trimmed === "" || !existsSync(trimmed)) {
    return { filePath: trimmed, exists: false, isFile: false, bytes: 0, sha256: "" };
  }
  const stats = statSync(trimmed);
  if (!stats.isFile()) return { filePath: trimmed, exists: true, isFile: false, bytes: 0, sha256: "" };
  const sha256 = stats.size > EVIDENCE_ARTIFACT_HASH_LIMIT_BYTES
    ? EVIDENCE_ARTIFACT_TOO_LARGE
    : calculateSha256(new Uint8Array(readFileSync(trimmed)));
  return { filePath: trimmed, exists: true, isFile: true, bytes: stats.size, sha256 };
}

export function describeEvidenceArtifact(artifact: EvidenceArtifact): string {
  if (!artifact.exists) return `Đường dẫn khai báo không tồn tại: ${artifact.filePath || "(rỗng)"}`;
  if (!artifact.isFile) return `Đường dẫn khai báo không phải là tệp: ${artifact.filePath}`;
  return `Tệp bằng chứng: ${artifact.filePath} (SHA-256 ${artifact.sha256.slice(0, 16)}…, ${artifact.bytes} byte)`;
}
