# desk / ticket-in-flight

the right column of the world card: the ticket in flight (side, symbol, notional, edge, size / price / conf, six-step rail, countdown, kill-switch stamp) and six agent rows that take turns working it

## Reuse
Copy this folder plus the three shared files (`engine.js`, `core.js`, `base.css`) next to it, inline them in a page (see `index.html` built by `build-components.mjs`), add the markup of `component.html` inside a width-limited container and call `JEV.boot()`.

## Data it consumes
Decisions: on every new loop it adopts the newest `execute` decision from `JEV.recent` (or synthesises one with `JEV.makeDecision()`), showing `id symbol action size conf net state.price dest`. Bus events: `tick` (venue quotes used by the agent captions), `kill` (agents 4-6 halt, ticket stamped HALTED). Emits `agentstep` {agent, verb, text, pnl} for every agent step.

## Swapping in real data
Replace the simulated feed by emitting the same events yourself: `JEV.market.price` / `JEV.market.hist` and `JEV.bus.emit('tick', {price, dp})` (4 Hz) for prices, `JEV.bus.emit('decision', d)` for decisions, `JEV.bus.emit('kill', bool)` for the kill switch. To drive it from a real order, set `ST.tk` to your decision-shaped object in `adopt()`.

Everything shown is simulated.
