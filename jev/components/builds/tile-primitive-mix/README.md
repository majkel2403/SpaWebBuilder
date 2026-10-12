# builds / tile-primitive-mix
Counts and proportional bars of how many answers were choices, flags or scores.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Data
Consumes JEV.S.counts {choice, flag, score}; bus decision triggers the refresh. Replace with your own counts in updMix().
To use real data: call `JEV.bus.emit('decision', d)` with records in the documented shape (see the main README) instead of the simulated stream.
