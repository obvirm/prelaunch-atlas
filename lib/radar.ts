import { EARLY_ROWS, LIVE_ROWS, MODEL } from './types.ts';
import type { BoardRow, KindMultiple, LiveRow, RadarData, Snapshot, SnapshotProtocol } from './types.ts';
import { buildComparables, categoryGroup, isPreToken, multipleFor, scoreProtocol } from './data.ts';
import type { Comparables } from './data.ts';
import { farmPlan, stepText } from './plan.ts';

const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;
const WRAPPED = /\b(wrapped|staked|staking)\b/i;
const EXCHANGE = /^(binance|coinbase|bybit|kraken|bitget|okx|bitfinex|gemini)\b/i;
const EXCLUDED_CATEGORIES = new Set(['CEX', 'Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC']);

function isEarlyCandidate(p: SnapshotProtocol, watchlist: Set<string>, floor: number): boolean {
  if (watchlist.has(p.slug) || !isPreToken(p)) return false;
  if (p.tvl_usd >= floor) return false;
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name) || WRAPPED.test(p.name) || EXCHANGE.test(p.name)) return false;
  return true;
}

export function buildRows(snapshot: Snapshot, comps: Comparables): BoardRow[] {
  const watchlist = new Set(snapshot.watchlist);
  const index = new Map(snapshot.protocols.map((p) => [p.slug, p]));
  const chosen = new Map<string, SnapshotProtocol>();
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isEarlyCandidate(p, watchlist, snapshot.floor_usd))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .slice(0, EARLY_ROWS);
  for (const p of early) chosen.set(p.slug, p);

  const scored = [...chosen.values()].map((p) => {
    const kind = p.category ?? 'Uncategorised';
    const multiple = multipleFor(kind, comps);
    const score = scoreProtocol(p, snapshot.as_of, multiple);
    const plan = farmPlan(p, score.age);
    return {
      p,
      kind,
      multiple,
      score,
      plan,
      watch: watchlist.has(p.slug),
    };
  });
  scored.sort((a, b) => b.score.implied - a.score.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    kind: s.kind,
    group: categoryGroup(s.kind),
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    listed_at: s.p.listed_at,
    age_days: s.score.age,
    implied_value_usd: s.score.implied,
    multiple: s.multiple.value,
    multiple_source: s.multiple.source,
    multiple_n: s.multiple.n,
    multiple_basis: s.multiple.basis,
    growth_pct: s.score.growthPct,
    growth_mult: s.score.growthMult,
    maturity_mult: s.score.maturityMult,
    distribution_mult: s.score.distributionMult,
    watchlist: s.watch,
    early: !s.watch,
    farm_steps: s.plan.map(stepText),
    farm_plan: s.plan,
  }));
}

export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX' && p.mcap_usd !== null && p.mcap_usd > 0)
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd!,
      change_7d: p.change_7d,
      listed_at: p.listed_at,
    }));
}

function kindTable(rows: BoardRow[], comps: Comparables): KindMultiple[] {
  const kinds = [...new Set(rows.map((r) => r.kind))].sort((a, b) => a.localeCompare(b));
  return kinds.map((kind) => {
    const multiple = multipleFor(kind, comps);
    return { kind, group: categoryGroup(kind), n: multiple.n, median: multiple.median, value: multiple.value, source: multiple.source, basis: multiple.basis };
  });
}

export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const comps = buildComparables(snapshot);
  const board = buildRows(snapshot, comps);
  const live = liveRows(snapshot);
  const liveSize = snapshot.protocols.filter((p) => !isPreToken(p)).length;
  const preSize = snapshot.protocols.filter(isPreToken).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    snapshot_size: snapshot.protocols.length,
    pre_size: preSize,
    live_size: liveSize,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: board.filter((r) => r.early).length,
    live_shown: live.length,
    model: MODEL,
    kinds: kindTable(board, comps),
    rows: board,
    live,
  };
  return { board, radar };
}

export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  if (board.length < 100 || board.length > 4000) return `the board holds ${board.length} rows, not 100 to 4000`;
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slugs: ${missing.slice(0, 5).join(', ')}`;
  const known = new Set(snapshot.protocols.map((p) => p.slug));
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) return 'all rows share the same implied value';
  for (const r of board) {
    if (!known.has(r.slug)) return `${r.slug} is not in the snapshot`;
    if (r.name.length === 0) return `${r.slug} has no name`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has an invalid implied value`;
    if (r.farm_steps.length < 3 || r.farm_steps.length > 12) return `${r.slug} has ${r.farm_steps.length} farm steps`;
    for (const step of r.farm_steps) if (step.length < 20 || step.length > 600) return `${r.slug} has a farm step of ${step.length} characters`;
  }
  return null;
}

export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
