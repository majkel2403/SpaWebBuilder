# builds / tile-latency
Ten latency bars, one per build, coloured by typed question; the row of the build that just answered lights up.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.build); baseline ms from JEV.BUILDS[i].ms, jittered locally. To use real latency, set row.cur and write r.fill.style.transform = scaleX(ms/9).
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
