# desk / pnl-panel
The SWARM P&L card: a big serif balance whose digits roll like an odometer, a +/- pill vs the session open, a cached balance-history canvas (green above the open line, red below, comet trail, new-high embers, new-low crack, hover/touch scrub), a win/loss strip and bars for result / route / size, plus lifetime stats and a win-rate ring. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, include the three component files and call `JEV.boot()`.

## Data it consumes
Bus events from `engine.js`/`core.js`: `tick` ({price, dp}, 4 Hz), `decision` (action, symbol, size, conf, dest, venue, build, state), `kill` (via `JEV.S.killed`). Everything is simulated.

## Swap in real data
The balance (`sim.bal`), history ring (`hist`) and outcome strip (`sim.outc`, in bps per executed ticket) are local; feed them from your account by calling `setBal(value)`/`hpush(value)` on each fill and mark-to-market instead of simulating them in the `tick`/`decision` handlers. Route bars read `JEV.S.dest`.
