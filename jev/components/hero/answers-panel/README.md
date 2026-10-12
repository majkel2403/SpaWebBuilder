# hero / answers-panel
The right part of the "JEV DECIDES" hero as a standalone component: 3 typed questions (which action? / how much? / risk ok?), 11 answer rows in 3 groups (choice, score, flag) with probability bars, the 0.85 floor marker and confidence tick, and the code-act cards (orders/execute, orders/review, orders/skip) with odometer counters. Extracted from `src/js/hero.js` / `hero.css` with its own small layout and a simplified wave driver: beams enter from a synthetic input edge into the question nodes, fan out to the answers, then land on the destination card (ripples, lens flare, energy rings, light sweep, kill red state). Click or tap fires a simulated decision.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), include component.html/css/js in a page and call `JEV.boot()`. The canvases size to `.aps-stage` (height `clamp(500px, 64vh, 600px)`, 470px under 700px wide); under 700px it switches to a compact layout without the small labels.

## Data
Consumes `JEV.bus` events `decision` (`action, p, sizes, size, sizeIdx, pRisk, riskOk, dest, conf, reason, floor`), `floor` (number), `kill` (bool); seeds from `JEV.recent[0]` and `JEV.S.dest`.
To use real data: `JEV.bus.emit('decision', d)` with records in that shape (and `JEV.setFloor` / `JEV.setKilled`).
