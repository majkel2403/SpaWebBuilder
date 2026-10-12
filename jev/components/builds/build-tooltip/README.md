# builds / build-tooltip
The glass tooltip card of a build: accent header with name and primitive, plus last answer, confidence, typed-answer latency and gate result; hover, focus or tap one of four build chips.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`.bld-tip` is a single absolutely-positioned card (default `opacity: 0`, add class `on` to show) inside a `position: relative` host: header `.bld-tip-h` (name + primitive, coloured by `--cc`; set `data-c="pink|green|blue|yellow|violet|..."` on the tip) and a `dl` of four rows (last answer, confidence, typed answer ms, gate; the gate `dd` takes `data-d="execute|review|skip"`) and a footnote `p`. It is moved with `transform` (the demo centres it under the hovered chip, clamped to the host) and the content is refilled on open.

## Data
`JEV.BUILDS[i]` (key, name, prim, colour) and the newest decision of that build (`d.conf`, `d.ms`, `d.dest`, plus an answer string from `ans(key, d)`). Confidence under `JEV.S.floor` turns amber. To use real data: keep your own `last[key]` object and call `fill(i)`.
