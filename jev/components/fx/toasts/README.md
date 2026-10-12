# fx / toasts
`JEV.toast(message, kind)` shows a glass pill with icon and countdown bar at the bottom centre. Kinds: `info`, `ok`, `kill`. Lives 3 s, hover holds it, tap / swipe / Esc dismisses it, at most two stack, identical messages replace each other.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), inline them with the folder files into one page (see `build-components.mjs` for the order: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last. Needs `<div id="fx-toasts" role="status" aria-live="polite"></div>`.

**Data it consumes:** bus `kill` (bool) raises the halted / armed toast and bus `floor` (number) raises "floor -> 0.90". Call `JEV.toast` directly for anything else (a fill, a risk breach); replace the bus listeners with your own events.
