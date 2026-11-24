# Prelaunch Atlas

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/obvirm/prelaunch-atlas/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/obvirm/prelaunch-atlas/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A field guide to DeFi protocols that record no token, ranked by the value a launch could carry, with a farm plan for every one. It reads the sealed snapshot, derives each kind’s multiple from live comparables, and writes a sortable board, a detail plate, and the method behind the numbers.

## Run it

```sh
node main.ts --input /input/snapshot.json --output /output
```

The program is Node 22, standard library only. It writes `board.json` and the dashboard’s `data.js`, copies `dashboard/` and `screenshots/` to the output directory, and writes `dossier.json` with the competition’s official dossier builder. Add `--dev` to build without the dossier, for a quick local preview.

## The radar

- **178 ranked rows.** 40 protocols on the house watchlist (TVL at or above $50,000,000 with no token) plus 138 field trials below that floor. The watchlist is the floor of the board, not its ceiling.
- **416 live tokens set aside.** A protocol whose token already trades is not a pre-token candidate; the live table shows them for context and does not rank them.
- **Expected yield** = TVL × kind multiple × vigor × years in field × distribution. The kind multiple is the median market cap to TVL of live protocols in the same kind, each ratio held between 0.02× and 2×; with fewer than four live comparables, the lower of the kind’s median and its wider group’s; with none, a stated fallback.
- **Six-step farm plans** for every row, each with a cost and a time, from the first wallet to the exit note.
- **The dashboard** is a static field guide: board, per-protocol plate, live table, and method. It needs no network and no build step.

## Where the numbers come from

The snapshot is the competition’s sealed DefiLlama protocols data, as of 14 November 2026: 758 protocols at or above $5,000,000 TVL, 40 of them on the watchlist. Every implied value in this repository is the entry’s own claim, not a prediction that a token will launch, and nothing here is financial advice.

The typefaces are self-hosted: Bricolage Grotesque and Archivo, used under the SIL Open Font License; their license files sit in `dashboard/fonts/`.

## Screenshots

`screenshots/1-board.png`, `2-detail.png` and `3-filtered.png` are renders of the built dashboard in headless Chrome on 24 November 2026, 1440px wide and full page: the board, the USDD plate, and the board filtered to RWA and sorted by TVL. The full-page crop is deliberate; the competition’s image gate allows a long side up to 1440 and a short side of at least 800. The design system, including the screenshot and review provenance, is in [DESIGN.md](DESIGN.md).

## License

MIT. See [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
