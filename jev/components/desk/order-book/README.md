# desk / order-book
The depth ladder from THE TAPE on its own: ten ask and ten bid levels with size bars, cumulative-depth shading, grow / shrink flashes, additive tip glow and eaten-level sparks (tier 2+), a spread row with the mid price, an imbalance meter and a depth-heat strip. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, include the three component files and call `JEV.boot()`. The canvas fills `.dkt-obc` (min-height 430px).

## Data it consumes
Bus events from `engine.js`/`core.js`: `tick` ({price, dp}, 4 Hz), `decision` (action, symbol, size, conf, dest, venue, build, state), `kill` (via `JEV.S.killed`). Everything is simulated.

## Swap in real data
Sizes follow target arrays `tA` (asks) / `tB` (bids) that are re-rolled on each `tick` via `retarget()` and biased by the decision field `state.imbalance`; labels come from `bookLabels(price)` (spread from `state.spread_bps`). To use a real L2 feed, write your level sizes into `tA[k]`/`tB[k]` (k = 0 is the touch) and call `bookLabels(mid)` on each update instead of `retarget`.
