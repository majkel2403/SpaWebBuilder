# desk/drift-chart — Drift vs noise chart

140 random-walk equity curves with a small positive drift, ±2σ cone, live end-value histogram, hover probes and a halted state.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` (from `jev/src`); inline them with the component's `component.html/css/js` and call `JEV.boot()` (the shared `main.js` does it). `node jev/build-components.mjs --only desk/drift-chart` builds a standalone `index.html`.

**Data consumed:** `JEV.S.killed` / body.killed (halts); bus `decision` only for the card heartbeat glow.

**Swap in real data:** replace `gen()` so `PX[i*S1+k]` holds the equity (bps) of path i at step k; everything else follows.
