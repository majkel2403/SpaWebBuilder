# fx / glitch-rgb-split
A 350 ms glitch burst: red/cyan RGB text split, sliced scanline bands, a red vignette flash and section jitter, fired by the kill switch.

A one-shot 350 ms burst: `text-shadow` red/cyan split on all text, six sliced bands (backdrop hue-rotate, screen blend) sliding sideways with steps(), a red vignette flash and a few px of jitter on children marked `.fx-gl-jit`. Add `.fx-glitch` to a `.fx-gl` container (position:relative) and remove it after ~380 ms; `JEV.glitch(el)` does that. In the page it is applied to `<html>` when the kill switch is thrown. Replace the `kill` bus listener with your own trigger (a breached loss cap). Disabled under reduced motion.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
