import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Derives how many active packhouses a pure Vietnam SaaS subscription can
 * reach before the ARR ceiling, using the planning assumptions recorded in
 * `docs/product-direction/DURIOS-STRATEGY-V2.json`.
 */

export interface OneMillionArrSiteCeiling {
  /** The $1,000,000 ARR target the site count is solved for. */
  readonly targetArrUsd: number;
  /** Un-rounded solution of target x rate / price. */
  readonly rawSitesNeeded: number;
  /** Rounding up, because a packhouse cannot be sold in fractions. */
  readonly sitesRequired: number;
  /** Subscription ARR at `sitesRequired - 1`; must fall short of the target. */
  readonly arrUsdAt427Sites: number;
  /** Subscription ARR at `sitesRequired`; must reach the target. */
  readonly arrUsdAt428Sites: number;
}

/** Field names are snake_case because they mirror the strategy JSON verbatim. */
export interface StrategyEconomicTruth {
  readonly exchange_rate_vnd_usd: number;
  readonly saas_price_per_packhouse_vnd_year: number;
  readonly max_vietnam_saas_arr_usd: number;
  readonly sites_required_for_one_million_arr_saas_only: number;
}

export interface StrategyV2File {
  readonly market_facts_official_sep_2026: {
    readonly vietnam_active_packhouses: number;
    readonly vietnam_durian_export_8m_2026_usd: number;
  };
  readonly economic_truth_and_target_arr: StrategyEconomicTruth;
  readonly north_star_metrics: string[];
}

/** Reads the strategy V2 file and exposes its economic truth block. */
export function readStrategyV2EconomicTruth(rootDir = process.cwd()): StrategyV2File {
  const raw = readFileSync(
    join(rootDir, "docs/product-direction/DURIOS-STRATEGY-V2.json"), "utf-8"
  );
  const parsed = JSON.parse(raw) as StrategyV2File;
  const truth = parsed.economic_truth_and_target_arr;
  if (
    typeof truth.exchange_rate_vnd_usd !== "number" ||
    typeof truth.saas_price_per_packhouse_vnd_year !== "number"
  ) {
    throw new Error("DURIOS-STRATEGY-V2.json economic_truth_and_target_arr is missing FX or price");
  }
  return parsed;
}

const TARGET_ARR_USD = 1_000_000;

export function deriveOneMillionArrSiteCeiling(
  truth: StrategyEconomicTruth
): OneMillionArrSiteCeiling {
  const rawSitesNeeded =
    TARGET_ARR_USD * truth.exchange_rate_vnd_usd / truth.saas_price_per_packhouse_vnd_year;
  const sitesRequired = Math.ceil(rawSitesNeeded);
  const arrUsdFor = (sites: number): number =>
    sites * truth.saas_price_per_packhouse_vnd_year / truth.exchange_rate_vnd_usd;

  return {
    targetArrUsd: TARGET_ARR_USD,
    rawSitesNeeded,
    sitesRequired,
    arrUsdAt427Sites: arrUsdFor(sitesRequired - 1),
    arrUsdAt428Sites: arrUsdFor(sitesRequired),
  };
}
