import { calculateSha256 } from "../ingestion/document-hasher.js";

export const MANIFEST_INTEGRITY_FIELD = "manifestIntegritySha256";

/** Whether a manifest carries the whole-record integrity hash or predates it. */
export type ManifestIntegrityCoverage = "FULL" | "PARTIAL_LEGACY";

export interface ManifestIntegrityCheck {
  readonly coverage: ManifestIntegrityCoverage;
  readonly matches: boolean;
  readonly expected: string;
  readonly recomputed: string;
}

/**
 * Canonical form for hashing: keys sorted at every level, `undefined` dropped.
 *
 * Sorting is what makes the hash independent of the order a producer happened to
 * assemble the object in, so the same manifest content always hashes the same way.
 */
export function canonicalizeForIntegrity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalizeForIntegrity(item));
  if (value === null || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    if (source[key] === undefined) continue;
    output[key] = canonicalizeForIntegrity(source[key]);
  }
  return output;
}

/** The integrity digest of a manifest, taken over everything except the digest itself. */
export function computeManifestIntegritySha256(manifest: Record<string, unknown>): string {
  const covered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(manifest)) {
    if (key === MANIFEST_INTEGRITY_FIELD) continue;
    covered[key] = value;
  }
  return calculateSha256(JSON.stringify(canonicalizeForIntegrity(covered)));
}

export function checkManifestIntegrity(manifest: unknown): ManifestIntegrityCheck {
  const record = manifest !== null && typeof manifest === "object" && !Array.isArray(manifest)
    ? (manifest as Record<string, unknown>)
    : {};
  const expected = typeof record[MANIFEST_INTEGRITY_FIELD] === "string" ? (record[MANIFEST_INTEGRITY_FIELD] as string) : "";
  const recomputed = computeManifestIntegritySha256(record);
  if (!expected) return { coverage: "PARTIAL_LEGACY", matches: false, expected: "", recomputed };
  return { coverage: "FULL", matches: recomputed === expected, expected, recomputed };
}
