# line-gutter

A code view with a line-number gutter and the "current line" treatment of an editor: a translucent band with a pink left rule and a gutter-side glow slides between lines with a springy ease, the active line number turns pink with a text glow, and every hop flashes a soft selection sweep. Simulated decisions drive it along the path ask -> gate -> (skip) -> write; users can click a line or use arrow keys.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`<div class="code-ln [act]"><span class="code-no">N</span>…tokens…</div>` rows of a fixed height (`--code-lh`, 19 px here) inside a `position:relative` doc that also contains one `<i class="code-band">`. Move the band with `transform: translate3d(0, line * 19px, 0)` and toggle `.act` on the row. Variables: `--code-band --code-bandc --code-gut --code-gut-t --code-sel --code-no`.

## Data it consumes
Bus `decision` (`dest`) only chooses the route; the view itself needs no data.

## Swap in real data
Call `go(lineIndex, true)` from your own events (debugger stopped here, test failed on line N, an LLM touched this line).
