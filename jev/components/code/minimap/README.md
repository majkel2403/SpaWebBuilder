# minimap

A scrolling source view with a VS Code style minimap: one coloured stub per token on a tiny canvas (4 px line pitch, 0.5 px per char), a viewport rectangle that tracks scrolling, click/drag to seek, and a pink cursor tick plus current-line band that hop to the gate lines for every simulated decision.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-mm` (position:relative column, 44-54 px wide) holds `<canvas>`, the viewport `<i>` and the cursor tick `<b>`. Variables: `--code-mmbg --code-mmv --code-mmvf --code-bandc --code-gut --code-gut-t`. Geometry constants: `LH` line height (19) and the pitch 4 px; keep them in sync with your font size.

## Data it consumes
Bus `decision` only moves the cursor (`GATE` is the list of line indexes it visits).

## Swap in real data
Replace `SRC` with your file, or build the `.cx-mm-ln` rows from your own tokens; call `go(lineIndex, true)` from your own event (cursor moved, error on line N, test failed here).
