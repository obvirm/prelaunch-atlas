export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

export interface PlanMetrics {
  capital_usd: number;
  gas_usd: number;
  setup_minutes: number;
  hold_days: number;
}

export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  kind: string;
  group: string;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  multiple: number;
  multiple_source: string;
  multiple_n: number;
  multiple_basis: string;
  growth_pct: number;
  growth_mult: number;
  maturity_mult: number;
  distribution_mult: number;
  watchlist: boolean;
  early: boolean;
  farm_steps: string[];
  farm_plan: FarmStep[];
  capital_usd: number;
  gas_usd: number;
  setup_minutes: number;
  hold_days: number;
}

export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number;
  change_7d: number | null;
  listed_at: string | null;
}

export interface KindMultiple {
  kind: string;
  group: string;
  n: number;
  median: number | null;
  value: number;
  source: string;
  basis: string;
}

export interface ModelParams {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_maturity: number;
  distribution_step: number;
  distribution_cap: number;
  comparables_min: number;
  ratio_floor: number;
  ratio_cap: number;
}

export interface ScreenedRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  reason: string;
}

export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  snapshot_size: number;
  pre_size: number;
  live_size: number;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_shown: number;
  screened_size: number;
  model: ModelParams;
  kinds: KindMultiple[];
  rows: BoardRow[];
  live: LiveRow[];
  screened: ScreenedRow[];
}

export interface Scored {
  implied: number;
  age: number | null;
  growthPct: number;
  growthMult: number;
  maturityMult: number;
  distributionMult: number;
}

export interface Multiple {
  value: number;
  source: string;
  n: number;
  median: number | null;
  basis: string;
}

export interface ComparableStats {
  n: number;
  median: number;
}

export const MODEL: ModelParams = {
  growth_weight: 0.6,
  growth_floor: -50,
  growth_cap: 100,
  maturity_floor: 0.82,
  maturity_range: 0.18,
  maturity_days: 1460,
  unknown_age_maturity: 0.9,
  distribution_step: 0.02,
  distribution_cap: 4,
  comparables_min: 4,
  ratio_floor: 0.02,
  ratio_cap: 2,
};

export const BOARD_ROWS = 300;
export const WATCHLIST_FLOOR_ROWS = 40;
export const EARLY_ROWS = 260;
export const LIVE_ROWS = 60;
