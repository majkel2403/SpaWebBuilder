# desk / winloss-strip
The outcome strip: every executed ticket of the last 200 is one thin bar, green up for a win, red down for a loss, scaled to the largest outcome, drawn additively over a hairline centre line; the newest bar flashes with a glow sprite. Below it a proportion bar and a text readout show the win share. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Canvas class `.dkt-wl` (set its height in CSS), proportion bar markup `.dkt-pbar > i[style="--c:colour;--w:55%"]` (see `proportion-bars`).

## Data consumed
Bus `decision`: every executed buy or sell pushes one outcome (in bps) into the strip.

## Swap in real data
Replace the `outc` array (oldest first, signed bps or dollars per closed trade) by your own fills; push to it and drop the oldest when a trade closes.
