# hour / honest-bars

panel E "the honest part": x2.9 vs x1.9 bars and the red leak falling into the venue.

**This folder is a chunk of the section `hour/full-section`.** `component.html/css/js` are the real source: joined, in order, with the other units of the section they reproduce the original section byte for byte (see `components/UNITS.md`). They are fragments of one closure, so they are not valid on their own; the standalone `index.html` is built from this unit plus the units named in `compose`.

canvas ribbons and droplets over a css bar chart.

## Reuse standalone
Copy this folder plus the units it composes (hour/_head, hour/_grid, hour/_responsive, hour/_close (plus _solo-css/_solo-end)) and `engine.js`, `core.js`, `base.css` from `jev/src`. `node jev/build-components.mjs --only hour/honest-bars` produces the ready-made `index.html`.

Everything shown is a simulation: no order is placed and no figure is a real result.
