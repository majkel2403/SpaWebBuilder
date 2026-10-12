# hour / rules-chips

the three hard-rule chips of panel A (daily loss cap, max position, kill switch).

**This folder is a chunk of the section `hour/full-section`.** `component.html/css/js` are the real source: joined, in order, with the other units of the section they reproduce the original section byte for byte (see `components/UNITS.md`). They are fragments of one closure, so they are not valid on their own; the standalone `index.html` is built from this unit plus the units named in `compose`.

showKill() touches the Jev orb, the arcs and the ARMED banner of other panels; standalone, _solo-chips replaces those with inert stubs.

## Reuse standalone
Copy this folder plus the units it composes (hour/_head, hour/_grid, hour/_responsive, hour/_close (plus the standalone-only glue _solo-open/_solo-close/_solo-css/_solo-chips)) and `engine.js`, `core.js`, `base.css` from `jev/src`. `node jev/build-components.mjs --only hour/rules-chips` produces the ready-made `index.html`.

Everything shown is a simulation: no order is placed and no figure is a real result.
