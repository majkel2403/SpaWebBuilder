# builds / tile-decision-stream
Live list of the newest decisions with primitive tag, action, confidence and gate result.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.build, d.action, d.symbol, d.conf, d.dest, d.venue, d.ms, d.reason); seeds from JEV.recent.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
