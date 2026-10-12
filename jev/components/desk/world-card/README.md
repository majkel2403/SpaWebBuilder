# desk / world-card

the whole "world" section: dotted 3D globe with venues, arcs and orbiting agent orbs, global feeds, the ticket in flight with six agent rows, and the six-agent tab strip

## Reuse
Copy this folder plus the three shared files (`engine.js`, `core.js`, `base.css`) next to it, inline them in a page (see `index.html` built by `build-components.mjs`), add the markup of `component.html` inside a width-limited container and call `JEV.boot()`.

## Data it consumes
Bus events: `tick` (oracle price, venue prices are derived from it), `decision` (packets fly along arcs from the decision's venue; execute decisions flash the venue row and fire a beam), `kill` (globe turns red, agents 4-6 halt). Also reads `JEV.market`, `JEV.recent` and `JEV.S.killed`; emits `agentstep` {agent, verb, text, pnl}.

## Swapping in real data
Replace the simulated feed by emitting the same events yourself: `JEV.market.price` / `JEV.market.hist` and `JEV.bus.emit('tick', {price, dp})` (4 Hz) for prices, `JEV.bus.emit('decision', d)` for decisions, `JEV.bus.emit('kill', bool)` for the kill switch. Venue quotes are `oracle * (1 + bias + noise)` in `updateFeeds()`: replace it with your per-venue top-of-book.

Everything shown is simulated.
