# Prelaunch Atlas

## What it is

A static, offline dashboard that ranks DeFi protocols which record no token by the implied value a launch could carry, and gives each one a concrete farm plan. It is an entry in make.fun's token-radar-01 bounty.

## Who it serves

The judge of the bounty, and a crypto-curious reader who wants to know which pre-token protocols are worth farming. The reader may not know the protocols, so the page must explain itself in one screen and let the data carry the rest.

## The job

- Show the board: the 40 watchlist protocols and 260 pre-token protocols below the floor, ranked by implied value.
- Explain the value model from the snapshot's own figures (TVL, seven-day change, age, category comparables), never from a list of names.
- Give every row a farm plan with concrete steps, cost and time.
- Separate protocols whose token already trades from those still pre-token.
- Be sortable, filterable and readable at a glance, with a detail view for every protocol.

## Truth and constraints

- Snapshot: DefiLlama protocols API, fetched 2026-11-14. 758 protocols at or above $5M TVL; 40 on the watchlist; 342 record no token; 416 trade a token. Floor $50M.
- The board's implied value is the entry's claim, not a prediction that a token will launch. Say a protocol records no token, never that it has none.
- Static site, no network at runtime. Dashboard at most 400 files and 4 MiB; source text under 64 KiB; three screenshots at 1440×1024, each at most 512 KiB.
- `board.json` 100–4,000 rows; every watchlist slug present; ranks 1..N; implied value non-increasing; farm steps 3–12 strings of 20–600 characters.
- Node 22, standard library only. The kit's `vendor/makefun-board.ts` is used as shipped for the dossier. Fonts are OFL and self-hosted; no other third-party code or assets.
- No financial advice, no fabricated claims, no claim of token issuance.

## Success

The judge picks this radar in a pairwise comparison on: a working radar, a value model that follows from the snapshot, farm plans with cost and time, a usable dashboard, and craft.
