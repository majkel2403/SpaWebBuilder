# builds / tile-where-it-runs
Three rows of ten squares: builds on the api, on a laptop and on a gpu box; api squares ping on each decision.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (heartbeat only). The 8/1/1 split is the RUNS constant in component.js.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
