# hero / encode-panel
The ENCODE column: fifteen input ports folded into twelve vector nodes in a zig-zag, joined by a sparse additive mesh. On every decision pink beams run port to node and the nodes light in proportion to how unusual the inputs are.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 460px), include component.css and component.js, and call `JEV.boot()`. A single canvas `#hepCv` in `.hep-panel`; resize-safe (`JEV.watch`). Change `NO` (outputs) or the edge fan-out in the `ED` builder to alter the shape.

## Data
JEV.bus `decision` (`d.state`, normalised per field into 0..1) and `kill` (beams go red).

## Swap in real data
Replace `norm(s)` with your own per-feature activation (e.g. real embedding magnitudes) and emit `decision`.
Everything shown is simulated; no orders are placed.
