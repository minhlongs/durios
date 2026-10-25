import { describe, it, expect } from "bun:test";
import { REVIEW_STATE, REVIEW_STATE_LABEL, reviewStateLabel } from "../src/ui/review-state.js";

describe("review-state — the product does not claim regulatory clearance", () => {
  it("no Vietnamese or English label asserts certification, clearance or export approval", () => {
    const all = Object.values(REVIEW_STATE_LABEL)
      .map((m) => `${m.vi} ${m.en}`)
      .join(" ");
    for (const banned of ["Đạt GACC", "Được phép xuất khẩu", "Thông quan bảo đảm", "chứng nhận", "certified"]) {
      expect(all).not.toContain(banned);
    }
  });

  it("every state has a label distinct from its English gloss (it is a real translation)", () => {
    for (const m of Object.values(REVIEW_STATE_LABEL)) {
      expect(m.vi).not.toEqual(m.en);
    }
  });

});

describe("review-state — the six operational states an operator must distinguish", () => {
  it("has exactly six states, each with a Vietnamese label", () => {
    const states = Object.values(REVIEW_STATE);
    expect(states).toHaveLength(6);
    for (const s of states) {
      const meta = REVIEW_STATE_LABEL[s];
      expect(meta).toBeDefined();
      expect(meta.vi.trim().length).toBeGreaterThan(0);
      expect(meta.en.trim().length).toBeGreaterThan(0);
    }
    const labels = states.map((s) => reviewStateLabel(s, "vi"));
    expect(new Set(labels).size).toBe(6);
  });

  it("uses the exact Vietnamese wording the operator's checklist asks for", () => {
    expect(reviewStateLabel(REVIEW_STATE.NEEDS_REVIEW, "vi")).toBe("Cần rà soát");
    expect(reviewStateLabel(REVIEW_STATE.NEEDS_EVIDENCE, "vi")).toBe("Cần bổ sung bằng chứng");
    expect(reviewStateLabel(REVIEW_STATE.DISCREPANCY, "vi")).toBe("Có sai lệch");
    expect(reviewStateLabel(REVIEW_STATE.CONFIRMED_DATA, "vi")).toBe("Đã xác nhận dữ liệu");
    expect(reviewStateLabel(REVIEW_STATE.SOURCE_CHANGED, "vi")).toBe("Nguồn đã thay đổi");
    expect(reviewStateLabel(REVIEW_STATE.NEEDS_REASSESSMENT, "vi")).toBe("Cần đánh giá lại");
  });

  it("returns an empty string for an unknown state rather than a wrong label", () => {
    expect(reviewStateLabel("NOT_A_STATE", "vi")).toBe("");
  });
});
