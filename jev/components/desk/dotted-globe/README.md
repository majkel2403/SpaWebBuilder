# desk / dotted-globe

The dotted planet of the desk on its own: ~4,000 points on a fibonacci sphere, continents from a 5-octave noise threshold (land pulled up under eight city sites), a denser continental shelf and sparse dim ocean, four depth levels per kind, a lat / lon graticule, twinkling night-side city lights and a glassy atmosphere body. Drag to spin (with inertia), idle spin otherwise, red under the kill switch. No orbs, arcs or markers (see `globe-arcs`, `orbit-orbs`, `planet-shade`).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html`, call `JEV.boot()`. Tune `NPT_SRC` (dot count), the noise `seed` (different continents) and the `KIND` palette. To mark places use the same projection as the frame loop: `x1 = x*cos(yaw) + z*sin(yaw)`, `z1 = -x*sin(yaw) + z*cos(yaw)`, `y2 = y*cos(tilt) - z1*sin(tilt)`, `z2 = y*sin(tilt) + z1*cos(tilt)`, screen = `(cx + R*x1, cy - R*y2)`, visible when `z2 > 0`.

## Data consumed
Bus `kill` only. Pure decoration.

## Swap in real data
Replace the noise land mask with real land / sea samples (e.g. a coarse equirectangular bitmap) when you fill `PK`.

Everything shown is simulated.
