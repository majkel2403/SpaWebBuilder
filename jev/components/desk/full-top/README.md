# desk / full-top
The three top cards of the desk together (status ticker, SWARM P&L, THE TAPE), as a 12-column `.dk-grid` exactly like the page. This is the original `desk-top` module; the single-piece components (`ticker`, `pnl-panel`, `candle-tape`, `order-book`) are pruned copies of it.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, include the three component files and call `JEV.boot()`.

## Data it consumes
Bus events from `engine.js`/`core.js`: `tick` ({price, dp}, 4 Hz), `decision` (action, symbol, size, conf, dest, venue, build, state), `kill` (via `JEV.S.killed`). Everything is simulated.

## Swap in real data
See the READMEs of `ticker`, `pnl-panel` and `candle-tape`: all three share one simulation (`sim`, `cands`, `marks`) fed by the bus `tick` / `decision` events.
