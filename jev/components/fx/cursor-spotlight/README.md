# fx / cursor-spotlight
A soft pink light disc that eases after the pointer inside a panel, turning red under the kill switch.

A 640px radial-gradient disc (`#fx-spot`) positioned by transform inside a clipped wrapper. `JEV.task` (visibility gated) eases it toward `JEV.pointer` with `1-exp(-dt*16)` smoothing and toggles `.on` while the pointer is inside the wrapper; geometry is cached on resize/scroll. Only for `(hover:hover) and (pointer:fine)`. For a whole page make the wrap `position:fixed`. Red under `body.killed`. Data: `JEV.pointer`.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
