# hero / depth-fog
The depth-of-field of the main hero. A 256 x 2 alpha ramp (clear at the centre, dark far away) is pre-rendered once and stretched to 2.4 x the stage width. Each frame its clear centre eases towards the layer the newest wave is in (state, encode, jev a/b/c, questions, answers, code), so the layers away from the decision sink into the dark; between decisions it rests on the jev tower at about half strength. One `drawImage` per frame, strength 0.2 (0.3 on quality tier 3). The button toggles the fog so you can compare.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. Two stacked canvases (`#hdfStatic` cached mesh, `#hdfLive` per frame); the fog is drawn on the live canvas before the additive beams. To use it on your own canvas keep only `FOGS` and the four lines in `draw()` that move `fcx` / `fAmt` and draw it, feeding `tgt` with the x of whatever should stay sharp.

## Data
JEV.bus `decision` (starts a wave whose current stage sets the focus) and `kill` (red beams). Click or tap the stage, or key `f`, fires a simulated decision.

## Swap in real data
Emit `decision` records from your model service; the fog only needs the wave stage to know where to focus. Everything shown is simulated; no orders are placed.
