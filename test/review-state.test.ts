import { describe, it, expect } from "bun:test";

import {
  REVIEW_STATE,
  classifyField,
  type ReviewState,
} from "../src/ui/review-state.js";

describe("review-state — draft, confirmed and manual values stay distinguishable", () => {
  it("an extracted suggestion is Cần rà soát, never Đã xác nhận dữ liệu", () => {
    expect(classifyField({ result: "MATCH", verificationStatus: "EXTRACTED", selectedValue: "LOT-1" })).toBe(
      REVIEW_STATE.NEEDS_REVIEW
    );
  });

  it("a person-confirmed value is Đã xác nhận dữ liệu", () => {
    expect(classifyField({ result: "MATCH", verificationStatus: "HUMAN_VERIFIED", selectedValue: "LOT-1" })).toBe(
      REVIEW_STATE.CONFIRMED_DATA
    );
  });

  it("a manual correction still awaiting confirmation is Cần đánh giá lại", () => {
    expect(classifyField({ result: "MATCH", verificationStatus: "EXTRACTED", manualCorrection: true })).toBe(
      REVIEW_STATE.NEEDS_REASSESSMENT
    );
  });

  it("a manual correction the person then confirmed is Đã xác nhận dữ liệu", () => {
    expect(
      classifyField({ result: "MATCH", verificationStatus: "HUMAN_VERIFIED", manualCorrection: true, selectedValue: "LOT-9" })
    ).toBe(REVIEW_STATE.CONFIRMED_DATA);
  });

  it("a rejected field is Cần đánh giá lại and never reads as clean", () => {
    expect(classifyField({ result: "MATCH", verificationStatus: "REJECTED", selectedValue: "LOT-1" })).toBe(
      REVIEW_STATE.NEEDS_REASSESSMENT
    );
  });
});

describe("review-state — disagreement and unreadable evidence stay visible", () => {
  it("a cross-document discrepancy is Có sai lệch", () => {
    expect(classifyField({ result: "POTENTIAL_DISCREPANCY", verificationStatus: "EXTRACTED" })).toBe(
      REVIEW_STATE.DISCREPANCY
    );
  });

  it("a missing or unreadable source is Cần bổ sung bằng chứng", () => {
    expect(classifyField({ result: "MISSING_DOCUMENT", verificationStatus: "EXTRACTED" })).toBe(
      REVIEW_STATE.NEEDS_EVIDENCE
    );
    expect(classifyField({ result: "UNREADABLE", verificationStatus: "EXTRACTED" })).toBe(
      REVIEW_STATE.NEEDS_EVIDENCE
    );
  });

  it("an empty value is Cần bổ sung bằng chứng even when the sources nominally agree", () => {
    expect(classifyField({ result: "MATCH", verificationStatus: "EXTRACTED", selectedValue: "   " })).toBe(
      REVIEW_STATE.NEEDS_EVIDENCE
    );
    expect(classifyField({ result: "MATCH", verificationStatus: "EXTRACTED", selectedValue: null })).toBe(
      REVIEW_STATE.NEEDS_EVIDENCE
    );
  });
});

describe("review-state — a superseded source supersedes the confirmation bound to it", () => {
  it("a confirmed value on a replaced document becomes Nguồn đã thay đổi", () => {
    expect(
      classifyField({ result: "MATCH", verificationStatus: "HUMAN_VERIFIED", selectedValue: "LOT-1", isSuperseded: true })
    ).toBe(REVIEW_STATE.SOURCE_CHANGED);
  });

  it("SOURCE_CHANGED wins over a genuine discrepancy so the stale confirmation is not hidden", () => {
    expect(
      classifyField({ result: "POTENTIAL_DISCREPANCY", verificationStatus: "HUMAN_VERIFIED", sourceSuperseded: true })
    ).toBe(REVIEW_STATE.SOURCE_CHANGED);
  });
});

  it("classifyField total function: every state is reachable from some row", () => {
    const rows = [
      { result: "MATCH", verificationStatus: "EXTRACTED", selectedValue: "x" },
      { result: "MATCH", verificationStatus: "EXTRACTED", selectedValue: "" },
      { result: "POTENTIAL_DISCREPANCY" },
      { result: "MATCH", verificationStatus: "HUMAN_VERIFIED", selectedValue: "x" },
      { result: "MATCH", verificationStatus: "HUMAN_VERIFIED", selectedValue: "x", isSuperseded: true },
      { result: "MATCH", verificationStatus: "EXTRACTED", manualCorrection: true },
    ];
    const reached = new Set<string>(rows.map((r) => classifyField(r)));
    for (const s of Object.values(REVIEW_STATE) as ReviewState[]) {
      expect(reached.has(s)).toBe(true);
    }
  });
