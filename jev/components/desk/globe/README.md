# desk / globe

the 3D dotted globe: ~4000 hand-projected points, eight venue markers, great-circle arcs with data packets, aurora, day/night terminator, rings, and six agent orbs orbiting it (drag to spin, click a venue to face it, arrows / enter for keyboard)

## Reuse
Copy this folder plus the three shared files (`engine.js`, `core.js`, `base.css`) next to it, inline them in a page (see `index.html` built by `build-components.mjs`), add the markup of `component.html` inside a width-limited container and call `JEV.boot()`.

## Data it consumes
Bus events: `decision` (a packet leaves the venue named by `d.venue` along an arc; colour = destination), `tick` (feeds the venue tooltip's latency / bps vs oracle), `kill` (globe turns red, traffic stops), `tier` (re-layout). Reads `JEV.market.price`, `JEV.S.killed`. Emits `agentstep`. The canvas is a single pass of `draw()` with a built-in quality governor (60 fps, 30 fps, fewer dots, smaller backing store).

## Swapping in real data
Replace the simulated feed by emitting the same events yourself: `JEV.market.price` / `JEV.market.hist` and `JEV.bus.emit('tick', {price, dp})` (4 Hz) for prices, `JEV.bus.emit('decision', d)` for decisions, `JEV.bus.emit('kill', bool)` for the kill switch. Venue locations are the `CITIES` table and venue-to-city mapping is in `FEEDS`; arcs are `ARC_PAIRS`.

Everything shown is simulated.
