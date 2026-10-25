import { readFileSync } from "node:fs";
import {
  createSignedSaasLicenseKey,
  generateEphemeralSaasLicenseKeyPair,
  resolveSaasSubscriptionStatus,
  type SaasSubscriptionStatus,
} from "./saas-tier-policy.js";

/**
 * Zero-Code Billing Offline License Signer (Ed25519) for OPC 1-person operators:
 * issues offline `DURIOS.<payload>.<sig>` license keys for Pilot (30 days),
 * Seasonal Pay-Go (90 days), or Annual Pro (365 days) after manual VietQR bank receipt.
 */
export interface IssueOfflineLicenseInput {
  readonly tenantId: string;
  readonly edition: "PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE";
  readonly expiresAt: string;
  readonly signingPrivateKeyPem: string;
  readonly verifyPublicKeyPem?: string | undefined;
}

export interface IssuedOfflineLicenseResult {
  readonly licenseKey: string;
  readonly tenantId: string;
  readonly edition: "PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE";
  readonly expiresAt: string;
  readonly verification?: SaasSubscriptionStatus | undefined;
}

export function issueOfflineSaasLicense(input: IssueOfflineLicenseInput): IssuedOfflineLicenseResult {
  const licenseKey = createSignedSaasLicenseKey(
    { tenantId: input.tenantId, edition: input.edition, expiresAt: input.expiresAt },
    input.signingPrivateKeyPem
  );
  const verification = input.verifyPublicKeyPem
    ? resolveSaasSubscriptionStatus(
        { DURIOS_SAAS_LICENSE_KEY: licenseKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: input.verifyPublicKeyPem },
        new Date().toISOString(),
        input.tenantId
      )
    : undefined;
  return { licenseKey, tenantId: input.tenantId, edition: input.edition, expiresAt: input.expiresAt, verification };
}

function getFlag(argv: readonly string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  return idx !== -1 && idx + 1 < argv.length ? argv[idx + 1] : undefined;
}

export function runLicenseSignerCli(argv: readonly string[], env: Record<string, string | undefined> = process.env): Record<string, unknown> {
  const cmd = argv[0];
  if (cmd === "keygen") {
    return { action: "keygen", ...generateEphemeralSaasLicenseKeyPair() };
  }
  if (cmd === "sign") {
    const tenantId = getFlag(argv, "--tenant") ?? "TENANT-CAILAY-PILOT-01";
    const editionRaw = getFlag(argv, "--edition") ?? "PACKHOUSE_PRO_SAAS";
    const edition = editionRaw === "EXPORTER_ENTERPRISE" ? "EXPORTER_ENTERPRISE" : "PACKHOUSE_PRO_SAAS";
    const days = Number(getFlag(argv, "--days") ?? "30");
    const expiresAt = getFlag(argv, "--expires-at") ?? new Date(Date.now() + days * 86400_000).toISOString();
    const keyFile = getFlag(argv, "--private-key-file");
    const privPem = keyFile ? readFileSync(keyFile, "utf-8") : env.DURIOS_SAAS_SIGNING_PRIVATE_KEY ?? "";
    const pubPem = env.DURIOS_SAAS_LICENSE_PUBLIC_KEY;
    return { action: "sign", ...issueOfflineSaasLicense({ tenantId, edition, expiresAt, signingPrivateKeyPem: privPem, verifyPublicKeyPem: pubPem }) };
  }
  throw new Error("Usage: bun run src/saas/license-signer-cli.ts <keygen|sign> [--tenant ID] [--edition PACKHOUSE_PRO_SAAS|EXPORTER_ENTERPRISE] [--days 30|90|365] [--private-key-file PATH]");
}

if (import.meta.main) {
  process.stdout.write(`${JSON.stringify(runLicenseSignerCli(process.argv.slice(2)), null, 2)}\n`);
}
