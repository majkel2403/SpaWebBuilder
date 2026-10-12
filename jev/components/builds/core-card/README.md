# builds / core-card
The glass JEV system-one card alone: spinning rim, halo, rings, holographic wordmark that follows the pointer, action chip and last-answer line.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.symbol, d.action, d.conf, d.dest), kill (bool); seeds from JEV.recent[0].
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
