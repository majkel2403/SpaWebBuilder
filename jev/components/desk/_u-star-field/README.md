# desk / star-field

A real chunk (js) of the **desk-world** module of the `desk/full-desk` section: the star-field drawing code (twinkle + depth stars with parallax and cross flares).
This folder is the source of truth for that piece: the main page is assembled from the same chunks (see `components/UNITS.md`), so editing it changes the page.

## Reuse standalone
The world module is one coupled closure (`JEV.mod('desk-world')`), so a standalone page needs the whole module: copy this folder **plus** the other `desk/*` units listed in `compose` (in `component.json`) and the shared runtime (`engine.js`, `core.js`, `base.css`). `node jev/build-components.mjs --only desk/star-field` builds the page `index.html` from exactly that list.

## Data it consumes
Bus events `tick`, `decision`, `kill`; reads `JEV.market`, `JEV.recent`, `JEV.S.killed`; emits `agentstep`. Everything shown is simulated.
