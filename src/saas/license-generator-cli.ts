import { readFileSync } from "node:fs";
import {
  createSignedSaasLicenseKey,
  generateEphemeralSaasLicenseKeyPair,
  resolveSaasSubscriptionStatus,
  type SaasSubscriptionStatus,
} from "./saas-tier-policy.js";
import {
  buildOpcCommercialQuote,
  type OpcCommercialPlanCode,
  type OpcCommercialQuote,
} from "./invoice-template.js";

export interface IssueOpcLicenseInput {
  readonly tenantId: string;
  readonly siteCode?: string | undefined;
  readonly planCode?: OpcCommercialPlanCode | undefined;
  readonly privateKeyPem?: string | undefined;
  readonly publicKeyPem?: string | undefined;
  readonly issuedAtIso?: string | undefined;
}

export interface IssuedOpcLicenseBundle {
  readonly quote: OpcCommercialQuote;
  readonly licenseKey: string;
  readonly publicKeyPem: string;
  readonly verificationStatus: SaasSubscriptionStatus;
}

export function issueOpcCommercialLicenseBundle(input: IssueOpcLicenseInput): IssuedOpcLicenseBundle {
  const planCode: OpcCommercialPlanCode = input.planCode ?? "PILOT_30D_5M_VND";
  const siteCode = input.siteCode ?? "SITE-CAILAY-TIENGIANG-01";
  const issuedAtIso = input.issuedAtIso ?? new Date().toISOString();
  const keys = input.privateKeyPem && input.publicKeyPem
    ? { privateKeyPem: input.privateKeyPem, publicKeyPem: input.publicKeyPem }
    : generateEphemeralSaasLicenseKeyPair();

  const quote = buildOpcCommercialQuote({ tenantId: input.tenantId, siteCode, planCode, issuedAtIso });
  const licenseKey = createSignedSaasLicenseKey(
    { tenantId: quote.tenantId, edition: quote.edition, expiresAt: quote.expiresAt },
    keys.privateKeyPem
  );
  const verificationStatus = resolveSaasSubscriptionStatus(
    { DURIOS_SAAS_LICENSE_KEY: licenseKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: keys.publicKeyPem },
    issuedAtIso,
    quote.tenantId
  );

  if (!verificationStatus.licenseValid) {
    throw new Error(`License self-verification failed: ${verificationStatus.degradedToCommunityReason ?? "UNKNOWN"}`);
  }
  return { quote, licenseKey, publicKeyPem: keys.publicKeyPem, verificationStatus };
}

export function runLicenseGeneratorCli(argv: readonly string[]): {
  readonly exitCode: number;
  readonly outputJson: string;
} {
  if (argv.includes("--keygen")) {
    return { exitCode: 0, outputJson: JSON.stringify(generateEphemeralSaasLicenseKeyPair(), null, 2) };
  }
  const getArg = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  if (argv.includes("--verify")) {
    const licenseKey = getArg("--license-key") ?? process.env.DURIOS_SAAS_LICENSE_KEY;
    const pubPath = getArg("--public-key-file");
    const publicKeyPem = pubPath ? readFileSync(pubPath, "utf-8") : process.env.DURIOS_SAAS_LICENSE_PUBLIC_KEY;
    const status = resolveSaasSubscriptionStatus(
      { DURIOS_SAAS_LICENSE_KEY: licenseKey, DURIOS_SAAS_LICENSE_PUBLIC_KEY: publicKeyPem },
      new Date().toISOString(),
      getArg("--tenant-id")
    );
    return { exitCode: status.licenseValid ? 0 : 1, outputJson: JSON.stringify(status, null, 2) };
  }
  const bundle = issueOpcCommercialLicenseBundle({
    tenantId: getArg("--tenant-id") ?? "TENANT-CAILAY-01",
    siteCode: getArg("--site-code") ?? "SITE-CAILAY-TIENGIANG-01",
    planCode: (getArg("--plan") as OpcCommercialPlanCode | undefined) ?? "PILOT_30D_5M_VND",
  });
  return { exitCode: 0, outputJson: JSON.stringify(bundle, null, 2) };
}

if (import.meta.main) {
  const res = runLicenseGeneratorCli(process.argv.slice(2));
  process.stdout.write(`${res.outputJson}\n`);
  process.exit(res.exitCode);
}
