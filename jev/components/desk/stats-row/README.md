# desk / stats-row
A compact stats row: four labelled mono figures (tickets, win rate, average edge, max drawdown) under a hairline, with a conic-gradient ring beside the win rate and a pink glow flash whenever a figure changes. Collapses to 2 x 2 on narrow screens. Simulated lifetime figures.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `.dkt-stats > div > label + b.num`; the ring is `<i class="dkt-ring" style="--p:55">` (`--p` = 0-100, colour via `--green`). Add or drop cells freely, the grid is `repeat(4, 1fr)`.

## Data consumed
Bus `tick` (mark-to-market for max drawdown) and `decision` (executed tickets: count, win rate, average edge in bps).

## Swap in real data
Replace `sim` (`tixN`, `outc` signed bps per trade, `sumBps`/`nBps`, `dd` as a fraction); `flush()` renders it twice a second.
