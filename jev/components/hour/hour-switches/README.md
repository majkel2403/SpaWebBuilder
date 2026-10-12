# hour / hour-switches

panel B "the hour": the 60:00 ring, six spring switches, gantt rail, ARMED banner, burst and cinema.

**This folder is a chunk of the section `hour/full-section`.** `component.html/css/js` are the real source: joined, in order, with the other units of the section they reproduce the original section byte for byte (see `components/UNITS.md`). They are fragments of one closure, so they are not valid on their own; the standalone `index.html` is built from this unit plus the units named in `compose`.

ring, switches, gantt and banner are one tightly coupled chunk (renderB / setSw / arrive).

## Reuse standalone
Copy this folder plus the units it composes (hour/_head, hour/_grid, hour/_responsive, hour/_fx-b, hour/_close (plus _solo-css/_solo-b)) and `engine.js`, `core.js`, `base.css` from `jev/src`. `node jev/build-components.mjs --only hour/hour-switches` produces the ready-made `index.html`.

Everything shown is a simulation: no order is placed and no figure is a real result.
