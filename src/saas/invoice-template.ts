export type OpcCommercialPlanCode =
  | "PILOT_30D_5M_VND"
  | "PRO_ANNUAL_60M_VND"
  | "ENTERPRISE_ANNUAL_180M_VND";

export interface OpcCommercialPlanConfig {
  readonly planCode: OpcCommercialPlanCode;
  readonly edition: "PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE";
  readonly amountVnd: number;
  readonly durationDays: number;
  readonly titleVi: string;
}

export const OPC_COMMERCIAL_PLANS: Record<OpcCommercialPlanCode, OpcCommercialPlanConfig> = {
  PILOT_30D_5M_VND: {
    planCode: "PILOT_30D_5M_VND",
    edition: "PACKHOUSE_PRO_SAAS",
    amountVnd: 5_000_000,
    durationDays: 30,
    titleVi: "Gói Thử Nghiệm Thực Địa 30 Ngày (1 Vựa / 5 Container Pilot)",
  },
  PRO_ANNUAL_60M_VND: {
    planCode: "PRO_ANNUAL_60M_VND",
    edition: "PACKHOUSE_PRO_SAAS",
    amountVnd: 60_000_000,
    durationDays: 365,
    titleVi: "Gói Bản Quyền Hàng Năm Packhouse Pro (1 Vựa / Không Giới Hạn Container)",
  },
  ENTERPRISE_ANNUAL_180M_VND: {
    planCode: "ENTERPRISE_ANNUAL_180M_VND",
    edition: "EXPORTER_ENTERPRISE",
    amountVnd: 180_000_000,
    durationDays: 365,
    titleVi: "Gói Doanh Nghiệp Xuất Khẩu Đa Vựa & Phòng Thẩm Định Đối Tác Hùng Hậu",
  },
};

export const ZERO_CUSTODY_DISCLAIMER_VI =
  "DuriOS vận hành mô hình không lưu ký (Zero-Custody) tuân thủ Nghị định 52/2024/NĐ-CP. " +
  "Thanh toán thực hiện trực tiếp qua chuyển khoản ngân hàng (VietQR). Hệ thống không giữ tiền hàng.";

export interface OpcCommercialQuote {
  readonly quoteId: string;
  readonly tenantId: string;
  readonly siteCode: string;
  readonly planCode: OpcCommercialPlanCode;
  readonly edition: "PACKHOUSE_PRO_SAAS" | "EXPORTER_ENTERPRISE";
  readonly amountVnd: number;
  readonly durationDays: number;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly paymentMethod: "BANK_TRANSFER_VIETQR_MANUAL";
  readonly transferMemo: string;
  readonly bankRemittanceInfo: {
    readonly bankName: string;
    readonly accountName: string;
    readonly accountNumber: string;
  };
  readonly zeroCustodyDisclaimer: string;
}

export interface BuildQuoteInput {
  readonly tenantId: string;
  readonly siteCode: string;
  readonly planCode: OpcCommercialPlanCode;
  readonly issuedAtIso?: string | undefined;
  readonly bankAccount?: {
    readonly bankName?: string;
    readonly accountName?: string;
    readonly accountNumber?: string;
  } | undefined;
}

export function buildOpcCommercialQuote(input: BuildQuoteInput): OpcCommercialQuote {
  const plan = OPC_COMMERCIAL_PLANS[input.planCode];
  if (!plan) throw new Error(`Unknown commercial plan code: '${String(input.planCode)}'`);
  const issuedAt = input.issuedAtIso ?? new Date().toISOString();
  const expiresAt = new Date(new Date(issuedAt).getTime() + plan.durationDays * 86_400_000).toISOString();
  const safeTenant = input.tenantId.trim().toUpperCase();
  const safeSite = input.siteCode.trim().toUpperCase();
  return {
    quoteId: `QUOTE-${safeSite}-${safeTenant}-${plan.planCode}-${issuedAt.slice(0, 10)}`,
    tenantId: safeTenant, siteCode: safeSite, planCode: plan.planCode, edition: plan.edition,
    amountVnd: plan.amountVnd, durationDays: plan.durationDays, issuedAt, expiresAt,
    paymentMethod: "BANK_TRANSFER_VIETQR_MANUAL", transferMemo: `DURIOS ${safeTenant} ${plan.planCode}`,
    bankRemittanceInfo: {
      bankName: input.bankAccount?.bankName ?? "Vietcombank",
      accountName: input.bankAccount?.accountName ?? "DURIOS OPERATOR",
      accountNumber: input.bankAccount?.accountNumber ?? "9999DURIOSOPC",
    },
    zeroCustodyDisclaimer: ZERO_CUSTODY_DISCLAIMER_VI,
  };
}
