# hero / legend-strip
The destination legend: execute / review / skip dots plus a "simulated, no orders sent, tap to fire" note, extended with live tallies. The note pulses after 9 s without a decision.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 760px), include component.css and component.js, and call `JEV.boot()`. Markup `.hero-legend` > spans with `.hero-dot.hero-dot-ex|rv|sk`; counts live in `<b class="hls-n">` (ids `hlsEx hlsRv hlsSk`). Colours: `--pink`, `--amber`, `#8d8499`.

## Data
`JEV.S.dest` (counts of execute, review, skip, maintained by core on every `decision`) and the bus `decision` event.

## Swap in real data
Increment `JEV.S.dest[...]` yourself or rewrite `paint()` to read your own counters.
Everything shown is simulated; no orders are placed.
