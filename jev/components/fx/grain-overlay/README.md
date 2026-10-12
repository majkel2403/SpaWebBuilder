# fx / grain-overlay
A sparse hopping film-grain layer from an inline SVG turbulence tile, shown at four strengths over glass tiles.

Pure CSS (no JS). `.fx-grainhost` (absolute, clipped) holding `.fx-grain`. Drop it into any positioned box; set `--grain` (0..1) for strength. The tile is an inline SVG feTurbulence data-URI, tinted warm-white, hopped in 8 steps with a transform animation (no repaint). Frozen under reduced motion. For a full-page film, make the host `position:fixed` with a high z-index and `pointer-events:none` (it already is). No data consumed.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
