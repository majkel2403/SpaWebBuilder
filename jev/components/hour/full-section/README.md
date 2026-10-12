# hour / full-section

The complete section exactly as it appears in the main page: header + pills and the five panels (build, hour, backtest, arithmetic, honest part).

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 1440px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/full-section` produces the ready-made `index.html`.

## Data it consumes
- bus `decision`, `kill`, `floor`, `tier` and `JEV.RULES` — see the individual component READMEs for what each panel reads

## Swapping in real data
See the individual panel components; this one is the composed section.

Everything shown is a simulation: no order is placed and no figure is a real result.
