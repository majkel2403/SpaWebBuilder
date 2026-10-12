# lab / typed-questions

Jev's three typed questions as one panel: **which action?** (choice: five probability bars, winner highlighted, confidence ring), **how much?** (score: four size columns, 0.5 / 1 / 2 / 4 % of capital) and **risk ok?** (flag: gauge with YES / NO and seven risk-check chips that light red when tripped), plus the latency badge.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data it consumes
Bus `decision`: `action, p{buy,sell,hold,close,flatten}, conf, size, sizes[4], sizeIdx, pRisk, riskOk, ms, killed` and `state{spread_bps, latency_ms, signal_age_s, daily_pnl, drawdown_pct, vol_1h}` for the chips. Bus `kill` updates the kill chip.

## Swap in real data
Emit your own decision records on `JEV.bus` with those fields, or call `show(decision, true)` in `component.js`. Thresholds for the chips are in `riskChecks()`.
