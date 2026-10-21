import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import type { SiteBackupManifest } from "../auth/site-backup-manager.js";
import { calculateSha256 } from "../ingestion/document-hasher.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export interface EncryptedCloudVaultEnvelope {
  readonly envelopeVersion: "1.0.0"; readonly tenantId: string; readonly algorithm: "AES-256-GCM";
  readonly kdf: "scrypt-sha256-v1"; readonly saltBase64: string; readonly ivBase64: string;
  readonly authTagBase64: string; readonly aadContext: string; readonly ciphertextBase64: string;
  readonly plaintextManifestSha256: string; readonly payloadScope: "MANIFEST_METADATA_ONLY_NOT_BLOBS"; readonly encryptedAt: string;
}

export function encryptBackupManifestForCloudVault(
  tenantId: string,
  manifest: SiteBackupManifest,
  clientPassphrase: string,
  env: Record<string, string | undefined> = process.env
): EncryptedCloudVaultEnvelope {
  const sub = resolveSaasSubscriptionStatus(env, new Date().toISOString(), tenantId);
  if (!sub.entitlements.cloudE2eeBackupVault) {
    throw new Error(
      "DuriOS Cloud E2EE Backup Vault requires an active PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription."
    );
  }
  if (!clientPassphrase || clientPassphrase.trim().length < 12) {
    throw new Error("Client-side encryption passphrase must be at least 12 characters.");
  }

  const plaintextJson = JSON.stringify(manifest);
  const plaintextManifestSha256 = calculateSha256(plaintextJson);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(clientPassphrase, salt, 32);
  const aadContext = `${tenantId}|1.0.0|${plaintextManifestSha256}`;

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aadContext, "utf-8"));

  const encrypted = Buffer.concat([
    cipher.update(plaintextJson, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    envelopeVersion: "1.0.0",
    tenantId,
    algorithm: "AES-256-GCM",
    kdf: "scrypt-sha256-v1",
    saltBase64: salt.toString("base64"),
    ivBase64: iv.toString("base64"),
    authTagBase64: authTag.toString("base64"),
    aadContext,
    ciphertextBase64: encrypted.toString("base64"),
    plaintextManifestSha256,
    payloadScope: "MANIFEST_METADATA_ONLY_NOT_BLOBS",
    encryptedAt: new Date().toISOString(),
  };
}

export function decryptCloudVaultBackupEnvelope(
  envelope: EncryptedCloudVaultEnvelope,
  clientPassphrase: string,
  expectedTenantId?: string
): SiteBackupManifest {
  if (expectedTenantId && envelope.tenantId !== expectedTenantId) {
    throw new Error(
      `Cloud Vault envelope tenant mismatch: expected '${expectedTenantId}', got '${envelope.tenantId}'.`
    );
  }

  const expectedAad = `${envelope.tenantId}|${envelope.envelopeVersion}|${envelope.plaintextManifestSha256}`;
  if (envelope.aadContext !== expectedAad) {
    throw new Error("Cloud Vault envelope AAD context does not match envelope header fields.");
  }

  const salt = Buffer.from(envelope.saltBase64, "base64");
  const key = scryptSync(clientPassphrase, salt, 32);
  const iv = Buffer.from(envelope.ivBase64, "base64");
  const authTag = Buffer.from(envelope.authTagBase64, "base64");
  const ciphertext = Buffer.from(envelope.ciphertextBase64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(envelope.aadContext, "utf-8"));
  decipher.setAuthTag(authTag);

  const decryptedJson = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf-8");

  if (calculateSha256(decryptedJson) !== envelope.plaintextManifestSha256) {
    throw new Error("Decrypted Cloud Vault manifest SHA-256 integrity mismatch.");
  }

  return JSON.parse(decryptedJson) as SiteBackupManifest;
}
