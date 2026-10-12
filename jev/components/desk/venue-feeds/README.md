# desk / venue-feeds

the global feeds column: an oracle price tile with a live sparkline and one row per simulated venue (price, latency, bps vs oracle, mini history bars, deviation heat)

## Reuse
Copy this folder plus the three shared files (`engine.js`, `core.js`, `base.css`) next to it, inline them in a page (see `index.html` built by `build-components.mjs`), add the markup of `component.html` inside a width-limited container and call `JEV.boot()`.

## Data it consumes
Bus events: `tick` (oracle price from `JEV.market.price`; each venue = oracle + standing bias + mean-reverting noise), `decision` (an executed decision flashes the row of `d.venue`). Reads `JEV.market.hist` for the sparkline and `JEV.market.open` for the day change.

## Swapping in real data
Replace the simulated feed by emitting the same events yourself: `JEV.market.price` / `JEV.market.hist` and `JEV.bus.emit('tick', {price, dp})` (4 Hz) for prices, `JEV.bus.emit('decision', d)` for decisions, `JEV.bus.emit('kill', bool)` for the kill switch. Per-venue quotes are produced in `updateFeeds()`: replace the `price * (1 + bias + off)` line with your per-venue mid and latency.

Everything shown is simulated.
