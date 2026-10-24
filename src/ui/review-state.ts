/**
 * Review state semantics for the Container Dossier evidence workspace.
 *
 * Pure functions, no DOM: this module is imported by the inline browser
 * workspace script and unit-tested directly, so the rules an operator relies on
 * are checked rather than only rendered.
 *
 * The rules encoded here are deliberately conservative:
 *   - a comparison that agrees proves nothing about a real document;
 *   - a value is only "confirmed" once a person confirmed it, never because a
 *     rule matched;
 *   - a rule that cannot carry a legal conclusion is never shown as clean.
 */

/** The operational review states an operator must be able to tell apart. */
export const REVIEW_STATE = {
  NEEDS_REVIEW: "NEEDS_REVIEW",
  NEEDS_EVIDENCE: "NEEDS_EVIDENCE",
  DISCREPANCY: "DISCREPANCY",
  CONFIRMED_DATA: "CONFIRMED_DATA",
  SOURCE_CHANGED: "SOURCE_CHANGED",
  NEEDS_REASSESSMENT: "NEEDS_REASSESSMENT",
} as const;

export type ReviewState = (typeof REVIEW_STATE)[keyof typeof REVIEW_STATE];

export interface ReviewStateLabel {
  readonly vi: string;
  readonly en: string;
  readonly tone: "info" | "amber" | "danger" | "accent" | "neutral";
}

/** Vietnamese is the default language of this product, so Vietnamese is canonical. */
export const REVIEW_STATE_LABEL: Readonly<Record<ReviewState, ReviewStateLabel>> = {
  NEEDS_REVIEW: { vi: "Cần rà soát", en: "Needs review", tone: "info" },
  NEEDS_EVIDENCE: { vi: "Cần bổ sung bằng chứng", en: "Evidence missing", tone: "amber" },
  DISCREPANCY: { vi: "Có sai lệch", en: "Discrepancy", tone: "danger" },
  CONFIRMED_DATA: { vi: "Đã xác nhận dữ liệu", en: "Data confirmed", tone: "accent" },
  SOURCE_CHANGED: { vi: "Nguồn đã thay đổi", en: "Source changed", tone: "amber" },
  NEEDS_REASSESSMENT: { vi: "Cần đánh giá lại", en: "Needs reassessment", tone: "amber" },
};

/** Every state has a distinct Vietnamese label; a duplicate would merge two meanings. */
export function reviewStateLabel(state: string, lang: "vi" | "en" = "vi"): string {
  const entry = (REVIEW_STATE_LABEL as Record<string, ReviewStateLabel>)[state];
  if (!entry) return "";
  return lang === "vi" ? entry.vi : entry.en;
}

/** A field/source row as the workspace UI sees it. */
export interface ReviewRow {
  readonly result?: string;
  readonly verificationStatus?: string;
  readonly selectedValue?: string | null;
  readonly sourceSuperseded?: boolean;
  readonly isSuperseded?: boolean;
  readonly manualCorrection?: boolean;
}

function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

/**
 * Classify one row into exactly one review state.
 *
 * Order matters. A restored document that no longer matches the value a person
 * confirmed is SOURCE_CHANGED, not CONFIRMED_DATA — otherwise a stale
 * confirmation would read as current. A manual correction awaiting confirmation
 * outranks the empty-value check, because "a person typed something we must
 * re-check" is more specific than "nothing here yet".
 */
export function classifyField(row: ReviewRow = {}): ReviewState {
  if (row.sourceSuperseded === true || row.isSuperseded === true) {
    return REVIEW_STATE.SOURCE_CHANGED;
  }
  if (row.result === "POTENTIAL_DISCREPANCY") return REVIEW_STATE.DISCREPANCY;
  if (row.result === "MISSING_DOCUMENT" || row.result === "UNREADABLE") {
    return REVIEW_STATE.NEEDS_EVIDENCE;
  }
  if (row.result === "POTENTIAL_UNIT_CONFLICT") return REVIEW_STATE.NEEDS_EVIDENCE;
  const manualPending = row.manualCorrection === true && row.verificationStatus !== "HUMAN_VERIFIED";
  if (manualPending) return REVIEW_STATE.NEEDS_REASSESSMENT;
  // A missing value outranks any "looks fine" signal: an empty suggestion is
  // not a draft the operator can trust.
  if (isBlank(row.selectedValue)) return REVIEW_STATE.NEEDS_EVIDENCE;
  if (row.verificationStatus === "HUMAN_VERIFIED") return REVIEW_STATE.CONFIRMED_DATA;
  if (row.verificationStatus === "REJECTED") return REVIEW_STATE.NEEDS_REASSESSMENT;
  return REVIEW_STATE.NEEDS_REVIEW;
}
