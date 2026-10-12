# hero / jev-mesh
The JEV SYSTEM ONE tower: three layers of 18, 24 and 18 units joined by about 700 additive edges, bright woven cable strands crossing the middle, and beams that hop input to layer a to b to c on each decision, flashing nodes on arrival. Beam colour follows the destination (pink execute, amber review, grey skip, red killed). Click the canvas to fire.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 560px), include component.css and component.js, and call `JEV.boot()`. Single canvas `#hjmCv` inside `.hjm-panel`; the mesh is pre-rendered once per resize to an offscreen canvas, only beams and node flashes are drawn per frame. `LC` sets the layer sizes, `ED` the fan-out.

## Data
JEV.bus `decision` (`d.dest`) and `kill`.

## Swap in real data
Emit `decision` records from your model service; the geometry is purely decorative.
Everything shown is simulated; no orders are placed.
