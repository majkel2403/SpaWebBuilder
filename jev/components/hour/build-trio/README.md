# hour / build-trio

Panel "the build": Hermes (pixel robot), Dots and Jev (orbs) with dotted conduits and comets, the live "last answer" chip, a looping candle replay with entries / exits / dashed stops, three hard-rule chips (daily loss cap, max position, kill switch) and four count-up stats.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 1240px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/build-trio` produces the ready-made `index.html`.

## Data it consumes
- bus `decision` (`d.action`, `d.symbol`, `d.conf`, `d.dest`) — one comet per decision and the "last answer" chip
- bus `kill` (bool) + `JEV.S.killed` — turns the arcs / orb red; the kill chip calls `JEV.setKilled()`
- `JEV.RULES.lossCap` / `.maxPos` — printed in the rule chips
- candle tape: seeded simulation in `genCandle()` (arrays `tO/tH/tL/tC` = open/high/low/close, `trades` = entry/stop/take/exit)

## Swapping in real data
Replace `genCandle()` with a feed that pushes real OHLC into `tO/tH/tL/tC` and real fills into `trades`; emit your own decisions on `JEV.bus` (`JEV.bus.emit("decision", d)`).

Everything shown is a simulation: no order is placed and no figure is a real result.
