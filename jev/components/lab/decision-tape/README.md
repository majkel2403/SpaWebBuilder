# lab / decision-tape

A compact, always-live tape of the last five decisions: short hex id, action in its colour, size, confidence, a destination with a glowing dot (execute green, review amber, skip grey) and the gate reason. A new decision pushes the list down with a slide and a pink flash on the top row; rows are real buttons (tab + Enter / Space) and clicking one emits it so a host UI can put that decision's inputs back. "copy json" exports the tape.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Consumes bus `decision` (`action, size, conf, dest, reason`, optionally `state`); seeded from `JEV.recent`. Emits `JEV.bus 'lab-restore' {n, action, size, conf, dest, reason, state}`.

## Markup
```html
<li><span>#a1</span><b class="lab-tp-a" data-a="buy">buy</b><span>1%</span><span class="lab-tp-c">0.93</span><i class="lab-tp-d" data-d="execute">execute</i><em>ok</em></li>
```
On containers under 380px the reason column hides.

## Swap in real data
Emit your own decision records, or call `push(record, true)`. Change the tape length in `push()` (and the `.lab-tpw` height).
