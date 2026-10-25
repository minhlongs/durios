import type { LegalBasis } from "./review-legal-basis.js";

/**
 * Bilingual wording for what a finding's legal basis means to the operator.
 *
 * Vietnamese is canonical. The wording matters as much as the mapping: a lot held
 * by an unverified blocker must read as "no legal conclusion has been drawn", not
 * as a violation. The system asserts the food-safety threshold and nothing more.
 */
export interface LegalBasisLabel {
  readonly vi: string;
  readonly en: string;
  readonly tone: "success" | "danger" | "amber" | "neutral";
}

export const LEGAL_BASIS_LABEL: Readonly<Record<LegalBasis, LegalBasisLabel>> = {
  verified: {
    vi: "Căn cứ pháp lý đã thẩm định",
    en: "Verified legal basis",
    tone: "success",
  },
  unverified: {
    vi: "Chưa thẩm định pháp lý — dừng chờ người ký",
    en: "Unverified legal basis — awaiting human decision",
    tone: "danger",
  },
  advisory: {
    vi: "Kiểm tra nội bộ — khuyến nghị",
    en: "Internal check — advisory",
    tone: "amber",
  },
  inactive: {
    vi: "Quy tắc chưa được bật",
    en: "Rule not enabled",
    tone: "neutral",
  },
};

export function legalBasisLabel(basis: LegalBasis): LegalBasisLabel {
  return LEGAL_BASIS_LABEL[basis];
}

export function canStateLegalConclusion(basis: LegalBasis): boolean {
  return basis === "verified";
}
