# desk / ticket-rail

The six-stage rail of the "ticket in flight" card on its own: six coloured dots (scan, research, price, size, fill, close) that ignite with a ring and flare, a gradient fill with a running shine, a pulsing marker with a comet tail, stage labels and a "now working" row with the agent orb, its verb and a value from the latest decision.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html` and call `JEV.boot()`. Markup contract: `.dkw-rail` carries `--q` (0..5, current stage) and `--mc` (marker colour); each `.dkw-sd` has `--n` and `--ac`, and gets class `on` when reached. The rail has 6 equal columns, so keep six dots.

## Data consumed
Bus `decision` (restart at stage 0, the "now" row shows symbol / conf / net edge / size / price / destination), `kill` (marker turns red, "halted"). Idle, it advances by itself every 1.5 s.

## Swap in real data
Set `q` from your order state machine and call `paint()`; pass real tickets through `JEV.bus.emit('decision', d)`.

Everything shown is simulated.
