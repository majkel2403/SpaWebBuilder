# desk / three-curves

The Bayesian update drawn as three tagged gaussian curves: amber prior, blue book likelihood and a glowing green (red when halted) posterior with a ripple at its peak on every decision. Each curve carries a pill tag with its mean; the tags take separate lanes and glide apart when the means get close so they never collide. A three-column legend lists mean and sigma of each curve. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load `component.html/css/js` and call `JEV.boot()`. Single `.card.dkb-card` with two stacked canvases (`.dkb-cvw`) and the legend (`.dkb-lg`, one `.dkb-lgi` per curve with `--lc` as its colour). Works from ~300px wide.

## Data consumed
Bus `decision` (`d.state.edge_bps`, `d.state.imbalance`, `d.conf`), bus `tick` (`price`, `dp`), `JEV.S.killed`.

## Swap in real data
Edit `makeModel()`: set the prior mean/sigma (`B.tmp`, `B.sp`) and the book likelihood mean/sigma (`B.tml`, `B.tsl`) from your own models, as 0..1 probabilities; the posterior is the precision-weighted product, solved every frame.
