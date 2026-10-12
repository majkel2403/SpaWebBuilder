# pane-questions-py

The light `questions.py` pane: typed questions (choice / score / flag) and the hard rules held by code. The current-line band follows each decision; on the bus `kill` event it jumps to the KILL_FILE line and the line turns red (needs `document.body.classList.toggle('killed')`, which `JEV.setKilled` does).

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the three shared files `engine.js`, `core.js` and `base.css` of the JEV runtime,
inline them in that order into your page (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.
No other component is needed; optional pieces (the fx module's toast) are used only when present.

## Data it consumes
* `JEV.bus` event `decision` (fields `id symbol action conf size sizes sizeIdx riskOk pRisk dest reason ms floor killed state{price edge_bps spread_bps imbalance position_pct daily_pnl latency_ms}`), `kill` (bool), `floor` (number).
* `JEV.recent[]` (seed lines) and `JEV.S` (floor, killed) from `core.js`.

## Swap in real data
Skip the simulator: replace the `decision` emitter by your own call `JEV.bus.emit('decision', {...})` with the fields above (core.js's simulated feed is the only producer; drop it or ignore it).
