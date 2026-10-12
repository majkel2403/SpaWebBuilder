# lab / dest-badge

The verdict badge: where the gate sent the decision. A big glowing EXECUTE (green), REVIEW (amber) or SKIP (grey) that scrambles in letter by letter, flips up in 3D, emits a ring pulse, fires a particle burst (18 sparks on execute, 8 on review), shimmers on execute, dims and squashes on skip and shakes when the kill switch forced the review. The caption names the venue and size (or "human review queue" / "nothing sent") and a tally row counts all routes from `JEV.S.dest`.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-dest" data-c="green"><i class="lab-dest-r"></i><b class="lab-dest-t glitch" data-text="EXECUTE">EXECUTE</b><small>order → binance · 1%</small></div>
```
`data-c` = `green` | `yellow` | `gray` sets the whole colour (border, glow, text).

## Data
Bus `decision`: `d.dest`, `d.venue`, `d.size`, `d.killed`; tally from `JEV.S.dest`.

## Swap in real data
Emit records with a `dest` of `execute`, `review` or `skip` (your own router's verdict), or call `show(record, true)`.
