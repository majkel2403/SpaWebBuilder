# desk / pnl-odometer
The P&L hero number as a standalone atom: a serif balance whose digits roll like an odometer (old glyph slides out, new one springs in, neon glow overlay per digit), a green/red delta pill with arrow that pops on sign change, an animated halo behind the number and floating "+$x . buy 2%" pops for every executed ticket. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup contract: `.dkt-pnl` card (gets `.dkt-neg` when below the open) > `.dkt-big` > `.dkt-num` > `<span id=dkto-bal>` (digits are generated into it). CSS variables: `--pc` / `--pc-rgb` (accent: green or red) are set by the `.dkt-pnl` / `.dkt-neg` classes; `--serif` for the face.

## Data consumed
Bus `tick` ({price, dp}, 4 Hz) marks open tickets to market; bus `decision` (executed buy / sell / close / flatten) opens tickets and jumps the balance; `JEV.S.killed` flips the pill to "halted".

## Swap in real data
Replace the local `sim` block with your account feed: call `setBal(value)` on each fill / mark-to-market and set `sim.open` to the session-open equity. `flush()` (4 Hz) renders the digits, the pill and the screen-reader copy.
