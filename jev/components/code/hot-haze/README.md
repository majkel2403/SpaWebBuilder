# hot-haze

A pure CSS effect pane (no JavaScript): the hot-pink skin used for state.json with its three stacked effects. A diagonal white sheen glides across every 7.5 s, two layers of rising translucent plumes plus a warm heat floor give a haze, and `body.killed` cross-fades the whole pane to an orange-red gradient.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-pane.code-hot` > header + a wrapper that contains the `<pre>` and `<div class="code-haze"><i></i><i></i></div>` (two plume layers; the second shows only on tier 3). The sheen is `.code-hot::before`, the kill tint `.code-hot::after`. All text is black on pink through `--t-*` variables set to `#0c0207`; tag the pane with `.code-hot` and keep children `position: relative`. Compositor-friendly: only `transform` is animated.

## Data it consumes
None. Reacts to `body.killed` (set by `JEV.setKilled`) and `html[data-tier]` only.

## Swap in real data
Put any text in the `<pre>`. Remove the `.code-haze` block for a calmer pane, or change its colours (`rgba(255,190,90,...)`) for another heat tint.
