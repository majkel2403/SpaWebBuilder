# hour / energy-arc

Two orb mascots (Dots, Jev) joined by a dotted bezier arc drawn on a canvas: a soft conduit tube under the dots, six ambient light beads drifting along it, and a comet (white head, tapering trail, bloom, spark burst on arrival) for every simulated decision. The receiving orb flashes with an expanding ring. The kill switch turns the arc, beads and orb red and slows everything down. Effects scale with `JEV.tier` (tier 1 keeps beads and comets only).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html, call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/energy-arc`.

- the canvas (`.hr-cv`) must sit behind `.hr-trio`; the arc starts at the upper right of the first `.hr-av` and ends at the upper left of the second (see `layout()`), so any two avatars work.
- `DEST_HEX` maps the gate result to the comet colour; `spawn(hex, seconds, onArrive)` sends one comet.

## Data it consumes
Bus `decision` (`d.dest`), bus `kill`, `JEV.time`, `JEV.tier`.

## Swapping in real data
Call `spawn(colour, 0.95, () => land())` from your own events (a feed message, a signal, an order ack) instead of the `decision` handler.

Everything shown is a simulation.
