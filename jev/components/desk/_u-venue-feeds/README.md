# desk / venue-feeds

A real chunk (html / js) of the **desk-world** module of the `desk/full-desk` section: the "global feeds" column: header, spread readout; the oracle tile and venue rows nest inside it (it also owns the venue creation + data in js).
This folder is the source of truth for that piece: the main page is assembled from the same chunks (see `components/UNITS.md`), so editing it changes the page.

## Reuse standalone
The world module is one coupled closure (`JEV.mod('desk-world')`), so a standalone page needs the whole module: copy this folder **plus** the other `desk/*` units listed in `compose` (in `component.json`) and the shared runtime (`engine.js`, `core.js`, `base.css`). `node jev/build-components.mjs --only desk/venue-feeds` builds the page `index.html` from exactly that list.

## Data it consumes
Bus events `tick`, `decision`, `kill`; reads `JEV.market`, `JEV.recent`, `JEV.S.killed`; emits `agentstep`. Everything shown is simulated.
