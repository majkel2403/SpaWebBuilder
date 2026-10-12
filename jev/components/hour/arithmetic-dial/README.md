# hour / arithmetic-dial

Panel "the arithmetic": a gauge dial (draggable needle, range slider, 17 / 31 / 100% presets, keyboard) showing return per year and the capital needed to make $1,200,000 a year.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 680px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/arithmetic-dial` produces the ready-made `index.html`.

## Data it consumes
- no live feed — pure arithmetic: `capital = ANNUAL / return` with `ANNUAL = 1,200,000`
- constants `RMIN`/`RMAX` (dial range), `MAGS` (detents), `SEG` (green / amber / red zones) and the `VERD` captions

## Swapping in real data
Change `ANNUAL` (target income), `RMIN`/`RMAX` and `MAGS`; to bind the needle to a live number call `setU(r2u(returnPercent))`.

Everything shown is a simulation: no order is placed and no figure is a real result.
