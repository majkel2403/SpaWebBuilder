# desk / kv-strip
Four compact KPI readouts as used in the desk status bar: a 9 px tracked uppercase label above a 15 px tabular mono value. NAV and session P&L follow the simulated book (P&L is green or red), the floor and the kill-switch state follow `JEV.S`. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `.dkt-kvs > div > label + b.num`; add or remove cells freely (flex row, wraps on narrow screens). Colours via `--dkt-k` (label) and `--dkt-ink` (value).

## Data consumed
Bus `tick` and `decision` (mark-to-market and executed jumps), `JEV.S.floor`, `JEV.S.killed`.

## Swap in real data
Replace the `sim` block with your account and set `sim.bal` / `sim.open`; read floor and kill state from your own risk service.
