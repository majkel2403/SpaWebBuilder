# desk / ticker
The cinematic status-ticker card of the JEV desk: pink-lit wordmark, a 60 s "handoff pulse" canvas (green executed, amber review, grey skipped), desk nav, session p&l, floor, a UTC clock and a looping marquee of chips (model fair vs market, edge, open tickets, spend, last ticket, kill switch). Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css` (from `src/`), include `component.css`/`component.html`/`component.js` and call `JEV.boot()`. `index.html` here is a ready-built example.

## Data it consumes
Bus events from `engine.js`/`core.js`: `tick` ({price, dp}, 4 Hz), `decision` (action, symbol, size, conf, dest, venue, build, state), `kill` (via `JEV.S.killed`). Everything is simulated.

## Swap in real data
Replace the bus emitters (`JEV.bus.emit('tick', {price, dp})`, `JEV.bus.emit('decision', d)`) with your own feed and set `JEV.S.cost`, `JEV.S.floor`, `JEV.S.killed`; the p&l/nav shown on the ticker is a local simulation (`sim.bal`) driven by those events - bind it to your real account balance instead.
