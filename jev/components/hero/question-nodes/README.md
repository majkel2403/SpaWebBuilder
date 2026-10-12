# hero / question-nodes
The three typed-question nodes of the diagram: "which action?" (choice), "how much?" (score), "risk ok?" (flag). Every decision pulses the nodes in sequence with a ring and writes the answer beside each (`= buy`, `= 1%`, `= go`), amber when the decision went to review.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 560px), include component.css and component.js, and call `JEV.boot()`. Markup: `ul.hqn-list > li.hqn-q[data-q] > i.hqn-node + span.hqn-t`; answer text lives in `.hqn-v`. Toggle `.is-hit` on a row to replay the ring.

## Data
JEV.bus `decision`: `d.action d.size d.riskOk d.dest`; `kill` recolours via CSS.

## Swap in real data
Map your own three answers into `paint(d)`.
Everything shown is simulated; no orders are placed.
