# lab / pipeline

The four-stage decision pipeline: 01 encode (nine inputs plus net edge as bar chips), 02 typed questions (choice / score / flag), 03 the gate (confidence vs. a draggable floor, with a glitch tear below it) and 04 code acts (handoff.json, queue/ tree, EXECUTE / REVIEW / SKIP stamp). A spine, ribbons, a comet and additive particle bursts run on two canvases. It plays by itself on a built-in demo state that cycles through six scenarios.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data it consumes
* Demo: cycles `PRESETS` in `component.js` (each is the nine input values) while on screen.
* External: `JEV.bus.emit('lab-state', { state, why })` with `state` = `edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s`. `why: 'scrub'` follows live, any other value plays the full 1.3 s run. The first such event switches the demo off. Pairs directly with `lab/state-controls`.
* Bus: `floor` and `kill` (re-decides; the gate marker calls `JEV.setFloor`).

## Swap in real data
Replace `decideState()` (wraps `JEV.decide(state)`) with your model's output using the same fields (`action, p{}, conf, size, sizes[], sizeIdx, riskOk, pRisk, dest, reason, ms, floor, killed, net`), then emit `lab-state` from your feed.
