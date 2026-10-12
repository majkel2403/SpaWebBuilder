# builds / full-section
The whole "ten builds, one decision layer" section: head with live stats, hub with ribbons, circuit traces and all six tiles.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes All of the above plus JEV.S.count and JEV.S.ms for the head stats. Needs the fx module (needs.fx=true) for the scroll reveals.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
