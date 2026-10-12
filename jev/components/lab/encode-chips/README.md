# lab / encode-chips

Stage 01 of the pipeline on its own: the ten features Jev sees. Nine come straight from the simulated market state (edge, imbalance, spread, vol, position, pnl, drawdown, latency, signal age), the tenth is the derived net edge (dashed chip). Every chip shows a value and a glowing bar: centred and signed for bipolar features (a red bar when negative), left-anchored for the others. Values inside a risk band get a red outline. On every decision the chips pop in with a stagger and the card flashes.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-ft bi" data-c="pink"><span>edge</span><b>+9.0</b><i class="lab-cb"><u style="--v:.22"></u></i></div>
```
`--v` is -1..1 for `.bi` chips and 0..1 otherwise. Add `neg`, `bad` or `drv` for the red bar, red outline and dashed derived style. The grid is `.lab-fts` (auto-fill, min 128px).

## Data
Bus `decision`: `d.state{edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s}` and `d.net`.

## Swap in real data
Emit decision-like records on `JEV.bus` with those fields, or call `show({state, net}, true)` from `component.js`. Ranges and risk bands live in the `FIELDS` table.
