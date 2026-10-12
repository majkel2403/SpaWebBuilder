# lab / state-controls

The lab's control card on its own: nine input sliders (red bands mark the zones that trip `risk_ok`), seven scenario presets (trend, mean-revert, wide book, stale feed, reversal, stress, random), DECIDE + AUTO, the confidence-floor slider, the kill switch and the hard-rule caps. A live `state.json` readout shows exactly what the card emits.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data it produces
`JEV.bus.emit('lab-state', { state, floor, killed, why, decision })` - `why` is `scrub` while a slider moves, otherwise `decide | preset | input | floor | kill`.
`state` = `edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s`.
Floor and kill are two-way via `JEV.setFloor()` / `JEV.setKilled()` and the `floor` / `kill` bus events.

## Swap in real data
Subscribe with `JEV.bus.on('lab-state', e => myModel(e.state, e.floor))` and drop the built-in preview (`decideState()` in `component.js`, a wrapper around `JEV.decide`). To drive the sliders from a feed instead, call the row setter `setVal(field, value)` (see `component.js`) or replace `PRESETS` with your own scenarios.
