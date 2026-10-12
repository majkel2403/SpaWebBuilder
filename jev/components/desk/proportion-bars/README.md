# desk / proportion-bars
Three flex-based proportion bars with soft glowing, gradient-lit segments and tabular readouts to the right: result (up / down), route (execute / review / skip) and size (.5 / 1 / 2 / 4 % of capital). Segments animate via a CSS transition on `flex-basis`. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `.dkt-pb` row = label `<span>`, `.dkt-pbar` with any number of `<i style="--c:#colour;--w:38%">` segments, value `<b>`. Set `--w` (percent) per segment; `--c` is the segment colour (also used for its glow). Works for any share-of-total data.

## Data consumed
Bus `decision`: `dest` (execute / review / skip), `sizeIdx` and executed outcomes (simulated win probability from `conf`).

## Swap in real data
Fill the counters in the `n` object (up, dn, go, rev, skip, sz[4]) from your own stats, or just set each segment's `--w` directly.
