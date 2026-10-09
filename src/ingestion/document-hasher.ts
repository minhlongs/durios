import { createHash } from "node:crypto";

export function calculateSha256(data: Uint8Array | string): string {
  const hasher = createHash("sha256");
  hasher.update(data);
  return hasher.digest("hex");
}

export function verifySha256Match(data: Uint8Array, expectedHash: string): boolean {
  const actualHash = calculateSha256(data);
  return actualHash.toLowerCase() === expectedHash.trim().toLowerCase();
}
