/**
 * The two constants every "value delivered" figure in the pilot KPI is computed from.
 *
 * Neither has been measured at a packhouse: 35 minutes is a placeholder for the manual
 * paper reconciliation it would replace, and the per-exception penalty is a modelling
 * figure, not an observed loss. They are declared here, shipped alongside every number
 * derived from them, and marked UNVALIDATED so no report can present them as field
 * evidence, revenue, ROI or avoided loss.
 */
export const MANUAL_BASELINE_MINUTES = 35;
export const PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION = 35_000_000;

export interface ValueMetricAssumption {
  readonly key: "MANUAL_BASELINE_MINUTES" | "PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION";
  readonly value: number;
  readonly unit: "minutes_per_container" | "vnd_per_critical_exception";
  readonly status: "UNVALIDATED_ASSUMPTION";
  readonly noteVi: string;
}

export const VALUE_METRIC_ASSUMPTIONS: readonly ValueMetricAssumption[] = [
  {
    key: "MANUAL_BASELINE_MINUTES", value: MANUAL_BASELINE_MINUTES, unit: "minutes_per_container",
    status: "UNVALIDATED_ASSUMPTION",
    noteVi: "Giả định 35 phút đối soát thủ công mỗi container. CHƯA được đo tại vựa; cần bấm giờ quy trình giấy hiện tại trước khi dùng cho bất kỳ tuyên bố tiết kiệm thời gian nào.",
  },
  {
    key: "PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION", value: PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION, unit: "vnd_per_critical_exception",
    status: "UNVALIDATED_ASSUMPTION",
    noteVi: "Giả định 35.000.000 VND thiệt hại tránh được cho mỗi lỗi chặn nghiêm trọng. KHÔNG phải số liệu đã kiểm chứng; không được trình bày như doanh thu, ROI hay thiệt hại tránh được thực tế.",
  },
];
