# builds / tile-cost
Serif odometer of the running simulated cost with decisions count, cost each and a zero-token line.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes JEV.S.cost and JEV.S.count (updated by core on every decision); bus decision triggers the refresh. Replace with your own totals in updCost().
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
