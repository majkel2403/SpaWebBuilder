# builds / rules-card
The yellow "thresholds + hard rules" card: floor, daily loss cap, max position and kill switch held by code, the rule that blocked a decision flashes.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`article.bld-card.bld-rules[data-c="yellow"]` > `.bld-hd` + `.bld-rl` (four `.bld-rc[data-r="floor|cap|pos|kill"]` cells with a `span` label and a `b` value) + `.bld-rw`. The kill cell's value has class `up` (green when armed, red when halted, via `body.killed`).

## Data
`JEV.S.floor`, `JEV.S.killed`, `JEV.RULES.lossCap / maxPos`. On every `decision` the cell responsible for a non-execute result (kill switch / risk flag -> loss cap / conf < floor / size >= 4) flashes amber, a pass flashes green. The button calls `JEV.setKilled()`.
To use real data: write your own limits into the `<b>` values (`#bld-r-*`) and call `step(d)` with your own gate result.
