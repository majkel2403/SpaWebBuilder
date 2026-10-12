# lab / decision-lab

The whole interactive lab without its section heading: a state card (nine sliders, scenario chips, decide / auto, confidence floor, kill switch), a tape of the last five decisions and the four-stage pipeline (encode, typed questions, the gate, code acts) with the ribbon / comet / particle canvases.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (the builder in `build-components.mjs` inlines them), then call `JEV.boot()`. Open `index.html` for the standalone page.

## Data
* Input: the nine sliders (`edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s`), `JEV.S.floor`, `JEV.S.killed`.
* Bus: listens to `floor` and `kill` (two-way: the lab also calls `JEV.setFloor` / `JEV.setKilled`); emits a `decision` record on every committed run.
* Decision fields shown: `action, size, conf, riskOk, pRisk, p{}, sizes[], dest, reason, ms, floor, killed, net`.

## Swap in real data
Replace `decideState()` in `component.js` (it wraps `JEV.decide(state)`) with a call to your model / service that returns the same decision fields, and replace the slider defaults in `FIELDS` with your own feature ranges.
