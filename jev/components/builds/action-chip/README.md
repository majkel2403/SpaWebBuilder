# builds / action-chip
The pill that shows the last action (buy, sell, hold, close, flatten) with an arrow glyph, three pulsing primitive dots and a one-line last-answer capsule, plus all five states side by side.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`<b class="bld-chip" data-a="buy|sell|hold|close|flatten">buy</b>` is a pill coloured by action (buy green with a triangle up, sell red, hold grey, close amber, flatten pink) via CSS `color` + `border: currentColor`; override with `--cc` for custom states. `.bld-dots > i` are three dots (choice / score / flag) that pulse on each decision (red under the kill switch). `.bld-last[data-d="execute|review"]` is the one-line capsule.

## Data
Bus `decision`: `d.action`, `d.symbol`, `d.conf`, `d.dest`. To use real data: set `chip.dataset.a` and text from your own signal.
