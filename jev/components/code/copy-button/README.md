# copy-button

The copy button of the editor panes: a clipboard glyph that scales and rotates away while a check mark draws itself with a stroke-dash animation, then reverts after 1.7 s. Shown in the three header skins with sample text, plus an aria-live status line.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`<button class="code-cp" data-cp="name"><svg viewBox="0 0 16 16"><g class="ci">…clipboard…</g><path class="ck" d="M3.6 8.6l3 3 5.8-6.4"/></svg></button>`. Add `.done` to morph. The hit area is 40 px (the `::before` expands it). Colours via `--code-meta` (idle), `--code-cph` (hover bg); the done colour is green (light/dark) or ink (hot). Put the text to copy in `data-copy` of a sibling element or pass your own string to `clip()`.

## Data it consumes
None; the text comes from `data-copy`. If the fx module is loaded, `JEV.toast` also shows a toast.

## Swap in real data
Point `txt` at your own string (editor buffer, a log, a JSON response). The clipboard API needs https or localhost; a textarea + `execCommand` fallback is included.
