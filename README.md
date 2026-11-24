# Prelaunch Atlas

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/obvirm/prelaunch-atlas/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/obvirm/prelaunch-atlas/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A field guide to DeFi protocols that record no token, ranked by the value a launch could carry, with a farm plan for every one. It reads the sealed snapshot, derives each kind’s multiple from live comparables, and writes a sortable board, a per-protocol plate with a launch-readiness checklist, a screened-out table for the pre-token protocols it sets aside, a live table, and the method behind the numbers. A seed-order basket totals the capital, gas, setup and longest hold for any set of rows.

## Run it

```sh
node main.ts --input /input/snapshot.json --output /output
```

The program is Node 22, standard library only. It writes `board.json` and the dashboard’s `data.js`, copies `dashboard/` and `screenshots/` to the output directory, and writes `dossier.json` with the competition’s official dossier builder. Add `--dev` to build without the dossier, for a quick local preview.

## The radar

- **178 ranked rows.** 40 protocols on the house watchlist (TVL at or above $50,000,000 with no token) plus 138 field trials below that floor. The watchlist is the floor of the board, not its ceiling.
- **164 screened out, with the reason.** The other pre-token protocols are in their own table: bridges, liquid staking and restaking, wrapped or versioned products, exchange tokens, and above-floor protocols outside the 40-name house selection. All 342 pre-token protocols are accounted for.
- **416 live tokens set aside.** A protocol whose token already trades is not a pre-token candidate; the live table shows them for context and does not rank them.
- **Expected yield** = TVL × kind multiple × vigor × years in field × distribution. The kind multiple is the median market cap to TVL of live protocols in the same kind, each ratio held between 0.02× and 2×; with fewer than four live comparables, the lower of the kind’s median and its wider group’s; with none, a stated fallback.
- **Six-step farm plans** for every row, each with a cost and a time, from the first wallet to the exit note.
- **Launch readiness on every plate.** Six signals from the snapshot — no token on record, TVL against the floor, years in field, 7D vigor, chains, and the kind-multiple sample — then three checks the radar cannot make for you: the official points or claim page, the contract and address, and wallet hygiene. The signals are the record’s own, not a score; the manual items are not checked, and no item predicts a token or eligibility.
- **Seed-order basket.** Add a row from the board or its plate; the fixed bar totals the capital at work, gas for two moves per plan, setup minutes, the longest hold, the total implied value and the implied ÷ capital cover ratio. The basket travels in the URL and is remembered in local storage.
- **The dashboard** is a static field guide: board, per-protocol plate with its launch-readiness checklist, live table, screened-out table, method, and the seed-order bar and drawer. It needs no network and no build step.

## Where the numbers come from

The snapshot is the competition’s sealed DefiLlama protocols data, as of 14 November 2026: 758 protocols at or above $5,000,000 TVL, 40 of them on the watchlist. Every implied value in this repository is the entry’s own claim, not a prediction that a token will launch, and nothing here is financial advice. The basket’s capital is the position at work, not a fee; gas covers two moves per plan; the hold is the longest plan; setup is the sum; the cover ratio is implied ÷ capital, not a return. A screened row’s reason comes from the snapshot’s own category, name and floor.

The typefaces are self-hosted: Bricolage Grotesque and Archivo, used under the SIL Open Font License; their license files sit in `licenses/`.

## Screenshots

`screenshots/1-board.png`, `2-detail.png` and `3-filtered.png` are 1440×1440 captures of the built dashboard in headless Chrome on 25 November 2026: the board with the Screened out tab, the USDD plate with its launch-readiness checklist and Add to the seed order, and the board filtered to RWA with a three-lot seed order and its totals in the fixed bar. The competition’s image gate caps the long side at 1440 and asks for a short side of at least 800; these are viewport-height captures, not full-page. The design system, including the screenshot and review provenance, is in [DESIGN.md](DESIGN.md).

## License

MIT. See [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
