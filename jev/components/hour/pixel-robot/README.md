# hour / pixel-robot

The Hermes pixel-art robot as a standalone atom: a 14 x 13 `svg` (`shape-rendering: crispEdges`) in a rotating conic glass ring, blinking eyes and antenna, a scan line, and a squash-and-stretch hop with a ground shadow. Four demo variants: small, default, large, halted.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), put `component.html` in your page and call `JEV.boot()`. `node jev/build-components.mjs --only hour/pixel-robot` builds the ready-made `index.html`.

Markup (one robot):
```html
<div class="hr-ag" data-c="orange" style="--hr-av:80px">
  <div class="hr-av hr-av-px"><i class="hr-scan"></i><svg class="hr-robot" ...>...</svg></div>
  <i class="hr-shd"></i><b class="hr-an">HERMES</b>
</div>
```
- size: `--hr-av` (CSS length) on `.hr-ag`; ring colour: `data-c` (`orange`, `blue`, `pink`, ...); halted look: add `.hr-halt` (or let `body.killed` do it).
- hop: call the `hop(av)` pattern from `component.js` (toggle `hr-hop-a` / `hr-hop-b` on the `.hr-av` and `.hr-shd`).

## Data it consumes
- bus `decision` (default robot hops on every decision), bus `kill` + `body.killed` (red look).

## Swapping in real data
Call `hop(av)` from your own event (an order filled, a rule written) instead of the bus handler; set `.hr-halt` from your own halted flag.

Everything shown is a simulation.
