# builds / hub
The full hub diagram: ten build cards feed the glass JEV core through particle ribbons, which fan out to three typed-question cards, five answer cards and the thresholds + hard-rules row.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.build, d.action, d.conf, d.size, d.sizes, d.p, d.pRisk, d.riskOk, d.venue, d.dest, d.reason), kill (bool), floor (number); JEV.BUILDS for the ten cards.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
