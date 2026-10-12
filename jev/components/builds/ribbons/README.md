# builds / ribbons
Particle ribbon streams between two boxes: additive particles, trails, comets and bursts, boosted on hover and frozen red by the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes decision (d.build picks the stream, d.conf/d.action/d.size/d.venue/d.dest fill the sink), kill (bool). The streams are anchored to the .bld-rw rows of the two boxes; edit PERM to rewire.
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
