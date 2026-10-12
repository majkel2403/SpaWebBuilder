# builds / section-head-stats
The builds section header: eyebrow, serif headline, lede and a glass stat strip with a decisions odometer, median latency, token count and a live lamp.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`.sec-head.bld-head` with the text block `.bld-head-t` (`.eb`, `h2.h2`, `p.lede`) and the stat strip `.bld-stats`: cells `div > label + b` (give the value `class="hot"` for pink glow) and `.bld-live` (lamp + status). The decisions number is an odometer (reels per digit, readable copy in `.sr-only`).

## Data
`JEV.S.count` -> decisions, median of `JEV.S.ms` -> median, `JEV.S.killed` -> live / halted. Tokens (0) and local (2) are static text.
To use real data: change `upd()` to read your own counters; the odometer is `odo(el, text).set('1,893')`.
