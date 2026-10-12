# lab / gate-bar

The 0-1 confidence gate as a small card: a hatched "below the floor goes to a human" zone, a green "executes" zone, a live confidence pin, a draggable floor marker (mouse, touch, arrow keys / PageUp / Home / End) and a verdict badge (PASS / BELOW FLOOR / KILL SWITCH) with a one-line reason.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`. The pieces `.lab-gt` (track), `.lab-cf` (pin) and `.lab-fl` (marker) work without the card around them.

## Data it consumes
* Bus `decision`: `conf`, `action`, `riskOk`, `floor`, `killed` (dest and reason are recomputed locally with the gate rules, so moving the floor re-routes the last decision instantly).
* Bus `floor` (number) and `kill` (bool). The marker writes back with `JEV.setFloor(v)`.

## Swap in real data
Call `show({ conf, action, riskOk, floor, killed, ... }, true)` from your own feed (or emit `decision` records on `JEV.bus`). To make the floor local, replace `J.setFloor` in the drag code with your own setter.
