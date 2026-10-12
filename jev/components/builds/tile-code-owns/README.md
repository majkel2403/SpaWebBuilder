# builds / tile-code-owns
Five bars for what plain code owns (menu, thresholds, orders, the stop, the log); the stop turns red under the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes Static illustrative values in component.js; only body.killed (set by core) is read.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
