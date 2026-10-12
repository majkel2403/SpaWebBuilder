# hour / hour-switches

Panel "the hour": 60-minute radar ring, six switches (strategy spec, data, bot code, backtest, paper trade, caps + kill switch), gantt rail and the ARMED banner with a burst + shockwave. Loops by itself; tap a switch to flip it.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 760px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/hour-switches` produces the ready-made `index.html`.

## Data it consumes
- bus `kill` (bool) + `JEV.S.killed` — banner reads HALTED / ARMED
- bus `floor` + `JEV.S.floor` — printed in the ARMED subtitle ("gate open at floor 0.85")
- phase minutes: `PHS`, `GR`, `DUR` constants and the six `<li>` switches in `component.html`

## Swapping in real data
Change the phase boundaries in `PHS` / `GR` / `DUR` and the six labels in the HTML; to drive it from a real pipeline set `mode = "manual"`-style state yourself via `setSw(i, bool, true)` and `updArm()`.

Everything shown is a simulation: no order is placed and no figure is a real result.
