# desk / posterior-curve

One glowing posterior density for P(up 5m): a green (red when the kill switch is thrown) curve with a pink-white highlight that travels along it, ember particles drawn from the distribution, a ripple at the peak on every decision and a pointer probe that lights the upper tail and reads `P(up > x)`. The header shows the live mean and sigma. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load `component.html/css/js` and call `JEV.boot()`. The component is one `.card.dkb-card` with two stacked canvases inside `.dkb-cvw`; give the card any width (>= 300px works best). Keyboard: focus the canvas, arrows move the probe, esc clears.

## Data consumed
Bus `decision` (`d.state.edge_bps`, `d.state.imbalance`, `d.conf`) re-centres the book likelihood and tightens it with confidence; bus `tick` nudges the bias; `JEV.S.killed` turns it red.

## Swap in real data
In the `makeModel()` block set `B.tmp` (prior mean), `B.sp` (prior sigma), `B.tml` and `B.tsl` (book mean and sigma; all 0..1 probabilities, edit `dyn()` and `nudge()`) from your own model; the posterior (precision-weighted product) is solved for you every frame.
