export type MarketplaceLockReasonCode =
  | "FEATURE_LOCKED_PENDING_PILOT_SIGN_OFF"
  | "PILOT_GATES_INCOMPLETE"
  | "ZERO_CUSTODY_VIOLATION";

export class MarketplaceGuardError extends Error {
  public readonly status: 403 | 404 | 422;

  constructor(
    message: string,
    public readonly code: MarketplaceLockReasonCode,
    status: 403 | 404 | 422 = 403
  ) {
    super(message);
    this.name = "MarketplaceGuardError";
    this.status = status;
  }
}

export interface MarketplaceDualLockContext {
  readonly env?: Record<string, string | undefined>;
  readonly goForLiveCustomerData: boolean;
}

export function isMarketplaceFeatureUnlocked(context: MarketplaceDualLockContext): boolean {
  const env = context.env ?? process.env;
  const featureFlagEnabled = env.DURIOS_FEATURE_B2B_MARKETPLACE === "enabled";
  return featureFlagEnabled && context.goForLiveCustomerData === true;
}

export function assertMarketplaceFeatureUnlocked(context: MarketplaceDualLockContext): void {
  const env = context.env ?? process.env;
  const featureFlagEnabled = env.DURIOS_FEATURE_B2B_MARKETPLACE === "enabled";

  if (!featureFlagEnabled) {
    throw new MarketplaceGuardError(
      "B2B Marketplace & Escrow coordination is disabled by default during single-site pilot (Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP). Set DURIOS_FEATURE_B2B_MARKETPLACE=enabled only after Founder and legal sign-off.",
      "FEATURE_LOCKED_PENDING_PILOT_SIGN_OFF",
      403
    );
  }

  if (!context.goForLiveCustomerData) {
    throw new MarketplaceGuardError(
      "B2B Marketplace cannot be activated until all 5 Single-Site Pilot Launch Gates (GATE-01..GATE-05) have passed (goForLiveCustomerData === true).",
      "PILOT_GATES_INCOMPLETE",
      403
    );
  }
}

const PROHIBITED_CUSTODY_KEYS: readonly string[] = [
  "walletBalance",
  "holdFundsAmount",
  "platformEscrowBalance",
  "cardPan",
  "cvv",
  "bankSecretKey",
  "privateKey",
];

export function assertZeroCustodyCompliance(
  payload: Record<string, unknown>,
  custodyMode?: string
): void {
  if (custodyMode !== undefined && custodyMode !== "ZERO_CUSTODY_LICENSED_BANK_PARTNER") {
    throw new MarketplaceGuardError(
      `Prohibited custody mode '${custodyMode}'. DuriOS is strictly non-custodial under Nghị định 52/2024/NĐ-CP and never holds or pools transaction funds.`,
      "ZERO_CUSTODY_VIOLATION",
      422
    );
  }

  for (const forbiddenKey of PROHIBITED_CUSTODY_KEYS) {
    if (forbiddenKey in payload && payload[forbiddenKey] !== undefined) {
      throw new MarketplaceGuardError(
        `Zero-custody violation: field '${forbiddenKey}' is prohibited. DuriOS never stores funds, wallet balances, or payment credentials.`,
        "ZERO_CUSTODY_VIOLATION",
        422
      );
    }
  }
}
