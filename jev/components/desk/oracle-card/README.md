# desk / oracle-card

The oracle price tile of the world card: `$` + serif price + small decimal, an up/down change pill versus the session open and a glowing blue sparkline of the last 120 prices with a white head dot.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html` in a container and call `JEV.boot()`. The tile fills its parent width (the canvas is DPR-fitted via `JEV.fit` inside `JEV.watch`). Wrap in an element with class `dkx` (defines the three `--dkw-*` variables). To rename the symbol edit the `<b>btc-perp</b>` text.

## Data consumed
`JEV.market.price`, `JEV.market.open`, `JEV.market.hist[]` and the `tick` bus event (4 Hz).

## Swap in real data
Feed your own prices into `JEV.market` (`price`, `open`, push to `hist`) and emit `JEV.bus.emit('tick', {price, dp})` per update.

Everything shown is simulated.
