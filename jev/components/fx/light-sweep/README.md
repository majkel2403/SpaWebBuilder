# fx / light-sweep
A skewed highlight band that sweeps once across a heading or any box, on view, on hover or on demand.

A skewed, screen-blended highlight band (`.fx-hsw > i`) translated across its host in 1.1 s, once. `JEV.sweep(el)` creates the band (aria-hidden, pointer-events none) and re-triggers it by toggling `.go`. Works on text (the main page uses it on h2 `<em>` after the letters rise) or any box; round the host with `border-radius` and the band follows. Colours are in the gradient; tint it by editing the rgba stops. No data consumed.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
