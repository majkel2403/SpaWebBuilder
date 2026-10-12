# fx / cursor-ring
A custom cursor (ring + dot, mix-blend difference) for fine pointers: the ring eases toward the pointer, snaps toward the centre of the interactive element under it, grows over it and shrinks on press. Elements with class `fx-mag` lean a few px toward the pointer and spring back. Anything with its own CSS cursor (inputs, charts) keeps it.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), inline them with the folder files into one page (see `build-components.mjs` for the order: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last. Needs `<div id="fx-cur"><i class="fx-cr"></i><i class="fx-cd"></i></div>`. Change `MAGNETS` in component.js to pick other magnet buttons.

**Data it consumes:** `JEV.pointer` only; no bus events, nothing to swap. Hidden on touch devices and under reduced motion.
