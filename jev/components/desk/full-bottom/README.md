# desk/full-bottom — Desk bottom row (all three cards)

Bayesian update, activity log and drift vs noise side by side in a 3-column grid, as in the desk section.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` (from `jev/src`); inline them with the component's `component.html/css/js` and call `JEV.boot()` (the shared `main.js` does it). `node jev/build-components.mjs --only desk/full-bottom` builds a standalone `index.html`.

**Data consumed:** all of the above: bus `decision`, `tick`, `kill`, optional `agentstep` / `pulse`.

**Swap in real data:** see the three single-card READMEs.
