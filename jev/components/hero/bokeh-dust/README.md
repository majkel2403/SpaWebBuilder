# hero / bokeh-dust
A drifting layer of 56 soft bokeh sprites (pink, violet, amber) with depth-scaled speed, size and alpha, pointer parallax, a glow swell on each decision and a red tint when the kill switch is on. Sits behind any dark UI.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 900px), include component.css and component.js, and call `JEV.boot()`. Put `<canvas id="hbdCv" data-dpr="1.5">` absolutely positioned (`inset:0`) in a positioned parent whose id is `hbdStage`; the animation is gated by that parent (paused off-screen).

## Data
JEV.bus `decision` (swell) and `kill` (tint). No data needed.

## Swap in real data
Nothing to swap; change `TINT` for another palette or `N` for density.
Everything shown is simulated; no orders are placed.
