# desk / balance-line
The SWARM balance history as an area chart: 300 samples (one per market tick), a dashed line at the session open, the part above the open filled and stroked green, the part below red, a pulsing glow head on the latest sample and a scrub tooltip on mouse hover or touch (shows balance and delta vs open). Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. The canvas is DPR-fitted with `JEV.fit` and only repaints while the card is on screen (`JEV.task`). CSS variables: `--pc` / `--pc-rgb` (accent) from `.dkt-pnl` / `.dkt-neg`.

## Data consumed
Bus `tick` ({price, dp}, 4 Hz) feeds the history ring through the mark-to-market of open tickets; bus `decision` (executed) opens tickets and makes the balance jump.

## Swap in real data
Replace the local `sim` block: call `hpush(equity)` once per sample (oldest to newest ring of 300) and keep `sim.open` / `sim.bal` current; the chart reads only `hat(i)`, `sim.open` and `sim.bal`.
