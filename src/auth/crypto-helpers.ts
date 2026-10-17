import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

export function generateSaltHex(byteLength = 16): string {
  return randomBytes(byteLength).toString("hex");
}

export function hashSecretWithSalt(secret: string, saltHex: string): string {
  const derived = scryptSync(secret, Buffer.from(saltHex, "hex"), 32);
  return derived.toString("hex");
}

export function verifySecretWithSalt(secret: string, saltHex: string, expectedHashHex: string): boolean {
  const actual = Buffer.from(hashSecretWithSalt(secret, saltHex), "hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

export function hashOpaqueToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}

export function generateOpaqueToken(prefix: string, byteLength = 32): string {
  return `${prefix}_${randomBytes(byteLength).toString("base64url")}`;
}

export function generateNumericOtpCode(): string {
  const value = randomInt(0, 1_000_000);
  return String(value).padStart(6, "0");
}
