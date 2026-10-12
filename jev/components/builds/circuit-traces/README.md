# builds / circuit-traces
A canvas of circuit traces: one trunk drops from a cap into a twin-hairline bus with a stub into the top of every card, with bits travelling the wires, a bright pulse per decision and a red switch under the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
A host `.bld-ct` (`position: relative`, top padding = cap + canvas height) with a cap `.bld-ct-cap`, a `canvas.bld-tr` positioned over the gap, and a row of target cards `.bld-ct-nodes > .bld-ctn`. The canvas draws: a trunk from the cap (x = centre), a bus line with a twin hairline, and a stub that ends in a small pad at the top of every target card (x = card centre, measured from `offsetLeft` / `offsetWidth` on resize via `JEV.watch`).

## Data
Pure decoration plus one live signal: two bits always travel each wire (tier 2+, still drawing when reduced motion), and each bus `decision` sends a bright pulse down the stub of the build that answered, which flashes its card on arrival. Kill switch recolours everything red. To use real data: push `{k: stubIndex, t0: now}` into `pulses` for any event.
