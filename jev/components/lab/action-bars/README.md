# lab / action-bars

The "which action?" choice question as a single card: five probability bars (buy green, sell red, hold grey, close orange, flatten violet) that spring to their new length on every decision, the winner glowing with a light streak, next to a conf ring that counts up to the confidence while an accent-coloured arc fills (a specular sweep orbits it on high-tier devices). "-> buy" prints the picked action in its colour.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Bus `decision`: `d.action`, `d.p{buy,sell,hold,close,flatten}` (probabilities summing to 1), `d.conf` (0..1).

## Markup
```html
<li data-a="buy" class="win"><span>buy</span><i class="lab-bar"><u style="transform:scaleX(.62)"></u></i><em>62%</em></li>
<div class="lab-ring" style="--lab-v:.93;--rc:46,230,166"><div class="lab-ring-in"><b>0.93</b><small>conf</small></div></div>
```

## Swap in real data
Emit a record on `JEV.bus` with `action`, `p` and `conf` (e.g. softmax of your model's logits), or call `show(record, true)`. Rename the actions via `JEV.ACTIONS` and the colour map `ACOL`.
