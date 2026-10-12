# lab / hard-rules

The "held by code, not the model" card: the confidence-floor slider (orange, with a mark at the 0.85 default), the red kill switch and the loss-cap / max-position chips. A live line shows what the gate would do to the newest decision under the current floor and kill state, so moving the floor visibly flips the verdict.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Two-way: dragging the floor calls `JEV.setFloor(v)` (0.50 to 0.99), the switch calls `JEV.setKilled(bool)`; bus `floor` and `kill` repaint the card when another component (HUD, gate-bar, key `K`) changes them. Consumes bus `decision` (`conf`, `action`, `riskOk`). Caps come from `JEV.RULES.lossCap` and `maxPos`.

## Gate semantics
hold -> skip; kill switch -> review; failed risk flag -> review (not for close / flatten); conf < floor -> review; else execute.

## Swap in real data
Read `JEV.S.floor` / `JEV.S.killed` as the single source of truth, or replace `setFloor` / `setKilled` calls with your own risk-service API and re-emit `floor` / `kill` on the bus. Edit the cap chips in `component.html`.
