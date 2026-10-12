# builds / segmented-squares
A ten-square glowing segmented bar atom (n of 10) in four colours: a pinging live row, two static rows and one you can click or arrow-key.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`.bld-sg` = a 10-column grid of `<i>` squares; add class `on` to light one. Colour is the CSS variable `--bc` on any ancestor (`style="--bc:#35e0a8"`). Wrap it with a label row `.l > span + b` (as in the demo `li.bld-rr`). Squares are 13px high; change `.bld-sg i { height }` for thicker segments, or the column count in `grid-template-columns` for other scales.

## Data
Use `paint(li, n)` to set n of 10 (the demo derives it from `data-n`). The first row pings one lit square per bus `decision` (`J.animate`). To use real data: call `paint` with a share of your own (e.g. `Math.round(10 * apiShare)`).
