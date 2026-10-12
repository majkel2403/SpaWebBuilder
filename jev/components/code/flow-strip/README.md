# flow-strip

The hermes > jev > code > queue strip from the section head: four tinted node cards (orange, pink, yellow, green) joined by dashed wires along which a pink spark travels. Each simulated decision lights the nodes in order (0 / 0.2 / 0.5 / 0.9 s) and the last node shows where the order went, coloured green (execute), amber (review) or grey (skip).

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`<div class="code-fn" data-c="orange|pink|yellow|green" [data-d="execute|review|skip"]><small>label</small><b>text</b></div>` separated by `<i class="code-fw"></i>`. `.on` lights a node. Per-node colour: `--cc` and `--cc-rgb` (comma separated) - set them on any node for a new tint. On narrow screens the small labels are dropped and the wires shrink.

## Data it consumes
Bus `decision` (`dest`).

## Swap in real data
Rename the nodes in the markup (e.g. signal > model > risk > broker) and call `light(index, {dest})` from your real pipeline stages.
