# builds / tiles-all
The six dashboard tiles together (decision stream, latency, cost, primitive mix, where it runs, what code owns) in a 3x2 grid.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes Same as the individual tiles: decision, JEV.S.cost / count / counts / floor, JEV.recent.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
