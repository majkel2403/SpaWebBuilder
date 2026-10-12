# desk / globe-arcs

The venue network of the world card without the dotted land: a graticule sphere with eight venue markers (coloured dot + ring + city code), 13 great-circle arcs lifted above the surface, glowing packets that fly along the arcs (gold quote, white order, pink jev, cyan fill) and ping rings that expand where a packet lands. Drag to spin.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html`, call `JEV.boot()`. Edit `CITIES` (code, lat, lon), `VCOL` (marker colours) and `ARC_PAIRS` (`[fromIndex, toIndex, packetColour]`). Arc height scales with distance (`h` in the arc builder); packets are pooled sprites drawn additively (no shadowBlur).

## Data consumed
Bus `decision`: a pink jev packet leaves along a random arc, then a fill packet returns (cyan = execute, pink = review, white = skip). Bus `kill`: sphere and traffic turn red and stop.

## Swap in real data
In the `decision` handler look up the arc between the decision's venue and your hub and call `spawn(arcIndex, colour, speed, reverse, size)`.

Everything shown is simulated.
