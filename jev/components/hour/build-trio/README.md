# hour / build-trio

panel A "the build": the three mascot agents with arcs and comets, the live last-answer chip, the candle replay and the hard-rule chips.

**This folder is a chunk of the section `hour/full-section`.** `component.html/css/js` are the real source: joined, in order, with the other units of the section they reproduce the original section byte for byte (see `components/UNITS.md`). They are fragments of one closure, so they are not valid on their own; the standalone `index.html` is built from this unit plus the units named in `compose`.

this folder holds the mascots / arcs / decision-chip code (js), the stage markup and the stage css; the lower row (candle-replay, rules-chips) and the stats (_a-end) are their own units.

## Reuse standalone
Copy this folder plus the units it composes (hour/_head, hour/_grid, hour/_a-open, hour/candle-replay, hour/rules-chips, hour/_a-lower-open, hour/_a-lower-close, hour/_a-end (stats), hour/_responsive, hour/_fx-a, hour/_close) and `engine.js`, `core.js`, `base.css` from `jev/src`. `node jev/build-components.mjs --only hour/build-trio` produces the ready-made `index.html`.

Everything shown is a simulation: no order is placed and no figure is a real result.
