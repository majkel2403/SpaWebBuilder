# matrix-rain

The terminal background effect: columns of falling hex digits and symbols. Only the glyph heads are drawn (from a pre-rendered glyph atlas); a destination-out fill every 50 ms produces the fading trails, so a frame costs a handful of drawImage calls. Decisions boost the fall speed for a moment, the kill switch recolours the glyphs red.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
One `<canvas class="code-rain">` absolutely positioned (`inset:0; width:100%; height:100%`) behind your content (`z-index:0`, content at `z-index:1`). Opacity controls intensity (0.17-0.5). Constants: `RCW x RCH` cell size, `RG` glyph set, atlas colours `#ff8fbd` / `#ff5a68`.

## Data it consumes
Bus `decision` and `kill` (timing only); `JEV.tier` (disabled on tier 1) and `JEV.reduce`.

## Swap in real data
Boost it from your own signal: set `boost = 1` when a message arrives. Change `RG` for other glyphs (katakana, binary) and the atlas colours for another palette.
