import { MODEL } from './types.ts';
import type { ComparableStats, Multiple, Scored, Snapshot, SnapshotProtocol } from './types.ts';

const GROUPS: { key: string; fallback: number; cats: string[] }[] = [
  { key: 'Asset management', fallback: 0.15, cats: ['Risk Curators', 'Onchain Capital Allocator', 'Curator', 'Yield Aggregator', 'Indexes', 'Liquidity Manager', 'Governance Incentives', 'Farm'] },
  { key: 'Lending', fallback: 0.15, cats: ['Lending', 'CDP', 'Collateral Markets', 'RWA Lending'] },
  { key: 'Dex', fallback: 0.3, cats: ['Dexs', 'Perps', 'Perpetuals', 'Derivatives', 'Options', 'Leveraged Farming', 'Prediction Market'] },
  { key: 'RWA', fallback: 0.25, cats: ['RWA'] },
  { key: 'Yield', fallback: 0.15, cats: ['Yield', 'Basis Trading', 'Staking Pool', 'Restaking', 'Insurance', 'Liquid Restaking', 'Liquid Staking'] },
  { key: 'Stable', fallback: 0.1, cats: ['Stablecoin Wrapper', 'Dual-Token Stablecoin'] },
  { key: 'Network', fallback: 0.15, cats: ['Chain', 'Payments'] },
  { key: 'Bridge', fallback: 0.5, cats: ['Bridge', 'Canonical Bridge', 'Cross Chain Bridge'] },
  { key: 'CeDeFi', fallback: 0.18, cats: ['CeDeFi'] },
  { key: 'Anchor', fallback: 0.18, cats: ['Anchor BTC'] },
];

const OTHER_FALLBACK = 0.18;
const GROUP_FALLBACK = new Map(GROUPS.map((g) => [g.key, g.fallback]));

export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

export function categoryGroup(kind: string): string {
  for (const g of GROUPS) if (g.cats.includes(kind)) return g.key;
  return kind;
}

export function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  return n % 2 === 1 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
}

export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / 86_400_000));
}

export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not an object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist');
  const protocols: SnapshotProtocol[] = o.protocols.map((value, i) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SnapshotError(`snapshot protocol ${i} is not an object`);
    const p = value as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot protocol ${i} lacks a slug, name or TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return { as_of: o.as_of, source: o.source, floor_usd: o.floor_usd, protocols, watchlist: o.watchlist as string[] };
}

function add(map: Map<string, number[]>, key: string, value: number): void {
  const list = map.get(key);
  if (list === undefined) map.set(key, [value]);
  else list.push(value);
}

function stats(map: Map<string, number[]>): Map<string, ComparableStats> {
  const out = new Map<string, ComparableStats>();
  for (const [key, values] of map) out.set(key, { n: values.length, median: median(values) });
  return out;
}

export interface Comparables {
  byKind: Map<string, ComparableStats>;
  byGroup: Map<string, ComparableStats>;
}

export function buildComparables(snapshot: Snapshot): Comparables {
  const kinds = new Map<string, number[]>();
  const groups = new Map<string, number[]>();
  for (const p of snapshot.protocols) {
    if (isPreToken(p) || p.category === 'CEX') continue;
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    const kind = p.category ?? 'Uncategorised';
    const ratio = clamp(p.mcap_usd / p.tvl_usd, MODEL.ratio_floor, MODEL.ratio_cap);
    add(kinds, kind, ratio);
    add(groups, categoryGroup(kind), ratio);
  }
  return { byKind: stats(kinds), byGroup: stats(groups) };
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(3)}×`;
}

export function multipleFor(kind: string, comps: Comparables): Multiple {
  const own = comps.byKind.get(kind);
  const group = categoryGroup(kind);
  const groupStats = comps.byGroup.get(group);
  const fallback = GROUP_FALLBACK.get(group) ?? OTHER_FALLBACK;
  const groupUsable = groupStats !== undefined && groupStats.n >= MODEL.comparables_min;
  const cap = groupUsable ? groupStats.median : fallback;
  if (own !== undefined && own.n >= MODEL.comparables_min) {
    return { value: own.median, source: 'kind', n: own.n, median: own.median, basis: `${own.n} live ${kind} comparables · median ${formatMultiple(own.median)} TVL` };
  }
  if (own !== undefined && own.n >= 2) {
    const value = Math.min(own.median, cap);
    return { value, source: 'kind-haircut', n: own.n, median: own.median, basis: `${own.n} live ${kind} comparables · median ${formatMultiple(own.median)}; the ${group} cap of ${formatMultiple(cap)} holds it at ${formatMultiple(value)}` };
  }
  if (own !== undefined && own.n === 1) {
    const value = Math.min(own.median, cap);
    return { value, source: 'kind-haircut', n: 1, median: own.median, basis: `1 live ${kind} comparable · ${formatMultiple(own.median)}; the ${group} cap of ${formatMultiple(cap)} holds it at ${formatMultiple(value)}` };
  }
  if (groupUsable) {
    return { value: groupStats.median, source: 'group', n: groupStats.n, median: groupStats.median, basis: `no live ${kind} comparable · ${groupStats.n} live ${group} comparables · median ${formatMultiple(groupStats.median)} TVL` };
  }
  return { value: fallback, source: 'fallback', n: 0, median: null, basis: `no live comparable · ${group} fallback ${formatMultiple(fallback)} TVL` };
}

export function scoreProtocol(p: SnapshotProtocol, asOf: string, multiple: Multiple): Scored {
  const age = ageDays(asOf, p.listed_at);
  const growthPct = clamp(p.change_7d ?? 0, MODEL.growth_floor, MODEL.growth_cap);
  const growthMult = 1 + (growthPct / 100) * MODEL.growth_weight;
  const maturityMult = age === null ? MODEL.unknown_age_maturity : MODEL.maturity_floor + (Math.min(age, MODEL.maturity_days) / MODEL.maturity_days) * MODEL.maturity_range;
  const distributionMult = 1 + MODEL.distribution_step * Math.min(Math.max(p.chains.length - 1, 0), MODEL.distribution_cap);
  const implied = Math.max(1, Math.round(p.tvl_usd * multiple.value * growthMult * maturityMult * distributionMult));
  return { implied, age, growthPct, growthMult, maturityMult, distributionMult };
}
