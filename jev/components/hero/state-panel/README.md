# hero / state-panel
The STATE input column of the diagram: all fifteen state fields as ports with a right-aligned key and a live value, a 20-decision sparkline behind the numeric ones and a glow on every field that changed.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 420px), include component.css and component.js, and call `JEV.boot()`. Markup: a `.hsp-panel` with an empty `<ol id="hspRows">`; the script builds one `.hsp-row` per entry of `JEV.STATE_KEYS`. Toggle `.is-lit` to highlight a row. Panel width is set on `.hsp-panel`.

## Data
JEV.bus `decision` -> `d.state` (symbol price vwap_dist_bps spread_bps imbalance funding_bps vol_1h edge_bps position_pct daily_pnl drawdown_pct latency_ms signal_age_s venue regime).

## Swap in real data
Feed real market state by emitting `decision` records whose `state` has those fields, or edit `text()` and `NUM` to map your own fields.
Everything shown is simulated; no orders are placed.
