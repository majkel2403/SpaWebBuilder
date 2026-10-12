# handoff-packets

A tiny canvas particle effect: when a decision is written to queue/, 7-11 comets (additive glow sprites with a 3-sample trail) leave the "Saved handoff" line, arc down and fly into the matching counter (pink execute, amber review, grey skip). On arrival the counter bumps and an arrival flare blooms. Counters show only packets that have landed.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-win` (position:relative) containing the emitter line (`.cx-hp-save` with `.cx-hp-d` destination chip), the counters (`.code-q-x/-r/-s`, each with an `<i>` swatch and a `<b>` number) and one `<canvas class="code-fx">` covering the whole window. Geometry (emitter + counter centres) is measured on resize through `measure()`, never per frame. 40-sprite pool, `globalCompositeOperation = "lighter"`.

## Data it consumes
Bus `decision` (`dest`, `id`) and the initial counts from `JEV.S.dest`. Disabled under reduced motion (counters just increment) and on tier 1.

## Swap in real data
Call `land("execute" | "review" | "skip")` whenever your system really files a ticket; point the `qEls` selectors at your own counters.
