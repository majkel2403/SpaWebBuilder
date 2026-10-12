# builds / confidence-sparkline
A 24-point SVG sparkline atom with a dashed floor line, soft area fill and a glowing head dot that turns amber under the floor, shown as four live variants.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`i.bld-sp > svg[viewBox="0 0 46 12" preserveAspectRatio="none"]` containing `line.fl` (dashed floor), `polygon` (area) and `polyline` (line), followed by an `em` head dot; the sparkline stretches to any box (set the height on `.bld-sp`). The accent comes from `--cc` / `--cc-rgb` (or a `data-c` ancestor). Add class `lo` to the wrapper to turn the dot amber.

## Data
A ring of the last 24 values per row: `rows[i].h.push(v); h.shift(); draw(row)`. Demo rows: `d.conf`, max of `d.sizes`, `d.pRisk`, `d.p.hold` from bus `decision`; the dashed line is `JEV.S.floor` (bus `floor`). Each row has its own value range (`data-lo` / `data-hi`). To use real data feed any 0..1 series into `h`.
