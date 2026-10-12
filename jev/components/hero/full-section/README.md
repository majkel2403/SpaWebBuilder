# hero / full-section (whole hero; identical to decision-network)
The "JEV DECIDES" hero: a canvas neural-network diagram (state, encode, Jev system one, 3 typed questions, 11 answers, 3 code acts), a latest-decision readout chip, a title card, hover tooltips on state fields. Click or tap fires a simulated decision.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page, and call `JEV.boot()`. The container must have a width; the stage height is `clamp(560px, 88vh, 920px)` (see `.hero-stage`).

## Data
Consumes `JEV.bus` events `decision` (fields `state, action, p, conf, size, sizes, riskOk, pRisk, dest, reason, ms, floor, killed`), `kill` (bool), `floor` (number); seeds from `JEV.recent[0]`.
To use real data: call `JEV.bus.emit('decision', d)` with records in that shape (and `JEV.setKilled`/`JEV.setFloor`) instead of the simulated stream.
