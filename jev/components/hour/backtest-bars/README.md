# hour / backtest-bars

Panel "the backtest": 1,840 trades as up (green) / down (red) bars, the amber running-total curve, the -22% drawdown block, a draggable / keyboard-scrubbable crosshair with a tooltip and four count-up stats.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 620px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/backtest-bars` produces the ready-made `index.html`.

## Data it consumes
- `buildBT()` — seeded simulation returning `ret[i]` (per-trade return), `eq[i]` (equity), `dd[i]` (drawdown), `pi`/`ti` (drawdown start / trough), `worst`, `annual`
- bus `tier` — re-renders the heat glow

## Swapping in real data
Make `buildBT()` return the same shape from real trade results: `ret` (Float32Array of N returns), `eq` (N+1 equity multiples starting at 1), `dd` (N+1 drawdown fractions), `pi`/`ti` (peak / trough trade index), `worst`, `final`, `emax`, `emin`, `annual`. Set `N` to your trade count.

Everything shown is a simulation: no order is placed and no figure is a real result.
