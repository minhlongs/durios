import { generateKeyPairSync, sign, verify } from "node:crypto";

export type DuriosProductEdition =
  | "COMMUNITY_OPEN_CORE"
  | "PACKHOUSE_PRO_SAAS"
  | "EXPORTER_ENTERPRISE";

export interface SaasFeatureEntitlements {
  readonly localDeterministicCompliance: true;
  readonly localSqliteAndManifestVerifier: true;
  readonly localDataAccessGuaranteed: true;
  readonly cloudVisionOcr: boolean;
  readonly managedZaloZnsRelay: boolean;
  readonly cloudE2eeBackupVault: boolean;
  readonly gaccLiveRegistryWatch: boolean;
  readonly crossBorderBuyerPortal: boolean;
  readonly multiSiteEnterpriseSync: boolean;
}

export interface SaasSubscriptionStatus {
  readonly edition: DuriosProductEdition;
  readonly licenseValid: boolean;
  readonly licensedTenantId?: string | undefined;
  readonly expiresAt?: string | undefined;
  readonly degradedToCommunityReason?: string | undefined;
  readonly entitlements: SaasFeatureEntitlements;
  readonly openSourceLicense: "AGPL-3.0-only (Core) + MIT (Verifier SDK)";
  readonly upgradePortalUrl?: string | undefined;
}

export interface SaasLicensePayload {
  readonly tenantId: string;
  readonly edition: "PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE";
  readonly expiresAt: string;
}

const OPEN_SOURCE_LICENSE_LABEL = "AGPL-3.0-only (Core) + MIT (Verifier SDK)" as const;

function buildEntitlements(edition: DuriosProductEdition): SaasFeatureEntitlements {
  const isProOrAbove =
    edition === "PACKHOUSE_PRO_SAAS" || edition === "EXPORTER_ENTERPRISE";
  const isEnterprise = edition === "EXPORTER_ENTERPRISE";
  return {
    localDeterministicCompliance: true,
    localSqliteAndManifestVerifier: true,
    localDataAccessGuaranteed: true,
    cloudVisionOcr: isProOrAbove,
    managedZaloZnsRelay: isProOrAbove,
    cloudE2eeBackupVault: isProOrAbove,
    gaccLiveRegistryWatch: isProOrAbove,
    crossBorderBuyerPortal: isProOrAbove,
    multiSiteEnterpriseSync: isEnterprise,
  };
}

function downgradeToCommunity(
  reason?: string,
  upgradePortalUrl?: string,
  extra?: { licensedTenantId?: string; expiresAt?: string }
): SaasSubscriptionStatus {
  return {
    edition: "COMMUNITY_OPEN_CORE",
    licenseValid: false,
    ...(reason ? { degradedToCommunityReason: reason } : {}),
    ...(extra?.licensedTenantId ? { licensedTenantId: extra.licensedTenantId } : {}),
    ...(extra?.expiresAt ? { expiresAt: extra.expiresAt } : {}),
    entitlements: buildEntitlements("COMMUNITY_OPEN_CORE"),
    openSourceLicense: OPEN_SOURCE_LICENSE_LABEL,
    ...(upgradePortalUrl ? { upgradePortalUrl } : {}),
  };
}

export function generateEphemeralSaasLicenseKeyPair(): {
  readonly publicKeyPem: string;
  readonly privateKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

export function createSignedSaasLicenseKey(
  payload: SaasLicensePayload,
  signingPrivateKeyPem: string
): string {
  if (!signingPrivateKeyPem || !signingPrivateKeyPem.includes("PRIVATE KEY")) {
    throw new Error("Ed25519 PKCS#8 signingPrivateKeyPem is required to sign a SaaS license key.");
  }
  if (!payload.tenantId.trim() || payload.tenantId.includes("|")) {
    throw new Error("Invalid license tenantId.");
  }
  const body = `${payload.edition}|${payload.tenantId}|${payload.expiresAt}`;
  const encoded = Buffer.from(body, "utf-8").toString("base64url");
  const sig = sign(null, Buffer.from(encoded, "utf-8"), signingPrivateKeyPem).toString("base64url");
  return `DURIOS.${encoded}.${sig}`;
}

export function resolveSaasSubscriptionStatus(
  env: Record<string, string | undefined> = process.env,
  nowIso = new Date().toISOString(),
  expectedTenantId?: string
): SaasSubscriptionStatus {
  const rawKey = env.DURIOS_SAAS_LICENSE_KEY?.trim();
  const publicKeyPem = env.DURIOS_SAAS_LICENSE_PUBLIC_KEY?.trim();
  const upgradePortalUrl = env.DURIOS_UPGRADE_PORTAL_URL?.trim();

  if (!rawKey) {
    return downgradeToCommunity(undefined, upgradePortalUrl);
  }

  const parts = rawKey.split(".");
  if (parts.length !== 3 || parts[0] !== "DURIOS" || !parts[1] || !parts[2]) {
    return downgradeToCommunity("MALFORMED_LICENSE_KEY_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }

  if (!publicKeyPem || !publicKeyPem.includes("PUBLIC KEY")) {
    return downgradeToCommunity("MISSING_LICENSE_PUBLIC_KEY_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }

  let signatureOk = false;
  try {
    signatureOk = verify(
      null,
      Buffer.from(parts[1], "utf-8"),
      publicKeyPem,
      Buffer.from(parts[2], "base64url")
    );
  } catch {
    signatureOk = false;
  }

  if (!signatureOk) {
    return downgradeToCommunity("INVALID_LICENSE_SIGNATURE_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }

  const decodedParts = Buffer.from(parts[1], "base64url").toString("utf-8").split("|");
  if (decodedParts.length !== 3) {
    return downgradeToCommunity("CORRUPTED_LICENSE_PAYLOAD_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }
  const [editionRaw, tenantId, expiresAt] = decodedParts;
  const parsedExpiry = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const parsedNow = Date.parse(nowIso);

  if (
    (editionRaw !== "PACKHOUSE_PRO_SAAS" && editionRaw !== "EXPORTER_ENTERPRISE") ||
    !tenantId ||
    !expiresAt ||
    Number.isNaN(parsedExpiry) ||
    Number.isNaN(parsedNow)
  ) {
    return downgradeToCommunity("CORRUPTED_LICENSE_PAYLOAD_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }

  if (
    expectedTenantId !== undefined &&
    (expectedTenantId.trim() === "" || expectedTenantId !== tenantId)
  ) {
    return downgradeToCommunity("TENANT_MISMATCH_GRACEFUL_DOWNGRADE", upgradePortalUrl);
  }

  if (parsedExpiry <= parsedNow) {
    return downgradeToCommunity("EXPIRED_SUBSCRIPTION_GRACEFUL_DOWNGRADE", upgradePortalUrl, {
      licensedTenantId: tenantId,
      expiresAt,
    });
  }

  return {
    edition: editionRaw,
    licenseValid: true,
    licensedTenantId: tenantId,
    expiresAt,
    entitlements: buildEntitlements(editionRaw),
    openSourceLicense: OPEN_SOURCE_LICENSE_LABEL,
    ...(upgradePortalUrl ? { upgradePortalUrl } : {}),
  };
}
