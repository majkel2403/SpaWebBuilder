# hour / honest-bars

Panel "the honest part": a green "backtest" bar (x2.9), an amber "reality" bar (x1.9) with a ghost of the lost part, red particle ribbons leaking into the "venue" bin with splash droplets, and the edge-vs-bill captions.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 680px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/honest-bars` produces the ready-made `index.html`.

## Data it consumes
- no live feed — the figures (x2.9, x1.9, 0.19%, 0.07%) are text in `component.html`; bar heights are CSS custom properties / heights in `component.css`

## Swapping in real data
Edit the text figures in `component.html` and the two bar heights (`.hr-bar-g`, `.hr-bar-a`, `.hr-ghost`) in `component.css`; the leak canvas follows the layout automatically.

Everything shown is a simulation: no order is placed and no figure is a real result.
