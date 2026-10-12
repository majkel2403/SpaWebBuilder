# lab / risk-dial

The "risk ok?" flag question: a half-circle gauge whose gradient arc (red - amber - green) fills to `P(risk_ok)` while a needle springs to the same angle, a big serif YES / NO and the probability, and seven reason chips (spread, latency, signal age, loss cap, drawdown, vol, kill switch) with the live value, turning red and glowing when the matching hard threshold is tripped.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Bus `decision`: `d.pRisk`, `d.riskOk`, `d.state{spread_bps, latency_ms, signal_age_s, daily_pnl, drawdown_pct, vol_1h}`. Bus `kill` refreshes the kill chip (reads `JEV.S.killed`). Thresholds are in `riskChecks()`: spread > 8 bps, latency > 300 ms, age > 45 s, loss >= 80% of the cap, drawdown >= 8%, vol >= 160%.

## Markup
Gauge SVG: `.lab-gva` dash offset `100 * (1 - p)`, needle `.lab-gnd` rotation `(p - .5) * 180deg`. Chips: `<li class="bad"><span>spread</span><u>9.4</u></li>`.

## Swap in real data
Feed your own record with `pRisk`, `riskOk` and `state`, or call `show(record, true)`; edit `riskChecks()` to your own limits.
