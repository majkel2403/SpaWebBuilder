# hour / candle-replay

the seeded candle replay strip of panel A (entries, stops, exits under a glowing playhead).

**This folder is a chunk of the section `hour/full-section`.** `component.html/css/js` are the real source: joined, in order, with the other units of the section they reproduce the original section byte for byte (see `components/UNITS.md`). They are fragments of one closure, so they are not valid on their own; the standalone `index.html` is built from this unit plus the units named in `compose`.

the tape code is self-contained; it only reads `killed` from the shared head.

## Reuse standalone
Copy this folder plus the units it composes (hour/_head, hour/_grid, hour/_responsive, hour/_close (plus the standalone-only glue _solo-open/_solo-close/_solo-css/_solo-tape)) and `engine.js`, `core.js`, `base.css` from `jev/src`. `node jev/build-components.mjs --only hour/candle-replay` produces the ready-made `index.html`.

Everything shown is a simulation: no order is placed and no figure is a real result.
