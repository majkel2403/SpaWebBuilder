# hero / node-tooltip
The detail tooltip of the main hero's diagram, over a live mesh. Hover, tap or arrow-key to a node or a state row and a glass card shows: for the 15 state fields the field name, its current value, a 20-decision sparkline (fields 1 to 12, newest at the right) and "drives how much? . 0.42 . last 20", the typed question that field influences most with a salience share (a fixed field-to-question weight scaled by how salient the field is in the latest decision); for other nodes an explanation (encode dimension, jev layer and unit, typed question with its current answer, answer row probability and whether it was chosen, code act count). A white ring breathes on the inspected node; a mouse card follows the pointer, a touch card sits above the finger for 2.6 s, and an open card refreshes on every decision. The state rows light up and show live values with a faint sparkline behind them, as in the hero.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. The tooltip needs: a positioned container, the `.hnt-tip` markup (`.hnt-tip-h`, `-v`, `-sp` canvas, `-w`), `hit(x, y)` to turn a pointer position into a node index, and `tipFill(n)` to say what that node is; swap those two for your own graph. `pushHist` / `NUM` define which numbers get a sparkline.

## Data
JEV.bus `decision` (`d.state` numbers feed values and sparklines, `d.p`, `d.sizes`, `d.pRisk`, `d.action`, `d.size`, `d.riskOk` the answer rows and question answers, `d.dest` the counts) and `kill`. Keyboard: focus the hidden fire button (Tab), then arrow keys walk the state fields, Escape closes.

## Swap in real data
Emit `decision` records from your model service with your own `state` fields. Everything shown is simulated; no orders are placed.
