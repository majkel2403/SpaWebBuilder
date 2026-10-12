# desk/bayes — Bayesian update card

Prior x book likelihood = posterior: three live gaussian densities, odometer readout, precision-weight ring, posterior history strip, probe and draggable means. Simulated.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` (from `jev/src`); inline them with the component's `component.html/css/js` and call `JEV.boot()` (the shared `main.js` does it). `node jev/build-components.mjs --only desk/bayes` builds a standalone `index.html`.

**Data consumed:** bus `decision` (d.state.edge_bps, d.state.imbalance, d.conf), bus `tick` ({price, dp}), `JEV.S.killed`.

**Swap in real data:** set the prior/book means and sigmas (`B.tmp/B.sp/B.tml/B.tsl`) from your own model inside `nudge()` and the posterior is solved for you.
