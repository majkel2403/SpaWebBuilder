# hero / impact-ripples
The landing effect: a beam flies from a source to the port of the decision destination, then three ripple rings expand and a lens-flare streak with a cross hairline flashes. Colours: execute pink, review amber, skip dim, kill red. Click or tap the stage to fire.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 760px), include component.css and component.js, and call `JEV.boot()`. Canvas `#hirCv` in `#hirStage`; port positions are computed in `lay()` (right column at 20 / 50 / 80% of the height) and the DOM labels sit in `ul.hir-ports`. Move them to put the effect on your own targets.

## Data
JEV.bus `decision` (`d.dest`) and `kill`.

## Swap in real data
Emit `decision` with a `dest` of execute, review or skip, or call the effect with your own destination index.
Everything shown is simulated; no orders are placed.
