# builds / build-card
One reusable build card (typed-question tag, answer, confidence sparkline with floor line, meter, hover tilt, click to pin); four accent variants are shown.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.conf plus whatever the answer text needs), floor; each card is described by an object of JEV.BUILDS. Set FEED_ALL=false so a card only listens to its own d.build.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
