# desk / precision-ring

A donut ring split into amber (the prior) and blue (the book likelihood): the blue share is the precision weight of the book in the posterior. Pure CSS: a `conic-gradient` masked to a ring, animated through a registered `@property --dkb-w`. The page shows a live ring (follows the simulated update) plus three static variants (20 / 50 / 88). Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`. The atom needs only the CSS: `<div class="dkb-rg" style="--dkb-w:72"><b>72</b><i>% book</i></div>`. `--dkb-w` is the blue share 0..100 (transitions over .7 s), `--rg-s` the diameter (default 96px, `.dkb-rg-s` = 66px), `--rg-t` the ring thickness. Change the two colours inside the `conic-gradient` for other splits (long/short, bid/ask).

## Data consumed
Only the live demo: bus `decision` and `tick` via the shared model; the ring itself is set with `el.style.setProperty('--dkb-w', value)`.

## Swap in real data
Set `--dkb-w` from any 0..100 ratio, for example your own `book_precision / (prior_precision + book_precision) * 100`.
