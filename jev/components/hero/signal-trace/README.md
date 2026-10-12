# hero / signal-trace
The glowing path of the latest decision, as in the main hero (it is not part of any other hero component). When a decision reaches its code act, `makeTrace()` walks real edges of the graph: the strongest lit state field, one random outgoing edge to encode, then to jev layer a, b, c, and then for each of the three typed questions the edge c to question, question to the chosen answer row (action, size, risk), and answer to the destination code card: 13 edges. The line draws on over 0.6 s (the four hops first, then the three branches together), holds, and fades, 2 s in total; two traces can overlap. Each frame it is drawn in three passes (wide soft glow, bright core, white hairline) plus a node dot where a hop has completed. The text under the stage spells out the path of the last trace. Reduced motion skips it.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. To use the trace on your own graph keep `trE`/`trT`/`trC`, `makeTrace()` and the trace block of `draw()`; it only needs per-node outgoing edge tables (`nout0`, `noutN`, `edst`) and a point-on-edge function `ep(e, u)`.

## Data
JEV.bus `decision`: `d.state` salience picks the starting field, `d.action`, `d.sizeIdx`, `d.riskOk` the answer rows, `d.dest` the code act (pink execute, amber review, grey skip, red when killed). `kill` recolours it.

## Swap in real data
Emit `decision` records from your model service. Everything shown is simulated; no orders are placed.
